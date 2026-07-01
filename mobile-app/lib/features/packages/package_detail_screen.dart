import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/json.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/states.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../cart/cart_provider.dart';

final packageDetailProvider =
    FutureProvider.family.autoDispose<Map<String, dynamic>, String>((ref, id) {
  return ref.read(apiServiceProvider).getPackage(id);
});

class PackageDetailScreen extends ConsumerWidget {
  final String idOrSlug;
  const PackageDetailScreen({super.key, required this.idOrSlug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(packageDetailProvider(idOrSlug));
    return Scaffold(
      appBar: AppBar(title: const Text('الباقة')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(packageDetailProvider(idOrSlug)),
        ),
        data: (pkg) => _PackageBody(data: pkg),
      ),
    );
  }
}

class _PackageBody extends ConsumerWidget {
  final Map<String, dynamic> data;
  const _PackageBody({required this.data});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = asString(data['name']);
    final price = asInt(data['price']);
    final original = data['originalPrice'] != null ? asInt(data['originalPrice']) : 0;
    final description = asString(data['description']);
    final items = asList(data['items']);
    String? coverUrl;
    final cover = data['coverImage'];
    if (cover is Map) {
      coverUrl = asMap(cover)['url']?.toString();
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (coverUrl != null && coverUrl.isNotEmpty)
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: AppNetworkImage(url: coverUrl, height: 200, fit: BoxFit.cover),
          )
        else
          Container(
            height: 160,
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(16),
            ),
            alignment: Alignment.center,
            child: const Icon(Icons.card_giftcard_rounded, size: 64, color: AppColors.primary),
          ),
        const SizedBox(height: 16),
        Text(name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Row(
          children: [
            Text(formatPrice(price),
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.primary)),
            if (original > price) ...[
              const SizedBox(width: 8),
              Text(formatPrice(original),
                  style: const TextStyle(
                      decoration: TextDecoration.lineThrough, color: AppColors.textMuted)),
            ],
          ],
        ),
        if (description.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(description, style: const TextStyle(height: 1.5, color: AppColors.textSecondary)),
        ],
        const SizedBox(height: 20),
        const Text('محتويات الباقة', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        for (final raw in items)
          _PackageItemTile(item: asMap(raw)),
        const SizedBox(height: 24),
        SizedBox(
          height: 52,
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => _addAll(context, ref, items),
            child: const Text('أضف كل المنتجات للسلة'),
          ),
        ),
      ],
    );
  }

  void _addAll(BuildContext context, WidgetRef ref, List<dynamic> items) {
    var count = 0;
    for (final raw in items) {
      final item = asMap(raw);
      final productJson = item['product'];
      if (productJson is! Map) continue;
      final product = Product.fromJson(asMap(productJson));
      final qty = asInt(item['quantity'], 1);
      ref.read(cartProvider.notifier).add(product, quantity: qty);
      count++;
    }
    if (count == 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('لا توجد منتجات في الباقة')));
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('أُضيفت منتجات الباقة للسلة')));
  }
}

class _PackageItemTile extends StatelessWidget {
  final Map<String, dynamic> item;
  const _PackageItemTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final product = item['product'];
    if (product is! Map) return const SizedBox.shrink();
    final p = asMap(product);
    final qty = asInt(item['quantity'], 1);
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: AppColors.primaryLight,
        child: Text('×$qty', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800)),
      ),
      title: Text(asString(p['name']), style: const TextStyle(fontWeight: FontWeight.w600)),
      trailing: const Icon(Icons.chevron_left, color: AppColors.textMuted),
      onTap: () {
        final slug = asString(p['slug']);
        final id = asString(p['id']);
        context.push('/product/${slug.isNotEmpty ? slug : id}');
      },
    );
  }
}
