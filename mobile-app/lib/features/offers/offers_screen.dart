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
import '../../core/widgets/scroll_perf.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_providers.dart';
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
      } else {
        setState(() {
          _gridError = friendlyError(e);
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
      await ref.read(apiServiceProvider).getOffers(forceRefresh: true);
      ref.invalidate(offersFeedProvider);
      await ref.read(offersFeedProvider.future);
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
        backgroundColor: OffersTheme.canvas,
        body: OffersCanvas(
          child: showInitialSkeleton && feedData == null && feed.isLoading
              ? const OffersLoadingView()
              : RefreshIndicator(
                  color: OffersTheme.brand,
                  backgroundColor: OffersTheme.surface,
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
                      else if (_items.isNotEmpty)
                        SliverPadding(
                          padding: EdgeInsets.fromLTRB(OffersTheme.hPad, 0, OffersTheme.hPad, bottomPad),
                          sliver: SliverGrid(
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              mainAxisSpacing: 12,
                              crossAxisSpacing: 12,
                              childAspectRatio: 0.58,
                            ),
                            delegate: SliverChildBuilderDelegate(
                              (context, i) {
                                if (i >= _items.length) {
                                  return const ShimmerBox(height: double.infinity, radius: OffersTheme.cardRadius);
                                }
                                return RepaintBoundary(
                                  child: ProductCard(
                                    key: ValueKey(_items[i].id),
                                    product: _items[i],
                                    showPromoBadge: true,
                                    showRating: true,
                                    style: ProductCardStyle.listing,
                                  ),
                                );
                              },
                              childCount: _items.length + (_hasMore ? 2 : 0),
                              addAutomaticKeepAlives: false,
                              addRepaintBoundaries: true,
                            ),
                          ),
                        )
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
              decoration: const BoxDecoration(
                color: OffersTheme.brandSoft,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.local_offer_outlined, size: 40, color: OffersTheme.brand),
            ),
            const SizedBox(height: 18),
            Text(title, textAlign: TextAlign.center, style: OffersTheme.title(size: 17, color: OffersTheme.ink)),
            const SizedBox(height: 8),
            Text(subtitle, textAlign: TextAlign.center, style: OffersTheme.body(size: 13)),
            const SizedBox(height: 22),
            OffersPrimaryButton(label: actionLabel, onPressed: onAction),
          ],
        ),
      ),
    );
  }
}
