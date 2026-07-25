import 'package:flutter/material.dart';

import '../../../core/theme/app_spacing.dart';
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
              padding: EdgeInsets.fromLTRB(AppSpacing.lg, top + 10, AppSpacing.lg, 8),
              child: const ShimmerBox(height: 132, radius: OffersTheme.headerRadius),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Row(
                children: List.generate(
                  3,
                  (_) => const Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(left: 8),
                      child: ShimmerBox(height: 40, radius: 12),
                    ),
                  ),
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 16, AppSpacing.lg, 0),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.58,
              ),
              delegate: SliverChildBuilderDelegate(
                (_, __) => const ShimmerBox(height: double.infinity, radius: 16),
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
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 4, AppSpacing.lg, 8),
      child: const ShimmerBox(height: 160, radius: OffersTheme.cardRadius),
    );
  }
}
