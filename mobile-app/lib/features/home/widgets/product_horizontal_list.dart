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
      height: 278,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: AppSizes.xl),
        itemCount: products.length,
        itemBuilder: (context, index) {
          return SizedBox(
            width: 160,
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
