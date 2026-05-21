import '../models/product_package_model.dart';
import 'mock_products.dart';

abstract final class MockPackages {
  static List<ProductPackageModel>? _cached;

  static List<ProductPackageModel> get all {
    _cached ??= _build();
    return _cached!;
  }

  static List<ProductPackageModel> get featured =>
      all.where((p) => p.isFeatured).toList();

  static ProductPackageModel? findById(String id) {
    try {
      return all.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }

  static List<ProductPackageModel> _build() {
    return [
      _make(
        id: 'pkg_skincare',
        name: 'باقة العناية اليومية',
        subtitle: 'روتين كامل للبشرة المشرقة والناعمة',
        productIds: ['prod_1', 'prod_14', 'prod_26'],
        discountFactor: 0.78,
        coverImageUrl:
            'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
        badge: 'الأكثر طلباً',
        featured: true,
      ),
      _make(
        id: 'pkg_makeup',
        name: 'باقة المكياج الكاملة',
        subtitle: 'إطلالة متكاملة من الأساس حتى الشفاه',
        productIds: ['prod_2', 'prod_4', 'prod_18', 'prod_19'],
        discountFactor: 0.75,
        coverImageUrl:
            'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
        badge: 'وفّري ٢٥٪',
        featured: true,
      ),
      _make(
        id: 'pkg_hair',
        name: 'باقة العناية بالشعر',
        subtitle: 'شامبو وبلسم وزيت للشعر التالف',
        productIds: ['prod_7', 'prod_8', 'prod_9'],
        discountFactor: 0.80,
        coverImageUrl:
            'https://images.unsplash.com/photo-1527799820374-dcf8d9a737e5?w=800&q=80',
        featured: true,
      ),
      _make(
        id: 'pkg_perfume',
        name: 'باقة العطور الفاخرة',
        subtitle: 'تشكيلة روائح أنيقة للمناسبات',
        productIds: ['prod_6', 'prod_30', 'prod_45'],
        discountFactor: 0.82,
        coverImageUrl:
            'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80',
        badge: 'حصري',
        featured: true,
      ),
      _make(
        id: 'pkg_night',
        name: 'باقة العناية الليلية',
        subtitle: 'ترطيب عميق ومكافحة علامات التقدّم',
        productIds: ['prod_25', 'prod_27', 'prod_16'],
        discountFactor: 0.77,
        coverImageUrl:
            'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800&q=80',
        featured: true,
      ),
      _make(
        id: 'pkg_gift',
        name: 'باقة الهدايا المميزة',
        subtitle: 'هدية فاخرة جاهزة للتغليف',
        productIds: ['prod_13', 'prod_6', 'prod_2', 'prod_11'],
        discountFactor: 0.72,
        coverImageUrl:
            'https://images.unsplash.com/photo-1608248543779-f2f8e6f7c3f3?w=800&q=80',
        badge: 'هدية مثالية',
        featured: false,
      ),
    ];
  }

  static ProductPackageModel _make({
    required String id,
    required String name,
    required String subtitle,
    required List<String> productIds,
    required double discountFactor,
    required String coverImageUrl,
    String? badge,
    bool featured = false,
  }) {
    var original = 0;
    for (final pid in productIds) {
      final p = MockProducts.findById(pid);
      if (p != null) original += p.price;
    }
    final price = (original * discountFactor).round();
    return ProductPackageModel(
      id: id,
      name: name,
      subtitle: subtitle,
      productIds: productIds,
      price: price,
      originalPrice: original,
      coverImageUrl: coverImageUrl,
      badge: badge,
      isFeatured: featured,
    );
  }
}
