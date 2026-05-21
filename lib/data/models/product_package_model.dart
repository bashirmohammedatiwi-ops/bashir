/// باقة: مجموعة منتجات بسعر موحّد مخفّض.
class ProductPackageModel {
  const ProductPackageModel({
    required this.id,
    required this.name,
    required this.subtitle,
    required this.productIds,
    required this.price,
    required this.originalPrice,
    required this.coverImageUrl,
    this.badge,
    this.isFeatured = false,
  });

  final String id;
  final String name;
  final String subtitle;
  final List<String> productIds;
  final int price;
  final int originalPrice;
  final String coverImageUrl;
  final String? badge;
  final bool isFeatured;

  int get itemCount => productIds.length;

  int get savingsAmount => originalPrice - price;

  int get savingsPercent =>
      originalPrice > 0 ? ((savingsAmount / originalPrice) * 100).round() : 0;
}
