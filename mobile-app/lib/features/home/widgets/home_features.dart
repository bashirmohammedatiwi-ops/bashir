import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/free_shipping_progress.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../auth/auth_provider.dart';
import '../../cart/cart_provider.dart';
import '../../cart/coupon_provider.dart';
import '../../cart/widgets/coupon_ticket.dart';
import '../../catalog/catalog_providers.dart';
import '../../wishlist/wishlist_provider.dart';
import '../../shell/nav_tabs.dart';
import '../../worlds/world_theme.dart';
import '../../worlds/worlds_provider.dart';
import 'home_product_row.dart';

/// نصوص الرفوف الشخصية على الرئيسية (السلة، المفضلة، الكوبونات، الميزانية).
extension _HomeFeatureStrings on AppStrings {
  String get homeBagWaiting => isAr ? 'سلتكِ بانتظاركِ' : 'Your bag is waiting';
  String get homeContinueCta => isAr ? 'أكملي' : 'Continue';

  /// وصف زر «أكملي» لقارئ الشاشة (والزر الدائري على الشاشات الضيقة).
  String get continueLabel => isAr ? 'أكملي طلبكِ في السلة' : 'Continue to your bag';

  String get homeFavoritesTitle => isAr ? 'من مفضّلتكِ' : 'From your favorites';
  String get homeFavoritesSub => isAr ? 'ما أحببتِه بانتظاركِ' : 'The things you love';
  String homeFavoritesOnSale(int n) => isAr
      ? (n == 1 ? 'منتج واحد عليه خصم الآن' : '${arProducts(n)} عليها خصم الآن')
      : '${itemsCount(n)} on sale now';

  String get homeCouponsTitle => isAr ? 'كوبونات لكِ ✂️' : 'Coupons for you ✂️';
  String get homeCouponsSub =>
      isAr ? 'لمسة وحدة ويتفعّل الخصم على سلتكِ' : 'One tap and it applies to your bag';

  String get homeBuyAgainTitle => isAr ? 'اطلبيها مرة ثانية' : 'Buy it again';
  String get homeBuyAgainSub =>
      isAr ? 'من مشترياتكِ السابقة — بسعرها الحالي' : "From your past orders, at today's price";
  String get homeBuyAgainOrders => isAr ? 'كل طلباتي' : 'All my orders';

  String get homeBudgetTitle => isAr ? 'تسوّقي حسب ميزانيتكِ' : 'Shop by budget';
  String get homeBudgetSub => isAr ? 'اختيارات جميلة لكل ميزانية' : 'Beautiful picks for every budget';
  String get budgetUnder => isAr ? 'أقل من' : 'Under';
  String get budgetOver => isAr ? 'أكثر من' : 'Over';
  String get budgetLuxe => isAr ? 'فاخر' : 'Luxe';
  String budgetFromTo(String from) => isAr ? 'من $from إلى' : '$from to';
  String get budgetUnitThousands => isAr ? 'ألف د.ع' : 'K IQD';
  String get budgetUnitIqd => isAr ? 'د.ع' : 'IQD';
  String budgetTitleUnder(String price) => isAr ? 'أقل من $price' : 'Under $price';
  String budgetTitleOver(String top, String price) =>
      isAr ? '$top — أكثر من $price' : '$top — over $price';
  String budgetTitleRange(String from, String to) => isAr ? 'من $from إلى $to' : '$from – $to';
}

// ─── سلتكِ بانتظاركِ ─────────────────────────────────────────────────────────

/// تذكير أنيق بالسلة: صور المنتجات متراكبة، العدد والمجموع، وزر لإكمال الطلب.
/// لا يظهر إلا عندما تحتوي السلة على منتجات. تحته التقدّم نحو التوصيل المجاني،
/// وحين ينقص مبلغ بسيط: «أكملي الفرق» ورفّ صغير بمنتجات بسعر قريب منه.
class HomeCartReminder extends ConsumerWidget {
  const HomeCartReminder({super.key});

  /// الشاشات الأضيق من هذا: صورتان وزر دائري بدل حبّة «أكملي» — يبقى المجموع مقروءاً.
  static const _narrowWidth = 360.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    if (cart.isEmpty) return const SizedBox.shrink();
    final s = ref.s;
    final t = context.worldTheme;
    final pill = Color.lerp(t.accent, Colors.black, 0.1)!;
    // آخر إعدادات معروفة للمتجر؛ قبل وصولها لا نعد بحد لا نعرفه.
    final threshold = ref.watch(storeSettingsProvider)?.freeShippingThreshold ?? 0;
    final viaCoupon = ref.watch(appliedCouponProvider.select((c) => c?.freeShipping ?? false));
    // الحد يُقارن بالمجموع الفرعي قبل الكوبون والنقاط — نفس قاعدة الخادم.
    final remaining = viaCoupon || threshold <= 0 ? 0 : (threshold - cart.subtotal).clamp(0, threshold);
    final summary = '${s.itemsCount(cart.count)} • ${formatPrice(cart.subtotal, lang: s.lang)}';

