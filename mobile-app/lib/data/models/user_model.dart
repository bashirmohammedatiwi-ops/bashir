import 'loyalty_model.dart';

class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    this.birthday,
    this.avatarUrl,
    required this.points,
    required this.tier,
    this.orderCount = 0,
  });

  final String id;
  final String name;
  final String phone;
  final String? email;
  final DateTime? birthday;
  final String? avatarUrl;
  final int points;
  final LoyaltyTier tier;
  final int orderCount;

  UserModel copyWith({
    String? name,
    String? email,
    DateTime? birthday,
    String? avatarUrl,
    int? points,
    LoyaltyTier? tier,
  }) =>
      UserModel(
        id: id,
        name: name ?? this.name,
        phone: phone,
        email: email ?? this.email,
        birthday: birthday ?? this.birthday,
        avatarUrl: avatarUrl ?? this.avatarUrl,
        points: points ?? this.points,
        tier: tier ?? this.tier,
        orderCount: orderCount,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'email': email,
        'birthday': birthday?.toIso8601String(),
        'avatarUrl': avatarUrl,
        'points': points,
        'tier': tier.name,
        'orderCount': orderCount,
      };

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as String,
        name: json['name'] as String,
        phone: json['phone'] as String,
        email: json['email'] as String?,
        birthday: json['birthday'] != null
            ? DateTime.parse(json['birthday'] as String)
            : null,
        avatarUrl: json['avatarUrl'] as String?,
        points: json['points'] as int,
        tier: LoyaltyTier.values.firstWhere(
          (e) => e.name == json['tier'],
          orElse: () => LoyaltyTier.normal,
        ),
        orderCount: json['orderCount'] as int? ?? 0,
      );
}
