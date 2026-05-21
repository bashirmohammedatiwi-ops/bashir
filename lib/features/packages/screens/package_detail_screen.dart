import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/product_visuals.dart';
import '../../../core/widgets/cached_image_widget.dart';
import '../../../core/widgets/product_showcase.dart';
import '../../../data/models/product_model.dart';
import '../../../data/models/product_package_model.dart';
import '../../cart/providers/cart_provider.dart';
import '../../products/providers/products_provider.dart';

class PackageDetailScreen extends ConsumerWidget {
  const PackageDetailScreen({super.key, required this.packageId});

  final String packageId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final packageAsync = ref.watch(packageDetailProvider(packageId));

    return packageAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => Scaffold(
        appBar: AppBar(title: const Text('الباقة')),
        body: Center(
          child: TextButton(
            onPressed: () => ref.invalidate(packageDetailProvider(packageId)),
            child: const Text('إعادة المحاولة'),
          ),
        ),
      ),
      data: (ProductPackageModel? package) {
        if (package == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('الباقة')),
            body: const Center(child: Text('الباقة غير موجودة')),
          );
        }

        final productsAsync =
            ref.watch(packageProductsProvider(package.productIds));
        final products = productsAsync.valueOrNull ?? const <ProductModel>[];

        return Scaffold(
          backgroundColor: AppColors.background,
          body: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverAppBar(
                expandedHeight: 240,
                pinned: true,
                backgroundColor: AppColors.surface,
                foregroundColor: AppColors.textPrimary,
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      CachedImageWidget(
                        imageUrl: package.coverImageUrl,
                        fit: BoxFit.cover,
                      ),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Color(0x33000000),
                              Color(0xCC1C1C24),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (package.badge != null) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 9,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.goldSoft,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: AppColors.gold),
                            ),
                            child: Text(
                              package.badge!,
                              style: AppTextStyles.caption(
                                color: AppColors.primaryDark,
                                size: 10,
                              ).copyWith(fontWeight: FontWeight.w800),
                            ),
                          ),
                          const SizedBox(height: 10),
                        ],
                        Text(
                          package.name,
                          style: AppTextStyles.headline(size: 22).copyWith(
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.4,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          package.subtitle,
                          style: AppTextStyles.body(
                            color: AppColors.textSecondary,
                            size: 13,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Text(
                              CurrencyFormatter.format(package.price),
                              style: AppTextStyles.headline(size: 20).copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              CurrencyFormatter.format(package.originalPrice),
                              style: AppTextStyles.caption(size: 12).copyWith(
                                decoration: TextDecoration.lineThrough,
                                color: AppColors.textMuted,
                              ),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.canvas,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Text(
                                'وفّري ${package.savingsPercent}%',
                                style: AppTextStyles.caption(
                                  color: AppColors.primary,
                                  size: 11,
                                ).copyWith(fontWeight: FontWeight.w800),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Row(
                          children: [
                            Text(
                              'محتويات الباقة',
                              style: AppTextStyles.title(size: 15).copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '(${products.length})',
                              style: AppTextStyles.caption(
                                color: AppColors.gold,
                                size: 12,
                              ).copyWith(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),
                ),
              ),
              if (productsAsync.isLoading && products.isEmpty)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final product = products[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _IncludedProductTile(product: product),
                        );
                      },
                      childCount: products.length,
                    ),
                  ),
                ),
            ],
          ),
          bottomNavigationBar: _PurchaseBar(
            package: package,
            onAddAll: () {
              final cart = ref.read(cartProvider.notifier);
              for (final p in products) {
                if (p.inStock) cart.addProduct(p);
              }
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'تمت إضافة ${products.length} منتجات إلى السلة',
                      style: AppTextStyles.body(color: Colors.white, size: 13),
                    ),
                  ),
                );
              }
            },
          ),
        );
      },
    );
  }
}

class _IncludedProductTile extends StatelessWidget {
  const _IncludedProductTile({required this.product});

  final ProductModel product;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: () => context.push('/product/${product.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.divider),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: ProductShowcase.forProduct(
                  imageUrl: product.images.isNotEmpty
                      ? product.images.first
                      : '',
                  product: product,
                  layout: ProductShowcaseLayout.cartThumb,
                  width: 64,
                  height: 64,
                  showBackground: true,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.brand.toUpperCase(),
                      style: AppTextStyles.caption(
                        color: AppColors.textMuted,
                        size: 9,
                      ).copyWith(
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      product.name,
                      style: AppTextStyles.title(size: 13).copyWith(
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      CurrencyFormatter.format(product.price),
                      style: AppTextStyles.caption(
                        color: AppColors.textPrimary,
                        size: 11.5,
                      ).copyWith(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.arrow_back,
                size: 16,
                color: AppColors.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PurchaseBar extends StatelessWidget {
  const _PurchaseBar({
    required this.package,
    required this.onAddAll,
  });

  final ProductPackageModel package;
  final VoidCallback onAddAll;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        12 + MediaQuery.paddingOf(context).bottom,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.divider)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'سعر الباقة',
                  style: AppTextStyles.caption(
                    color: AppColors.textMuted,
                    size: 11,
                  ),
                ),
                Text(
                  CurrencyFormatter.format(package.price),
                  style: AppTextStyles.headline(size: 17).copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: FilledButton.icon(
              onPressed: onAddAll,
              icon: const Icon(Icons.add_shopping_cart_outlined, size: 18),
              label: Text(
                AppStrings.addPackageToCart,
                style: AppTextStyles.title(size: 13).copyWith(
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
