import 'product_shade.dart';

class ProductModel {
  const ProductModel({
    required this.id,
    required this.name,
    required this.brand,
    required this.brandId,
    required this.categoryId,
    required this.subcategoryId,
    required this.price,
    required this.originalPrice,
    required this.discountPercent,
    required this.images,
    required this.rating,
    required this.reviewCount,
    required this.soldCount,
    required this.description,
    required this.ingredients,
    required this.howToUse,
    this.shades,
    this.sizes,
    required this.stock,
    this.isNew = false,
    this.isBestSeller = false,
    this.isFeatured = false,
    this.isPromo = false,
    this.isBogo = false,
    this.skinType = const [],
    required this.pointsEarned,
    this.tags = const [],
    required this.createdAt,
  });

  final String id;
  final String name;
  final String brand;
  final String brandId;
  final String categoryId;
  final String subcategoryId;
  final int price;
  final int originalPrice;
  final int discountPercent;
  final List<String> images;
  final double rating;
  final int reviewCount;
  final int soldCount;
  final String description;
  final String ingredients;
  final String howToUse;
  final List<ProductShade>? shades;
  final List<String>? sizes;
  final int stock;
  final bool isNew;
  final bool isBestSeller;
  final bool isFeatured;
  final bool isPromo;
  final bool isBogo;
  final List<String> skinType;
  final int pointsEarned;
  final List<String> tags;
  final DateTime createdAt;

  bool get inStock => stock > 0;

  ProductModel copyWith({
    int? stock,
    bool? isNew,
    bool? isBestSeller,
  }) =>
      ProductModel(
        id: id,
        name: name,
        brand: brand,
        brandId: brandId,
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        price: price,
        originalPrice: originalPrice,
        discountPercent: discountPercent,
        images: images,
        rating: rating,
        reviewCount: reviewCount,
        soldCount: soldCount,
        description: description,
        ingredients: ingredients,
        howToUse: howToUse,
        shades: shades,
        sizes: sizes,
        stock: stock ?? this.stock,
        isNew: isNew ?? this.isNew,
        isBestSeller: isBestSeller ?? this.isBestSeller,
        isFeatured: isFeatured,
        isPromo: isPromo,
        isBogo: isBogo,
        skinType: skinType,
        pointsEarned: pointsEarned,
        tags: tags,
        createdAt: createdAt,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'brand': brand,
        'brandId': brandId,
        'categoryId': categoryId,
        'subcategoryId': subcategoryId,
        'price': price,
        'originalPrice': originalPrice,
        'discountPercent': discountPercent,
        'images': images,
        'rating': rating,
        'reviewCount': reviewCount,
        'soldCount': soldCount,
        'description': description,
        'ingredients': ingredients,
        'howToUse': howToUse,
        'shades': shades?.map((e) => e.toJson()).toList(),
        'sizes': sizes,
        'stock': stock,
        'isNew': isNew,
        'isBestSeller': isBestSeller,
        'isFeatured': isFeatured,
        'isPromo': isPromo,
        'isBogo': isBogo,
        'skinType': skinType,
        'pointsEarned': pointsEarned,
        'tags': tags,
        'createdAt': createdAt.toIso8601String(),
      };

  factory ProductModel.fromJson(Map<String, dynamic> json) => ProductModel(
        id: json['id'] as String,
        name: json['name'] as String,
        brand: json['brand'] as String,
        brandId: json['brandId'] as String,
        categoryId: json['categoryId'] as String,
        subcategoryId: json['subcategoryId'] as String,
        price: json['price'] as int,
        originalPrice: json['originalPrice'] as int,
        discountPercent: json['discountPercent'] as int,
        images: List<String>.from(json['images'] as List),
        rating: (json['rating'] as num).toDouble(),
        reviewCount: json['reviewCount'] as int,
        soldCount: json['soldCount'] as int,
        description: json['description'] as String,
        ingredients: json['ingredients'] as String,
        howToUse: json['howToUse'] as String,
        shades: json['shades'] != null
            ? (json['shades'] as List)
                .map((e) => ProductShade.fromJson(e as Map<String, dynamic>))
                .toList()
            : null,
        sizes: json['sizes'] != null
            ? List<String>.from(json['sizes'] as List)
            : null,
        stock: json['stock'] as int,
        isNew: json['isNew'] as bool? ?? false,
        isBestSeller: json['isBestSeller'] as bool? ?? false,
        isFeatured: json['isFeatured'] as bool? ?? false,
        isPromo: json['isPromo'] as bool? ?? false,
        isBogo: json['isBogo'] as bool? ?? false,
        skinType: List<String>.from(json['skinType'] as List? ?? []),
        pointsEarned: json['pointsEarned'] as int,
        tags: List<String>.from(json['tags'] as List? ?? []),
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
