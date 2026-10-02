import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';
import '../l10n/app_strings.dart';
import '../l10n/locale_provider.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import '../utils/formatters.dart';
import '../../features/worlds/world_theme.dart';
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

    final wt = context.worldTheme;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openProduct(context),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          width: width,
          decoration: BoxDecoration(
            color: wt.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: wt.hairline.withValues(alpha: 0.65), width: 0.8),
            boxShadow: wt.cardShadow,
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

  static const _radius = 18.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wt = context.worldTheme;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push(
          '/product/${product.slug.isNotEmpty ? product.slug : product.id}',
        ),
        borderRadius: BorderRadius.circular(_radius),
        splashColor: wt.accent.withValues(alpha: 0.06),
        highlightColor: wt.accent.withValues(alpha: 0.03),
        child: Ink(
          decoration: BoxDecoration(
            color: wt.surface,
            borderRadius: BorderRadius.circular(_radius),
            border: Border.all(color: wt.hairline.withValues(alpha: 0.65)),
            boxShadow: wt.cardShadow,
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
              _ListingInfo(
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

class _ListingImage extends ConsumerWidget {
  final Product product;
  final bool showPromoBadge;

  const _ListingImage({required this.product, required this.showPromoBadge});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final badge = product.hasDiscount
        ? '-${product.discountPercent}%'
        : product.isNew
            ? s.newBadge
            : (showPromoBadge && product.isPromo)
                ? s.offerBadge
                : null;
    const imageRadius = 17.5;

    return Stack(
      fit: StackFit.expand,
      children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(imageRadius)),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: t.blush,
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
        PositionedDirectional(
          top: 10,
          end: 10,
          child: RepaintBoundary(child: ProductCardWishButton(product: product, size: 34)),
        ),
        if (badge != null)
          PositionedDirectional(
            top: 10,
            start: 10,
            child: _ListingBadge(label: badge, sale: product.hasDiscount),
          ),
        if (!product.inStock)
          Positioned.fill(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(imageRadius)),
              child: ColoredBox(
                color: t.surface.withValues(alpha: 0.72),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: t.ink.withValues(alpha: 0.78),
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                    child: Text(
                      s.soldOut,
                      style: const TextStyle(
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
        if (product.inStock)
          PositionedDirectional(
            end: 8,
            bottom: 8,
            child: ProductCardCartControl(product: product, compact: true),
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
        color: sale ? AppColors.sale : AppColors.primaryDeep,
        borderRadius: BorderRadius.circular(8),
        boxShadow: sale
            ? [
                BoxShadow(
                  color: AppColors.sale.withValues(alpha: 0.35),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
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

class ProductShadeSwatchRow extends StatelessWidget {
  final List<ProductShade> shades;
  final int shadeCount;

  const ProductShadeSwatchRow({required this.shades, this.shadeCount = 0});

  @override
  Widget build(BuildContext context) {
    final real = shades.where((s) => s.hasBarcode).toList();
    final total = real.length > 1 ? real.length : (shadeCount > 1 && real.isEmpty ? shadeCount : real.length);
    if (total < 2) return const SizedBox.shrink();
    final visible = real.take(4).toList();
    final extra = total - visible.length;

    return Row(
      children: [
        for (var i = 0; i < visible.length; i++) ...[
          if (i > 0) const SizedBox(width: 5),
          _ShadeDot(shade: visible[i], size: 14),
        ],
        if (extra > 0) ...[
          const SizedBox(width: 6),
          Text(
            '+$extra',
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: AppColors.textSecondary,
              height: 1,
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
    final lang = ref.watch(languageCodeProvider);
    final t = context.worldTheme;
    final shades = product.shades;
    return Padding(
      padding: const EdgeInsets.fromLTRB(11, 7, 11, 11),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (product.brandNameFor(lang).isNotEmpty)
            Text(
              product.brandNameFor(lang),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: t.accentDark,
                letterSpacing: 0.15,
              ),
            ),
          if (product.brandNameFor(lang).isNotEmpty) const SizedBox(height: 2),
          SizedBox(
            height: 32,
            child: Text(
              product.localizedName(lang),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                height: 1.28,
                color: t.ink,
                letterSpacing: -0.12,
              ),
            ),
          ),
          const SizedBox(height: 4),
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
          const SizedBox(height: 2),
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: AlignmentDirectional.centerStart,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    formatPrice(product.price),
                    maxLines: 1,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: product.hasDiscount ? AppColors.sale : t.ink,
                      letterSpacing: -0.3,
                      height: 1.1,
                    ),
                  ),
                  if (product.hasDiscount)
                    Text(
                      formatPrice(product.originalPrice),
                      maxLines: 1,
                      style: TextStyle(
                        fontSize: 10,
                        color: t.inkMuted,
                        decoration: TextDecoration.lineThrough,
                        height: 1.2,
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (shades.length > 1 || product.shadeCount > 1) ...[
            const SizedBox(height: 6),
            ProductShadeSwatchRow(shades: shades, shadeCount: product.shadeCount),
          ],
        ],
      ),
    );
  }
}

// ─── Standard style ───────────────────────────────────────────────────────────

class _ImageSection extends ConsumerWidget {
  final Product product;
  final bool showPromoBadge;
  final bool lite;

  const _ImageSection({
    required this.product,
    required this.showPromoBadge,
    this.lite = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final badge = product.hasDiscount
        ? '-${product.discountPercent}%'
        : product.isNew
            ? s.newBadge
            : (showPromoBadge && product.isPromo)
                ? s.offerBadge
                : null;

    return Stack(
      fit: StackFit.expand,
      children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.lg - 0.5)),
          child: ColoredBox(
            color: t.blush,
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
        PositionedDirectional(
          start: 12,
          end: 12,
          bottom: 0,
          child: Divider(height: 1, thickness: 0.7, color: t.divider),
        ),
        PositionedDirectional(
          top: 10,
          end: 10,
          child: RepaintBoundary(child: ProductCardWishButton(product: product)),
        ),
        if (badge != null)
          PositionedDirectional(
            top: 10,
            start: 10,
            child: _Badge(
              label: badge,
              color: product.hasDiscount
                  ? AppColors.sale
                  : (product.isNew ? t.ink : t.accent),
              lite: lite,
            ),
          ),
        if (!product.inStock)
          Positioned.fill(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.lg - 0.5)),
              child: ColoredBox(
                color: t.surface.withValues(alpha: 0.78),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: t.ink.withValues(alpha: 0.78),
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                    child: Text(
                      s.soldOut,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        if (product.inStock)
          PositionedDirectional(
            end: 8,
            bottom: 8,
            child: ProductCardCartControl(product: product, compact: lite),
          ),
      ],
    );
  }
}

class _ShadeDot extends StatelessWidget {
  final ProductShade shade;
  final double size;
  const _ShadeDot({required this.shade, this.size = 16});

  Color _hex(String hex) {
    final h = hex.replaceAll('#', '');
    final v = h.length == 6 ? 'FF$h' : h;
    return Color(int.tryParse(v, radix: 16) ?? 0xFFCCCCCC);
  }

  @override
  Widget build(BuildContext context) {
    final start = _hex(shade.colorHex);
    final end = _hex(shade.colorHexEnd ?? shade.colorHex);
    final hasGradient = shade.colorHexEnd != null &&
        shade.colorHexEnd!.trim().isNotEmpty &&
        shade.colorHexEnd!.toLowerCase() != shade.colorHex.toLowerCase();

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: hasGradient ? null : start,
        gradient: hasGradient ? LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [start, end]) : null,
        border: Border.all(color: const Color(0xFFE5E0EC), width: 1),
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
    final lang = ref.watch(languageCodeProvider);
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 10, 11),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (product.brandNameFor(lang).isNotEmpty)
            Text(
              product.brandNameFor(lang).toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.brand.copyWith(color: t.accentDark, fontSize: 10),
            ),
          if (product.brandNameFor(lang).isNotEmpty) const SizedBox(height: 3),
          SizedBox(
            height: 34,
            child: Text(
              product.localizedName(lang),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.bodyStrong.copyWith(fontSize: 13, height: 1.25, color: t.ink),
            ),
          ),
          const SizedBox(height: 4),
          if (showRating && product.rating > 0) ...[
            Row(
              children: [
                const Icon(Icons.star_rounded, size: 13, color: AppColors.star),
                const SizedBox(width: 2),
                Text(
                  product.rating.toStringAsFixed(1),
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: t.inkSoft),
                ),
                if (product.reviewCount > 0)
                  Text(
                    ' (${product.reviewCount})',
                    style: TextStyle(fontSize: 10, color: t.inkMuted),
                  ),
              ],
            ),
            const SizedBox(height: 6),
          ],
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: AlignmentDirectional.centerStart,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    formatPrice(product.price),
                    maxLines: 1,
                    style: AppTypography.price.copyWith(
                      fontSize: 14,
                      color: product.hasDiscount ? AppColors.sale : t.ink,
                    ),
                  ),
                  if (product.hasDiscount)
                    Text(
                      formatPrice(product.originalPrice),
                      maxLines: 1,
                      style: TextStyle(
                        fontSize: 11,
                        color: t.inkMuted,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (product.shades.length > 1 || product.shadeCount > 1) ...[
            const SizedBox(height: 6),
            ProductShadeSwatchRow(shades: product.shades, shadeCount: product.shadeCount),
          ],
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
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.3),
            blurRadius: 6,
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
