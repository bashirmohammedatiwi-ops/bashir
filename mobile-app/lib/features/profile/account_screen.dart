import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/support_links.dart';
import '../auth/auth_provider.dart';
import '../catalog/catalog_providers.dart';
import 'profile_providers.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageCodeProvider);
    final top = MediaQuery.paddingOf(context).top;

    return Scaffold(
      backgroundColor: AppColors.scaffold,
      body: !auth.isAuthenticated
          ? _GuestAccount(topPad: top, s: s)
          : ListView(
              padding: EdgeInsets.only(bottom: AppSpacing.huge + 40),
              children: [
                _ProfileHeader(topPad: top),
                const SizedBox(height: AppSpacing.md),
                _QuickActions(),
                const SizedBox(height: AppSpacing.lg),
                _MenuGroup(
                  title: s.myPurchases,
                  children: [
                    _tile(context, Icons.receipt_long_outlined, s.myOrders, () => context.push('/orders')),
                    _tile(context, Icons.favorite_border_rounded, s.wishlist, () => context.push('/wishlist')),
                    _tile(context, Icons.storefront_outlined, s.brands, () => context.push('/brands')),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                _MenuGroup(
                  title: s.myAccount,
                  children: [
                    _tile(context, Icons.location_on_outlined, s.addresses, () => context.push('/addresses')),
                    _tile(context, Icons.stars_outlined, s.loyaltyPoints, () => context.push('/loyalty')),
                    _tile(
                      context,
                      Icons.notifications_none_rounded,
                      s.notifications,
                      () => context.push('/notifications'),
                      badge: ref.watch(unreadNotificationsCountProvider),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                _SupportSection(s: s),
                const SizedBox(height: AppSpacing.md),
                _MenuGroup(
                  title: s.settings,
                  children: [
                    _tile(context, Icons.edit_outlined, s.editProfile, () => context.push('/edit-profile')),
                    _tile(context, Icons.lock_outline_rounded, s.changePassword, () => context.push('/change-password')),
                    _tile(
                      context,
                      Icons.language_rounded,
                      s.language,
                      () => context.push('/language-settings'),
                      trailing: Text(
                        lang == 'ar' ? s.arabic : s.english,
                        style: AppTypography.caption.copyWith(fontWeight: FontWeight.w700),
                      ),
                    ),
                    _tile(context, Icons.info_outline_rounded, s.aboutApp, () => _about(context, s)),
                    _tile(
                      context,
                      Icons.logout_rounded,
                      s.logout,
                      () => _logout(context, ref, s),
                      color: AppColors.sale,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xl),
                Center(
                  child: Text(
                    '${AppConfig.storeName} • ${s.version} 1.0.0',
                    style: AppTypography.caption,
                  ),
                ),
              ],
            ),
    );
  }

  Widget _tile(
    BuildContext context,
    IconData icon,
    String title,
    VoidCallback onTap, {
    Color? color,
    int badge = 0,
    Widget? trailing,
  }) =>
      ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 2),
        leading: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: (color ?? AppColors.primary).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color ?? AppColors.primary, size: 22),
        ),
        title: Text(
          title,
          style: AppTypography.bodyStrong.copyWith(
            color: color ?? AppColors.textPrimary,
            fontSize: 14.5,
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (trailing != null) trailing,
            if (badge > 0)
              Container(
                margin: const EdgeInsets.only(left: AppSpacing.sm),
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.sale,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                ),
                child: Text(
                  badge > 9 ? '9+' : '$badge',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                ),
              ),
            const Icon(Icons.chevron_left_rounded, color: AppColors.textMuted),
          ],
        ),
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
      );

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
}

