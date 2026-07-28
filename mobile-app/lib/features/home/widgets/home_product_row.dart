import 'package:flutter/material.dart';

import '../../../core/utils/responsive.dart';
import '../../../data/models/product.dart';
import 'home_product_card.dart';
import 'home_scroll_perf.dart';
import 'home_theme.dart';

class HomeProductRow extends StatelessWidget {
  final List<Product> products;
  final bool showPromoBadge;
  final double itemWidth;
  final EdgeInsetsGeometry? padding;

  const HomeProductRow({
    super.key,
    required this.products,
    this.showPromoBadge = false,
    this.itemWidth = HomeTheme.productCardWidth,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final width = itemWidth == HomeTheme.productCardWidth
        ? Responsive.productCardWidth(context)
        : itemWidth;
    final height = Responsive.productCardHeight(context);
    return HomeHorizontalList(
      height: height + 4,
      padding: padding ??
          EdgeInsets.symmetric(horizontal: Responsive.horizontalPadding(context)),
      itemCount: products.length,
      itemBuilder: (_, i) => RepaintBoundary(
        child: HomeProductCard(
          key: ValueKey(products[i].id),
          product: products[i],
          width: width,
          height: height,
          showPromoBadge: showPromoBadge,
        ),
      ),
    );
  }
}
