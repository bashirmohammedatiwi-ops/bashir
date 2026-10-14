import 'package:flutter/material.dart';

import 'sections/spotlight_section.dart';
import 'widgets/home_extras.dart';
import 'widgets/world_showcase.dart';
import 'dart:ui' show ImageFilter;
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
import '../worlds/worlds_provider.dart';
import '../shell/main_shell.dart' show homeScrollToTopProvider;
import 'home_section_renderer.dart';
import 'widgets/home_animations.dart';
import 'widgets/home_scroll_perf.dart';
import 'widgets/home_theme.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with WidgetsBindingObserver {
  String? _precachedFor;
  HomeFeed? _heldFeed;
  String? _heldSlug;
  final _scroll = ScrollController();
  bool _refreshingFeed = false;

  /// تجاوز الكتلة الملوّنة: شريط الحالة يصبح داكناً فوق شريط زجاجي.
  final _pastHero = ValueNotifier<bool>(false);

  /// تجاوز محدّد العوالم الكبير: يظهر شريط العوالم المصغّر.
  final _showWorldsBar = ValueNotifier<bool>(false);

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
      final slug = resolveWorldSlug(
        selected: ref.read(selectedWorldSlugProvider),
        worlds: worlds,
      );
      if (slug == null && worlds == null) return;
      final fresh = await ref
          .read(apiServiceProvider)
          .getHome(worldSlug: slug, forceRefresh: true);
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
    final offset = _scroll.hasClients ? _scroll.offset : 0.0;
    final past = offset > 80;
    if (past != _pastHero.value) _pastHero.value = past;
    final bar = offset > 250;
    if (bar != _showWorldsBar.value) _showWorldsBar.value = bar;
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _scroll.removeListener(_onScroll);
    _scroll.dispose();
    _pastHero.dispose();
    _showWorldsBar.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final selectedSlug = ref.watch(selectedWorldSlugProvider);
    final worldsAsync = ref.watch(worldsProvider);
    final worlds = worldsAsync.valueOrNull;
    // العوالم لم تصل بعد: لا نعرض واجهة المتجر العامة القديمة لحظةً ثم نقفز —
    // نعرض هيكل التحميل حتى تتضح العوالم. (العامة تبقى احتياطاً عند الفشل أو غياب العوالم.)
    final worldsPending = worlds == null && !worldsAsync.hasError;
    final worldSlug = resolveWorldSlug(selected: selectedSlug, worlds: worlds);
    if (worlds != null && worldSlug != null && worldSlug != selectedSlug) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        if (ref.read(selectedWorldSlugProvider) != worldSlug) {
          ref.read(selectedWorldSlugProvider.notifier).state = worldSlug;
        }
      });
    }
    ref.listen<int>(homeScrollToTopProvider, (_, __) {
      if (!_scroll.hasClients || _scroll.offset <= 0) return;
      HapticFeedback.lightImpact();
      _scroll.animateTo(
        0,
        duration: Duration(
          milliseconds: (_scroll.offset / 4).clamp(380, 900).round(),
        ),
        curve: Curves.easeOutQuart,
      );
    });
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
    final world = worldSlug == null
        ? null
        : ref.watch(worldDetailProvider(worldSlug)).valueOrNull;
    final feed = worldSlug == null
        ? ref.watch(homeFeedProvider)
        : ref.watch(worldFeedProvider(worldSlug));
    final incoming = feed.valueOrNull;
    if (incoming != null && _heldSlug == worldSlug) {
      _heldFeed = incoming;
    }
    final visibleFeed = _heldSlug == worldSlug ? _heldFeed : incoming;
    final canvas = world?.canvas ?? AppColors.scaffold;

    final topPad = MediaQuery.paddingOf(context).top;
    final bandWorld =
        world ??
        (worldSlug == null
            ? null
            : worlds?.where((w) => w.slug == worldSlug).firstOrNull);
    final bandBase = bandWorld == null ? canvas : worldBandColor(bandWorld);
    return ValueListenableBuilder<bool>(
      valueListenable: _pastHero,
      builder: (context, past, child) => AnnotatedRegion<SystemUiOverlayStyle>(
        // فوق الكتلة الملوّنة: أيقونات بيضاء؛ بعد تجاوزها: داكنة.
        value:
            (bandWorld != null && !past
                    ? SystemUiOverlayStyle.light
                    : SystemUiOverlayStyle.dark)
                .copyWith(statusBarColor: Colors.transparent),
        child: child!,
      ),
      child: Scaffold(
        backgroundColor: canvas,
        body: AnimatedContainer(
          duration: const Duration(milliseconds: 360),
          curve: Curves.easeOutCubic,
          color: canvas,
          child: worldsPending || visibleFeed == null
              ? (!worldsPending && feed.hasError
                    ? ErrorView(
                        message: friendlyError(feed.error!),
                        onRetry: () async {
                          await refreshStorefrontCatalog(ref);
                        },
                      )
                    : const HomeLoadingSkeleton())
              : Builder(
                  builder: (context) {
                    final data = visibleFeed;
                    if (_precachedFor != data.hashCode.toString()) {
                      _precachedFor = data.hashCode.toString();
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        if (mounted) precacheHomeFeedImages(context, data);
                      });
                    }

                    final slots = resolveHomeSectionSlots(data);
                    final bottomPad = Responsive.shellBottomReserve(context);
                    // أول قائمة منتجات تصبح "واجهة عرض" ويليها رفّ "تسوّقي حسب الحاجة".
                    final spotlightId = worldSlug == null
                        ? null
                        : slots
                              .where(
                                (x) =>
                                    !x.isHero &&
                                    x.section.type == 'PRODUCT_LIST' &&
                                    x.section.products.isNotEmpty,
                              )
                              .map((x) => x.section.id)
                              .firstOrNull;

                    return Stack(
                      children: [
                        // لون العالم يملأ فراغ السحب للأسفل فوق الكتلة.
                        if (bandWorld != null)
                          AnimatedBuilder(
                            animation: _scroll,
                            builder: (context, _) {
                              final pull = _scroll.hasClients
                                  ? -_scroll.offset
                                  : 0.0;
                              return Positioned(
                                top: 0,
                                left: 0,
                                right: 0,
                                height: (pull + topPad + 40).clamp(
                                  0.0,
                                  double.infinity,
                                ),
                                child: DecoratedBox(
                                  // نفس اتجاه ضوء الكتلة: أفتح من جهة البداية.
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: AlignmentDirectional.centerStart
                                          .resolve(Directionality.of(context)),
                                      end: AlignmentDirectional.centerEnd
                                          .resolve(Directionality.of(context)),
                                      colors: [
                                        Color.lerp(
                                          bandBase,
                                          Colors.white,
                                          0.13,
                                        )!,
                                        Color.lerp(
                                          bandBase,
                                          Colors.white,
                                          0.03,
                                        )!,
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        RefreshIndicator(
                          color: world?.accent ?? const Color(0xFF2D2D2D),
                          backgroundColor: HomeTheme.surface,
                          displacement: 48,
                          edgeOffset: topPad,
                          onRefresh: () async {
                            HapticFeedback.mediumImpact();
                            if (worldSlug != null) {
                              await ref
                                  .read(apiServiceProvider)
                                  .getHome(
                                    worldSlug: worldSlug,
                                    forceRefresh: true,
                                  );
                              ref.invalidate(worldFeedProvider(worldSlug));
                              ref.invalidate(worldDetailProvider(worldSlug));
                              final fresh = await ref.read(
                                worldFeedProvider(worldSlug).future,
                              );
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
                                      return Padding(
                                        padding: EdgeInsets.only(
                                          bottom: bottomPad,
                                        ),
                                        child: const HomeFooterSignature(),
                                      );
                                    }

                                    final slot = slots[index];
                                    if (slot.isHero) {
                                      return RepaintBoundary(
                                        child: HeroHomeSection(
                                          section: slot.section,
                                        ),
                                      );
                                    }

                                    if (slot.section.id == spotlightId) {
                                      return Column(
                                        key: ValueKey(
                                          'spotlight-${slot.section.id}',
                                        ),
                                        crossAxisAlignment:
                                            CrossAxisAlignment.stretch,
                                        children: [
                                          Padding(
                                            padding: const EdgeInsets.only(
                                              top: 10,
                                            ),
                                            child: ProductSpotlightSection(
                                              section: slot.section,
                                            ),
                                          ),
                                          const HomeNeedsShelf(),
                                        ],
                                      );
                                    }

                                    return HomeReveal(
                                      key: ValueKey(slot.section.id),
                                      id: '$worldSlug/${slot.section.id}',
                                      child: HomeSectionWidget(
                                        section: slot.section,
                                        isFirstAfterHero: slot.isFirstAfterHero,
                                      ),
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
                        // غطاء شريط الحالة: بلون العالم بمجرد بدء التمرير (لا يتداخل المحتوى
                        // مع أيقونات النظام)، ثم زجاج فاتح بعد تجاوز الكتلة الملوّنة.
                        Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          height: topPad,
                          child: IgnorePointer(
                            child: AnimatedBuilder(
                              animation: Listenable.merge([_scroll, _pastHero]),
                              builder: (context, _) {
                                final offset = _scroll.hasClients
                                    ? _scroll.offset
                                    : 0.0;
                                final past = _pastHero.value;
                                if (offset <= 2) return const SizedBox.shrink();
                                if (!past && bandWorld != null) {
                                  return ColoredBox(
                                    color: Color.lerp(
                                      bandBase,
                                      Colors.white,
                                      0.06,
                                    )!,
                                  );
                                }
                                return ClipRect(
                                  child: BackdropFilter(
                                    filter: ImageFilter.blur(
                                      sigmaX: 16,
                                      sigmaY: 16,
                                    ),
                                    child: ColoredBox(
                                      color: canvas.withValues(alpha: 0.82),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                        // شريط العوالم المصغّر — ينزلق من الأعلى بعد تجاوز المحدّد الكبير.
                        if (worlds != null && worlds.length > 1)
                          Positioned(
                            top: 0,
                            left: 0,
                            right: 0,
                            child: ValueListenableBuilder<bool>(
                              valueListenable: _showWorldsBar,
                              builder: (context, show, child) => IgnorePointer(
                                ignoring: !show,
                                child: AnimatedSlide(
                                  offset: show
                                      ? Offset.zero
                                      : const Offset(0, -1.05),
                                  duration: const Duration(milliseconds: 380),
                                  curve: show
                                      ? Curves.easeOutQuart
                                      : Curves.easeInCubic,
                                  child: AnimatedOpacity(
                                    opacity: show ? 1 : 0,
                                    duration: const Duration(milliseconds: 260),
                                    child: child,
                                  ),
                                ),
                              ),
                              child: StickyWorldsBar(
                                worlds: worlds,
                                currentSlug: worldSlug,
                                onWorldChanged: () {
                                  if (!_scroll.hasClients) return;
                                  _scroll.animateTo(
                                    0,
                                    duration: const Duration(milliseconds: 700),
                                    curve: Curves.easeOutQuart,
                                  );
                                },
                              ),
                            ),
                          ),
                      ],
                    );
                  },
                ),
        ),
      ),
    );
  }
}