    void openCart() {
      HapticFeedback.lightImpact();
      openMainTab(
        context,
        ProviderScope.containerOf(context, listen: false),
        NavTabs.cart,
      );
    }

    /// «أكملي الفرق»: قائمة كاملة بنطاق سعر الاقتراحات نفسه.
    void openFillers() {
      HapticFeedback.selectionClick();
      final band = freeShippingBand(remaining);
      final q = [
        'minPrice=${(band * 0.8).round()}',
        'maxPrice=${(band * 1.6).round()}',
        'title=${Uri.encodeComponent(s.freeShippingFillers)}',
      ].join('&');
      context.push('/products?$q');
    }

    return LayoutBuilder(
      builder: (context, c) {
        final narrow = c.maxWidth < _narrowWidth;
        final thumbs = cart.items.take(narrow ? 2 : 3).toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 4),
              child: GestureDetector(
                onTap: openCart,
                child: Container(
                  padding: const EdgeInsetsDirectional.fromSTEB(12, 12, 12, 12),
                  decoration: BoxDecoration(
                    color: t.surface,
                    borderRadius: BorderRadius.circular(AppCorners.lg + 4),
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
                          // صور المنتجات متراكبة بحلقات بيضاء — زخرفية لقارئ الشاشة.
                          ExcludeSemantics(
                            child: SizedBox(
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
                                          border: Border.all(color: t.accentLight, width: 2),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withValues(alpha: 0.06),
                                              blurRadius: 6,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                        child: ClipOval(
                                          // مقاس صريح: تُفكّ الصورة بحجم الدائرة لا بعرض الشاشة.
                                          child: AppNetworkImage(
                                            url: thumbs[i].imageUrl,
                                            width: 38,
                                            height: 38,
                                            fit: BoxFit.contain,
                                            backgroundColor: Colors.white,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Semantics(
                              container: true,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    s.homeBagWaiting,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppText.title3.copyWith(color: t.ink),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    summary,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppText.caption.copyWith(color: t.inkMuted),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Semantics(
                            button: true,
                            label: s.continueLabel,
                            excludeSemantics: true,
                            onTap: openCart,
                            child: _ContinuePill(
                              color: pill,
                              label: narrow ? null : s.homeContinueCta,
                            ),
                          ),
                        ],
                      ),
                      if (threshold > 0 || viaCoupon) ...[
                        const SizedBox(height: 12),
                        FreeShippingProgress(
                          subtotal: cart.subtotal,
                          threshold: threshold,
                          viaCoupon: viaCoupon,
                          compact: true,
                        ),
                        if (remaining > 0)
                          Align(
                            alignment: AlignmentDirectional.centerEnd,
                            child: TextButton.icon(
                              onPressed: openFillers,
                              style: TextButton.styleFrom(
                                minimumSize: const Size(44, 44),
                                padding: const EdgeInsetsDirectional.fromSTEB(8, 0, 4, 0),
                                foregroundColor: t.accentDark,
                                textStyle: AppText.label,
                              ),
                              icon: const Icon(Icons.add_shopping_cart_rounded, size: 18),
                              label: Text(s.fillTheGap),
                            ),
                          ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            if (remaining > 0) _FreeShippingFillersRow(remaining: remaining, onViewAll: openFillers),
          ],
        );
      },
    );
  }
}

/// حبّة «أكملي ←» — وعلى الشاشات الضيقة دائرة 40 بالسهم فقط.
class _ContinuePill extends StatelessWidget {
  final Color color;
  final String? label;

  const _ContinuePill({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    final round = label == null;
    return Container(
      height: 40,
      width: round ? 40 : null,
      padding: round ? null : const EdgeInsetsDirectional.fromSTEB(14, 0, 10, 0),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppCorners.pill),
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color.lerp(color, Colors.white, 0.16)!, color],
        ),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (!round) ...[
            Text(label!, style: AppText.label.copyWith(color: Colors.white)),
            const SizedBox(width: 4),
          ],
          Icon(Icons.arrow_forward_rounded, size: round ? 19 : 16, color: Colors.white),
        ],
      ),
    );
  }
}

/// رفّ صغير تحت تذكير السلة: منتجات متوفرة بسعر قريب مما ينقص للتوصيل المجاني
/// (بلا ما في السلة). لا يظهر إلا إن وُجد منها اثنان.
class _FreeShippingFillersRow extends ConsumerWidget {
  final int remaining;
  final VoidCallback onViewAll;

  const _FreeShippingFillersRow({required this.remaining, required this.onViewAll});