class _GuestAccount extends StatelessWidget {
  final double topPad;
  final AppStrings s;
  const _GuestAccount({required this.topPad, required this.s});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(AppSpacing.lg, topPad + 16, AppSpacing.lg, 120),
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: AppColors.luxuryGradient,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.hairline),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.person_rounded, color: Colors.white, size: 28),
              ),
              const SizedBox(height: 18),
              Text(
                s.guestWelcome,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.4),
              ),
              const SizedBox(height: 8),
              Text(
                s.guestSubtitle,
                style: AppTypography.body.copyWith(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.push('/login'),
                  child: Text(s.login),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => context.push('/register'),
                  child: Text(s.register),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _MenuGroup(
          title: s.explore,
          children: [
            ListTile(
              leading: const Icon(Icons.storefront_outlined, color: AppColors.primary),
              title: Text(s.brands, style: const TextStyle(fontWeight: FontWeight.w700)),
              trailing: const Icon(Icons.chevron_left_rounded),
              onTap: () => context.push('/brands'),
            ),
            ListTile(
              leading: const Icon(Icons.language_rounded, color: AppColors.primary),
              title: Text(s.language, style: const TextStyle(fontWeight: FontWeight.w700)),
              trailing: const Icon(Icons.chevron_left_rounded),
              onTap: () => context.push('/language-settings'),
            ),
            ListTile(
              leading: const Icon(Icons.info_outline_rounded, color: AppColors.primary),
              title: Text(s.aboutApp, style: const TextStyle(fontWeight: FontWeight.w700)),
              trailing: const Icon(Icons.chevron_left_rounded),
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

class _QuickActions extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final actions = [
      (Icons.receipt_long_rounded, s.myOrders, () => context.push('/orders')),
      (Icons.favorite_rounded, s.wishlist, () => context.push('/wishlist')),
      (Icons.stars_rounded, s.loyaltyPoints, () => context.push('/loyalty')),
      (Icons.location_on_rounded, s.addresses, () => context.push('/addresses')),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: [
          for (var i = 0; i < actions.length; i++) ...[
            if (i > 0) const SizedBox(width: 10),
            Expanded(
              child: Material(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                child: InkWell(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    actions[i].$3();
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.hairline),
                    ),
                    child: Column(
                      children: [
                        Icon(actions[i].$1, color: AppColors.primary, size: 22),
                        const SizedBox(height: 6),
                        Text(
                          actions[i].$2,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _MenuGroup extends StatelessWidget {
  final String? title;
  final List<Widget> children;
  const _MenuGroup({this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (title != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, 8),
            child: Text(
              title!,
              style: AppTypography.overline.copyWith(color: AppColors.textMuted),
            ),
          ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppColors.hairline),
            boxShadow: AppColors.cardShadow,
          ),
          child: Column(
            children: [
              for (var i = 0; i < children.length; i++) ...[
                if (i > 0) const Divider(height: 1, indent: 68, endIndent: AppSpacing.lg),
                children[i],
              ],
            ],
          ),
        ),
      ],
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

    return _MenuGroup(
      title: s.support,
      children: [
        if (whatsapp != null && whatsapp.isNotEmpty)
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 2),
            leading: Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: const Color(0xFF25D366).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.chat_outlined, color: Color(0xFF25D366)),
            ),
            title: Text(s.whatsappSupport, style: const TextStyle(fontWeight: FontWeight.w700)),
            trailing: const Icon(Icons.chevron_left_rounded, color: AppColors.textMuted),
            onTap: () => openWhatsApp(whatsapp, message: 'مرحباً، أحتاج مساعدة'),
          ),
        if (phone != null && phone.isNotEmpty)
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 2),
            leading: Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.phone_outlined, color: AppColors.primary),
            ),
            title: Text(s.callUs, style: const TextStyle(fontWeight: FontWeight.w700)),
            subtitle: Text(phone, style: AppTypography.caption),
            trailing: const Icon(Icons.chevron_left_rounded, color: AppColors.textMuted),
            onTap: () => callPhone(phone),
          ),
      ],
    );
  }
}

class _ProfileHeader extends ConsumerWidget {
  final double topPad;
  const _ProfileHeader({required this.topPad});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final s = ref.watch(stringsProvider);
    if (user == null) return const SizedBox.shrink();

    return Container(
      margin: EdgeInsets.fromLTRB(AppSpacing.lg, topPad + 8, AppSpacing.lg, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: AppColors.elevatedShadow,
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: Colors.white,
            child: Text(
              user.name.isNotEmpty ? user.name[0] : '؟',
              style: const TextStyle(color: AppColors.primary, fontSize: 24, fontWeight: FontWeight.w900),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name,
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 2),
                Text(user.email, style: TextStyle(color: Colors.white.withValues(alpha: 0.78), fontSize: 12)),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.stars_rounded, color: Colors.white, size: 15),
                      const SizedBox(width: 5),
                      Text(
                        '${user.points} ${s.loyaltyPointsCount}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
