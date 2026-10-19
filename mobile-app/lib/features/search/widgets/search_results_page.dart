import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/product_grid.dart';
import '../../../core/widgets/scroll_perf.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/search_instant.dart';
import '../../advisor/widgets/advisor_search_prompt.dart';
import '../../worlds/world_theme.dart';
import '../search_strings.dart';
import '../search_v2_controllers.dart';
import '../smart_query.dart';

/// صفحة النتائج: عنوان وعدد، شريط فلاتر ثابت (ترتيب، عروض، متوفر، براند، قسم، نوع، سعر)، وشبكة منتجات.
class SearchResultsPage extends StatelessWidget {
  final AppStrings s;
  final SearchResultsV2Controller results;
  final ValueChanged<String> onSearch;
  const SearchResultsPage({super.key, required this.s, required this.results, required this.onSearch});

  @override
  Widget build(BuildContext context) {
    // بعد المسح أو تعديل الكلمة تبقى الصفحة لحظة الانتقال — لا نرسم «لا نتائج» مؤقتة.
    if (!results.active) return const SizedBox.shrink();
    final t = context.worldTheme;
    final r = results;
    final meta = r.meta;
    final skeleton = r.loading && r.items.isEmpty;

    if (r.error != null && r.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.wifi_off_rounded, size: 40, color: t.inkMuted),
              const SizedBox(height: 10),
              Text(s.searchFailed, textAlign: TextAlign.center, style: AppText.body.copyWith(color: t.inkSoft)),
              const SizedBox(height: 12),
              // الإعادة تُبقي الفلاتر المختارة.
              FilledButton(onPressed: () => r.setFilters(r.filters), child: Text(s.retry)),
            ],
          ),
        ),
      );
    }

    final f = r.filters;
    final budgetActive = _budgetActive(r);
    final understood = meta?.understood ?? const <String>[];

    return NotificationListener<ScrollNotification>(
      onNotification: (n) {
        if (n.metrics.axis == Axis.vertical && n.metrics.extentAfter < 900) r.loadMore();
        return false;
      },
      child: CustomScrollView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        physics: AppScrollPerf.physics,
        cacheExtent: AppScrollPerf.gridCacheExtent,
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(16, 14, 16, 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.searchQuoted(r.query), maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.title2.copyWith(color: t.ink)),
                  const SizedBox(height: 2),
                  AnimatedSwitcher(
                    duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 200),
                    child: skeleton
                        ? const ShimmerBox(key: ValueKey('s'), width: 80, height: 10, radius: 5)
                        : Text(
                            r.total == 0 ? s.searchNoResultsShort : s.productsN(r.total),
                            key: ValueKey(r.total),
                            style: AppText.caption.copyWith(color: t.inkMuted, fontWeight: FontWeight.w700),
                          ),
                  ),
                  if (meta?.corrected != null) ...[
                    const SizedBox(height: 8),
                    Text.rich(
                      TextSpan(children: [
                        TextSpan(text: s.searchCorrectedPrefix, style: AppText.bodySmall.copyWith(color: t.inkSoft)),
                        TextSpan(
                          text: s.searchQuoted(meta!.corrected!),
                          style: AppText.bodySmall.copyWith(color: t.accentDark, fontWeight: FontWeight.w800),
                        ),
                      ]),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    // البحث بالكلمة كما كُتبت — السيرفر يتخطى التصحيح.
                    if (!f.exact)
                      _InsteadLink(
                        s: s,
                        original: r.query,
                        onTap: () => r.search(r.query, filters: f, exact: true),
                      ),
                  ],
                  // «فهمنا: …» فقط حين فهمنا شيئاً غير ما كُتب حرفياً.
                  if (understood.isNotEmpty &&
                      (understood.length > 1 || normalizeQuery(understood.first) != normalizeQuery(r.query))) ...[
                    const SizedBox(height: 6),
                    Text(
                      '${s.searchUnderstoodPrefix}${understood.join(' • ')}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.caption.copyWith(color: t.accentDark, fontWeight: FontWeight.w700),
                    ),
                  ],
                ],
              ),
            ),
          ),
          SliverPersistentHeader(pinned: true, delegate: _FilterBarDelegate(s: s, results: r)),
          if (!skeleton && r.items.isEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 30, 16, 24),
                child: Column(
                  children: [
                    Icon(Icons.search_off_rounded, size: 40, color: t.inkMuted),
                    const SizedBox(height: 10),
                    if (f.active || budgetActive) ...[
                      Text(s.searchNoFilteredResults, textAlign: TextAlign.center, style: AppText.title2.copyWith(color: t.ink)),
                      const SizedBox(height: 14),
                      OutlinedButton(
                        // الميزانية المأخوذة من نص البحث فلتر أيضاً — «مسح» يلغيها.
                        onPressed: () => f.active ? r.clearFilters() : r.setFilters(f.copyWith(ignoreBudget: true)),
                        child: Text(s.searchClearFilters),
                      ),
                    ] else ...[
                      Text(s.searchNoResultsTitle(r.query), textAlign: TextAlign.center, style: AppText.title2.copyWith(color: t.ink)),
                      const SizedBox(height: 6),
                      Text(s.searchNoResultsBody, textAlign: TextAlign.center, style: AppText.bodySmall.copyWith(color: t.inkMuted)),
                      // «ديما» بالعربي فقط.
                      if (s.isAr) ...[
                        const SizedBox(height: 16),
                        AdvisorSearchPrompt(query: r.query),
                      ],
                      const SizedBox(height: 20),
                      Align(
                        alignment: AlignmentDirectional.centerStart,
                        child: Text(s.searchPopularSearches, style: AppText.title3.copyWith(color: t.ink)),
                      ),
                      const SizedBox(height: 6),
                      Align(
                        alignment: AlignmentDirectional.centerStart,
                        child: Wrap(
                          spacing: 8,
                          children: [
                            for (final term in s.searchPopularTerms)
                              AppChoiceChip(
                                label: term,
                                icon: Icons.search_rounded,
                                selected: false,
                                onTap: () => onSearch(term),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            )
          else ...[
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              sliver: SliverGrid(
                gridDelegate: ProductGrid.delegateFor(context, listing: true),
                delegate: SliverChildBuilderDelegate(
                  (context, i) {
                    if (skeleton) return const ShimmerBox(height: double.infinity, radius: ProductCard.radius);
                    final p = r.items[i];
                    return RepaintBoundary(
                      child: ProductCard(key: ValueKey(p.id), product: p, showRating: true, showPromoBadge: true, style: ProductCardStyle.listing),
                    );
                  },
                  childCount: skeleton ? 6 : r.items.length,
                  addAutomaticKeepAlives: false,
                  addRepaintBoundaries: false,
                ),
              ),
            ),
            if (!skeleton) SliverToBoxAdapter(child: _Footer(s: s, results: r)),
          ],
          const SliverToBoxAdapter(child: SizedBox(height: 28)),
        ],
      ),
    );
  }
}

