import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/product_visuals.dart';
import '../../../core/widgets/product_showcase.dart';
import '../../../data/models/brand_model.dart';
import '../../../data/models/product_model.dart';

/// Hero banner when browsing a single brand's catalog.
class BrandListingBanner extends StatelessWidget {
  const BrandListingBanner({
    super.key,
    required this.brand,
    required this.featuredProduct,
    required this.productCount,
  });

  final BrandModel brand;
  final ProductModel featuredProduct;
  final int productCount;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      height: 168,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [AppColors.cardShadow],
      ),
      child: Row(
        children: [
          Expanded(
            flex: 5,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 8, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    brand.name,
                    style: AppTextStyles.headline(size: 22),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '$productCount منتج',
                    style: AppTextStyles.caption(color: AppColors.primary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    featuredProduct.name,
                    style: AppTextStyles.body(size: 12),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            flex: 4,
            child: ClipRRect(
              borderRadius: const BorderRadius.horizontal(
                left: Radius.circular(20),
              ),
              child: ProductShowcase.forProduct(
                product: featuredProduct,
                imageUrl: featuredProduct.images.first,
                layout: ProductShowcaseLayout.brandSpotlight,
                height: 168,
                width: double.infinity,
                borderRadius: const BorderRadius.horizontal(
                  left: Radius.circular(20),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
