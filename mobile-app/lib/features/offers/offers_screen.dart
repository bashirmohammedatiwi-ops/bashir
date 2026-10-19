import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/cache/image_cache.dart';
import '../../core/config/app_config.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/push/push_service.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/product_card.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/scroll_perf.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/beauty.dart';
import '../../data/models/home_feed.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../beauty/beauty_providers.dart';
import '../beauty/beauty_widgets.dart';
import '../cart/coupon_provider.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/catalog_refresh.dart';
import '../home/home_section_renderer.dart';
import '../home/widgets/home_features.dart';
import '../shell/main_shell.dart' show navIndexProvider;
import '../shell/nav_tabs.dart';
import '../worlds/world_theme.dart';
import 'offers_strings.dart';
import 'widgets/offers_cms_banner.dart';
import 'widgets/offers_error_banner.dart';
import 'widgets/offers_flash_pulse.dart';
import 'widgets/offers_hero.dart';
import 'widgets/offers_loading.dart';
import 'widgets/offers_theme.dart';

/// تبويب العروض: الرأس، العرض السريع، الكوبونات، الباقات الموفّرة، أقسام لوحة التحكم،
/// ثم كل العروض مرتبة بالخصم الأكبر مع شرائح نسبة الخصم (فلترة من الخادم).
class OffersScreen extends ConsumerStatefulWidget {
  const OffersScreen({super.key});

  @override
  ConsumerState<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends ConsumerState<OffersScreen> with WidgetsBindingObserver {
  /// بعدها تُجلب العروض من جديد بصمت عند العودة للتبويب أو للتطبيق.
  static const _staleAfter = Duration(minutes: 3);

  final _scroll = ScrollController();
  final _flashKey = GlobalKey();
  final _items = <Product>[];

  /// الصفحة التالية في الترقيم.
  int _nextPage = 1;

  /// العدد الكلي المطابق للشريحة المختارة (من الخادم).
  int _total = 0;

  /// أقل نسبة خصم مختارة (0 = الكل) — يفلتر بها الخادم.
  int _minDiscount = 0;

  /// الشريحة التي تنتمي إليها [_items] — تختلف عن [_minDiscount] أثناء التبديل.
  int _itemsTier = 0;

  /// يزداد مع كل جلب من البداية — ردّ طلب أقدم يُهمل (تبديل سريع بين الشرائح).
  int _requestId = 0;

  bool _loadingMore = false;
  bool _hasMore = true;
  bool _initialLoad = true;

  /// الخطأ الخام حين لا شيء يُعرض — يُصاغ بلغة الواجهة عند العرض.
  Object? _gridError;

  /// فشل صفحة لاحقة: يبقى المعروض ويظهر شريط «إعادة المحاولة» أسفله.
  Object? _pageError;

  /// آخر تحميل ناجح من الخادم (لا يُحسب البديل من الواجهة).
  DateTime? _loadedAt;

  bool _askedPush = false;
  bool _refreshingCms = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _scroll.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _fetchMore(reset: true);
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _scroll.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // التبويب مخفي: يُحدَّث حين تعود إليه (مستمع navIndex في build).
    if (state == AppLifecycleState.resumed && ref.read(navIndexProvider) == NavTabs.offers) {
      _maybeRefresh();
    }
  }

  void _onScroll() {
    if (_loadingMore || !_hasMore || _pageError != null || !_scroll.hasClients) return;
    final pos = _scroll.position;
    if (pos.pixels >= pos.maxScrollExtent - 420) _fetchMore();
  }