/// ميزانية استنتجها السيرفر من نص البحث وطُبّقت فعلاً (بلا سعر صريح مختار).
bool _budgetActive(SearchResultsV2Controller r) {
  final f = r.filters;
  return r.meta?.budget != null && f.minPrice == null && f.maxPrice == null && !f.ignoreBudget;
}

/// «ابحثي عن «X» بدلاً من ذلك» — بعد تصحيح إملائي.
class _InsteadLink extends StatelessWidget {
  final AppStrings s;
  final String original;
  final VoidCallback onTap;
  const _InsteadLink({required this.s, required this.original, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final base = AppText.bodySmall.copyWith(color: t.inkSoft);
    return Semantics(
      button: true,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppCorners.xs),
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: kMinTapTarget),
          child: Align(
            alignment: AlignmentDirectional.centerStart,
            widthFactor: 1,
            child: Text.rich(
              TextSpan(children: [
                TextSpan(text: s.searchInsteadPrefix, style: base),
                TextSpan(
                  text: s.searchQuoted(original),
                  style: base.copyWith(color: t.accentDark, fontWeight: FontWeight.w800, decoration: TextDecoration.underline),
                ),
                TextSpan(text: s.searchInsteadSuffix, style: base),
              ]),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
      ),
    );
  }
}

