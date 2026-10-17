import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/brand/brand_logo.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/payment.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../profile/profile_providers.dart';
import 'payment_strings.dart';
import 'qi_payment_sdk.dart';

/// طرق الدفع المتاحة للزبونة الحالية (من السيرفر). عند أي خطأ: الدفع عند الاستلام فقط.
final paymentMethodsProvider = FutureProvider.autoDispose<PaymentMethodsConfig>((ref) async {
  ref.watch(authProvider.select((a) => a.user?.id));
  try {
    final config = await ref.read(apiServiceProvider).getPaymentMethods();
    if (!QiPaymentSdk.isSupported) {
      return PaymentMethodsConfig(cod: config.cod, sandbox: config.sandbox);
    }
    return config;
  } catch (_) {
    return PaymentMethodsConfig.fallback;
  }
});

enum CardPaymentResult { paid, failed, cancelled, pending, error }

class CardPaymentOutcome {
  final CardPaymentResult result;
  final String? message;
  const CardPaymentOutcome(this.result, [this.message]);
  bool get isPaid => result == CardPaymentResult.paid;
}

/// رحلة الدفع بالبطاقة لطلب موجود:
/// السيرفر ينشئ المحاولة ← واجهة كي كارد الأصلية ← السيرفر يؤكد من البوابة.
class CardPaymentFlow {
  CardPaymentFlow._();

  static bool _running = false;

  static Future<CardPaymentOutcome> run(
    BuildContext context,
    WidgetRef ref,
    String orderId,
  ) async {
    if (_running) return const CardPaymentOutcome(CardPaymentResult.pending);
    _running = true;
    final s = ref.read(stringsProvider);
    final api = ref.read(apiServiceProvider);
    final nav = Navigator.of(context, rootNavigator: true);
    final user = ref.read(authProvider).user;
    var overlayOpen = false;

    void showOverlay(String title, String hint) {
      overlayOpen = true;
      unawaited(
        showGeneralDialog<void>(
          context: context,
          useRootNavigator: true,
          barrierDismissible: false,
          barrierColor: Colors.black.withValues(alpha: 0.35),
          transitionDuration: const Duration(milliseconds: 260),
          pageBuilder: (_, __, ___) => PopScope(
            canPop: false,
            child: _SecureOverlay(title: title, hint: hint),
          ),
          transitionBuilder: (_, a, __, child) => FadeTransition(
            opacity: CurvedAnimation(parent: a, curve: Curves.easeOut),
            child: ScaleTransition(
              scale: Tween(begin: 0.96, end: 1.0).animate(
                CurvedAnimation(parent: a, curve: Curves.easeOutCubic),
              ),
              child: child,
            ),
          ),
        ),
      );
    }

    void hideOverlay() {
      if (!overlayOpen) return;
      overlayOpen = false;
      if (nav.canPop()) nav.pop();
    }

    try {
      final methods = await ref.read(paymentMethodsProvider.future);
      final sdk = methods.sdk;
      if (!methods.cardEnabled || sdk == null || !QiPaymentSdk.isSupported) {
        return CardPaymentOutcome(CardPaymentResult.error, s.paymentUnavailable);
      }

      showOverlay(s.preparingPayment, s.preparingPaymentHint);
      final started = DateTime.now();
      final session = await api.startCardPayment(orderId);
      if (session.alreadyPaid) {
        hideOverlay();
        return const CardPaymentOutcome(CardPaymentResult.paid);
      }
      await QiPaymentSdk.initialize(sdk, arabic: s.isAr);
      // لا نومض الشاشة: نترك لحظة لتُقرأ رسالة الأمان.
      final shown = DateTime.now().difference(started);
      if (shown < const Duration(milliseconds: 700)) {
        await Future<void>.delayed(const Duration(milliseconds: 700) - shown);
      }
      hideOverlay();

      final sdkOutcome = await QiPaymentSdk.pay(session, holderName: user?.name);

      if (sdkOutcome.status == QiSdkStatus.cancelled) {
        unawaited(api.abandonCardPayment(orderId, transactionId: session.transactionId).catchError(
              (_) => OrderPaymentState(orderId: orderId, paymentStatus: 'PENDING'),
            ));
        return CardPaymentOutcome(CardPaymentResult.cancelled, s.paymentCancelled);
      }

      if (context.mounted) showOverlay(s.verifyingPayment, s.verifyingPaymentHint);
      final state = await _confirm(api, orderId, expectSuccess: sdkOutcome.status == QiSdkStatus.success);
      hideOverlay();

      if (state.isPaid) {
        HapticFeedback.mediumImpact();
        return const CardPaymentOutcome(CardPaymentResult.paid);
      }
      if (state.attemptFailed || sdkOutcome.status == QiSdkStatus.error) {
        // واجهة الدفع انتهت بخطأ والمحاولة لم تُدفع: نغلقها لدى البوابة (السيرفر يتحقق أولاً
        // ولا يلغي إلا محاولة ما زالت مفتوحة) — لا تبقى معلّقة حتى انتهاء المهلة.
        if (sdkOutcome.status == QiSdkStatus.error) {
          unawaited(api.abandonCardPayment(orderId, transactionId: session.transactionId).catchError(
                (_) => OrderPaymentState(orderId: orderId, paymentStatus: 'PENDING'),
              ));
        }
        return CardPaymentOutcome(CardPaymentResult.failed, s.paymentFailedHint);
      }
      return CardPaymentOutcome(CardPaymentResult.pending, s.paymentPendingHint);
    } catch (e) {
      hideOverlay();
      return CardPaymentOutcome(CardPaymentResult.error, friendlyError(e));
    } finally {
      _running = false;
      ref.invalidate(orderDetailProvider(orderId));
      ref.invalidate(ordersProvider);
    }
  }

