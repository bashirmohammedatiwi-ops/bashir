import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/phone_util.dart';
import '../../core/utils/responsive.dart';
import '../../core/utils/support_links.dart';
import '../../core/widgets/language_toggle_bar.dart';
import '../auth/auth_provider.dart';
import '../auth/widgets/auth_shell.dart';
import '../cart/widgets/cart_theme.dart';
import '../catalog/catalog_providers.dart';
import 'profile_providers.dart';
import 'widgets/account_theme.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final s = ref.watch(stringsProvider);
    final hPad = Responsive.horizontalPadding(context);

    return Scaffold(
      backgroundColor: AccountTheme.pageBg,
      body: !auth.isAuthenticated
          ? Column(
              children: [
                const LanguageToggleBar(),
                Expanded(child: _GuestAccount(s: s, hPad: hPad)),
              ],
            )
          : CustomScrollView(
              physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
              slivers: [
                SliverToBoxAdapter(child: const LanguageToggleBar()),
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(hPad, 4, hPad, Responsive.shellBottomReserve(context) + 32),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      const _ProfileHeader(),
                      const SizedBox(height: AccountTheme.sectionGap),
                      const _QuickActionsGrid(),
                      const SizedBox(height: AccountTheme.sectionGap),
                      AccountSection(
                        title: s.explore,
                        icon: Icons.storefront_outlined,
                        children: [
                          AccountMenuTile(
                            icon: Icons.storefront_rounded,
                            title: s.brands,
                            color: AccountTheme.brands,
                            onTap: () => context.push('/brands'),
                          ),
                          AccountMenuTile(
                            icon: Icons.notifications_active_rounded,
                            title: s.notifications,
                            color: AccountTheme.notifications,
                            badge: ref.watch(unreadNotificationsCountProvider),
                            onTap: () => context.push('/notifications'),
                          ),
                        ],
                      ),
                      const SizedBox(height: AccountTheme.sectionGap),
                      _SupportSection(s: s),
                      const SizedBox(height: AccountTheme.sectionGap),
                      AccountSection(
                        title: s.settings,
                        icon: Icons.settings_outlined,
                        children: [
                          AccountMenuTile(
                            icon: Icons.person_outline_rounded,
                            title: s.editProfile,
                            color: AccountTheme.settings,
                            onTap: () => context.push('/edit-profile'),
                          ),
                          AccountMenuTile(
                            icon: Icons.lock_outline_rounded,
                            title: s.changePassword,
                            color: AccountTheme.settings,
                            onTap: () => context.push('/change-password'),
                          ),
                          AccountMenuTile(
                            icon: Icons.info_outline_rounded,
                            title: s.aboutApp,
                            color: AccountTheme.settings,
                            onTap: () => _about(context, s),
                          ),
                        ],
                      ),
                      const SizedBox(height: AccountTheme.sectionGap),
                      _DangerZone(
                        onLogout: () => _logout(context, ref, s),
                        onDelete: () => _deleteAccount(context, ref, s),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Center(
                        child: Text(
                          '${AppConfig.storeName} • ${s.version} 1.0.0',
                          style: AppTypography.caption.copyWith(
                            color: CartTheme.charcoal.withValues(alpha: 0.45),
                          ),
                        ),
                      ),
                    ]),
                  ),
                ),
              ],
            ),
    );
  }

  void _about(BuildContext context, AppStrings s) {
    showAboutDialog(
      context: context,
      applicationName: AppConfig.storeName,
      applicationVersion: '1.0.0',
      children: [Text(s.aboutDescription)],
    );
  }

  Future<void> _logout(BuildContext context, WidgetRef ref, AppStrings s) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
        title: Text(s.logoutConfirmTitle),
        content: Text(s.logoutConfirmBody),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(s.cancel)),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(s.logout, style: const TextStyle(color: AppColors.sale)),
          ),
        ],
      ),
    );
    if (ok == true) {
      await ref.read(authProvider.notifier).logout();
    }
  }

  Future<void> _deleteAccount(BuildContext context, WidgetRef ref, AppStrings s) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
        title: Text(s.deleteAccountTitle),
        content: Text(s.deleteAccountBody),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(s.cancel)),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              s.deleteAccountConfirm,
              style: const TextStyle(color: AppColors.sale, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;

    try {
      await ref.read(authProvider.notifier).deleteAccount();
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.deleteAccountSuccess)));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }
}

