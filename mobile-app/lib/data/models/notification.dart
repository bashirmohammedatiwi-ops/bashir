import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/utils/json.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/media_url.dart';

class AppNotification {
  final String id;
  final String type;
  final String title;
  final String body;
  final String? imageUrl;
  final String? linkType;
  final String? linkId;
  final String? linkSlug;
  final String? linkLabel;
  final String? externalUrl;
  final bool read;
  final DateTime? createdAt;

  const AppNotification({
    required this.id,
    this.type = 'ORDER',
    this.title = '',
    this.body = '',
    this.imageUrl,
    this.linkType,
    this.linkId,
    this.linkSlug,
    this.linkLabel,
    this.externalUrl,
    this.read = false,
    this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: asString(json['id']),
        type: asString(json['type'], 'ORDER'),
        title: asString(json['title']),
        body: asString(json['body']),
        imageUrl: json['imageUrl']?.toString(),
        linkType: json['linkType']?.toString(),
        linkId: json['linkId']?.toString(),
        linkSlug: json['linkSlug']?.toString(),
        linkLabel: json['linkLabel']?.toString(),
        externalUrl: json['externalUrl']?.toString(),
        read: json['isRead'] == true || json['readAt'] != null,
        createdAt: parseDate(json['createdAt']),
      );

  /// «اليوم • 3:20 م» بلغة التطبيق الحالية — والأفضل في الواجهة [timeLabelFor] مع `s.lang`.
  String get timeLabel => timeLabelFor(AppLocale.current);

  /// وقت الإشعار بلغة الواجهة: «Today • 3:20 PM».
  String timeLabelFor(String lang) => formatDateTime(createdAt, lang: lang);

  String? get resolvedImageUrl => resolveMediaUrl(imageUrl);

  /// شارة الرابط بلغة التطبيق الحالية — والأفضل في الواجهة [linkHintFor] مع `ref.s`.
  String? get linkHint => linkHintFor(AppStrings(AppLocale.current));

  /// شارة الرابط بلغة الواجهة («منتج» / «Product»)، أو null إن لم يكن للإشعار رابط.
  String? linkHintFor(AppStrings s) => s.notificationLinkHint(this);
}
