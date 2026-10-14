import 'package:flutter/material.dart';

import '../../../core/widgets/product_card.dart';
import '../../../data/models/product.dart';
import 'home_theme.dart';

/// بطاقة منتج الرئيسية — نفس البطاقة الموحّدة في كل التطبيق بمقاس الرئيسية.
class HomeProductCard extends StatelessWidget {
  final Product product;
  final double width;
  final double height;
  final bool showPromoBadge;

  const HomeProductCard({
    super.key,
    required this.product,
    this.width = HomeTheme.productCardWidth,
    this.height = HomeTheme.productCardHeight,
    this.showPromoBadge = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: ProductCard(
        product: product,
        width: width,
        lite: true,
        showPromoBadge: showPromoBadge,
      ),
    );
  }
}
