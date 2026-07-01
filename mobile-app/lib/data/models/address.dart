import '../../core/utils/json.dart';

class Address {
  final String id;
  final String fullName;
  final String phone;
  final String city;
  final String? governorate;
  final String? area;
  final String? street;
  final String? house;
  final String? notes;
  final bool isDefault;

  const Address({
    required this.id,
    required this.fullName,
    required this.phone,
    required this.city,
    this.governorate,
    this.area,
    this.street,
    this.house,
    this.notes,
    this.isDefault = false,
  });

  factory Address.fromJson(Map<String, dynamic> json) => Address(
        id: asString(json['id']),
        fullName: asString(json['fullName']),
        phone: asString(json['phone']),
        city: asString(json['city']),
        governorate: json['governorate']?.toString(),
        area: json['area']?.toString(),
        street: json['street']?.toString(),
        house: json['house']?.toString(),
        notes: json['notes']?.toString(),
        isDefault: asBool(json['isDefault']),
      );

  Map<String, dynamic> toJson() => {
        'fullName': fullName,
        'phone': phone,
        'city': city,
        if (governorate != null) 'governorate': governorate,
        if (area != null) 'area': area,
        if (street != null) 'street': street,
        if (house != null) 'house': house,
        if (notes != null) 'notes': notes,
        'isDefault': isDefault,
      };

  String get summary => [
        [governorate, city, area].where((e) => (e ?? '').isNotEmpty).join(' - '),
        [street, house].where((e) => (e ?? '').isNotEmpty).join(' '),
      ].where((e) => e.isNotEmpty).join('، ');
}
