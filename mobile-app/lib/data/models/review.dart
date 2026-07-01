import '../../core/utils/json.dart';
import '../../core/utils/formatters.dart';

class Review {
  final String id;
  final String userName;
  final double rating;
  final String comment;
  final DateTime? createdAt;

  const Review({
    required this.id,
    required this.userName,
    this.rating = 0,
    this.comment = '',
    this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) => Review(
        id: asString(json['id']),
        userName: asString(json['userName'], 'مستخدم'),
        rating: asDouble(json['rating']),
        comment: asString(json['comment']),
        createdAt: parseDate(json['createdAt']),
      );

  String get dateLabel => formatDate(createdAt);
}
