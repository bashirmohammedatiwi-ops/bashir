import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/widgets/product_card.dart';
import '../../../data/models/product.dart';
import 'cart_theme.dart';

/// صف منتجات أفقي مقترح (السلة الممتلئة والفارغة).
class CartRecommendations extends ConsumerWidget {
  final List<Product> products;
  final String? title;
  final String? subtitle;

  const CartRecommendations({super.key, required this.products, this.title, this.subtitle});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (products.isEmpty) return const SizedBox.shrink();
    final s = ref.s;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CartSectionLabel(title: title ?? s.youMayAlsoLike, subtitle: subtitle),
        SizedBox(
          height: 262,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 0, CartTheme.hPad, 8),
            itemCount: products.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) => RepaintBoundary(
              child: ProductCard(key: ValueKey(products[i].id), product: products[i], width: 150, lite: true),
            ),
          ),
        ),
      ],
    );
  }
}
