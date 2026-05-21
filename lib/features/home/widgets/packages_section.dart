import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/widgets/cached_image_widget.dart';
import '../../../data/mock/mock_packages.dart';
import '../../../data/mock/mock_products.dart';
import '../../../data/models/product_package_model.dart';
import '../../../data/models/product_model.dart';

/// قسم الباقات — مجموعات منتجات بسعر مخفّض.
class PackagesSection extends StatelessWidget {
  const PackagesSection({super.key});

  @override
  Widget build(BuildContext context) {
    final packages = MockPackages.featured;

    return SizedBox(
      height: 228,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: packages.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(left: 12),
            child: _PackageCard(package: packages[index]),
          );
        },
      ),
    );
  }
}

class _PackageCard extends StatelessWidget {
  const _PackageCard({required this.package});

  final ProductPackageModel package;

  List<ProductModel> get _products => package.productIds
      .map(MockProducts.findById)
      .whereType<ProductModel>()
      .toList();

  @override
  Widget build(BuildContext context) {
    final products = _products;

    return GestureDetector(
      onTap: () => context.push('/package/${package.id}'),
      child: Container(
        width: 272,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.divider),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 16,
              offset: Offset(0, 6),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: 118,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedImageWidget(
                    imageUrl: package.coverImageUrl,
                    fit: BoxFit.cover,
                  ),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Color(0x1A000000),
                          Color(0x99000000),
                        ],
                      ),
                    ),
                  ),
                  if (package.badge != null)
                    PositionedDirectional(
                      top: 10,
                      start: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.gold,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          package.badge!,
                          style: AppTextStyles.caption(
                            color: AppColors.primaryDark,
                            size: 9,
                          ).copyWith(
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                    ),
                  PositionedDirectional(
                    bottom: 10,
                    start: 10,
                    end: 10,
                    child: _ProductThumbsRow(products: products),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      package.name,
                      style: AppTextStyles.title(size: 13.5).copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.2,
                        height: 1.2,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${package.itemCount} منتجات • ${package.subtitle}',
                      style: AppTextStyles.caption(
                        color: AppColors.textMuted,
                        size: 10,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                CurrencyFormatter.format(package.price),
                                style: AppTextStyles.headline(
                                  color: AppColors.textPrimary,
                                  size: 15,
                                ).copyWith(
                                  fontWeight: FontWeight.w800,
                                  height: 1.1,
                                ),
                              ),
                              if (package.savingsPercent > 0)
                                Text(
                                  CurrencyFormatter.format(
                                    package.originalPrice,
                                  ),
                                  style: AppTextStyles.caption(size: 9.5)
                                      .copyWith(
                                    decoration: TextDecoration.lineThrough,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.canvas,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Text(
                            '-${package.savingsPercent}%',
                            style: AppTextStyles.caption(
                              color: AppColors.primary,
                              size: 10,
                            ).copyWith(fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductThumbsRow extends StatelessWidget {
  const _ProductThumbsRow({required this.products});

  final List<ProductModel> products;

  @override
  Widget build(BuildContext context) {
    final visible = products.take(4).toList();
    final extra = products.length - visible.length;
    final count = visible.length + (extra > 0 ? 1 : 0);
    final width = 34.0 + (count - 1) * 22;

    return SizedBox(
      height: 34,
      width: width,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          for (var i = 0; i < visible.length; i++)
            PositionedDirectional(
              start: i * 22.0,
              child: Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
                clipBehavior: Clip.antiAlias,
                child: visible[i].images.isNotEmpty
                    ? CachedImageWidget(
                        imageUrl: visible[i].images.first,
                        fit: BoxFit.cover,
                      )
                    : const Icon(Icons.spa_outlined, size: 16),
              ),
            ),
          if (extra > 0)
            PositionedDirectional(
              start: visible.length * 22.0,
              child: Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppColors.textPrimary,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
                child: Center(
                  child: Text(
                    '+$extra',
                    style: AppTextStyles.caption(
                      color: Colors.white,
                      size: 10,
                    ).copyWith(fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
