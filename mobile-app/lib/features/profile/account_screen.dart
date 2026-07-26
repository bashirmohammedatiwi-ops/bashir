import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/providers/app_info_provider.dart';
import '../../core/utils/phone_util.dart';
import '../../core/utils/responsive.dart';
import '../../core/utils/support_links.dart';
import '../../core/widgets/language_toggle_bar.dart';
import '../auth/auth_provider.dart';
import '../cart/widgets/cart_theme.dart';
import '../catalog/catalog_providers.dart';
import 'profile_providers.dart';
import '../settings/legal_document_screen.dart';
import 'widgets/account_theme.dart';
import 'widgets/profile_ui.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final s = ref.watch(stringsProvider);
    final version = ref.watch(appVersionLabelProvider);
    final top = MediaQuery.paddingOf(context).top;
    final bottomPad = Responsive.shellBottomReserve(context) + 16;

    return Scaffold(
      backgroundColor: ProfileUi.bg,
      body: !auth.isAuthenticated
          ? _GuestView(s: s, top: top, bottomPad: bottomPad)
          : ListView(
              padding: EdgeInsets.fromLTRB(ProfileUi.hPad, top + 10, ProfileUi.hPad, bottomPad),
              children: [
                Center(child: Text(s.myAccount, style: ProfileUi.titleStyle(context))),
                const SizedBox(height: 22),
                _ProfileHero(s: s),
                const SizedBox(height: AccountTheme.sectionGap),
                ProfileSectionTitle(s.isAr ? 'تسوقي' : 'Shopping', icon: Icons.shopping_bag_outlined),
                ProfileMenuCard(
                  children: [
                    ProfileMenuTile(
                      icon: Icons.receipt_long_outlined,
                      title: s.myOrders,
                      iconColor: AccountTheme.orders,
                      onTap: () => context.push('/orders'),
                    ),
                    ProfileMenuTile(
                      icon: Icons.favorite_border_rounded,
                      title: s.wishlist,
                      iconColor: AccountTheme.wishlist,
                      onTap: () => context.push('/wishlist'),
                    ),
                    ProfileMenuTile(
                      icon: Icons.stars_outlined,
                      title: s.loyaltyPoints,
                      iconColor: AccountTheme.loyalty,
                      onTap: () => context.push('/loyalty'),
                    ),
                    ProfileMenuTile(
                      icon: Icons.location_on_outlined,
                      title: s.addresses,
                      iconColor: AccountTheme.addresses,
                      onTap: () => context.push('/addresses'),
                    ),
                  ],
                ),
                const SizedBox(height: AccountTheme.sectionGap),
                ProfileSectionTitle(s.isAr ? 'اكتشفي' : 'Discover', icon: Icons.explore_outlined),
                ProfileMenuCard(
                  children: [
                    ProfileMenuTile(
                      icon: Icons.storefront_outlined,
                      title: s.brands,
                      iconColor: AccountTheme.brands,
                      onTap: () => context.push('/brands'),
                    ),
                    ProfileMenuTile(
                      icon: Icons.notifications_none_rounded,
                      title: s.notifications,
                      iconColor: AccountTheme.notifications,
                      badge: ref.watch(unreadNotificationsCountProvider),
                      onTap: () => context.push('/notifications'),
                    ),
                  ],
                ),
                const SizedBox(height: AccountTheme.sectionGap),
                _SupportSection(s: s),
                const SizedBox(height: AccountTheme.sectionGap),
                ProfileSectionTitle(s.isAr ? 'الحساب' : 'Account', icon: Icons.person_outline_rounded),
                ProfileMenuCard(
                  children: [
                    ProfileMenuTile(
                      icon: Icons.edit_outlined,
                      title: s.editProfile,
                      iconColor: AccountTheme.settings,
                      onTap: () => context.push('/edit-profile'),
                    ),
                    ProfileMenuTile(
                      icon: Icons.lock_outline_rounded,
                      title: s.changePassword,
                      iconColor: AccountTheme.settings,
                      onTap: () => context.push('/change-password'),
                    ),
                    ProfileMenuTile(
                      icon: Icons.info_outline_rounded,
                      title: s.aboutApp,
                      iconColor: AccountTheme.settings,
                      onTap: () => context.push('/about'),
                    ),
                  ],
                ),
                const SizedBox(height: AccountTheme.sectionGap),
                ProfileSectionTitle(s.legalSection, icon: Icons.gavel_outlined),
                ProfileMenuCard(
                  children: [
                    ProfileMenuTile(
                      icon: Icons.privacy_tip_outlined,
                      title: s.privacyPolicy,
                      iconColor: AccountTheme.settings,
                      onTap: () => openLegalDocument(context, LegalDocumentType.privacy),
                    ),
                    ProfileMenuTile(
                      icon: Icons.description_outlined,
                      title: s.termsOfService,
                      iconColor: AccountTheme.settings,
                      onTap: () => openLegalDocument(context, LegalDocumentType.terms),
                    ),
                  ],
                ),
                const SizedBox(height: AccountTheme.sectionGap),
                ProfileSectionTitle(s.language, icon: Icons.language_rounded),
                ProfileSurfaceCard(
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                  child: const LanguageToggleBar(embedded: true, showLabel: false),
                ),
                const SizedBox(height: 16),
                ProfileOutlineButton(
                  label: s.logout,
                  color: AccountTheme.danger,
                  onPressed: () => _logout(context, ref, s),
                ),
                ProfileDangerTextButton(
                  label: s.deleteAccount,
                  onPressed: () => _deleteAccount(context, ref, s),
                ),
                const SizedBox(height: 4),
                Center(
                  child: Text(
                    '${AppConfig.displayStoreName(s.lang)} • ${s.version} $version',
                    style: ProfileUi.captionStyle(),
                  ),
                ),
              ],
            ),
    );
  }

  Future<void> _logout(BuildContext context, WidgetRef ref, AppStrings s) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text(s.logoutConfirmTitle),
        content: Text(s.logoutConfirmBody),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(s.cancel)),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(s.logout, style: const TextStyle(color: AccountTheme.danger)),
          ),
        ],
      ),
    );
    if (ok == true) await ref.read(authProvider.notifier).logout();
  }

  Future<void> _deleteAccount(BuildContext context, WidgetRef ref, AppStrings s) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text(s.deleteAccountTitle),
        content: Text(s.deleteAccountBody),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(s.cancel)),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(s.deleteAccountConfirm, style: const TextStyle(color: AccountTheme.danger, fontWeight: FontWeight.w700)),
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

