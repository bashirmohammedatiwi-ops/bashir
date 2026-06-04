import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/providers/catalog_providers.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/widgets/cached_image_widget.dart';
import '../../cart/providers/cart_provider.dart';

class PackageDetailScreen extends ConsumerWidget {
  const PackageDetailScreen({super.key, required this.packageId});

  final String packageId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pkgAsync = ref.watch(packageDetailProvider(packageId));

    return pkgAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => Scaffold(
        appBar: AppBar(title: const Text('الباقة')),
        body: const Center(child: Text('تعذر تحميل الباقة')),
      ),
      data: (data) {
        if (data == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('الباقة')),
            body: const Center(child: Text('الباقة غير موجودة')),
          );
        }
        final package = data.package;
        final products = data.products;

        return Scaffold(
          backgroundColor: AppColors.background,
          body: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverAppBar(
                expandedHeight: 240,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  background: CachedImageWidget(
                    imageUrl: package.coverImageUrl,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(package.name, style: AppTextStyles.title(size: 22)),
                      Text(package.subtitle, style: AppTextStyles.body()),
                      const SizedBox(height: 8),
                      Text(
                        CurrencyFormatter.format(package.price),
                        style: AppTextStyles.title(color: AppColors.primary),
                      ),
                      const SizedBox(height: 16),
                      Text('محتويات الباقة', style: AppTextStyles.title()),
                      const SizedBox(height: 8),
                      ...products.map(
                        (p) => ListTile(
                          title: Text(p.name),
                          subtitle: Text(p.brand),
                          trailing: Text(CurrencyFormatter.format(p.price)),
                          onTap: () => context.push('/product/${p.id}'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          bottomNavigationBar: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: FilledButton(
                onPressed: () {
                  for (final p in products) {
                    ref.read(cartProvider.notifier).addProduct(p);
                  }
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('أُضيفت منتجات الباقة للسلة')),
                  );
                },
                child: Text(AppStrings.addToCart),
              ),
            ),
          ),
        );
      },
    );
  }
}
