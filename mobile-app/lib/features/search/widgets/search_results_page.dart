import '../../../core/l10n/app_strings.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/utils/formatters.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/product_grid.dart';
import '../../../core/widgets/scroll_perf.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/search_instant.dart';
import '../../advisor/widgets/advisor_search_prompt.dart';
import '../../worlds/world_theme.dart';
import '../search_v2_controllers.dart';

/// صفحة النتائج: عنوان وعدد، شريط فلاتر ثابت (ترتيب، عروض، متوفر، براند، نوع، سعر)، وشبكة منتجات.
class SearchResultsPage extends StatelessWidget {
  final SearchResultsV2Controller results;
  final ValueChanged<String> onSearch;
  const SearchResultsPage({super.key, required this.results, required this.onSearch});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final r = results;
    final meta = r.meta;
    final skeleton = r.loading && r.items.isEmpty;

    if (r.error != null && r.items.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.wifi_off_rounded, size: 40, color: t.inkMuted),
            const SizedBox(height: 10),
            Text('تعذّر البحث، تأكدي من الاتصال', style: AppText.body.copyWith(color: t.inkSoft)),
            const SizedBox(height: 12),
            FilledButton(onPressed: () => r.setFilters(r.filters), child: const Text('إعادة')),
          ],
        ),
      );
    }

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
                  Text('«${r.query}»', maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.title2.copyWith(color: t.ink)),
                  const SizedBox(height: 2),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: skeleton
                        ? const ShimmerBox(key: ValueKey('s'), width: 80, height: 10, radius: 5)
                        : Text(
                            r.total == 0 ? 'لا نتائج' : arProducts(r.total),
                            key: ValueKey(r.total),
                            style: AppText.caption.copyWith(color: t.inkMuted, fontWeight: FontWeight.w700),
                          ),
                  ),
                  if (meta?.corrected != null) ...[
                    const SizedBox(height: 8),
                    Text.rich(
                      TextSpan(children: [
                        TextSpan(text: 'عرضنا نتائج ', style: AppText.bodySmall.copyWith(color: t.inkSoft)),
                        TextSpan(text: '«${meta!.corrected}»', style: AppText.bodySmall.copyWith(color: t.accentDark, fontWeight: FontWeight.w800)),
                      ]),
                    ),
                  ],
                  if ((meta?.understood ?? const []).isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      'فهمنا: ${meta!.understood.join(' • ')}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.caption.copyWith(color: t.accentDark, fontWeight: FontWeight.w700),
                    ),
                  ],
                ],
              ),
            ),
          ),
          SliverPersistentHeader(pinned: true, delegate: _FilterBarDelegate(results: r)),
          if (!skeleton && r.items.isEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 30, 16, 24),
                child: Column(
                  children: [
                    Icon(Icons.search_off_rounded, size: 40, color: t.inkMuted),
                    const SizedBox(height: 10),
                    Text(r.filters.active ? 'ما في نتائج بهذه الفلاتر' : 'ما لقينا نتائج', style: AppText.title2.copyWith(color: t.ink)),
                    const SizedBox(height: 14),
                    if (r.filters.active)
                      OutlinedButton(onPressed: () => r.setFilters(const SearchFilters()), child: const Text('مسح الفلاتر'))
                    else
                      AdvisorSearchPrompt(query: r.query),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              sliver: SliverGrid(
                gridDelegate: ProductGrid.delegateFor(context, listing: true),
                delegate: SliverChildBuilderDelegate(
                  (context, i) {
                    if (skeleton || i >= r.items.length) return const ShimmerBox(height: double.infinity, radius: ProductCard.radius);
                    final p = r.items[i];
                    return RepaintBoundary(
                      child: ProductCard(key: ValueKey(p.id), product: p, showRating: true, showPromoBadge: true, style: ProductCardStyle.listing),
                    );
                  },
                  childCount: skeleton ? 6 : r.items.length + (r.loadingMore ? 2 : 0),
                  addAutomaticKeepAlives: false,
                  addRepaintBoundaries: false,
                ),
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 28)),
        ],
      ),
    );
  }
}

