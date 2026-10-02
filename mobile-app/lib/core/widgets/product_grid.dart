import 'package:flutter/material.dart';

import '../../data/models/product.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../utils/responsive.dart';
import '../widgets/scroll_perf.dart';
import 'product_card.dart';
import 'shimmer_box.dart';

/// شبكة منتجات موحّدة — تباعد، نسبة، وأداء متسق.
class ProductGrid extends StatelessWidget {
  final List<Product> products;
  final ScrollController? controller;
  final bool showPromoBadge;
  final bool showRating;
  final int extraSlots;
  /// صف ذيل صريح أسفل الشبكة عند تحميل المزيد.
  final bool loadingMore;
  /// إظهار علامة نهاية القائمة عند اكتمالها.
  final bool showEndMarker;
  final String? endMarkerLabel;
  final EdgeInsetsGeometry padding;
  final bool listingStyle;
  final Widget? header;

  const ProductGrid({
    super.key,
    required this.products,
    this.controller,
    this.showPromoBadge = false,
    this.showRating = true,
    this.extraSlots = 0,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.listingStyle = false,
    this.header,
    this.loadingMore = false,
    this.showEndMarker = false,
    this.endMarkerLabel,
  });

  static SliverGridDelegate delegateFor(BuildContext context, {bool listing = false}) {
    final cols = Responsive.gridColumns(context);
    final spacing = Responsive.gridSpacing(context);
    return SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: cols,
      childAspectRatio: Responsive.gridChildAspectRatio(context, listing: listing),
      crossAxisSpacing: spacing,
      mainAxisSpacing: listing ? 14 : spacing,
    );
  }

  int? _indexForKey(Key key) {
    if (key is! ValueKey<String>) return null;
    final id = key.value;
    final index = products.indexWhere((p) => p.id == id);
    return index >= 0 ? index : null;
  }

  @override
  Widget build(BuildContext context) {
    final delegate = delegateFor(context, listing: listingStyle);
    final extra = loadingMore ? 0 : extraSlots;
    final itemCount = products.length + extra;

    Widget itemBuilder(BuildContext context, int i) {
      if (i >= products.length) {
        return ShimmerBox(
          height: double.infinity,
          radius: listingStyle ? AppRadius.lg : AppRadius.md,
        );
      }
      final product = products[i];
      return RepaintBoundary(
        child: ProductCard(
          key: ValueKey(product.id),
          product: product,
          showPromoBadge: showPromoBadge,
          showRating: showRating,
          lite: !listingStyle,
          style: listingStyle ? ProductCardStyle.listing : ProductCardStyle.standard,
        ),
      );
    }

    final footer = _buildFooter(context);

    if (header != null) {
      return CustomScrollView(
        controller: controller,
        physics: AppScrollPerf.physics,
        cacheExtent: AppScrollPerf.gridCacheExtent,
        slivers: [
          SliverToBoxAdapter(child: header!),
          SliverPadding(
            padding: padding,
            sliver: SliverGrid(
              gridDelegate: delegate,
              delegate: SliverChildBuilderDelegate(
                itemBuilder,
                childCount: itemCount,
                addAutomaticKeepAlives: false,
                addRepaintBoundaries: true,
                findChildIndexCallback: _indexForKey,
              ),
            ),
          ),
          if (footer != null) SliverToBoxAdapter(child: footer),
        ],
      );
    }

    return CustomScrollView(
      controller: controller,
      physics: AppScrollPerf.physics,
      cacheExtent: AppScrollPerf.gridCacheExtent,
      slivers: [
        SliverPadding(
          padding: padding,
          sliver: SliverGrid(
            gridDelegate: delegate,
            delegate: SliverChildBuilderDelegate(
              itemBuilder,
              childCount: itemCount,
              addAutomaticKeepAlives: false,
              addRepaintBoundaries: true,
              findChildIndexCallback: _indexForKey,
            ),
          ),
        ),
        if (footer != null) SliverToBoxAdapter(child: footer),
      ],
    );
  }

  /// صف ذيل صريح: «يحمّل المزيد» أو علامة نهاية القائمة.
  Widget? _buildFooter(BuildContext context) {
    if (loadingMore) {
      return Padding(
        padding: const EdgeInsets.only(top: 14, bottom: 6),
        child: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 15,
                height: 15,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
              ),
              const SizedBox(width: 8),
              Text(
                endMarkerLabel ?? (Localizations.localeOf(context).languageCode == 'ar' ? 'يحمّل المزيد…' : 'Loading more…'),
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }
    if (showEndMarker && products.length > 5) {
      final isAr = Localizations.localeOf(context).languageCode == 'ar';
      return Padding(
        padding: const EdgeInsets.only(top: 14, bottom: 6),
        child: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 28, height: 1, color: AppColors.border),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  endMarkerLabel ?? (isAr ? 'وصلت لنهاية القائمة' : 'You reached the end'),
                  style: const TextStyle(fontSize: 11.5, color: AppColors.textMuted),
                ),
              ),
              Container(width: 28, height: 1, color: AppColors.border),
            ],
          ),
        ),
      );
    }
    return null;
  }
}
