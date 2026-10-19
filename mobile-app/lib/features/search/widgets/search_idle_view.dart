import 'package:flutter/foundation.dart' show ValueListenable;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/brand.dart';
import '../../../data/models/category.dart';
import '../../../data/models/product.dart';
import '../../../data/models/store_world.dart';
import '../../home/widgets/world_showcase.dart';
import '../../worlds/world_theme.dart';
import '../search_strings.dart';

/// عنصر في "الأكثر طلباً": اسم القسم ومساره.
class SearchTrend {
  final String label;
  final String location;
  const SearchTrend({required this.label, required this.location});
}

/// الحالة الافتراضية قبل الكتابة — صفحة اكتشاف كاملة:
/// بحثك الأخير، العوالم، الأكثر طلباً (مرقّم)، الأقسام كدوائر، البراندات، وشاهدتِ مؤخراً.
class SearchIdleView extends StatelessWidget {
  final AppStrings s;
  final String lang;

  /// نص الحقل — تلميح «حرفين على الأقل» يتبعه مباشرة (لا ينتظر إعادة بناء الصفحة).
  final ValueListenable<TextEditingValue>? query;
  final List<String> recentQueries;
  final List<Category> categories;
  final List<Product> recentProducts;
  final List<StoreWorld> worlds;
  final List<SearchTrend> trends;
  final List<Brand> brands;
  final ValueChanged<String> onRecentTap;
  final ValueChanged<String> onRecentRemove;
  final VoidCallback onClearRecent;
  final ValueChanged<Category> onCategoryTap;
  final VoidCallback onClearRecentProducts;
  final ValueChanged<String> onWorldTap;
  final ValueChanged<String> onLocation;
  final ValueChanged<Brand> onBrandTap;
  final VoidCallback? onAllBrands;

  const SearchIdleView({
    super.key,
    required this.s,
    required this.lang,
    required this.recentQueries,
    required this.categories,
    required this.recentProducts,
    required this.onRecentTap,
    required this.onRecentRemove,
    required this.onClearRecent,
    required this.onCategoryTap,
    required this.onClearRecentProducts,
    this.worlds = const [],
    this.trends = const [],
    this.brands = const [],
    required this.onWorldTap,
    required this.onLocation,
    required this.onBrandTap,
    this.onAllBrands,
    this.query,
  });

  @override
  Widget build(BuildContext context) {
    final firstVisit = recentQueries.isEmpty && recentProducts.isEmpty;
    final worldList = worlds.where((w) => !w.isGift).toList();
    return ListView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: const EdgeInsets.only(bottom: 40),
      children: [
        if (query != null) _TypeMoreHint(query: query!, text: s.searchTypeMore),
        if (firstVisit)
          _IntroCard(title: s.searchIdleTitle, body: s.searchIdleBody),
        if (recentQueries.isNotEmpty) ...[
          AppSectionTitle(
            title: s.searchRecentTitle,
            padding: const EdgeInsetsDirectional.fromSTEB(16, 20, 8, 10),
            trailing: _TextAction(
              label: s.searchClearAll,
              onTap: onClearRecent,
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final q in recentQueries)
                  _RecentChip(
                    label: q,
                    removeLabel: s.searchRemoveRecent(q),
                    onTap: () => onRecentTap(q),
                    onRemove: () => onRecentRemove(q),
                  ),
              ],
            ),
          ),
        ],
        if (worldList.length > 1) ...[
          AppSectionTitle(
            title: s.searchWorldsTitle,
            subtitle: s.searchWorldsSubtitle,
            padding: const EdgeInsetsDirectional.fromSTEB(16, 24, 16, 12),
          ),
          WorldSegments(
            worlds: worldList,
            selectedSlug: null,
            onSelect: onWorldTap,
          ),
        ],
        if (trends.isNotEmpty) ...[
          AppSectionTitle(
            title: s.searchTrendingTitle,
            subtitle: s.searchTrendingSubtitle,
            padding: const EdgeInsetsDirectional.fromSTEB(16, 26, 16, 10),
          ),
          _TrendingGrid(trends: trends, onTap: (tr) => onLocation(tr.location)),
        ],
        if (categories.isNotEmpty) ...[
          AppSectionTitle(
            title: s.searchShopByCategory,
            padding: const EdgeInsetsDirectional.fromSTEB(16, 26, 16, 14),
          ),
          _CategoryBubbles(
            categories: categories,
            lang: lang,
            onTap: onCategoryTap,
          ),
        ],
        if (brands.isNotEmpty) ...[
          AppSectionTitle(
            title: s.searchTopBrands,
            padding: const EdgeInsetsDirectional.fromSTEB(16, 24, 16, 12),
            actionLabel: onAllBrands == null ? null : s.searchViewAll,
            onAction: onAllBrands,
          ),
          _BrandsStrip(brands: brands, lang: lang, onTap: onBrandTap),
        ],
        if (recentProducts.isNotEmpty) ...[
          AppSectionTitle(
            title: s.recentlyViewed,
            subtitle: s.searchRecentlyViewedSubtitle,
            padding: const EdgeInsetsDirectional.fromSTEB(16, 26, 8, 12),
            trailing: _TextAction(
              label: s.searchClearAll,
              onTap: onClearRecentProducts,
            ),
          ),
          _RecentProductsRow(products: recentProducts),
        ],
      ],
    );
  }
}