  /// بطاقات أصغر من رفوف الرئيسية — اقتراح خفيف لا رفّ ينافس السلة.
  static const _cardW = 136.0;
  static const _cardH = 248.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(freeShippingFillersFor(remaining)).valueOrNull ?? const [];
    if (products.length < 2) return const SizedBox.shrink();
    final s = ref.s;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(
          title: s.freeShippingFillers,
          showAccent: false,
          padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 10),
        ),
        HomeProductRow(
          products: products.take(10).toList(),
          itemWidth: _cardW,
          itemHeight: _cardH,
          onViewAll: onViewAll,
          viewAllLabel: s.viewAll,
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
    if (!ref.watch(authProvider).isAuthenticated) return const SizedBox.shrink();
    final wishlist = ref.watch(wishlistProvider);
    final s = ref.s;
    final products = wishlist.products;
    // أول تحميل للمسجّلة: نحجز ارتفاع الرف بدل أن يقفز المحتوى تحته عند وصوله.
    if (products.isEmpty && wishlist.loading && !wishlist.loaded) {
      return _ShelfSkeleton(title: s.homeFavoritesTitle);
    }
    if (products.length < 2) return const SizedBox.shrink();
    final sorted = [
      ...products.where((p) => p.hasDiscount),
      ...products.where((p) => !p.hasDiscount),
    ].take(12).toList();
    final drops = products.where((p) => p.hasDiscount).length;

    void openWishlist() => context.push('/wishlist');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(
          title: s.homeFavoritesTitle,
          subtitle: drops > 0 ? s.homeFavoritesOnSale(drops) : s.homeFavoritesSub,
          actionLabel: s.viewAll,
          onAction: openWishlist,
        ),
        HomeProductRow(
          products: sorted,
          onViewAll: openWishlist,
          viewAllLabel: s.viewWishlist,
        ),
      ],
    );
  }
}

/// عنوان الرف + هيكل صف المنتجات — للرفوف الشخصية أثناء أول تحميل.
class _ShelfSkeleton extends StatelessWidget {
  final String title;
  const _ShelfSkeleton({required this.title});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(title: title),
        const HomeProductRowSkeleton(),
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
    final s = ref.s;
    // تبديل التبويب داخل نفس الواجهة — لا دفع نسخة ثانية منها.
    void viewCart() => openMainTab(
          context,
          ProviderScope.containerOf(context, listen: false),
          NavTabs.cart,
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(
          title: s.homeCouponsTitle,
          subtitle: s.homeCouponsSub,
          actionLabel: s.viewCart,
          onAction: viewCart,
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
    final s = ref.s;
    final async = ref.watch(buyAgainProvider);
    // أول تحميل: نحجز ارتفاع الرف بدل أن يقفز ما تحته حين يصل.
    if (async.isLoading && !async.hasValue) return _ShelfSkeleton(title: s.homeBuyAgainTitle);
    final products = async.valueOrNull ?? const [];
    if (products.length < 2) return const SizedBox.shrink();

    void openOrders() => context.push('/orders');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(
          title: s.homeBuyAgainTitle,
          subtitle: s.homeBuyAgainSub,
          actionLabel: s.myOrders,
          onAction: openOrders,
        ),
        HomeProductRow(
          products: products,
          onViewAll: openOrders,
          viewAllLabel: s.homeBuyAgainOrders,
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
_Budget _budgetFor(({int? min, int? max}) r, AppStrings s, {required bool last}) {
  final thousands = (r.min ?? 0) % 1000 == 0 && (r.max ?? 0) % 1000 == 0;
  String short(int v) => thousands ? formatNumber(v ~/ 1000) : formatNumber(v);
  final unit = thousands ? s.budgetUnitThousands : s.budgetUnitIqd;
  String full(int v) => formatPrice(v, lang: s.lang);
  if (r.min == null) {
    return _Budget(null, r.max, s.budgetUnder, short(r.max!), unit, s.budgetTitleUnder(full(r.max!)));
  }
  if (r.max == null) {
    final top = last ? s.budgetLuxe : s.budgetOver;
    return _Budget(r.min, null, top, '+${short(r.min!)}', unit, s.budgetTitleOver(top, full(r.min!)));
  }
  return _Budget(
    r.min,
    r.max,
    s.budgetFromTo(short(r.min!)),
    short(r.max!),
    unit,
    s.budgetTitleRange(formatNumber(r.min!), full(r.max!)),
  );
}

/// أربع بطاقات أسعار بتدرّج يتصاعد مع الميزانية — والأخيرة "فاخر" بلون العالم الكامل.
/// اللمسة تفتح منتجات العالم الحالي بنطاق السعر مباشرة (لا المتجر كله).
class HomeBudgetShelf extends ConsumerWidget {
  const HomeBudgetShelf({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final s = ref.s;
    final slug = resolveWorldSlug(
      selected: ref.watch(selectedWorldSlugProvider),
      worlds: ref.watch(worldsProvider).valueOrNull,
    );
    final custom = slug == null
        ? const <({int? min, int? max})>[]
        : ref.watch(worldDetailProvider(slug)).valueOrNull?.budgetTiers ?? const [];
    // نطاقات العالم من لوحة التحكم، وإلا الافتراضي.
    final ranges = custom.isNotEmpty
        ? custom
        : const [(min: null, max: 10000), (min: 10000, max: 25000), (min: 25000, max: 50000), (min: 50000, max: null)];
    final tiers = [for (var i = 0; i < ranges.length; i++) _budgetFor(ranges[i], s, last: i == ranges.length - 1)];
    final deep = Color.lerp(t.accent, Colors.black, 0.12)!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(
          title: s.homeBudgetTitle,
          subtitle: s.homeBudgetSub,
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
                        if (slug != null) 'world=${Uri.encodeComponent(slug)}',
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
