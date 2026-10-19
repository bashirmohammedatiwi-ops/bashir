import 'package:flutter/material.dart';

import '../../features/worlds/world_theme.dart';
import '../brand/brand_logo.dart';
import '../theme/app_spacing.dart';
import '../theme/app_text.dart';
import '../utils/responsive.dart';
import 'shimmer_box.dart';

/// هيكل تحميل صفحة تفاصيل المنتج.
///
/// المعرض أبيض بعلامة المتجر وبارتفاع المعرض الحقيقي — كما يبدو قبل وصول الصورة —
/// والبيانات تحته تحت وميض واحد.
class ProductDetailSkeleton extends StatelessWidget {
  const ProductDetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return ListView(
      padding: EdgeInsets.zero,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        SizedBox(
          height: Responsive.galleryExpandedHeight(context, hasThumbs: false),
          child: ColoredBox(
            color: Colors.white,
            child: Center(child: BrandMark(height: 44, color: t.hairline)),
          ),
        ),
        const Skeleton(
          child: Padding(
            padding: EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBlock(height: 14, width: 80),
                SizedBox(height: AppSpacing.sm),
                SkeletonBlock(height: 22, width: double.infinity),
                SizedBox(height: AppSpacing.sm),
                SkeletonBlock(height: 22, width: 200),
                SizedBox(height: AppSpacing.lg),
                SkeletonBlock(height: 32, width: 140),
                SizedBox(height: AppSpacing.lg),
                SkeletonBlock(height: 48, width: double.infinity, radius: AppCorners.md),
                SizedBox(height: AppSpacing.lg),
                SkeletonBlock(height: 120, width: double.infinity, radius: AppCorners.md),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
