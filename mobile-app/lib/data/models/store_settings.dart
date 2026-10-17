import '../../core/config/app_config.dart';
import '../../core/utils/json.dart';
import 'loyalty_rules.dart';

class StoreSettings {
  final String storeName;
  final int freeShippingThreshold;
  final String? supportPhone;
  final String? whatsapp;
  final LoyaltyRules loyalty;

  const StoreSettings({
    this.storeName = AppConfig.storeNameAr,
    this.freeShippingThreshold = 50000,
    this.supportPhone,
    this.whatsapp,
    this.loyalty = const LoyaltyRules(),
  });

  factory StoreSettings.fromJson(Map<String, dynamic> json) => StoreSettings(
        storeName: asString(json['storeName'], AppConfig.storeNameAr),
        freeShippingThreshold: asInt(json['freeShippingThreshold'], 50000),
        supportPhone: json['supportPhone']?.toString(),
        whatsapp: json['whatsapp']?.toString(),
        loyalty: json['loyalty'] is Map ? LoyaltyRules.fromJson(asMap(json['loyalty'])) : const LoyaltyRules(),
      );
}
