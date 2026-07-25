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
  final int quantity;
  final String? shadeId;
  final String? shadeName;
  final int stock;

  const CartItem({
    required this.productId,
    this.productSlug,
    required this.name,
    this.nameAr,
    this.nameEn,
    required this.imageUrl,
    required this.price,
    this.quantity = 1,
    this.shadeId,
    this.shadeName,
    this.stock = 0,
  });

  /// مفتاح فريد يجمع المنتج مع الدرجة المختارة.
  String get key => shadeId == null ? productId : '$productId:$shadeId';
  int get lineTotal => price * quantity;
  String get routeId =>
      (productSlug != null && productSlug!.isNotEmpty) ? productSlug! : productId;

  String localizedName(String lang) => localizedText(
        languageCode: lang,
        ar: nameAr ?? name,
        en: nameEn,
        fallback: name,
      );

  CartItem copyWith({int? quantity}) => CartItem(
        productId: productId,
        productSlug: productSlug,
        name: name,
        nameAr: nameAr,
        nameEn: nameEn,
        imageUrl: imageUrl,
        price: price,
        quantity: quantity ?? this.quantity,
        shadeId: shadeId,
        shadeName: shadeName,
        stock: stock,
      );

  factory CartItem.fromProduct(Product p, {int quantity = 1, ProductShade? shade}) {
    final price = shade?.price ?? p.price;
    return CartItem(
      productId: p.id,
      productSlug: p.slug.isNotEmpty ? p.slug : null,
      name: p.localizedName('ar'),
      nameAr: p.nameAr ?? p.name,
      nameEn: p.nameEn,
      imageUrl: shade?.image?.thumb.isNotEmpty == true ? shade!.image!.thumb : p.coverUrl,
      price: price,
      quantity: quantity,
      shadeId: shade?.id,
      shadeName: shade?.name,
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
        'quantity': quantity,
        'shadeId': shadeId,
        'shadeName': shadeName,
        'stock': stock,
      };

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        productId: asString(json['productId']),
        productSlug: json['productSlug']?.toString(),
        name: asString(json['name']),
        nameAr: json['nameAr']?.toString(),
        nameEn: json['nameEn']?.toString(),
        imageUrl: asString(json['imageUrl']),
        price: asInt(json['price']),
        quantity: asInt(json['quantity'], 1),
        shadeId: json['shadeId']?.toString(),
        shadeName: json['shadeName']?.toString(),
        stock: asInt(json['stock']),
      );

  /// لإرسال الطلب إلى الخادم.
  Map<String, dynamic> toOrderItem() => {
        'productId': productId,
        'quantity': quantity,
        if (shadeId != null) 'shadeId': shadeId,
      };
}
