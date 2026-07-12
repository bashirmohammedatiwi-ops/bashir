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
        onTap: () =>
            context.push('/product/${product.slug.isNotEmpty ? product.slug : product.id}'),
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Ink(
          width: width,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: AppColors.border.withValues(alpha: 0.85)),
            boxShadow: [
              BoxShadow(
                color: AppColors.textPrimary.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _ImageSection(
                  product: product,
                  showPromoBadge: showPromoBadge,
                ),
              ),
              _InfoSection(
                product: product,
                showRating: showRating,
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
    final tags = <Widget>[
      if (product.isNew) const _Badge(label: 'جديد', color: AppColors.success),
      if (product.isBestSeller) const _Badge(label: 'الأكثر شهرة', color: AppColors.success),
      if (showPromoBadge && product.isPromo) const _Badge(label: 'عرض', color: AppColors.sale),
    ];

    return Stack(
      clipBehavior: Clip.none,
      children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.md - 1)),
          child: DecoratedBox(
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 10, 10, 8),
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
        Positioned(top: 8, left: 8, child: _WishButton(product: product)),
        if (product.hasDiscount)
          Positioned(
            top: 8,
            right: 8,
            child: _Badge(label: '-${product.discountPercent}%', color: AppColors.sale),
          ),
        if (tags.isNotEmpty)
          Positioned(
            top: 44,
            left: 8,
            child: Wrap(
              spacing: 4,
              runSpacing: 4,
              children: tags,
            ),
          ),
        if (_hasShades)
          Positioned(
            right: 8,
            bottom: 8,
            child: _ShadeIndicator(
              shades: product.shades,
              totalCount: product.shades.isNotEmpty ? product.shades.length : product.shadeCount,
            ),
          ),
        if (!product.inStock)
          Positioned.fill(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.md - 1)),
              child: ColoredBox(
                color: AppColors.surface.withValues(alpha: 0.82),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.sale.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                      border: Border.all(color: AppColors.sale.withValues(alpha: 0.35)),
                    ),
                    child: const Text(
                      'نفد المخزون',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        color: AppColors.sale,
                        fontSize: 11,
                      ),
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

  const _ShadeIndicator({
    required this.shades,
    required this.totalCount,
  });

  @override
  Widget build(BuildContext context) {
    final count = shades.isNotEmpty ? shades.length : totalCount;
    if (count <= 0) return const SizedBox.shrink();

    final visible = shades.take(4).toList();
    final remaining = count - visible.length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: visible.isEmpty ? 0 : 14.0 + (visible.length - 1) * 11.0,
            height: 14,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                for (var i = 0; i < visible.length; i++)
                  Positioned(
                    right: i * 11.0,
                    child: _ShadeDot(shade: visible[i]),
                  ),
                if (visible.isEmpty)
                  for (var i = 0; i < (count > 4 ? 4 : count); i++)
                    Positioned(
                      right: i * 11.0,
                      child: Container(
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.shimmerBase,
                          border: Border.all(color: AppColors.surface, width: 1.5),
                        ),
                      ),
                    ),
              ],
            ),
          ),
          if (remaining > 0) ...[
            const SizedBox(width: 4),
            Text(
              '+$remaining',
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: AppColors.textSecondary,
                height: 1,
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
      width: 14,
      height: 14,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [start, end],
        ),
        border: Border.all(color: AppColors.surface, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: start.withValues(alpha: 0.35),
            blurRadius: 3,
            offset: const Offset(0, 1),
          ),
        ],
      ),
    );
  }
}

class _InfoSection extends ConsumerWidget {
  final Product product;
  final bool showRating;

  const _InfoSection({
    required this.product,
    required this.showRating,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 9, 8, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (product.brandName.isNotEmpty)
            Text(
              product.brandName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: AppColors.primary.withValues(alpha: 0.82),
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.15,
                height: 1.1,
              ),
            ),
          if (product.brandName.isNotEmpty) const SizedBox(height: 4),
          Text(
            product.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: AppTypography.body.copyWith(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              height: 1.3,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 7),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.end,
                      spacing: 5,
                      runSpacing: 2,
                      children: [
                        Text(
                          formatPrice(product.price),
                          style: AppTypography.price.copyWith(fontSize: 13),
                        ),
                        if (product.hasDiscount)
                          Text(
                            formatPrice(product.originalPrice),
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.textMuted,
                              decoration: TextDecoration.lineThrough,
                              height: 1.1,
                            ),
                          ),
                      ],
                    ),
                    if (showRating && product.rating > 0) ...[
                      const SizedBox(height: 3),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star_rounded, size: 12, color: AppColors.star),
                          const SizedBox(width: 2),
                          Text(
                            product.rating.toStringAsFixed(1),
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              height: 1,
                            ),
                          ),
                          if (product.reviewCount > 0)
                            Text(
                              ' (${product.reviewCount})',
                              style: const TextStyle(
                                fontSize: 9,
                                color: AppColors.textMuted,
                                height: 1,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 6),
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
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.25),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w800,
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
      color: enabled ? AppColors.primary : AppColors.divider,
      borderRadius: BorderRadius.circular(10),
      elevation: enabled ? 2 : 0,
      shadowColor: AppColors.primary.withValues(alpha: 0.3),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
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
        child: SizedBox(
          width: 34,
          height: 34,
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
      color: AppColors.surface,
      shape: const CircleBorder(side: BorderSide(color: AppColors.border, width: 0.8)),
      elevation: 0,
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
          padding: const EdgeInsets.all(7),
          child: Icon(
            wished ? Icons.favorite_rounded : Icons.favorite_border_rounded,
            size: 15,
            color: wished ? AppColors.sale : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
