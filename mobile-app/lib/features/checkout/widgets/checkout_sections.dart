import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/cart_item.dart';
import '../../../data/models/coupon.dart';
import '../../../data/models/loyalty_rules.dart';
import '../../cart/cart_strings.dart';
import '../../cart/widgets/cart_coupon.dart';
import '../../cart/widgets/cart_theme.dart';
import '../../cart/widgets/pill_buttons.dart';
import '../../worlds/world_theme.dart';
import '../../payments/payment_strings.dart';
import '../checkout_strings.dart';
import 'checkout_theme.dart';

const _cardMargin = EdgeInsets.symmetric(horizontal: CartTheme.hPad);
const _cardPadding = EdgeInsets.all(16);

/// كود الخصم في الدفع — نفس قسم السلة (تذاكر الكوبونات، الإزالة، حالة التحميل)
/// داخل بطاقة إتمام الطلب، فلا تختلف الشاشتان في السلوك.
class CheckoutCouponCard extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String? error;
  final bool loading;
  final Coupon? applied;
  final int discount;

  /// أساس الكوبون: المجموع بعد توفير الباقات (نفس قاعدة السيرفر).
  final int couponBase;
  final VoidCallback onApply;
  final VoidCallback onRemove;

  const CheckoutCouponCard({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.error,
    required this.loading,
    required this.applied,
    required this.discount,
    required this.couponBase,
    required this.onApply,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: _cardMargin,
      decoration: CheckoutTheme.cardDecoration(
        context,
        color: applied != null
            ? Color.alphaBlend(AppColors.success.withValues(alpha: 0.05), context.worldTheme.surface)
            : null,
      ),
      padding: const EdgeInsets.all(12),
      child: CartCouponSection(
        controller: controller,
        focusNode: focusNode,
        error: error,
        loading: loading,
        applied: applied,
        discount: discount,
        onApply: onApply,
        onRemove: onRemove,
        subtotal: couponBase,
      ),
    );
  }
}

class CheckoutPaymentCard extends StatelessWidget {
  final AppStrings s;
  final String paymentMethod;
  final ValueChanged<String> onChanged;
  final bool cardEnabled;
  final bool sandbox;

  /// الطلب مغطّى بالكامل (نقاط/كوبون): البطاقة معطّلة مع هذا التوضيح.
  final String? cardCoveredHint;