class AccountSection extends StatelessWidget {
  final String title;
  final IconData? icon;
  final List<Widget> children;

  const AccountSection({
    super.key,
    required this.title,
    this.icon,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AccountTheme.sectionTitle(title, icon: icon),
        Container(
          decoration: AccountTheme.pageCard(),
          child: Column(
            children: [
              for (var i = 0; i < children.length; i++) ...[
                if (i > 0) Divider(height: 1, indent: 72, endIndent: 16, color: CartTheme.brandSoft),
                children[i],
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class AccountMenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Color color;
  final VoidCallback onTap;
  final int badge;

  const AccountMenuTile({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    required this.color,
    required this.onTap,
    this.badge = 0,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 46,
        height: 46,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(icon, color: color, size: 23),
      ),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: CartTheme.charcoal),
      ),
      subtitle: subtitle == null
          ? null
          : Text(
              subtitle!,
              style: TextStyle(fontSize: 12, color: CartTheme.charcoal.withValues(alpha: 0.5)),
            ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (badge > 0)
            Container(
              margin: const EdgeInsets.only(left: 6),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.sale,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                badge > 9 ? '9+' : '$badge',
                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
              ),
            ),
          Icon(Icons.chevron_left_rounded, color: CartTheme.charcoal.withValues(alpha: 0.35)),
        ],
      ),
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
    );
  }
}

class _GuestAccount extends StatelessWidget {
  final AppStrings s;
  final double hPad;