/// تذييل الشبكة: تحميل المزيد، أو «إعادة» بعد فشل، أو «هذه كل النتائج».
class _Footer extends StatelessWidget {
  final AppStrings s;
  final SearchResultsV2Controller results;
  const _Footer({required this.s, required this.results});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final r = results;
    final Widget child;
    if (r.moreError != null) {
      child = Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(s.searchLoadMoreFailed, style: AppText.caption.copyWith(color: t.inkMuted)),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () {
              HapticFeedback.selectionClick();
              r.loadMore(retry: true);
            },
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: Text(s.retry),
            style: OutlinedButton.styleFrom(
              foregroundColor: t.accentDark,
              side: BorderSide(color: t.accentSoft),
              minimumSize: const Size(140, kMinTapTarget),
              shape: const StadiumBorder(),
              textStyle: AppText.label,
            ),
          ),
        ],
      );
    } else if (r.hasNext || r.loadingMore) {
      // التذييل يُبنى حين يقترب من الشاشة: نطلب الصفحة التالية حتى لو كانت القائمة أقصر من أن تُمرَّر.
      if (r.hasNext && !r.loadingMore) {
        WidgetsBinding.instance.addPostFrameCallback((_) => r.loadMore());
      }
      child = SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: t.accent));
    } else {
      child = Row(
        children: [
          Expanded(child: Divider(color: t.divider, endIndent: 12)),
          Flexible(
            flex: 3,
            child: Text(
              s.searchEndOfResultsCount(r.total),
              textAlign: TextAlign.center,
              style: AppText.caption.copyWith(color: t.inkMuted),
            ),
          ),
          Expanded(child: Divider(color: t.divider, indent: 12)),
        ],
      );
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
      child: Center(child: child),
    );
  }
}

class _FilterBarDelegate extends SliverPersistentHeaderDelegate {
  final AppStrings s;
  final SearchResultsV2Controller results;
  _FilterBarDelegate({required this.s, required this.results});

  @override
  double get minExtent => 56;
  @override
  double get maxExtent => 56;

  @override
  bool shouldRebuild(covariant _FilterBarDelegate old) => true;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final t = context.worldTheme;
    final r = results;
    final f = r.filters;
    final meta = r.meta;

    String? brandLabel;
    if (f.brandIds.length == 1) {
      brandLabel = meta?.brands.where((b) => b.id == f.brandIds.first).map((b) => b.name).firstOrNull;
    } else if (f.brandIds.length > 1) {
      brandLabel = s.searchFilterBrandCount(f.brandIds.length);
    }
    final kindLabel = f.kind == null ? null : meta?.kinds.where((k) => k.id == f.kind).map((k) => k.name).firstOrNull;
    final categoryLabel =
        f.categoryId == null ? null : meta?.categories.where((c) => c.id == f.categoryId).map((c) => c.name).firstOrNull;
    final priced = f.minPrice != null || f.maxPrice != null;
    final budgetActive = _budgetActive(r);
    final priceLabel = priced
        ? s.searchPriceRange(f.minPrice, f.maxPrice)
        : budgetActive
            ? s.searchPriceUnder(meta!.budget!)
            : null;

    Widget chip({
      required IconData icon,
      required String label,
      required bool selected,
      required VoidCallback onTap,
      bool dropdown = false,
      int? count,
    }) =>
        Padding(
          padding: const EdgeInsetsDirectional.only(end: 8),
          child: AppChoiceChip(label: label, icon: icon, selected: selected, showChevron: dropdown, count: count, onTap: onTap),
        );

    return ColoredBox(
      color: t.canvas,
      child: ListView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 6),
        children: [
          chip(
            icon: Icons.swap_vert_rounded,
            label: s.sortLabel(f.sort),
            selected: f.sort != SearchSort.relevance,
            dropdown: true,
            onTap: () => _pickSort(context, s, r),
          ),
          chip(
            icon: Icons.local_offer_outlined,
            label: s.searchFilterDeals,
            selected: f.deals,
            onTap: () => r.setFilters(f.copyWith(deals: !f.deals)),
          ),
          chip(
            icon: Icons.inventory_2_outlined,
            label: s.searchFilterInStock,
            selected: f.inStock,
            onTap: () => r.setFilters(f.copyWith(inStock: !f.inStock)),
          ),
          if ((meta?.brands.length ?? 0) > 1 || f.brandIds.isNotEmpty)
            chip(
              icon: Icons.sell_outlined,
              label: brandLabel ?? s.searchFilterBrand,
              selected: f.brandIds.isNotEmpty,
              dropdown: true,
              onTap: () => _pickBrands(context, s, r),
            ),
          if ((meta?.categories.length ?? 0) > 1 || f.categoryId != null)
            chip(
              icon: Icons.grid_view_rounded,
              label: categoryLabel ?? s.searchFilterCategory,
              selected: f.categoryId != null,
              dropdown: true,
              onTap: () => _pickCategory(context, s, r),
            ),
          if ((meta?.kinds.length ?? 0) > 1 || f.kind != null)
            chip(
              icon: Icons.category_outlined,
              label: kindLabel ?? s.searchFilterKind,
              selected: f.kind != null,
              dropdown: true,
              onTap: () => _pickKind(context, s, r),
            ),
          chip(
            icon: Icons.payments_outlined,
            label: priceLabel ?? s.searchFilterPrice,
            selected: priceLabel != null,
            dropdown: true,
            onTap: () => _pickPrice(context, s, r),
          ),
          if (f.active)
            chip(
              icon: Icons.close_rounded,
              label: s.searchFilterClear,
              selected: false,
              count: f.count,
              onTap: r.clearFilters,
            ),
        ],
      ),
    );
  }
}

