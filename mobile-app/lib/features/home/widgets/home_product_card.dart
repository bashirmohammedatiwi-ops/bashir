import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/product_card_actions.dart';
import '../../../data/models/product.dart';
import 'home_theme.dart';

/// بطاقة منتج للرئيسية — معايير متجر عالمي، صورة بيضاء، إضافة سريعة.
class HomeProductCard extends ConsumerWidget {
  final Product product;
  final double width;
  final bool showPromoBadge;

  const HomeProductCard({
    super.key,
    required this.product,
    this.width = HomeTheme.productCardWidth,
    this.showPromoBadge = false,
  });

  static const _cardHeight = HomeTheme.productCardHeight;
  static const _radius = AppRadius.lg;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
            color: Colors.white,
            borderRadius: BorderRadius.circular(_radius),
            border: Border.all(color: AppColors.hairline.withValues(alpha: 0.55)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                flex: 11,
                child: _ImageSection(product: product, showPromoBadge: showPromoBadge),
              ),
              Expanded(
                flex: 8,
                child: _InfoSection(product: product),
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

  const _ImageSection({required this.product, required this.showPromoBadge});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.lg - 0.5)),
          child: const ColoredBox(color: Color(0xFFFAFAFA)),
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
        const Positioned(
          left: 10,
          right: 10,
          bottom: 0,
          child: Divider(height: 1, thickness: 0.5, color: AppColors.divider),
        ),
        if (product.hasDiscount)
          Positioned(
            top: 8,
            right: 8,
            child: _Badge(label: '-${product.discountPercent.round()}%', color: AppColors.sale),
          )
        else if (product.isNew)
          const Positioned(
            top: 8,
            right: 8,
            child: _Badge(label: 'جديد', color: AppColors.ink),
          )
        else if (showPromoBadge && product.isPromo)
          const Positioned(
            top: 8,
            right: 8,
            child: _Badge(label: 'عرض', color: AppColors.primary),
          ),
        if (!product.inStock)
          Positioned.fill(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.lg - 0.5)),
              child: ColoredBox(
                color: Colors.white.withValues(alpha: 0.82),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.ink.withValues(alpha: 0.88),
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                    child: const Text(
                      'نفد',
                      style: TextStyle(
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

    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 7, 8, 9),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (brand.isNotEmpty) ...[
            Text(
              brand.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.brand.copyWith(fontSize: 10),
            ),
            const SizedBox(height: 3),
          ],
          Expanded(
            child: Text(
              product.localizedName(lang),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.bodyStrong.copyWith(fontSize: 12, height: 1.28),
            ),
          ),
          const SizedBox(height: 4),
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
                        fontSize: 13,
                        color: product.hasDiscount ? AppColors.sale : AppColors.textPrimary,
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
