import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../auth/auth_provider.dart';
import '../../worlds/world_theme.dart';
import 'cart_theme.dart';
import 'pill_buttons.dart';

/// ملخص الطلب داخل الصفحة: التفصيل كاملاً بهدوء، بعيداً عن الشريط السفلي.
class CartSummaryCard extends ConsumerWidget {
  final int subtotal;
  final int discount;
  final int total;
  final int itemCount;
  final int freeShippingThreshold;
  final bool freeShipping;

  const CartSummaryCard({
    super.key,
    required this.subtotal,
    required this.discount,
    required this.total,
    required this.itemCount,
    required this.freeShippingThreshold,
    required this.freeShipping,
  });

  bool get _freeDelivery => freeShipping || (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final ar = s.isAr;
    final points = ref.watch(authProvider.select((a) => a.isAuthenticated)) ? total ~/ 1000 : 0;

    return Container(
      margin: const EdgeInsets.fromLTRB(CartTheme.hPad, 16, CartTheme.hPad, 0),
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      decoration: CartTheme.cardDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              CartTheme.iconBadge(context, Icons.receipt_long_outlined, size: 34),
              const SizedBox(width: 10),
              Text(ar ? 'ملخص الطلب' : 'Order summary', style: AppText.title3.copyWith(color: t.ink)),
            ],
          ),
          const SizedBox(height: 12),
          _Row(label: s.subtotalItems(itemCount), value: formatPrice(subtotal)),
          if (discount > 0) ...[
            const SizedBox(height: 8),
            _Row(label: s.couponDiscount, value: '- ${formatPrice(discount)}', valueColor: AppColors.success),
          ],
          const SizedBox(height: 8),
          _Row(
            label: s.shipping,
            value: _freeDelivery ? s.freeDelivery : s.shippingByDeliveryArea,
            valueColor: _freeDelivery ? AppColors.success : null,
            muted: !_freeDelivery,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1, thickness: 1, color: t.divider),
          ),
          Row(
            children: [
              Expanded(child: Text(s.totalLabel, style: AppText.label.copyWith(color: t.ink, fontWeight: FontWeight.w800))),
              Text(formatPrice(total), style: AppText.title2.copyWith(color: t.accentDark)),
            ],
          ),
          if (discount > 0 || points > 0) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (discount > 0)
                  _Perk(
                    icon: Icons.savings_outlined,
                    label: ar ? 'وفّرتِ ${formatPrice(discount)}' : 'You save ${formatPrice(discount)}',
                    color: AppColors.success,
                  ),
                if (points > 0)
                  _Perk(
                    icon: Icons.stars_rounded,
                    label: ar ? 'ستكسبين $points نقطة' : "You'll earn $points points",
                    color: t.accentDark,
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _Perk extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _Perk({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(8, 5, 10, 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(AppCorners.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 5),
          Text(label, style: AppText.micro.copyWith(color: color, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

/// شريط الدفع الثابت — رشيق: الإجمالي وزر الإتمام فقط.
class CartCheckoutBar extends ConsumerWidget {
  final int total;
  final int itemCount;

  const CartCheckoutBar({super.key, required this.total, required this.itemCount});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(CartTheme.radiusXl)),
        border: Border(top: BorderSide(color: t.accentSoft)),
        boxShadow: CartTheme.dockShadow(context),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 12, CartTheme.hPad, 12),
          child: Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(s.subtotalItems(itemCount), style: AppText.micro.copyWith(color: t.inkMuted)),
                  const SizedBox(height: 2),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: Text(
                      formatPrice(total),
                      key: ValueKey(total),
                      style: AppText.title2.copyWith(color: t.ink),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),
              Expanded(
                child: PrimaryPillButton(
                  label: s.checkoutBtn,
                  trailingIcon: Icons.arrow_forward_rounded,
                  strongHaptic: true,
                  onTap: () {
                    if (!ref.read(authProvider).isAuthenticated) {
                      context.push('/login');
                      return;
                    }
                    context.push('/checkout');
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool muted;

  const _Row({required this.label, required this.value, this.valueColor, this.muted = false});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppText.caption.copyWith(color: t.inkSoft),
          ),
        ),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.end,
            style: AppText.caption.copyWith(
              fontWeight: muted ? FontWeight.w500 : FontWeight.w700,
              color: valueColor ?? (muted ? t.inkMuted : t.ink),
            ),
          ),
        ),
      ],
    );
  }
}