/// "الأكثر طلباً": قائمة مرقّمة بعمودين — أرقام كبيرة متدرّجة بلون العالم.
class _TrendingGrid extends StatelessWidget {
  final List<SearchTrend> trends;
  final ValueChanged<SearchTrend> onTap;
  const _TrendingGrid({required this.trends, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final half = (trends.length / 2).ceil();
    Widget column(int from, int to) => Expanded(
      child: Column(
        children: [
          for (var i = from; i < to; i++)
            _TrendRow(
              rank: i + 1,
              trend: trends[i],
              onTap: () => onTap(trends[i]),
            ),
        ],
      ),
    );
    // التموّج يُرسم على أقرب Material — Ink داخل Material شفاف يُبقيه فوق خلفية البطاقة.
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Material(
        type: MaterialType.transparency,
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: t.accentSoft.withValues(alpha: 0.7)),
            boxShadow: [
              BoxShadow(
                color: t.accentDark.withValues(alpha: 0.06),
                blurRadius: 18,
                offset: const Offset(0, 8),
                spreadRadius: -6,
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              column(0, half),
              Container(
                width: 1,
                height: half * 50.0,
                color: t.hairline.withValues(alpha: 0.6),
              ),
              column(half, trends.length),
            ],
          ),
        ),
      ),
    );
  }
}

class _TrendRow extends StatelessWidget {
  final int rank;
  final SearchTrend trend;
  final VoidCallback onTap;
  const _TrendRow({
    required this.rank,
    required this.trend,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final top = rank <= 3;
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: SizedBox(
        height: 50,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Row(
            children: [
              SizedBox(
                width: 28,
                child: ShaderMask(
                  blendMode: BlendMode.srcIn,
                  shaderCallback: (r) => LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: top
                        ? [
                            Color.lerp(t.accent, Colors.white, 0.2)!,
                            t.accentDark,
                          ]
                        : [t.inkMuted, t.inkMuted],
                  ).createShader(r),
                  child: Text(
                    '$rank',
                    textAlign: TextAlign.center,
                    style: AppText.display.copyWith(
                      fontSize: top ? 24 : 20,
                      height: 1,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  trend.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.label.copyWith(
                    color: t.ink,
                    fontWeight: top ? FontWeight.w700 : FontWeight.w600,
                  ),
                ),
              ),
              if (top)
                Icon(Icons.trending_up_rounded, size: 16, color: t.accent),
            ],
          ),
        ),
      ),
    );
  }
}

