import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import '../utils/formatters.dart';
import 'app_network_image.dart';
import 'product_card_actions.dart';

enum ProductCardStyle { standard, listing }

/// بطاقة منتج — معيار عام أو تصميم فاخر لصفحة القائمة.
class ProductCard extends ConsumerWidget {
  final Product product;
  final double? width;
  final bool showPromoBadge;
  final bool showRating;
  final bool lite;
  final ProductCardStyle style;

  const ProductCard({
    super.key,
    required this.product,
    this.width,
    this.showPromoBadge = false,
    this.showRating = false,
    this.lite = false,
    this.style = ProductCardStyle.standard,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (style == ProductCardStyle.listing) {
      return _ListingProductCard(
        product: product,
        showPromoBadge: showPromoBadge,
        showRating: showRating,
      );
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openProduct(context),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          width: width,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppColors.hairline, width: 0.7),
            boxShadow: lite ? null : AppColors.softShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                flex: 11,
                child: _ImageSection(
                  product: product,
                  showPromoBadge: showPromoBadge,
                  lite: lite,
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

  void _openProduct(BuildContext context) {
    context.push('/product/${product.slug.isNotEmpty ? product.slug : product.id}');
  }
}

// ─── Listing style ────────────────────────────────────────────────────────────

class _ListingProductCard extends ConsumerWidget {
  final Product product;
  final bool showPromoBadge;
  final bool showRating;

  const _ListingProductCard({
    required this.product,
    required this.showPromoBadge,
    required this.showRating,
  });

  static const _radius = 20.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push(
          '/product/${product.slug.isNotEmpty ? product.slug : product.id}',
        ),
        borderRadius: BorderRadius.circular(_radius),
        splashColor: AppColors.primary.withValues(alpha: 0.06),
        highlightColor: AppColors.primary.withValues(alpha: 0.03),
        child: Ink(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(_radius),
            boxShadow: AppColors.cardShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                flex: 11,
                child: _ListingImage(
                  product: product,
                  showPromoBadge: showPromoBadge,
                ),
              ),
              Expanded(
                flex: 9,
                child: _ListingInfo(
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

class _ListingImage extends StatelessWidget {
  final Product product;
  final bool showPromoBadge;

  const _ListingImage({required this.product, required this.showPromoBadge});

  @override
  Widget build(BuildContext context) {
    final hasShades = product.shades.isNotEmpty || product.shadeCount > 0;
    final badge = product.hasDiscount
        ? '-${product.discountPercent}%'
        : product.isNew
            ? 'جديد'
            : (showPromoBadge && product.isPromo)
                ? 'عرض'
                : null;

    return Stack(
      fit: StackFit.expand,
      children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(19.5)),
          child: DecoratedBox(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFFFFF8FA), Color(0xFFFFFFFF)],
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
              child: LayoutBuilder(
                builder: (context, constraints) => Center(
                  child: ProductCoverImage(
                    url: product.coverUrl,
                    width: constraints.maxWidth,
                    height: constraints.maxHeight,
                    fit: BoxFit.contain,
                    filterQuality: FilterQuality.medium,
                  ),
                ),
              ),
            ),
          ),
        ),
        Positioned(
          top: 10,
          right: 10,
          child: RepaintBoundary(child: ProductCardWishButton(product: product, size: 34)),
        ),
        if (badge != null)
          Positioned(
            top: 10,
            left: 10,
            child: _ListingBadge(label: badge, sale: product.hasDiscount),
          ),
        if (hasShades)
          Positioned(
            left: 10,
            bottom: 10,
            child: _ListingShades(
              shades: product.shades,
              totalCount: product.shades.isNotEmpty ? product.shades.length : product.shadeCount,
            ),
          ),
        if (!product.inStock)
          Positioned.fill(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(19.5)),
              child: ColoredBox(
                color: Colors.white.withValues(alpha: 0.72),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.ink.withValues(alpha: 0.78),
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                    child: const Text(
                      'نفد',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
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

class _ListingBadge extends StatelessWidget {
  final String label;
  final bool sale;

  const _ListingBadge({required this.label, this.sale = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: sale ? AppColors.sale : AppColors.ink,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 9.5,
          fontWeight: FontWeight.w800,
          height: 1,
        ),
      ),
    );
  }
}

class _ListingShades extends StatelessWidget {
  final List<ProductShade> shades;
  final int totalCount;

  const _ListingShades({required this.shades, required this.totalCount});

  @override
  Widget build(BuildContext context) {
    final count = shades.isNotEmpty ? shades.length : totalCount;
    if (count <= 0) return const SizedBox.shrink();
    final visible = shades.take(3).toList();

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < (visible.isNotEmpty ? visible.length : (count > 3 ? 3 : count)); i++) ...[
          if (i > 0) const SizedBox(width: 3),
          visible.isNotEmpty
              ? _ShadeDot(shade: visible[i])
              : Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.shimmerBase,
                    border: Border.all(color: Colors.white, width: 1.2),
                  ),
                ),
        ],
        if (count > 3) ...[
          const SizedBox(width: 4),
          Text(
            '+${count - 3}',
            style: const TextStyle(
              fontSize: 8.5,
              fontWeight: FontWeight.w700,
              color: AppColors.textMuted,
            ),
          ),
        ],
      ],
    );
  }
}

