enum NotificationType { offer, order, newArrival, reminder }

class NotificationModel {
  const NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.time,
    this.isRead = false,
  });

  final String id;
  final NotificationType type;
  final String title;
  final String body;
  final DateTime time;
  final bool isRead;

  String get emoji => switch (type) {
        NotificationType.offer => '🎉',
        NotificationType.order => '📦',
        NotificationType.newArrival => '✨',
        NotificationType.reminder => '💜',
      };

  NotificationModel copyWith({bool? isRead}) => NotificationModel(
        id: id,
        type: type,
        title: title,
        body: body,
        time: time,
        isRead: isRead ?? this.isRead,
      );
}
