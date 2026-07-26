import 'package:cached_network_image/cached_network_image.dart';
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
              separatorBuilder: (_, __) => const SizedBox(height: 12),
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
        'NEW_ARRIVAL' => Icons.new_releases_rounded,
        'RESTOCK' => Icons.inventory_2_rounded,
        'LOW_STOCK' => Icons.warning_amber_rounded,
        'REMINDER' => Icons.alarm_rounded,
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
    final imageUrl = notification.resolvedImageUrl;
    final linkHint = notification.linkHint;

    return Material(
      color: notification.read ? Colors.white : CartTheme.brandWash,
      borderRadius: BorderRadius.circular(ProfileUi.cardRadius),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _open(context, ref),
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(
              color: notification.read ? ProfileUi.fieldBorder : CartTheme.brand.withValues(alpha: 0.25),
            ),
            boxShadow: notification.read ? null : CartTheme.softShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (imageUrl != null && imageUrl.isNotEmpty)
                CachedNetworkImage(
                  imageUrl: imageUrl,
                  height: 140,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Container(
                    height: 140,
                    color: CartTheme.brandWash,
                    child: Icon(_icon, color: CartTheme.brand, size: 36),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (imageUrl == null || imageUrl.isEmpty)
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AccountTheme.notifications.withValues(alpha: 0.14),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(_icon, color: AccountTheme.notifications, size: 22),
                      ),
                    if (imageUrl == null || imageUrl.isEmpty) const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  notification.title,
                                  style: TextStyle(
                                    fontWeight: notification.read ? FontWeight.w600 : FontWeight.w800,
                                    fontSize: 15,
                                    color: CartTheme.charcoal,
                                  ),
                                ),
                              ),
                              if (!notification.read)
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(color: CartTheme.brand, shape: BoxShape.circle),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(notification.body, style: ProfileUi.captionStyle()),
                          if (linkHint != null) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: CartTheme.brand.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.link_rounded, size: 12, color: CartTheme.brand),
                                  const SizedBox(width: 4),
                                  Flexible(
                                    child: Text(
                                      linkHint,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: CartTheme.brand,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          const SizedBox(height: 6),
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
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
