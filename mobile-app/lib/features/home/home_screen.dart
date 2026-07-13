import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/cache/home_image_precache.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/friendly_error.dart';
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
  double _headerProgress = 0;

  static const _headerFadeDistance = 140.0;
  static const _headerBarHeight = 50.0;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    if (!_scroll.hasClients || !mounted) return;
    final progress = (_scroll.offset / _headerFadeDistance).clamp(0.0, 1.0);
    if ((progress - _headerProgress).abs() < 0.015) return;
    setState(() => _headerProgress = progress);
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
    final headerH = topPad + _headerBarHeight;
    final statusBrightness =
        _headerProgress > 0.42 ? Brightness.dark : Brightness.light;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: statusBrightness,
        statusBarBrightness:
            statusBrightness == Brightness.dark ? Brightness.light : Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppColors.scaffold,
        body: DecoratedBox(
          decoration: const BoxDecoration(gradient: AppColors.homeBackgroundGradient),
          child: Stack(
            fit: StackFit.expand,
            children: [
              feed.when(
              loading: () => const HomeLoadingSkeleton(),
              error: (e, _) => ErrorView(
                message: friendlyError(e),
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
                final sections = buildHomeSections(data);
                return RefreshIndicator(
                  color: AppColors.primary,
                  backgroundColor: AppColors.surface,
                  edgeOffset: headerH,
                  onRefresh: () async {
                    HapticFeedback.mediumImpact();
                    await ref.read(apiCacheProvider).remove('home_v1');
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
                      const SliverToBoxAdapter(child: SizedBox(height: 24)),
                    ],
                  ),
                );
              },
            ),
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: _FloatingHeader(
                topPad: topPad,
                progress: _headerProgress,
              ),
            ),
          ],
        ),
      ),
    ),
    );
  }
}

class _FloatingHeader extends StatelessWidget {
  final double topPad;
  final double progress;

  const _FloatingHeader({
    required this.topPad,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    final bgOpacity = (progress * 0.94).clamp(0.0, 0.94);
    final blur = lerpDouble(0, 16, progress)!;
    final shadowOpacity = (progress * 0.08).clamp(0.0, 0.08);

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOut,
          decoration: BoxDecoration(
            color: AppColors.surface.withValues(alpha: bgOpacity),
            border: Border(
              bottom: BorderSide(
                color: AppColors.border.withValues(alpha: progress * 0.5),
                width: progress > 0.85 ? 0.5 : 0,
              ),
            ),
            boxShadow: shadowOpacity > 0.01
                ? [
                    BoxShadow(
                      color: AppColors.textPrimary.withValues(alpha: shadowOpacity),
                      blurRadius: 12 * progress,
                      offset: Offset(0, 3 * progress),
                    ),
                  ]
                : null,
          ),
          child: Padding(
            padding: EdgeInsets.only(top: topPad),
            child: NiceOneHeader(scrollProgress: progress),
          ),
        ),
      ),
    );
  }
}