  /// نسأل السيرفر (الذي يسأل البوابة) حتى تستقر النتيجة — بحد أقصى ~10 ثوانٍ.
  static Future<OrderPaymentState> _confirm(
    ApiService api,
    String orderId, {
    required bool expectSuccess,
  }) async {
    var state = await api.confirmCardPayment(orderId);
    final attempts = expectSuccess ? 6 : 2;
    for (var i = 0; i < attempts && !state.isPaid && !state.attemptFailed; i++) {
      await Future<void>.delayed(Duration(milliseconds: 900 + i * 300));
      state = await api.confirmCardPayment(orderId);
    }
    return state;
  }
}

/// نافذة "دفع آمن": شعار الهوية بنبض هادئ داخل حلقة دوّارة.
class _SecureOverlay extends StatefulWidget {
  final String title;
  final String hint;
  const _SecureOverlay({required this.title, required this.hint});

  @override
  State<_SecureOverlay> createState() => _SecureOverlayState();
}

class _SecureOverlayState extends State<_SecureOverlay> with SingleTickerProviderStateMixin {
  late final AnimationController _spin = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  )..repeat();

  @override
  void dispose() {
    _spin.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: 300,
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: BrandColors.orchid.withValues(alpha: 0.22),
                blurRadius: 40,
                offset: const Offset(0, 18),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 88,
                height: 88,
                child: AnimatedBuilder(
                  animation: _spin,
                  builder: (_, child) => CustomPaint(
                    painter: _RingPainter(_spin.value),
                    child: child,
                  ),
                  child: const Center(child: BrandMark(height: 36)),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                widget.title,
                textAlign: TextAlign.center,
                style: AppText.title3.copyWith(color: BrandColors.ink),
              ),
              const SizedBox(height: 8),
              Text(
                widget.hint,
                textAlign: TextAlign.center,
                style: AppText.caption.copyWith(color: BrandColors.ink.withValues(alpha: 0.6), height: 1.6),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.lock_rounded, size: 14, color: BrandColors.orchid.withValues(alpha: 0.8)),
                  const SizedBox(width: 6),
                  Text(
                    '3D Secure • PCI DSS',
                    textDirection: TextDirection.ltr,
                    style: AppText.micro.copyWith(
                      color: BrandColors.ink.withValues(alpha: 0.55),
                      letterSpacing: 0.8,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double t;
  _RingPainter(this.t);

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final r = rect.deflate(3);
    canvas.drawArc(
      r,
      0,
      math.pi * 2,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3
        ..color = BrandColors.orchid.withValues(alpha: 0.1),
    );
    final start = t * math.pi * 2;
    canvas.drawArc(
      r,
      start,
      math.pi * 0.75,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3
        ..strokeCap = StrokeCap.round
        ..shader = SweepGradient(
          startAngle: start,
          endAngle: start + math.pi * 0.75,
          colors: const [BrandColors.orchidLight, BrandColors.rose],
          transform: GradientRotation(start),
        ).createShader(r),
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.t != t;
}

/// ورقة نتيجة لدفعة لم تكتمل — مع إعادة المحاولة.
Future<bool> showPaymentRetrySheet(BuildContext context, AppStrings s, CardPaymentOutcome outcome) async {
  final retry = await showModalBottomSheet<bool>(
    context: context,
    useRootNavigator: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      final cancelled = outcome.result == CardPaymentResult.cancelled;
      final pending = outcome.result == CardPaymentResult.pending;
      return SafeArea(
        child: Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.fromLTRB(22, 24, 22, 18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: (pending ? BrandColors.orchid : BrandColors.rose).withValues(alpha: 0.1),
                ),
                child: Icon(
                  pending
                      ? Icons.hourglass_top_rounded
                      : cancelled
                          ? Icons.credit_card_off_rounded
                          : Icons.error_outline_rounded,
                  color: pending ? BrandColors.orchid : BrandColors.rose,
                  size: 28,
                ),
              ),
              const SizedBox(height: 14),
              Text(
                pending ? s.verifyingPayment : s.paymentNotCompleted,
                style: AppText.title2.copyWith(color: BrandColors.ink),
              ),
              const SizedBox(height: 8),
              Text(
                outcome.message ?? s.paymentFailedHint,
                textAlign: TextAlign.center,
                style: AppText.bodySmall.copyWith(color: BrandColors.ink.withValues(alpha: 0.65), height: 1.6),
              ),
              const SizedBox(height: 20),
              if (!pending)
                _SheetButton(
                  label: s.tryAgain,
                  filled: true,
                  onTap: () => Navigator.of(ctx).pop(true),
                ),
              const SizedBox(height: 8),
              _SheetButton(
                label: pending ? s.gotIt : s.payLater,
                filled: pending,
                onTap: () => Navigator.of(ctx).pop(false),
              ),
            ],
          ),
        ),
      );
    },
  );
  return retry == true;
}

class _SheetButton extends StatelessWidget {
  final String label;
  final bool filled;
  final VoidCallback onTap;
  const _SheetButton({required this.label, required this.filled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        height: 50,
        width: double.infinity,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          gradient: filled
              ? const LinearGradient(colors: [BrandColors.orchid, BrandColors.rose])
              : null,
          color: filled ? null : BrandColors.orchid.withValues(alpha: 0.07),
        ),
        child: Text(
          label,
          style: AppText.label.copyWith(
            color: filled ? Colors.white : BrandColors.orchid,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}