  const CheckoutPaymentCard({
    super.key,
    required this.s,
    required this.paymentMethod,
    required this.onChanged,
    this.cardEnabled = false,
    this.sandbox = false,
    this.cardCoveredHint,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: _cardMargin,
      decoration: CheckoutTheme.cardDecoration(context),
      padding: _cardPadding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CheckoutSectionHeader(icon: Icons.payments_outlined, title: s.paymentMethod, step: 2),
          _Option(
            title: s.cashOnDelivery,
            subtitle: s.codPaymentSubtitle,
            icon: Icons.payments_rounded,
            selected: paymentMethod == 'COD',
            onTap: () => onChanged('COD'),
          ),
          const SizedBox(height: 10),
          if (cardEnabled && cardCoveredHint != null)
            _Option(
              title: s.cardPaymentTitle,
              subtitle: cardCoveredHint!,
              icon: Icons.credit_card_rounded,
              selected: false,
              onTap: null,
            )
          else if (cardEnabled)
            _Option(
              title: s.cardPaymentTitle,
              subtitle: s.cardPaymentSubtitle,
              icon: Icons.credit_card_rounded,
              selected: paymentMethod == 'CARD',
              badge: sandbox ? s.sandboxBadge : null,
              onTap: () => onChanged('CARD'),
              footer: const _CardNetworks(),
              expanded: _SecureCardNote(text: s.cardSecureNote),
            )
          else
            _Option(
              title: s.cardPayment,
              subtitle: s.cardPaymentSoon,
              icon: Icons.credit_card_rounded,
              selected: false,
              badge: s.cardComingSoon,
              onTap: null,
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
  final String? badge;
  final VoidCallback? onTap;

  /// يظهر دائماً تحت الوصف (مثل شبكات البطاقات المقبولة).
  final Widget? footer;

  /// يتمدد أسفل الخيار عند اختياره فقط.
  final Widget? expanded;

  const _Option({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.selected,
    required this.onTap,
    this.badge,
    this.footer,
    this.expanded,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final disabled = onTap == null;
    return Semantics(
      button: !disabled,
      selected: selected,
      enabled: !disabled,
      child: Opacity(
        opacity: disabled ? 0.55 : 1,
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(AppCorners.md),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(AppCorners.md),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: selected ? t.accentLight : t.surface,
                borderRadius: BorderRadius.circular(AppCorners.md),
                border: Border.all(color: selected ? t.accent : t.hairline, width: selected ? 1.5 : 1),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      CartTheme.iconBadge(context, icon, color: disabled ? t.inkMuted : null),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppText.label.copyWith(color: t.ink),
                                  ),
                                ),
                                if (badge != null) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: t.accentSoft,
                                      borderRadius: BorderRadius.circular(AppCorners.pill),
                                    ),
                                    child: Text(badge!, style: AppText.micro.copyWith(color: t.accentDark)),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              subtitle,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.caption.copyWith(color: t.inkMuted),
                            ),
                            if (footer != null) ...[const SizedBox(height: 8), footer!],
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 200),
                        transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
                        child: Icon(
                          selected ? Icons.check_circle_rounded : Icons.radio_button_off_rounded,
                          key: ValueKey(selected),
                          color: selected ? t.accent : t.inkMuted.withValues(alpha: 0.6),
                          size: 24,
                        ),
                      ),
                    ],
                  ),
                  if (expanded != null)
                    AnimatedSize(
                      duration: const Duration(milliseconds: 260),
                      curve: Curves.easeOutCubic,
                      alignment: Alignment.topCenter,
                      child: selected
                          ? Padding(padding: const EdgeInsets.only(top: 12), child: expanded)
                          : const SizedBox(width: double.infinity),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// شبكات البطاقات المقبولة — شارات نصية أنيقة.
class _CardNetworks extends StatelessWidget {
  const _CardNetworks();

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    Widget chip(String label, {Color? color}) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: t.hairline),
      ),
      child: Text(
        label,
        textDirection: TextDirection.ltr,
        style: AppText.micro.copyWith(color: color ?? t.inkSoft, fontWeight: FontWeight.w800, letterSpacing: 0.4),
      ),
    );
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        chip('Qi Card', color: const Color(0xFFB8860B)),
        chip('Mastercard', color: const Color(0xFFEB5D20)),
        chip('VISA', color: const Color(0xFF1A1F71)),
      ],
    );
  }
}

/// ملاحظة الأمان عند اختيار البطاقة.
class _SecureCardNote extends StatelessWidget {
  final String text;
  const _SecureCardNote({required this.text});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: t.surface.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(AppCorners.sm),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.lock_rounded, size: 16, color: t.accentDark),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: AppText.caption.copyWith(color: t.inkSoft, height: 1.6)),
          ),
        ],
      ),
    );
  }
}

class CheckoutLoyaltyCard extends StatelessWidget {
  final AppStrings s;

  /// النقاط في العنوان: ما سيُستخدم فعلاً حين يكون مفعّلاً، وإلا الرصيد كله.
  final int points;
  final bool useLoyalty;
  final int loyaltyDiscount;
  final bool enabled;
  final ValueChanged<bool> onChanged;
  final LoyaltyRules rules;

  /// سبب التعطيل حين يكفي الرصيد لكن قيمة الطلب لا تسمح (وإلا «تحتاجين X نقطة»).
  final String? disabledHint;

