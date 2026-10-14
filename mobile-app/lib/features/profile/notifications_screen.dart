import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/navigation/notification_navigation.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/notification.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import 'profile_providers.dart';
import 'widgets/account_strings.dart';
import 'widgets/account_theme.dart';
import 'widgets/profile_ui.dart';
import '../../features/worlds/world_theme.dart';

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
          action: ProfilePrimaryButton(
            label: s.login,
            onPressed: () => context.push('/login'),
          ),
        ),
      );
    }

    final async = ref.watch(notificationsProvider);
    final unread = ref.watch(unreadNotificationsCountProvider);

    return ProfileScaffold(
      title: s.notifications,
      body: async.when(
        loading: () => Center(
          child: CircularProgressIndicator(color: context.worldTheme.accent),
        ),
        error: (e, _) => ErrorView(
          message: friendlyError(e),
          onRetry: () => ref.invalidate(notificationsProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return RefreshIndicator(
              color: context.worldTheme.accent,
              onRefresh: () async => ref.invalidate(notificationsProvider),
              child: ProfileEmptyState(
                icon: Icons.notifications_none_rounded,
                title: s.noNotifications,
                subtitle: s.notificationsEmptySubtitle,
              ),
            );
          }
          return RefreshIndicator(
            color: context.worldTheme.accent,
            onRefresh: () async => ref.invalidate(notificationsProvider),
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              slivers: [
                if (unread > 0)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(
                        ProfileUi.hPad,
                        16,
                        ProfileUi.hPad,
                        0,
                      ),
                      child: _UnreadSummary(
                        count: unread,
                        label: s.acctNewNotifications(unread),
                        actionLabel: s.markAllRead,
                        onMarkAll: () async {
                          await ref
                              .read(apiServiceProvider)
                              .markAllNotificationsRead();
                          ref.invalidate(notificationsProvider);
                        },
                      ),
                    ),
                  ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    ProfileUi.hPad,
                    16,
                    ProfileUi.hPad,
                    28,
                  ),
                  sliver: SliverList.separated(
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, i) =>
                        _NotificationCard(notification: list[i], s: s),
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

class _UnreadSummary extends StatelessWidget {
  final int count;
  final String label;
  final String actionLabel;
  final VoidCallback onMarkAll;

  const _UnreadSummary({
    required this.count,
    required this.label,
    required this.actionLabel,
    required this.onMarkAll,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(12, 8, 6, 8),
      decoration: BoxDecoration(
        color: t.accentLight,
        borderRadius: BorderRadius.circular(AppCorners.md),
        border: Border.all(color: t.accentSoft),
      ),
      child: Row(
        children: [
          CountBadge(count: count),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppText.label.copyWith(color: t.ink),
            ),
          ),
          TextButton(
            onPressed: () {
              HapticFeedback.selectionClick();
              onMarkAll();
            },
            style: TextButton.styleFrom(
              minimumSize: const Size(0, kMinTapTarget),
              padding: const EdgeInsets.symmetric(horizontal: 10),
              shape: const StadiumBorder(),
            ),
            child: Text(
              actionLabel,
              style: AppText.label.copyWith(color: t.accentDark),
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationCard extends ConsumerWidget {
  final AppNotification notification;
  final AppStrings s;
  const _NotificationCard({required this.notification, required this.s});

  IconData get _icon => switch (notification.type.toUpperCase()) {
    'OFFER' || 'PROMO' => Icons.local_offer_rounded,
    'NEW_ARRIVAL' => Icons.auto_awesome_rounded,
    'REMINDER' => Icons.campaign_rounded,
    _ => Icons.notifications_active_rounded,
  };

  String get _typeLabel => switch (notification.type.toUpperCase()) {
    'OFFER' || 'PROMO' => s.acctNotifOffer,
    'NEW_ARRIVAL' => s.acctNotifNew,
    'REMINDER' => s.acctNotifReminder,
    _ => s.acctNotifGeneral,
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
    final t = context.worldTheme;
    final imageUrl = notification.resolvedImageUrl;
    final hasImage = imageUrl != null && imageUrl.isNotEmpty;
    final linkHint = notification.linkHint;
    final unread = !notification.read;
    final radius = BorderRadius.circular(AppCorners.lg);

    return Semantics(
      button: true,
      label: unread ? s.acctUnread : null,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            _open(context, ref);
          },
          borderRadius: radius,
          child: Ink(
            decoration: BoxDecoration(
              color: unread ? t.accentLight : t.surface,
              borderRadius: radius,
              border: Border.all(
                color: unread
                    ? t.accent.withValues(alpha: 0.35)
                    : t.hairline.withValues(alpha: 0.7),
                width: unread ? 1.2 : 1,
              ),
              boxShadow: t.cardShadow,
            ),
            child: ClipRRect(
              borderRadius: radius,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (hasImage)
                    Stack(
                      children: [
                        CachedNetworkImage(
                          imageUrl: imageUrl,
                          height: 152,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          placeholder: (_, __) =>
                              Container(height: 152, color: t.accentLight),
                          errorWidget: (_, __, ___) => Container(
                            height: 152,
                            color: t.accentLight,
                            child: Icon(_icon, color: t.accentDark, size: 40),
                          ),
                        ),
                        PositionedDirectional(
                          top: 10,
                          start: 10,
                          child: _TypeChip(icon: _icon, label: _typeLabel),
                        ),
                      ],
                    ),
                  Padding(
                    padding: const EdgeInsetsDirectional.fromSTEB(
                      14,
                      14,
                      10,
                      12,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (!hasImage) ...[
                              AccountTheme.iconTile(context, _icon, size: 42),
                              const SizedBox(width: 12),
                            ],
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    notification.title,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppText.title3.copyWith(
                                      color: t.ink,
                                      fontWeight: unread
                                          ? FontWeight.w800
                                          : FontWeight.w600,
                                    ),
                                  ),
                                  if (notification.body.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      notification.body,
                                      maxLines: 4,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppText.bodySmall.copyWith(
                                        color: unread ? t.ink : t.inkSoft,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            if (unread)
                              Container(
                                width: 10,
                                height: 10,
                                margin: const EdgeInsetsDirectional.only(
                                  top: 6,
                                  start: 8,
                                  end: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: t.accent,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: t.surface,
                                    width: 1.5,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            if (linkHint != null)
                              Flexible(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: unread ? t.surface : t.accentLight,
                                    borderRadius: BorderRadius.circular(
                                      AppCorners.pill,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.open_in_new_rounded,
                                        size: 13,
                                        color: t.accentDark,
                                      ),
                                      const SizedBox(width: 5),
                                      Flexible(
                                        child: Text(
                                          linkHint,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: AppText.micro.copyWith(
                                            color: t.accentDark,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            const Spacer(),
                            const SizedBox(width: 8),
                            Text(
                              notification.timeLabel,
                              style: AppText.caption.copyWith(
                                color: t.inkMuted,
                              ),
                            ),
                            const SizedBox(width: 2),
                            Icon(
                              Icons.chevron_right_rounded,
                              size: 20,
                              color: t.inkMuted,
                            ),
                          ],
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
}

class _TypeChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _TypeChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: t.ink.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(AppCorners.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white),
          const SizedBox(width: 4),
          Text(label, style: AppText.micro.copyWith(color: Colors.white)),
        ],
      ),
    );
  }
}
