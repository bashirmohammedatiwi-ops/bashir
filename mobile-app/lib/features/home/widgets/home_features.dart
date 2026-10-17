import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/theme/app_text.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../core/widgets/product_card.dart';
import '../../auth/auth_provider.dart';
import '../../cart/cart_provider.dart';
import '../../cart/coupon_provider.dart';
import '../../cart/widgets/coupon_ticket.dart';
import '../../shell/main_shell.dart';
import '../../catalog/catalog_providers.dart';
import '../../wishlist/wishlist_provider.dart';
import '../../shell/nav_tabs.dart';
import '../../worlds/world_theme.dart';
import '../../worlds/worlds_provider.dart';

// ─── سلتكِ بانتظاركِ ─────────────────────────────────────────────────────────

/// تذكير أنيق بالسلة: صور المنتجات متراكبة، العدد والمجموع، وزر لإكمال الطلب.
/// لا يظهر إلا عندما تحتوي السلة على منتجات.
class HomeCartReminder extends ConsumerWidget {
  const HomeCartReminder({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    if (cart.isEmpty) return const SizedBox.shrink();
    final t = context.worldTheme;
    final ar = ref.s.isAr;
    final pill = Color.lerp(t.accent, Colors.black, 0.1)!;
    final thumbs = cart.items.take(3).toList();
    final threshold =
        ref
            .watch(activeHomeFeedProvider)
            .valueOrNull
            ?.settings
            .freeShippingThreshold ??
        0;

    void openCart() {
      HapticFeedback.lightImpact();
      openMainTab(
        context,
        ProviderScope.containerOf(context, listen: false),
        NavTabs.cart,
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 4),
      child: GestureDetector(
        onTap: openCart,
        child: Container(
          padding: const EdgeInsetsDirectional.fromSTEB(12, 12, 12, 12),
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: t.accentSoft.withValues(alpha: 0.7)),
            boxShadow: [
              BoxShadow(
                color: t.accentDark.withValues(alpha: 0.08),
                blurRadius: 22,
                offset: const Offset(0, 10),
                spreadRadius: -6,
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  // صور المنتجات متراكبة بحلقات بيضاء.
                  SizedBox(
                    width: 46 + (thumbs.length - 1) * 26.0,
                    height: 46,
                    child: Stack(
                      children: [
                        for (var i = thumbs.length - 1; i >= 0; i--)
                          PositionedDirectional(
                            start: i * 26.0,
                            child: Container(
                              width: 46,
                              height: 46,
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: t.accentLight,
                                  width: 2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.06),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: ClipOval(
                                child: AppNetworkImage(
                                  url: thumbs[i].imageUrl,
                                  fit: BoxFit.contain,
                                  backgroundColor: Colors.white,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          ar ? 'سلتكِ بانتظاركِ' : 'Your bag is waiting',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.title3.copyWith(color: t.ink),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          ar
                              ? '${cart.count} ${cart.count == 1 ? 'منتج' : 'منتجات'} • ${formatPrice(cart.subtotal)}'
                              : '${cart.count} items • ${formatPrice(cart.subtotal)}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.caption.copyWith(color: t.inkMuted),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    height: 40,
                    padding: const EdgeInsetsDirectional.fromSTEB(14, 0, 10, 0),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color.lerp(pill, Colors.white, 0.16)!, pill],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: pill.withValues(alpha: 0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          ar ? 'أكملي' : 'Continue',
                          style: AppText.label.copyWith(color: Colors.white),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          size: 16,
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (threshold > 0) ...[
                const SizedBox(height: 12),
                _FreeShippingBar(
                  subtotal: cart.subtotal,
                  threshold: threshold,
                  ar: ar,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// تقدّم نحو التوصيل المجاني — شريط رفيع بلون العالم ونص قصير.
class _FreeShippingBar extends StatelessWidget {
  final int subtotal;
  final int threshold;
  final bool ar;
  const _FreeShippingBar({
    required this.subtotal,
    required this.threshold,
    required this.ar,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final remaining = threshold - subtotal;
    final done = remaining <= 0;
    final progress = (subtotal / threshold).clamp(0.0, 1.0);
    return Row(
      children: [
        HugeIcon(
          icon: done
              ? HugeIcons.strokeRoundedCheckmarkBadge01
              : HugeIcons.strokeRoundedDeliveryTruck01,
          size: 18,
          color: t.accentDark,
          strokeWidth: 1.6,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                done
                    ? (ar
                          ? 'رائع! توصيلكِ مجاني'
                          : 'Nice! Your delivery is free')
                    : (ar
                          ? 'باقي ${formatPrice(remaining)} للتوصيل المجاني'
                          : '${formatPrice(remaining)} away from free delivery'),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.caption.copyWith(
                  color: t.inkSoft,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(99),
                child: TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0, end: progress),
                  duration: const Duration(milliseconds: 900),
                  curve: Curves.easeOutCubic,
                  builder: (_, v, __) => Stack(
                    children: [
                      Container(height: 5, color: t.accentLight),
                      FractionallySizedBox(
                        widthFactor: v,
                        child: Container(
                          height: 5,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                t.accent.withValues(alpha: 0.7),
                                t.accent,
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── من مفضّلتكِ ─────────────────────────────────────────────────────────────

/// منتجات المفضلة على الرئيسية — المخفّضة أولاً (نزل سعرها) ثم البقية.
class HomeWishlistShelf extends ConsumerWidget {
  const HomeWishlistShelf({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!ref.watch(authProvider).isAuthenticated)
      return const SizedBox.shrink();
    final products = ref.watch(wishlistProvider).products;
    if (products.length < 2) return const SizedBox.shrink();
    final ar = ref.s.isAr;
    final sorted = [
      ...products.where((p) => p.hasDiscount),
      ...products.where((p) => !p.hasDiscount),
    ].take(12).toList();
    final drops = products.where((p) => p.hasDiscount).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(
          title: ar ? 'من مفضّلتكِ' : 'From your favorites',
          subtitle: drops > 0
              ? (ar
                    ? '$drops ${drops == 1 ? 'منتج عليه' : 'منتجات عليها'} خصم الآن'
                    : '$drops on sale now')
              : (ar ? 'ما أحببتِه بانتظاركِ' : 'The things you love'),
          actionLabel: ar ? 'عرض الكل' : 'View all',
          onAction: () => context.push('/wishlist'),
        ),
        SizedBox(
          height: 262,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: sorted.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) => ProductCard(
              key: ValueKey(sorted[i].id),
              product: sorted[i],
              width: 150,
              lite: true,
            ),
          ),
        ),
      ],
    );
  }
}

// ─── كوبونات لكِ ─────────────────────────────────────────────────────────────

/// بطاقات الكوبونات المختارة من لوحة التحكم — «استخدمي الكود» يفعّله للسلة بلمسة.
class HomeCouponsShelf extends ConsumerWidget {
  const HomeCouponsShelf({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coupons = ref.watch(featuredCouponsProvider).valueOrNull ?? const [];
    if (coupons.isEmpty) return const SizedBox.shrink();
    final ar = ref.s.isAr;
    void viewCart() {
      context.go('/');
      ref.read(navIndexProvider.notifier).state = NavTabs.cart;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(
          title: ar ? 'كوبونات لكِ ✂️' : 'Coupons for you ✂️',
          subtitle: ar ? 'لمسة وحدة ويتفعّل الخصم على سلتكِ' : 'One tap and it applies to your bag',
        ),
        LayoutBuilder(
          builder: (context, c) {
            final single = coupons.length == 1;
            final w = single ? c.maxWidth - 32 : (c.maxWidth * 0.84).clamp(260.0, 380.0);
            return SizedBox(
              height: 154,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: single ? const NeverScrollableScrollPhysics() : const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 2, 16, 14),
                itemCount: coupons.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) => CouponTicket(coupon: coupons[i], width: w, onViewCart: viewCart),
              ),
            );
          },
        ),
      ],
    );
  }
}

// ─── اطلبيها مرة ثانية ──────────────────────────────────────────────────────

/// مشترياتها السابقة المتوفرة الآن — إعادة طلب ما أحبته بلمسة (للمسجّلات).
class HomeBuyAgainShelf extends ConsumerWidget {
  const HomeBuyAgainShelf({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!ref.watch(authProvider).isAuthenticated) return const SizedBox.shrink();
    final products = ref.watch(buyAgainProvider).valueOrNull ?? const [];
    if (products.length < 2) return const SizedBox.shrink();
    final ar = ref.s.isAr;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(
          title: ar ? 'اطلبيها مرة ثانية' : 'Buy it again',
          subtitle: ar ? 'من مشترياتكِ السابقة — بسعرها الحالي' : 'From your past orders, at today\'s price',
        ),
        SizedBox(
          height: 262,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: products.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) => ProductCard(
              key: ValueKey(products[i].id),
              product: products[i],
              width: 150,
              lite: true,
            ),
          ),
        ),
      ],
    );
  }
}

// ─── تسوّقي حسب ميزانيتكِ ────────────────────────────────────────────────────

class _Budget {
  final int? min;
  final int? max;
  final String top;
  final String amount;
  final String unit;
  final String title;
  const _Budget(
    this.min,
    this.max,
    this.top,
    this.amount,
    this.unit,
    this.title,
  );
}

/// بطاقة نطاق: «أقل من 10 ألف»، «من 10 إلى 25 ألف»، «فاخر +50 ألف» — والعناوين تُبنى من الأرقام.
_Budget _budgetFor(({int? min, int? max}) r, bool ar, {required bool last}) {
  final thousands = (r.min ?? 0) % 1000 == 0 && (r.max ?? 0) % 1000 == 0;
  String short(int v) => thousands ? formatNumber(v ~/ 1000) : formatNumber(v);
  final unit = thousands ? (ar ? 'ألف د.ع' : 'K IQD') : (ar ? 'د.ع' : 'IQD');
  String full(int v) => formatNumber(v);
  if (r.min == null) {
    return _Budget(null, r.max, ar ? 'أقل من' : 'Under', short(r.max!), unit,
        ar ? 'أقل من ${full(r.max!)} د.ع' : 'Under ${full(r.max!)} IQD');
  }
  if (r.max == null) {
    final top = last ? (ar ? 'فاخر' : 'Luxe') : (ar ? 'أكثر من' : 'Over');
    return _Budget(r.min, null, top, '+${short(r.min!)}', unit,
        ar ? '$top — أكثر من ${full(r.min!)} د.ع' : '$top — over ${full(r.min!)} IQD');
  }
  return _Budget(r.min, r.max, ar ? 'من ${short(r.min!)} إلى' : '${short(r.min!)} to', short(r.max!), unit,
      ar ? 'من ${full(r.min!)} إلى ${full(r.max!)} د.ع' : '${full(r.min!)} – ${full(r.max!)} IQD');
}

/// أربع بطاقات أسعار بتدرّج يتصاعد مع الميزانية — والأخيرة "فاخر" بلون العالم الكامل.
/// اللمسة تفتح المنتجات بنطاق السعر مباشرة.
class HomeBudgetShelf extends ConsumerWidget {
  const HomeBudgetShelf({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final ar = ref.s.isAr;
    final slug = ref.watch(selectedWorldSlugProvider);
    final custom = slug == null ? const <({int? min, int? max})>[] : ref.watch(worldDetailProvider(slug)).valueOrNull?.budgetTiers ?? const [];
    // نطاقات العالم من لوحة التحكم، وإلا الافتراضي.
    final ranges = custom.isNotEmpty
        ? custom
        : const [(min: null, max: 10000), (min: 10000, max: 25000), (min: 25000, max: 50000), (min: 50000, max: null)];
    final tiers = [for (var i = 0; i < ranges.length; i++) _budgetFor(ranges[i], ar, last: i == ranges.length - 1)];
    final deep = Color.lerp(t.accent, Colors.black, 0.12)!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(
          title: ar ? 'تسوّقي حسب ميزانيتكِ' : 'Shop by budget',
          subtitle: ar
              ? 'اختيارات جميلة لكل ميزانية'
              : 'Beautiful picks for every budget',
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              for (var i = 0; i < tiers.length; i++) ...[
                if (i > 0) const SizedBox(width: 8),
                Expanded(
                  child: _BudgetCard(
                    tier: tiers[i],
                    // تدرّج يتعمّق مع ارتفاع الميزانية.
                    background: i == tiers.length - 1
                        ? null
                        : Color.lerp(t.accentLight, t.accentSoft, i / 2.0)!,
                    gradient: i == tiers.length - 1
                        ? LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Color.lerp(deep, Colors.white, 0.16)!,
                              deep,
                            ],
                          )
                        : null,
                    ink: i == tiers.length - 1 ? Colors.white : t.ink,
                    muted: i == tiers.length - 1
                        ? Colors.white.withValues(alpha: 0.8)
                        : t.inkMuted,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      final q = <String>[
                        if (tiers[i].min != null) 'minPrice=${tiers[i].min}',
                        if (tiers[i].max != null) 'maxPrice=${tiers[i].max}',
                        'title=${Uri.encodeComponent(tiers[i].title)}',
                      ].join('&');
                      context.push('/products?$q');
                    },
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _BudgetCard extends StatelessWidget {
  final _Budget tier;
  final Color? background;
  final Gradient? gradient;
  final Color ink;
  final Color muted;
  final VoidCallback onTap;

  const _BudgetCard({
    required this.tier,
    required this.background,
    required this.gradient,
    required this.ink,
    required this.muted,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final luxe = gradient != null;
    return Semantics(
      button: true,
      label: tier.title,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 96,
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
          decoration: BoxDecoration(
            color: background,
            gradient: gradient,
            borderRadius: BorderRadius.circular(20),
            border: luxe
                ? null
                : Border.all(color: t.accentSoft.withValues(alpha: 0.6)),
            boxShadow: luxe
                ? [
                    BoxShadow(
                      color: t.accent.withValues(alpha: 0.32),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (luxe)
                HugeIcon(
                  icon: HugeIcons.strokeRoundedDiamond01,
                  size: 15,
                  color: muted,
                  strokeWidth: 1.6,
                )
              else
                Text(
                  tier.top,
                  maxLines: 1,
                  style: AppText.micro.copyWith(
                    color: muted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              const SizedBox(height: 3),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  tier.amount,
                  maxLines: 1,
                  style: AppText.display.copyWith(
                    fontSize: 25,
                    height: 1.1,
                    color: ink,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  luxe ? tier.top : tier.unit,
                  maxLines: 1,
                  style: AppText.micro.copyWith(
                    color: muted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
