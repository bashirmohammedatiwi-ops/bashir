import '../models/review_model.dart';

class ReviewRemoteMapper {
  static ReviewModel fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return ReviewModel(
      id: json['id'] as String,
      productId: (json['productId'] as String?) ?? '',
      userName: (user?['name'] as String?) ?? (json['userName'] as String?) ?? 'عميلة',
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      comment: (json['comment'] as String?) ?? '',
      date: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      userAvatar: user?['avatarUrl'] as String?,
    );
  }
}