  /// يجلب صفحة العروض التالية، أو الأولى من جديد مع [reset].
  ///
  /// الجلب من البداية لا يمسح المعروض قبل وصول الرد: الشبكة تبقى ثم تُستبدل دفعة واحدة.
  Future<void> _fetchMore({bool reset = false, bool force = false}) async {
    if (!reset && (_loadingMore || !_hasMore)) return;
    final id = reset ? ++_requestId : _requestId;
    final tier = _minDiscount;
    final page = reset ? 1 : _nextPage;
    setState(() => _loadingMore = true);

    try {
      final result = await ref.read(apiServiceProvider).getProducts(
            page: page,
            limit: AppConfig.pageSize,
            isPromo: true,
            sort: 'discount',
            minDiscount: tier == 0 ? null : tier,
            forceRefresh: force,
          );
      if (!mounted || id != _requestId) return;
      setState(() {
        if (reset) {
          _items
            ..clear()
            ..addAll(result.items);
          _itemsTier = tier;
          _loadedAt = DateTime.now();
        } else {
          _items.addAll(result.items);
        }
        _nextPage = page + 1;
        _hasMore = result.hasNext;
        _total = math.max(result.total, _items.length);
        _gridError = null;
        _pageError = null;
        _initialLoad = false;
        _loadingMore = false;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        if (result.items.isNotEmpty) precacheProductCovers(context, result.items.map((p) => p.coverUrl));
        // صفحة لم تملأ الشاشة لا تُطلق التمرير — نكمل التحميل بأنفسنا.
        _onScroll();
      });
      if (reset && result.items.isNotEmpty) _maybeAskPush();
    } catch (e) {
      if (!mounted || id != _requestId) return;
      if (!reset) {
        setState(() {
          _pageError = e;
          _loadingMore = false;
        });
        return;
      }
      // تحديث فشل والمعروض من نفس الشريحة: يبقى كما هو بلا إزعاج.
      if (_items.isNotEmpty && _itemsTier == tier) {
        setState(() {
          _loadingMore = false;
          _initialLoad = false;
        });
        return;
      }
      final fallback = await _promoFallback(tier);
      if (!mounted || id != _requestId) return;
      setState(() {
        _items
          ..clear()
          ..addAll(fallback);
        _itemsTier = tier;
        _hasMore = false;
        _total = fallback.length;
        _gridError = fallback.isEmpty ? e : null;
        _pageError = null;
        _initialLoad = false;
        _loadingMore = false;
      });
    }
  }

  /// بديل حين تتعذّر قائمة العروض: منتجات العروض من واجهة العروض أو الرئيسية، بنفس الشريحة.
  Future<List<Product>> _promoFallback(int tier) async {
    var list = const <Product>[];
    final feed = ref.read(offersFeedProvider).valueOrNull;
    if (feed != null) list = _promoFrom(feed);
    if (list.isEmpty) {
      try {
        list = _promoFrom(await ref.read(apiServiceProvider).getHome());
      } catch (_) {}
    }
    return tier == 0 ? list : list.where((p) => p.discountPercent >= tier).toList();
  }

  static List<Product> _promoFrom(HomeFeed feed) {
    if (feed.promoProducts.isNotEmpty) return feed.promoProducts;
    final flash = feed.flashSale;
    return isFlashLive(flash.endsAt, flash.products) ? flash.products : const [];
  }

  void _selectTier(int v) {
    if (v == _minDiscount) return;
    setState(() => _minDiscount = v);
    _fetchMore(reset: true);
  }

  /// تحديث صامت إن مرّت 3 دقائق على آخر تحميل (أو لم ينجح تحميل بعد).
  void _maybeRefresh() {
    if (_loadingMore) return;
    final at = _loadedAt;
    if (at != null && DateTime.now().difference(at) < _staleAfter) return;
    _refreshSilently();
  }

  /// أحدث الأسعار من الخادم مع إبقاء المعروض حتى يصل الجديد.
  void _refreshSilently() {
    _fetchMore(reset: true, force: true);
    unawaited(
      ref.read(apiServiceProvider).getOffers(forceRefresh: true).then(
        (_) {
          if (mounted) ref.invalidate(offersFeedProvider);
        },
        onError: (_) {},
      ),
    );
  }

  /// انتهى العرض السريع والصفحة مفتوحة: تختفي الشارة وتُجلب الأسعار الجديدة.
  void _onFlashExpired() {
    if (!mounted) return;
    setState(() {});
    _refreshSilently();
  }

