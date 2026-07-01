import '../../core/config/app_config.dart';
import '../../core/utils/json.dart';
import 'media.dart';
import 'brand.dart';
import 'category.dart';

class ProductImage {
  final String id;
  final bool isPrimary;
  final AppMedia? media;
  const ProductImage({required this.id, this.isPrimary = false, this.media});

  factory ProductImage.fromJson(Map<String, dynamic> json) => ProductImage(
        id: asString(json['id']),
        isPrimary: asBool(json['isPrimary']),
        media: json['media'] is Map ? AppMedia.fromJson(asMap(json['media'])) : null,
      );

  String get url => media?.thumb ?? '';
  String get fullUrl => media?.full ?? '';
}

class ProductShade {
  final String id;
  final String name;
  final String colorHex;
  final String? colorHexEnd;
  final int? price;
  final int stock;
  final AppMedia? image;

  const ProductShade({
    required this.id,
    required this.name,
    required this.colorHex,
    this.colorHexEnd,
    this.price,
    this.stock = 0,
    this.image,
  });

  factory ProductShade.fromJson(Map<String, dynamic> json) => ProductShade(
        id: asString(json['id']),
        name: asString(json['name']),
        colorHex: asString(json['colorHex'], '#CCCCCC'),
        colorHexEnd: json['colorHexEnd']?.toString(),
        price: json['price'] != null ? asInt(json['price']) : null,
        stock: asInt(json['stock']),
        image: json['image'] is Map ? AppMedia.fromJson(asMap(json['image'])) : null,
      );

  bool get inStock => stock > 0;
}

class ProductVariant {
  final String id;
  final String label;
  final String? sizeLabel;
  final int priceDelta;
  final int stock;

  const ProductVariant({
    required this.id,
    required this.label,
    this.sizeLabel,
    this.priceDelta = 0,
    this.stock = 0,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) => ProductVariant(
        id: asString(json['id']),
        label: asString(json['label']),
        sizeLabel: json['sizeLabel']?.toString(),
        priceDelta: asInt(json['priceDelta']),
        stock: asInt(json['stock']),
      );
}

class Product {
  final String id;
  final String sku;
  final String name;
  final String slug;
  final String description;
  final String ingredients;
  final String howToUse;
  final int price;
  final int originalPrice;
  final int discountPercent;
  final double rating;
  final int reviewCount;
  final int soldCount;
  final int stock;
  final int pointsEarned;
  final bool isNew;
  final bool isBestSeller;
  final bool isFeatured;
  final bool isPromo;
  final List<String> tags;
  final Brand? brand;
  final Category? category;
  final List<ProductImage> images;
  final List<ProductShade> shades;
  final List<ProductVariant> variants;
  final int shadeCount;

  const Product({
    required this.id,
    required this.sku,
    required this.name,
    required this.slug,
    this.description = '',
    this.ingredients = '',
    this.howToUse = '',
    this.price = 0,
    this.originalPrice = 0,
    this.discountPercent = 0,
    this.rating = 0,
    this.reviewCount = 0,
    this.soldCount = 0,
    this.stock = 0,
    this.pointsEarned = 0,
    this.isNew = false,
    this.isBestSeller = false,
    this.isFeatured = false,
    this.isPromo = false,
    this.tags = const [],
    this.brand,
    this.category,
    this.images = const [],
    this.shades = const [],
    this.variants = const [],
    this.shadeCount = 0,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    final count = asMap(json['_count']);
    final shades = asList(json['shades']).map(ProductShade.fromJson).toList();
    return Product(
      id: asString(json['id']),
      sku: asString(json['sku']),
      name: asString(json['name']),
      slug: asString(json['slug']),
      description: asString(json['description']),
      ingredients: asString(json['ingredients']),
      howToUse: asString(json['howToUse']),
      price: asInt(json['price']),
      originalPrice: asInt(json['originalPrice']),
      discountPercent: asInt(json['discountPercent']),
      rating: asDouble(json['rating']),
      reviewCount: asInt(json['reviewCount']),
      soldCount: asInt(json['soldCount']),
      stock: asInt(json['stock']),
      pointsEarned: asInt(json['pointsEarned']),
      isNew: asBool(json['isNew']),
      isBestSeller: asBool(json['isBestSeller']),
      isFeatured: asBool(json['isFeatured']),
      isPromo: asBool(json['isPromo']),
      tags: json['tags'] is List ? asStringList(json['tags']) : const [],
      brand: json['brand'] is Map ? Brand.fromJson(asMap(json['brand'])) : null,
      category: json['category'] is Map ? Category.fromJson(asMap(json['category'])) : null,
      images: asList(json['images']).map(ProductImage.fromJson).toList(),
      shades: shades,
      variants: asList(json['variants']).map(ProductVariant.fromJson).toList(),
      shadeCount: shades.isNotEmpty ? shades.length : asInt(count['shades']),
    );
  }

  String get coverUrl {
    for (final img in images) {
      final url = img.url.isNotEmpty ? img.url : img.fullUrl;
      if (url.isNotEmpty) return url;
    }
    for (final shade in shades) {
      final url = shade.image?.thumb ?? shade.image?.full ?? '';
      if (url.isNotEmpty) return url;
    }
    return AppConfig.productPlaceholderUrl;
  }

  String get displayCoverUrl => coverUrl;
  List<String> get galleryUrls =>
      images.map((e) => e.fullUrl).where((e) => e.isNotEmpty).toList();
  bool get inStock => stock > 0;
  bool get hasDiscount => discountPercent > 0 && originalPrice > price;
  String get brandName => brand?.name ?? '';
}
