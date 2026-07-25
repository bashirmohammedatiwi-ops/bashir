import 'package:flutter/material.dart';

import '../../../core/widgets/shimmer_box.dart';
import 'offers_theme.dart';

class OffersLoadingView extends StatelessWidget {
  const OffersLoadingView({super.key});

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;

    return OffersCanvas(
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(OffersTheme.hPad, top + 12, OffersTheme.hPad, 16),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerBox(height: 28, width: 120, radius: 8),
                  SizedBox(height: 8),
                  ShimmerBox(height: 14, width: 180, radius: 6),
                  SizedBox(height: 16),
                  ShimmerBox(height: 36, radius: 999),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(OffersTheme.hPad, 8, OffersTheme.hPad, 0),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.58,
              ),
              delegate: SliverChildBuilderDelegate(
                (_, __) => const ShimmerBox(height: double.infinity, radius: OffersTheme.cardRadius),
                childCount: 6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

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