  const CheckoutLoyaltyCard({
    super.key,
    required this.s,
    required this.points,
    required this.useLoyalty,
    required this.loyaltyDiscount,
    this.enabled = true,
    required this.onChanged,
    this.rules = const LoyaltyRules(),
    this.disabledHint,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final on = enabled && useLoyalty;
    return Container(
      margin: _cardMargin,
      decoration: CheckoutTheme.cardDecoration(context, selected: on),
      padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 8, 12),
      child: Row(
        children: [
          CartTheme.iconBadge(context, Icons.stars_rounded, color: AppColors.star),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  s.loyaltyUseTitle(points),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.label.copyWith(color: t.ink),
                ),
                const SizedBox(height: 2),
                Text(
                  !enabled
                      ? (disabledHint ?? s.loyaltyPointsNeedMore(rules.redeemStep))
                      : useLoyalty && loyaltyDiscount > 0
                      ? s.loyaltyDiscountHint(formatPrice(loyaltyDiscount, lang: s.lang))
                      : s.loyaltyPointsRule(formatPrice(rules.pointValue, lang: s.lang)),
                  style: AppText.caption.copyWith(
                    color: on && loyaltyDiscount > 0 ? AppColors.success : t.inkMuted,
                    fontWeight: on ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Switch.adaptive(
            value: on,
            activeThumbColor: Colors.white,
            activeTrackColor: t.accent,
            onChanged: enabled ? onChanged : null,
          ),
        ],
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
      margin: _cardMargin,
      decoration: CheckoutTheme.cardDecoration(context),
      padding: _cardPadding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CheckoutSectionHeader(icon: Icons.sticky_note_2_outlined, title: s.orderNotes, subtitle: s.orderNotesHint),
          TextField(
            controller: controller,
            minLines: 2,
            maxLines: 4,
            textCapitalization: TextCapitalization.sentences,
            decoration: CheckoutTheme.fieldDecoration(context, label: s.notes, icon: Icons.edit_note_outlined),
          ),
        ],
      ),
    );
  }
}

/// «هذا الطلب هدية 🎁»: رسالة على بطاقة الهدية، وإخفاء الأسعار من الفاتورة داخل الطرد.
class CheckoutGiftCard extends StatelessWidget {
  final AppStrings s;
  final bool isGift;

  /// رسوم التغليف (د.ع) — تظهر بجانب العنوان؛ 0 = بلا رسوم.
  final int fee;
  final ValueChanged<bool> onGiftChanged;
  final TextEditingController messageCtrl;
  final bool hidePrices;
  final ValueChanged<bool> onHidePricesChanged;

