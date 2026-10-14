import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/brand/brand_logo.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/order.dart';
import 'card_payment_flow.dart';
import 'payment_strings.dart';

/// هل ينتظر هذا الطلب دفعاً إلكترونياً من الزبونة؟
bool orderAwaitsCardPayment(AppOrder o) =>
    o.paymentMethod == 'CARD' &&
    (o.paymentStatus == 'PENDING' || o.paymentStatus == 'FAILED') &&
    o.status != 'CANCELLED' &&
    o.status != 'REFUNDED';

/// بطاقة "أكملي الدفع" في صفحة الطلب — بتدرّج الهوية.
class PayNowCard extends ConsumerStatefulWidget {
  final AppOrder order;
  const PayNowCard({super.key, required this.order});

  @override
  ConsumerState<PayNowCard> createState() => _PayNowCardState();
}

class _PayNowCardState extends ConsumerState<PayNowCard> {
  bool _busy = false;

  Future<void> _pay() async {
    if (_busy) return;
    HapticFeedback.mediumImpact();
    setState(() => _busy = true);
    try {
      while (mounted) {
        final outcome = await CardPaymentFlow.run(context, ref, widget.order.id);
        if (!mounted) return;
        if (outcome.isPaid) {
          AppSnackbar.success(context, ref.s.paymentSucceeded);
          return;
        }
        final retry = await showPaymentRetrySheet(context, ref.s, outcome);
        if (!retry) return;
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final failed = widget.order.paymentStatus == 'FAILED';
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppCorners.lg),
        gradient: const LinearGradient(
          begin: AlignmentDirectional.topStart,
          end: AlignmentDirectional.bottomEnd,
          colors: [BrandColors.orchid, BrandColors.rose],
        ),
        boxShadow: [
          BoxShadow(
            color: BrandColors.orchid.withValues(alpha: 0.3),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.2),
                ),
                child: Icon(
                  failed ? Icons.credit_card_off_rounded : Icons.credit_card_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      failed ? s.paymentNotCompleted : s.completePaymentTitle,
                      style: AppText.title3.copyWith(color: Colors.white),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      formatPrice(widget.order.total),
                      style: AppText.label.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            s.completePaymentHint,
            style: AppText.caption.copyWith(color: Colors.white.withValues(alpha: 0.85), height: 1.6),
          ),
          const SizedBox(height: 14),
          GestureDetector(
            onTap: _busy ? null : _pay,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              height: 48,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: _busy ? 0.8 : 1),
                borderRadius: BorderRadius.circular(999),
              ),
              child: _busy
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2.2, color: BrandColors.orchid),
                    )
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.lock_rounded, size: 16, color: BrandColors.orchid),
                        const SizedBox(width: 8),
                        Text(
                          failed ? s.tryAgain : s.payNow,
                          style: AppText.label.copyWith(
                            color: BrandColors.orchid,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

/// سطر طريقة الدفع وحالتها في ملخص الطلب.
String paymentLineFor(AppStrings s, AppOrder o) {
  if (o.paymentMethod != 'CARD') return s.cashOnDelivery;
  return switch (o.paymentStatus) {
    'PAID' => s.paidByCard,
    'REFUNDED' => '${s.cardPaymentTitle} • ${s.paymentRefunded}',
    'FAILED' => '${s.cardPaymentTitle} • ${s.paymentFailedShort}',
    _ => '${s.cardPaymentTitle} • ${s.awaitingPayment}',
  };
}
