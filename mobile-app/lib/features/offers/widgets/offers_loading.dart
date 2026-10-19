import 'package:flutter/material.dart';

import '../../../core/theme/app_text.dart';
import '../../../core/widgets/product_grid.dart';
import '../../../core/widgets/shimmer_box.dart';
import 'offers_theme.dart';

/// هيكل أول فتح للعروض — بنفس مقاسات الرأس والشبكة الحقيقية فلا تقفز الصفحة عند الوصول.
class OffersLoadingView extends StatelessWidget {
  const OffersLoadingView({super.key});

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;

    return OffersCanvas(
      child: CustomScrollView(
        physics: const NeverScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(OffersTheme.hPad, top + 6, OffersTheme.hPad, 10),
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
                decoration: OffersTheme.heroDecoration(context),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        ShimmerBox(height: 44, width: 44, radius: 14),
                        SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ShimmerBox(height: 20, width: 110, radius: AppCorners.xs),
                            SizedBox(height: 6),
                            ShimmerBox(height: 12, width: 170, radius: 6),
                          ],
                        ),
                      ],
                    ),
                    SizedBox(height: 14),
                    ShimmerBox(height: 48, radius: 14),
                    SizedBox(height: 14),
                    Row(
                      children: [
                        ShimmerBox(height: kMinTapTarget, width: 112, radius: AppCorners.pill),
                        SizedBox(width: 8),
                        ShimmerBox(height: kMinTapTarget, width: 128, radius: AppCorners.pill),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SliverToBoxAdapter(child: OffersCmsSkeleton()),
          const OffersGridSkeleton(count: 4),
        ],
      ),
    );
  }
}

/// مكان قسم لوحة تحكم لم يصل بعد.
class OffersCmsSkeleton extends StatelessWidget {
  const OffersCmsSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(OffersTheme.hPad, 4, OffersTheme.hPad, 10),
      child: ShimmerBox(height: 140, radius: OffersTheme.cardRadius),
    );
  }
}

/// بطاقات شبكة العروض أثناء التحميل (sliver) — نفس أعمدة ونسب الشبكة الحقيقية.
class OffersGridSkeleton extends StatelessWidget {
  final int count;
  final double bottomPad;

  const OffersGridSkeleton({super.key, this.count = 6, this.bottomPad = 0});

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: EdgeInsets.fromLTRB(OffersTheme.hPad, 8, OffersTheme.hPad, bottomPad),
      sliver: SliverGrid(
        gridDelegate: ProductGrid.delegateFor(context, listing: true),
        delegate: SliverChildBuilderDelegate(
          (_, __) => const ShimmerBox(height: double.infinity, radius: OffersTheme.cardRadius),
          childCount: count,
        ),
      ),
    );
  }
}
