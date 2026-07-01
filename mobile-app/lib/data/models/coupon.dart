import '../../core/utils/json.dart';

class Coupon {
  final String id;
  final String code;
  final String type; // PERCENT | FIXED | FREE_SHIPPING | FIRST_ORDER
  final int value;
  final String description;
  final int minOrder;
  final bool isActive;

  const Coupon({
    required this.id,
    required this.code,
    required this.type,
    this.value = 0,
    this.description = '',
    this.minOrder = 0,
    this.isActive = true,
  });

  factory Coupon.fromJson(Map<String, dynamic> json) => Coupon(
        id: asString(json['id']),
        code: asString(json['code']),
        type: asString(json['type']),
        value: asInt(json['value']),
        description: asString(json['description']),
        minOrder: asInt(json['minOrder']),
        isActive: asBool(json['isActive'], true),
      );

  /// يحسب قيمة الخصم على مجموع فرعي معيّن.
  int discountFor(int subtotal) {
    switch (type) {
      case 'PERCENT':
      case 'FIRST_ORDER':
        return (subtotal * value / 100).round();
      case 'FIXED':
        return value;
      default:
        return 0; // FREE_SHIPPING يُعالج في الشحن
    }
  }

  bool get freeShipping => type == 'FREE_SHIPPING';
}
