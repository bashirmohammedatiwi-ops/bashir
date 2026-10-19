import '../../core/l10n/localized_text.dart';
import '../../core/utils/json.dart';
import 'product.dart';

/// عنصر سلة محلي (يُحفظ على الجهاز ويُرسل عند إنشاء الطلب).
class CartItem {
  final String productId;
  final String? productSlug;
  final String name;
  final String? nameAr;
  final String? nameEn;
  final String imageUrl;
  final int price;

  /// السعر قبل الخصم (للسطر المشطوب و«وفّرتِ») — 0 بلا خصم، ودائماً أكبر من [price] إن وُجد.
  final int originalPrice;
  final int quantity;
  final String? shadeId;
  final String? shadeName;

  /// لون الدرجة (#RRGGBB) لنقطة اللون في السلة.
  final String? shadeHex;
  final int stock;

  const CartItem({
    required this.productId,
    this.productSlug,
    required this.name,
    this.nameAr,
    this.nameEn,
    required this.imageUrl,
    required this.price,
    this.originalPrice = 0,
    this.quantity = 1,
    this.shadeId,
    this.shadeName,
    this.shadeHex,
    this.stock = 0,
  });

  /// مفتاح فريد يجمع المنتج مع الدرجة المختارة.
  String get key => shadeId == null ? productId : '$productId:$shadeId';
  int get lineTotal => price * quantity;

  bool get hasDiscount => originalPrice > price;

  /// مجموع السطر بالسعر الأصلي (قبل خصم العروض).
  int get lineOriginalTotal => (hasDiscount ? originalPrice : price) * quantity;

  /// توفير العروض في هذا السطر.
  int get lineSaving => hasDiscount ? (originalPrice - price) * quantity : 0;
  String get routeId =>
      (productSlug != null && productSlug!.isNotEmpty) ? productSlug! : productId;

  String localizedName(String lang) => localizedText(
        languageCode: lang,
        ar: nameAr ?? name,
        en: nameEn,
        fallback: name,
      );

  /// نسخة معدّلة — للكمية، ولتحديث السعر والمخزون والاسم والصورة من بيانات الخادم.
  CartItem copyWith({
    int? quantity,
    int? price,
    int? originalPrice,
    int? stock,
    String? name,
    String? nameAr,
    String? nameEn,
    String? imageUrl,
    String? shadeName,
    String? shadeHex,
  }) {
    final nextPrice = price ?? this.price;
    final nextOriginal = originalPrice ?? this.originalPrice;
    return CartItem(
      productId: productId,
      productSlug: productSlug,
      name: name ?? this.name,
      nameAr: nameAr ?? this.nameAr,
      nameEn: nameEn ?? this.nameEn,
      imageUrl: imageUrl ?? this.imageUrl,
      price: nextPrice,
      originalPrice: nextOriginal > nextPrice ? nextOriginal : 0,
      quantity: quantity ?? this.quantity,
      shadeId: shadeId,
      shadeName: shadeName ?? this.shadeName,
      shadeHex: shadeHex ?? this.shadeHex,
      stock: stock ?? this.stock,
    );
  }

  factory CartItem.fromProduct(Product p, {int quantity = 1, ProductShade? shade}) {
    // نفس قاعدة السيرفر: سعر الدرجة إن كان لها سعر، وإلا سعر المنتج.
    final price = p.unitFor(shade);
    final original = p.origFor(shade);
    return CartItem(
      productId: p.id,
      productSlug: p.slug.isNotEmpty ? p.slug : null,
      name: p.localizedName('ar'),
      nameAr: p.nameAr ?? p.name,
      nameEn: p.nameEn,
      imageUrl: shade?.image?.thumb.isNotEmpty == true ? shade!.image!.thumb : p.coverUrl,
      price: price,
      originalPrice: original > price ? original : 0,
      quantity: quantity,
      shadeId: shade?.id,
      shadeName: shade?.name,
      shadeHex: shade?.colorHex,
      stock: shade?.stock ?? p.stock,
    );
  }

  Map<String, dynamic> toJson() => {
        'productId': productId,
        if (productSlug != null) 'productSlug': productSlug,
        'name': name,
        if (nameAr != null) 'nameAr': nameAr,
        if (nameEn != null) 'nameEn': nameEn,
        'imageUrl': imageUrl,
        'price': price,
        if (originalPrice > price) 'originalPrice': originalPrice,
        'quantity': quantity,
        'shadeId': shadeId,
        'shadeName': shadeName,
        if (shadeHex != null) 'shadeHex': shadeHex,
        'stock': stock,
      };

  /// سلال قديمة محفوظة بلا originalPrice/shadeHex تُقرأ بلا خصم وبلا لون.
  factory CartItem.fromJson(Map<String, dynamic> json) {
    final price = asInt(json['price']);
    final original = asInt(json['originalPrice']);
    final hex = json['shadeHex']?.toString().trim();
    return CartItem(
      productId: asString(json['productId']),
      productSlug: json['productSlug']?.toString(),
      name: asString(json['name']),
      nameAr: json['nameAr']?.toString(),
      nameEn: json['nameEn']?.toString(),
      imageUrl: asString(json['imageUrl']),
      price: price,
      originalPrice: original > price ? original : 0,
      quantity: asInt(json['quantity'], 1),
      shadeId: json['shadeId']?.toString(),
      shadeName: json['shadeName']?.toString(),
      shadeHex: (hex == null || hex.isEmpty) ? null : hex,
      stock: asInt(json['stock']),
    );
  }

  /// لإرسال الطلب إلى الخادم.
  Map<String, dynamic> toOrderItem() => {
        'productId': productId,
        'quantity': quantity,
        if (shadeId != null) 'shadeId': shadeId,
      };
}