  const CheckoutGiftCard({
    super.key,
    required this.s,
    required this.isGift,
    this.fee = 0,
    required this.onGiftChanged,
    required this.messageCtrl,
    required this.hidePrices,
    required this.onHidePricesChanged,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 260),
      margin: _cardMargin,
      decoration: CheckoutTheme.cardDecoration(context).copyWith(
        color: isGift ? Color.alphaBlend(t.accent.withValues(alpha: 0.06), t.surface) : null,
      ),
      padding: _cardPadding,
      child: AnimatedSize(
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
        alignment: Alignment.topCenter,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: t.accentLight, borderRadius: BorderRadius.circular(12)),
                  child: const Text('🎁', style: TextStyle(fontSize: 20)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(child: Text(s.giftOrderTitle, style: AppText.title3.copyWith(color: t.ink))),
                          if (fee > 0) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: t.accentLight,
                                borderRadius: BorderRadius.circular(99),
                              ),
                              child: Text(
                                s.giftWrapFeeBadge(formatPrice(fee, lang: s.lang)),
                                style: AppText.caption.copyWith(color: t.accentDark, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ],
                        ],
                      ),
                      Text(s.giftOrderSubtitle, style: AppText.caption.copyWith(color: t.inkMuted)),
                    ],
                  ),
                ),
                Switch.adaptive(
                  value: isGift,
                  activeTrackColor: t.accent,
                  onChanged: (v) {
                    HapticFeedback.selectionClick();
                    onGiftChanged(v);
                  },
                ),
              ],
            ),
            if (isGift) ...[
              const SizedBox(height: 14),
              TextField(
                controller: messageCtrl,
                minLines: 2,
                maxLines: 4,
                maxLength: 200,
                textCapitalization: TextCapitalization.sentences,
                decoration: CheckoutTheme.fieldDecoration(
                  context,
                  label: s.giftMessageLabel,
                  hint: s.giftMessageHint,
                  icon: Icons.favorite_border_rounded,
                ),
              ),
              const SizedBox(height: 4),
              InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => onHidePricesChanged(!hidePrices),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      Checkbox(
                        value: hidePrices,
                        activeColor: t.accent,
                        onChanged: (v) => onHidePricesChanged(v ?? false),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(s.giftHidePricesTitle, style: AppText.label.copyWith(color: t.ink)),
                            Text(s.giftHidePricesHint,
                                style: AppText.caption.copyWith(color: t.inkMuted)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// حالة رسوم التوصيل في الملخص — لا «مجاني» إلا إن قالها عرض السعر فعلاً.
enum CheckoutShippingStatus {
  /// لم تُختر المحافظة بعد.
  needsGovernorate,
  loading,

  /// فشل عرض السعر: «إعادة».
  failed,
  ready,

  /// استلام من الفرع — بلا رسوم.
  pickup,
}

class CheckoutSummaryCard extends StatefulWidget {
  final AppStrings s;
  final int subtotal;
  final int discount;
  /// توفير الباقات المكتملة (سعر الباقة أقل من مجموع منتجاتها).
  final int packageSaving;
  final int loyaltyDiscount;

  /// رسوم التوصيل حين تكون معروفة ([CheckoutShippingStatus.ready]).
  final int? shipping;

  /// رسوم تغليف الهدية — سطر في الملخص حين تكون أكبر من صفر.
  final int giftWrap;
  final CheckoutShippingStatus shippingStatus;
  final VoidCallback? onRetryShipping;

  /// null حتى تُعرف رسوم التوصيل.
  final int? total;
  final List<CartItem> items;

  const CheckoutSummaryCard({
    super.key,
    required this.s,
    required this.subtotal,
    required this.discount,
    this.packageSaving = 0,
    required this.loyaltyDiscount,
    required this.shipping,
    this.giftWrap = 0,
    required this.shippingStatus,
    this.onRetryShipping,
    required this.total,
    this.items = const [],
  });

  @override
  State<CheckoutSummaryCard> createState() => _CheckoutSummaryCardState();
}

class _CheckoutSummaryCardState extends State<CheckoutSummaryCard> {
  static const _preview = 3;
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    final t = context.worldTheme;
    final items = widget.items;
    final visible = _expanded ? items : items.take(_preview).toList();
    String price(int v) => formatPrice(v, lang: s.lang);

    return Container(
      margin: _cardMargin,
      decoration: CheckoutTheme.cardDecoration(context),
      padding: _cardPadding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CheckoutSectionHeader(icon: Icons.receipt_long_outlined, title: s.orderSummary, step: 3),
          if (items.isNotEmpty) ...[
            AnimatedSize(
              duration: const Duration(milliseconds: 240),
              curve: Curves.easeOutCubic,
              alignment: AlignmentDirectional.topCenter,
              child: Column(
                children: [
                  for (var i = 0; i < visible.length; i++) ...[
                    if (i > 0) const SizedBox(height: 10),
                    _SummaryItem(item: visible[i]),
                  ],
                ],
              ),
            ),
            if (items.length > _preview)
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: TextButton.icon(
                  onPressed: () => setState(() => _expanded = !_expanded),
                  style: TextButton.styleFrom(
                    foregroundColor: t.accentDark,
                    minimumSize: const Size(0, kMinTapTarget),
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                  ),
                  icon: Icon(_expanded ? Icons.expand_less_rounded : Icons.expand_more_rounded, size: 20),
                  label: Text(_expanded ? s.showLess : s.showAllItems(items.length), style: AppText.label),
                ),
              ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1, color: t.divider),
            ),
          ],
          _Row(label: s.subtotal, value: price(widget.subtotal)),
          if (widget.packageSaving > 0)
            _Row(label: s.bundleSavings, value: '- ${price(widget.packageSaving)}', valueColor: AppColors.success),
          if (widget.discount > 0)
            _Row(label: s.couponDiscount, value: '- ${price(widget.discount)}', valueColor: AppColors.success),
          if (widget.loyaltyDiscount > 0)
            _Row(
              label: s.useLoyaltyPoints,
              value: '- ${price(widget.loyaltyDiscount)}',
              valueColor: AppColors.success,
            ),
          _shippingRow(s, t),
          if (widget.giftWrap > 0) _Row(label: s.giftWrapLine, value: price(widget.giftWrap)),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1, color: t.divider),
          ),
          Row(
            children: [
              Expanded(
                child: Text(s.total, style: AppText.title3.copyWith(color: t.ink)),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: AlignmentDirectional.centerEnd,
                  child: Text(
                    widget.total == null ? '…' : price(widget.total!),
                    style: AppText.title1.copyWith(color: t.accentDark),
                  ),
                ),
              ),
            ],
          ),
          if (widget.discount + widget.loyaltyDiscount + widget.packageSaving > 0) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(AppCorners.sm),
              ),
              child: Row(
                children: [
                  const Icon(Icons.savings_outlined, size: 18, color: AppColors.success),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      s.youSaved(price(widget.discount + widget.loyaltyDiscount + widget.packageSaving)),
                      style: AppText.label.copyWith(color: AppColors.success),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _shippingRow(AppStrings s, WorldThemePalette t) {
    return switch (widget.shippingStatus) {
      CheckoutShippingStatus.pickup => _Row(label: s.branchPickup, value: s.free, valueColor: AppColors.success),
      CheckoutShippingStatus.needsGovernorate => _Row(label: s.shipping, value: s.selectGovernorate, valueColor: t.inkMuted),
      CheckoutShippingStatus.loading => _Row(label: s.shipping, value: s.calculating, valueColor: t.inkMuted),
      CheckoutShippingStatus.failed => _Row(
          label: s.shipping,
          value: s.shippingQuoteFailed,
          valueColor: AppColors.sale,
          onTap: widget.onRetryShipping,
        ),
      CheckoutShippingStatus.ready => _Row(
          label: s.shipping,
          value: (widget.shipping ?? 0) == 0 ? s.free : formatPrice(widget.shipping, lang: s.lang),
          valueColor: (widget.shipping ?? 0) == 0 ? AppColors.success : null,
        ),
    };
  }
}

class _SummaryItem extends ConsumerWidget {
  final CartItem item;
  const _SummaryItem({required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final lang = ref.watch(languageCodeProvider);
    return Row(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: t.accentLight,
                borderRadius: BorderRadius.circular(AppCorners.sm),
                border: Border.all(color: t.accentSoft),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AppCorners.sm - 1),
                child: item.imageUrl.isNotEmpty
                    ? Padding(
                        padding: const EdgeInsets.all(3),
                        child: ProductCoverImage(url: item.imageUrl, fit: BoxFit.contain),
                      )
                    : Icon(Icons.spa_outlined, color: t.accent, size: 20),
              ),
            ),
            PositionedDirectional(top: -6, end: -6, child: CountBadge(count: item.quantity)),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.localizedName(lang),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.bodySmall.copyWith(color: t.ink, fontWeight: FontWeight.w600),
              ),
              if (item.shadeName != null)
                Text(
                  item.shadeName!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.caption.copyWith(color: t.inkMuted),
                ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Text(formatPrice(item.lineTotal, lang: lang), style: AppText.label.copyWith(color: t.ink)),
      ],
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  /// صف قابل للضغط (مثل «تعذّر الحساب — إعادة»).
  final VoidCallback? onTap;

  const _Row({required this.label, required this.value, this.valueColor, this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final row = Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.bodySmall.copyWith(color: t.inkSoft),
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: AppText.bodySmall.copyWith(fontWeight: FontWeight.w700, color: valueColor ?? t.ink),
            ),
          ),
        ],
      ),
    );
    if (onTap == null) return row;
    return Semantics(
      button: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppCorners.sm),
        child: ConstrainedBox(constraints: const BoxConstraints(minHeight: kMinTapTarget), child: Center(child: row)),
      ),
    );
  }
}

