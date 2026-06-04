import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/models/product_model.dart';
import '../../features/cart/providers/cart_provider.dart';
import '../../features/wishlist/providers/wishlist_provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_sizes.dart';
import '../constants/app_strings.dart';
import '../theme/text_styles.dart';
import '../utils/currency_formatter.dart';
import '../utils/product_visuals.dart';
import 'cached_image_widget.dart';
import 'luxe.dart';

/// بطاقة منتج كلاسيكية — صورة، اسم، سعر، وإجراءات واضحة.
class ProductCard extends ConsumerWidget {
  const ProductCard({
    super.key,
    required this.product,
    this.index = 0,
    this.heroTag,
    this.showcaseLayout,
  });

  final ProductModel product;
  final int index;
  final String? heroTag;
  final ProductShowcaseLayout? showcaseLayout;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wished = ref.watch(wishlistProvider).contains(product.id);
    final hero = heroTag ?? 'product_${product.id}';
    final imageUrl = product.images.isNotEmpty ? product.images.first : '';

    return PressedScale(
      onTap: () => context.push('/product/${product.id}'),
      scale: 0.98,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          border: Border.all(color: AppColors.divider),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 12,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _ImageSection(
                product: product,
                imageUrl: imageUrl,
                heroTag: hero,
                wished: wished,
                onWish: () =>
                    ref.read(wishlistProvider.notifier).toggle(product.id),
              ),
              _InfoSection(
                product: product,
                onAdd: product.inStock
                    ? () => _addToCart(context, ref)
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _addToCart(BuildContext context, WidgetRef ref) {
    ref.read(cartProvider.notifier).addProduct(product);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.primaryDark,
        margin: const EdgeInsets.all(AppSizes.lg),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSizes.buttonRadius),
        ),
        duration: const Duration(milliseconds: 1200),
        content: Text(
          'تمت الإضافة للسلة',
          style: AppTextStyles.body(color: Colors.white, size: 13),
        ),
      ),
    );
  }
}

class _ImageSection extends StatelessWidget {
  const _ImageSection({
    required this.product,
    required this.imageUrl,
    required this.heroTag,
    required this.wished,
    required this.onWish,
  });

  final ProductModel product;
  final String imageUrl;
  final String heroTag;
  final bool wished;
  final VoidCallback onWish;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 1,
      child: Stack(
        fit: StackFit.expand,
        children: [
          ColoredBox(color: AppColors.primaryMist),
          if (imageUrl.isNotEmpty)
            Hero(
              tag: heroTag,
              child: CachedImageWidget(
                imageUrl: imageUrl,
                fit: BoxFit.contain,
              ),
            )
          else
            const Center(
              child: Icon(
                Icons.image_outlined,
                color: AppColors.textMuted,
                size: 40,
              ),
            ),
          PositionedDirectional(
            top: AppSizes.sm,
            start: AppSizes.sm,
            child: _Badge(product: product),
          ),
          PositionedDirectional(
            top: AppSizes.sm,
            end: AppSizes.sm,
            child: _WishButton(active: wished, onTap: onWish),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.product});
  final ProductModel product;

  @override
  Widget build(BuildContext context) {
    final label = _label();
    if (label == null) return const SizedBox.shrink();

    final (bg, fg) = switch (label) {
      _BadgeKind.discount => (AppColors.primaryDark, AppColors.gold),
      _BadgeKind.newItem => (AppColors.primary, Colors.white),
      _BadgeKind.featured => (AppColors.rose, Colors.white),
      _BadgeKind.outOfStock => (AppColors.textMuted, Colors.white),
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSizes.sm,
        vertical: AppSizes.xs,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppSizes.chipRadius),
      ),
      child: Text(
        _text(label),
        style: AppTextStyles.caption(color: fg, size: 10).copyWith(
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  _BadgeKind? _label() {
    if (!product.inStock) return _BadgeKind.outOfStock;
    if (product.discountPercent > 0) return _BadgeKind.discount;
    if (product.isNew) return _BadgeKind.newItem;
    if (product.isBestSeller) return _BadgeKind.featured;
    return null;
  }

  String _text(_BadgeKind kind) => switch (kind) {
        _BadgeKind.discount =>
          '-${CurrencyFormatter.toArabicDigits('${product.discountPercent}')}٪',
        _BadgeKind.newItem => 'جديد',
        _BadgeKind.featured => 'الأكثر مبيعاً',
        _BadgeKind.outOfStock => AppStrings.outOfStock,
      };
}

enum _BadgeKind { discount, newItem, featured, outOfStock }

class _WishButton extends StatelessWidget {
  const _WishButton({required this.active, required this.onTap});
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.95),
      shape: const CircleBorder(),
      elevation: 1,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Padding(
          padding: const EdgeInsets.all(7),
          child: Icon(
            active ? Icons.favorite_rounded : Icons.favorite_border_rounded,
            size: 20,
            color: active ? AppColors.rose : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _InfoSection extends StatelessWidget {
  const _InfoSection({required this.product, required this.onAdd});
  final ProductModel product;
  final VoidCallback? onAdd;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.md,
        AppSizes.md,
        AppSizes.md,
        AppSizes.sm + 2,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (product.brand.isNotEmpty)
            Text(
              product.brand,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.caption(
                color: AppColors.textMuted,
                size: 11,
              ).copyWith(fontWeight: FontWeight.w600),
            ),
          const SizedBox(height: AppSizes.xs),
          Text(
            product.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.title(size: 13.5).copyWith(
              fontWeight: FontWeight.w600,
              height: 1.25,
            ),
          ),
          if (product.rating > 0) ...[
            const SizedBox(height: AppSizes.xs),
            Row(
              children: [
                const Icon(
                  Icons.star_rounded,
                  size: 14,
                  color: AppColors.gold,
                ),
                const SizedBox(width: 2),
                Text(
                  product.rating.toStringAsFixed(1),
                  style: AppTextStyles.caption(size: 11),
                ),
                if (product.reviewCount > 0) ...[
                  const SizedBox(width: 4),
                  Text(
                    '(${product.reviewCount})',
                    style: AppTextStyles.caption(
                      color: AppColors.textMuted,
                      size: 10,
                    ),
                  ),
                ],
              ],
            ),
          ],
          const SizedBox(height: AppSizes.sm),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(child: _PriceBlock(product: product)),
              const SizedBox(width: AppSizes.sm),
              _AddButton(onTap: onAdd),
            ],
          ),
        ],
      ),
    );
  }
}

class _PriceBlock extends StatelessWidget {
  const _PriceBlock({required this.product});
  final ProductModel product;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (product.discountPercent > 0)
          Text(
            CurrencyFormatter.format(product.originalPrice),
            style: AppTextStyles.caption(
              color: AppColors.textMuted,
              size: 11,
            ).copyWith(decoration: TextDecoration.lineThrough),
          ),
        Text(
          CurrencyFormatter.format(product.price),
          style: AppTextStyles.title(
            color: AppColors.primaryDark,
            size: 16,
          ).copyWith(fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}

class _AddButton extends StatelessWidget {
  const _AddButton({required this.onTap});
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Material(
      color: enabled ? AppColors.primary : AppColors.canvas,
      borderRadius: BorderRadius.circular(AppSizes.buttonRadius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSizes.buttonRadius),
        child: SizedBox(
          width: 40,
          height: 40,
          child: Icon(
            enabled ? Icons.add_shopping_cart_rounded : Icons.block_rounded,
            color: enabled ? Colors.white : AppColors.textMuted,
            size: 20,
          ),
        ),
      ),
    );
  }
}