  const _GuestAccount({required this.s, required this.hPad});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(hPad, 8, hPad, 120),
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: AccountTheme.heroDecoration(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 62,
                height: 62,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                ),
                child: const Icon(Icons.person_rounded, color: Colors.white, size: 32),
              ),
              const SizedBox(height: 18),
              Text(
                s.guestWelcome,
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: -0.5,
                  height: 1.15,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                s.guestSubtitle,
                style: TextStyle(color: Colors.white.withValues(alpha: 0.88), height: 1.45, fontSize: 14),
              ),
              const SizedBox(height: 22),
              authPrimaryButton(label: s.login, onPressed: () => context.push('/login')),
              const SizedBox(height: 12),
              SizedBox(
                height: 52,
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => context.push('/register'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: BorderSide(color: Colors.white.withValues(alpha: 0.65), width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                  ),
                  child: Text(
                    s.register,
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AccountTheme.sectionGap),
        AccountSection(
          title: s.explore,
          icon: Icons.explore_outlined,
          children: [
            AccountMenuTile(
              icon: Icons.storefront_rounded,
              title: s.brands,
              color: AccountTheme.brands,
              onTap: () => context.push('/brands'),
            ),
            AccountMenuTile(
              icon: Icons.info_outline_rounded,
              title: s.aboutApp,
              color: AccountTheme.settings,
              onTap: () => showAboutDialog(
                context: context,
                applicationName: AppConfig.storeName,
                applicationVersion: '1.0.0',
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _QuickActionsGrid extends ConsumerWidget {
  const _QuickActionsGrid();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final actions = [
      _QuickAction(
        icon: Icons.receipt_long_rounded,
        label: s.myOrders,
        color: AccountTheme.orders,
        onTap: () => context.push('/orders'),
      ),
      _QuickAction(
        icon: Icons.favorite_rounded,
        label: s.wishlist,
        color: AccountTheme.wishlist,
        onTap: () => context.push('/wishlist'),
      ),
      _QuickAction(
        icon: Icons.stars_rounded,
        label: s.loyaltyPoints,
        color: AccountTheme.loyalty,
        onTap: () => context.push('/loyalty'),
      ),
      _QuickAction(
        icon: Icons.location_on_rounded,
        label: s.addresses,
        color: AccountTheme.addresses,
        onTap: () => context.push('/addresses'),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AccountTheme.sectionTitle(s.myPurchases, icon: Icons.shopping_bag_outlined),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: Responsive.isCompact(context) ? 1.45 : 1.55,
          children: [for (final a in actions) _QuickActionTile(action: a)],
        ),
      ],
    );
  }
}

class _QuickAction {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
}

class _QuickActionTile extends StatelessWidget {
  final _QuickAction action;

  const _QuickActionTile({required this.action});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          action.onTap();
        },
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: action.color.withValues(alpha: 0.18)),
            gradient: LinearGradient(
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
              colors: [
                action.color.withValues(alpha: 0.08),
                Colors.white,
              ],
            ),
            boxShadow: CartTheme.softShadow,
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: action.color.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(action.icon, color: action.color, size: 24),
                ),
                const Spacer(),
                Text(
                  action.label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 13.5,
                    color: CartTheme.charcoal,
                    height: 1.2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SupportSection extends ConsumerWidget {
  final AppStrings s;
  const _SupportSection({required this.s});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(homeFeedProvider).maybeWhen(
          data: (d) => d.settings,
          orElse: () => null,
        );
    final whatsapp = settings?.whatsapp;
    final phone = settings?.supportPhone;
    if ((whatsapp == null || whatsapp.isEmpty) && (phone == null || phone.isEmpty)) {
      return const SizedBox.shrink();
    }

    return AccountSection(
      title: s.support,
      icon: Icons.headset_mic_outlined,
      children: [
        if (whatsapp != null && whatsapp.isNotEmpty)
          AccountMenuTile(
            icon: Icons.chat_rounded,
            title: s.whatsappSupport,
            subtitle: whatsapp,
            color: const Color(0xFF25D366),
            onTap: () => openWhatsApp(whatsapp, message: s.whatsappHelpMessage),
          ),
        if (phone != null && phone.isNotEmpty)
          AccountMenuTile(
            icon: Icons.phone_in_talk_rounded,
            title: s.callUs,
            subtitle: phone,
            color: AccountTheme.addresses,
            onTap: () => callPhone(phone),
          ),
      ],
    );
  }
}

class _ProfileHeader extends ConsumerWidget {
  const _ProfileHeader();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final s = ref.watch(stringsProvider);
    if (user == null) return const SizedBox.shrink();

    final contact = formatPhoneLocal(user.phone).isNotEmpty
        ? formatPhoneLocal(user.phone)
        : (user.email ?? '');

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AccountTheme.heroDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.12),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: Text(
                  user.name.isNotEmpty ? user.name[0] : '؟',
                  style: const TextStyle(
                    color: CartTheme.brand,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.3,
                        height: 1.15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      contact,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.82),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Material(
                color: Colors.white.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(14),
                child: InkWell(
                  onTap: () => context.push('/edit-profile'),
                  borderRadius: BorderRadius.circular(14),
                  child: const Padding(
                    padding: EdgeInsets.all(10),
                    child: Icon(Icons.edit_rounded, color: Colors.white, size: 20),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _HeaderChip(
                  icon: Icons.stars_rounded,
                  label: '${user.points}',
                  hint: s.loyaltyPointsCount,
                  onTap: () => context.push('/loyalty'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _HeaderChip(
                  icon: Icons.receipt_long_rounded,
                  label: s.myOrders,
                  hint: s.viewAll,
                  onTap: () => context.push('/orders'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeaderChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String hint;
  final VoidCallback onTap;

  const _HeaderChip({
    required this.icon,
    required this.label,
    required this.hint,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.14),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              Icon(icon, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      hint,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.75),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_left_rounded, color: Colors.white.withValues(alpha: 0.7), size: 18),
            ],
          ),
        ),
      ),
    );
  }
}

class _DangerZone extends ConsumerWidget {
  final VoidCallback onLogout;
  final VoidCallback onDelete;

  const _DangerZone({required this.onLogout, required this.onDelete});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AccountTheme.sectionTitle(s.myAccount, icon: Icons.manage_accounts_outlined),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: AccountTheme.pageCard(color: Colors.white),
          child: Column(
            children: [
              SizedBox(
                height: 50,
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onLogout,
                  icon: const Icon(Icons.logout_rounded, size: 20),
                  label: Text(s.logout),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: CartTheme.brandDark,
                    side: const BorderSide(color: CartTheme.brand, width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    textStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 48,
                width: double.infinity,
                child: TextButton.icon(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_forever_outlined, size: 19),
                  label: Text(s.deleteAccount),
                  style: TextButton.styleFrom(
                    foregroundColor: AccountTheme.danger,
                    backgroundColor: AccountTheme.dangerSoft,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
