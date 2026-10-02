import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/cache/home_image_precache.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/home_feed.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/catalog_refresh.dart';
import '../worlds/worlds_home_band.dart';
import '../worlds/worlds_provider.dart';
import 'home_section_renderer.dart';
import 'widgets/home_scroll_perf.dart';
import 'widgets/home_theme.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> with WidgetsBindingObserver {
  String? _precachedFor;
  HomeFeed? _heldFeed;
  String? _heldSlug;
  final _scroll = ScrollController();
  bool _pinWorlds = false;
  bool _refreshingFeed = false;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _refreshVisibleFeed();
  }

  Future<void> _refreshVisibleFeed() async {
    if (_refreshingFeed) return;
    _refreshingFeed = true;
    try {
      final worlds = ref.read(worldsProvider).valueOrNull;
      final slug = resolveWorldSlug(selected: ref.read(selectedWorldSlugProvider), worlds: worlds);
      if (slug == null && worlds == null) return;
      final fresh = await ref.read(apiServiceProvider).getHome(worldSlug: slug, forceRefresh: true);
      if (!mounted) return;
      if (slug != null) {
        ref.invalidate(worldFeedProvider(slug));
      } else {
        ref.invalidate(homeFeedProvider);
      }
      setState(() {
        _heldFeed = fresh;
        _heldSlug = slug;
      });
    } catch (_) {
    } finally {
      _refreshingFeed = false;
    }
  }

  void _onScroll() {
    final pin = _scroll.hasClients && _scroll.offset > 210;
    if (pin != _pinWorlds) setState(() => _pinWorlds = pin);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _scroll.removeListener(_onScroll);
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final selectedSlug = ref.watch(selectedWorldSlugProvider);
    final worlds = ref.watch(worldsProvider).valueOrNull;
    final worldSlug = resolveWorldSlug(selected: selectedSlug, worlds: worlds);
    if (worlds != null && worldSlug != null && worldSlug != selectedSlug) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        if (ref.read(selectedWorldSlugProvider) != worldSlug) {
          ref.read(selectedWorldSlugProvider.notifier).state = worldSlug;
        }
      });
    }
    ref.listen<String?>(selectedWorldSlugProvider, (previous, next) {
      if (previous != next) {
        setState(() {
          _heldFeed = null;
          _heldSlug = null;
        });
        _refreshVisibleFeed();
      }
    });
    if (worlds != null && worlds.isNotEmpty) {
      prefetchWorldContent(ref, worlds);
    }
    final world = worldSlug == null ? null : ref.watch(worldDetailProvider(worldSlug)).valueOrNull;
    final feed = worldSlug == null ? ref.watch(homeFeedProvider) : ref.watch(worldFeedProvider(worldSlug));
    final incoming = feed.valueOrNull;
    if (incoming != null && _heldSlug == worldSlug) {
      _heldFeed = incoming;
    }
    final visibleFeed = _heldSlug == worldSlug ? _heldFeed : incoming;
    final canvas = world?.canvas ?? AppColors.scaffold;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: worldSlug != null && !_pinWorlds
          ? SystemUiOverlayStyle.light.copyWith(statusBarColor: Colors.transparent)
          : SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: canvas,
        body: AnimatedContainer(
          duration: const Duration(milliseconds: 360),
          curve: Curves.easeOutCubic,
          color: canvas,
          child: visibleFeed == null
              ? (feed.hasError
                  ? ErrorView(
                      message: friendlyError(feed.error!),
                      onRetry: () async {
                        await refreshStorefrontCatalog(ref);
                      },
                    )
                  : const HomeLoadingSkeleton())
              : Builder(builder: (context) {
            final data = visibleFeed;
              if (_precachedFor != data.hashCode.toString()) {
                _precachedFor = data.hashCode.toString();
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) precacheHomeFeedImages(context, data);
                });
              }

              final slots = resolveHomeSectionSlots(data);
              final bottomPad = Responsive.shellBottomReserve(context);

              return Stack(
                children: [
                  RefreshIndicator(
                color: world?.accent ?? const Color(0xFF2D2D2D),
                backgroundColor: HomeTheme.surface,
                displacement: 48,
                edgeOffset: MediaQuery.paddingOf(context).top,
                onRefresh: () async {
                  HapticFeedback.mediumImpact();
                  if (worldSlug != null) {
                    await ref.read(apiServiceProvider).getHome(worldSlug: worldSlug, forceRefresh: true);
                    ref.invalidate(worldFeedProvider(worldSlug));
                    ref.invalidate(worldDetailProvider(worldSlug));
                    final fresh = await ref.read(worldFeedProvider(worldSlug).future);
                    if (mounted) {
                      setState(() {
                        _heldFeed = fresh;
                        _heldSlug = worldSlug;
                      });
                    }
                    return;
                  }
                  await refreshStorefrontCatalog(ref);
                },
                child: CustomScrollView(
                  controller: _scroll,
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
                        addAutomaticKeepAlives: false,
                        addRepaintBoundaries: true,
                      ),
                    ),
                  ],
                ),
              ),
                  if (worldSlug != null)
                    Positioned(
                      top: 0,
                      left: 0,
                      right: 0,
                      child: IgnorePointer(
                        ignoring: !_pinWorlds,
                        child: AnimatedSlide(
                          duration: const Duration(milliseconds: 220),
                          curve: Curves.easeOutCubic,
                          offset: _pinWorlds ? Offset.zero : const Offset(0, -1),
                          child: const PinnedWorldBar(),
                        ),
                      ),
                    ),
                ],
              );
          }),
        ),
      ),
    );
  }
}
