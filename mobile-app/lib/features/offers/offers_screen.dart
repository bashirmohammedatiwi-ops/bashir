import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/product_card.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../catalog/catalog_providers.dart';

/// تبويب العروض المركزي — مثل زر Nice One الأوسط.
class OffersScreen extends ConsumerWidget {
  const OffersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(homeFeedProvider);

    return Scaffold(
      backgroundColor: AppColors.scaffold,
      appBar: AppBar(
        title: const Text('العروض'),
        actions: [
          TextButton(
            onPressed: () => context.push('/products?isPromo=1&title=كل العروض'),
            child: const Text('عرض الكل'),
          ),
        ],
      ),
      body: feed.when(
        loading: () => const ProductGridSkeleton(count: 6),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(homeFeedProvider)),
        data: (data) {
          final products = data.flashSale.products;
          if (products.isEmpty) {
            return EmptyState(
              icon: Icons.local_offer_outlined,
              title: 'لا توجد عروض حالياً',
              subtitle: 'تابعنا لمعرفة أحدث التخفيضات',
              action: ElevatedButton(
                onPressed: () => context.push('/products?isPromo=1&title=العروض'),
                child: const Text('تصفّح المنتجات'),
              ),
            );
          }
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.invalidate(homeFeedProvider),
            child: GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.6,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: products.length,
              itemBuilder: (_, i) => ProductCard(product: products[i], showPromoBadge: true),
            ),
          );
        },
      ),
    );
  }
}
