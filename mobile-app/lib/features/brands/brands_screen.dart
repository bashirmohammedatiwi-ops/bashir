import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/states.dart';
import '../catalog/catalog_providers.dart';

class BrandsScreen extends ConsumerStatefulWidget {
  const BrandsScreen({super.key});
  @override
  ConsumerState<BrandsScreen> createState() => _BrandsScreenState();
}

class _BrandsScreenState extends ConsumerState<BrandsScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final brands = ref.watch(brandsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('العلامات التجارية')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'ابحث عن علامة...',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (v) => setState(() => _query = v.trim()),
            ),
          ),
          Expanded(
            child: brands.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator(color: AppColors.primary)),
              error: (e, _) =>
                  ErrorView(message: e.toString(), onRetry: () => ref.invalidate(brandsProvider)),
              data: (list) {
                final filtered = _query.isEmpty
                    ? list
                    : list.where((b) => b.name.contains(_query)).toList();
                if (filtered.isEmpty) {
                  return const EmptyState(icon: Icons.storefront_outlined, title: 'لا توجد علامات');
                }
                return GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    childAspectRatio: 0.9,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) {
                    final b = filtered[i];
                    return GestureDetector(
                      onTap: () => context.push(
                          '/products?brandId=${b.id}&title=${Uri.encodeComponent(b.name)}'),
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                        ),
                        padding: const EdgeInsets.all(10),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Expanded(
                              child: b.logoUrl.isNotEmpty
                                  ? AppNetworkImage(url: b.logoUrl, fit: BoxFit.contain)
                                  : Container(
                                      alignment: Alignment.center,
                                      child: Text(
                                        b.initial?.isNotEmpty == true
                                            ? b.initial!
                                            : (b.name.isNotEmpty ? b.name[0] : '؟'),
                                        style: const TextStyle(
                                            fontSize: 28,
                                            fontWeight: FontWeight.w900,
                                            color: AppColors.primary),
                                      ),
                                    ),
                            ),
                            const SizedBox(height: 6),
                            Text(b.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
