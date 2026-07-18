import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/cart/cart_provider.dart';
import '../../features/wishlist/wishlist_provider.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import '../utils/formatters.dart';
import 'app_network_image.dart';
import 'app_snackbar.dart';

/// بطاقة منتج بمعايير متجر عالمي — صورة كبيرة، تسلسل واضح، إضافة سريعة.
class ProductCard extends ConsumerWidget {
  final Product product;
  final double? width;
  final bool showPromoBadge;
  final bool showRating;

  const ProductCard({
    super.key,
    required this.product,
    this.width,
    this.showPromoBadge = false,
    this.showRating = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push(
          '/product/${product.slug.isNotEmpty ? product.slug : product.id}',
        ),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          width: width,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppColors.hairline, width: 0.7),
            boxShadow: AppColors.softShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                flex: 11,
                child: _ImageSection(
                  product: product,
                  showPromoBadge: showPromoBadge,
                ),
              ),
              Expanded(
                flex: 8,
                child: _InfoSection(
                  product: product,
                  showRating: showRating,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ImageSection extends StatelessWidget {
  final Product product;
  final bool showPromoBadge;

  const _ImageSection({
    required this.product,
    required this.showPromoBadge,
  });

  bool get _hasShades => product.shades.isNotEmpty || product.shadeCount > 0;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.lg - 0.5)),
          child: ColoredBox(
            // خلفية الصورة بيضاء نقية دائماً
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
              child: LayoutBuilder(
                builder: (context, constraints) => Center(
                  child: ProductCoverImage(
                    url: product.coverUrl,
                    width: constraints.maxWidth,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
            ),
          ),
        ),
        // فاصل رقيق بين الصورة والمعلومات
        const Positioned(
          left: 12,
          right: 12,
          bottom: 0,
          child: Divider(height: 1, thickness: 0.7, color: AppColors.divider),
        ),
        Positioned(
          top: 10,
          left: 10,
          child: _WishButton(product: product),
        ),
        if (product.hasDiscount)
          Positioned(
            top: 10,
            right: 10,
            child: _Badge(
              label: '-${product.discountPercent}%',
              color: AppColors.sale,
            ),
          )
        else if (product.isNew)
          const Positioned(
            top: 10,
            right: 10,
            child: _Badge(label: 'جديد', color: AppColors.ink),
          )
        else if (showPromoBadge && product.isPromo)
          const Positioned(
            top: 10,
            right: 10,
            child: _Badge(label: 'عرض', color: AppColors.primary),
          ),
        if (_hasShades)
          Positioned(
            right: 10,
            bottom: 10,
            child: _ShadeIndicator(
              shades: product.shades,
              totalCount: product.shades.isNotEmpty ? product.shades.length : product.shadeCount,
            ),
          ),
        if (!product.inStock)
          Positioned.fill(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.lg - 0.5)),
              child: ColoredBox(
                color: AppColors.surface.withValues(alpha: 0.78),
                child: const Center(
                  child: Text(
                    'نفد المخزون',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      color: AppColors.sale,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ShadeIndicator extends StatelessWidget {
  final List<ProductShade> shades;
  final int totalCount;

  const _ShadeIndicator({required this.shades, required this.totalCount});

  @override
  Widget build(BuildContext context) {
    final count = shades.isNotEmpty ? shades.length : totalCount;
    if (count <= 0) return const SizedBox.shrink();
    final visible = shades.take(3).toList();
    final remaining = count - visible.length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < visible.length; i++) ...[
            if (i > 0) const SizedBox(width: 3),
            _ShadeDot(shade: visible[i]),
          ],
          if (visible.isEmpty)
            for (var i = 0; i < (count > 3 ? 3 : count); i++) ...[
              if (i > 0) const SizedBox(width: 3),
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.shimmerBase,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
              ),
            ],
          if (remaining > 0) ...[
            const SizedBox(width: 4),
            Text(
              '+$remaining',
              style: const TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w800,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ShadeDot extends StatelessWidget {
  final ProductShade shade;
  const _ShadeDot({required this.shade});

  Color _hex(String hex) {
    final h = hex.replaceAll('#', '');
    final v = h.length == 6 ? 'FF$h' : h;
    return Color(int.tryParse(v, radix: 16) ?? 0xFFCCCCCC);
  }

  @override
  Widget build(BuildContext context) {
    final start = _hex(shade.colorHex);
    final end = _hex(shade.colorHexEnd ?? shade.colorHex);
    return Container(
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(colors: [start, end]),
        border: Border.all(color: Colors.white, width: 1.5),
      ),
    );
  }
}

class _InfoSection extends ConsumerWidget {
  final Product product;
  final bool showRating;

  const _InfoSection({required this.product, required this.showRating});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 10, 11),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (product.brandName.isNotEmpty)
            Text(
              product.brandName.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.brand,
            ),
          if (product.brandName.isNotEmpty) const SizedBox(height: 3),
          Expanded(
            child: Text(
              product.name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.bodyStrong.copyWith(fontSize: 13, height: 1.25),
            ),
          ),
          const SizedBox(height: 6),
          if (showRating && product.rating > 0) ...[
            Row(
              children: [
                const Icon(Icons.star_rounded, size: 13, color: AppColors.star),
                const SizedBox(width: 2),
                Text(
                  product.rating.toStringAsFixed(1),
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                ),
                if (product.reviewCount > 0)
                  Text(
                    ' (${product.reviewCount})',
                    style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                  ),
              ],
            ),
            const SizedBox(height: 6),
          ],
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      formatPrice(product.price),
                      style: AppTypography.price.copyWith(
                        fontSize: 14,
                        color: product.hasDiscount ? AppColors.sale : AppColors.textPrimary,
                      ),
                    ),
                    if (product.hasDiscount)
                      Text(
                        formatPrice(product.originalPrice),
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textMuted,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                  ],
                ),
              ),
              _AddButton(product: product),
            ],
          ),
        ],
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
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w900,
          height: 1,
        ),
      ),
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
      color: Colors.transparent,
      shape: const CircleBorder(),
      child: Ink(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: enabled ? AppColors.primaryGradient : null,
          color: enabled ? null : AppColors.divider,
          boxShadow: enabled
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.28),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: enabled
              ? () {
                  HapticFeedback.lightImpact();
                  if (product.shades.isNotEmpty) {
                    context.push(
                      '/product/${product.slug.isNotEmpty ? product.slug : product.id}',
                    );
                    return;
                  }
                  ref.read(cartProvider.notifier).add(product);
                  AppSnackbar.success(context, 'أُضيف إلى السلة');
                }
              : null,
          child: Icon(
            Icons.add_rounded,
            color: enabled ? Colors.white : AppColors.textMuted,
            size: 20,
          ),
        ),
      ),
    );
  }
}

class _WishButton extends ConsumerWidget {
  final Product product;
  const _WishButton({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wished = ref.watch(wishlistProvider.select((s) => s.ids.contains(product.id)));
    return Material(
      color: Colors.white,
      shape: CircleBorder(side: BorderSide(color: AppColors.hairline.withValues(alpha: 0.8), width: 0.7)),
      elevation: 0,
      shadowColor: Colors.transparent,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: () async {
          HapticFeedback.selectionClick();
          if (!ref.read(authProvider).isAuthenticated) {
            context.push('/login');
            return;
          }
          await ref.read(wishlistProvider.notifier).toggle(product);
        },
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(
            wished ? Icons.favorite_rounded : Icons.favorite_border_rounded,
            size: 16,
            color: wished ? AppColors.sale : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
