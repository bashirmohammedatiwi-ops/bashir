import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/cache/image_cache.dart';
import '../../core/config/app_config.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/product_card.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/scroll_perf.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/home_feed.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/catalog_refresh.dart';
import '../home/home_section_renderer.dart';
import 'widgets/offers_cms_banner.dart';
import 'widgets/offers_flash_pulse.dart';
import 'widgets/offers_hero.dart';
import 'widgets/offers_loading.dart';
import 'widgets/offers_theme.dart';

/// تبويب العروض — تصميم جديد مع تحميل موثوق.
class OffersScreen extends ConsumerStatefulWidget {
  const OffersScreen({super.key});

  @override
  ConsumerState<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends ConsumerState<OffersScreen> {
  final _scroll = ScrollController();
  final _items = <Product>[];
  int _page = 1;
  /// أقل نسبة خصم معروضة (0 = الكل) — فلترة فورية على ما حُمّل.
  int _minDiscount = 0;

  List<Product> get _visible =>
      _minDiscount == 0 ? _items : _items.where((p) => p.discountPercent >= _minDiscount).toList();
  bool _loadingMore = false;
  bool _hasMore = true;
  bool _initialLoad = true;
  String? _gridError;
  bool _refreshingCms = false;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _fetchMore();
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_loadingMore || !_hasMore) return;
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 420) {
      _fetchMore();
    }
  }

  Future<void> _fetchMore({bool reset = false}) async {
    if (_loadingMore) return;
    if (reset) {
      _page = 1;
      _hasMore = true;
      _items.clear();
      _gridError = null;
    }
    if (!_hasMore) return;

    setState(() => _loadingMore = true);
    try {
      final result = await ref.read(apiServiceProvider).getProducts(
            page: _page,
            limit: AppConfig.pageSize,
            isPromo: true,
            sort: 'brand',
            forceRefresh: reset,
          );
      if (!mounted) return;
      setState(() {
        _items.addAll(result.items);
        _hasMore = result.hasNext;
        _page++;
        _initialLoad = false;
      });
      if (mounted && result.items.isNotEmpty) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          precacheProductCovers(context, result.items.map((p) => p.coverUrl));
        });
      }
    } catch (e) {
      if (!mounted) return;
      var fallback = _promoFallbackFromFeed();
      if (fallback.isEmpty) {
        try {
          final home = await ref.read(apiServiceProvider).getHome();
          fallback = home.promoProducts.isNotEmpty
              ? home.promoProducts
              : home.flashSale.products;
        } catch (_) {}
      }
      if (reset && fallback.isNotEmpty) {
        setState(() {
          _items.addAll(fallback);
          _hasMore = false;
          _initialLoad = false;
          _gridError = null;
        });
      } else if (reset || _items.isEmpty) {
        setState(() {
          _gridError = friendlyError(e);
          _initialLoad = false;
        });
      } else {
        // فشل صفحة لاحقة أثناء التمرير: أوقف الترقيم وامنع إعادة المحاولة اللانهائية.
        setState(() {
          _hasMore = false;
          _initialLoad = false;
        });
      }
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
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
    await Future.wait([
      _fetchMore(reset: true),
      _refreshCms(),
    ]);
  }

  bool _hasFlashSection(List<HomeSectionSlot> slots) =>
      slots.any((s) => s.section.type == 'FLASH_SALE');

  List<Product> _promoFallbackFromFeed() {
    final feed = ref.read(offersFeedProvider).valueOrNull;
    if (feed != null) {
      if (feed.promoProducts.isNotEmpty) return feed.promoProducts;
      if (feed.flashSale.products.isNotEmpty) return feed.flashSale.products;
    }
    return const [];
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final feed = ref.watch(offersFeedProvider);
    final feedData = feed.valueOrNull;
    final top = MediaQuery.paddingOf(context).top;
    final bottomPad = Responsive.shellBottomReserve(context);

    final slots = feedData != null ? resolveOffersSectionSlots(feedData) : const <HomeSectionSlot>[];
    final showFlashPulse = feedData != null &&
        feedData.flashSale.products.isNotEmpty &&
        !_hasFlashSection(slots);

    final showInitialSkeleton = _initialLoad && _items.isEmpty && _gridError == null;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
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
                    cacheExtent: AppScrollPerf.verticalCacheExtent,
                    slivers: [
                      SliverToBoxAdapter(
                        child: OffersHero(
                          topPad: top,
                          flashSale: feedData?.flashSale,
                        ),
                      ),
                      if (feed.isLoading && feedData == null)
                        const SliverToBoxAdapter(child: OffersCmsSkeleton()),
                      if (showFlashPulse)
                        SliverToBoxAdapter(child: OffersFlashPulse(flashSale: feedData.flashSale)),
                      SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            if (index >= slots.length) return null;
                            final slot = slots[index];
                            if (slot.isHero) {
                              return RepaintBoundary(
                                child: OffersCmsBanner(section: slot.section),
                              );
                            }
                            if (slot.section.type == 'FLASH_SALE' &&
                                slot.section.products.isNotEmpty) {
                              return OffersSectionFrame(
                                child: OffersFlashPulse(
                                  flashSale: FlashSale(
                                    endsAt: slot.section.endsAt,
                                    products: slot.section.products,
                                  ),
                                ),
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
                          childCount: slots.length,
                          addAutomaticKeepAlives: false,
                          addRepaintBoundaries: true,
                        ),
                      ),
                      if (_gridError != null && _items.isEmpty)
                        SliverFillRemaining(
                          hasScrollBody: false,
                          child: ErrorView(
                            message: _gridError!,
                            onRetry: () => _fetchMore(reset: true),
                          ),
                        )
                      else if (_items.isNotEmpty) ...[
                        SliverToBoxAdapter(
                          child: _DiscountTiers(
                            total: _visible.length,
                            selected: _minDiscount,
                            onSelect: (v) {
                              HapticFeedback.selectionClick();
                              setState(() => _minDiscount = v);
                              // فلتر ضيّق قد لا يملأ الشاشة فلا يُطلق التمرير تحميلاً جديداً.
                              if (_visible.length < 6 && _hasMore && !_loadingMore) _fetchMore();
                            },
                          ),
                        ),
                        SliverPadding(
                          padding: EdgeInsets.fromLTRB(OffersTheme.hPad, 0, OffersTheme.hPad, bottomPad),
                          sliver: SliverGrid(
                            gridDelegate: ProductGrid.delegateFor(context, listing: true),
                            delegate: SliverChildBuilderDelegate(
                              (context, i) {
                                final items = _visible;
                                if (i >= items.length) {
                                  return const ShimmerBox(height: double.infinity, radius: OffersTheme.cardRadius);
                                }
                                return RepaintBoundary(
                                  child: ProductCard(
                                    key: ValueKey(items[i].id),
                                    product: items[i],
                                    showPromoBadge: true,
                                    showRating: true,
                                    style: ProductCardStyle.listing,
                                  ),
                                );
                              },
                              childCount: _visible.length + (_hasMore ? 2 : 0),
                              addAutomaticKeepAlives: false,
                              addRepaintBoundaries: true,
                            ),
                          ),
                        ),
                      ]
                      else if (!_loadingMore && _items.isEmpty && _gridError == null)
                        SliverFillRemaining(
                          hasScrollBody: false,
                          child: _OffersEmptyState(
                            title: s.noOffersNow,
                            subtitle: s.checkBackSoon,
                            actionLabel: s.browseProductsBtn,
                            onAction: () => context.push('/products?title=${Uri.encodeComponent(s.products)}'),
                          ),
                        )
                      else
                        SliverToBoxAdapter(child: SizedBox(height: bottomPad)),
                    ],
                  ),
                ),
        ),
      ),
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

/// عنوان "كل العروض" مع شرائح نسب الخصم.
class _DiscountTiers extends ConsumerWidget {
  final int total;
  final int selected;
  final ValueChanged<int> onSelect;
  const _DiscountTiers({required this.total, required this.selected, required this.onSelect});

  static const _tiers = [0, 20, 30, 50];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ar = ref.s.isAr;
    final brand = OffersTheme.brand(context);
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
              Text(
                ar ? 'كل العروض' : 'All offers',
                style: OffersTheme.title(context, size: 16, color: OffersTheme.ink(context)),
              ),
              const SizedBox(width: 6),
              Text('($total)', style: OffersTheme.body(context, size: 12)),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 34,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _tiers.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final v = _tiers[i];
                final on = v == selected;
                final label = v == 0 ? (ar ? 'الكل' : 'All') : (ar ? 'خصم $v%+' : '$v%+ off');
                return GestureDetector(
                  onTap: () => onSelect(v),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: on ? brand : OffersTheme.brandSoft(context),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: brand.withValues(alpha: on ? 1 : 0.2)),
                    ),
                    child: Text(
                      label,
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
