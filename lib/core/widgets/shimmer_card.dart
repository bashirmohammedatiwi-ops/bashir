import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../constants/app_colors.dart';
import '../constants/app_sizes.dart';

class ShimmerCard extends StatelessWidget {
  const ShimmerCard({super.key, this.height = 220, this.width});

  final double height;
  final double? width;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.divider,
      highlightColor: AppColors.accent,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.divider,
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
        ),
      ),
    );
  }
}

class ShimmerProductGrid extends StatelessWidget {
  const ShimmerProductGrid({super.key, this.count = 6});

  final int count;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.80,
        crossAxisSpacing: 12,
        mainAxisSpacing: 6,
      ),
      itemCount: count,
      itemBuilder: (context, index) => const ShimmerCard(),
    );
  }
}