/// الأقسام كدوائر كبيرة بحلقة متدرّجة — أربعة في الصف.
class _CategoryBubbles extends StatelessWidget {
  final List<Category> categories;
  final String lang;
  final ValueChanged<Category> onTap;
  const _CategoryBubbles({
    required this.categories,
    required this.lang,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return LayoutBuilder(
      builder: (context, c) {
        const cols = 4;
        const gap = 10.0;
        final w = (c.maxWidth - 32 - gap * (cols - 1)) / cols;
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Wrap(
            spacing: gap,
            runSpacing: 16,
            children: [
              for (final cat in categories)
                SizedBox(
                  width: w,
                  child: AppTap(
                    radius: BorderRadius.circular(AppCorners.md),
                    onTap: () => onTap(cat),
                    child: Column(
                      children: [
                        Container(
                          width: w - 6,
                          height: w - 6,
                          padding: const EdgeInsets.all(2.4),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                Color.lerp(t.accent, Colors.white, 0.3)!,
                                t.accentDark,
                              ],
                            ),
                          ),
                          child: Container(
                            padding: const EdgeInsets.all(2.4),
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                            ),
                            child: ClipOval(
                              child: AppNetworkImage(
                                url: cat.imageUrl,
                                width: w - 11,
                                fit: BoxFit.cover,
                                backgroundColor: t.accentLight,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 7),
                        Text(
                          cat.localizedName(lang),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: AppText.micro.copyWith(
                            fontSize: 12,
                            color: t.ink,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

/// شعارات البراندات في دوائر بيضاء — الأكثر منتجات أولاً.
class _BrandsStrip extends StatelessWidget {
  final List<Brand> brands;
  final String lang;
  final ValueChanged<Brand> onTap;
  const _BrandsStrip({
    required this.brands,
    required this.lang,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    // ثلاثة صفوف تتمرر أفقياً — عدد أكبر من البراندات في مساحة أنيقة.
    const rows = 3;
    const tileH = 96.0;
    const gap = 10.0;
    return SizedBox(
      height: rows * tileH + (rows - 1) * gap,
      child: GridView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: brands.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: rows,
          mainAxisSpacing: 12,
          crossAxisSpacing: gap,
          mainAxisExtent: 74,
        ),
        itemBuilder: (context, i) {
          final b = brands[i];
          final name = b.localizedName(lang);
          return AppTap(
            radius: BorderRadius.circular(AppCorners.md),
            onTap: () => onTap(b),
            child: SizedBox(
              width: 70,
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    padding: const EdgeInsets.all(10),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      border: Border.all(color: t.hairline),
                      boxShadow: [
                        BoxShadow(
                          color: t.accentDark.withValues(alpha: 0.07),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: b.logoUrl.isEmpty
                        ? FittedBox(
                            child: Text(
                              name.toUpperCase(),
                              maxLines: 2,
                              textAlign: TextAlign.center,
                              style: AppText.micro.copyWith(
                                color: t.ink,
                                letterSpacing: 0.8,
                              ),
                            ),
                          )
                        : AppNetworkImage(
                            url: b.logoUrl,
                            width: 44,
                            fit: BoxFit.contain,
                            backgroundColor: Colors.white,
                          ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.micro.copyWith(
                      fontSize: 11.5,
                      color: t.inkSoft,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _IntroCard extends StatelessWidget {
  final String title;
  final String body;
  const _IntroCard({required this.title, required this.body});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: AlignmentDirectional.topStart,
            end: AlignmentDirectional.bottomEnd,
            colors: [t.accentLight, t.canvasWarm],
          ),
          borderRadius: BorderRadius.circular(AppCorners.lg),
          border: Border.all(color: t.accentSoft),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: t.surface,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.auto_awesome_rounded,
                color: t.accent,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AppText.title3.copyWith(color: t.ink)),
                  const SizedBox(height: 2),
                  Text(body, style: AppText.caption.copyWith(color: t.inkSoft)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TextAction extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _TextAction({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return TextButton(
      style: TextButton.styleFrom(
        foregroundColor: t.accentDark,
        minimumSize: const Size(kMinTapTarget, kMinTapTarget),
        padding: const EdgeInsets.symmetric(horizontal: 10),
        textStyle: AppText.label,
      ),
      onPressed: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Text(label),
    );
  }
}

class _RecentChip extends StatelessWidget {
  final String label;
  final String removeLabel;
  final VoidCallback onTap;
  final VoidCallback onRemove;

  const _RecentChip({
    required this.label,
    required this.removeLabel,
    required this.onTap,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final dir = Directionality.of(context);
    // Ink داخل Material شفاف: التموّج فوق خلفية الشريحة لا تحتها.
    return Material(
      type: MaterialType.transparency,
      child: Ink(
        height: kMinTapTarget,
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(AppCorners.pill),
          border: Border.all(color: t.hairline),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Semantics(
              button: true,
              child: InkWell(
                borderRadius: const BorderRadiusDirectional.horizontal(
                  start: Radius.circular(AppCorners.pill),
                ).resolve(dir),
                onTap: () {
                  HapticFeedback.selectionClick();
                  onTap();
                },
                child: Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(12, 0, 2, 0),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.history_rounded, size: 16, color: t.inkMuted),
                      const SizedBox(width: 6),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 180),
                        child: Text(
                          label,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.label.copyWith(
                            color: t.ink,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // هدف الحذف 44×44 — كان صغيراً يصعب إصابته.
            Semantics(
              button: true,
              label: removeLabel,
              excludeSemantics: true,
              child: InkWell(
                borderRadius: const BorderRadiusDirectional.horizontal(
                  end: Radius.circular(AppCorners.pill),
                ).resolve(dir),
                onTap: () {
                  HapticFeedback.lightImpact();
                  onRemove();
                },
                child: SizedBox(
                  width: kMinTapTarget,
                  height: kMinTapTarget,
                  child: Icon(Icons.close_rounded, size: 16, color: t.inkMuted),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// «اكتبي حرفين على الأقل…» — يظهر مع الحرف الأول فقط ويختفي مع الثاني أو عند المسح.
class _TypeMoreHint extends StatelessWidget {
  final ValueListenable<TextEditingValue> query;
  final String text;
  const _TypeMoreHint({required this.query, required this.text});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: query,
      builder: (context, v, _) {
        final show = v.text.trim().length == 1;
        return AnimatedSize(
          duration: reduceMotion
              ? Duration.zero
              : const Duration(milliseconds: 180),
          curve: Curves.easeOutCubic,
          alignment: AlignmentDirectional.topStart,
          child: show
              ? Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(20, 14, 20, 0),
                  child: Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: Text(
                      text,
                      style: AppText.caption.copyWith(color: t.inkMuted),
                    ),
                  ),
                )
              : const SizedBox(width: double.infinity),
        );
      },
    );
  }
}

class _RecentProductsRow extends StatelessWidget {
  final List<Product> products;
  const _RecentProductsRow({required this.products});

  @override
  Widget build(BuildContext context) {
    final width = Responsive.productCardWidth(context);
    final height = Responsive.productCardHeight(context);
    return SizedBox(
      height: height + 8,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        itemCount: products.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) => RepaintBoundary(
          child: SizedBox(
            width: width,
            height: height,
            child: ProductCard(
              key: ValueKey(products[i].id),
              product: products[i],
              width: width,
              lite: true,
            ),
          ),
        ),
      ),
    );
  }
}
