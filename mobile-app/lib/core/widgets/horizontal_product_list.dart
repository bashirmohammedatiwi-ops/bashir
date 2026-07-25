import 'package:flutter/material.dart';

import '../../data/models/product.dart';
import '../theme/app_spacing.dart';
import 'product_card.dart';
import 'scroll_perf.dart';

/// قائمة منتجات أفقية محسّنة — للتمرير السريع بدون تقطيع.
class HorizontalProductList extends StatelessWidget {
  final List<Product> products;
  final bool showRating;
  final bool showPromoBadge;
  final double itemWidth;
  final double height;
  final EdgeInsetsGeometry? padding;

  const HorizontalProductList({
    super.key,
    required this.products,
    this.showRating = true,
    this.showPromoBadge = false,
    this.itemWidth = AppSpacing.productCardWidth,
    this.height = AppSpacing.productRowHeight,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return AppHorizontalList(
      height: height,
      padding: padding ??
          const EdgeInsets.fromLTRB(AppSpacing.md, 0, AppSpacing.md, AppSpacing.lg),
      itemCount: products.length,
      itemBuilder: (_, i) => RepaintBoundary(
        child: ProductCard(
          key: ValueKey(products[i].id),
          product: products[i],
          width: itemWidth,
          showRating: showRating,
          showPromoBadge: showPromoBadge,
          lite: true,
        ),
      ),
    );
  }
}
