import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../data/models/order.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/ui/ui.dart';
import '../cart/widgets/cart_theme.dart';
import '../cart/widgets/pill_buttons.dart';
import '../profile/profile_providers.dart';
import '../worlds/world_theme.dart';
import '../payments/payment_strings.dart';
import 'checkout_strings.dart';
import 'delivery_estimate.dart';

class OrderSuccessScreen extends ConsumerWidget {
  final String orderId;
  const OrderSuccessScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final order = ref.watch(orderDetailProvider(orderId));

    return Scaffold(
      backgroundColor: t.canvas,
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [t.accentSoft, t.canvas, t.canvas],
            stops: const [0, 0.42, 1],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
                  child: Column(
                    children: [
                      const _SuccessBurst(),
                      const SizedBox(height: 24),
                      _FadeUp(
                        delay: 250,
                        child: Column(
                          children: [
                            Text(
                              s.thankYouTitle,
                              textAlign: TextAlign.center,
                              style: AppText.label.copyWith(color: t.accentDark, letterSpacing: 0.4),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              order.valueOrNull?.paymentStatus == 'PAID'
                                  ? s.orderPaidSuccess
                                  : s.orderPlacedSuccess,
                              textAlign: TextAlign.center,
                              style: AppText.display.copyWith(color: t.ink),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      _FadeUp(
                        delay: 400,
                        child: order.when(
                          data: (o) => _OrderNumberCard(number: o.orderNumber),
                          loading: () => const ShimmerBox(height: 76, radius: AppCorners.lg),
                          error: (_, __) => const SizedBox.shrink(),
                        ),
                      ),
                      if (order.valueOrNull case final o?) ...[
                        const SizedBox(height: 12),
                        _FadeUp(delay: 460, child: _OrderRecap(order: o)),
                      ],
                      const SizedBox(height: 16),
                      _FadeUp(
                        delay: 520,
                        child: _NextSteps(s: s, paidByCard: order.valueOrNull?.paymentStatus == 'PAID'),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 8, CartTheme.hPad, 16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    PrimaryPillButton(
                      label: s.trackOrder,
                      icon: Icons.local_shipping_outlined,
                      onTap: () => context.pushReplacement('/orders/$orderId'),
                    ),
                    const SizedBox(height: 10),
                    SecondaryPillButton(
                      label: s.continueShopping,
                      icon: Icons.storefront_outlined,
                      onTap: () => context.go('/'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrderNumberCard extends ConsumerWidget {
  final String number;
  const _OrderNumberCard({required this.number});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 8, 12),
      decoration: CartTheme.cardDecoration(context),
      child: Row(
        children: [
          CartTheme.iconBadge(context, Icons.receipt_long_outlined),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.orderNumberTitle, style: AppText.caption.copyWith(color: t.inkMuted)),
                const SizedBox(height: 2),
                Text(
                  '#$number',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textDirection: TextDirection.ltr,
                  style: AppText.title2.copyWith(color: t.ink, letterSpacing: 0.6),
                ),
              ],
            ),
          ),
          AppIconButton(
            icon: Icons.copy_rounded,
            iconSize: 18,
            tooltip: s.copy,
            color: t.accentDark,
            onTap: () {
              Clipboard.setData(ClipboardData(text: number));
              AppSnackbar.success(context, s.orderNumberCopied);
            },
          ),
        ],
      ),
    );
  }
}

/// ملخص سريع: المنتجات والمجموع، موعد الوصول، النقاط المكتسبة، والهدية.
class _OrderRecap extends ConsumerWidget {
  final AppOrder order;
  const _OrderRecap({required this.order});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final zones = ref.watch(shippingZonesProvider).valueOrNull ?? const [];
    final window = order.deliveryOption == 'PICKUP' ? null : windowFor(zones, order.address?.governorate);
    final thumbs = order.items.map((e) => e.imageUrl).where((u) => u.isNotEmpty).take(4).toList();
    Widget line(IconData icon, String text, {Color? color}) => Padding(
          padding: const EdgeInsets.only(top: 10),
          child: Row(
            children: [
              Icon(icon, size: 17, color: color ?? t.accentDark),
              const SizedBox(width: 8),
              Expanded(child: Text(text, style: AppText.bodySmall.copyWith(color: color ?? t.inkSoft, fontWeight: FontWeight.w600))),
            ],
          ),
        );
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: CartTheme.cardDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              if (thumbs.isNotEmpty) ...[
                SizedBox(
                  width: 40.0 + 26 * (thumbs.length - 1),
                  height: 40,
                  child: Stack(
                    children: [
                      for (var i = 0; i < thumbs.length; i++)
                        PositionedDirectional(
                          start: i * 26.0,
                          child: Container(
                            width: 40,
                            height: 40,
                            padding: const EdgeInsets.all(3),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              border: Border.all(color: t.accentSoft, width: 1.5),
                            ),
                            child: ClipOval(child: ProductCoverImage(url: thumbs[i], fit: BoxFit.contain)),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Text(
                  arProducts(order.items.fold<int>(0, (s, e) => s + e.quantity)),
                  style: AppText.label.copyWith(color: t.inkSoft),
                ),
              ),
              Text(order.totalLabel, style: AppText.title2.copyWith(color: t.ink)),
            ],
          ),
          if (window != null) line(Icons.schedule_rounded, window.label()),
          if (order.deliveryOption == 'PICKUP') line(Icons.storefront_outlined, 'استلام من الفرع — نبلغكِ حين يجهز طلبكِ'),
          if (order.loyaltyEarned > 0)
            line(Icons.stars_rounded, 'أُضيفت ${arPoints(order.loyaltyEarned)} لرصيدكِ ✨', color: const Color(0xFFB7791F)),
          if (order.isGift) line(Icons.card_giftcard_rounded, 'نغلّفه كهدية${order.giftMessage != null ? ' مع رسالتكِ' : ''} 🎁'),
        ],
      ),
    );
  }
}

class _NextSteps extends StatelessWidget {
  final AppStrings s;
  final bool paidByCard;
  const _NextSteps({required this.s, this.paidByCard = false});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final steps = [
      (Icons.support_agent_rounded, s.nextConfirmCall),
      (Icons.inventory_2_outlined, s.nextPrepare),
      paidByCard
          ? (Icons.verified_rounded, s.nextPaidByCard)
          : (Icons.payments_outlined, s.nextPayOnDelivery),
    ];
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: CartTheme.cardDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(s.whatsNextTitle, style: AppText.title3.copyWith(color: t.ink)),
          const SizedBox(height: 12),
          for (var i = 0; i < steps.length; i++) ...[
            if (i > 0) const SizedBox(height: 10),
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(color: t.accentLight, shape: BoxShape.circle),
                  child: Icon(steps[i].$1, size: 17, color: t.accentDark),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(steps[i].$2, style: AppText.bodySmall.copyWith(color: t.inkSoft)),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// علامة نجاح متحركة: حلقات تتّسع + نقاط لامعة تنطلق للخارج — بألوان العالم.
class _SuccessBurst extends StatefulWidget {
  const _SuccessBurst();

  @override
  State<_SuccessBurst> createState() => _SuccessBurstState();
}

class _SuccessBurstState extends State<_SuccessBurst> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400));

  @override
  void initState() {
    super.initState();
    HapticFeedback.mediumImpact();
    _c.forward();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    const size = 168.0;
    return SizedBox(
      width: size,
      height: size,
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, _) {
          final pop = Curves.elasticOut.transform((_c.value / 0.6).clamp(0.0, 1.0));
          final ring = Curves.easeOutCubic.transform(_c.value);
          final sparkle = Curves.easeOutCubic.transform(((_c.value - 0.15) / 0.85).clamp(0.0, 1.0));
          return Stack(
            alignment: Alignment.center,
            children: [
              Opacity(
                opacity: (1 - ring) * 0.6,
                child: Container(
                  width: 96 + 72 * ring,
                  height: 96 + 72 * ring,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: t.accent, width: 2),
                  ),
                ),
              ),
              Container(
                width: 132,
                height: 132,
                decoration: BoxDecoration(shape: BoxShape.circle, color: t.surface.withValues(alpha: 0.6)),
              ),
              for (var i = 0; i < 10; i++)
                Transform.translate(
                  offset: Offset.fromDirection(i * math.pi / 5 - math.pi / 2, 50 + 32 * sparkle),
                  child: Opacity(
                    opacity: sparkle < 0.85 ? sparkle.clamp(0.0, 1.0) : (1 - sparkle) / 0.15,
                    child: Container(
                      width: i.isEven ? 8 : 5,
                      height: i.isEven ? 8 : 5,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: i % 3 == 0 ? AppColors.star : (i.isEven ? t.accent : t.accentDark),
                      ),
                    ),
                  ),
                ),
              Transform.scale(
                scale: pop,
                child: Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    gradient: t.signatureGradient,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: t.accent.withValues(alpha: 0.35), blurRadius: 24, offset: const Offset(0, 10)),
                    ],
                  ),
                  child: const Icon(Icons.check_rounded, color: Colors.white, size: 52),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _FadeUp extends StatelessWidget {
  final int delay;
  final Widget child;
  const _FadeUp({required this.delay, required this.child});

  @override
  Widget build(BuildContext context) {
    final total = delay + 450;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: total),
      builder: (_, v, child) {
        final p = Curves.easeOutCubic.transform(((v * total - delay) / 450).clamp(0.0, 1.0));
        return Opacity(
          opacity: p,
          child: Transform.translate(offset: Offset(0, 14 * (1 - p)), child: child),
        );
      },
      child: child,
    );
  }
}
