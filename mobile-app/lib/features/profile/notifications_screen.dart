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
    final unread = ref.watch(unreadNotificationsCountProvider);

    return ProfileScaffold(
      title: s.notifications,
      actions: [
        if (unread > 0)
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
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
              slivers: [
                if (unread > 0)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(ProfileUi.hPad, 12, ProfileUi.hPad, 4),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              CartTheme.brand.withValues(alpha: 0.12),
                              CartTheme.brand.withValues(alpha: 0.04),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: CartTheme.brand.withValues(alpha: 0.18)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 34,
                              height: 34,
                              decoration: BoxDecoration(
                                color: CartTheme.brand,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Center(
                                child: Text(
                                  '$unread',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                unread == 1 ? 'إشعار جديد' : '$unread إشعارات جديدة',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 14,
                                  color: CartTheme.charcoal,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(ProfileUi.hPad, 8, ProfileUi.hPad, 28),
                  sliver: SliverList.separated(
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 14),
                    itemBuilder: (_, i) => _NotificationCard(notification: list[i]),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _NotificationCard extends ConsumerWidget {
  final AppNotification notification;
  const _NotificationCard({required this.notification});

  Color get _accent => switch (notification.type.toUpperCase()) {
        'OFFER' || 'PROMO' => const Color(0xFFE91E8C),
        'NEW_ARRIVAL' => const Color(0xFF7C3AED),
        'REMINDER' => const Color(0xFFF59E0B),
        _ => CartTheme.brand,
      };

  IconData get _icon => switch (notification.type.toUpperCase()) {
        'OFFER' || 'PROMO' => Icons.local_offer_rounded,
        'NEW_ARRIVAL' => Icons.auto_awesome_rounded,
        'REMINDER' => Icons.campaign_rounded,
        _ => Icons.notifications_active_rounded,
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
    final unread = !notification.read;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _open(context, ref),
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: unread ? _accent.withValues(alpha: 0.35) : ProfileUi.fieldBorder,
              width: unread ? 1.2 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: unread ? _accent.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.04),
                blurRadius: unread ? 18 : 10,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(19),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(width: 4, color: unread ? _accent : Colors.transparent),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (imageUrl != null && imageUrl.isNotEmpty)
                          Stack(
                            children: [
                              CachedNetworkImage(
                                imageUrl: imageUrl,
                                height: 152,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                errorWidget: (_, __, ___) => Container(
                                  height: 152,
                                  color: CartTheme.brandWash,
                                  child: Icon(_icon, color: _accent, size: 40),
                                ),
                              ),
                              Positioned(
                                top: 10,
                                right: 10,
                                child: _TypeChip(icon: _icon, label: _typeLabel, color: _accent),
                              ),
                            ],
                          ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (imageUrl == null || imageUrl.isEmpty) ...[
                                    Container(
                                      width: 42,
                                      height: 42,
                                      decoration: BoxDecoration(
                                        color: _accent.withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(_icon, color: _accent, size: 22),
                                    ),
                                    const SizedBox(width: 12),
                                  ],
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          notification.title,
                                          style: TextStyle(
                                            fontWeight: unread ? FontWeight.w900 : FontWeight.w700,
                                            fontSize: 16,
                                            height: 1.25,
                                            color: CartTheme.charcoal,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          notification.body,
                                          style: TextStyle(
                                            color: CartTheme.charcoal.withValues(alpha: 0.68),
                                            fontSize: 13.5,
                                            height: 1.45,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (unread)
                                    Container(
                                      width: 9,
                                      height: 9,
                                      margin: const EdgeInsets.only(top: 6, left: 4),
                                      decoration: BoxDecoration(color: _accent, shape: BoxShape.circle),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  if (linkHint != null)
                                    Expanded(
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: _accent.withValues(alpha: 0.08),
                                          borderRadius: BorderRadius.circular(999),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.open_in_new_rounded, size: 13, color: _accent),
                                            const SizedBox(width: 5),
                                            Flexible(
                                              child: Text(
                                                linkHint,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: TextStyle(
                                                  color: _accent,
                                                  fontSize: 11.5,
                                                  fontWeight: FontWeight.w700,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    )
                                  else
                                    const Spacer(),
                                  const SizedBox(width: 8),
                                  Text(
                                    notification.timeLabel,
                                    style: TextStyle(
                                      color: CartTheme.charcoal.withValues(alpha: 0.38),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Icon(
                                    Icons.chevron_left_rounded,
                                    size: 20,
                                    color: CartTheme.charcoal.withValues(alpha: 0.28),
                                  ),
                                ],
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
        ),
      ),
    );
  }

  String get _typeLabel => switch (notification.type.toUpperCase()) {
        'OFFER' || 'PROMO' => 'عرض',
        'NEW_ARRIVAL' => 'جديد',
        'REMINDER' => 'تذكير',
        _ => 'إشعار',
      };
}

class _TypeChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _TypeChip({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}
