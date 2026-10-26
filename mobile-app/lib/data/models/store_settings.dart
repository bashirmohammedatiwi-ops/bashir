import '../../core/config/app_config.dart';
import '../../core/utils/json.dart';
import 'loyalty_rules.dart';

class StoreSettings {
  final String storeName;
  final int freeShippingThreshold;
  final String? supportPhone;
  final String? whatsapp;
  final LoyaltyRules loyalty;

  /// الاستلام من الفرع متاح فعلاً: مفعّل من لوحة التحكم وله عنوان فرع.
  /// (السيرفر يرسله true افتراضياً حتى بلا فرع مُعرَّف — بلا عنوان لا معنى للخيار.)
  final bool pickupEnabled;

  /// عنوان الفرع كما يُكتب للزبونة («بغداد - المنصور، شارع 14 رمضان»).
  final String pickupAddress;

  /// أوقات الاستلام («يومياً 10 صباحاً – 10 مساءً») — فارغ إن لم تُحدَّد.
  final String pickupHours;

  /// رسوم تغليف الهدية (د.ع) لطلب «هذا الطلب هدية» — 0 = مجاناً.
  final int giftWrapFee;

  const StoreSettings({
    this.storeName = AppConfig.storeNameAr,
    this.freeShippingThreshold = 50000,
    this.supportPhone,
    this.whatsapp,
    this.loyalty = const LoyaltyRules(),
    this.pickupEnabled = false,
    this.pickupAddress = '',
    this.pickupHours = '',
    this.giftWrapFee = 3000,
  });

  factory StoreSettings.fromJson(Map<String, dynamic> json) {
    final pickupAddress = asString(json['pickupAddress']).trim();
    return StoreSettings(
      storeName: asString(json['storeName'], AppConfig.storeNameAr),
      freeShippingThreshold: asInt(json['freeShippingThreshold'], 50000),
      supportPhone: json['supportPhone']?.toString(),
      whatsapp: json['whatsapp']?.toString(),
      loyalty: json['loyalty'] is Map ? LoyaltyRules.fromJson(asMap(json['loyalty'])) : const LoyaltyRules(),
      pickupEnabled: asBool(json['pickupEnabled'], true) && pickupAddress.isNotEmpty,
      pickupAddress: pickupAddress,
      pickupHours: asString(json['pickupHours']).trim(),
      giftWrapFee: asInt(json['giftWrapFee'], 3000).clamp(0, 1000000),
    );
  }
}
