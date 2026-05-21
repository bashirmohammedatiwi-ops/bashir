class AddressModel {
  const AddressModel({
    required this.id,
    required this.name,
    required this.phone,
    required this.governorate,
    required this.area,
    required this.street,
    required this.house,
    this.notes,
    this.isDefault = false,
  });

  final String id;
  final String name;
  final String phone;
  final String governorate;
  final String area;
  final String street;
  final String house;
  final String? notes;
  final bool isDefault;

  String get fullAddress => '$governorate، $area، $street، $house';

  AddressModel copyWith({bool? isDefault}) => AddressModel(
        id: id,
        name: name,
        phone: phone,
        governorate: governorate,
        area: area,
        street: street,
        house: house,
        notes: notes,
        isDefault: isDefault ?? this.isDefault,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'governorate': governorate,
        'area': area,
        'street': street,
        'house': house,
        'notes': notes,
        'isDefault': isDefault,
      };

  factory AddressModel.fromJson(Map<String, dynamic> json) => AddressModel(
        id: json['id'] as String? ?? '',
        name: (json['fullName'] ?? json['name']) as String? ?? '',
        phone: json['phone'] as String? ?? '',
        governorate: (json['governorate'] ?? json['city']) as String? ?? '',
        area: json['area'] as String? ?? '',
        street: json['street'] as String? ?? '',
        house: json['house'] as String? ?? '',
        notes: json['notes'] as String?,
        isDefault: json['isDefault'] as bool? ?? false,
      );
}
