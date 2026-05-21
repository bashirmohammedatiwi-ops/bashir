import '../models/product_model.dart';
import '../models/product_shade.dart';
import 'mock_brands.dart';
import 'mock_categories.dart';
import 'mock_product_images.dart';

abstract final class MockProducts {
  static const List<String> _productNames = [
    'كريم مرطب فاخر', 'سيروم فيتامين سي', 'أحمر شفاه مات', 'ماسكارا طويلة',
    'أساس سائل كامل التغطية', 'كونسيلر عالي التغطية', 'عطر نسائي فاخر',
    'شامبو للشعر التالف', 'بلسم مرطب', 'زيت عناية بالشعر',
    'لوشن مرطب للجسم', 'سكراب الجسم', 'طلاء أظافر لامع',
    'مجموعة فرش مكياج', 'واقي شمس SPF50', 'تونر للبشرة الدهنية',
    'ماسك طيني', 'كريم عيون مضاد للتجاعيد', 'هايلايتر سائل',
    'ظلال عيون باليت', 'برايمر للوجه', 'سيتينق سبراي',
    'جل حواجب', 'رموش اصطناعية', 'مزيل مكياج لطيف',
    'كريم ليلي للترطيب', 'سيروم حمض الهيالورونيك',
    'كولاجين للبشرة', 'فيتامين C للوجه', 'مكمل بيوتين',
  ];

  static const List<String> _skinTypes = [
    'جافة', 'دهنية', 'مختلطة', 'حساسة', 'عادية',
  ];

  static const List<String> _shadeColors = [
    '#FFB6C1', '#FF69B4', '#DC143C', '#8B0000', '#FFD700',
    '#F4A460', '#D2691E', '#8B4513', '#FFE4E1', '#FF6347',
  ];

  static late final List<ProductModel> _all = _generate();
  static List<ProductModel> get all => _all;

  static List<ProductModel> _newArrivals = [];
  static List<ProductModel> _bestSellers = [];
  static List<ProductModel> _promoProducts = [];
  static List<ProductModel> _featured = [];

  /// Call from [AppBootstrap.warmCatalog] — not on UI thread during scroll.
  static void warmUp() {
    final products = _all;
    _newArrivals = products.where((p) => p.isNew).take(20).toList();
    _bestSellers = products.where((p) => p.isBestSeller).take(20).toList();
    _promoProducts = products.where((p) => p.isPromo).take(20).toList();
    _featured = products.where((p) => p.isFeatured).take(20).toList();
  }

  static String _productImageUrl(int productIndex, int imageIndex) =>
      MockProductImages.at(productIndex, imageIndex);

  static List<ProductModel> _generate() {
    final products = <ProductModel>[];
    final categories = MockCategories.all;
    final brands = MockBrands.all;

    for (var i = 0; i < 160; i++) {
      final cat = categories[i % categories.length];
      final sub = cat.subcategories[i % cat.subcategories.length];
      final brand = brands[i % brands.length];
      final basePrice = 15000 + (i * 3173) % 350000;
      final discount = (i % 5 == 0) ? 10 + (i % 4) * 5 : 0;
      final originalPrice =
          discount > 0 ? (basePrice / (1 - discount / 100)).round() : basePrice;
      final hasShades = i % 3 == 0;
      final hasSizes = i % 4 == 1;

      products.add(ProductModel(
        id: 'prod_$i',
        name: '${_productNames[i % _productNames.length]} ${i + 1}',
        brand: brand.name,
        brandId: brand.id,
        categoryId: cat.id,
        subcategoryId: sub.id,
        price: basePrice,
        originalPrice: originalPrice,
        discountPercent: discount,
        images: List.generate(3, (j) => _productImageUrl(i, j)),
        rating: 3.5 + (i % 15) / 10,
        reviewCount: 10 + (i * 7) % 200,
        soldCount: 50 + (i * 13) % 5000,
        description:
            'منتج فاخر من ${brand.name} يمنحكِ إطلالة مميزة. تركيبة عالية الجودة مناسبة للاستخدام اليومي. نتائج ملحوظة من أول استخدام.',
        ingredients:
            'ماء، جليسرين، زيت الأرغان، فيتامين E، حمض الهيالورونيك، عطر.',
        howToUse:
            'طبّقي كمية مناسبة على البشرة النظيفة صباحاً ومساءً. للحصول على أفضل النتائج، استخدميه بانتظام.',
        shades: hasShades
            ? List.generate(
                4 + i % 4,
                (s) => ProductShade(
                  name: 'درجة ${s + 1}',
                  colorHex: _shadeColors[(s + i) % _shadeColors.length],
                ),
              )
            : null,
        sizes: hasSizes
            ? ['30ml', '50ml', '100ml'].sublist(0, 2 + i % 2)
            : null,
        stock: i % 17 == 0 ? 0 : 5 + (i * 11) % 200,
        isNew: i % 7 == 0,
        isBestSeller: i % 5 == 0,
        isFeatured: i % 9 == 0,
        isPromo: i % 6 == 0,
        isBogo: i % 11 == 0,
        skinType: i % 2 == 0
            ? [_skinTypes[i % _skinTypes.length]]
            : [],
        pointsEarned: basePrice ~/ 1000,
        tags: [cat.name, sub.name],
        createdAt: DateTime.now().subtract(Duration(days: i)),
      ));
    }
    return products;
  }

  static ProductModel? findById(String id) {
    try {
      return all.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }

  static List<ProductModel> byCategory(String categoryId) =>
      all.where((p) => p.categoryId == categoryId).toList();

  static List<ProductModel> bySubcategory(String subcategoryId) =>
      all.where((p) => p.subcategoryId == subcategoryId).toList();

  static List<ProductModel> byBrand(String brandId) =>
      all.where((p) => p.brandId == brandId).toList();

  static List<ProductModel> search(String query) {
    if (query.isEmpty) return [];
    final q = query.toLowerCase();
    return all
        .where((p) =>
            p.name.contains(query) ||
            p.brand.toLowerCase().contains(q) ||
            p.tags.any((t) => t.contains(query)))
        .toList();
  }

  static List<ProductModel> get newArrivals => _newArrivals;

  static List<ProductModel> get bestSellers => _bestSellers;

  static List<ProductModel> get promoProducts => _promoProducts;

  static List<ProductModel> get featured => _featured;
}
