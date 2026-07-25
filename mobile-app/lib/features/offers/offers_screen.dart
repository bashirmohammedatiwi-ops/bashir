import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/cache/image_cache.dart';
import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/product_card.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/scroll_perf.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_providers.dart';
import '../home/home_section_renderer.dart';
import '../home/widgets/home_scroll_perf.dart';

/// تبويب العروض — أقسام CMS من لوحة التحكم + شبكة منتجات ترويجية.
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
  String? _gridError;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 400) {
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
      });
      if (mounted && result.items.isNotEmpty) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          precacheProductCovers(context, result.items.map((p) => p.coverUrl));
        });
      }
    } catch (e) {
      if (mounted) setState(() => _gridError = friendlyError(e));
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Future<void> _refreshAll() async {
    HapticFeedback.mediumImpact();
    await ref.read(apiCacheProvider).remove('offers_v1');
    ref.invalidate(offersFeedProvider);
    await _fetchMore(reset: true);
    await ref.read(offersFeedProvider.future);
  }

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(offersFeedProvider);
    final top = MediaQuery.paddingOf(context).top;
    final bottomPad = MediaQuery.paddingOf(context).bottom + 100;

    return Scaffold(
      backgroundColor: AppColors.scaffold,
      body: feed.when(
        loading: () => CustomScrollView(
          physics: AppScrollPerf.physics,
          slivers: const [SliverFillRemaining(child: ProductGridSkeleton(count: 6))],
        ),
        error: (e, _) => ErrorView(
          message: friendlyError(e),
          onRetry: _refreshAll,
        ),
        data: (data) {
          final slots = resolveOffersSectionSlots(data);
          final hasCms = slots.isNotEmpty;
          final promoCount = data.promoProducts.isNotEmpty
              ? data.promoProducts.length
              : data.flashSale.products.length;

          if (_items.isEmpty && !_loadingMore && _gridError == null) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) _fetchMore();
            });
          }

          return RefreshIndicator(
            color: AppColors.primary,
            edgeOffset: top + 20,
            onRefresh: _refreshAll,
            child: CustomScrollView(
              controller: _scroll,
              physics: AppScrollPerf.physics,
              cacheExtent: AppScrollPerf.verticalCacheExtent,
              slivers: [
                if (!hasCms)
                  SliverToBoxAdapter(child: _OffersHero(topPad: top, count: promoCount)),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      if (index >= slots.length) return null;
                      final slot = slots[index];
                      if (slot.isHero) {
                        return Padding(
                          padding: EdgeInsets.only(top: top),
                          child: RepaintBoundary(child: HeroHomeSection(section: slot.section)),
                        );
                      }
                      return HomeSectionWidget(
                        key: ValueKey(slot.section.id),
                        section: slot.section,
                        isFirstAfterHero: slot.isFirstAfterHero,
                      );
                    },
                    childCount: slots.length,
                    addAutomaticKeepAlives: false,
                    addRepaintBoundaries: true,
                  ),
                ),
                if (_items.isNotEmpty || _loadingMore) ...[
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, 8),
                    sliver: SliverToBoxAdapter(
                      child: Row(
                        children: [
                          Text('كل العروض', style: AppTypography.sectionTitle.copyWith(fontSize: 18)),
                          const Spacer(),
                          if (_items.isNotEmpty)
                            Text(
                              '${_items.length}+ منتج',
                              style: AppTypography.caption.copyWith(fontWeight: FontWeight.w700),
                            ),
                        ],
                      ),
                    ),
                  ),
                  if (_gridError != null && _items.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: ErrorView(message: _gridError!, onRetry: () => _fetchMore(reset: true)),
                    )
                  else
                    SliverPadding(
                      padding: EdgeInsets.fromLTRB(AppSpacing.md, 0, AppSpacing.md, bottomPad),
                      sliver: SliverGrid(
                        gridDelegate: ProductGrid.gridDelegate,
                        delegate: SliverChildBuilderDelegate(
                          (context, i) {
                            if (i >= _items.length) {
                              return const ShimmerBox(height: double.infinity, radius: AppRadius.lg);
                            }
                            return RepaintBoundary(
                              child: ProductCard(
                                key: ValueKey(_items[i].id),
                                product: _items[i],
                                showPromoBadge: true,
                                showRating: true,
                                lite: true,
                              ),
                            );
                          },
                          childCount: _items.length + (_hasMore ? 2 : 0),
                          addAutomaticKeepAlives: false,
                          addRepaintBoundaries: true,
                        ),
                      ),
                    ),
                ] else if (!hasCms && !_loadingMore) ...[
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: EmptyState(
                      icon: Icons.local_offer_outlined,
                      title: 'لا توجد عروض حالياً',
                      subtitle: 'عودي قريباً لاكتشاف تخفيضات جديدة',
                      action: ElevatedButton(
                        onPressed: () => context.push('/products?title=المنتجات'),
                        child: const Text('تصفّح المنتجات'),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _OffersHero extends StatelessWidget {
  final double topPad;
  final int count;

  const _OffersHero({required this.topPad, required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(AppSpacing.lg, topPad + 12, AppSpacing.lg, AppSpacing.xl),
      decoration: const BoxDecoration(
        gradient: AppColors.offerHeroGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                ),
                child: const Text(
                  'OFFERS',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => context.push('/products?isPromo=1&title=كل العروض'),
                style: TextButton.styleFrom(foregroundColor: Colors.white),
                child: const Text('الكل', style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ],
          ),
          const SizedBox(height: 18),
          const Text(
            'عروض\nاستثنائية',
            style: TextStyle(
              color: Colors.white,
              fontSize: 34,
              fontWeight: FontWeight.w900,
              height: 1.05,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            count > 0
                ? 'وفّري أكثر على $count منتج مختار بعناية'
                : 'اكتشفي أقوى التخفيضات على منتجات العناية والجمال',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.84),
              fontSize: 14,
              fontWeight: FontWeight.w600,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _HeroStat(icon: Icons.local_fire_department_rounded, label: 'تخفيضات حقيقية'),
              const SizedBox(width: 10),
              _HeroStat(icon: Icons.verified_rounded, label: 'منتجات أصلية'),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  final IconData icon;
  final String label;
  const _HeroStat({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
        ),
        child: Row(
          children: [
            Icon(icon, color: const Color(0xFFFFD4E0), size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