class _ProfileHero extends ConsumerWidget {
  final AppStrings s;
  const _ProfileHero({required this.s});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    if (user == null) return const SizedBox.shrink();

    final contact = formatPhoneLocal(user.phone).isNotEmpty ? formatPhoneLocal(user.phone) : (user.email ?? '');

    return ProfileHeroCard(
      name: user.name,
      subtitle: contact,
      badge: '${user.points} ${s.loyaltyPointsCount}',
      initial: user.name.isNotEmpty ? user.name[0] : '؟',
      onEdit: () => context.push('/edit-profile'),
    );
  }
}

class _SupportSection extends ConsumerWidget {
  final AppStrings s;
  const _SupportSection({required this.s});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(homeFeedProvider).maybeWhen(data: (d) => d.settings, orElse: () => null);
    final whatsapp = settings?.whatsapp;
    final phone = settings?.supportPhone;
    if ((whatsapp == null || whatsapp.isEmpty) && (phone == null || phone.isEmpty)) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ProfileSectionTitle(s.isAr ? 'الدعم' : 'Support', icon: Icons.support_agent_outlined),
        ProfileMenuCard(
          children: [
            if (whatsapp != null && whatsapp.isNotEmpty)
              ProfileMenuTile(
                icon: Icons.chat_outlined,
                title: s.whatsappSupport,
                subtitle: s.isAr ? 'تواصلي معنا مباشرة' : 'Chat with us',
                iconColor: const Color(0xFF25D366),
                onTap: () => openWhatsApp(whatsapp, message: s.whatsappHelpMessage),
              ),
            if (phone != null && phone.isNotEmpty)
              ProfileMenuTile(
                icon: Icons.phone_outlined,
                title: s.callUs,
                subtitle: phone,
                iconColor: CartTheme.brand,
                onTap: () => callPhone(phone),
              ),
          ],
        ),
      ],
    );
  }
}

class _GuestView extends StatelessWidget {
  final AppStrings s;
  final double top;
  final double bottomPad;

  const _GuestView({required this.s, required this.top, required this.bottomPad});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(ProfileUi.hPad, top + 10, ProfileUi.hPad, bottomPad),
      children: [
        Center(child: Text(s.myAccount, style: ProfileUi.titleStyle(context))),
        const SizedBox(height: 28),
        Container(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
          decoration: AccountTheme.heroDecoration(),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.person_outline_rounded, size: 44, color: Colors.white),
              ),
              const SizedBox(height: 18),
              Text(
                s.guestWelcome,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white),
              ),
              const SizedBox(height: 8),
              Text(
                s.guestSubtitle,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, height: 1.5, color: Colors.white.withValues(alpha: 0.8)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        ProfilePrimaryButton(label: s.login, onPressed: () => context.push('/login')),
        const SizedBox(height: 12),
        ProfileOutlineButton(
          label: s.register,
          onPressed: () => context.push('/register'),
        ),
        const SizedBox(height: AccountTheme.sectionGap),
        ProfileSectionTitle(s.isAr ? 'اكتشفي' : 'Discover', icon: Icons.explore_outlined),
        ProfileMenuCard(
          children: [
            ProfileMenuTile(
              icon: Icons.storefront_outlined,
              title: s.brands,
              iconColor: AccountTheme.brands,
              onTap: () => context.push('/brands'),
            ),
            ProfileMenuTile(
              icon: Icons.info_outline_rounded,
              title: s.aboutApp,
              iconColor: AccountTheme.settings,
              onTap: () => context.push('/about'),
            ),
          ],
        ),
        const SizedBox(height: AccountTheme.sectionGap),
        ProfileSectionTitle(s.legalSection, icon: Icons.gavel_outlined),
        ProfileMenuCard(
          children: [
            ProfileMenuTile(
              icon: Icons.privacy_tip_outlined,
              title: s.privacyPolicy,
              iconColor: AccountTheme.settings,
              onTap: () => openLegalDocument(context, LegalDocumentType.privacy),
            ),
            ProfileMenuTile(
              icon: Icons.description_outlined,
              title: s.termsOfService,
              iconColor: AccountTheme.settings,
              onTap: () => openLegalDocument(context, LegalDocumentType.terms),
            ),
          ],
        ),
        const SizedBox(height: AccountTheme.sectionGap),
        ProfileSectionTitle(s.language, icon: Icons.language_rounded),
        ProfileSurfaceCard(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
          child: const LanguageToggleBar(embedded: true, showLabel: false),
        ),
      ],
    );
  }
}
