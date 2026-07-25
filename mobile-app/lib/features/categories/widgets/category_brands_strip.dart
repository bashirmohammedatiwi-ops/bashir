import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/locale_provider.dart';
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

  static const _tileWidth = 82.0;
  static const _logoSize = 56.0;
  static const _rowGap = 10.0;
  static const _colGap = 10.0;
  static const _logoPadding = 8.0;

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
        padding: const EdgeInsets.symmetric(horizontal: 12),
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
      height: 56 + 34 + 10 + 56 + 34,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, __) => const SizedBox(
          width: 82,
          child: Column(
            children: [
              ShimmerBox(height: 56, width: 56, radius: 28),
              SizedBox(height: 8),
              ShimmerBox(height: 10, width: 64, radius: 4),
              SizedBox(height: 10),
              ShimmerBox(height: 56, width: 56, radius: 28),
              SizedBox(height: 8),
              ShimmerBox(height: 10, width: 64, radius: 4),
            ],
          ),
        ),
      ),
    );
  }
}

class _BrandTile extends ConsumerWidget {
  final Brand brand;
  final String? categoryId;
  final String? subcategoryId;

  const _BrandTile({
    required this.brand,
    this.categoryId,
    this.subcategoryId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final name = brand.localizedName(lang);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          final q = StringBuffer('brandId=${brand.id}&title=${Uri.encodeComponent(name)}');
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
            _BrandLogoCircle(
              brand: brand,
              size: CategoryBrandsStrip._logoSize,
              padding: CategoryBrandsStrip._logoPadding,
            ),
            const SizedBox(height: 6),
            Text(
              name,
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

class _BrandLogoCircle extends StatelessWidget {
  final Brand brand;
  final double size;
  final double padding;

  const _BrandLogoCircle({
    required this.brand,
    required this.size,
    required this.padding,
  });

  Color _fallbackBg() {
    final hex = brand.bgColorHex?.replaceFirst('#', '').trim();
    if (hex == null || hex.length < 6) return AppColors.primaryLight;
    try {
      return Color(int.parse('FF${hex.substring(0, 6)}', radix: 16));
    } catch (_) {
      return AppColors.primaryLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    final inner = size - (padding * 2);

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white,
        border: Border.all(color: AppColors.hairline.withValues(alpha: 0.85)),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipOval(
        child: Padding(
          padding: EdgeInsets.all(padding),
          child: brand.logoUrl.isNotEmpty
              ? AppNetworkImage(
                  url: brand.logoUrl,
                  width: inner,
                  height: inner,
                  fit: BoxFit.contain,
                  backgroundColor: Colors.white,
                )
              : ColoredBox(
                  color: _fallbackBg(),
                  child: Center(
                    child: Text(
                      brand.initial ?? brand.name.characters.first,
                      style: TextStyle(
                        fontSize: size * 0.34,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}
