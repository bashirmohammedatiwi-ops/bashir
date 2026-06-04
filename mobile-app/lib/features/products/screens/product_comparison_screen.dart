import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/catalog_providers.dart';
import '../../../core/utils/product_visuals.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/widgets/product_showcase.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../data/models/product_model.dart';
import '../../cart/providers/cart_provider.dart';

class ProductComparisonScreen extends ConsumerWidget {
  const ProductComparisonScreen({
    super.key,
    required this.id1,
    required this.id2,
  });

  final String id1;
  final String id2;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p1Async = ref.watch(productProvider(id1));
    final p2Async = ref.watch(productProvider(id2));

    return Scaffold(
      appBar: AppBar(title: const Text('مقارنة المنتجات')),
      body: p1Async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('تعذر تحميل المنتجات')),
        data: (p1) => p2Async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const Center(child: Text('تعذر تحميل المنتجات')),
          data: (p2) {
            if (p1 == null || p2 == null) {
              return const Center(child: Text('منتج غير موجود'));
            }
            return _ComparisonBody(p1: p1, p2: p2);
          },
        ),
      ),
    );
  }
}

class _ComparisonBody extends ConsumerWidget {
  const _ComparisonBody({required this.p1, required this.p2});
  final ProductModel p1;
  final ProductModel p2;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(child: _ProductColumn(product: p1, ref: ref)),
              const SizedBox(width: 12),
              Expanded(child: _ProductColumn(product: p2, ref: ref)),
            ],
          ).animate().fadeIn(),
        ],
      ),
    );
  }
}

class _ProductColumn extends StatelessWidget {
  const _ProductColumn({required this.product, required this.ref});
  final ProductModel product;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ProductShowcase.forProduct(
          imageUrl: product.images.isNotEmpty ? product.images.first : '',
          layout: ProductShowcaseLayout.compact,
          product: product,
        ),
        const SizedBox(height: 8),
        Text(product.name, style: AppTextStyles.title(size: 14), textAlign: TextAlign.center),
        Text(CurrencyFormatter.format(product.price), style: AppTextStyles.title()),
        CustomButton(
          label: 'أضيفي للسلة',
          onPressed: () => ref.read(cartProvider.notifier).addProduct(product),
        ),
      ],
    );
  }
}
