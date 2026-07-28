import 'package:flutter/material.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/responsive.dart';
import 'checkout_theme.dart';

class CheckoutCouponCard extends StatelessWidget {
  final AppStrings s;
  final TextEditingController controller;
  final String? error;
  final String? appliedCode;
  final VoidCallback onApply;

  const CheckoutCouponCard({
    super.key,
    required this.s,
    required this.controller,
    required this.error,
    required this.appliedCode,
    required this.onApply,
  });

  @override
  Widget build(BuildContext context) {
    final narrow = Responsive.isNarrow(context);
    return Container(
      margin: EdgeInsets.symmetric(horizontal: Responsive.horizontalPadding(context)),
      decoration: CheckoutTheme.cardDecoration(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CheckoutSectionHeader(
            icon: Icons.local_offer_outlined,
            title: s.discountCodeLabel,
          ),
          if (narrow)
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: controller,
                  decoration: CheckoutTheme.fieldDecoration(
                    label: s.enterCode,
                    hint: 'SAVE10',
                    icon: Icons.confirmation_number_outlined,
                  ).copyWith(errorText: error),
                ),
                const SizedBox(height: 10),
                _ApplyCouponButton(s: s, onApply: onApply, fullWidth: true),
              ],
            )
          else
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    decoration: CheckoutTheme.fieldDecoration(
                      label: s.enterCode,
                      hint: 'SAVE10',
                      icon: Icons.confirmation_number_outlined,
                    ).copyWith(errorText: error),
                  ),
                ),
                const SizedBox(width: 10),
                _ApplyCouponButton(s: s, onApply: onApply),
              ],
            ),
          if (appliedCode != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 18),
                const SizedBox(width: 6),
                Text(
                  s.couponAppliedShort(appliedCode!),
                  style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w700, fontSize: 13),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class CheckoutPaymentCard extends StatelessWidget {
  final AppStrings s;
  final String paymentMethod;
  final ValueChanged<String> onChanged;

  const CheckoutPaymentCard({
    super.key,
    required this.s,
    required this.paymentMethod,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: CheckoutTheme.cardDecoration(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CheckoutSectionHeader(
            icon: Icons.payments_outlined,
            title: s.paymentMethod,
          ),
          _Option(
            title: s.cashOnDelivery,
            subtitle: s.codPaymentSubtitle,
            icon: Icons.money_rounded,
            selected: paymentMethod == 'COD',
            onTap: () => onChanged('COD'),
          ),
        ],
      ),
    );
  }
}

class _Option extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _Option({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? CheckoutTheme.brandWash : Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? CheckoutTheme.brand : CheckoutTheme.brandSoft,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: selected ? CheckoutTheme.brandSoft : CheckoutTheme.brandWash,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: CheckoutTheme.brandDark, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: TextStyle(color: CheckoutTheme.charcoal.withValues(alpha: 0.55), fontSize: 12)),
                  ],
                ),
              ),
              Icon(
                selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                color: selected ? CheckoutTheme.brand : CheckoutTheme.charcoal.withValues(alpha: 0.35),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CheckoutLoyaltyCard extends StatelessWidget {
  final AppStrings s;
  final int points;
  final bool useLoyalty;
  final int loyaltyDiscount;
  final bool enabled;
  final ValueChanged<bool> onChanged;

  const CheckoutLoyaltyCard({
    super.key,
    required this.s,
    required this.points,
    required this.useLoyalty,
    required this.loyaltyDiscount,
    this.enabled = true,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: CheckoutTheme.cardDecoration(),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: SwitchListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 8),
        activeThumbColor: CheckoutTheme.brand,
        title: Text(s.loyaltyUseTitle(points), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
        subtitle: Text(
          !enabled
              ? s.loyaltyPointsNeedMore
              : useLoyalty && loyaltyDiscount > 0
                  ? s.loyaltyDiscountHint(formatPrice(loyaltyDiscount), formatPrice(1000))
                  : s.loyaltyPointsRule,
          style: TextStyle(fontSize: 12, color: CheckoutTheme.charcoal.withValues(alpha: 0.55)),
        ),
        value: enabled && useLoyalty,
        onChanged: enabled ? onChanged : null,
      ),
    );
  }
}

class CheckoutNotesCard extends StatelessWidget {
  final AppStrings s;
  final TextEditingController controller;