// ───────────────────────────────────────────── أوراق الاختيار

Widget _option(BuildContext ctx, String label, bool selected, VoidCallback onTap, {int? count}) {
  final t = ctx.worldTheme;
  return ListTile(
    onTap: () {
      HapticFeedback.selectionClick();
      onTap();
    },
    selected: selected,
    minTileHeight: 52,
    title: Text(label, style: AppText.body.copyWith(color: t.ink, fontWeight: selected ? FontWeight.w800 : FontWeight.w500)),
    trailing: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (count != null && count > 0) Text(formatNumber(count), style: AppText.caption.copyWith(color: t.inkMuted)),
        const SizedBox(width: 8),
        Icon(selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded, color: selected ? t.accent : t.hairline),
      ],
    ),
  );
}

/// ورقة اختيار واحد: كل ضغطة تطبّق وتغلق.
void _pickOne(BuildContext context, String title, List<Widget> Function(BuildContext ctx) options) {
  showAppSheet<void>(
    context: context,
    title: title,
    builder: (ctx) => ListView(
      shrinkWrap: true,
      padding: const EdgeInsets.only(bottom: 8),
      children: options(ctx),
    ),
  );
}

void _pickSort(BuildContext context, AppStrings s, SearchResultsV2Controller r) {
  _pickOne(context, s.searchSortTitle, (ctx) => [
        for (final sort in SearchSort.values)
          _option(ctx, s.sortLabel(sort), r.filters.sort == sort, () {
            Navigator.pop(ctx);
            r.setFilters(r.filters.copyWith(sort: sort));
          }),
      ]);
}

void _pickKind(BuildContext context, AppStrings s, SearchResultsV2Controller r) {
  final kinds = r.meta?.kinds ?? const <SearchFacet>[];
  _pickOne(context, s.searchFilterKind, (ctx) => [
        _option(ctx, s.searchFilterAll, r.filters.kind == null, () {
          Navigator.pop(ctx);
          r.setFilters(r.filters.copyWith(clearKind: true));
        }),
        for (final k in kinds)
          _option(ctx, k.name, r.filters.kind == k.id, () {
            Navigator.pop(ctx);
            r.setFilters(r.filters.copyWith(kind: k.id));
          }, count: k.count),
      ]);
}

void _pickCategory(BuildContext context, AppStrings s, SearchResultsV2Controller r) {
  final cats = r.meta?.categories ?? const <SearchFacet>[];
  _pickOne(context, s.searchFilterCategory, (ctx) => [
        _option(ctx, s.searchFilterAll, r.filters.categoryId == null, () {
          Navigator.pop(ctx);
          r.setFilters(r.filters.copyWith(clearCategory: true));
        }),
        for (final c in cats)
          _option(ctx, c.name, r.filters.categoryId == c.id, () {
            Navigator.pop(ctx);
            r.setFilters(r.filters.copyWith(categoryId: c.id));
          }, count: c.count),
      ]);
}

void _pickBrands(BuildContext context, AppStrings s, SearchResultsV2Controller r) {
  final brands = r.meta?.brands ?? const <SearchFacet>[];
  // الجسم والتذييل يتشاركان الاختيار — التطبيق لا يحدث إلا بـ«عرض النتائج».
  final picked = ValueNotifier<Set<String>>({...r.filters.brandIds});
  showAppSheet<void>(
    context: context,
    title: s.searchFilterBrand,
    builder: (ctx) {
      final t = ctx.worldTheme;
      return ValueListenableBuilder<Set<String>>(
        valueListenable: picked,
        builder: (ctx, sel, _) => ListView(
          shrinkWrap: true,
          children: [
            for (final b in brands)
              CheckboxListTile(
                value: sel.contains(b.id),
                onChanged: (v) => picked.value = v == true ? {...sel, b.id} : ({...sel}..remove(b.id)),
                activeColor: t.accent,
                controlAffinity: ListTileControlAffinity.trailing,
                title: Text(b.name, style: AppText.body.copyWith(color: t.ink, fontWeight: sel.contains(b.id) ? FontWeight.w700 : FontWeight.w500)),
                subtitle: b.count > 0 ? Text(s.productsN(b.count), style: AppText.caption.copyWith(color: t.inkMuted)) : null,
              ),
          ],
        ),
      );
    },
    footer: Builder(
      builder: (ctx) => ValueListenableBuilder<Set<String>>(
        valueListenable: picked,
        builder: (ctx, sel, _) => Row(
          children: [
            TextButton(
              onPressed: sel.isEmpty ? null : () => picked.value = const {},
              style: TextButton.styleFrom(minimumSize: const Size(kMinTapTarget, kMinTapTarget)),
              child: Text(s.searchFilterClear),
            ),
            if (sel.isNotEmpty)
              Flexible(
                child: Text(
                  s.searchBrandsSelected(sel.length),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.caption.copyWith(color: ctx.worldTheme.inkMuted),
                ),
              ),
            const Spacer(),
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                r.setFilters(r.filters.copyWith(brandIds: sel));
              },
              style: FilledButton.styleFrom(minimumSize: const Size(120, kMinTapTarget)),
              child: Text(s.searchShowResults),
            ),
          ],
        ),
      ),
    ),
  ).whenComplete(picked.dispose);
}

