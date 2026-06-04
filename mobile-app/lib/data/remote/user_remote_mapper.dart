import '../models/loyalty_model.dart';
import '../models/user_model.dart';

class UserRemoteMapper {
  static UserModel fromMe(Map<String, dynamic> json) {
    final tierName = (json['tier'] as String?) ?? 'normal';
    return UserModel(
      id: json['id'] as String,
      name: (json['name'] as String?) ?? '',
      phone: (json['phone'] as String?) ?? '',
      email: json['email'] as String?,
      birthday: json['birthday'] != null
          ? DateTime.tryParse(json['birthday'].toString())
          : null,
      avatarUrl: json['avatarUrl'] as String?,
      points: (json['points'] as num?)?.toInt() ??
          (json['loyaltyPoints'] as num?)?.toInt() ??
          0,
      tier: LoyaltyTier.values.firstWhere(
        (e) => e.name == tierName,
        orElse: () => LoyaltyTier.normal,
      ),
      orderCount: (json['orderCount'] as num?)?.toInt() ?? 0,
    );
  }
}
