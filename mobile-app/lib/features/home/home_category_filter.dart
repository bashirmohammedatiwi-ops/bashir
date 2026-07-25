import '../../data/models/category.dart';

/// أقسام رئيسية ظاهرة في المتجر (نفس منطق صفحة الأقسام).
List<Category> storefrontParentCategories(List<Category> apiCats) {
  return apiCats.where((c) => c.parentId == null).toList(growable: false);
}

/// يفلتر أقسام القسم حسب ما يُرجعه API (إخفاء الفارغة).
List<Category> filterStorefrontCategories(
  List<Category> sectionCats,
  List<Category>? apiCats,
) {
  final normalized = _dedupe(sectionCats);
  if (apiCats == null || apiCats.isEmpty) return normalized;
  final allowed = apiCats.map((c) => c.id).toSet();
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
