import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../catalog/catalog_providers.dart';
import 'home_section_renderer.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(homeFeedProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: feed.when(
        loading: () => const _HomeLoading(),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(homeFeedProvider),
        ),
        data: (data) => RefreshIndicator(
          color: AppColors.primary,
          edgeOffset: MediaQuery.paddingOf(context).top,
          onRefresh: () async => ref.invalidate(homeFeedProvider),
          child: ListView(
            padding: EdgeInsets.zero,
            children: buildHomeSections(data),
          ),
        ),
      ),
    );
  }
}

class _HomeLoading extends StatelessWidget {
  const _HomeLoading();
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.zero,
      children: const [
        ShimmerBox(height: 380, radius: 0),
        SizedBox(height: 16),
        HorizontalProductsSkeleton(),
        SizedBox(height: 16),
        HorizontalProductsSkeleton(),
      ],
    );
  }
}
