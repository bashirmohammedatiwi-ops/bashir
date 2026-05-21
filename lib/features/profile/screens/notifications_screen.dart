import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../data/models/notification_model.dart';
import '../../wishlist/providers/wishlist_provider.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<NotificationModel>? _notifications;

  void _markAllRead() {
    final list = _notifications;
    if (list == null) return;
    setState(() {
      _notifications = list.map((n) => n.copyWith(isRead: true)).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final notificationsAsync = ref.watch(notificationsProvider);

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
      body: notificationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(
          child: TextButton(
            onPressed: () => ref.invalidate(notificationsProvider),
            child: const Text('إعادة المحاولة'),
          ),
        ),
        data: (items) {
          _notifications ??= List.from(items);
          final list = _notifications!;

          if (list.isEmpty) {
            return const Center(child: Text('لا توجد إشعارات'));
          }

          return ListView.builder(
            itemCount: list.length,
            itemBuilder: (context, index) {
              final n = list[index];
              return Dismissible(
                key: Key(n.id),
                direction: DismissDirection.endToStart,
                onDismissed: (_) {
                  setState(() => _notifications!.removeAt(index));
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
          );
        },
      ),
    );
  }
}
