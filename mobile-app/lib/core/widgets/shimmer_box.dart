import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../features/worlds/world_theme.dart';

class ShimmerBox extends StatelessWidget {
  final double? width;
  final double height;
  final double radius;
  const ShimmerBox({super.key, this.width, this.height = 16, this.radius = 8});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Shimmer.fromColors(
      baseColor: Color.lerp(t.canvasWarm, t.hairline, 0.35)!,
      highlightColor: t.surface,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: t.canvasWarm,
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
    // نفس هيكل الرئيسية الفعلي: كتلة بلون العالم ثم ورقة بيضاء —
    // المحتوى يحلّ مكانه دون أي قفزة.
    final t = context.worldTheme;
    final top = MediaQuery.paddingOf(context).top;
    final band = Color.lerp(t.accent, Colors.black, 0.1)!;
    final width = MediaQuery.sizeOf(context).width;
    final tileW = (width - 16 - 40) / 4.3;

    Widget glass(double size) => Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white.withValues(alpha: 0.14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
          ),
        );

    return ColoredBox(
      color: t.surface,
      child: ListView(
        padding: EdgeInsets.zero,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          Container(
            color: band,
            padding: EdgeInsets.fromLTRB(18, top + 4, 18, 46),
            child: Row(
              children: [
                glass(44),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 64,
                      height: 9,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: 96,
                      height: 13,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                glass(44),
                const SizedBox(width: 8),
                glass(44),
              ],
            ),
          ),
          Transform.translate(
            offset: const Offset(0, -30),
            child: Container(
              decoration: BoxDecoration(
                color: t.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
              ),
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: t.hairline,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  const ShimmerBox(height: 52, radius: 26),
                  const SizedBox(height: 14),
                  const ShimmerBox(height: 86, radius: 22),
                  const SizedBox(height: 16),
                  ShimmerBox(height: (width * 0.9 - 12) / 2.15, radius: 24),
                  const SizedBox(height: 26),
                  const Row(
                    children: [
                      ShimmerBox(width: 120, height: 16, radius: 8),
                      Spacer(),
                      ShimmerBox(width: 70, height: 16, radius: 8),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      for (var i = 0; i < 4; i++) ...[
                        if (i > 0) const SizedBox(width: 10),
                        Column(
                          children: [
                            ShimmerBox(width: tileW, height: tileW, radius: 16),
                            const SizedBox(height: 7),
                            ShimmerBox(width: tileW * 0.6, height: 10, radius: 5),
                          ],
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
