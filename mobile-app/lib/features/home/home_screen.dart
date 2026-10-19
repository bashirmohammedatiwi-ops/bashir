import 'dart:ui' show ImageFilter;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/cache/home_image_precache.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/card_sizes.dart';
import '../../core/utils/connection_error.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/home_feed.dart';
import '../../data/models/home_section.dart';
import '../../data/models/store_world.dart';
import '../../data/services/api_service.dart';
import '../beauty/beauty_home_sections.dart' show HomeMyRoutineCard;
import '../catalog/catalog_providers.dart';
import '../catalog/catalog_refresh.dart';
import '../shell/main_shell.dart' show homeScrollToTopProvider;
import '../worlds/world_theme.dart';
import '../worlds/worlds_home_band.dart'
    show GiftWorldHomeCard, WorldHomeBrands;
import '../worlds/worlds_provider.dart';
import 'home_link.dart';
import 'home_section_renderer.dart';
import 'home_strings.dart';
import 'sections/spotlight_section.dart';
import 'widgets/flash_sale_section.dart';
import 'widgets/home_animations.dart';
import 'widgets/home_extras.dart';
import 'widgets/home_features.dart';
import 'widgets/home_scroll_perf.dart';
import 'widgets/home_theme.dart';
import 'widgets/world_showcase.dart';