  const CheckoutNotesCard({super.key, required this.s, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: CheckoutTheme.cardDecoration(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CheckoutSectionHeader(
            icon: Icons.sticky_note_2_outlined,
            title: s.orderNotes,
            subtitle: s.orderNotesHint,
          ),
          TextField(
            controller: controller,
            maxLines: 2,
            decoration: CheckoutTheme.fieldDecoration(
              label: s.notes,
              icon: Icons.edit_note_outlined,
            ),
          ),
        ],
      ),
    );
  }
}

class CheckoutSummaryCard extends StatelessWidget {
  final AppStrings s;
  final int subtotal;
  final int discount;
  final int loyaltyDiscount;
  final int shipping;
  final int total;
  final bool shippingLoading;

  const CheckoutSummaryCard({
    super.key,
    required this.s,
    required this.subtotal,
    required this.discount,
    required this.loyaltyDiscount,
    required this.shipping,
    required this.total,
    required this.shippingLoading,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: CheckoutTheme.cardDecoration(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CheckoutSectionHeader(icon: Icons.receipt_long_outlined, title: s.orderSummary),
          _Row(label: s.subtotal, value: formatPrice(subtotal)),
          if (discount > 0) _Row(label: s.couponDiscount, value: '- ${formatPrice(discount)}', valueColor: AppColors.success),
          if (loyaltyDiscount > 0)
            _Row(label: s.useLoyaltyPoints, value: '- ${formatPrice(loyaltyDiscount)}', valueColor: AppColors.success),
          _Row(
            label: s.shipping,
            value: shippingLoading ? '...' : (shipping == 0 ? s.free : formatPrice(shipping)),
            valueColor: !shippingLoading && shipping == 0 ? AppColors.success : null,
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Divider(height: 1, color: CheckoutTheme.brandSoft),
          ),
          _Row(label: s.total, value: formatPrice(total), bold: true),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool bold;

  const _Row({
    required this.label,
    required this.value,
    this.valueColor,
    this.bold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: bold ? 14 : 13,
              fontWeight: bold ? FontWeight.w800 : FontWeight.w500,
              color: CheckoutTheme.charcoal.withValues(alpha: bold ? 1 : 0.7),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: bold ? 16 : 13,
              fontWeight: FontWeight.w900,
              color: valueColor ?? CheckoutTheme.charcoal,
            ),
          ),
        ],
      ),
    );
  }
}

class CheckoutBottomBar extends StatelessWidget {
  final AppStrings s;
  final int total;
  final bool placing;
  final VoidCallback onPlace;

  const CheckoutBottomBar({
    super.key,
    required this.s,
    required this.total,
    required this.placing,
    required this.onPlace,
  });

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: CheckoutTheme.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
        border: Border(top: BorderSide(color: CheckoutTheme.brandSoft)),
        boxShadow: CheckoutTheme.dockShadow,
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, 12, 16, bottom > 0 ? bottom : 12),
        child: SizedBox(
          height: 54,
          width: double.infinity,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: CheckoutTheme.brandGradient,
              borderRadius: BorderRadius.circular(999),
              boxShadow: [
                BoxShadow(
                  color: CheckoutTheme.brand.withValues(alpha: 0.32),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: placing ? null : onPlace,
                borderRadius: BorderRadius.circular(999),
                child: Center(
                  child: placing
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.4),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              s.confirmOrder,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16),
                            ),
                            const SizedBox(width: 10),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.22),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                formatPrice(total),
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class CheckoutShippingBanner extends StatelessWidget {
  final AppStrings s;
  final String? error;
  final VoidCallback onRetry;

  const CheckoutShippingBanner({
    super.key,
    required this.s,
    required this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    if (error == null) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.sale.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.sale.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.local_shipping_outlined, color: AppColors.sale, size: 18),
          const SizedBox(width: 8),
          Expanded(child: Text(error!, style: const TextStyle(fontSize: 12))),
          TextButton(onPressed: onRetry, child: Text(s.retry)),
        ],
      ),
    );
  }
}

class _ApplyCouponButton extends StatelessWidget {
  final AppStrings s;
  final VoidCallback onApply;
  final bool fullWidth;

  const _ApplyCouponButton({
    required this.s,
    required this.onApply,
    this.fullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    final button = SizedBox(
      height: 48,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: CheckoutTheme.brandGradient,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onApply,
            borderRadius: BorderRadius.circular(14),
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: fullWidth ? 16 : 14),
              child: Center(
                child: Text(
                  s.applyBtn,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
                ),
              ),
            ),
          ),
        ),
      ),
    );

    if (fullWidth) {
      return SizedBox(width: double.infinity, child: button);
    }
    return button;
  }
}
