import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/widgets/cached_image_widget.dart';
import '../../../data/models/product_package_model.dart';

class PackagesSection extends StatelessWidget {
  const PackagesSection({required this.packages, super.key});

  final List<ProductPackageModel> packages;

  @override
  Widget build(BuildContext context) {
    final list = packages;
    if (list.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 228,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: list.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(left: 12),
            child: _PackageCard(package: list[index]),
          );
        },
      ),
    );
  }
}

class _PackageCard extends StatelessWidget {
  const _PackageCard({required this.package});

  final ProductPackageModel package;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/package/${package.id}'),
      child: Container(
        width: 272,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.divider),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: 118,
              child: CachedImageWidget(
                imageUrl: package.coverImageUrl,
                fit: BoxFit.cover,
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(package.name, style: AppTextStyles.title(size: 14)),
                  Text(
                    package.subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.caption(),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    CurrencyFormatter.format(package.price),
                    style: AppTextStyles.title(color: AppColors.primary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
