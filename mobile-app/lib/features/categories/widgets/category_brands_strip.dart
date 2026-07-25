import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/scroll_perf.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../data/models/brand.dart';

/// شريط براندات بصفّين كحد أقصى مع تمرير أفقي.
class CategoryBrandsStrip extends StatelessWidget {
  final List<Brand> brands;
  final String? categoryId;
  final String? subcategoryId;

  const CategoryBrandsStrip({
    super.key,
    required this.brands,
    this.categoryId,
    this.subcategoryId,
  });

  static const _tileWidth = 78.0;
  static const _logoSize = 52.0;
  static const _rowGap = 10.0;
  static const _colGap = 10.0;

  @override
  Widget build(BuildContext context) {
    if (brands.isEmpty) return const SizedBox.shrink();

    final columns = (brands.length / 2).ceil();

    return SizedBox(
      height: _logoSize + 34 + _rowGap + _logoSize + 34,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: AppScrollPerf.physics,
        cacheExtent: AppScrollPerf.horizontalCacheExtent,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: columns,
        separatorBuilder: (_, __) => const SizedBox(width: _colGap),
        itemBuilder: (_, col) {
          final top = brands[col * 2];
          final bottomIndex = col * 2 + 1;
          final bottom = bottomIndex < brands.length ? brands[bottomIndex] : null;
          return SizedBox(
            width: _tileWidth,
            child: Column(
              children: [
                _BrandTile(
                  brand: top,
                  categoryId: categoryId,
                  subcategoryId: subcategoryId,
                ),
                const SizedBox(height: _rowGap),
                bottom != null
                    ? _BrandTile(
                        brand: bottom,
                        categoryId: categoryId,
                        subcategoryId: subcategoryId,
                      )
                    : const SizedBox(height: _logoSize + 34),
              ],
            ),
          );
        },
      ),
    );
  }
}

class CategoryBrandsStripLoading extends StatelessWidget {
  const CategoryBrandsStripLoading({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52 + 34 + 10 + 52 + 34,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, __) => const SizedBox(
          width: 78,
          child: Column(
            children: [
              ShimmerBox(height: 52, width: 52, radius: 26),
              SizedBox(height: 8),
              ShimmerBox(height: 10, width: 60, radius: 4),
              SizedBox(height: 10),
              ShimmerBox(height: 52, width: 52, radius: 26),
              SizedBox(height: 8),
              ShimmerBox(height: 10, width: 60, radius: 4),
            ],
          ),
        ),
      ),
    );
  }
}

class _BrandTile extends StatelessWidget {
  final Brand brand;
  final String? categoryId;
  final String? subcategoryId;

  const _BrandTile({
    required this.brand,
    this.categoryId,
    this.subcategoryId,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          final q = StringBuffer('brandId=${brand.id}&title=${Uri.encodeComponent(brand.name)}');
          if (subcategoryId != null) {
            q.write('&subcategoryId=$subcategoryId');
          } else if (categoryId != null) {
            q.write('&categoryId=$categoryId');
          }
          context.push('/products?${q.toString()}');
        },
        borderRadius: BorderRadius.circular(14),
        child: Column(
          children: [
            Container(
              width: CategoryBrandsStrip._logoSize,
              height: CategoryBrandsStrip._logoSize,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.surface,
                border: Border.all(color: AppColors.hairline),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.ink.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipOval(
                child: brand.logoUrl.isNotEmpty
                    ? AppNetworkImage(
                        url: brand.logoUrl,
                        width: CategoryBrandsStrip._logoSize,
                        height: CategoryBrandsStrip._logoSize,
                        fit: BoxFit.cover,
                      )
                    : ColoredBox(
                        color: AppColors.primaryLight,
                        child: Center(
                          child: Text(
                            brand.initial ?? brand.name.characters.first,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              brand.name,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 10,
                height: 1.2,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