/// مدى البناء المسبق تحت الشاشة: يكفي لتمرير سلس دون بناء الدوّارات وأشرطة الفيلم
/// البعيدة مبكراً (ولا تنتهي حركة الظهور قبل أن تُرى).
const double _homeCacheExtent = 1000;

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String? _precachedFor;
  HomeFeed? _heldFeed;
  String? _heldSlug;

  /// عند تركيب قائمة جديدة (بعد هيكل التحميل مثلاً) تُعاد مزامنة الشريطين مع موضعها —
  /// لا ننتظر أول حدث تمرير.
  late final ScrollController _scroll = ScrollController(
    onAttach: (_) => WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _onScroll();
    }),
  );
  bool _refreshingFeed = false;

  /// إعادة محاولة جلب واجهة العالم جارية — مؤشر انتظار مكان الزر.
  bool _retrying = false;

  /// تجاوز الكتلة الملوّنة: شريط الحالة يصبح داكناً فوق شريط زجاجي.
  final _pastHero = ValueNotifier<bool>(false);

  /// تجاوز محدّد العوالم الكبير: يظهر شريط العوالم المصغّر.
  final _showWorldsBar = ValueNotifier<bool>(false);

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    // التجديد عند العودة للتطبيق في app.dart وحده (refreshStorefrontCatalogOnResume،
    // مرة كل 3 دقائق) — لا طلب ثانٍ من هنا.
  }

  /// يجلب واجهة العالم من الشبكة ثم يُبطل مزوّدها فيقرأ الجديد من الكاش —
  /// القيمة تصل عبر المزوّد وحده (لا نسخة ثانية في الحالة).
  Future<void> _refreshVisibleFeed(String slug) async {
    if (_refreshingFeed) return;
    _refreshingFeed = true;
    try {
      await ref
          .read(apiServiceProvider)
          .getHome(worldSlug: slug, forceRefresh: true, staleOnError: false);
      if (!mounted) return;
      ref.invalidate(worldFeedProvider(slug));
    } catch (_) {
      // بلا اتصال: تبقى المعروضة (أو المحفوظة) كما هي.
    } finally {
      _refreshingFeed = false;
    }
  }

  /// «إعادة المحاولة» في بطاقة الخطأ داخل الصفحة.
  Future<void> _retryFeed(String? slug) async {
    if (_retrying) return;
    HapticFeedback.lightImpact();
    setState(() => _retrying = true);
    try {
      if (slug != null) {
        retryWorldIfErrored(ref, slug);
        ref.invalidate(worldFeedProvider(slug));
        await ref.read(worldFeedProvider(slug).future);
      } else {
        ref.invalidate(homeFeedProvider);
        await ref.read(homeFeedProvider.future);
      }
    } catch (_) {
      if (mounted) {
        AppSnackbar.show(context, ref.read(stringsProvider).loadFailed);
      }
    } finally {
      if (mounted) setState(() => _retrying = false);
    }
  }

  /// السحب للتحديث: كل بيانات المتجر (العوالم، الأقسام، البراندات، القوائم) لا الواجهة
  /// وحدها — فيظهر ما عُدّل في لوحة التحكم. لا يرمي أبداً، ويقول إن بقيت النسخة المحفوظة.
  Future<void> _onPullRefresh(String? worldSlug) async {
    HapticFeedback.mediumImpact();
    try {
      final ok = await refreshStorefrontCatalog(ref);
      if (!mounted) return;
      if (worldSlug != null) {
        try {
          final fresh = await ref.read(worldFeedProvider(worldSlug).future);
          if (mounted) {
            setState(() {
              _heldFeed = fresh;
              _heldSlug = worldSlug;
            });
          }
        } catch (_) {
          // لا نسخة ولا اتصال: بطاقة الخطأ داخل الصفحة تتولى.
        }
      }
      if (!ok && mounted) {
        AppSnackbar.show(
          context,
          ref.read(stringsProvider).offlineShowingSaved,
        );
      }
    } catch (_) {
      // الشاشة أُغلقت أثناء التحديث.
    }
  }

  void _onScroll() {
    final offset = _scroll.hasClients ? _scroll.offset : 0.0;
    final past = offset > 80;
    if (past != _pastHero.value) _pastHero.value = past;
    final bar = offset > 250;
    if (bar != _showWorldsBar.value) _showWorldsBar.value = bar;
  }

  /// بصمة محتوى الواجهة للصور: نفس الأقسام والصور لا تعيد التسخين بعد كل إبطال
  /// (كل جلب يُنشئ كائناً جديداً بنفس المحتوى).
  static String _imageSignature(String? slug, HomeFeed feed) {
    final ids = feed.sections.map((s) => s.id).toList()..sort();
    final images = <String>[
      for (final s in feed.sections) ...[
        for (final b in s.banners) b.imageUrl,
        for (final p in s.products.take(8)) p.coverUrl,
      ],
      for (final b in feed.banners) b.imageUrl,
    ];
    return '$slug|${ids.join(',')}|${Object.hashAll(images)}';
  }

  @override
  void dispose() {
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
    // تعذّر جلب العوالم ولا نسخة محفوظة (أول تشغيل بلا إنترنت): رسالة واضحة بدل
    // واجهة المتجر العامة القديمة. العامة تبقى فقط إن لم يكن على السيرفر عوالم أصلاً.
    final worldsFailed = worlds == null && worldsAsync.hasError;
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
      // أول اختيار تلقائي للعالم (بعد أول إطار) ليس تبديلاً: لا طلب إجباري ثانٍ —
      // worldFeedProvider يجلبها أو يعرض المحفوظة.
      if (previous == next || previous == null) return;
      // كل محوّلات العوالم (المحدّد، الشريط المصغّر، بطاقة الهدايا، الروابط) تبدأ العالم
      // الجديد من أعلاه، والشريطان يعودان لحالة أعلى الصفحة فوراً.
      _pastHero.value = false;
      _showWorldsBar.value = false;
      if (_scroll.hasClients) _scroll.jumpTo(0);
      setState(() {
        _heldFeed = null;
        _heldSlug = null;
      });
      if (next == null) return;
      retryWorldIfErrored(ref, next);
      // وصلت للتو (التجهيز المسبق أو تبديل سابق): لا نعيد طلبها.
      if (ref.read(apiServiceProvider).isHomeFresh(worldSlug: next)) return;
      _refreshVisibleFeed(next);
    });
    if (worlds != null && worlds.isNotEmpty) {
      prefetchWorldContent(ref, worlds);
    }
    final world = worldSlug == null
        ? null
        : ref.watch(worldDetailProvider(worldSlug)).valueOrNull;
    // الواجهة العامة القديمة لا تُطلب إلا إن لم يكن على السيرفر عوالم إطلاقاً.
    final AsyncValue<HomeFeed> feed = worldSlug != null
        ? ref.watch(worldFeedProvider(worldSlug))
        : (worlds != null && worlds.isEmpty)
        ? ref.watch(homeFeedProvider)
        : const AsyncValue<HomeFeed>.loading();
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

    // الواجهة العامة (بلا عوالم) بلا نسخة: هيكل تحميل أو خطأ بملء الشاشة. أما في
    // العوالم فالرأس ومحدّد العوالم يبقيان دائماً، والتحميل أو الخطأ تحتهما.
    final legacyPending = worldSlug == null && visibleFeed == null;
    final skeleton = worldsPending || (legacyPending && !feed.hasError);
    // كتلة ملوّنة أعلى الشاشة (رأس العالم أو هيكل التحميل): أيقونات بيضاء فوقها.
    final showsBand = !worldsFailed && (skeleton || bandWorld != null);

    return ValueListenableBuilder<bool>(
      valueListenable: _pastHero,
      builder: (context, past, child) => AnnotatedRegion<SystemUiOverlayStyle>(
        // فوق الكتلة الملوّنة أو في الليلي: أيقونات بيضاء؛ بعد تجاوزها فوق صفحة فاتحة: داكنة.
        value:
            ((showsBand && !past) || context.worldTheme.isDark
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
          child: worldsFailed
              ? ErrorView.from(
                  worldsAsync.error!,
                  loading: worldsAsync.isLoading,
                  onRetry: () {
                    HapticFeedback.lightImpact();
                    ref.invalidate(worldsProvider);
                  },
                )
              : skeleton
              ? const HomeLoadingSkeleton()
              : legacyPending
              ? ErrorView.from(
                  feed.error!,
                  loading: _retrying || feed.isLoading,
                  onRetry: () => _retryFeed(null),
                )
              : _buildFeed(
                  context,
                  worlds: worlds,
                  worldSlug: worldSlug,
                  world: world,
                  feed: feed,
                  data: visibleFeed,
                  canvas: canvas,
                  bandBase: bandBase,
                  hasBand: bandWorld != null,
                  topPad: topPad,
                ),
        ),
      ),
    );
  }

  Widget _buildFeed(
    BuildContext context, {
    required List<StoreWorld>? worlds,
    required String? worldSlug,
    required StoreWorld? world,
    required AsyncValue<HomeFeed> feed,
    required HomeFeed? data,
    required Color canvas,
    required Color bandBase,
    required bool hasBand,
    required double topPad,
  }) {
    if (data != null) {
      final signature = _imageSignature(worldSlug, data);
      if (_precachedFor != signature) {
        _precachedFor = signature;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) precacheHomeFeedImages(context, data);
        });
      }
    }

    // بلا واجهة بعد (عالم لم يُحمَّل): الرأس وحده، والتحميل أو الخطأ تحته.
    final slots = data != null
        ? resolveHomeSectionSlots(data, personal: worldSlug != null)
        : const [
            HomeSectionSlot(
              section: HomeSection(id: 'fixed-hero', type: 'HERO_BANNER'),
              kind: HomeSlotKind.hero,
            ),
          ];
    final bottomPad = Responsive.shellBottomReserve(context);
    // أول قائمة منتجات (بتخطيط افتراضي) تصبح "واجهة عرض" في العالم.
    final spotlightId = worldSlug == null
        ? null
        : slots
              .where(
                (x) =>
                    x.kind == HomeSlotKind.cms &&
                    isSpotlightCandidate(x.section),
              )
              .map((x) => x.section.id)
              .firstOrNull;
    final t = context.worldTheme;
    final dir = Directionality.of(context);
    // زجاج شريط الحالة بالتمويه على iOS فقط — على أندرويد سطح شبه معتم بلا كلفة
    // إعادة التمويه مع كل إطار تمرير.
    final blur = defaultTargetPlatform == TargetPlatform.iOS;

    Widget slotBuilder(BuildContext context, int index) {
      if (index >= slots.length) {
        return Padding(
          padding: EdgeInsets.only(bottom: bottomPad),
          child: const HomeFooterSignature(),
        );
      }
      final slot = slots[index];
      final key = ValueKey('$worldSlug/${slot.key}');
      switch (slot.kind) {
        case HomeSlotKind.hero:
          return RepaintBoundary(
            key: key,
            child: HeroHomeSection(section: slot.section),
          );
        case HomeSlotKind.cms:
          final section = slot.section;
          final Widget child;
          if (section.id == spotlightId) {
            child = Padding(
              padding: EdgeInsets.only(
                top: sectionPadding(section.paddingTop, 10),
                bottom: sectionPadding(section.paddingBottom, 0),
              ),
              child: ProductSpotlightSection(
                section: section,
                compactTop: slot.isFirstAfterHero,
              ),
            );
          } else {
            child = HomeSectionWidget(
              section: section,
              isFirstAfterHero: slot.isFirstAfterHero,
            );
          }
          return HomeReveal(
            key: key,
            id: '$worldSlug/${section.id}',
            child: RepaintBoundary(child: child),
          );
        case HomeSlotKind.flashSale:
          return HomeReveal(
            key: key,
            id: '$worldSlug/${slot.key}',
            child: RepaintBoundary(
              child: Padding(
                padding: const EdgeInsets.only(top: 10),
                child: FlashSaleSection(flashSale: data!.flashSale),
              ),
            ),
          );
        default:
          return RepaintBoundary(key: key, child: _personalShelf(slot.kind));
      }
    }

    return Stack(
      children: [
        // لون العالم يملأ فراغ السحب للأسفل فوق الكتلة.
        if (hasBand)
          AnimatedBuilder(
            animation: _scroll,
            builder: (context, _) {
              final pull = _scroll.hasClients ? -_scroll.offset : 0.0;
              return Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: (pull + topPad + 40).clamp(0.0, double.infinity),
                child: DecoratedBox(
                  // نفس اتجاه ضوء الكتلة: أفتح من جهة البداية.
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: AlignmentDirectional.centerStart.resolve(dir),
                      end: AlignmentDirectional.centerEnd.resolve(dir),
                      colors: [
                        Color.lerp(bandBase, Colors.white, 0.13)!,
                        Color.lerp(bandBase, Colors.white, 0.03)!,
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        RefreshIndicator(
          color: world?.accent ?? t.accent,
          backgroundColor: t.surface,
          displacement: 48,
          edgeOffset: topPad,
          onRefresh: () => _onPullRefresh(worldSlug),
          child: HomeFeedScope(
            worldSlug: worldSlug,
            heroCategoryIds: data == null ? null : homeHeroCategoryIds(data),
            child: CustomScrollView(
              controller: _scroll,
              cacheExtent: _homeCacheExtent,
              physics: HomeScrollPerf.physics,
              slivers: [
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    slotBuilder,
                    childCount: slots.length + (data != null ? 1 : 0),
                    addAutomaticKeepAlives: false,
                    addRepaintBoundaries: false,
                  ),
                ),
                if (data == null && worldSlug != null)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.only(bottom: bottomPad),
                      child: feed.hasError
                          ? _FeedErrorCard(
                              error: feed.error,
                              busy: _retrying || feed.isLoading,
                              onRetry: () => _retryFeed(worldSlug),
                            )
                          : const _FeedSectionsSkeleton(),
                    ),
                  ),
              ],
            ),
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
                final offset = _scroll.hasClients ? _scroll.offset : 0.0;
                final past = _pastHero.value;
                if (offset <= 2) return const SizedBox.shrink();
                if (!past && hasBand) {
                  return ColoredBox(
                    color: Color.lerp(bandBase, Colors.white, 0.06)!,
                  );
                }
                if (!blur) {
                  return ColoredBox(color: canvas.withValues(alpha: 0.97));
                }
                return ClipRect(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                    child: ColoredBox(color: canvas.withValues(alpha: 0.82)),
                  ),
                );
              },
            ),
          ),
        ),
        // شريط العوالم المصغّر — ينزلق من الأعلى بعد تجاوز المحدّد الكبير.
        // التبديل منه يعيد الصفحة لأعلاها عبر مستمع العالم (لا حركة تمرير طويلة).
        if (worlds != null && worlds.length > 1)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: ValueListenableBuilder<bool>(
              valueListenable: _showWorldsBar,
              builder: (context, show, child) {
                final reduceMotion = MediaQuery.disableAnimationsOf(context);
                return IgnorePointer(
                  ignoring: !show,
                  child: AnimatedSlide(
                    offset: show ? Offset.zero : const Offset(0, -1.05),
                    duration: reduceMotion
                        ? Duration.zero
                        : const Duration(milliseconds: 380),
                    curve: show ? Curves.easeOutQuart : Curves.easeInCubic,
                    child: AnimatedOpacity(
                      opacity: show ? 1 : 0,
                      duration: reduceMotion
                          ? Duration.zero
                          : const Duration(milliseconds: 260),
                      child: child,
                    ),
                  ),
                );
              },
              child: StickyWorldsBar(worlds: worlds, currentSlug: worldSlug),
            ),
          ),
      ],
    );
  }

  /// الرفوف الشخصية — كل منها يخفي نفسه إن لم يكن لديه ما يعرضه.
  static Widget _personalShelf(HomeSlotKind kind) => switch (kind) {
    HomeSlotKind.cart => const HomeCartReminder(),
    HomeSlotKind.coupons => const HomeCouponsShelf(),
    HomeSlotKind.routine => const HomeMyRoutineCard(),
    HomeSlotKind.buyAgain => const HomeBuyAgainShelf(),
    HomeSlotKind.continueShopping => const HomeContinueShopping(),
    HomeSlotKind.wishlist => const HomeWishlistShelf(),
    HomeSlotKind.needs => const HomeNeedsShelf(),
    HomeSlotKind.brands => const WorldHomeBrands(),
    HomeSlotKind.budget => const HomeBudgetShelf(),
    HomeSlotKind.gift => const GiftWorldHomeCard(),
    HomeSlotKind.promise => const HomePromiseStrip(),
    HomeSlotKind.hero ||
    HomeSlotKind.cms ||
    HomeSlotKind.flashSale => const SizedBox.shrink(),
  };
}

