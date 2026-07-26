import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/navigation/notification_navigation.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/states.dart';
import '../../data/models/notification.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../cart/widgets/cart_theme.dart';
import 'profile_providers.dart';
import 'widgets/account_theme.dart';
import 'widgets/profile_ui.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final s = ref.s;
    if (!auth.isAuthenticated) {
      return ProfileScaffold(
        title: s.notifications,
        body: ProfileEmptyState(
          icon: Icons.notifications_off_outlined,
          title: s.loginToViewNotifications,
          action: ProfilePrimaryButton(label: s.login, onPressed: () => context.push('/login')),
        ),
      );
    }

    final async = ref.watch(notificationsProvider);
    return ProfileScaffold(
      title: s.notifications,
      actions: [
        IconButton(
          tooltip: s.markAllRead,
          onPressed: () async {
            await ref.read(apiServiceProvider).markAllNotificationsRead();
            ref.invalidate(notificationsProvider);
          },
          icon: const Icon(Icons.done_all_rounded, color: CartTheme.brand),
        ),
      ],
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator(color: CartTheme.brand)),
        error: (e, _) => ErrorView(
          message: friendlyError(e),
          onRetry: () => ref.invalidate(notificationsProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return ProfileEmptyState(
              icon: Icons.notifications_none_rounded,
              title: s.noNotifications,
              subtitle: s.notificationsEmptySubtitle,
            );
          }
          return RefreshIndicator(
            color: CartTheme.brand,
            onRefresh: () async => ref.invalidate(notificationsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(ProfileUi.hPad, 16, ProfileUi.hPad, 24),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
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

  IconData get _icon => switch (notification.type.toUpperCase()) {
        'ORDER' => Icons.receipt_long_rounded,
        'OFFER' || 'PROMO' => Icons.local_offer_rounded,
        'LOYALTY' => Icons.stars_rounded,
        _ => Icons.notifications_rounded,
      };

  Future<void> _open(BuildContext context, WidgetRef ref) async {
    if (!notification.read) {
      await ref.read(apiServiceProvider).markNotificationRead(notification.id);
      ref.invalidate(notificationsProvider);
    }
    if (context.mounted) openNotificationLink(context, notification);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Material(
      color: notification.read ? Colors.white : CartTheme.brandWash,
      borderRadius: BorderRadius.circular(ProfileUi.cardRadius),
      child: InkWell(
        onTap: () => _open(context, ref),
        borderRadius: BorderRadius.circular(ProfileUi.cardRadius),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(ProfileUi.cardRadius),
            border: Border.all(
              color: notification.read ? ProfileUi.fieldBorder : CartTheme.brand.withValues(alpha: 0.25),
            ),
            boxShadow: notification.read ? null : CartTheme.softShadow,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AccountTheme.notifications.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(_icon, color: AccountTheme.notifications, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notification.title,
                      style: TextStyle(
                        fontWeight: notification.read ? FontWeight.w600 : FontWeight.w800,
                        fontSize: 14,
                        color: CartTheme.charcoal,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(notification.body, style: ProfileUi.captionStyle()),
                    const SizedBox(height: 4),
                    Text(
                      notification.timeLabel,
                      style: TextStyle(
                        color: CartTheme.charcoal.withValues(alpha: 0.35),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              if (!notification.read)
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 6),
                  decoration: const BoxDecoration(color: CartTheme.brand, shape: BoxShape.circle),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
