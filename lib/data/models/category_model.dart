class SubcategoryModel {
  const SubcategoryModel({
    required this.id,
    required this.name,
    required this.productCount,
    required this.categoryId,
  });

  final String id;
  final String name;
  final int productCount;
  final String categoryId;
}

class CategoryModel {
  const CategoryModel({
    required this.id,
    required this.name,
    required this.icon,
    required this.subcategories,
  });

  final String id;
  final String name;
  final String icon;
  final List<SubcategoryModel> subcategories;
}