/// أقسام العالم في الطريق: كتل هيكلية تحت الرأس بنفس إيقاع الصفوف.
class _FeedSectionsSkeleton extends StatelessWidget {
  const _FeedSectionsSkeleton();

  @override
  Widget build(BuildContext context) {
    final pad = Responsive.horizontalPadding(context);
    final cardW = Responsive.productCardWidth(context);
    final cardH = Responsive.productCardHeight(context);
    Widget row() => Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Row(
          children: [
            SkeletonBlock(width: 140, height: 18),
            Spacer(),
            SkeletonBlock(width: 64, height: 14),
          ],
        ),
        const SizedBox(height: 14),
        SizedBox(
          height: cardH,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 3,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, __) => SkeletonBlock(
              width: cardW,
              height: cardH,
              radius: AppCorners.lg,
            ),
          ),
        ),
      ],
    );
    return Padding(
      padding: EdgeInsets.fromLTRB(pad, HomeTheme.sectionGap, pad, 0),
      child: Skeleton(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [row(), const SizedBox(height: 28), row()],
        ),
      ),
    );
  }
}

/// تعذّر تحميل أقسام العالم: بطاقة صغيرة تحت الرأس — محدّد العوالم يبقى في متناولها
/// لتعود لعالم يعمل، أو تعيد المحاولة هنا.
class _FeedErrorCard extends ConsumerWidget {
  final Object? error;
  final bool busy;
  final VoidCallback onRetry;

