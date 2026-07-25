import 'package:flutter/material.dart';

import '../../data/models/product.dart';
import '../theme/app_spacing.dart';
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
  final EdgeInsetsGeometry padding;
  final bool listingStyle;

  const ProductGrid({
    super.key,
    required this.products,
    this.controller,
    this.showPromoBadge = false,
    this.showRating = true,
    this.extraSlots = 0,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.listingStyle = false,
  });

  static const _standardDelegate = SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    childAspectRatio: 0.62,
    crossAxisSpacing: AppSpacing.md,
    mainAxisSpacing: AppSpacing.md,
  );

  static const _listingDelegate = SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    childAspectRatio: 0.56,
    crossAxisSpacing: 12,
    mainAxisSpacing: 14,
  );

  static const gridDelegate = _standardDelegate;

  int? _indexForKey(Key key) {
    if (key is! ValueKey<String>) return null;
    final id = key.value;
    final index = products.indexWhere((p) => p.id == id);
    return index >= 0 ? index : null;
  }

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      controller: controller,
      padding: padding,
      physics: AppScrollPerf.physics,
      cacheExtent: AppScrollPerf.gridCacheExtent,
      addAutomaticKeepAlives: false,
      addRepaintBoundaries: true,
      gridDelegate: listingStyle ? _listingDelegate : _standardDelegate,
      itemCount: products.length + extraSlots,
      findChildIndexCallback: _indexForKey,
      itemBuilder: (_, i) {
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
      },
    );
  }
}
