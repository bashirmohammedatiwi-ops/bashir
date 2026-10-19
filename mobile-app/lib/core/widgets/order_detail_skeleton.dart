import 'package:flutter/material.dart';

import '../theme/app_spacing.dart';
import '../theme/app_text.dart';
import 'shimmer_box.dart';

/// هيكل تحميل صفحة تفاصيل الطلب — وميض واحد للصفحة كلها.
class OrderDetailSkeleton extends StatelessWidget {
  const OrderDetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Skeleton(
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        physics: const NeverScrollableScrollPhysics(),
        children: const [
          Row(
            children: [
              SkeletonBlock(height: 22, width: 120),
              Spacer(),
              SkeletonBlock(height: 14, width: 80),
            ],
          ),
          SizedBox(height: AppSpacing.lg),
          SkeletonBlock(height: 70, radius: AppCorners.lg),
          SizedBox(height: AppSpacing.lg),
          SkeletonBlock(height: 180, radius: AppCorners.lg),
          SizedBox(height: AppSpacing.md),
          SkeletonBlock(height: 120, radius: AppCorners.lg),
          SizedBox(height: AppSpacing.md),
          SkeletonBlock(height: 160, radius: AppCorners.lg),
          SizedBox(height: AppSpacing.lg),
          SkeletonBlock(height: 52, radius: AppCorners.md),
        ],
      ),
    );
  }
}
