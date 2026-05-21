import '../models/review_model.dart';
import 'mock_products.dart';

abstract final class MockReviews {
  static const List<String> _names = [
    'نور', 'زينب', 'مريم', 'فاطمة', 'هدى', 'رنا', 'لمى', 'دينا',
    'آية', 'سجى', 'تبارك', 'رغد', 'أسماء', 'شهد', 'ياسمين',
  ];

  static const List<String> _comments = [
    'منتج رائع جداً! أنصح به بشدة 💜',
    'جودة ممتازة والسعر مناسب',
    'وصل بسرعة وبحالة ممتازة',
    'اللون جميل وثابت طوال اليوم',
    'بشرتي تحسنت كثيراً بعد الاستخدام',
    'أفضل منتج جربته هذا العام',
    'رائحة جميلة وتركيبة خفيفة',
    'سأعيد الشراء بالتأكيد',
  ];

  static late final List<ReviewModel> all = _generate();

  static List<ReviewModel> _generate() {
    final reviews = <ReviewModel>[];
    final products = MockProducts.all;
    for (var i = 0; i < 60; i++) {
      reviews.add(ReviewModel(
        id: 'review_$i',
        productId: products[i % products.length].id,
        userName: _names[i % _names.length],
        rating: 3.0 + (i % 3),
        comment: _comments[i % _comments.length],
        date: DateTime.now().subtract(Duration(days: i * 2)),
      ));
    }
    return reviews;
  }

  static List<ReviewModel> forProduct(String productId) =>
      all.where((r) => r.productId == productId).toList();
}
