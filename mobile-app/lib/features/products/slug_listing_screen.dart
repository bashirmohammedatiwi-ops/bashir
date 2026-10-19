import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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

    // ليس في الشجرة المحفوظة (أُضيف بعد فتح التطبيق مثلاً): شجرة جديدة ثم الخادم.
    final async = ref.watch(categorySlugScopeProvider(slug));
    return async.when(
      loading: () => const _LoadingScaffold(),
      error: (e, _) => _ErrorScaffold(
        error: e,
        onRetry: () {
          ref.invalidate(categoriesProvider);
          ref.invalidate(categorySlugScopeProvider(slug));
        },
      ),
      data: (scope) {
        final c = scope.category;
        return ProductListingScreen(
          title: c.localizedName(lang),
          categoryId: scope.depth == 0 ? c.id : null,
          subcategoryId: scope.depth == 1 ? c.id : null,
          tertiaryCategoryId: scope.depth >= 2 ? c.id : null,
        );
      },
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
            // بلا صفحة قبلها يصير زر «الرئيسية» تلقائياً (بتلميح s.goHome).
            const Padding(
              padding: EdgeInsetsDirectional.fromSTEB(8, 6, 8, 0),
              child: Align(
                alignment: AlignmentDirectional.centerStart,
                child: AppBackButton(),
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

/// القسم ومستواه (0 رئيسي، 1 فرعي، 2 ثالث) لـ slug غير موجود في الشجرة المحفوظة.
///
/// فلتر الخادم `categoryId` يطابق القسم الرئيسي وما تحته فقط — تمرير قسم فرعي به يعيد
/// قائمة فارغة، لذا المستوى يُحدَّد من شجرة حديثة قبل أي شيء.
final categorySlugScopeProvider =
    FutureProvider.autoDispose.family<({Category category, int depth}), String>((ref, slug) async {
  final api = ref.read(apiServiceProvider);
  List<Category>? fresh;
  try {
    fresh = await api.getCategories(forceRefresh: true);
    final hit = findCategoryBySlug(fresh, slug);
    if (hit != null) {
      // الشاشة تراقب الشجرة: تُبنى بها مباشرة في المرة القادمة.
      ref.invalidate(categoriesProvider);
      return hit;
    }
  } catch (_) {
    // بلا شجرة حديثة: نكمل بطلب القسم نفسه.
  }
  final category = await api.getCategoryBySlug(slug);
  return (category: category, depth: _depthFromParent(category, fresh));
});

int _depthFromParent(Category category, List<Category>? roots) {
  final parentId = category.parentId;
  if (parentId == null || parentId.isEmpty) return 0;
  final parent = roots == null ? null : findCategoryById(roots, parentId);
  // أب مجهول: «فرعي» — فلتر الخادم للفرعي يطابق أبناءه من المستوى الثالث أيضاً.
  if (parent == null) return 1;
  return parent.parentId == null || parent.parentId!.isEmpty ? 1 : 2;
}

final brandBySlugProvider = FutureProvider.autoDispose.family<Brand, String>((ref, slug) {
  return ref.read(apiServiceProvider).getBrandBySlug(slug);
});
