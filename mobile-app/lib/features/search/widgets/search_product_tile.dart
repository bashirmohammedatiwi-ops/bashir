import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/product.dart';
import '../../worlds/world_theme.dart';

/// بطاقة منتج مدمجة في نتائج البحث.
class SearchProductTile extends StatelessWidget {
  final Product product;
  final String lang;

  const SearchProductTile({super.key, required this.product, required this.lang});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final brand = product.brandNameFor(lang);
    final category = product.category?.localizedName(lang) ?? '';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push('/product/${product.slug.isNotEmpty ? product.slug : product.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: t.hairline.withValues(alpha: 0.65)),
            boxShadow: t.cardShadow,
          ),
          padding: const EdgeInsets.all(10),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 58,
                  height: 58,
                  child: AppNetworkImage(
                    url: product.coverUrl,
                    fit: BoxFit.contain,
                    backgroundColor: t.blush,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (brand.isNotEmpty)
                      Text(
                        brand.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.8,
                          color: t.accentDark,
                        ),
                      ),
                    if (brand.isNotEmpty) const SizedBox(height: 2),
                    Text(
                      product.localizedName(lang),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13.5,
                        height: 1.25,
                        fontWeight: FontWeight.w800,
                        color: t.ink,
                      ),
                    ),
                    if (category.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        category,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 11, color: t.inkMuted, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    formatPrice(product.price),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: product.hasDiscount ? AppColors.sale : t.ink,
                    ),
                  ),
                  if (product.hasDiscount)
                    Text(
                      formatPrice(product.originalPrice),
                      style: TextStyle(
                        fontSize: 10,
                        color: t.inkMuted,
                        decoration: TextDecoration.lineThrough,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
