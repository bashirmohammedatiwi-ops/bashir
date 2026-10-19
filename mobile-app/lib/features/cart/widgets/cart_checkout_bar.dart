import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../auth/auth_provider.dart';
import '../../catalog/catalog_providers.dart';
import '../../worlds/world_theme.dart';
import '../cart_strings.dart';
import 'cart_theme.dart';
import 'pill_buttons.dart';

/// ملخص الطلب داخل الصفحة: التفصيل كاملاً بهدوء، بعيداً عن الشريط السفلي.
class CartSummaryCard extends ConsumerWidget {
  /// المجموع الفرعي بأسعار العروض (أساس حد التوصيل المجاني).
  final int subtotal;
  final int discount;
  final int packageSaving;

  /// توفير العروض (السعر الأصلي − سعر العرض) — يُعرض المجموع قبله ثم يُطرح.
  final int saleSaving;
  final int total;
  final int itemCount;
  final int freeShippingThreshold;
  final bool freeShipping;

  const CartSummaryCard({
    super.key,
    required this.subtotal,
    required this.discount,
    this.packageSaving = 0,
    this.saleSaving = 0,
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
    final lang = s.lang;
    final points = ref.watch(authProvider.select((a) => a.isAuthenticated))
        ? ref.watch(loyaltyRulesProvider).pointsFor(total)
        : 0;
    final saved = saleSaving + discount + packageSaving;

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
              Expanded(
                child: Text(s.cartOrderSummary, style: AppText.title3.copyWith(color: t.ink)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _Row(
            label: s.subtotalItems(itemCount),
            value: formatPrice(subtotal + saleSaving, lang: lang),
          ),
          if (saleSaving > 0) ...[
            const SizedBox(height: 8),
            _Row(
              label: s.cartOfferSavings,
              value: '- ${formatPrice(saleSaving, lang: lang)}',
              valueColor: AppColors.success,
            ),
          ],
          if (packageSaving > 0) ...[
            const SizedBox(height: 8),
            _Row(
              label: s.cartBundleSavings,
              value: '- ${formatPrice(packageSaving, lang: lang)}',
              valueColor: AppColors.success,
            ),
          ],
          if (discount > 0) ...[
            const SizedBox(height: 8),
            _Row(
              label: s.couponDiscount,
              value: '- ${formatPrice(discount, lang: lang)}',
              valueColor: AppColors.success,
            ),
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
              Expanded(
                child: Text(
                  s.cartEstimatedTotal,
                  style: AppText.label.copyWith(color: t.ink, fontWeight: FontWeight.w800),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                formatPrice(total, lang: lang),
                style: AppText.title2.copyWith(color: t.accentDark),
              ),
            ],
          ),
          if (saved > 0 || points > 0) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (saved > 0)
                  _Perk(
                    icon: Icons.savings_outlined,
                    label: s.youSaved(formatPrice(saved, lang: lang)),
                    color: AppColors.success,
                  ),
                if (points > 0)
                  _Perk(icon: Icons.stars_rounded, label: s.cartWillEarnPoints(points), color: t.accentDark),
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
          Flexible(
            child: Text(
              label,
              style: AppText.micro.copyWith(color: color, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }
}

/// شريط الدفع الثابت — رشيق: الإجمالي التقديري وزر الإتمام فقط.
class CartCheckoutBar extends ConsumerWidget {
  final int total;
  final int itemCount;

  /// المجموع قبل كل الخصومات (العروض والباقات والكوبون) — يُشطب بجانب الإجمالي إن زاد عنه.
  final int? compareAt;

  /// في السلة ما لم يعد متوفراً: الإتمام ينتظر إزالته (السيرفر يرفض الطلب وإلا).
  final bool blocked;

  const CartCheckoutBar({
    super.key,
    required this.total,
    required this.itemCount,
    this.compareAt,
    this.blocked = false,
  });

  /// الارتفاع التقريبي فوق شريط التنقل — لرفع الإشعارات العائمة فوقه.
  static const double height = 76;

  Future<void> _checkout(BuildContext context, WidgetRef ref) async {
    if (blocked) {
      AppSnackbar.show(context, ref.read(stringsProvider).cartRemoveUnavailable);
      return;
    }
    if (!ref.read(authProvider).isAuthenticated) {
      // بعد الدخول (أو التسجيل) نكمل للدفع مباشرة بدل إعادتها للسلة.
      await context.push('/login');
      if (!context.mounted || !ref.read(authProvider).isAuthenticated) return;
    }
    context.push('/checkout');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final was = compareAt;
    final showWas = was != null && was > total;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(CartTheme.radiusXl)),
        border: Border(top: BorderSide(color: t.accentSoft)),
        boxShadow: CartTheme.dockShadow(context),
      ),
      // المنطقة الآمنة السفلية يحسبها شريط التنقل تحتنا — لا نضيفها مرتين.
      child: SafeArea(
        top: false,
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 12, CartTheme.hPad, 12),
          child: Row(
            children: [
              // يتقلّص النص ولا يزيح زر الإتمام (المقاس الكبير للخط ومبالغ الملايين).
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: AlignmentDirectional.centerStart,
                      child: Text(
                        s.cartBarTotal(itemCount),
                        maxLines: 1,
                        style: AppText.micro.copyWith(color: t.inkMuted),
                      ),
                    ),
                    const SizedBox(height: 2),
                    AnimatedSwitcher(
                      duration: MediaQuery.disableAnimationsOf(context)
                          ? Duration.zero
                          : const Duration(milliseconds: 200),
                      child: FittedBox(
                        key: ValueKey(total),
                        fit: BoxFit.scaleDown,
                        alignment: AlignmentDirectional.centerStart,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              formatPrice(total, lang: s.lang),
                              style: AppText.title2.copyWith(color: t.ink),
                            ),
                            if (showWas) ...[
                              const SizedBox(width: 6),
                              Text(
                                formatPrice(was, lang: s.lang),
                                semanticsLabel: s.cartBeforeDiscounts(formatPrice(was, lang: s.lang)),
                                style: AppText.micro.copyWith(
                                  color: t.inkMuted,
                                  decoration: TextDecoration.lineThrough,
                                  decorationColor: t.inkMuted,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: PrimaryPillButton(
                  label: s.checkoutBtn,
                  trailingIcon: Icons.arrow_forward_rounded,
                  strongHaptic: true,
                  onTap: () => _checkout(context, ref),
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
