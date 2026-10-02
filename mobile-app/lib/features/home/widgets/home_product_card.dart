import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/product_card_actions.dart';
import '../../../data/models/product.dart';
import '../../worlds/world_theme.dart';
import 'home_theme.dart';

/// بطاقة منتج للرئيسية — معايير متجر عالمي، صورة بيضاء، إضافة سريعة.
class HomeProductCard extends ConsumerWidget {
  final Product product;
  final double width;
  final double height;
  final bool showPromoBadge;

  const HomeProductCard({
    super.key,
    required this.product,
    this.width = HomeTheme.productCardWidth,
    this.height = HomeTheme.productCardHeight,
    this.showPromoBadge = false,
  });

  double get _cardHeight => height;
  static const _radius = AppRadius.lg;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push(
          '/product/${product.slug.isNotEmpty ? product.slug : product.id}',
        ),
        borderRadius: BorderRadius.circular(_radius),
        child: Ink(
          width: width,
          height: _cardHeight,
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: BorderRadius.circular(_radius),
            border: Border.all(color: t.hairline.withValues(alpha: 0.55)),
            boxShadow: t.cardShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                flex: 11,
                child: _ImageSection(
                  product: product,
                  showPromoBadge: showPromoBadge,
                  newLabel: ref.s.newBadge,
                  offerLabel: ref.s.offerBadge,
                  soldOutLabel: ref.s.soldOut,
                ),
              ),
              _InfoSection(product: product),
            ],
          ),
        ),
      ),
    );
  }
}

class _ImageSection extends ConsumerWidget {
  final Product product;
  final bool showPromoBadge;
  final String newLabel;
  final String offerLabel;
  final String soldOutLabel;

  const _ImageSection({
    required this.product,
    required this.showPromoBadge,
    required this.newLabel,
    required this.offerLabel,
    required this.soldOutLabel,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    return Stack(
      fit: StackFit.expand,
      children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.lg - 0.5)),
          child: ColoredBox(color: t.blush),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
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
        PositionedDirectional(
          start: 10,
          end: 10,
          bottom: 0,
          child: Divider(height: 1, thickness: 0.5, color: t.divider),
        ),
        if (product.hasDiscount)
          PositionedDirectional(
            top: 8,
            start: 8,
            child: _Badge(label: '-${product.discountPercent.round()}%', color: AppColors.sale),
          )
        else if (product.isNew)
          PositionedDirectional(
            top: 8,
            start: 8,
            child: _Badge(label: newLabel, color: t.ink),
          )
        else if (showPromoBadge && product.isPromo)
          PositionedDirectional(
            top: 8,
            start: 8,
            child: _Badge(label: offerLabel, color: t.accent),
          ),
        if (!product.inStock)
          Positioned.fill(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.lg - 0.5)),
              child: ColoredBox(
                color: t.surface.withValues(alpha: 0.82),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: t.ink.withValues(alpha: 0.88),
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                    child: Text(
                      soldOutLabel,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
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
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: t.ink.withValues(alpha: 0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ProductCardCartControl(
                product: product,
                compact: true,
                style: ProductCardCartStyle.homeBadge,
              ),
            ),
          ),
      ],
    );
  }
}

class _InfoSection extends ConsumerWidget {
  final Product product;

  const _InfoSection({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final brand = product.brandNameFor(lang).trim();
    final t = context.worldTheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 7, 10, 9),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (brand.isNotEmpty) ...[
            Text(
              brand.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.brand.copyWith(fontSize: 10, color: t.accentDark, letterSpacing: 0.2),
            ),
            const SizedBox(height: 3),
          ],
          SizedBox(
            height: 31,
            child: Text(
              product.localizedName(lang),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.bodyStrong.copyWith(fontSize: 12, height: 1.28, color: t.ink),
            ),
          ),
          const SizedBox(height: 4),
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
                      fontSize: 13,
                      color: product.hasDiscount ? AppColors.sale : t.ink,
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

  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w900,
          height: 1,
        ),
      ),
    );
  }
}
