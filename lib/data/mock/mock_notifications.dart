import '../models/notification_model.dart';

abstract final class MockNotifications {
  static final List<NotificationModel> all = List.generate(20, (i) {
    final type = NotificationType.values[i % 4];
    return NotificationModel(
      id: 'notif_$i',
      type: type,
      title: switch (type) {
        NotificationType.offer => 'عرض خاص لكِ! 🎉',
        NotificationType.order => 'تم شحن طلبكِ 📦',
        NotificationType.newArrival => 'منتجات جديدة ✨',
        NotificationType.reminder => 'نقاطكِ في انتظاركِ 💜',
      },
      body: switch (type) {
        NotificationType.offer => 'خصم ٢٠٪ على جميع منتجات المكياج',
        NotificationType.order => 'طلبكِ #HAY-${1000 + i} في الطريق إليكِ',
        NotificationType.newArrival => 'وصلت تشكيلة Huda Beauty الجديدة',
        NotificationType.reminder => 'لديكِ ١٢٠ نقطة يمكن استخدامها',
      },
      time: DateTime.now().subtract(Duration(hours: i * 3)),
      isRead: i > 5,
    );
  });
}
