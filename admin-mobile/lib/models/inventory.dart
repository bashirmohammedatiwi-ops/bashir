import '../core/utils/json.dart';

class BarcodePosSnapshot {
  const BarcodePosSnapshot({
    required this.price,
    required this.originalPrice,
    required this.discountPercent,
    required this.stock,
    this.name,
    this.offerName,
    this.syncedAt,
  });

  final double price;
  final double originalPrice;
  final int discountPercent;
  final int stock;
  final String? name;
  final String? offerName;
  final String? syncedAt;

  factory BarcodePosSnapshot.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const BarcodePosSnapshot(
        price: 0,
        originalPrice: 0,
        discountPercent: 0,
        stock: 0,
      );
    }
    return BarcodePosSnapshot(
      price: asDouble(json['price']),
      originalPrice: asDouble(json['originalPrice']),
      discountPercent: asInt(json['discountPercent']),
      stock: asInt(json['stock']),
      name: json['name']?.toString(),
      offerName: json['offerName']?.toString(),
      syncedAt: json['syncedAt']?.toString(),
    );
  }
}

class BarcodeInAppInfo {
  const BarcodeInAppInfo({required this.id, this.name});
  final String id;
  final String? name;

  factory BarcodeInAppInfo.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const BarcodeInAppInfo(id: '');
    return BarcodeInAppInfo(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString(),
    );
  }
}

class BarcodeInventoryLookup {
  const BarcodeInventoryLookup({
    required this.barcode,
    this.pos,
    this.inApp,
  });

  final String barcode;
  final BarcodePosSnapshot? pos;
  final BarcodeInAppInfo? inApp;

  bool get existsInApp => inApp != null && inApp!.id.isNotEmpty;
  bool get hasPos => pos != null && (pos!.price > 0 || pos!.stock > 0);

  factory BarcodeInventoryLookup.fromJson(String barcode, Map<String, dynamic> json) {
    final posRaw = json['pos'];
    final inAppRaw = json['inApp'];
    return BarcodeInventoryLookup(
      barcode: barcode,
      pos: posRaw is Map ? BarcodePosSnapshot.fromJson(asMap(posRaw)) : null,
      inApp: inAppRaw is Map ? BarcodeInAppInfo.fromJson(asMap(inAppRaw)) : null,
    );
  }
}
