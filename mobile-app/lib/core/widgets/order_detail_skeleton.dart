import 'package:flutter/material.dart';

import '../theme/app_spacing.dart';
import 'shimmer_box.dart';

/// هيكل تحميل صفحة تفاصيل الطلب.
class OrderDetailSkeleton extends StatelessWidget {
  const OrderDetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      physics: const NeverScrollableScrollPhysics(),
      children: const [
        Row(
          children: [
            ShimmerBox(height: 22, width: 120),
            Spacer(),
            ShimmerBox(height: 14, width: 80),
          ],
        ),
        SizedBox(height: AppSpacing.lg),
        ShimmerBox(height: 70, radius: AppRadius.lg),
        SizedBox(height: AppSpacing.lg),
        ShimmerBox(height: 180, radius: AppRadius.lg),
        SizedBox(height: AppSpacing.md),
        ShimmerBox(height: 120, radius: AppRadius.lg),
        SizedBox(height: AppSpacing.md),
        ShimmerBox(height: 160, radius: AppRadius.lg),
        SizedBox(height: AppSpacing.lg),
        ShimmerBox(height: 52, radius: AppRadius.md),
      ],
    );
  }
}
