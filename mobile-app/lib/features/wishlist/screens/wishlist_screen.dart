import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/luxe.dart';
import '../../../core/widgets/product_card.dart';
import '../providers/wishlist_provider.dart';

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(wishlistProductsProvider);
    final products = productsAsync.valueOrNull ?? [];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: productsAsync.isLoading
            ? const Center(child: CircularProgressIndicator())
            : products.isEmpty
            ? Column(
                children: [
                  _Header(count: 0),
                  Expanded(
                    child: EmptyState(
                      lottieAsset: 'assets/lottie/empty_wishlist.json',
                      title: 'اكتشفي المنتجات',
                      buttonLabel: AppStrings.startShopping,
                      onButtonPressed: () => context.go('/home'),
                    ),
                  ),
                ],
              )
            : CustomScrollView(
                physics: const BouncingScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(child: _Header(count: products.length)),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.canvas,
                          borderRadius:
                              BorderRadius.circular(AppSizes.cardRadius),
                          border: Border.all(
                            color: AppColors.gold.withValues(alpha: 0.22),
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.favorite_rounded,
                              size: 16,
                              color: AppColors.rose,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'لمسحٍ سريع، اسحبي البطاقة لاحقاً.',
                                style: AppTextStyles.caption(
                                  color: AppColors.textSecondary,
                                  size: 11.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
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
                          return Dismissible(
                            key: Key(products[index].id),
                            direction: DismissDirection.up,
                            onDismissed: (_) => ref
                                .read(wishlistProvider.notifier)
                                .remove(products[index].id),
                            child: ProductCard(
                              product: products[index],
                              index: index,
                            ),
                          );
                        },
                        childCount: products.length,
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.count});
  final int count;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.xl,
        AppSizes.lg,
        AppSizes.xl,
        AppSizes.md,
      ),
      child: Row(
        children: [
          PressedScale(
            onTap: () => Navigator.maybePop(context),
            child: Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: AppColors.surface,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.divider),
                boxShadow: const [AppColors.softShadow],
              ),
              child: const Icon(
                Icons.arrow_forward_rounded,
                size: 19,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          const Spacer(),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                AppStrings.wishlist,
                style: AppTextStyles.editorial(size: 26),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Text(
                    '$count منتج',
                    style: AppTextStyles.caption(
                      color: AppColors.textMuted,
                      size: 11,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    width: 4,
                    height: 4,
                    decoration: const BoxDecoration(
                      color: AppColors.rose,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
