import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/product_visuals.dart';
import '../../../core/widgets/product_showcase.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../data/mock/mock_products.dart';
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
    final p1 = MockProducts.findById(id1);
    final p2 = MockProducts.findById(id2);

    if (p1 == null || p2 == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('مقارنة المنتجات')),
        body: const Center(child: Text('منتج غير موجود')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('مقارنة المنتجات')),
      body: SingleChildScrollView(
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
            const SizedBox(height: 24),
            _CompareRow(label: 'السعر', v1: CurrencyFormatter.format(p1.price), v2: CurrencyFormatter.format(p2.price)),
            _CompareRow(label: 'التقييم', v1: '${p1.rating}', v2: '${p2.rating}'),
            _CompareRow(label: 'المكونات', v1: p1.ingredients.substring(0, 40), v2: p2.ingredients.substring(0, 40)),
          ],
        ),
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
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: ProductShowcase.forProduct(
            product: product,
            imageUrl: product.images.first,
            layout: ProductShowcaseLayout.compact,
            height: 140,
            width: double.infinity,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        const SizedBox(height: 8),
        Text(product.name, style: AppTextStyles.title(size: 13), textAlign: TextAlign.center),
        const SizedBox(height: 12),
        CustomButton(
          label: AppStrings.addToCart,
          onPressed: () {
            ref.read(cartProvider.notifier).addProduct(product);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('تمت الإضافة')),
            );
          },
        ),
        TextButton(
          onPressed: () {},
          child: const Text('تغيير المنتج'),
        ),
      ],
    );
  }
}

class _CompareRow extends StatelessWidget {
  const _CompareRow({required this.label, required this.v1, required this.v2});
  final String label;
  final String v1;
  final String v2;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTextStyles.title()),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: Text(v1, style: AppTextStyles.body())),
              Expanded(child: Text(v2, style: AppTextStyles.body())),
            ],
          ),
          const Divider(),
        ],
      ),
    );
  }
}