/// شرائح السعر: من السيرفر (بعدّاداتها) إن أرسلها، وإلا 4–5 شرائح من مدى النتائج مقرّبة لـ 5,000.
List<SearchPriceBucket> searchPriceBuckets(SearchPage? meta) {
  if (meta != null && meta.priceBuckets.isNotEmpty) return meta.priceBuckets;
  const round = 5000;
  final lo = meta?.priceMin;
  final hi = meta?.priceMax;
  if (lo == null || hi == null || hi - lo < round) {
    // بلا مدى معروف: شرائح عامة تناسب أغلب المتجر.
    if (lo != null && hi != null) return const [];
    return const [
      SearchPriceBucket(max: 10000),
      SearchPriceBucket(min: 10000, max: 25000),
      SearchPriceBucket(min: 25000, max: 50000),
      SearchPriceBucket(min: 50000, max: 100000),
      SearchPriceBucket(min: 100000),
    ];
  }
  final step = math.max(round, ((hi - lo) / 4 / round).ceil() * round);
  final start = (lo ~/ round) * round;
  final edges = <int>[
    for (var e = start + step; e < hi; e += step)
      if (e > lo) e,
  ];
  if (edges.isEmpty) return const [];
  return [
    SearchPriceBucket(max: edges.first),
    for (var i = 0; i + 1 < edges.length; i++) SearchPriceBucket(min: edges[i], max: edges[i + 1]),
    SearchPriceBucket(min: edges.last),
  ];
}

bool _bucketSelected(SearchFilters f, SearchPriceBucket b) =>
    (f.minPrice != null || f.maxPrice != null) && f.minPrice == b.min && f.maxPrice == b.max;

void _pickPrice(BuildContext context, AppStrings s, SearchResultsV2Controller r) {
  final f = r.filters;
  final budgetActive = _budgetActive(r);
  final buckets = searchPriceBuckets(r.meta);
  // شرائح السيرفر معدودة: الفارغة لا تُعرض (إلا المختارة حالياً).
  final fromServer = r.meta?.priceBuckets.isNotEmpty ?? false;
  // اختيار صريح يُلغي ميزانية نص البحث حتى لا يتعارض الاثنان.
  void apply(BuildContext ctx, int? min, int? max) {
    Navigator.pop(ctx);
    r.setFilters(SearchFilters(
      sort: f.sort,
      brandIds: f.brandIds,
      kind: f.kind,
      categoryId: f.categoryId,
      inStock: f.inStock,
      deals: f.deals,
      minPrice: min,
      maxPrice: max,
      ignoreBudget: true,
      exact: f.exact,
    ));
  }

  _pickOne(context, s.searchFilterPrice, (ctx) {
    final t = ctx.worldTheme;
    return [
      if (budgetActive)
        Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(20, 0, 20, 8),
          child: Row(
            children: [
              Icon(Icons.auto_awesome_rounded, size: 16, color: t.accent),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${s.searchPriceUnder(r.meta!.budget!)} — ${s.searchBudgetFromQuery}',
                  style: AppText.caption.copyWith(color: t.inkSoft),
                ),
              ),
            ],
          ),
        ),
      _option(ctx, s.searchAnyPrice, f.minPrice == null && f.maxPrice == null && !budgetActive, () => apply(ctx, null, null)),
      for (final b in buckets)
        if (_bucketSelected(f, b) || !fromServer || b.count > 0)
          _option(ctx, s.searchPriceRange(b.min, b.max), _bucketSelected(f, b), () => apply(ctx, b.min, b.max), count: b.count),
    ];
  });
}