  void _scrollToFlash() {
    final ctx = _flashKey.currentContext;
    if (ctx == null) return;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    Scrollable.ensureVisible(
      ctx,
      alignment: 0.04,
      duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 450),
      curve: Curves.easeOutCubic,
    );
  }

  void _scrollToTop() {
    if (!_scroll.hasClients || _scroll.offset <= 0) return;
    if (MediaQuery.disableAnimationsOf(context)) {
      _scroll.jumpTo(0);
    } else {
      _scroll.animateTo(0, duration: const Duration(milliseconds: 420), curve: Curves.easeOutCubic);
    }
  }

  /// أول زيارة بعروض ظاهرة: سؤال لطيف عن الإشعارات (PushService يحدّ تكراره بنفسه).
  void _maybeAskPush() {
    if (_askedPush) return;
    _askedPush = true;
    Future<void>.delayed(const Duration(milliseconds: 1400), () {
      if (!mounted || ref.read(navIndexProvider) != NavTabs.offers) return;
      PushService.maybeSoftAsk(context, reason: ref.read(stringsProvider).offersPushReason);
    });
  }

  Future<void> _refreshCms() async {
    if (_refreshingCms) return;
    setState(() => _refreshingCms = true);
    try {
      await refreshStorefrontCatalog(ref);
    } finally {
      if (mounted) setState(() => _refreshingCms = false);
    }
  }

  Future<void> _refreshAll() async {
    HapticFeedback.mediumImpact();
    ref.invalidate(featuredCouponsForWorldProvider);
    await Future.wait([
      _fetchMore(reset: true, force: true),
      _refreshCms(),
      refreshBeautyCatalog(ref, kinds: const ['bundles']),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final feed = ref.watch(offersFeedProvider);
    final feedData = feed.valueOrNull;
    final top = MediaQuery.paddingOf(context).top;
    final bottomPad = Responsive.shellBottomReserve(context);

    // العودة للتبويب بعد مدة: أسعار جديدة. لمسة ثانية عليه وهو مفتوح: للأعلى.
    ref.listen<int>(navIndexProvider, (prev, i) {
      if (i == NavTabs.offers && prev != i) _maybeRefresh();
    });
    ref.listen<({int tab, int tick})>(tabReselectProvider, (_, r) {
      if (r.tab == NavTabs.offers) _scrollToTop();
    });

    final slots = feedData != null ? resolveOffersSectionSlots(feedData) : const <HomeSectionSlot>[];

    // العرض السريع في مكان واحد تحت الرأس: قسم لوحة التحكم إن كان قائماً، وإلا عرض الواجهة.
    // المنتهي أو الفارغ لا يظهر أبداً، ولا شارته في الرأس.
    FlashSale? flash;
    for (final slot in slots) {
      final sec = slot.section;
      if (sec.type == 'FLASH_SALE' && isFlashLive(sec.endsAt, sec.products)) {
        flash = FlashSale(endsAt: sec.endsAt, products: sec.products);
        break;
      }
    }
    final feedFlash = feedData?.flashSale;
    if (flash == null && feedFlash != null && isFlashLive(feedFlash.endsAt, feedFlash.products)) {
      flash = feedFlash;
    }
    final sectionSlots = slots.where((slot) => slot.section.type != 'FLASH_SALE').toList();

    final showInitialSkeleton = _initialLoad && _items.isEmpty && _gridError == null;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: context.worldTheme.isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: OffersCanvas(
          child: showInitialSkeleton && feedData == null && feed.isLoading
              ? const OffersLoadingView()
              : RefreshIndicator(
                  color: Theme.of(context).colorScheme.primary,
                  backgroundColor: Theme.of(context).colorScheme.surface,
                  edgeOffset: top + 12,
                  onRefresh: _refreshAll,
                  child: CustomScrollView(
                    controller: _scroll,
                    physics: AppScrollPerf.physics,
                    cacheExtent: AppScrollPerf.vertical,
                    slivers: [
                      SliverToBoxAdapter(
                        child: OffersHero(
                          topPad: top,
                          flashSale: flash,
                          onFlashTap: _scrollToFlash,
                        ),
                      ),
                      if (flash != null)
                        SliverToBoxAdapter(
                          child: OffersFlashPulse(
                            key: _flashKey,
                            flashSale: flash,
                            onExpired: _onFlashExpired,
                          ),
                        )
                      else if (feed.isLoading && feedData == null)
                        const SliverToBoxAdapter(child: OffersCmsSkeleton()),
                      const SliverToBoxAdapter(child: HomeCouponsShelf()),
                      const SliverToBoxAdapter(child: _BundleDealsShelf()),
                      SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            if (index >= sectionSlots.length) return null;
                            final slot = sectionSlots[index];
                            if (slot.isHero) {
                              return RepaintBoundary(
                                child: OffersCmsBanner(section: slot.section),
                              );
                            }
                            return OffersSectionFrame(
                              child: HomeSectionWidget(
                                key: ValueKey(slot.section.id),
                                section: slot.section,
                                isFirstAfterHero: slot.isFirstAfterHero,
                              ),
                            );
                          },
                          childCount: sectionSlots.length,
                          addAutomaticKeepAlives: false,
                          addRepaintBoundaries: true,
                        ),
                      ),
                      ..._gridSlivers(s, bottomPad),
                    ],
                  ),
                ),
        ),
      ),
    );
  }

  /// «كل العروض»: الشرائح ثم الشبكة، أو حالة فراغ/خطأ مناسبة.
  List<Widget> _gridSlivers(AppStrings s, double bottomPad) {
    final showTiers = _items.isNotEmpty || _minDiscount > 0;
    if (!showTiers) {
      if (_gridError != null) {
        return [
          SliverFillRemaining(
            hasScrollBody: false,
            child: ErrorView.from(
              _gridError,
              loading: _loadingMore,
              onRetry: () => _fetchMore(reset: true, force: true),
            ),
          ),
        ];
      }
      if (_loadingMore || _initialLoad) return [OffersGridSkeleton(count: 4, bottomPad: bottomPad)];
      return [
        SliverFillRemaining(
          hasScrollBody: false,
          child: _OffersEmptyState(
            title: s.noOffersNow,
            subtitle: s.checkBackSoon,
            actionLabel: s.browseProductsBtn,
            onAction: () => context.push('/products?title=${Uri.encodeComponent(s.products)}'),
          ),
        ),
      ];
    }

    final switching = _loadingMore && _itemsTier != _minDiscount;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    return [
      SliverToBoxAdapter(
        child: _DiscountTiers(
          total: _total,
          selected: _minDiscount,
          switching: switching,
          onSelect: _selectTier,
        ),
      ),
      if (_items.isEmpty)
        _emptyTierSliver(s, bottomPad)
      else ...[
        // أثناء تبديل الشريحة تبقى البطاقات القديمة باهتة حتى تصل الجديدة.
        SliverAnimatedOpacity(
          opacity: switching ? 0.45 : 1,
          duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 180),
          sliver: SliverPadding(
            padding: EdgeInsets.fromLTRB(
              OffersTheme.hPad,
              0,
              OffersTheme.hPad,
              _pageError != null ? 12 : bottomPad,
            ),
            sliver: SliverGrid(
              gridDelegate: ProductGrid.delegateFor(context, listing: true),
              delegate: SliverChildBuilderDelegate(
                (context, i) {
                  if (i >= _items.length) {
                    return const ShimmerBox(height: double.infinity, radius: OffersTheme.cardRadius);
                  }
                  final p = _items[i];
                  return RepaintBoundary(
                    child: ProductCard(
                      key: ValueKey(p.id),
                      product: p,
                      showPromoBadge: true,
                      showRating: true,
                      style: ProductCardStyle.listing,
                    ),
                  );
                },
                childCount: _items.length + (_hasMore && _pageError == null ? 2 : 0),
                addAutomaticKeepAlives: false,
                addRepaintBoundaries: true,
              ),
            ),
          ),
        ),
        if (_pageError != null)
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.only(bottom: bottomPad),
              child: OffersErrorBanner(
                message: s.offersLoadMoreFailed,
                loading: _loadingMore,
                onRetry: () => _fetchMore(),
              ),
            ),
          ),
      ],
    ];
  }

  /// شريحة بلا نتائج: هيكل أثناء الجلب، أو خطأ بإعادة المحاولة، أو فراغ يعيدها لـ«الكل».
  Widget _emptyTierSliver(AppStrings s, double bottomPad) {
    if (_loadingMore) return OffersGridSkeleton(count: 4, bottomPad: bottomPad);
    final Widget body = _gridError != null
        ? ErrorView.from(_gridError, onRetry: () => _fetchMore(reset: true, force: true))
        : EmptyState(
            icon: Icons.local_offer_outlined,
            title: s.offersTierEmptyTitle(_minDiscount),
            subtitle: s.offersTierEmptySubtitle,
            action: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 260),
              child: OffersPrimaryButton(label: s.offersShowAll, onPressed: () => _selectTier(0)),
            ),
          );
    return SliverToBoxAdapter(
      child: Padding(padding: EdgeInsets.only(bottom: bottomPad), child: body),
    );
  }
}

