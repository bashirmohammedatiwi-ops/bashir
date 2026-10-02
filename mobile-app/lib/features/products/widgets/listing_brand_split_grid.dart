import 'package:flutter/material.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/product_grid.dart';
import '../../../core/widgets/scroll_perf.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../data/models/product.dart';
import '../../worlds/world_theme.dart';
import 'listing_theme.dart';

/// قائمة منتجات براند مقسّمة: داخل القسم ثم فاصل ثم باقي منتجات البراند.
class ListingBrandSplitGrid extends StatelessWidget {
  final ScrollController? controller;
  final List<Product> inCategory;
  final List<Product> otherCategories;
  final Widget? header;
  final String inCategoryLabel;
  final String otherLabel;
  final String dividerLabel;
  final bool showPromoBadge;
  final bool showRating;
  final int extraSlots;
  final EdgeInsetsGeometry padding;

  const ListingBrandSplitGrid({
    super.key,
    required this.inCategory,
    required this.otherCategories,
    this.header,
    required this.inCategoryLabel,
    required this.otherLabel,
    required this.dividerLabel,
    this.controller,
    this.showPromoBadge = false,
    this.showRating = true,
    this.extraSlots = 0,
    this.padding = const EdgeInsets.fromLTRB(ListingTheme.padH, 10, ListingTheme.padH, 32),
  });

  @override
  Widget build(BuildContext context) {
    final delegate = ProductGrid.delegateFor(context, listing: true);
    final showDivider = inCategory.isNotEmpty && otherCategories.isNotEmpty;
    final showOtherHeader = otherCategories.isNotEmpty;

    return CustomScrollView(
      controller: controller,
      physics: AppScrollPerf.physics,
      cacheExtent: AppScrollPerf.gridCacheExtent,
      slivers: [
        if (header != null) SliverToBoxAdapter(child: header!),
        if (inCategory.isNotEmpty) ...[
          SliverToBoxAdapter(
            child: _SectionHeading(
              label: inCategoryLabel,
              icon: Icons.grid_view_rounded,
              emphasized: true,
            ),
          ),
          _productSliver(
            context: context,
            delegate: delegate,
            products: inCategory,
            extraSlots: 0,
            padding: const EdgeInsets.fromLTRB(ListingTheme.padH, 10, ListingTheme.padH, 6),
          ),
        ],
        if (showDivider)
          SliverToBoxAdapter(
            child: BrandCategorySectionDivider(label: dividerLabel),
          ),
        if (showOtherHeader) ...[
          SliverToBoxAdapter(
            child: _SectionHeading(
              label: otherLabel,
              icon: Icons.layers_rounded,
              emphasized: false,
            ),
          ),
          _productSliver(
            context: context,
            delegate: delegate,
            products: otherCategories,
            extraSlots: extraSlots,
            padding: const EdgeInsets.fromLTRB(ListingTheme.padH, 4, ListingTheme.padH, 32),
          ),
        ],
        if (extraSlots > 0 && !showOtherHeader && inCategory.isNotEmpty)
          SliverPadding(
            padding: padding,
            sliver: SliverGrid(
              gridDelegate: delegate,
              delegate: SliverChildBuilderDelegate(
                (_, __) => ShimmerBox(height: double.infinity, radius: AppRadius.lg),
                childCount: extraSlots,
              ),
            ),
          ),
      ],
    );
  }

  SliverPadding _productSliver({
    required BuildContext context,
    required SliverGridDelegate delegate,
    required List<Product> products,
    required int extraSlots,
    EdgeInsetsGeometry? padding,
  }) {
    final itemCount = products.length + extraSlots;

    return SliverPadding(
      padding: padding ?? this.padding,
      sliver: SliverGrid(
        gridDelegate: delegate,
        delegate: SliverChildBuilderDelegate(
          (context, i) {
            if (i >= products.length) {
              return ShimmerBox(height: double.infinity, radius: AppRadius.lg);
            }
            final product = products[i];
            return RepaintBoundary(
              child: ProductCard(
                key: ValueKey('split_${product.id}'),
                product: product,
                showPromoBadge: showPromoBadge,
                showRating: showRating,
                lite: false,
                style: ProductCardStyle.listing,
              ),
            );
          },
          childCount: itemCount,
          addAutomaticKeepAlives: false,
          addRepaintBoundaries: true,
          findChildIndexCallback: (key) {
            if (key is! ValueKey<String>) return null;
            final raw = key.value;
            if (!raw.startsWith('split_')) return null;
            final id = raw.substring(6);
            final index = products.indexWhere((p) => p.id == id);
            return index >= 0 ? index : null;
          },
        ),
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool emphasized;

  const _SectionHeading({
    required this.label,
    required this.icon,
    required this.emphasized,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(ListingTheme.padH, 12, ListingTheme.padH, 4),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: emphasized ? t.accentLight : t.surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: emphasized ? t.accentSoft : t.hairline,
              ),
            ),
            child: Icon(
              icon,
              size: 15,
              color: emphasized ? t.accent : t.inkMuted,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: emphasized ? 14.5 : 13.5,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.15,
                color: emphasized ? t.ink : t.inkSoft,
                height: 1.2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// فاصل أنيق بين منتجات البراند في القسم وباقي البراند.
class BrandCategorySectionDivider extends StatelessWidget {
  final String label;

  const BrandCategorySectionDivider({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(ListingTheme.padH, 14, ListingTheme.padH, 4),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _DividerLine(color: t.accent.withValues(alpha: 0.18)),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        t.accentLight.withValues(alpha: 0.95),
                        t.surface,
                      ],
                      begin: AlignmentDirectional.centerStart,
                      end: AlignmentDirectional.centerEnd,
                    ),
                    borderRadius: BorderRadius.circular(99),
                    border: Border.all(color: t.accentSoft.withValues(alpha: 0.85)),
                    boxShadow: [
                      BoxShadow(
                        color: t.accent.withValues(alpha: 0.08),
                        blurRadius: 14,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.swap_vert_rounded, size: 16, color: t.accent),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          label,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w800,
                            color: t.accentDark,
                            height: 1.15,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: _DividerLine(color: t.accent.withValues(alpha: 0.18)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DividerLine extends StatelessWidget {
  final Color color;

  const _DividerLine({required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 1,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withValues(alpha: 0.05), color, color.withValues(alpha: 0.05)],
        ),
      ),
    );
  }
}

extension BrandSplitListingLabels on AppStrings {
  String brandInThisSection(String categoryName, int count) => isAr
      ? 'في $categoryName · $count ${count == 1 ? 'منتج' : 'منتجات'}'
      : 'In $categoryName · $count ${count == 1 ? 'product' : 'products'}';

  String brandInOtherSections(String brandName, int count) => isAr
      ? 'باقي $brandName · $count ${count == 1 ? 'منتج' : 'منتجات'}'
      : 'More $brandName · $count ${count == 1 ? 'product' : 'products'}';

  String brandSplitDivider(String brandName) => isAr
      ? 'منتجات $brandName في أقسام أخرى'
      : '$brandName in other categories';
}
