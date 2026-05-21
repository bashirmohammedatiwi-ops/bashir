import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/luxe.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../../data/models/brand_model.dart';
import '../../../data/models/product_model.dart';
import '../../../data/models/product_package_model.dart';
import '../../../data/repositories/catalog_repository.dart';
import '../providers/home_provider.dart';
import '../widgets/brand_horizontal_list.dart';
import '../widgets/category_circles.dart';
import '../widgets/flash_sale_section.dart';
import '../widgets/hero_banner_slider.dart';
import '../widgets/home_greeting_header.dart';
import '../widgets/packages_section.dart';
import '../widgets/product_horizontal_list.dart';
import '../widgets/promo_strip.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with AutomaticKeepAliveClientMixin {
  final List<ProductModel> _extraRecommended = [];
  int _recommendedPage = 1;
  bool _loadingMore = false;

  @override
  bool get wantKeepAlive => true;

  Future<void> _loadMoreRecommended() async {
    if (_loadingMore) return;
    setState(() => _loadingMore = true);
    try {
      final more = await ref.read(catalogRepositoryProvider).recommended(
            page: _recommendedPage + 1,
          );
      if (more.isEmpty) return;
      setState(() {
        _recommendedPage++;
        _extraRecommended.addAll(more);
      });
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final feedAsync = ref.watch(homeFeedProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: feedAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          ),
          error: (_, __) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('تعذّر تحميل الصفحة الرئيسية'),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => ref.invalidate(homeFeedProvider),
                  child: const Text('إعادة المحاولة'),
                ),
              ],
            ),
          ),
          data: (feed) {
            final recommended = [...feed.recommended, ..._extraRecommended];
            return RefreshIndicator(
              color: AppColors.primary,
              backgroundColor: AppColors.surface,
              onRefresh: () async {
                setState(() {
                  _recommendedPage = 1;
                  _extraRecommended.clear();
                });
                ref.invalidate(homeFeedProvider);
                await ref.read(homeFeedProvider.future);
              },
              child: CustomScrollView(
                cacheExtent: 500,
                physics: const BouncingScrollPhysics(),
                slivers: [
                  const SliverToBoxAdapter(child: HomeGreetingHeader()),
                  const SliverToBoxAdapter(child: HomeSearchBar()),
                  SliverToBoxAdapter(
                    child: HeroBannerSlider(banners: feed.banners),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 16)),
                  SliverToBoxAdapter(
                    child: SectionHeader(
                      title: 'تسوّقي حسب الفئة',
                      subtitle: 'اكتشفي ما يناسبكِ',
                      onSeeAll: () => context.go('/categories'),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: CategoryCircles(categories: feed.categories),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 12)),
                  const SliverToBoxAdapter(child: PromoStrip()),
                  const SliverToBoxAdapter(child: SizedBox(height: 14)),
                  SliverToBoxAdapter(
                    child: FlashSaleSection(
                      products: feed.promoProducts,
                      endsAt: feed.flashEndsAt,
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 8)),
                  SliverToBoxAdapter(
                    child: SectionHeader(
                      title: AppStrings.featuredBrands,
                      subtitle: 'أرقى البراندات العالمية',
                      onSeeAll: () => context.go('/brands'),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: BrandHorizontalList(
                      brands: feed.brands
                          .where((BrandModel b) => b.isFeatured)
                          .toList(),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 14)),
                  SliverToBoxAdapter(
                    child: SectionHeader(
                      title: AppStrings.packages,
                      subtitle: AppStrings.packagesSubtitle,
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: PackagesSection(
                      packages: feed.packages
                          .where((ProductPackageModel p) => p.isFeatured)
                          .toList(),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 14)),
                  SliverToBoxAdapter(
                    child: SectionHeader(
                      title: AppStrings.newArrivals,
                      subtitle: 'وصلت لتوّها',
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: ProductHorizontalList(products: feed.newArrivals),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 14)),
                  const SliverToBoxAdapter(child: _SpecialOfferCard()),
                  const SliverToBoxAdapter(child: SizedBox(height: 14)),
                  SliverToBoxAdapter(
                    child: SectionHeader(
                      title: AppStrings.bestSellers,
                      subtitle: 'الأكثر مبيعاً هذا الأسبوع',
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: ProductHorizontalList(products: feed.bestSellers),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 14)),
                  SliverToBoxAdapter(
                    child: SectionHeader(
                      title: AppStrings.recommended,
                      subtitle: 'مختارة خصيصاً لكِ',
                    ),
                  ),
                  if (recommended.isEmpty)
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(child: Text('لا توجد منتجات مقترحة')),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(
                        AppSizes.lg,
                        0,
                        AppSizes.lg,
                        140,
                      ),
                      sliver: SliverGrid(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.62,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            if (index == recommended.length - 3 &&
                                !_loadingMore) {
                              WidgetsBinding.instance.addPostFrameCallback(
                                (_) => _loadMoreRecommended(),
                              );
                            }
                            return ProductCard(
                              product: recommended[index],
                              index: index.clamp(0, 5),
                            );
                          },
                          childCount: recommended.length,
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
      floatingActionButton: _ChatFab(whatsapp: feedAsync.valueOrNull?.whatsapp),
    );
  }
}

class _SpecialOfferCard extends StatelessWidget {
  const _SpecialOfferCard();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSizes.xl),
      child: Container(
        height: 134,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF1A0F26), Color(0xFF4A2466)],
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
          ),
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          boxShadow: const [AppColors.plumShadow],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Positioned(
              right: -30,
              top: -30,
              child: Container(
                width: 130,
                height: 130,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.gold.withValues(alpha: 0.10),
                ),
              ),
            ),
            Positioned(
              right: 20,
              bottom: -30,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.18),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSizes.lg),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Luxe.editorialBadge(
                          label: 'حصري',
                          icon: Icons.workspace_premium_rounded,
                          color: AppColors.gold,
                          backgroundColor:
                              AppColors.gold.withValues(alpha: 0.14),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'خصم ٢٠٪ لأول طلب',
                          style: AppTextStyles.editorial(
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'استخدمي كود: ALHAYAA20',
                          style: AppTextStyles.caption(
                            color: Colors.white.withValues(alpha: 0.78),
                            size: 11,
                          ).copyWith(letterSpacing: 0.8),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 70,
                    height: 70,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.gold, Color(0xFFB8975A)],
                        begin: Alignment.topRight,
                        end: Alignment.bottomLeft,
                      ),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.gold.withValues(alpha: 0.35),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.card_giftcard_rounded,
                      color: AppColors.primaryDark,
                      size: 32,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChatFab extends StatelessWidget {
  const _ChatFab({this.whatsapp});
  final String? whatsapp;

  @override
  Widget build(BuildContext context) {
    final number = whatsapp ?? AppStrings.whatsappNumber;
    return Padding(
      padding: const EdgeInsets.only(bottom: 70),
      child: Material(
        color: AppColors.whatsapp,
        shape: const CircleBorder(),
        elevation: 6,
        shadowColor: AppColors.whatsapp.withValues(alpha: 0.35),
        child: InkWell(
          onTap: () => launchUrl(Uri.parse('https://wa.me/$number')),
          customBorder: const CircleBorder(),
          child: const SizedBox(
            width: 50,
            height: 50,
            child: Icon(Icons.chat_bubble, color: Colors.white, size: 22),
          ),
        ),
      ),
    );
  }
}
