import '../../data/models/category.dart';

/// يبحث عن قسم في الشجرة (رئيسي / فرعي / ثانوي).
Category? findCategoryById(List<Category> roots, String id) {
  for (final root in roots) {
    if (root.id == id) return root;
    final found = _findInChildren(root.children, id);
    if (found != null) return found;
  }
  return null;
}

/// الأب المباشر لقسم في الشجرة.
Category? findParentCategory(List<Category> roots, String childId) {
  Category? walk(Category node, String target, Category? parent) {
    if (node.id == target) return parent;
    for (final child in node.children) {
      final found = walk(child, target, node);
      if (found != null) return found;
    }
    return null;
  }
  for (final root in roots) {
    final parent = walk(root, childId, null);
    if (parent != null) return parent;
  }
  return null;
}

Category? _findInChildren(List<Category> nodes, String id) {
  for (final node in nodes) {
    if (node.id == id) return node;
    final found = _findInChildren(node.children, id);
    if (found != null) return found;
  }
  return null;
}

/// أبناء القسم المعروض في صفحة المنتجات (فرعي عند رئيسي، ثانوي عند فرعي).
List<Category> listingChildCategories(
  List<Category> roots, {
  String? categoryId,
  String? subcategoryId,
  String? tertiaryCategoryId,
}) {
  if (tertiaryCategoryId != null) {
    final parent = findParentCategory(roots, tertiaryCategoryId);
    return parent?.children ?? const [];
  }
  if (subcategoryId != null) {
    return findCategoryById(roots, subcategoryId)?.children ?? const [];
  }
  if (categoryId != null) {
    return findCategoryById(roots, categoryId)?.children ?? const [];
  }
  return const [];
}

/// معرّف القسم الفرعي الفعّال (للتنقل والشريط).
String? listingSubcategoryId(
  List<Category> roots, {
  String? subcategoryId,
  String? tertiaryCategoryId,
}) {
  if (subcategoryId != null) return subcategoryId;
  if (tertiaryCategoryId != null) {
    return findParentCategory(roots, tertiaryCategoryId)?.id;
  }
  return null;
}

/// المعرّف النشط في الشريط (null = «الكل»).
String? listingActiveChildId({
  String? categoryId,
  String? subcategoryId,
  String? tertiaryCategoryId,
}) {
  if (tertiaryCategoryId != null) return tertiaryCategoryId;
  if (subcategoryId != null) return null;
  if (categoryId != null) return null;
  return null;
}
