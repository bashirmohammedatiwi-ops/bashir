import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/config/app_config.dart';
import '../../../core/providers/home_feed_provider.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/product_card.dart';
import '../../../data/models/product_model.dart';
import '../../../data/repositories/catalog_repository.dart';
import '../widgets/flash_sale_section.dart';
import '../widgets/home_categories_grid.dart';
import '../widgets/home_greeting_header.dart';
import '../widgets/home_promo_line.dart';
import '../widgets/home_section_header.dart';
import '../widgets/product_horizontal_list.dart';
import '../widgets/store_hero_banner.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with AutomaticKeepAliveClientMixin {
  List<ProductModel> _recommended = [];
  int _page = 1;
  bool _loadingMore = false;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _loadRecommended(reset: true);
  }

  Future<void> _loadRecommended({bool reset = false}) async {
    if (_loadingMore && !reset) return;
    _loadingMore = true;
    final page = reset ? 1 : _page;
    final repo = ref.read(catalogRepositoryProvider);
    final items = await repo.recommended(page: page);
    if (!mounted) return;
    setState(() {
      if (reset) {
        _recommended = items;
        _page = 2;
      } else {
        _recommended = [..._recommended, ...items];
        _page++;
      }
      _loadingMore = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final feed = ref.watch(homeFeedProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: feed.when(
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          ),
          error: (e, _) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.cloud_off, size: 48, color: AppColors.textMuted),
                  const SizedBox(height: 16),
                  Text(
                    'تعذر الاتصال بالمتجر',
                    style: AppTextStyles.title(),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    AppConfig.apiBaseUrl,
                    style: AppTextStyles.caption(),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: () => ref.invalidate(homeFeedProvider),
                    child: const Text('إعادة المحاولة'),
                  ),
                ],
              ),
            ),
          ),
          data: (data) => _buildScroll(data),
        ),
      ),
      floatingActionButton: const _ChatFab(),
    );
  }

  Widget _buildScroll(HomeFeedData data) {
    final picks = data.newArrivals.isNotEmpty
        ? data.newArrivals
        : data.bestSellers;

    return RefreshIndicator(
      color: AppColors.primary,
      backgroundColor: AppColors.surface,
      onRefresh: () async {
        ref.invalidate(homeFeedProvider);
        await _loadRecommended(reset: true);
        await ref.read(homeFeedProvider.future);
      },
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        slivers: [
          const SliverToBoxAdapter(child: HomeGreetingHeader()),
          const SliverToBoxAdapter(child: HomeSearchBar()),
          SliverToBoxAdapter(child: StoreHeroBanner(banners: data.banners)),
          const SliverToBoxAdapter(child: HomePromoLine()),
          SliverToBoxAdapter(
            child: HomeSectionHeader(
              title: 'الفئات',
              onSeeAll: () => context.go('/categories'),
            ),
          ),
          SliverToBoxAdapter(
            child: HomeCategoriesGrid(categories: data.categories),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 4)),
          if (data.promoProducts.isNotEmpty) ...[
            SliverToBoxAdapter(
              child: FlashSaleSection(
                products: data.promoProducts,
                endsAt: data.flashEndsAt,
              ),
            ),
          ],
          if (picks.isNotEmpty) ...[
            SliverToBoxAdapter(
              child: HomeSectionHeader(title: AppStrings.newArrivals),
            ),
            SliverToBoxAdapter(child: ProductHorizontalList(products: picks)),
          ],
          SliverToBoxAdapter(
            child: HomeSectionHeader(title: AppStrings.recommended),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              AppSizes.lg,
              0,
              AppSizes.lg,
              140,
            ),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.62,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  if (index == _recommended.length - 3 && _recommended.isNotEmpty) {
                    WidgetsBinding.instance
                        .addPostFrameCallback((_) => _loadRecommended());
                  }
                  if (index >= _recommended.length) return null;
                  return ProductCard(
                    product: _recommended[index],
                    index: index.clamp(0, 5),
                  );
                },
                childCount: _recommended.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatFab extends ConsumerWidget {
  const _ChatFab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final link = ref.watch(whatsappLinkProvider);
    return Padding(
      padding: const EdgeInsets.only(bottom: 72),
      child: FloatingActionButton(
        onPressed: link.isEmpty
            ? null
            : () => launchUrl(Uri.parse(link), mode: LaunchMode.externalApplication),
        backgroundColor: AppColors.whatsapp,
        elevation: 3,
        shape: const CircleBorder(),
        child: const Icon(Icons.chat_outlined, color: Colors.white, size: 22),
      ),
    );
  }
}
