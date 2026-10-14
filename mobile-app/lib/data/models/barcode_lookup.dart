import '../../core/utils/json.dart';

class BarcodeLookupResult {
  final String barcode;
  final String productId;
  final String productSlug;
  final String? matchedShadeId;
  final String? matchedShadeName;

  const BarcodeLookupResult({
    required this.barcode,
    required this.productId,
    required this.productSlug,
    this.matchedShadeId,
    this.matchedShadeName,
  });

  factory BarcodeLookupResult.fromJson(Map<String, dynamic> json) {
    final product = asMap(json['product']);
    final shade = json['matchedShade'] == null ? null : asMap(json['matchedShade']);
    final slug = asString(product['slug']);
    final id = asString(product['id']);
    return BarcodeLookupResult(
      barcode: asString(json['barcode']),
      productId: id,
      // إن كان الـ slug فارغاً نستخدم المعرف حتى لا يُفتح مسار غير صالح.
      productSlug: slug.isNotEmpty ? slug : id,
      matchedShadeId: shade == null ? null : asString(shade['id']),
      matchedShadeName: shade == null ? null : asString(shade['name']),
    );
  }
}
