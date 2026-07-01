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
  bool _compactHeader = false;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    final compact = _scroll.hasClients && _scroll.offset > 200;
    if (compact != _compactHeader && mounted) {
      setState(() => _compactHeader = compact);
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
      value: _compactHeader
          ? SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent)
          : SystemUiOverlayStyle.light.copyWith(statusBarColor: Colors.transparent),
      child: Scaffold(
        backgroundColor: Colors.white,
        body: Stack(
          clipBehavior: Clip.none,
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
                  edgeOffset: topPad + (_compactHeader ? 56 : 120),
                  onRefresh: () async {
                    await ref.read(apiCacheProvider).remove('home_v1');
                    ref.invalidate(homeFeedProvider);
                    await ref.read(homeFeedProvider.future);
                  },
                  child: ListView(
                    controller: _scroll,
                    padding: EdgeInsets.zero,
                    cacheExtent: 800,
                    physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics(),
                    ),
                    children: buildHomeSections(data),
                  ),
                );
              },
            ),
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOutCubic,
                decoration: BoxDecoration(
                  color: _compactHeader ? Colors.white.withValues(alpha: 0.98) : Colors.transparent,
                  boxShadow: _compactHeader
                      ? [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 2))]
                      : null,
                ),
                child: Padding(
                  padding: EdgeInsets.only(top: topPad),
                  child: NiceOneHeader(
                    compact: _compactHeader,
                    onLightBackground: _compactHeader,
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
