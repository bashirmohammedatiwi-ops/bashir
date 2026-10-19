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

  /// نطاق وسم الصورة (`home-قسم`) للانتقال المشترك؛ إن لم يُمرّر فبصمة البطاقة نفسها.
  final String? heroScope;

  const HomeProductCard({
    super.key,
    required this.product,
    this.width = HomeTheme.productCardWidth,
    this.height = HomeTheme.productCardHeight,
    this.showPromoBadge = false,
    this.heroScope,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: ProductCard(
        product: product,
        heroTag: productHeroTag(productHeroScope(context, 'home', heroScope), product),
        width: width,
        lite: true,
        showPromoBadge: showPromoBadge,
      ),
    );
  }
}
