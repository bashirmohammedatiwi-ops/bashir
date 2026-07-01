import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';
import '../../features/cart/cart_provider.dart';
import '../../features/wishlist/wishlist_provider.dart';
import '../../features/auth/auth_provider.dart';
import '../theme/app_colors.dart';
import '../utils/formatters.dart';
import 'app_network_image.dart';

class ProductCard extends ConsumerWidget {
  final Product product;
  final double? width;
  final bool showPromoBadge;
  final bool showRating;
  final String? flashTimer;
  const ProductCard({
    super.key,
    required this.product,
    this.width,
    this.showPromoBadge = false,
    this.showRating = false,
    this.flashTimer,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wished = ref.watch(wishlistProvider).ids.contains(product.id);

    return GestureDetector(
      onTap: () => context.push('/product/${product.slug.isNotEmpty ? product.slug : product.id}'),
      child: Container(
        width: width,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFEFEFEF)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(9)),
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: ProductCoverImage(
                      url: product.coverUrl,
                      width: width ?? 148,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
                Positioned(top: 5, left: 5, child: _WishButton(product: product, wished: wished)),
                if (product.hasDiscount)
                  Positioned(
                    top: 5,
                    right: 5,
                    child: _Badge(label: '-${product.discountPercent}%', color: AppColors.sale),
                  ),
                Positioned(
                  bottom: 5,
                  left: 5,
                  right: 5,
                  child: Wrap(
                    spacing: 3,
                    runSpacing: 3,
                    children: [
                      if (flashTimer != null && flashTimer!.isNotEmpty)
                        _Badge(label: 'ينتهي $flashTimer', color: AppColors.sale),
                      if (product.isNew) const _Badge(label: 'جديد', color: AppColors.success),
                      if (product.isBestSeller)
                        const _Badge(label: 'الأكثر شهرة', color: Color(0xFF388E3C)),
                      if (showPromoBadge && product.isPromo && flashTimer == null)
                        const _Badge(label: 'عرض', color: AppColors.sale),
                    ],
                  ),
                ),
                Positioned(
                  bottom: -8,
                  right: 6,
                  child: _AddButton(product: product),
                ),
                if (!product.inStock)
                  Positioned.fill(
                    child: Container(
                      color: Colors.white.withValues(alpha: 0.7),
                      alignment: Alignment.center,
                      child: const Text('نفد المخزون',
                          style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.sale, fontSize: 11)),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 10, 8, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, height: 1.2),
                  ),
                  if (showRating && product.rating > 0) ...[
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, size: 12, color: AppColors.star),
                        const SizedBox(width: 2),
                        Text(
                          product.rating.toStringAsFixed(1),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
                        ),
                        if (product.reviewCount > 0)
                          Text(
                            ' (${product.reviewCount})',
                            style: TextStyle(fontSize: 9, color: Colors.grey.shade500),
                          ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Text(formatPrice(product.price),
                          style: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.primary)),
                      if (product.hasDiscount) ...[
                        const SizedBox(width: 4),
                        Text(formatPrice(product.originalPrice),
                            style: TextStyle(
                                fontSize: 10,
                                color: Colors.grey.shade500,
                                decoration: TextDecoration.lineThrough)),
                      ],
                      const Spacer(),
                      if (product.brandName.isNotEmpty)
                        Flexible(
                          child: Text(product.brandName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.end,
                              style: TextStyle(
                                  color: Colors.grey.shade500,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600)),
                        ),
                    ],
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

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(label,
          style: const TextStyle(color: Colors.white, fontSize: 8.5, fontWeight: FontWeight.w700)),
    );
  }
}

class _AddButton extends ConsumerWidget {
  final Product product;
  const _AddButton({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enabled = product.inStock;
    return Material(
      color: enabled ? Colors.white : Colors.grey.shade300,
      elevation: 2,
      shadowColor: Colors.black26,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: enabled
            ? () {
                if (product.shades.isNotEmpty) {
                  context.push('/product/${product.slug.isNotEmpty ? product.slug : product.id}');
                  return;
                }
                ref.read(cartProvider.notifier).add(product);
                ScaffoldMessenger.of(context)
                  ..hideCurrentSnackBar()
                  ..showSnackBar(const SnackBar(
                    content: Text('أُضيف إلى السلة'),
                    duration: Duration(seconds: 1),
                  ));
              }
            : null,
        child: Padding(
          padding: const EdgeInsets.all(6),
          child: Icon(Icons.add_rounded, color: enabled ? const Color(0xFF333333) : Colors.grey, size: 18),
        ),
      ),
    );
  }
}

class _WishButton extends ConsumerWidget {
  final Product product;
  final bool wished;
  const _WishButton({required this.product, required this.wished});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Material(
      color: Colors.white.withValues(alpha: 0.95),
      shape: const CircleBorder(),
      elevation: 1,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: () async {
          if (!ref.read(authProvider).isAuthenticated) {
            context.push('/login');
            return;
          }
          await ref.read(wishlistProvider.notifier).toggle(product);
        },
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: Icon(
            wished ? Icons.favorite_rounded : Icons.favorite_border_rounded,
            size: 14,
            color: wished ? AppColors.sale : Colors.grey.shade600,
          ),
        ),
      ),
    );
  }
}
