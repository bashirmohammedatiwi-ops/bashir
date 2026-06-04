enum CouponType { percent, freeShipping, firstOrder }

class CouponModel {
  const CouponModel({
    required this.code,
    required this.type,
    required this.value,
    required this.description,
    this.minOrder = 0,
  });

  final String code;
  final CouponType type;
  final int value;
  final String description;
  final int minOrder;
}
