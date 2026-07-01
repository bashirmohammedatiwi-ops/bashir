import '../../core/utils/json.dart';
import '../../core/utils/formatters.dart';

class AppNotification {
  final String id;
  final String type;
  final String title;
  final String body;
  final String? imageUrl;
  final String? linkType;
  final String? linkId;
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
        read: json['readAt'] != null,
        createdAt: parseDate(json['createdAt']),
      );

  String get timeLabel => formatDateTime(createdAt);
}
