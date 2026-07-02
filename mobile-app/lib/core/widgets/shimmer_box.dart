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
    return ListView(
      padding: EdgeInsets.zero,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        const ShimmerBox(height: 360, radius: 0),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: List.generate(
              5,
              (_) => const Padding(
                padding: EdgeInsets.only(left: 10),
                child: ShimmerBox(width: 56, height: 56, radius: 28),
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: ShimmerBox(height: 18, width: 140),
        ),
        const SizedBox(height: 12),
        const HorizontalProductsSkeleton(),
        const SizedBox(height: 8),
        const HorizontalProductsSkeleton(),
      ],
    );
  }
}
