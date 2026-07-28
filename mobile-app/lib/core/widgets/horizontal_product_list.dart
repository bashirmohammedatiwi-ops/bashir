import 'package:flutter/material.dart';

import '../../data/models/product.dart';
import '../theme/app_spacing.dart';
import '../utils/responsive.dart';
import 'product_card.dart';
import 'scroll_perf.dart';

/// قائمة منتجات أفقية محسّنة — للتمرير السريع بدون تقطيع.
class HorizontalProductList extends StatelessWidget {
  final List<Product> products;
  final bool showRating;
  final bool showPromoBadge;
  final double? itemWidth;
  final double? height;
  final EdgeInsetsGeometry? padding;

  const HorizontalProductList({
    super.key,
    required this.products,
    this.showRating = true,
    this.showPromoBadge = false,
    this.itemWidth,
    this.height,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final width = itemWidth ?? Responsive.productCardWidth(context);
    final listHeight = height ?? Responsive.productRowHeight(context);
    return AppHorizontalList(
      height: listHeight,
      padding: padding ??
          EdgeInsets.fromLTRB(
            Responsive.horizontalPadding(context),
            0,
            Responsive.horizontalPadding(context),
            AppSpacing.lg,
          ),
      itemCount: products.length,
      itemBuilder: (_, i) => RepaintBoundary(
        child: ProductCard(
          key: ValueKey(products[i].id),
          product: products[i],
          width: width,
          showRating: showRating,
          showPromoBadge: showPromoBadge,
          lite: true,
        ),
      ),
    );
  }
}