class _FilterBarDelegate extends SliverPersistentHeaderDelegate {
  final SearchResultsV2Controller results;
  _FilterBarDelegate({required this.results});

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
      brandLabel = 'البراند (${f.brandIds.length})';
    }
    final kindLabel = f.kind == null ? null : meta?.kinds.where((k) => k.id == f.kind).map((k) => k.name).firstOrNull;
    final priceLabel = f.minPrice == null && f.maxPrice == null
        ? null
        : f.maxPrice != null && f.minPrice == null
            ? 'أقل من ${_k(f.maxPrice!)}'
            : f.maxPrice == null
                ? 'فوق ${_k(f.minPrice!)}'
                : '${_k(f.minPrice!)} – ${_k(f.maxPrice!)}';

    return Container(
      color: t.canvas,
      child: ListView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 9, 16, 9),
        children: [
          _Chip(
            icon: Icons.swap_vert_rounded,
            label: f.sort.label,
            active: f.sort != SearchSort.relevance,
            dropdown: true,
            onTap: () => _pickSort(context, r),
          ),
          _Chip(icon: Icons.local_offer_outlined, label: 'عروض', active: f.deals, onTap: () => r.setFilters(f.copyWith(deals: !f.deals))),
          _Chip(icon: Icons.inventory_2_outlined, label: 'متوفر', active: f.inStock, onTap: () => r.setFilters(f.copyWith(inStock: !f.inStock))),
          if ((meta?.brands.length ?? 0) > 1 || f.brandIds.isNotEmpty)
            _Chip(icon: Icons.sell_outlined, label: brandLabel ?? 'البراند', active: f.brandIds.isNotEmpty, dropdown: true, onTap: () => _pickBrands(context, r)),
          if ((meta?.kinds.length ?? 0) > 1 || f.kind != null)
            _Chip(icon: Icons.category_outlined, label: kindLabel ?? 'النوع', active: f.kind != null, dropdown: true, onTap: () => _pickKind(context, r)),
          _Chip(icon: Icons.payments_outlined, label: priceLabel ?? 'السعر', active: priceLabel != null, dropdown: true, onTap: () => _pickPrice(context, r)),
          if (f.active)
            _Chip(icon: Icons.close_rounded, label: 'مسح', active: false, onTap: () => r.setFilters(const SearchFilters())),
        ],
      ),
    );
  }
}

String _k(int v) => v >= 1000 ? '${(v / 1000).round()} ألف' : '$v';

class _Chip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final bool dropdown;
  final VoidCallback onTap;
  const _Chip({required this.icon, required this.label, required this.active, required this.onTap, this.dropdown = false});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 8),
      child: Material(
        color: active ? t.accentLight : t.surface,
        borderRadius: BorderRadius.circular(19),
        child: InkWell(
          borderRadius: BorderRadius.circular(19),
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(19),
              border: Border.all(color: active ? t.accent : t.hairline, width: active ? 1.4 : 1),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 16, color: active ? t.accentDark : t.inkSoft),
                const SizedBox(width: 5),
                Text(label, style: AppText.label.copyWith(fontSize: 13, color: active ? t.accentDark : t.ink, fontWeight: active ? FontWeight.w800 : FontWeight.w600)),
                if (dropdown) ...[
                  const SizedBox(width: 2),
                  Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: active ? t.accentDark : t.inkMuted),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ───────────────────────────────────────────── أوراق الاختيار

Future<T?> _sheet<T>(BuildContext context, String title, Widget Function(BuildContext) body) {
  final t = context.worldTheme;
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: t.surface,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(26))),
    builder: (ctx) => SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(ctx).height * 0.75),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 10),
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: t.hairline, borderRadius: BorderRadius.circular(4)))),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 6),
              child: Text(title, style: AppText.title2.copyWith(color: t.ink)),
            ),
            Flexible(child: body(ctx)),
          ],
        ),
      ),
    ),
  );
}

