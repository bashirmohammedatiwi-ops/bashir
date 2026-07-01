import '../../core/utils/json.dart';

class StoreSettings {
  final String storeName;
  final int freeShippingThreshold;
  final String? supportPhone;
  final String? whatsapp;

  const StoreSettings({
    this.storeName = 'الحياة',
    this.freeShippingThreshold = 50000,
    this.supportPhone,
    this.whatsapp,
  });

  factory StoreSettings.fromJson(Map<String, dynamic> json) => StoreSettings(
        storeName: asString(json['storeName'], 'الحياة'),
        freeShippingThreshold: asInt(json['freeShippingThreshold'], 50000),
        supportPhone: json['supportPhone']?.toString(),
        whatsapp: json['whatsapp']?.toString(),
      );
}
