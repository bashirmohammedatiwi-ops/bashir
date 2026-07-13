import 'package:flutter/material.dart';

import '../../data/models/product.dart';
import '../theme/app_spacing.dart';
import 'product_card.dart';

/// قائمة منتجات أفقية محسّنة — `cacheExtent` + `RepaintBoundary` لكل بطاقة.
class HorizontalProductList extends StatelessWidget {
  final List<Product> products;
  final bool showRating;
  final bool showPromoBadge;
  final double itemWidth;

  const HorizontalProductList({
    super.key,
    required this.products,
    this.showRating = true,
    this.showPromoBadge = false,
    this.itemWidth = AppSpacing.productCardWidth,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: AppSpacing.productRowHeight,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, 0, AppSpacing.md, AppSpacing.lg),
        cacheExtent: 320,
        itemCount: products.length,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.cardGap),
        itemBuilder: (_, i) => RepaintBoundary(
          child: ProductCard(
            key: ValueKey(products[i].id),
            product: products[i],
            width: itemWidth,
            showRating: showRating,
            showPromoBadge: showPromoBadge,
          ),
        ),
      ),
    );
  }
}
