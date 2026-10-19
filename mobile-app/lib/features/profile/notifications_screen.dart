import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/navigation/notification_navigation.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/responsive_app.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/notification.dart';
import '../auth/auth_provider.dart';
import 'profile_providers.dart';
import 'widgets/account_strings.dart';
import 'widgets/account_theme.dart';
import 'widgets/notification_permission_tile.dart';
import 'widgets/profile_ui.dart';
import '../../features/worlds/world_theme.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  Future<void> _refresh(WidgetRef ref) =>
      ref.refresh(notificationsProvider.future).then((_) {}, onError: (_) {});

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
      // نصوص للقراءة: تتبع تكبير الخط في النظام حتى 1.6.
      body: LargeTextScope(
        child: async.when(
          loading: () => Center(
            child: CircularProgressIndicator(color: context.worldTheme.accent),
          ),
          error: (e, _) => ErrorView.from(
            e,
            onRetry: () => ref.invalidate(notificationsProvider),
          ),
          data: (list) {
            if (list.isEmpty) {
              return RefreshIndicator(
                color: context.worldTheme.accent,
                onRefresh: () => _refresh(ref),
                child: ProfileEmptyState(
                  icon: Icons.notifications_none_rounded,
                  title: s.noNotifications,
                  subtitle: s.notificationsEmptySubtitle,
                  action: ProfilePrimaryButton(
                    label: s.acctBrowseOffers,
                    onPressed: () => openOffersTab(
                      context,
                      ProviderScope.containerOf(context, listen: false),
                    ),
                  ),
                ),
              );
            }
            return RefreshIndicator(
              color: context.worldTheme.accent,
              onRefresh: () => _refresh(ref),
              child: _NotificationsList(list: list, unread: unread),
            );
          },
        ),
      ),
    );
  }
}

/// القائمة مع الصفحات التالية: تُطلب تلقائياً قرب آخر عنصر، وإن فشل الطلب (بلا
/// اتصال) يظهر زر «عرض المزيد» بدل مؤشر يدور بلا نهاية أو محاولات متكررة.
class _NotificationsList extends ConsumerStatefulWidget {
  final List<AppNotification> list;
  final int unread;

  const _NotificationsList({required this.list, required this.unread});

  @override
  ConsumerState<_NotificationsList> createState() => _NotificationsListState();
}

class _NotificationsListState extends ConsumerState<_NotificationsList> {
  bool _loadingMore = false;
  bool _loadFailed = false;

  @override
  void didUpdateWidget(covariant _NotificationsList old) {
    super.didUpdateWidget(old);
    // سحب للتحديث أعاد الصفحة الأولى: محاولة تلقائية جديدة مسموحة.
    if (widget.list.length < old.list.length) _loadFailed = false;
  }

  void _autoLoad() {
    if (_loadingMore || _loadFailed) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _loadMore();
    });
  }

  Future<void> _loadMore() async {
    final notifier = ref.read(notificationsProvider.notifier);
    if (_loadingMore || !notifier.hasMore) return;
    final before = widget.list.length;
    setState(() {
      _loadingMore = true;
      _loadFailed = false;
    });
    await notifier.loadMore();
    if (!mounted) return;
    final after = ref.read(notificationsProvider).valueOrNull?.length ?? before;
    setState(() {
      _loadingMore = false;
      // لم يصل شيء والمزيد ما زال موجوداً: فشل — ننتظر ضغطة الزر.
      _loadFailed = notifier.hasMore && after <= before;
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final t = context.worldTheme;
    final list = widget.list;
    final unread = widget.unread;
    final hasMore = ref.read(notificationsProvider.notifier).hasMore;

    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(),
      ),
      slivers: [
        // الإشعارات مرفوضة على الجهاز: دعوة لتفعيلها فوق القائمة.
        // (البطاقة تضيف مسافتها السفلية بنفسها حين تظهر.)
        const SliverPadding(
          padding: EdgeInsets.fromLTRB(ProfileUi.hPad, 16, ProfileUi.hPad, 0),
          sliver: SliverToBoxAdapter(
            child: NotificationPermissionTile(standalone: true),
          ),
        ),
        if (unread > 0)
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: ProfileUi.hPad),
            sliver: SliverToBoxAdapter(
              child: _UnreadSummary(
                count: unread,
                label: s.acctNewNotifications(unread),
                actionLabel: s.markAllRead,
                // فوراً على الجهاز، والسيرفر في الخلفية.
                onMarkAll: () =>
                    ref.read(notificationsProvider.notifier).markAllRead(),
              ),
            ),
          ),
        SliverPadding(
          padding: EdgeInsets.fromLTRB(
            ProfileUi.hPad,
            unread > 0 ? 14 : 0,
            ProfileUi.hPad,
            hasMore ? 12 : 28,
          ),
          sliver: SliverList.separated(
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) {
              // قرب آخر القائمة: الصفحة التالية مسبقاً.
              if (hasMore && i >= list.length - 3) _autoLoad();
              return _NotificationCard(
                key: ValueKey(list[i].id),
                notification: list[i],
                s: s,
              );
            },
          ),
        ),
        if (hasMore)
          SliverPadding(
            padding: const EdgeInsets.only(bottom: 28),
            sliver: SliverToBoxAdapter(
              child: SizedBox(
                height: kMinTapTarget,
                child: Center(
                  child: _loadingMore
                      ? SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.4,
                            color: t.accent,
                          ),
                        )
                      : TextButton.icon(
                          onPressed: () {
                            HapticFeedback.selectionClick();
                            _loadMore();
                          },
                          style: TextButton.styleFrom(
                            minimumSize: const Size(0, kMinTapTarget),
                            foregroundColor: t.accentDark,
                            shape: const StadiumBorder(),
                          ),
                          icon: const Icon(Icons.expand_more_rounded, size: 20),
                          label: Text(
                            s.acctShowMore,
                            style: AppText.label.copyWith(color: t.accentDark),
                          ),
                        ),
                ),
              ),
            ),
          ),
      ],
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