  const _FeedErrorCard({
    required this.error,
    required this.busy,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final offline = isConnectionError(error);
    final pad = Responsive.horizontalPadding(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(pad, HomeTheme.sectionGap, pad, 0),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(AppCorners.lg),
          border: Border.all(color: t.divider),
          boxShadow: t.cardShadow,
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: t.accentLight,
                shape: BoxShape.circle,
              ),
              child: Icon(
                offline ? Icons.wifi_off_rounded : Icons.cloud_off_rounded,
                size: 26,
                color: t.accentDark,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              offline ? s.uiNoConnection : s.homeFeedLoadFailed,
              textAlign: TextAlign.center,
              style: AppText.title3.copyWith(color: t.ink),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              s.homeFeedLoadFailedSub,
              textAlign: TextAlign.center,
              style: AppText.bodySmall.copyWith(color: t.inkMuted),
            ),
            const SizedBox(height: AppSpacing.lg),
            SizedBox(
              height: 48,
              child: busy
                  ? Center(
                      child: SizedBox.square(
                        dimension: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.4,
                          color: t.accent,
                          semanticsLabel: s.loading,
                        ),
                      ),
                    )
                  : FilledButton.icon(
                      onPressed: onRetry,
                      icon: const Icon(Icons.refresh_rounded, size: 20),
                      label: Text(s.retryAction),
                      style: FilledButton.styleFrom(
                        minimumSize: const Size(160, 48),
                        backgroundColor: t.buttonFill,
                        foregroundColor: t.onAccent,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
