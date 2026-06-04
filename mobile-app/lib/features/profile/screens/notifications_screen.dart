import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/providers/catalog_providers.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/date_formatter.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('الإشعارات'),
      ),
      body: notificationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('تعذر تحميل الإشعارات')),
        data: (notifications) {
          if (notifications.isEmpty) {
            return const Center(child: Text('لا توجد إشعارات'));
          }
          return ListView.builder(
            itemCount: notifications.length,
            itemBuilder: (context, index) {
              final n = notifications[index];
              return Container(
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
              ).animate().fadeIn(delay: (40 * index).ms);
            },
          );
        },
      ),
    );
  }
}
