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
    return BarcodeLookupResult(
      barcode: asString(json['barcode']),
      productId: asString(product['id']),
      productSlug: asString(product['slug']),
      matchedShadeId: shade == null ? null : asString(shade['id']),
      matchedShadeName: shade == null ? null : asString(shade['name']),
    );
  }
}
