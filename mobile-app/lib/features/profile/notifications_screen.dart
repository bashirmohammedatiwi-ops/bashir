import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/states.dart';
import '../../data/models/notification.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import 'profile_providers.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('الإشعارات')),
        body: EmptyState(
          icon: Icons.notifications_off_outlined,
          title: 'سجّل الدخول لعرض الإشعارات',
          action: ElevatedButton(
            onPressed: () => context.push('/login'),
            child: const Text('تسجيل الدخول'),
          ),
        ),
      );
    }

    final async = ref.watch(notificationsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('الإشعارات'),
        actions: [
          IconButton(
            tooltip: 'تعليم الكل كمقروء',
            onPressed: () async {
              await ref.read(apiServiceProvider).markAllNotificationsRead();
              ref.invalidate(notificationsProvider);
            },
            icon: const Icon(Icons.done_all_rounded),
          ),
        ],
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) =>
            ErrorView(message: e.toString(), onRetry: () => ref.invalidate(notificationsProvider)),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(
                icon: Icons.notifications_none_rounded, title: 'لا توجد إشعارات');
          }
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.invalidate(notificationsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => _NotificationTile(notification: list[i]),
            ),
          );
        },
      ),
    );
  }
}

class _NotificationTile extends ConsumerWidget {
  final AppNotification notification;
  const _NotificationTile({required this.notification});

  IconData get _icon => switch (notification.type) {
        'ORDER' => Icons.receipt_long_rounded,
        'PROMO' => Icons.local_offer_rounded,
        'LOYALTY' => Icons.stars_rounded,
        _ => Icons.notifications_rounded,
      };

  Future<void> _open(BuildContext context, WidgetRef ref) async {
    if (!notification.read) {
      await ref.read(apiServiceProvider).markNotificationRead(notification.id);
      ref.invalidate(notificationsProvider);
    }
    final linkType = notification.linkType?.toUpperCase();
    final linkId = notification.linkId;
    if (linkId == null || linkId.isEmpty) return;

    switch (linkType) {
      case 'ORDER':
        if (context.mounted) context.push('/orders/$linkId');
      case 'PRODUCT':
        if (context.mounted) context.push('/product/$linkId');
      case 'CATEGORY':
        if (context.mounted) {
          context.push('/products?categoryId=$linkId&title=التصنيف');
        }
      case 'BRAND':
        if (context.mounted) {
          context.push('/products?brandId=$linkId&title=العلامة');
        }
      case 'PROMO':
        if (context.mounted) context.push('/products?isPromo=1&title=العروض');
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Material(
      color: notification.read ? AppColors.surface : AppColors.primaryLight,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () => _open(context, ref),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                child: Icon(_icon, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(notification.title,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                    const SizedBox(height: 2),
                    Text(notification.body,
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
                    const SizedBox(height: 4),
                    Text(notification.timeLabel,
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  ],
                ),
              ),
              if (!notification.read)
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 4),
                  decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
