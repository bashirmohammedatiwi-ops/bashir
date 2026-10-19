import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/locale_provider.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/category_tree.dart';
import '../worlds/world_theme.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/services/api_service.dart';
import 'product_listing_screen.dart';
import 'widgets/listing_theme.dart';

class CategorySlugListingScreen extends ConsumerWidget {
  final String slug;
  const CategorySlugListingScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    // الشجرة محمّلة غالباً: نحدد القسم ومستواه محلياً (رئيسي/فرعي/ثالث) دون طلب إضافي.
    final roots = ref.watch(categoriesProvider).valueOrNull;
    final hit = roots == null ? null : findCategoryBySlug(roots, slug);
    if (hit != null) {
      final c = hit.category;
      return ProductListingScreen(
        title: c.localizedName(lang),
        categoryId: hit.depth == 0 ? c.id : null,
        subcategoryId: hit.depth == 1 ? c.id : null,
        tertiaryCategoryId: hit.depth >= 2 ? c.id : null,
      );
    }
    if (roots == null && !ref.watch(categoriesProvider).hasError) {
      return const _LoadingScaffold();
    }

    final async = ref.watch(categoryBySlugProvider(slug));
    return async.when(
      loading: () => const _LoadingScaffold(),
      error: (e, _) => _ErrorScaffold(
        error: e,
        onRetry: () {
          ref.invalidate(categoriesProvider);
          ref.invalidate(categoryBySlugProvider(slug));
        },
      ),
      data: (category) => ProductListingScreen(
        title: category.localizedName(lang),
        categoryId: category.id,
      ),
    );
  }
}

class _LoadingScaffold extends StatelessWidget {
  const _LoadingScaffold();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.worldTheme.canvas,
      body: const ProductGridSkeleton(
        count: 8,
        listing: true,
        padding: EdgeInsets.fromLTRB(ListingTheme.padH, 12, ListingTheme.padH, 32),
      ),
    );
  }
}

/// خطأ بشكل أنيق: زر رجوع واضح (أو للرئيسية إن فُتحت الصفحة من رابط مباشر).
class _ErrorScaffold extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;
  const _ErrorScaffold({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.worldTheme.canvas,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(8, 6, 8, 0),
              child: Align(
                alignment: AlignmentDirectional.centerStart,
                child: context.canPop()
                    ? const AppBackButton()
                    : AppIconButton(icon: Icons.home_outlined, tooltip: '', onTap: () => context.go('/')),
              ),
            ),
            Expanded(child: ErrorView.from(error, onRetry: onRetry)),
          ],
        ),
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
      loading: () => const _LoadingScaffold(),
      error: (e, _) => _ErrorScaffold(error: e, onRetry: () => ref.invalidate(brandBySlugProvider(slug))),
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
