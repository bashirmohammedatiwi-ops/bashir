import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_motion.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/product_visuals.dart';
import '../../../core/widgets/cached_image_widget.dart';
import '../../../core/widgets/luxe.dart';
import '../../../core/widgets/reveal.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/providers/catalog_providers.dart';
import '../../../data/models/product_model.dart';
import '../../../data/models/product_shade.dart';
import '../../../data/models/review_model.dart';
import '../../cart/providers/cart_provider.dart';
import '../../wishlist/providers/wishlist_provider.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({super.key, required this.productId});
  final String productId;

  @override
  ConsumerState<ProductDetailScreen> createState() => _State();
}

class _State extends ConsumerState<ProductDetailScreen> {
  int _imageIndex = 0;
  int _qty = 1;
  String? _selectedShade;
  String? _selectedSize;
  int _tabIndex = 0;
  final _pageController = PageController();

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(productDetailProvider(widget.productId));
    final relatedAsync = ref.watch(
      relatedProductsProvider((
        categoryId: detailAsync.valueOrNull?.product.categoryId ?? '',
        excludeId: widget.productId,
      )),
    );

    return detailAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('تعذر تحميل المنتج')),
      ),
      data: (detail) {
        if (detail == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const Center(child: Text('المنتج غير موجود')),
          );
        }
        final product = detail.product;
        final reviews = detail.reviews;
        final related = relatedAsync.valueOrNull ?? [];
        return _buildProductScaffold(context, product, reviews, related);
      },
    );
  }

  Widget _buildProductScaffold(
    BuildContext context,
    ProductModel product,
    List<ReviewModel> reviews,
    List<ProductModel> related,
  ) {
    final style = ProductVisuals.resolve(
      product,
      layout: ProductShowcaseLayout.hero,
    );
    final tint = style.backgroundColor;
    final isWishlisted = ref.watch(wishlistProvider).contains(product.id);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: _Hero(
              product: product,
              tint: tint,
              imageIndex: _imageIndex,
              pageController: _pageController,
              isWishlisted: isWishlisted,
              onBack: () => context.pop(),
              onWishlist: () =>
                  ref.read(wishlistProvider.notifier).toggle(product.id),
              onShare: () {},
              onPageChanged: (i) => setState(() => _imageIndex = i),
              onThumbTap: (i) => _pageController.animateToPage(
                i,
                duration: AppMotion.medium,
                curve: AppMotion.precise,
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Transform.translate(
              offset: const Offset(0, -22),
              child: Container(
                decoration: const BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.vertical(
                    top: Radius.circular(28),
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 44,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.divider,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Reveal(
                      delay: const Duration(milliseconds: 100),
                      child: _ProductHead(product: product),
                    ),
                    const SizedBox(height: 14),
                    Reveal(
                      delay: const Duration(milliseconds: 180),
                      child: _StatsRow(product: product),
                    ),
                    const SizedBox(height: 18),
                    if (product.shades != null && product.shades!.isNotEmpty) ...[
                      Reveal(
                        delay: const Duration(milliseconds: 240),
                        child: _ShadePicker(
                          shades: product.shades!,
                          selected: _selectedShade,
                          onSelect: (s) => setState(() => _selectedShade = s),
                        ),
                      ),
                      const SizedBox(height: 18),
                    ],
                    if (product.sizes != null && product.sizes!.isNotEmpty) ...[
                      Reveal(
                        delay: const Duration(milliseconds: 300),
                        child: _SizePicker(
                          sizes: product.sizes!,
                          selected: _selectedSize,
                          onSelect: (s) => setState(() => _selectedSize = s),
                        ),
                      ),
                      const SizedBox(height: 18),
                    ],
                    Reveal(
                      delay: const Duration(milliseconds: 360),
                      child: _DetailsTabs(
                        product: product,
                        tabIndex: _tabIndex,
                        onTab: (i) => setState(() => _tabIndex = i),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Reveal(
                      delay: const Duration(milliseconds: 420),
                      child: _ReviewsBlock(
                        product: product,
                        reviews: reviews,
                      ),
                    ),
                    if (related.isNotEmpty) ...[
                      const SizedBox(height: 22),
                      Luxe.sectionTitle(
                        title: AppStrings.related,
                        subtitle: 'منتجات قد تعجبكِ',
                        padding: EdgeInsets.zero,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
          if (related.isNotEmpty)
            SliverToBoxAdapter(
              child: Transform.translate(
                offset: const Offset(0, -22),
                child: Container(
                  color: AppColors.surface,
                  child: SizedBox(
                    height: 308,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      itemCount: related.length,
                      itemBuilder: (_, i) => SizedBox(
                        width: 170,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 5),
                          child: ProductCard(
                            product: related[i],
                            index: i,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 130)),
        ],
      ),
      bottomNavigationBar: _PurchaseBar(
        product: product,
        qty: _qty,
        onDecrement: product.inStock && _qty > 1
            ? () => setState(() => _qty--)
            : null,
        onIncrement: product.inStock && _qty < product.stock
            ? () => setState(() => _qty++)
            : null,
        onAdd: product.inStock
            ? () {
                ref.read(cartProvider.notifier).addProduct(
                      product,
                      quantity: _qty,
                      shade: _selectedShade,
                      size: _selectedSize,
                    );
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('تمت الإضافة إلى السلة ✓'),
                    behavior: SnackBarBehavior.floating,
                    duration: Duration(milliseconds: 900),
                  ),
                );
              }
            : null,
      ),
    );
  }
}

// ============= HERO =============
class _Hero extends StatelessWidget {
  const _Hero({
    required this.product,
    required this.tint,
    required this.imageIndex,
    required this.pageController,
    required this.isWishlisted,
    required this.onBack,
    required this.onWishlist,
    required this.onShare,
    required this.onPageChanged,
    required this.onThumbTap,
  });

  final ProductModel product;
  final Color tint;
  final int imageIndex;
  final PageController pageController;
  final bool isWishlisted;
  final VoidCallback onBack;
  final VoidCallback onWishlist;
  final VoidCallback onShare;
  final ValueChanged<int> onPageChanged;
  final ValueChanged<int> onThumbTap;

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.sizeOf(context).height * 0.50;
    return SizedBox(
      height: height,
      child: Stack(
        children: [
          // Gradient background
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color.lerp(tint, Colors.white, 0.15)!,
                    tint,
                    Color.lerp(tint, AppColors.canvas, 0.5)!,
                  ],
                ),
              ),
            ),
          ),
          // Decorative rings
          Positioned(
            top: -80,
            right: -80,
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.gold.withValues(alpha: 0.18),
                ),
              ),
            ),
          ),
          Positioned(
            top: -30,
            right: -30,
            child: Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.18),
              ),
            ),
          ),
          // Brand watermark
          Positioned(
            top: 100,
            left: 20,
            child: Opacity(
              opacity: 0.06,
              child: Text(
                product.brand.toUpperCase(),
                style: AppTextStyles.editorial(
                  size: 80,
                  weight: FontWeight.w400,
                  color: AppColors.primaryDark,
                ),
              ),
            ),
          ),
          // Image PageView
          PageView.builder(
            controller: pageController,
            onPageChanged: onPageChanged,
            itemCount: product.images.length,
            itemBuilder: (_, i) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 40,
                  ),
                  child: Hero(
                    tag: i == 0
                        ? 'product_${product.id}'
                        : 'product_${product.id}_$i',
                    child: CachedImageWidget(
                      imageUrl: product.images[i],
                      fit: BoxFit.contain,
                      transparentPlaceholder: true,
                    ),
                  ),
                ),
              );
            },
          ),
          // Shadow under product
          Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                width: 120,
                height: 16,
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    colors: [
                      Colors.black.withValues(alpha: 0.18),
                      Colors.transparent,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(40),
                ),
              ),
            ),
          ),
          // Top bar
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 8,
              ),
              child: Row(
                children: [
                  Luxe.glassIconButton(
                    icon: Icons.arrow_forward_rounded,
                    onTap: onBack,
                    background: Colors.white.withValues(alpha: 0.7),
                    iconColor: AppColors.primaryDark,
                  ),
                  const Spacer(),
                  Luxe.glassIconButton(
                    icon: Icons.share_outlined,
                    onTap: onShare,
                    background: Colors.white.withValues(alpha: 0.7),
                    iconColor: AppColors.primaryDark,
                  ),
                  const SizedBox(width: 8),
                  Luxe.glassIconButton(
                    icon: isWishlisted
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    iconColor: isWishlisted
                        ? AppColors.rose
                        : AppColors.primaryDark,
                    onTap: onWishlist,
                    background: Colors.white.withValues(alpha: 0.7),
                  ),
                ],
              ),
            ),
          ),
          // Thumbnails column
          if (product.images.length > 1)
            PositionedDirectional(
              top: 90,
              end: 14,
              child: Column(
                children: List.generate(
                  product.images.length.clamp(0, 4),
                  (i) {
                    final active = i == imageIndex;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: PressedScale(
                        onTap: () => onThumbTap(i),
                        scale: 0.92,
                        child: AnimatedContainer(
                          duration: AppMotion.fast,
                          width: 46,
                          height: 46,
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.85),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: active
                                  ? AppColors.gold
                                  : Colors.white.withValues(alpha: 0.2),
                              width: active ? 1.6 : 1,
                            ),
                            boxShadow: active
                                ? [
                                    BoxShadow(
                                      color: AppColors.gold
                                          .withValues(alpha: 0.35),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ]
                                : null,
                          ),
                          child: CachedImageWidget(
                            imageUrl: product.images[i],
                            fit: BoxFit.contain,
                            transparentPlaceholder: true,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          // Bottom: image indicator + brand chip
          PositionedDirectional(
            bottom: 42,
            start: 0,
            end: 0,
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(product.images.length, (i) {
                  final active = i == imageIndex;
                  return AnimatedContainer(
                    duration: AppMotion.fast,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: active ? 20 : 5,
                    height: 5,
                    decoration: BoxDecoration(
                      color: active
                          ? AppColors.primaryDark
                          : AppColors.primaryDark.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  );
                }),
              ),
            ),
          ),
          PositionedDirectional(
            bottom: 14,
            start: 0,
            end: 0,
            child: Center(
              child: Luxe.editorialBadge(
                label: product.brand,
                color: AppColors.primaryDark,
                backgroundColor: AppColors.surface.withValues(alpha: 0.9),
              ),
            ),
          ),
          if (product.discountPercent > 0)
            PositionedDirectional(
              top: 80,
              start: 18,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primaryDark,
                  borderRadius: BorderRadius.circular(AppSizes.tinyRadius),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x224A2466),
                      blurRadius: 10,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Text(
                  '-${CurrencyFormatter.toArabicDigits('${product.discountPercent}')}٪',
                  style: AppTextStyles.caption(
                    color: AppColors.gold,
                    size: 11,
                  ).copyWith(fontWeight: FontWeight.w800, letterSpacing: 0.5),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ============= HEAD =============
class _ProductHead extends StatelessWidget {
  const _ProductHead({required this.product});
  final ProductModel product;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Luxe.editorialBadge(
              label: product.brand.toUpperCase(),
              color: AppColors.primaryDark,
              backgroundColor: AppColors.canvas,
            ),
            if (product.isBestSeller) ...[
              const SizedBox(width: 6),
              Luxe.editorialBadge(
                label: AppStrings.bestSellerBadge,
                icon: Icons.workspace_premium_rounded,
                color: AppColors.gold,
                backgroundColor: AppColors.gold.withValues(alpha: 0.14),
              ),
            ],
          ],
        ),
        const SizedBox(height: 12),
        Text(
          product.name,
          style: AppTextStyles.editorial(size: 26),
        ),
        const SizedBox(height: 8),
        Luxe.goldenRule(width: 60),
        const SizedBox(height: 10),
        Text(
          product.description,
          style: AppTextStyles.body(
            color: AppColors.textSecondary,
            size: 12.5,
          ).copyWith(height: 1.6),
          maxLines: 3,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}

// ============= STATS =============
class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.product});
  final ProductModel product;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.canvas,
        borderRadius: BorderRadius.circular(AppSizes.cardRadius),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.18)),
      ),
      child: Row(
        children: [
          Expanded(
            child: _Stat(
              icon: Icons.star_rounded,
              color: AppColors.gold,
              value: product.rating.toStringAsFixed(1),
              label: '${product.reviewCount} تقييم',
            ),
          ),
          Container(width: 1, height: 36, color: AppColors.divider),
          Expanded(
            child: _Stat(
              icon: Icons.local_shipping_outlined,
              color: AppColors.primaryDark,
              value: '${product.soldCount}',
              label: 'تم بيعه',
            ),
          ),
          Container(width: 1, height: 36, color: AppColors.divider),
          Expanded(
            child: _Stat(
              icon: Icons.diamond_outlined,
              color: AppColors.rose,
              value: '${product.pointsEarned}',
              label: 'نقطة',
            ),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({
    required this.icon,
    required this.color,
    required this.value,
    required this.label,
  });
  final IconData icon;
  final Color color;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.surface,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.divider),
          ),
          child: Icon(icon, size: 17, color: color),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: AppTextStyles.serif(
            color: AppColors.textPrimary,
            size: 16,
            weight: FontWeight.w500,
            style: FontStyle.italic,
          ),
        ),
        Text(
          label,
          style: AppTextStyles.caption(
            color: AppColors.textMuted,
            size: 10.5,
          ),
        ),
      ],
    );
  }
}

