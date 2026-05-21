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
import '../../../data/mock/mock_products.dart';
import '../../../data/models/product_model.dart';
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
  final List<ProductModel> _recommended =
      List<ProductModel>.from(MockProducts.all.take(20));
  int _page = 1;

  @override
  bool get wantKeepAlive => true;

  void _loadMore() {
    final start = _page * 20;
    if (start >= MockProducts.all.length) return;
    setState(() {
      _recommended.addAll(MockProducts.all.skip(start).take(20));
      _page++;
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
          onRefresh: () async {
            setState(() {
              _recommended
                ..clear()
                ..addAll(MockProducts.all.take(20));
              _page = 1;
            });
          },
          child: CustomScrollView(
            cacheExtent: 500,
            physics: const BouncingScrollPhysics(),
            slivers: [
              const SliverToBoxAdapter(child: HomeGreetingHeader()),
              const SliverToBoxAdapter(child: HomeSearchBar()),
              const SliverToBoxAdapter(child: HeroBannerSlider()),
              const SliverToBoxAdapter(child: SizedBox(height: 16)),
              SliverToBoxAdapter(
                child: SectionHeader(
                  title: 'تسوّقي حسب الفئة',
                  subtitle: 'اكتشفي ما يناسبكِ',
                  onSeeAll: () => context.go('/categories'),
                ),
              ),
              const SliverToBoxAdapter(child: CategoryCircles()),
              const SliverToBoxAdapter(child: SizedBox(height: 12)),
              const SliverToBoxAdapter(child: PromoStrip()),
              const SliverToBoxAdapter(child: SizedBox(height: 14)),
              const SliverToBoxAdapter(child: FlashSaleSection()),
              const SliverToBoxAdapter(child: SizedBox(height: 8)),
              SliverToBoxAdapter(
                child: SectionHeader(
                  title: AppStrings.featuredBrands,
                  subtitle: 'أرقى البراندات العالمية',
                  onSeeAll: () => context.go('/brands'),
                ),
              ),
              const SliverToBoxAdapter(child: BrandHorizontalList()),
              const SliverToBoxAdapter(child: SizedBox(height: 14)),
              SliverToBoxAdapter(
                child: SectionHeader(
                  title: AppStrings.packages,
                  subtitle: AppStrings.packagesSubtitle,
                ),
              ),
              const SliverToBoxAdapter(child: PackagesSection()),
              const SliverToBoxAdapter(child: SizedBox(height: 14)),
              SliverToBoxAdapter(
                child: SectionHeader(
                  title: AppStrings.newArrivals,
                  subtitle: 'وصلت لتوّها',
                ),
              ),
              SliverToBoxAdapter(
                child: ProductHorizontalList(
                  products: MockProducts.newArrivals,
                ),
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
                child: ProductHorizontalList(
                  products: MockProducts.bestSellers,
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 14)),
              SliverToBoxAdapter(
                child: SectionHeader(
                  title: AppStrings.recommended,
                  subtitle: 'مختارة خصيصاً لكِ',
                ),
              ),
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
                      if (index == _recommended.length - 3) {
                        WidgetsBinding.instance
                            .addPostFrameCallback((_) => _loadMore());
                      }
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
        ),
      ),
      floatingActionButton: _ChatFab(),
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
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 70),
      child: Material(
        color: AppColors.whatsapp,
        shape: const CircleBorder(),
        elevation: 6,
        shadowColor: AppColors.whatsapp.withValues(alpha: 0.35),
        child: InkWell(
          onTap: () => launchUrl(
            Uri.parse('https://wa.me/${AppStrings.whatsappNumber}'),
          ),
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
