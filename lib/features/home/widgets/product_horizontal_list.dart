import 'package:flutter/material.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/widgets/product_card.dart';
import '../../../data/models/product_model.dart';

class ProductHorizontalList extends StatelessWidget {
  const ProductHorizontalList({
    super.key,
    required this.products,
  });

  final List<ProductModel> products;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 296,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
        itemCount: products.length,
        itemBuilder: (context, index) {
          return SizedBox(
            width: 168,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 5),
              child: ProductCard(
                product: products[index],
                index: index,
              ),
            ),
          );
        },
      ),
    );
  }
}
