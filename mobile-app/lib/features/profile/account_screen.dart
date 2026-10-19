import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/providers/app_info_provider.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/phone_util.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/product_card.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/beauty.dart';
import '../../data/models/order.dart';
import '../alerts/restock_watch_provider.dart';
import '../auth/auth_provider.dart';
import '../beauty/beauty_providers.dart';
import '../catalog/catalog_providers.dart';
import '../orders/widgets/order_status.dart';
import '../payments/pay_now_card.dart';
import '../settings/legal_document_screen.dart';
import '../shell/main_shell.dart';
import '../shell/nav_tabs.dart';
import '../wishlist/wishlist_provider.dart';
import '../worlds/world_theme.dart';
import 'profile_providers.dart';
import 'widgets/account_strings.dart';
import 'widgets/account_theme.dart';
import 'widgets/notification_permission_tile.dart';
import 'widgets/profile_ui.dart';
import 'widgets/support_contact_section.dart';

class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key});

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  /// أقل فاصل بين تحديثين صامتين عند فتح التبويب — لا طلبات مع كل لمسة.
  static const _silentRefreshGap = Duration(seconds: 60);

  DateTime? _lastRefresh;
  bool _deleting = false;

  /// سحب للتحديث: الطلبات والإشعارات و«اطلبيها مرة ثانية» وبيانات الحساب معاً؛
  /// فشل أيّها لا يوقف البقية.
  Future<void> _refresh() async {
    if (!ref.read(authProvider).isAuthenticated) return;
    _lastRefresh = DateTime.now();
    await Future.wait<void>(
      [
        ref.refresh(ordersProvider.future),
        ref.refresh(notificationsProvider.future),
        ref.refresh(buyAgainProvider.future),
        ref.read(authProvider.notifier).refreshUser(),
        ref.read(restockWatchProvider.notifier).load(),
      ].map((f) => f.then<void>((_) {}, onError: (_) {})),
    );
  }

  /// التبويب يبقى حياً في الـ shell فلا يُعاد بناؤه: نجدّد حالة الطلب والنقاط
  /// بصمت عند العودة إليه، مرة كل دقيقة على الأكثر.
  void _silentRefresh() {
    final last = _lastRefresh;
    final recent = last != null && DateTime.now().difference(last) < _silentRefreshGap;
    if (!recent) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<int>(navIndexProvider, (prev, next) {
      if (next == NavTabs.account && prev != NavTabs.account) _silentRefresh();
    });

    final auth = ref.watch(authProvider);
    final s = ref.watch(stringsProvider);
    final version = ref.watch(appVersionLabelProvider);
    final top = MediaQuery.paddingOf(context).top;
    final bottomPad = Responsive.shellBottomReserve(context) + 16;
    final unread = ref.watch(unreadNotificationsCountProvider);

    final children = auth.isAuthenticated
        ? _memberSections(context, s)
        : _guestSections(context, s);

    return Scaffold(
      backgroundColor: context.worldTheme.canvas,
      body: RefreshIndicator(
        color: context.worldTheme.accent,
        edgeOffset: top,
        notificationPredicate: (n) => auth.isAuthenticated && n.depth == 0,
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(
            ProfileUi.hPad,
            top + 8,
            ProfileUi.hPad,
            bottomPad,
          ),
          children: [
            _AccountTopBar(
              title: s.myAccount,
              showBell: auth.isAuthenticated,
              unread: unread,
              bellTooltip: s.notifications,
              onBell: () => context.push('/notifications'),
            ),
            const SizedBox(height: 14),
            ...children,
            const SizedBox(height: 20),
            Center(
              child: Text(
                '${AppConfig.displayStoreName(s.lang)} • ${s.version} $version',
                textAlign: TextAlign.center,
                style: ProfileUi.captionStyle(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _memberSections(BuildContext context, AppStrings s) {
    final user = ref.watch(authProvider).user;
    // المفضلة المحمّلة هي المرجع (حتى لو صارت فارغة)؛ رقم الحساب قبل تحميلها فقط.
    final wishlist = ref.watch(
      wishlistProvider.select((w) => (w.loaded, w.ids.length)),
    );
    final unread = ref.watch(unreadNotificationsCountProvider);
    final watches = ref.watch(restockWatchProvider.select((w) => w.length));
    final orders = user?.orderCount ?? 0;
    final points = user?.points ?? 0;
    final saved = wishlist.$1 ? wishlist.$2 : (user?.wishlistCount ?? 0);

    return [
      _ProfileHero(s: s),
      const _ActiveOrderCard(),
      const SizedBox(height: 16),
      _QuickActionsGrid(
        items: [
          _QuickAction(
            icon: Icons.receipt_long_outlined,
            title: s.myOrders,
            caption: orders > 0 ? s.acctOrdersCount(orders) : s.acctOrdersHint,
            onTap: () => context.push('/orders'),
          ),
          _QuickAction(
            icon: Icons.favorite_border_rounded,
            title: s.wishlist,
            caption: saved > 0 ? s.acctItemsCount(saved) : s.acctWishlistHint,
            onTap: () => context.push('/wishlist'),
          ),
          _QuickAction(
            icon: Icons.location_on_outlined,
            title: s.addresses,
            caption: s.acctAddressesHint,
            onTap: () => context.push('/addresses'),
          ),
          _QuickAction(
            icon: Icons.stars_outlined,
            title: s.loyaltyPoints,
            caption: points > 0 ? s.acctPointsCount(points) : s.acctLoyaltyHint,
            onTap: () => context.push('/loyalty'),
          ),
        ],
      ),
      const _BuyAgainRail(),
      const SizedBox(height: AccountTheme.sectionGap),
      // الإشعارات مرفوضة: دعوة لتفعيلها (تختفي وحدها حين تُفعَّل).
      const NotificationPermissionTile(standalone: true),
      ProfileSectionTitle(s.acctAccount),
      ProfileMenuCard(
        children: [
          ProfileMenuTile(
            icon: Icons.person_outline_rounded,
            title: s.editProfile,
            subtitle: s.acctEditProfileHint,
            onTap: () => context.push('/edit-profile'),
          ),
          ProfileMenuTile(
            icon: Icons.lock_outline_rounded,
            title: s.changePassword,
            subtitle: s.acctPasswordHint,
            onTap: () => context.push('/change-password'),
          ),
          ProfileMenuTile(
            icon: Icons.notifications_none_rounded,
            title: s.notifications,
            subtitle: s.acctNotificationsHint,
            badge: unread,
            onTap: () => context.push('/notifications'),
          ),
          ProfileMenuTile(
            icon: Icons.notifications_active_outlined,
            title: s.restockAlerts,
            subtitle: s.acctRestockAlertsHint,
            badge: watches,
            onTap: () => context.push('/alerts'),
          ),
        ],
      ),
      const SizedBox(height: AccountTheme.sectionGap),
      ..._sharedSections(context, s),
      const SizedBox(height: AccountTheme.sectionGap),
      ProfileMenuCard(
        children: [
          ProfileMenuTile(
            icon: Icons.logout_rounded,
            title: s.logout,
            danger: true,
            showChevron: false,
            onTap: () => _logout(s),
          ),
        ],
      ),
      const SizedBox(height: 6),
      ProfileDangerTextButton(
        label: s.deleteAccount,
        onPressed: _deleting ? null : () => _deleteAccount(s),
      ),
    ];
  }

  List<Widget> _guestSections(BuildContext context, AppStrings s) {
    return [
      _GuestHero(s: s),
      const SizedBox(height: AccountTheme.sectionGap),
      ..._sharedSections(context, s),
    ];
  }

  /// أقسام مشتركة للضيفة والمسجّلة: الاكتشاف، التفضيلات، الدعم، وعن التطبيق.
  List<Widget> _sharedSections(BuildContext context, AppStrings s) {
    return [
      ProfileSectionTitle(s.acctPreferences),
      ProfileMenuCard(
        children: [
          ProfileMenuTile(
            icon: Icons.translate_rounded,
            title: s.language,
            subtitle: s.acctLanguageHint,
            value: s.acctCurrentLanguage,
            onTap: () => context.push('/language-settings'),
          ),
        ],
      ),
      const SizedBox(height: AccountTheme.sectionGap),
      ProfileSectionTitle(s.acctDiscover),
      ProfileMenuCard(
        children: [
          ProfileMenuTile(
            icon: Icons.storefront_outlined,
            title: s.brands,
            subtitle: s.acctBrandsHint,
            // تبويب البراندات نفسه — لا نسخة ثانية من الـ shell فوق الأولى.
            onTap: () => openMainTab(
              context,
              ProviderScope.containerOf(context, listen: false),
              NavTabs.brands,
            ),
          ),
          ProfileMenuTile(
            icon: Icons.spa_outlined,
            title: s.acctSkinGuide,
            subtitle: s.acctSkinGuideHint,
            onTap: () => context.push('/skin-guide'),
          ),
          // نتيجة اختبار البشرة المحفوظة — أو دعوة لإجرائه.
          Consumer(
            builder: (context, ref, _) {
              final p = ref.watch(skinProfileProvider);
              return ProfileMenuTile(
                icon: Icons.face_retouching_natural_outlined,
                title: s.acctSkinProfile,
                subtitle: p == null
                    ? s.acctSkinProfileEmpty
                    : s.acctSkinProfileReady(
                        p.skinType.labelAr,
                        p.skinType.emoji,
                        p.skinType.labelEn,
                      ),
                onTap: () => context.push(
                  p == null ? '/skin-quiz' : '/skin-quiz?result=1',
                ),
              );
            },
          ),
          ProfileMenuTile(
            icon: Icons.card_giftcard_rounded,
            title: s.acctBundles,
            subtitle: s.acctBundlesHint,
            onTap: () => context.push('/packages'),
          ),
        ],
      ),
      const SizedBox(height: AccountTheme.sectionGap),
      SupportContactSection(s: s),
      const SizedBox(height: AccountTheme.sectionGap),
      ProfileSectionTitle(s.acctAboutSection),
      ProfileMenuCard(
        children: [
          ProfileMenuTile(
            icon: Icons.info_outline_rounded,
            title: s.aboutApp,
            onTap: () => context.push('/about'),
          ),
          ProfileMenuTile(
            icon: Icons.privacy_tip_outlined,
            title: s.privacyPolicy,
            onTap: () => openLegalDocument(context, LegalDocumentType.privacy),
          ),
          ProfileMenuTile(
            icon: Icons.description_outlined,
            title: s.termsOfService,
            onTap: () => openLegalDocument(context, LegalDocumentType.terms),
          ),
        ],
      ),
    ];
  }

  Future<void> _logout(AppStrings s) async {
    final ok = await showProfileConfirmDialog(
      context,
      title: s.logoutConfirmTitle,
      body: s.logoutConfirmBody,
      confirmLabel: s.logout,
      cancelLabel: s.cancel,
    );
    if (!ok || !mounted) return;
    // الخروج فوري على الجهاز، وطلبات السيرفر تكمل في الخلفية.
    await ref.read(authProvider.notifier).logout();
    if (mounted) AppSnackbar.success(context, s.loggedOut);
  }

  Future<void> _deleteAccount(AppStrings s) async {
    if (_deleting) return;
    final ok = await showProfileConfirmDialog(
      context,
      title: s.deleteAccountTitle,
      body: s.deleteAccountBody,
      confirmLabel: s.deleteAccountConfirm,
      cancelLabel: s.cancel,
    );
    if (!ok || !mounted) return;
    setState(() => _deleting = true);
    // انتظار لا يُغلق: الحذف قد يأخذ ثواني، ولا نريد ضغطة ثانية أو مغادرة في منتصفه.
    final navigator = Navigator.of(context, rootNavigator: true);
    showDialog<void>(
      context: context,
      useRootNavigator: true,
      barrierDismissible: false,
      builder: (_) => PopScope(
        canPop: false,
        child: _BlockingProgress(label: s.acctDeletingAccount),
      ),
    );
    Object? error;
    try {
      await ref.read(authProvider.notifier).deleteAccount();
    } catch (e) {
      error = e;
    } finally {
      navigator.pop();
      if (mounted) setState(() => _deleting = false);
    }
    if (!mounted) return;
    if (error == null) {
      AppSnackbar.success(context, s.deleteAccountSuccess);
    } else {
      AppSnackbar.error(context, ref.friendly(error));
    }
  }
}

/// مؤشر انتظار فوق الشاشة كلها مع سطر يشرح ما يجري.
class _BlockingProgress extends StatelessWidget {
  final String label;
  const _BlockingProgress({required this.label});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Center(
      child: Semantics(
        liveRegion: true,
        label: label,
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            decoration: AccountTheme.pageCard(context),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(color: t.accent),
                const SizedBox(height: 14),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: AppText.label.copyWith(color: t.ink),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AccountTopBar extends StatelessWidget {
  final String title;
  final bool showBell;
  final int unread;
  final String bellTooltip;
  final VoidCallback onBell;

  const _AccountTopBar({
    required this.title,
    required this.showBell,
    required this.unread,
    required this.bellTooltip,
    required this.onBell,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return SizedBox(
      height: 48,
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.display.copyWith(color: t.ink),
            ),
          ),
          if (showBell)
            AppIconButton(
              icon: Icons.notifications_none_rounded,
              tooltip: bellTooltip,
              badge: unread,
              onTap: onBell,
            ),
        ],
      ),
    );
  }
}

class _ProfileHero extends ConsumerWidget {
  final AppStrings s;
  const _ProfileHero({required this.s});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    if (user == null) return const SizedBox.shrink();

    final phone = formatPhoneLocal(user.phone);
    final contact = phone.isNotEmpty ? phone : (user.email ?? '');

    return ProfileHeroCard(
      greeting: s.acctHello,
      // بلا اسم (سجّلت برقم الهاتف فقط): دعوة لطيفة لإكماله بدل «؟».
      name: user.name.trim().isNotEmpty ? user.name : s.acctAddYourName,
      subtitle: contact,
      badge: s.acctLoyaltyBadge(user.points),
      onBadgeTap: () => context.push('/loyalty'),
      initial: user.name.trim().isNotEmpty ? user.name.trim()[0] : '🌸',
      editLabel: s.editProfile,
      onEdit: () => context.push('/edit-profile'),
    );
  }
}

class _QuickAction {
  final IconData icon;
  final String title;
  final String caption;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.title,
    required this.caption,
    required this.onTap,
  });
}

/// شبكة 2×2 للاختصارات — صفوف مرنة حتى لا تقصّ النصوص مع تكبير الخط.
class _QuickActionsGrid extends StatelessWidget {
  final List<_QuickAction> items;
  const _QuickActionsGrid({required this.items});

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < items.length; i += 2) {
      if (i > 0) rows.add(const SizedBox(height: 12));
      rows.add(
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: _QuickActionTile(item: items[i])),
              const SizedBox(width: 12),
              Expanded(
                child: i + 1 < items.length
                    ? _QuickActionTile(item: items[i + 1])
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      );
    }
    return Column(children: rows);
  }
}

class _QuickActionTile extends StatelessWidget {
  final _QuickAction item;
  const _QuickActionTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final radius = BorderRadius.circular(AppCorners.lg);
    final tile = DecoratedBox(
      decoration: AccountTheme.pageCard(context),
      child: Material(
        color: Colors.transparent,
        borderRadius: radius,
        child: InkWell(
          borderRadius: radius,
          onTap: () {
            HapticFeedback.selectionClick();
            item.onTap();
          },
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                AccountTheme.iconTile(context, item.icon, size: 42),
                const SizedBox(height: 12),
                Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.title3.copyWith(color: t.ink),
                ),
                const SizedBox(height: 2),
                Text(
                  item.caption,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.caption.copyWith(color: t.inkMuted),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    return Semantics(button: true, child: tile);
  }
}

class _GuestHero extends StatelessWidget {
  final AppStrings s;
  const _GuestHero({required this.s});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final soft = Colors.white.withValues(alpha: 0.85);
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 20),
      decoration: AccountTheme.heroDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.4),
                    width: 1.5,
                  ),
                ),
                child: const Icon(
                  Icons.person_outline_rounded,
                  size: 28,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  s.guestWelcome,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.title2.copyWith(color: Colors.white),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(s.guestSubtitle, style: AppText.bodySmall.copyWith(color: soft)),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _GuestPerk(
                icon: Icons.local_shipping_outlined,
                label: s.acctGuestPerkOrders,
              ),
              _GuestPerk(
                icon: Icons.stars_outlined,
                label: s.acctGuestPerkPoints,
              ),
              _GuestPerk(
                icon: Icons.favorite_border_rounded,
                label: s.acctGuestPerkWishlist,
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                context.push('/login');
              },
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(ProfileUi.buttonHeight),
                backgroundColor: Colors.white,
                foregroundColor: t.accentDark,
                shape: const StadiumBorder(),
                elevation: 0,
              ),
              child: Text(
                s.login,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.title3.copyWith(
                  color: t.accentDark,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () {
                HapticFeedback.selectionClick();
                context.push('/register');
              },
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(ProfileUi.buttonHeight),
                foregroundColor: Colors.white,
                side: BorderSide(
                  color: Colors.white.withValues(alpha: 0.7),
                  width: 1.2,
                ),
                shape: const StadiumBorder(),
              ),
              child: Text(
                s.register,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.title3.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GuestPerk extends StatelessWidget {
  final IconData icon;
  final String label;
  const _GuestPerk({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(8, 5, 10, 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(AppCorners.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: Colors.white),
          const SizedBox(width: 5),
          Text(label, style: AppText.micro.copyWith(color: Colors.white)),
        ],
      ),
    );
  }
}

/// آخر طلب قيد التنفيذ — حالته وتقدّمه بلمحة، ولمسة تفتح تفاصيله.
class _ActiveOrderCard extends ConsumerWidget {
  const _ActiveOrderCard();

  static const _done = {'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURNED'};

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(ordersProvider).valueOrNull ?? const <AppOrder>[];
    AppOrder? active;
    for (final o in orders) {
      if (!_done.contains(o.status)) {
        active = o;
        break;
      }
    }
    if (active == null) return const SizedBox.shrink();
    final order = active;
    final t = context.worldTheme;
    final s = ref.s;
    final radius = BorderRadius.circular(AppCorners.xl);

    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Semantics(
        button: true,
        label: s.acctOpenOrder('#${order.orderNumber}'),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: radius,
            border: Border.all(color: t.accentSoft),
            boxShadow: t.cardShadow,
          ),
          child: Material(
            color: Colors.transparent,
            borderRadius: radius,
            child: InkWell(
              borderRadius: radius,
              onTap: () {
                HapticFeedback.selectionClick();
                context.push('/orders/${order.id}');
              },
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            gradient: t.signatureGradient,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          s.acctCurrentOrder,
                          style: AppText.caption.copyWith(
                            color: t.inkMuted,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const Spacer(),
                        OrderStatusChip(status: order.status),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        // رقم الطلب لاتيني: نثبّته في بداية السطر (يمين) ونترك فراغاً قبل السعر.
                        Expanded(
                          child: Align(
                            alignment: AlignmentDirectional.centerStart,
                            child: Text(
                              '#${order.orderNumber}',
                              textDirection: TextDirection.ltr,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.title3.copyWith(
                                color: t.ink,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          order.totalLabel,
                          style: AppText.price.copyWith(color: t.accentDark),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.chevron_right_rounded,
                          color: t.inkMuted,
                          size: 20,
                        ),
                      ],
                    ),
                    if (order.paymentMethod == 'CARD') ...[
                      const SizedBox(height: 8),
                      Align(
                        alignment: AlignmentDirectional.centerStart,
                        child: CardPaymentPill(order: order),
                      ),
                    ],
                    const SizedBox(height: 12),
                    OrderProgressBar(status: order.status),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// «اطلبيها مرة ثانية» في حسابها: مشترياتها المتوفرة الآن بسعرها الحالي.
class _BuyAgainRail extends ConsumerWidget {
  const _BuyAgainRail();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(buyAgainProvider).valueOrNull ?? const [];
    if (products.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: AccountTheme.sectionGap),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ProfileSectionTitle(ref.s.acctBuyAgain),
          SizedBox(
            height: 262,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              clipBehavior: Clip.none,
              itemCount: products.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) => ProductCard(
                key: ValueKey(products[i].id),
                product: products[i],
                width: 150,
                lite: true,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
