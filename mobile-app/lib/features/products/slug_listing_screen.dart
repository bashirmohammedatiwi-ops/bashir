import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/locale_provider.dart';
import '../../core/widgets/states.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/services/api_service.dart';
import 'product_listing_screen.dart';

class CategorySlugListingScreen extends ConsumerWidget {
  final String slug;
  const CategorySlugListingScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(categoryBySlugProvider(slug));
    return async.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: ErrorView.from(e, onRetry: () => ref.invalidate(categoryBySlugProvider(slug))),
      ),
      data: (category) => ProductListingScreen(
        title: category.localizedName(ref.read(languageCodeProvider)),
        categoryId: category.id,
      ),
    );
  }
}

class BrandSlugListingScreen extends ConsumerWidget {
  final String slug;
  const BrandSlugListingScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(brandBySlugProvider(slug));
    return async.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: ErrorView.from(e, onRetry: () => ref.invalidate(brandBySlugProvider(slug))),
      ),
      data: (brand) => ProductListingScreen(
        title: brand.localizedName(ref.read(languageCodeProvider)),
        brandId: brand.id,
      ),
    );
  }
}

final categoryBySlugProvider =
    FutureProvider.autoDispose.family<Category, String>((ref, slug) {
  return ref.read(apiServiceProvider).getCategoryBySlug(slug);
});

final brandBySlugProvider = FutureProvider.autoDispose.family<Brand, String>((ref, slug) {
  return ref.read(apiServiceProvider).getBrandBySlug(slug);
});
