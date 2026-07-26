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

  String get timeLabel => formatDateTime(createdAt);

  String? get resolvedImageUrl => resolveMediaUrl(imageUrl);

  String? get linkHint {
    final type = (linkType ?? '').toUpperCase();
    if (type == 'NONE' || type.isEmpty) return null;
    final label = linkLabel?.trim();
    if (label != null && label.isNotEmpty) return label;
    if (type == 'OFFERS') return 'العروض';
    if (type == 'PRODUCT') return 'منتج';
    if (type == 'CATEGORY') return 'فئة';
    if (type == 'BRAND') return 'براند';
    if (type == 'PACKAGE') return 'باقة';
    if (type == 'ORDER') return 'طلب';
    if (type == 'EXTERNAL_URL') return 'رابط خارجي';
    return null;
  }
}