class _ListingInfo extends ConsumerWidget {
  final Product product;
  final bool showRating;

  const _ListingInfo({required this.product, required this.showRating});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (product.brandName.isNotEmpty)
            Text(
              product.brandName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppColors.textMuted,
                letterSpacing: 0.2,
              ),
            ),
          if (product.brandName.isNotEmpty) const SizedBox(height: 3),
          Expanded(
            child: Text(
              product.name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                height: 1.3,
                color: AppColors.textPrimary,
                letterSpacing: -0.15,
              ),
            ),
          ),
          if (showRating && product.rating > 0) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.star_rounded, size: 11, color: AppColors.star),
                const SizedBox(width: 2),
                Text(
                  product.rating.toStringAsFixed(1),
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      formatPrice(product.price),
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: product.hasDiscount ? AppColors.sale : AppColors.textPrimary,
                        letterSpacing: -0.3,
                        height: 1.1,
                      ),
                    ),
                    if (product.hasDiscount)
                      Text(
                        formatPrice(product.originalPrice),
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.textMuted,
                          decoration: TextDecoration.lineThrough,
                          height: 1.2,
                        ),
                      ),
                  ],
                ),
              ),
              ProductCardCartControl(product: product, compact: true),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Standard style ───────────────────────────────────────────────────────────

class _ImageSection extends StatelessWidget {
  final Product product;
  final bool showPromoBadge;
  final bool lite;

  const _ImageSection({
    required this.product,
    required this.showPromoBadge,
    this.lite = false,
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
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
              child: LayoutBuilder(
                builder: (context, constraints) => Center(
                  child: ProductCoverImage(
                    url: product.coverUrl,
                    width: constraints.maxWidth,
                    fit: BoxFit.contain,
                    filterQuality: lite ? FilterQuality.low : FilterQuality.medium,
                  ),
                ),
              ),
            ),
          ),
        ),
        const Positioned(
          left: 12,
          right: 12,
          bottom: 0,
          child: Divider(height: 1, thickness: 0.7, color: AppColors.divider),
        ),
        Positioned(
          top: 10,
          right: 10,
          child: RepaintBoundary(child: ProductCardWishButton(product: product)),
        ),
        if (product.hasDiscount)
          Positioned(
            top: 10,
            right: 10,
            child: _Badge(
              label: '-${product.discountPercent}%',
              color: AppColors.sale,
              lite: lite,
            ),
          )
        else if (product.isNew)
          Positioned(
            top: 10,
            right: 10,
            child: _Badge(label: 'جديد', color: AppColors.ink, lite: lite),
          )
        else if (showPromoBadge && product.isPromo)
          Positioned(
            top: 10,
            right: 10,
            child: _Badge(label: 'عرض', color: AppColors.primary, lite: lite),
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
              ProductCardCartControl(product: product),
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
  final bool lite;
  const _Badge({required this.label, required this.color, this.lite = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        boxShadow: lite
            ? null
            : [
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
