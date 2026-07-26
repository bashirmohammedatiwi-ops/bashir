import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/providers/app_info_provider.dart';
import '../../core/utils/support_links.dart';
import '../cart/widgets/cart_theme.dart';
import '../profile/widgets/account_theme.dart';
import '../profile/widgets/profile_ui.dart';
import 'legal_document_screen.dart';

class AboutAppScreen extends ConsumerWidget {
  const AboutAppScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final version = ref.watch(appVersionLabelProvider);

    return ProfileScaffold(
      title: s.aboutApp,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(ProfileUi.hPad, 8, ProfileUi.hPad, 32),
        children: [
          _AboutHeader(s: s, version: version),
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
              ProfileMenuTile(
                icon: Icons.code_rounded,
                title: s.openSourceLicenses,
                subtitle: s.licensesSubtitle,
                iconColor: AccountTheme.settings,
                onTap: () => context.push('/licenses'),
              ),
            ],
          ),
          const SizedBox(height: AccountTheme.sectionGap),
          ProfileSectionTitle(s.website, icon: Icons.language_rounded),
          ProfileMenuCard(
            children: [
              ProfileMenuTile(
                icon: Icons.shop_rounded,
                title: s.rateOnPlayStore,
                subtitle: 'Google Play',
                iconColor: CartTheme.brand,
                onTap: () => openExternalUrl(AppConfig.playStoreUrl),
              ),
              ProfileMenuTile(
                icon: Icons.public_rounded,
                title: AppConfig.appDomain,
                subtitle: s.visitWebsite,
                iconColor: CartTheme.brand,
                onTap: () => openExternalUrl(AppConfig.appOrigin),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AboutHeader extends StatelessWidget {
  final AppStrings s;
  final String version;

  const _AboutHeader({required this.s, required this.version});

  @override
  Widget build(BuildContext context) {
    return ProfileSurfaceCard(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Image.asset(
              'assets/images/alhayaa_logo.png',
              width: 80,
              height: 80,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            AppConfig.displayStoreName(s.lang),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: CartTheme.charcoal,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${s.version} $version',
            style: ProfileUi.captionStyle(),
          ),
          const SizedBox(height: 16),
          Text(
            s.aboutDescription,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              height: 1.55,
              color: CartTheme.charcoal.withValues(alpha: 0.72),
            ),
          ),
        ],
      ),
    );
  }
}
