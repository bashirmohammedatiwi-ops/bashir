import '../../core/utils/formatters.dart';
import '../../core/utils/json.dart';

class AppUser {
  final String id;
  final String? email;
  final String name;
  final String? phone;
  final String? avatarUrl;
  final int points;
  final int orderCount;
  final int wishlistCount;

  /// تاريخ الميلاد (اختياري) — يصل من `/auth/me` كتاريخ ISO.
  final DateTime? birthday;

  const AppUser({
    required this.id,
    this.email,
    required this.name,
    this.phone,
    this.avatarUrl,
    this.points = 0,
    this.orderCount = 0,
    this.wishlistCount = 0,
    this.birthday,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: asString(json['id']),
        email: json['email']?.toString(),
        name: asString(json['name']),
        phone: json['phone']?.toString(),
        avatarUrl: json['avatarUrl']?.toString(),
        points: asInt(json['points'] ?? json['loyaltyPoints']),
        orderCount: asInt(json['orderCount']),
        wishlistCount: asInt(json['wishlistCount']),
        birthday: parseDate(json['birthday']),
      );

  /// عكس [AppUser.fromJson] تماماً — لحفظ الحساب على الجهاز وفتح التطبيق بلا إنترنت.
  Map<String, dynamic> toJson() => {
        'id': id,
        if (email != null) 'email': email,
        'name': name,
        if (phone != null) 'phone': phone,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
        'points': points,
        'orderCount': orderCount,
        'wishlistCount': wishlistCount,
        if (birthday != null) 'birthday': birthday!.toIso8601String(),
      };
}
