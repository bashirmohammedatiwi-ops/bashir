import '../../data/models/category.dart';

/// أقسام رئيسية ظاهرة في المتجر (نفس منطق صفحة الأقسام).
List<Category> storefrontParentCategories(List<Category> apiCats) {
  return apiCats.where((c) => c.parentId == null).toList(growable: false);
}

/// كل معرفات الأقسام في الشجرة (رئيسي + فرعي + ثانوي).
Set<String> flattenCategoryIds(List<Category> apiCats) {
  final ids = <String>{};
  void walk(Category c) {
    ids.add(c.id);
    for (final child in c.children) {
      walk(child);
    }
  }
  for (final c in apiCats) {
    walk(c);
  }
  return ids;
}

/// يفلتر أقسام القسم حسب ما يُرجعه API (إخفاء الفارغة) — يشمل كل المستويات.
List<Category> filterStorefrontCategories(
  List<Category> sectionCats,
  List<Category>? apiCats,
) {
  final normalized = _dedupe(sectionCats);
  if (apiCats == null || apiCats.isEmpty) return normalized;
  final allowed = flattenCategoryIds(apiCats);
  return normalized.where((c) => allowed.contains(c.id)).toList(growable: false);
}

List<Category> _dedupe(List<Category> raw) {
  final seen = <String>{};
  final out = <Category>[];
  for (final c in raw) {
    if (seen.add(c.id)) out.add(c);
  }
  return out;
}
