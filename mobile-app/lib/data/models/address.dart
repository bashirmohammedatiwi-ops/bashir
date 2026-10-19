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

  /// أقرب نقطة دالة (إن أرسلها الخادم).
  final String? landmark;
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
    this.landmark,
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
        landmark: json['landmark']?.toString(),
        isDefault: asBool(json['isDefault']),
      );

  /// للإنشاء وللتعديل الجزئي (الحقل الغائب يبقى كما هو على الخادم): الحقول الفارغة لا تُرسل.
  Map<String, dynamic> toJson() => {
        'fullName': fullName,
        'phone': phone,
        'city': city,
        if (governorate != null) 'governorate': governorate,
        if (area != null) 'area': area,
        if (street != null) 'street': street,
        if (house != null) 'house': house,
        if (notes != null) 'notes': notes,
        if (landmark != null) 'landmark': landmark,
        'isDefault': isDefault,
      };

  /// للتعديل: الحقول الاختيارية تُرسل دائماً — null صريح يمسح القيمة القديمة
  /// (تغيير المحافظة يمسح منطقة محافظة أخرى، وحذف الملاحظة يحذفها فعلاً).
  ///
  /// [landmark] يُرسل فقط إن جاء من الخادم: الخادم يرفض الحقول التي لا يعرفها
  /// (forbidNonWhitelisted)، وخادم بلا هذا الحقل لا يرسله أصلاً.
  Map<String, dynamic> toPatchJson() => {
        'fullName': fullName,
        'phone': phone,
        'city': city,
        'governorate': _blankToNull(governorate),
        'area': _blankToNull(area),
        'street': _blankToNull(street),
        'house': _blankToNull(house),
        'notes': _blankToNull(notes),
        if (landmark != null) 'landmark': _blankToNull(landmark),
        'isDefault': isDefault,
      };

  /// «بغداد - المنصور، شارع 14، دار 12» — بلا تكرار المحافظة إن كانت هي المدينة.
  String get summary => summaryFor(true);

  /// الملخص بلغة الواجهة: «Baghdad - Mansour, Street 14, House 12» بالإنجليزي.
  String summaryFor(bool isAr) {
    final places = <String>[];
    for (final p in [governorate, city, area]) {
      final v = (p ?? '').trim();
      if (v.isNotEmpty && !places.contains(v)) places.add(v);
    }
    final h = (house ?? '').trim();
    final houseLabel = RegExp(r'^\d').hasMatch(h) ? (isAr ? 'دار $h' : 'House $h') : h;
    return [
      places.join(' - '),
      (street ?? '').trim(),
      if (h.isNotEmpty) houseLabel,
    ].where((e) => e.isNotEmpty).join(isAr ? '، ' : ', ');
  }
}

String? _blankToNull(String? v) {
  final t = v?.trim();
  return (t == null || t.isEmpty) ? null : t;
}