class _OffersEmptyState extends StatelessWidget {
  final String title;
  final String subtitle;
  final String actionLabel;
  final VoidCallback onAction;

  const _OffersEmptyState({
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: OffersTheme.brandSoft(context),
                shape: BoxShape.circle,
                border: Border.all(color: OffersTheme.brand(context).withValues(alpha: 0.18)),
                boxShadow: [
                  BoxShadow(
                    color: OffersTheme.brand(context).withValues(alpha: 0.12),
                    blurRadius: 22,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Icon(Icons.local_offer_outlined, size: 40, color: OffersTheme.brand(context)),
            ),
            const SizedBox(height: 18),
            Text(
              title,
              textAlign: TextAlign.center,
              style: OffersTheme.title(context, size: 17, color: OffersTheme.ink(context)),
            ),
            const SizedBox(height: 8),
            Text(subtitle, textAlign: TextAlign.center, style: OffersTheme.body(context, size: 13)),
            const SizedBox(height: 22),
            OffersPrimaryButton(label: actionLabel, onPressed: onAction),
          ],
        ),
      ),
    );
  }
}

/// «باقات بسعر أوفر»: باقات فيها توفير فعلي، الأقرب انتهاءً أولاً ثم الأكبر توفيراً.
class _BundleDealsShelf extends ConsumerWidget {
  const _BundleDealsShelf();

