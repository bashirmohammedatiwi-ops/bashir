import '../../core/l10n/locale_provider.dart';
import '../../core/utils/json.dart';
import '../../core/utils/formatters.dart';

class Review {
  final String id;
  final String userName;
  final double rating;
  final String comment;
  final DateTime? createdAt;

  /// اشترت المنتج فعلاً (طلب مُسلَّم) — شارة «مشترية موثّقة». السيرفر القديم لا يرسله.
  final bool verified;

  /// اسم بديل حين لا يرسل السيرفر اسم المقيّمة.
  static const anonymousName = 'مستخدم';

  /// البديل الذي يضعه السيرفر لحساب بلا اسم.
  static const _serverAnonymous = 'زبونة';

  const Review({
    required this.id,
    required this.userName,
    this.rating = 0,
    this.comment = '',
    this.createdAt,
    this.verified = false,
  });

  factory Review.fromJson(Map<String, dynamic> json) => Review(
        id: asString(json['id']),
        userName: asString(json['userName'], anonymousName),
        rating: asDouble(json['rating']),
        comment: asString(json['comment']),
        createdAt: parseDate(json['createdAt']),
        verified: asBool(json['verified']),
      );

  /// «14 أكتوبر» بلغة التطبيق الحالية — والأفضل في الواجهة [dateLabelFor] مع `s.lang`.
  String get dateLabel => dateLabelFor(AppLocale.current);

  /// تاريخ التقييم بلغة الواجهة: «October 14» / «Yesterday».
  String dateLabelFor(String lang) => formatDate(createdAt, lang: lang);

  /// اسم المقيّمة بلغة الواجهة — البديل «مستخدم» يصبح «Customer» بالإنجليزي.
  String userNameFor(String lang) =>
      lang != 'ar' && (userName == anonymousName || userName == _serverAnonymous) ? 'Customer' : userName;
}
