import 'package:flutter/material.dart';

import '../theme/app_spacing.dart';
import 'shimmer_box.dart';

/// هيكل تحميل صفحة تفاصيل المنتج.
class ProductDetailSkeleton extends StatelessWidget {
  const ProductDetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      physics: const NeverScrollableScrollPhysics(),
      slivers: [
        const SliverToBoxAdapter(
          child: ShimmerBox(height: 360, radius: 0),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                ShimmerBox(height: 14, width: 80),
                SizedBox(height: AppSpacing.sm),
                ShimmerBox(height: 22, width: double.infinity),
                SizedBox(height: AppSpacing.sm),
                ShimmerBox(height: 22, width: 200),
                SizedBox(height: AppSpacing.lg),
                ShimmerBox(height: 32, width: 140),
                SizedBox(height: AppSpacing.lg),
                ShimmerBox(height: 48, radius: AppRadius.md),
                SizedBox(height: AppSpacing.lg),
                ShimmerBox(height: 120, radius: AppRadius.md),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