  static int _byUrgency(BeautyPackage a, BeautyPackage b) {
    final ea = a.endsAt;
    final eb = b.endsAt;
    if (ea != null || eb != null) {
      if (ea == null) return 1;
      if (eb == null) return -1;
      final c = ea.compareTo(eb);
      if (c != 0) return c;
    }
    return b.savingPercent.compareTo(a.savingPercent);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final packs = ref.watch(beautyPackagesProvider('bundles')).valueOrNull ?? const <BeautyPackage>[];
    final deals = packs.where((p) => p.hasSaving && p.isLive).toList()..sort(_byUrgency);
    if (deals.isEmpty) return const SizedBox.shrink();
    final s = ref.s;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(
          title: s.offersBundlesTitle,
          subtitle: s.offersBundlesSubtitle,
          actionLabel: s.viewAll,
          onAction: () => context.push('/packages?tab=bundles'),
        ),
        SizedBox(
          height: 290,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 10),
            itemCount: deals.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) => BeautyPackageCard(pack: deals[i], width: 226, height: 280),
          ),
        ),
      ],
    );
  }
}

/// عنوان «كل العروض» بالعدد الكلي، مع شرائح نسب الخصم.
class _DiscountTiers extends ConsumerWidget {
  final int total;
  final int selected;

  /// شريحة جديدة قيد الجلب — مؤشر صغير مكان العدد.
  final bool switching;
  final ValueChanged<int> onSelect;

  const _DiscountTiers({
    required this.total,
    required this.selected,
    required this.switching,
    required this.onSelect,
  });

  static const _tiers = [0, 20, 30, 50];
  static const _radius = BorderRadius.all(Radius.circular(AppCorners.pill));

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final brand = OffersTheme.brand(context);
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(OffersTheme.hPad, 18, OffersTheme.hPad, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 3,
                height: 16,
                decoration: BoxDecoration(color: brand, borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  s.allOffers,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: OffersTheme.title(context, size: 16, color: OffersTheme.ink(context)),
                ),
              ),
              const SizedBox(width: 6),
              if (switching)
                SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(strokeWidth: 1.6, color: brand),
                )
              else if (total > 0)
                Semantics(
                  label: s.offersCount(total),
                  excludeSemantics: true,
                  child: Text(
                    '(\u2066${formatNumber(total)}\u2069)',
                    style: OffersTheme.body(context, size: 12),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: kMinTapTarget,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _tiers.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final v = _tiers[i];
                final on = v == selected;
                return AppTap(
                  radius: _radius,
                  selected: on,
                  onTap: () => onSelect(v),
                  child: AnimatedContainer(
                    duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 200),
                    height: kMinTapTarget,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: on ? brand : OffersTheme.brandSoft(context),
                      borderRadius: _radius,
                      border: Border.all(color: brand.withValues(alpha: on ? 1 : 0.2)),
                    ),
                    child: Text(
                      v == 0 ? s.all : s.offersTierLabel(v),
                      maxLines: 1,
                      style: OffersTheme.body(context, size: 12.5).copyWith(
                        color: on ? Colors.white : brand,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
