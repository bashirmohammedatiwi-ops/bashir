import '../models/notification_model.dart';

class NotificationRemoteMapper {
  static NotificationModel fromJson(Map<String, dynamic> json) {
    final typeStr = (json['type'] as String?)?.toUpperCase() ?? 'ORDER';
    final type = switch (typeStr) {
      'OFFER' => NotificationType.offer,
      'NEW_ARRIVAL' => NotificationType.newArrival,
      'REMINDER' => NotificationType.reminder,
      _ => NotificationType.order,
    };
    return NotificationModel(
      id: json['id'] as String,
      type: type,
      title: (json['title'] as String?) ?? '',
      body: (json['body'] as String?) ?? '',
      time: DateTime.tryParse(
            (json['time'] ?? json['createdAt'])?.toString() ?? '',
          ) ??
          DateTime.now(),
      isRead: json['isRead'] == true || json['readAt'] != null,
    );
  }
}
