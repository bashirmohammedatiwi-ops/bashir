class ReviewModel {
  const ReviewModel({
    required this.id,
    required this.productId,
    required this.userName,
    required this.rating,
    required this.comment,
    required this.date,
    this.userAvatar,
  });

  final String id;
  final String productId;
  final String userName;
  final double rating;
  final String comment;
  final DateTime date;
  final String? userAvatar;
}
