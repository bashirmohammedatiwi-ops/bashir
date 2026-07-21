import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/product.dart';
import 'home_animations.dart';
import 'home_theme.dart';

/// بطاقة منتج — flat، أنيقة، بسيطة.
class HomeProductCard extends ConsumerWidget {
  final Product product;
  final double width;
  final bool showPromoBadge;

  const HomeProductCard({
    super.key,
    required this.product,
    this.width = 148,
    this.showPromoBadge = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasDiscount = product.hasDiscount;
    final brand = product.brandName.trim();

    return HomeTapScale(
      onTap: () => context.push(
        '/product/${product.slug.isNotEmpty ? product.slug : product.id}',
      ),
      child: Container(
        width: width,
        decoration: HomeTheme.cardDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              flex: 11,
              child: Stack(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(8),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(HomeTheme.tileRadius - 2),
                      child: ColoredBox(
                        color: HomeTheme.pearl,
                        child: Padding(
                          padding: const EdgeInsets.all(10),
                          child: ProductCoverImage(
                            url: product.coverUrl,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    ),
                  ),
                  if (hasDiscount)
                    Positioned(
                      top: 14,
                      right: 14,
                      child: _badge('-${product.discountPercent.round()}%', AppColors.sale),
                    )
                  else if (showPromoBadge && product.isPromo)
                    Positioned(
                      top: 14,
                      right: 14,
                      child: _badge('عرض', HomeTheme.sage),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (brand.isNotEmpty)
                    Text(brand.toUpperCase(), style: HomeTheme.brandLabel, maxLines: 1),
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: HomeTheme.body(
                      size: 12,
                      color: HomeTheme.ink,
                      weight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(formatPrice(product.price), style: HomeTheme.price.copyWith(fontSize: 13)),
                      if (hasDiscount) ...[
                        const SizedBox(width: 5),
                        Flexible(
                          child: Text(
                            formatPrice(product.originalPrice),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: HomeTheme.body(size: 10, color: HomeTheme.inkMuted)
                                .copyWith(decoration: TextDecoration.lineThrough),
                          ),
                        ),
                      ],
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

  Widget _badge(String text, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(999),
          boxShadow: HomeTheme.whisperLift,
        ),
        child: Text(
          text,
          style: HomeTheme.body(size: 9, color: Colors.white, weight: FontWeight.w800),
        ),
      );
}
