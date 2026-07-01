import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/cache/home_image_precache.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/nice_one_header.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../catalog/catalog_providers.dart';
import 'home_section_renderer.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _scroll = ScrollController();
  String? _precachedFor;
  bool _showStickyHeader = false;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    final show = _scroll.hasClients && _scroll.offset > 260;
    if (show != _showStickyHeader && mounted) {
      setState(() => _showStickyHeader = show);
    }
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
    final topPad = MediaQuery.paddingOf(context).top;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: _showStickyHeader
          ? SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent)
          : SystemUiOverlayStyle.light.copyWith(statusBarColor: Colors.transparent),
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Stack(
          children: [
            feed.when(
              loading: () => const _HomeLoading(),
              error: (e, _) => ErrorView(
                message: e.toString(),
                onRetry: () async {
                  await ref.read(apiCacheProvider).remove('home_v1');
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
                return RefreshIndicator(
                  color: AppColors.primary,
                  edgeOffset: topPad,
                  onRefresh: () async {
                    await ref.read(apiCacheProvider).remove('home_v1');
                    ref.invalidate(homeFeedProvider);
                    await ref.read(homeFeedProvider.future);
                  },
                  child: ListView(
                    controller: _scroll,
                    padding: EdgeInsets.zero,
                    cacheExtent: 1000,
                    addAutomaticKeepAlives: true,
                    physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics(),
                    ),
                    children: buildHomeSections(data),
                  ),
                );
              },
            ),
            AnimatedSlide(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              offset: _showStickyHeader ? Offset.zero : const Offset(0, -1),
              child: AnimatedOpacity(
                duration: const Duration(milliseconds: 180),
                opacity: _showStickyHeader ? 1 : 0,
                child: Material(
                  elevation: 3,
                  shadowColor: Colors.black26,
                  color: Colors.white.withValues(alpha: 0.97),
                  child: Padding(
                    padding: EdgeInsets.only(top: topPad),
                    child: const NiceOneHeader(compact: true, onLightBackground: true),
                  ),
                ),
              ),
            ),
          ],
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