class _NotificationCard extends ConsumerStatefulWidget {
  final AppNotification notification;
  final AppStrings s;
  const _NotificationCard({
    super.key,
    required this.notification,
    required this.s,
  });

  @override
  ConsumerState<_NotificationCard> createState() => _NotificationCardState();
}

class _NotificationCardState extends ConsumerState<_NotificationCard> {
  static const _collapsedLines = 4;

  /// إشعار بلا رابط: اللمسة تفتح نصه كاملاً بدل أن لا تفعل شيئاً.
  bool _expanded = false;

  AppNotification get notification => widget.notification;
  AppStrings get s => widget.s;

  /// تنبيهات التوفّر وانخفاض السعر تصل «تذكيراً» برابط منتج — نميّزها بشكلها.
  bool get _isProductAlert =>
      notification.type.toUpperCase() == 'REMINDER' &&
      (notification.linkType ?? '').toUpperCase() == 'PRODUCT';

  IconData get _icon {
    if (_isProductAlert) return Icons.notifications_active_outlined;
    return switch (notification.type.toUpperCase()) {
      'OFFER' || 'PROMO' => Icons.local_offer_rounded,
      'NEW_ARRIVAL' => Icons.auto_awesome_rounded,
      'REMINDER' => Icons.campaign_rounded,
      _ => Icons.notifications_rounded,
    };
  }

  String get _typeLabel {
    if (_isProductAlert) return s.acctNotifProductAlert;
    return switch (notification.type.toUpperCase()) {
      'OFFER' || 'PROMO' => s.acctNotifOffer,
      'NEW_ARRIVAL' => s.acctNotifNew,
      'REMINDER' => s.acctNotifReminder,
      _ => s.acctNotifGeneral,
    };
  }

  void _onTap(bool hasLink) {
    HapticFeedback.selectionClick();
    // الوجهة أولاً بلا انتظار، ثم «مقروء» فوراً على الجهاز والسيرفر في الخلفية.
    if (hasLink) {
      openNotificationLink(context, notification);
    } else {
      setState(() => _expanded = !_expanded);
    }
    if (!notification.read) {
      ref.read(notificationsProvider.notifier).markRead(notification.id);
    }
  }

  /// هل يتجاوز النص الأسطر المطوية؟ (لإظهار «عرض المزيد» فقط حين يلزم)
  bool _bodyOverflows(BoxConstraints c, TextStyle style) {
    final painter = TextPainter(
      text: TextSpan(text: notification.body, style: style),
      maxLines: _collapsedLines,
      textDirection: Directionality.of(context),
      textScaler: MediaQuery.textScalerOf(context),
    )..layout(maxWidth: c.maxWidth);
    final overflows = painter.didExceedMaxLines;
    painter.dispose();
    return overflows;
  }

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final imageUrl = notification.resolvedImageUrl;
    final hasImage = imageUrl != null && imageUrl.isNotEmpty;
    final linkHint = notification.linkHintFor(s);
    final hasLink = linkHint != null;
    final unread = !notification.read;
    final radius = BorderRadius.circular(AppCorners.lg);
    final bodyStyle = AppText.bodySmall.copyWith(
      color: unread ? t.ink : t.inkSoft,
    );

    return Semantics(
      button: true,
      label: unread ? s.acctUnread : null,
      child: DecoratedBox(
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
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => _onTap(hasLink),
            borderRadius: radius,
            child: ClipRRect(
              borderRadius: radius,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (hasImage)
                    Stack(
                      children: [
                        // يُفكّ بعرض البطاقة فقط (لا بحجم الصورة الأصلي).
                        AppNetworkImage(
                          url: imageUrl,
                          height: 152,
                          fit: BoxFit.cover,
                          placeholderColor: t.accentLight,
                          fallbackColor: t.accentLight,
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
                                    LayoutBuilder(
                                      builder: (context, c) {
                                        final canExpand =
                                            !hasLink &&
                                            _bodyOverflows(c, bodyStyle);
                                        return Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            AnimatedSize(
                                              duration:
                                                  MediaQuery.disableAnimationsOf(
                                                    context,
                                                  )
                                                  ? Duration.zero
                                                  : const Duration(
                                                      milliseconds: 220,
                                                    ),
                                              curve: Curves.easeOutCubic,
                                              alignment:
                                                  AlignmentDirectional.topStart,
                                              child: Text(
                                                notification.body,
                                                maxLines: _expanded
                                                    ? null
                                                    : _collapsedLines,
                                                overflow: _expanded
                                                    ? TextOverflow.visible
                                                    : TextOverflow.ellipsis,
                                                style: bodyStyle,
                                              ),
                                            ),
                                            if (canExpand) ...[
                                              const SizedBox(height: 4),
                                              Text(
                                                _expanded
                                                    ? s.acctShowLess
                                                    : s.acctShowMore,
                                                style: AppText.label.copyWith(
                                                  color: t.accentDark,
                                                ),
                                              ),
                                            ],
                                          ],
                                        );
                                      },
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
                              notification.timeLabelFor(s.lang),
                              style: AppText.caption.copyWith(
                                color: t.inkMuted,
                              ),
                            ),
                            // السهم فقط حين تفتح اللمسة شيئاً فعلاً.
                            if (hasLink) ...[
                              const SizedBox(width: 2),
                              Icon(
                                Icons.chevron_right_rounded,
                                size: 20,
                                color: t.inkMuted,
                              ),
                            ],
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
