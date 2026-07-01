import '../../core/utils/json.dart';

class AppUser {
  final String id;
  final String email;
  final String name;
  final String? phone;
  final String? avatarUrl;
  final int points;
  final String tier;
  final int orderCount;
  final int wishlistCount;

  const AppUser({
    required this.id,
    required this.email,
    required this.name,
    this.phone,
    this.avatarUrl,
    this.points = 0,
    this.tier = 'normal',
    this.orderCount = 0,
    this.wishlistCount = 0,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: asString(json['id']),
        email: asString(json['email']),
        name: asString(json['name']),
        phone: json['phone']?.toString(),
        avatarUrl: json['avatarUrl']?.toString(),
        points: asInt(json['points'] ?? json['loyaltyPoints']),
        tier: asString(json['tier'], 'normal'),
        orderCount: asInt(json['orderCount']),
        wishlistCount: asInt(json['wishlistCount']),
      );

  String get tierLabel => switch (tier) {
        'platinum' => 'بلاتيني',
        'gold' => 'ذهبي',
        'silver' => 'فضي',
        _ => 'عضو',
      };
}