// ============= SHADE PICKER =============
class _ShadePicker extends StatelessWidget {
  const _ShadePicker({
    required this.shades,
    required this.selected,
    required this.onSelect,
  });
  final List<ProductShade> shades;
  final String? selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'اللون',
              style: AppTextStyles.title(size: 13).copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const Spacer(),
            if (selected != null)
              Text(
                selected!,
                style: AppTextStyles.caption(
                  color: AppColors.primaryDark,
                  size: 11,
                ).copyWith(fontWeight: FontWeight.w800),
              ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 56,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: shades.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final s = shades[i];
              final isSel = selected == s.name;
              final color = Color(
                int.parse(s.colorHex.replaceFirst('#', '0xFF')),
              );
              return PressedScale(
                onTap: () => onSelect(s.name),
                scale: 0.9,
                child: AnimatedContainer(
                  duration: AppMotion.fast,
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSel ? AppColors.gold : Colors.white,
                      width: isSel ? 3 : 3,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: isSel
                            ? AppColors.gold.withValues(alpha: 0.45)
                            : Colors.black.withValues(alpha: 0.08),
                        blurRadius: isSel ? 12 : 5,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: isSel
                      ? const Icon(
                          Icons.check_rounded,
                          color: Colors.white,
                          size: 18,
                        )
                      : null,
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ============= SIZE PICKER =============
class _SizePicker extends StatelessWidget {
  const _SizePicker({
    required this.sizes,
    required this.selected,
    required this.onSelect,
  });
  final List<String> sizes;
  final String? selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'الحجم',
          style: AppTextStyles.title(size: 13).copyWith(
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: sizes.map((s) {
            final isSel = selected == s;
            return PressedScale(
              onTap: () => onSelect(s),
              scale: 0.94,
              child: AnimatedContainer(
                duration: AppMotion.fast,
                padding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                decoration: BoxDecoration(
                  gradient: isSel
                      ? const LinearGradient(
                          colors: [
                            AppColors.primary,
                            AppColors.primaryDark,
                          ],
                        )
                      : null,
                  color: isSel ? null : AppColors.canvas,
                  borderRadius: BorderRadius.circular(AppSizes.tinyRadius),
                  border: Border.all(
                    color: isSel ? AppColors.gold : AppColors.divider,
                  ),
                ),
                child: Text(
                  s,
                  style: AppTextStyles.title(
                    color: isSel ? Colors.white : AppColors.textPrimary,
                    size: 12,
                  ).copyWith(fontWeight: FontWeight.w800),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

// ============= DETAILS =============
class _DetailsTabs extends StatelessWidget {
  const _DetailsTabs({
    required this.product,
    required this.tabIndex,
    required this.onTab,
  });
  final ProductModel product;
  final int tabIndex;
  final ValueChanged<int> onTab;

  @override
  Widget build(BuildContext context) {
    final tabs = [
      AppStrings.description,
      AppStrings.howToUse,
      AppStrings.ingredients,
    ];
    final bodies = [
      product.description,
      product.howToUse,
      product.ingredients,
    ];

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.canvas.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(AppSizes.cardRadius),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppSizes.tinyRadius + 2),
              border: Border.all(color: AppColors.divider),
            ),
            child: Row(
              children: List.generate(tabs.length, (i) {
                final isSel = i == tabIndex;
                return Expanded(
                  child: PressedScale(
                    onTap: () => onTab(i),
                    scale: 0.96,
                    child: AnimatedContainer(
                      duration: AppMotion.fast,
                      padding: const EdgeInsets.symmetric(vertical: 9),
                      decoration: BoxDecoration(
                        gradient: isSel
                            ? const LinearGradient(
                                colors: [
                                  AppColors.primary,
                                  AppColors.primaryDark,
                                ],
                              )
                            : null,
                        borderRadius: BorderRadius.circular(AppSizes.tinyRadius),
                      ),
                      child: Center(
                        child: Text(
                          tabs[i],
                          style: AppTextStyles.caption(
                            color: isSel ? Colors.white : AppColors.textSecondary,
                            size: 11.5,
                          ).copyWith(
                            fontWeight:
                                isSel ? FontWeight.w800 : FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 14),
          AnimatedSwitcher(
            duration: AppMotion.fast,
            child: Text(
              bodies[tabIndex],
              key: ValueKey(tabIndex),
              style: AppTextStyles.body(
                color: AppColors.textSecondary,
                size: 12.5,
              ).copyWith(height: 1.6),
            ),
          ),
        ],
      ),
    );
  }
}

// ============= REVIEWS =============
class _ReviewsBlock extends StatelessWidget {
  const _ReviewsBlock({required this.product, required this.reviews});
  final ProductModel product;
  final List<ReviewModel> reviews;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              AppStrings.reviews,
              style: AppTextStyles.title(size: 14).copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              '(${product.reviewCount})',
              style: AppTextStyles.caption(
                color: AppColors.gold,
                size: 11,
              ).copyWith(fontWeight: FontWeight.w800),
            ),
            const Spacer(),
            Row(
              children: [
                const Icon(Icons.star_rounded, color: AppColors.gold, size: 16),
                const SizedBox(width: 3),
                Text(
                  product.rating.toStringAsFixed(1),
                  style: AppTextStyles.serif(
                    color: AppColors.textPrimary,
                    size: 14,
                    weight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (reviews.isEmpty)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.canvas,
              borderRadius: BorderRadius.circular(AppSizes.cardRadius),
            ),
            child: Text(
              'لا توجد تقييمات بعد. كوني أول من يقيّم!',
              style: AppTextStyles.body(
                color: AppColors.textSecondary,
                size: 12.5,
              ),
            ),
          )
        else
          ...reviews.take(3).map((r) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _ReviewTile(review: r),
              )),
      ],
    );
  }
}

class _ReviewTile extends StatelessWidget {
  const _ReviewTile({required this.review});
  final ReviewModel review;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSizes.cardRadius),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 14,
                backgroundColor: AppColors.canvas,
                child: Text(
                  review.userName.isNotEmpty ? review.userName[0] : '?',
                  style: AppTextStyles.serif(
                    color: AppColors.primaryDark,
                    size: 13,
                    weight: FontWeight.w500,
                    style: FontStyle.italic,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                review.userName,
                style: AppTextStyles.title(size: 12).copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Spacer(),
              Row(
                children: List.generate(5, (i) {
                  return Icon(
                    Icons.star_rounded,
                    size: 12,
                    color: i < review.rating
                        ? AppColors.gold
                        : AppColors.divider,
                  );
                }),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            review.comment,
            style: AppTextStyles.body(
              color: AppColors.textSecondary,
              size: 12,
            ).copyWith(height: 1.5),
          ),
        ],
      ),
    );
  }
}

// ============= PURCHASE BAR =============
class _PurchaseBar extends StatelessWidget {
  const _PurchaseBar({
    required this.product,
    required this.qty,
    required this.onDecrement,
    required this.onIncrement,
    required this.onAdd,
  });

  final ProductModel product;
  final int qty;
  final VoidCallback? onDecrement;
  final VoidCallback? onIncrement;
  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    final total = product.price * qty;
    final disabled = onAdd == null;
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: const Border(top: BorderSide(color: AppColors.divider)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    qty > 1 ? 'الإجمالي' : 'السعر',
                    style: AppTextStyles.caption(
                      color: AppColors.textMuted,
                      size: 10.5,
                    ).copyWith(letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    CurrencyFormatter.format(total),
                    style: AppTextStyles.serif(
                      color: AppColors.primaryDark,
                      size: 22,
                      weight: FontWeight.w500,
                      style: FontStyle.italic,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 12),
              // Qty
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  borderRadius: BorderRadius.circular(AppSizes.tinyRadius),
                  border: Border.all(color: AppColors.divider),
                ),
                child: Row(
                  children: [
                    _QtyBtn(icon: Icons.remove, onTap: onDecrement),
                    SizedBox(
                      width: 28,
                      child: Text(
                        '$qty',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.title(size: 14).copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    _QtyBtn(icon: Icons.add, onTap: onIncrement),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Luxe.primaryButton(
                  label: disabled
                      ? AppStrings.outOfStock
                      : AppStrings.addToCart,
                  icon: disabled
                      ? Icons.remove_shopping_cart_outlined
                      : Icons.shopping_bag_outlined,
                  onTap: onAdd,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QtyBtn extends StatelessWidget {
  const _QtyBtn({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return PressedScale(
      onTap: onTap,
      scale: 0.88,
      child: Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          color: enabled ? AppColors.surface : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: enabled ? AppColors.divider : Colors.transparent,
          ),
        ),
        child: Icon(
          icon,
          size: 16,
          color: enabled ? AppColors.primaryDark : AppColors.textMuted,
        ),
      ),
    );
  }
}
