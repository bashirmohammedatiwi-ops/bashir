import '../models/coupon_model.dart';

abstract final class MockCoupons {
  static const List<CouponModel> all = [
    CouponModel(
      code: 'HAYAH10',
      type: CouponType.percent,
      value: 10,
      description: 'خصم ١٠٪ على الطلب',
    ),
    CouponModel(
      code: 'HAYAH20',
      type: CouponType.percent,
      value: 20,
      description: 'خصم ٢٠٪ على الطلب',
    ),
    CouponModel(
      code: 'FIRST50',
      type: CouponType.firstOrder,
      value: 50,
      description: 'خصم ٥٠٪ على أول طلب',
    ),
    CouponModel(
      code: 'FREE',
      type: CouponType.freeShipping,
      value: 0,
      description: 'توصيل مجاني',
    ),
  ];

  static CouponModel? findByCode(String code) {
    try {
      return all.firstWhere(
        (c) => c.code.toUpperCase() == code.toUpperCase(),
      );
    } catch (_) {
      return null;
    }
  }
}
