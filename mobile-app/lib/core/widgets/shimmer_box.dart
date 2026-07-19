import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/app_colors.dart';

class ShimmerBox extends StatelessWidget {
  final double? width;
  final double height;
  final double radius;
  const ShimmerBox({super.key, this.width, this.height = 16, this.radius = 8});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.shimmerBase,
      highlightColor: AppColors.shimmerHighlight,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
    );
  }
}

/// شبكة هياكل تحميل لبطاقات المنتجات.
class ProductGridSkeleton extends StatelessWidget {
  final int count;
  const ProductGridSkeleton({super.key, this.count = 6});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.62,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: count,
      itemBuilder: (_, __) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: const [
          Expanded(child: ShimmerBox(height: double.infinity, radius: 16)),
          SizedBox(height: 8),
          ShimmerBox(height: 12, width: 60),
          SizedBox(height: 6),
          ShimmerBox(height: 12),
          SizedBox(height: 6),
          ShimmerBox(height: 14, width: 80),
        ],
      ),
    );
  }
}

class HorizontalProductsSkeleton extends StatelessWidget {
  const HorizontalProductsSkeleton({super.key});
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 250,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, __) => const SizedBox(
          width: 150,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: ShimmerBox(height: double.infinity, radius: 16)),
              SizedBox(height: 8),
              ShimmerBox(height: 12),
              SizedBox(height: 6),
              ShimmerBox(height: 14, width: 70),
            ],
          ),
        ),
      ),
    );
  }
}

/// هيكل تحميل الصفحة الرئيسية — يشبه التخطيط الفعلي.
class HomeLoadingSkeleton extends StatelessWidget {
  const HomeLoadingSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final heroH = MediaQuery.sizeOf(context).height * 0.38;
    return DecoratedBox(
      decoration: const BoxDecoration(gradient: AppColors.homeBackgroundGradient),
      child: ListView(
        padding: EdgeInsets.zero,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
            child: ShimmerBox(height: heroH, radius: 0),
          ),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: List.generate(
              5,
              (_) => const Padding(
                padding: EdgeInsets.only(left: 12),
                child: ShimmerBox(width: 60, height: 60, radius: 30),
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.04),
                  blurRadius: 20,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: const Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerBox(height: 20, width: 160, radius: 8),
                  SizedBox(height: 16),
                  HorizontalProductsSkeleton(),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: HorizontalProductsSkeleton(),
        ),
      ],
      ),
    );
  }
}
