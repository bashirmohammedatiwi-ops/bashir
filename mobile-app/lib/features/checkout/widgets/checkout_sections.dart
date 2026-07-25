import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import 'checkout_theme.dart';

class CheckoutCouponCard extends StatelessWidget {
  final TextEditingController controller;
  final String? error;
  final String? appliedCode;
  final VoidCallback onApply;

  const CheckoutCouponCard({
    super.key,
    required this.controller,
    required this.error,
    required this.appliedCode,
    required this.onApply,
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
          const CheckoutSectionHeader(
            icon: Icons.local_offer_outlined,
            title: 'كود الخصم',
          ),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  decoration: CheckoutTheme.fieldDecoration(
                    label: 'أدخل الكود',
                    hint: 'SAVE10',
                    icon: Icons.confirmation_number_outlined,
                  ).copyWith(errorText: error),
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                height: 52,
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
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 18),
                        child: Center(
                          child: Text(
                            'تطبيق',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          if (appliedCode != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 18),
                const SizedBox(width: 6),
                Text(
                  'تم تطبيق $appliedCode',
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
  final String paymentMethod;
  final ValueChanged<String> onChanged;

  const CheckoutPaymentCard({
    super.key,
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
          const CheckoutSectionHeader(
            icon: Icons.payments_outlined,
            title: 'طريقة الدفع',
          ),
          _Option(
            title: 'الدفع عند الاستلام',
            subtitle: 'ادفع نقداً عند استلام الطلب',
            icon: Icons.money_rounded,
            selected: paymentMethod == 'COD',
            onTap: () => onChanged('COD'),
          ),
          const SizedBox(height: 10),
          _Option(
            title: 'بطاقة ائتمان / مدى',
            subtitle: 'قريباً — سيتم تفعيل الدفع الإلكتروني',
            icon: Icons.credit_card_rounded,
            selected: false,
            enabled: false,
            badge: 'قريباً',
            onTap: () {},
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
  final bool enabled;
  final String? badge;
  final VoidCallback onTap;

  const _Option({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.selected,
    required this.onTap,
    this.enabled = true,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.55,
      child: Material(
        color: selected ? CheckoutTheme.brandWash : Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: enabled ? onTap : null,
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
                if (badge != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(badge!, style: const TextStyle(color: AppColors.warning, fontSize: 11, fontWeight: FontWeight.w800)),
                  )
                else
                  Icon(
                    selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                    color: selected ? CheckoutTheme.brand : CheckoutTheme.charcoal.withValues(alpha: 0.35),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class CheckoutLoyaltyCard extends StatelessWidget {
  final int points;
  final bool useLoyalty;
  final int loyaltyDiscount;
  final ValueChanged<bool> onChanged;

  const CheckoutLoyaltyCard({
    super.key,
    required this.points,
    required this.useLoyalty,
    required this.loyaltyDiscount,
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
        title: Text('استخدم $points نقطة ولاء', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
        subtitle: Text(
          useLoyalty && loyaltyDiscount > 0
              ? 'خصم ${formatPrice(loyaltyDiscount)} (100 نقطة = ${formatPrice(1000)})'
              : '100 نقطة = ${formatPrice(1000)}',
          style: TextStyle(fontSize: 12, color: CheckoutTheme.charcoal.withValues(alpha: 0.55)),
        ),
        value: useLoyalty,
        onChanged: onChanged,
      ),
    );
  }
}

class CheckoutNotesCard extends StatelessWidget {
  final TextEditingController controller;

  const CheckoutNotesCard({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: CheckoutTheme.cardDecoration(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const CheckoutSectionHeader(
            icon: Icons.sticky_note_2_outlined,
            title: 'ملاحظات الطلب',
            subtitle: 'تعليمات إضافية للتوصيل (اختياري)',
          ),
          TextField(
            controller: controller,
            maxLines: 2,
            decoration: CheckoutTheme.fieldDecoration(
              label: 'ملاحظات',
              icon: Icons.edit_note_outlined,
            ),
          ),
        ],
      ),
    );
  }
}

class CheckoutSummaryCard extends StatelessWidget {
  final int subtotal;
  final int discount;
  final int loyaltyDiscount;
  final int shipping;
  final int total;
  final bool shippingLoading;

  const CheckoutSummaryCard({
    super.key,
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
          const CheckoutSectionHeader(icon: Icons.receipt_long_outlined, title: 'ملخّص الطلب'),
          _Row(label: 'المجموع الفرعي', value: formatPrice(subtotal)),
          if (discount > 0) _Row(label: 'خصم الكوبون', value: '- ${formatPrice(discount)}', valueColor: AppColors.success),
          if (loyaltyDiscount > 0)
            _Row(label: 'نقاط الولاء', value: '- ${formatPrice(loyaltyDiscount)}', valueColor: AppColors.success),
          _Row(
            label: 'الشحن',
            value: shippingLoading ? '...' : (shipping == 0 ? 'مجاني' : formatPrice(shipping)),
            valueColor: !shippingLoading && shipping == 0 ? AppColors.success : null,
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Divider(height: 1, color: CheckoutTheme.brandSoft),
          ),
          _Row(label: 'الإجمالي', value: formatPrice(total), bold: true),
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
  final int total;
  final bool placing;
  final VoidCallback onPlace;

  const CheckoutBottomBar({
    super.key,
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
                            const Text(
                              'تأكيد الطلب',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16),
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
  final String? error;
  final VoidCallback onRetry;

  const CheckoutShippingBanner({super.key, required this.error, required this.onRetry});

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
          TextButton(onPressed: onRetry, child: const Text('إعادة')),
        ],
      ),
    );
  }
}
