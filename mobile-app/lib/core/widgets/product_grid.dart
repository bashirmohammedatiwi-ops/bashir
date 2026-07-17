import 'package:flutter/material.dart';

import '../../data/models/product.dart';
import '../theme/app_spacing.dart';
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

  const ProductGrid({
    super.key,
    required this.products,
    this.controller,
    this.showPromoBadge = false,
    this.showRating = true,
    this.extraSlots = 0,
    this.padding = const EdgeInsets.all(AppSpacing.md),
  });

  static const gridDelegate = SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    childAspectRatio: 0.62,
    crossAxisSpacing: AppSpacing.md,
    mainAxisSpacing: AppSpacing.md,
  );

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      controller: controller,
      padding: padding,
      cacheExtent: 900,
      addAutomaticKeepAlives: true,
      gridDelegate: gridDelegate,
      itemCount: products.length + extraSlots,
      itemBuilder: (_, i) {
        if (i >= products.length) {
          return const ShimmerBox(height: double.infinity, radius: AppRadius.md);
        }
        return RepaintBoundary(
          child: ProductCard(
            key: ValueKey(products[i].id),
            product: products[i],
            showPromoBadge: showPromoBadge,
            showRating: showRating,
          ),
        );
      },
    );
  }
}
