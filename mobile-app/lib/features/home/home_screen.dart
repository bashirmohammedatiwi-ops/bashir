import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/cache/home_image_precache.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../catalog/catalog_providers.dart';
import 'home_section_renderer.dart';
import 'widgets/home_scroll_perf.dart';
import 'widgets/home_theme.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String? _precachedFor;

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(homeFeedProvider);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: HomeTheme.canvas,
        body: HomeCanvasBackground(
          child: feed.when(
            loading: () => const HomeLoadingSkeleton(),
            error: (e, _) => ErrorView(
              message: friendlyError(e),
              onRetry: () async {
                await ref.read(apiCacheProvider).remove('home_v3');
                ref.invalidate(homeFeedProvider);
              },
            ),
            data: (data) {
              if (_precachedFor != data.hashCode.toString()) {
                _precachedFor = data.hashCode.toString();
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) precacheHomeFeedImages(context, data);
                });
              }

              final slots = resolveHomeSectionSlots(data);
              final bottomPad = MediaQuery.paddingOf(context).bottom + 96;

              return RefreshIndicator(
                color: HomeTheme.sage,
                backgroundColor: HomeTheme.surface,
                displacement: 48,
                edgeOffset: MediaQuery.paddingOf(context).top,
                onRefresh: () async {
                  HapticFeedback.mediumImpact();
                  await ref.read(apiCacheProvider).remove('home_v3');
                  ref.invalidate(homeFeedProvider);
                  await ref.read(homeFeedProvider.future);
                },
                child: CustomScrollView(
                  cacheExtent: HomeScrollPerf.verticalCacheExtent,
                  physics: HomeScrollPerf.physics,
                  slivers: [
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          if (index >= slots.length) {
                            return SizedBox(height: bottomPad);
                          }

                          final slot = slots[index];
                          if (slot.isHero) {
                            return RepaintBoundary(
                              child: HeroHomeSection(section: slot.section),
                            );
                          }

                          return HomeSectionWidget(
                            key: ValueKey(slot.section.id),
                            section: slot.section,
                            isFirstAfterHero: slot.isFirstAfterHero,
                          );
                        },
                        childCount: slots.length + 1,
                        addAutomaticKeepAlives: true,
                        addRepaintBoundaries: true,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
