import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/cache/home_image_precache.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../catalog/catalog_providers.dart';
import 'home_section_renderer.dart';
import 'widgets/home_animations.dart';
import 'widgets/home_theme.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _scroll = ScrollController();
  double _scrollOffset = 0;
  String? _precachedFor;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    if (!_scroll.hasClients) return;
    final next = _scroll.offset;
    if ((next - _scrollOffset).abs() < 0.5) return;
    setState(() => _scrollOffset = next);
  }

  @override
  void dispose() {
    _scroll.removeListener(_onScroll);
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(homeFeedProvider);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: HomeTheme.canvas,
        body: HomeScrollScope(
          offset: _scrollOffset,
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
              final sections = buildHomeSections(data);

              return RefreshIndicator(
                color: AppColors.primary,
                backgroundColor: HomeTheme.surface,
                edgeOffset: MediaQuery.paddingOf(context).top,
                onRefresh: () async {
                  HapticFeedback.mediumImpact();
                  await ref.read(apiCacheProvider).remove('home_v3');
                  ref.invalidate(homeFeedProvider);
                  await ref.read(homeFeedProvider.future);
                },
                child: CustomScrollView(
                  controller: _scroll,
                  cacheExtent: 1200,
                  physics: const AlwaysScrollableScrollPhysics(
                    parent: BouncingScrollPhysics(),
                  ),
                  slivers: [
                    for (final section in sections)
                      SliverToBoxAdapter(child: section),
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: MediaQuery.paddingOf(context).bottom + 96,
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
