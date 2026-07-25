import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/shimmer_box.dart';
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
      backgroundColor: AppColors.scaffold,
      appBar: AppBar(
        title: const Text('العلامات التجارية'),
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.md),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'ابحث عن علامة...',
                prefixIcon: const Icon(Icons.search_rounded),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: AppColors.border),
                ),
              ),
              onChanged: (v) => setState(() => _query = v.trim()),
            ),
          ),
          Expanded(
            child: brands.when(
              loading: () => GridView.builder(
                padding: const EdgeInsets.all(AppSpacing.md),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  childAspectRatio: 0.88,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: 9,
                itemBuilder: (_, __) => const ShimmerBox(height: double.infinity, radius: 14),
              ),
              error: (e, _) => ErrorView(
                message: friendlyError(e),
                onRetry: () => ref.invalidate(brandsProvider),
              ),
              data: (list) {
                final filtered = _query.isEmpty
                    ? list
                    : list.where((b) => b.name.toLowerCase().contains(_query.toLowerCase())).toList();
                if (filtered.isEmpty) {
                  return EmptyState(
                    icon: Icons.storefront_outlined,
                    title: _query.isEmpty ? 'لا توجد علامات' : 'لا توجد نتائج',
                    subtitle: _query.isEmpty ? null : 'جرّبي كلمة بحث أخرى',
                  );
                }
                return RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: () async => ref.invalidate(brandsProvider),
                  child: GridView.builder(
                    padding: const EdgeInsets.fromLTRB(AppSpacing.md, 0, AppSpacing.md, AppSpacing.md),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      childAspectRatio: 0.88,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final b = filtered[i];
                      return _BrandTile(
                        name: b.name,
                        logoUrl: b.logoUrl,
                        initial: b.initial,
                        onTap: () => context.push(
                          '/products?brandId=${b.id}&title=${Uri.encodeComponent(b.name)}',
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _BrandTile extends StatelessWidget {
  final String name;
  final String logoUrl;
  final String? initial;
  final VoidCallback onTap;

  const _BrandTile({
    required this.name,
    required this.logoUrl,
    this.initial,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
            boxShadow: AppColors.softShadow,
          ),
          padding: const EdgeInsets.all(10),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Expanded(
                child: logoUrl.isNotEmpty
                    ? AppNetworkImage(url: logoUrl, fit: BoxFit.contain)
                    : Center(
                        child: Text(
                          initial?.isNotEmpty == true
                              ? initial!
                              : (name.isNotEmpty ? name[0] : '؟'),
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
              ),
              const SizedBox(height: 8),
              Text(
                name,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, height: 1.2),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