/// شريط تأكيد الطلب الثابت — الإجمالي + زر قوي، ويحترم المنطقة الآمنة.
class CheckoutBottomBar extends StatelessWidget {
  final AppStrings s;

  /// null حتى تُعرف رسوم التوصيل — يظهر «…» بدل رقم قد لا يكون ما سيُحتسب.
  final int? total;
  final bool placing;
  final VoidCallback onPlace;
  final bool payByCard;

  /// سبب يمنع الإتمام الآن (لا اتصال، منتج غير متوفر) — الزر معطّل والسبب مكان سطر الأمان.
  final String? blockedReason;

  /// طريق إصلاح السبب (مثل «السلة» لإزالة منتج غير متوفر).
  final String? blockedActionLabel;
  final VoidCallback? onBlockedAction;

  const CheckoutBottomBar({
    super.key,
    required this.s,
    required this.total,
    required this.placing,
    required this.onPlace,
    this.payByCard = false,
    this.blockedReason,
    this.blockedActionLabel,
    this.onBlockedAction,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(CartTheme.radiusXl)),
        border: Border(top: BorderSide(color: t.accentSoft)),
        boxShadow: CheckoutTheme.dockShadow(context),
      ),
      child: SafeArea(
        top: false,
        minimum: const EdgeInsets.only(bottom: 12),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 14, CartTheme.hPad, 0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 140),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(s.total, style: AppText.caption.copyWith(color: t.inkMuted)),
                        const SizedBox(height: 2),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: AlignmentDirectional.centerStart,
                          child: Text(
                            total == null ? '…' : formatPrice(total, lang: s.lang),
                            style: AppText.title1.copyWith(color: t.ink),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: PrimaryPillButton(
                      label: payByCard ? s.payNow : s.confirmOrder,
                      icon: payByCard ? Icons.credit_card_rounded : Icons.lock_outline_rounded,
                      loading: placing,
                      onTap: blockedReason == null ? onPlace : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    blockedReason == null ? Icons.verified_user_outlined : Icons.info_outline_rounded,
                    size: 14,
                    color: blockedReason == null ? t.inkMuted : AppColors.sale,
                  ),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Semantics(
                      liveRegion: blockedReason != null,
                      child: Text(
                        blockedReason ?? '${s.secureCheckout} • ${payByCard ? s.secureCardNote : s.secureCodNote}',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: AppText.caption.copyWith(
                          color: blockedReason == null ? t.inkMuted : AppColors.sale,
                          fontWeight: blockedReason == null ? null : FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  if (blockedReason != null && blockedActionLabel != null && onBlockedAction != null)
                    TextButton(
                      onPressed: onBlockedAction,
                      style: TextButton.styleFrom(
                        foregroundColor: t.accentDark,
                        minimumSize: const Size(kMinTapTarget, kMinTapTarget),
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                      ),
                      child: Text(blockedActionLabel!, style: AppText.label),
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

class CheckoutShippingBanner extends StatelessWidget {
  final AppStrings s;
  final String? error;
  final VoidCallback onRetry;

  const CheckoutShippingBanner({super.key, required this.s, required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    if (error == null) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.fromLTRB(CartTheme.hPad, 0, CartTheme.hPad, 14),
      padding: const EdgeInsetsDirectional.fromSTEB(12, 6, 6, 6),
      decoration: BoxDecoration(
        color: Color.alphaBlend(AppColors.sale.withValues(alpha: 0.07), t.surface),
        borderRadius: BorderRadius.circular(AppCorners.md),
        border: Border.all(color: AppColors.sale.withValues(alpha: 0.22)),
      ),
      child: Row(
        children: [
          const Icon(Icons.local_shipping_outlined, color: AppColors.sale, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(error!, style: AppText.caption.copyWith(color: t.ink)),
          ),
          TextButton(
            onPressed: onRetry,
            style: TextButton.styleFrom(
              foregroundColor: AppColors.sale,
              minimumSize: const Size(kMinTapTarget, kMinTapTarget),
            ),
            child: Text(s.retry, style: AppText.label),
          ),
        ],
      ),
    );
  }
}
