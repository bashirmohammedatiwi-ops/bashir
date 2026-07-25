import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../data/models/product.dart';
import '../../home/widgets/home_product_row.dart';
import '../../home/widgets/home_theme.dart';
import 'cart_theme.dart';

class CartRecommendations extends ConsumerWidget {
  final List<Product> products;

  const CartRecommendations({super.key, required this.products});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (products.isEmpty) return const SizedBox.shrink();
    final s = ref.s;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 24, CartTheme.hPad, 12),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  gradient: CartTheme.brandGradient,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                s.youMayAlsoLike,
                style: HomeTheme.sectionTitle(size: 16, color: CartTheme.charcoal),
              ),
            ],
          ),
        ),
        HomeProductRow(
          products: products,
          padding: const EdgeInsets.symmetric(horizontal: CartTheme.hPad),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}
