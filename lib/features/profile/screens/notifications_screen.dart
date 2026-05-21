import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../data/mock/mock_notifications.dart';
import '../../../data/models/notification_model.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late List<NotificationModel> _notifications;

  @override
  void initState() {
    super.initState();
    _notifications = List.from(MockNotifications.all);
  }

  void _markAllRead() {
    setState(() {
      _notifications =
          _notifications.map((n) => n.copyWith(isRead: true)).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الإشعارات'),
        actions: [
          TextButton(
            onPressed: _markAllRead,
            child: const Text('قراءة الكل'),
          ),
        ],
      ),
      body: ListView.builder(
        itemCount: _notifications.length,
        itemBuilder: (context, index) {
          final n = _notifications[index];
          return Dismissible(
            key: Key(n.id),
            direction: DismissDirection.endToStart,
            onDismissed: (_) {
              setState(() => _notifications.removeAt(index));
            },
            child: Container(
              color: n.isRead ? null : AppColors.accent,
              child: ListTile(
                leading: Text(n.emoji, style: const TextStyle(fontSize: 28)),
                title: Text(n.title, style: AppTextStyles.title(size: 14)),
                subtitle: Text(n.body, style: AppTextStyles.caption()),
                trailing: Text(
                  DateFormatter.chatTime(n.time),
                  style: AppTextStyles.caption(size: 10),
                ),
              ),
            ),
          ).animate().fadeIn(
                delay: Duration(milliseconds: index * 40),
              );
        },
      ),
    );
  }
}