Widget _option(BuildContext ctx, String label, bool selected, VoidCallback onTap, {String? trailing}) {
  final t = ctx.worldTheme;
  return ListTile(
    onTap: onTap,
    title: Text(label, style: AppText.body.copyWith(color: t.ink, fontWeight: selected ? FontWeight.w800 : FontWeight.w500)),
    trailing: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (trailing != null) Text(trailing, style: AppText.caption.copyWith(color: t.inkMuted)),
        const SizedBox(width: 8),
        Icon(selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded, color: selected ? t.accent : t.hairline),
      ],
    ),
  );
}

void _pickSort(BuildContext context, SearchResultsV2Controller r) {
  _sheet<void>(context, 'الترتيب', (ctx) => ListView(
        shrinkWrap: true,
        children: [
          for (final s in SearchSort.values)
            _option(ctx, s.label, r.filters.sort == s, () {
              Navigator.pop(ctx);
              r.setFilters(r.filters.copyWith(sort: s));
            }),
        ],
      ));
}

void _pickKind(BuildContext context, SearchResultsV2Controller r) {
  final kinds = r.meta?.kinds ?? const [];
  _sheet<void>(context, 'النوع', (ctx) => ListView(
        shrinkWrap: true,
        children: [
          _option(ctx, 'الكل', r.filters.kind == null, () {
            Navigator.pop(ctx);
            r.setFilters(r.filters.copyWith(clearKind: true));
          }),
          for (final k in kinds)
            _option(ctx, k.name, r.filters.kind == k.id, () {
              Navigator.pop(ctx);
              r.setFilters(r.filters.copyWith(kind: k.id));
            }, trailing: '${k.count}'),
        ],
      ));
}

void _pickBrands(BuildContext context, SearchResultsV2Controller r) {
  final brands = r.meta?.brands ?? const [];
  final picked = {...r.filters.brandIds};
  _sheet<void>(context, 'البراند', (ctx) => StatefulBuilder(
        builder: (ctx, setS) {
          final t = ctx.worldTheme;
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    for (final b in brands)
                      CheckboxListTile(
                        value: picked.contains(b.id),
                        onChanged: (v) => setS(() => v == true ? picked.add(b.id) : picked.remove(b.id)),
                        activeColor: t.accent,
                        title: Text(b.name, style: AppText.body.copyWith(color: t.ink)),
                        secondary: Text('${b.count}', style: AppText.caption.copyWith(color: t.inkMuted)),
                        controlAffinity: ListTileControlAffinity.trailing,
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: Row(
                  children: [
                    TextButton(onPressed: () => setS(picked.clear), child: const Text('مسح')),
                    const Spacer(),
                    FilledButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        r.setFilters(r.filters.copyWith(brandIds: picked));
                      },
                      child: const Text('عرض النتائج'),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ));
}

void _pickPrice(BuildContext context, SearchResultsV2Controller r) {
  const ranges = <(String, int?, int?)>[
    ('أقل من 10 آلاف', null, 10000),
    ('10 – 25 ألف', 10000, 25000),
    ('25 – 50 ألف', 25000, 50000),
    ('50 – 100 ألف', 50000, 100000),
    ('فوق 100 ألف', 100000, null),
  ];
  final f = r.filters;
  _sheet<void>(context, 'السعر', (ctx) => ListView(
        shrinkWrap: true,
        children: [
          _option(ctx, 'أي سعر', f.minPrice == null && f.maxPrice == null, () {
            Navigator.pop(ctx);
            r.setFilters(f.copyWith(clearPrice: true));
          }),
          for (final (label, min, max) in ranges)
            _option(ctx, label, f.minPrice == min && f.maxPrice == max && (min != null || max != null), () {
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
              ));
            }),
        ],
      ));
}
