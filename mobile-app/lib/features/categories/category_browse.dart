import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/category.dart';
import '../../data/models/paginated.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../search/smart_query.dart';
import 'recent_categories.dart';
import '../catalog/catalog_providers.dart' show keepAliveFor;

/// مستوى القسم في الشجرة (رئيسي › فرعي › ثانوي).
enum CategoryLevel { root, sub, tertiary }

/// وجهة قائمة المنتجات لقسم ما — تُبنى منها روابط /products.
@immutable
class CategoryTarget {
  final String title;
  final String? categoryId;
  final String? subcategoryId;
  final String? tertiaryCategoryId;

  const CategoryTarget({
    required this.title,
    this.categoryId,
    this.subcategoryId,
    this.tertiaryCategoryId,
  });

  String get key => tertiaryCategoryId != null
      ? 't:$tertiaryCategoryId'
      : subcategoryId != null
      ? 's:$subcategoryId'
      : 'c:$categoryId';

  String get location {
    final q = StringBuffer('/products?title=${Uri.encodeComponent(title)}');
    if (tertiaryCategoryId != null && subcategoryId != null) {
      q.write(
        '&subcategoryId=$subcategoryId&tertiaryCategoryId=$tertiaryCategoryId',
      );
    } else if (subcategoryId != null) {
      q.write('&subcategoryId=$subcategoryId');
    } else if (categoryId != null) {
      q.write('&categoryId=$categoryId');
    }
    return q.toString();
  }

  void open(BuildContext context) {
    HapticFeedback.lightImpact();
    // نتذكّر القسم في "زرتِها مؤخراً".
    ProviderScope.containerOf(context, listen: false)
        .read(recentCategoriesProvider.notifier)
        .add(RecentCategory(title: title, location: location));
    context.push(location);
  }

  @override
  bool operator ==(Object other) => other is CategoryTarget && other.key == key;

  @override
  int get hashCode => key.hashCode;
}

/// عقدة مفهرسة: القسم + مستواه + آباؤه — للبحث والتنقل السريع.
class IndexedCategory {
  final Category category;
  final CategoryLevel level;
  final Category? root;
  final Category? sub;

  const IndexedCategory({
    required this.category,
    required this.level,
    this.root,
    this.sub,
  });

  CategoryTarget target(String lang) {
    final title = category.localizedName(lang);
    return switch (level) {
      CategoryLevel.root => CategoryTarget(
        title: title,
        categoryId: category.id,
      ),
      CategoryLevel.sub => CategoryTarget(
        title: title,
        subcategoryId: category.id,
      ),
      CategoryLevel.tertiary => CategoryTarget(
        title: title,
        subcategoryId: sub?.id,
        tertiaryCategoryId: category.id,
      ),
    };
  }

  /// المسار للعرض: "المكياج › العيون".
  String path(String lang) => [
    if (root != null && level != CategoryLevel.root) root!.localizedName(lang),
    if (sub != null && level == CategoryLevel.tertiary)
      sub!.localizedName(lang),
  ].join(' › ');
}

/// فهرس الشجرة الكاملة — يُبنى مرة واحدة لكل تحديث للأقسام.
class CategoryIndex {
  final List<IndexedCategory> all;
  final Map<String, IndexedCategory> byId;

  CategoryIndex._(this.all, this.byId);

  factory CategoryIndex.build(List<Category> roots) {
    final all = <IndexedCategory>[];
    for (final r in roots) {
      all.add(IndexedCategory(category: r, level: CategoryLevel.root));
      for (final s in r.children) {
        all.add(
          IndexedCategory(category: s, level: CategoryLevel.sub, root: r),
        );
        for (final t in s.children) {
          all.add(
            IndexedCategory(
              category: t,
              level: CategoryLevel.tertiary,
              root: r,
              sub: s,
            ),
          );
        }
      }
    }
    return CategoryIndex._(all, {for (final e in all) e.category.id: e});
  }

  /// بحث ثنائي اللغة مع مرادفات (ماسكارا = mascara)، مرتب بالأهمية ثم بعدد المنتجات.
  List<IndexedCategory> search(String query) {
    final q = query.trim();
    if (normalizeQuery(q).length < 2) return const [];
    final scored = <(IndexedCategory, int)>[];
    for (final e in all) {
      final c = e.category;
      final fields = [
        c.nameAr ?? c.name,
        c.nameEn,
        c.slug.replaceAll('-', ' '),
      ];
      final score = matchScore(q, fields);
      if (score > 0) {
        // الأقسام الأدق (ثانوي) أنفع في البحث، ثم الأكثر منتجات.
        final levelBoost = switch (e.level) {
          CategoryLevel.tertiary => 6,
          CategoryLevel.sub => 4,
          CategoryLevel.root => 2,
        };
        scored.add((e, score * 10 + levelBoost));
      }
    }
    scored.sort((a, b) {
      final byScore = b.$2.compareTo(a.$2);
      if (byScore != 0) return byScore;
      return b.$1.category.displayCount.compareTo(a.$1.category.displayCount);
    });
    return [for (final s in scored.take(40)) s.$1];
  }
}

/// الأكثر طلباً داخل قسم — معاينة سريعة في لوحة الأقسام.
final categoryTopProductsProvider = FutureProvider.autoDispose
    .family<List<Product>, CategoryTarget>((ref, target) {
      // نُبقي النتيجة دقيقتين للتنقل السريع بين الأقسام بدون إعادة تحميل — والخطأ لا يُبقى.
      return keepAliveFor(ref, const Duration(minutes: 2), () async {
        final Paginated<Product> page = await ref
            .read(apiServiceProvider)
            .getProducts(
              limit: 10,
              sort: 'popular',
              categoryId:
                  target.tertiaryCategoryId == null &&
                      target.subcategoryId == null
                  ? target.categoryId
                  : null,
              subcategoryId: target.subcategoryId,
              tertiaryCategoryId: target.tertiaryCategoryId,
              inStock: true,
            );
        return page.items;
      });
    });

/// العدد الفعلي للمنتجات الظاهرة في المتجر داخل قسم — نفس رقم صفحة المنتجات.
/// (أعداد شجرة الأقسام في الخادم تشمل المخفي ونافد المخزون فلا تُعرض.)
final categoryVisibleCountProvider = FutureProvider.autoDispose
    .family<int, CategoryTarget>((ref, target) {
      return keepAliveFor(ref, const Duration(minutes: 5), () async {
        final page = await ref
            .read(apiServiceProvider)
            .getProducts(
              limit: 1,
              categoryId:
                  target.tertiaryCategoryId == null &&
                      target.subcategoryId == null
                  ? target.categoryId
                  : null,
              subcategoryId: target.subcategoryId,
              tertiaryCategoryId: target.tertiaryCategoryId,
            );
        return page.total;
      });
    });
