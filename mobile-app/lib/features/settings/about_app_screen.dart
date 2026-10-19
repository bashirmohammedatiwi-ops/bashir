import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/providers/app_info_provider.dart';
import '../../core/widgets/ui/ui.dart';
import '../../core/utils/support_links.dart';
import '../profile/widgets/account_theme.dart';
import '../profile/widgets/profile_ui.dart';
import '../profile/widgets/support_contact_section.dart';
import 'legal_document_screen.dart';
import '../../features/worlds/world_theme.dart';
import '../../core/brand/brand_logo.dart';

class AboutAppScreen extends ConsumerWidget {
  const AboutAppScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final version = ref.watch(appVersionLabelProvider);

    return ProfileScaffold(
      title: s.aboutApp,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          ProfileUi.hPad,
          16,
          ProfileUi.hPad,
          32,
        ),
        children: [
          _AboutHeader(s: s, version: version),
          const SizedBox(height: AccountTheme.sectionGap),
          ProfileSectionTitle(s.legalSection),
          ProfileMenuCard(
            children: [
              ProfileMenuTile(
                icon: Icons.privacy_tip_outlined,
                title: s.privacyPolicy,
                onTap: () =>
                    openLegalDocument(context, LegalDocumentType.privacy),
              ),
              ProfileMenuTile(
                icon: Icons.description_outlined,
                title: s.termsOfService,
                onTap: () =>
                    openLegalDocument(context, LegalDocumentType.terms),
              ),
              ProfileMenuTile(
                icon: Icons.code_rounded,
                title: s.openSourceLicenses,
                subtitle: s.licensesSubtitle,
                onTap: () => context.push('/licenses'),
              ),
            ],
          ),
          const SizedBox(height: AccountTheme.sectionGap),
          SupportContactSection(s: s),
          const SizedBox(height: AccountTheme.sectionGap),
          ProfileSectionTitle(s.website),
          ProfileMenuCard(
            children: [
              ProfileMenuTile(
                icon: Icons.public_rounded,
                title: AppConfig.appDomain,
                subtitle: s.visitWebsite,
                // لا متصفح يفتح: ننسخ العنوان بدل ضغطة صامتة.
                onTap: () => launchSupportLink(
                  context,
                  () => openExternalUrl(AppConfig.appOrigin),
                  AppConfig.appOrigin,
                ),
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
    final t = context.worldTheme;
    return ProfileSurfaceCard(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: t.signatureGradient,
              boxShadow: [
                BoxShadow(
                  color: t.accentDark.withValues(alpha: 0.2),
                  blurRadius: 18,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: t.surface,
              ),
              child: const SizedBox(
                width: 80,
                height: 80,
                child: Center(child: BrandMark(height: 54, weight: 0.8)),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            AppConfig.displayStoreName(s.lang),
            textAlign: TextAlign.center,
            style: AppText.title1.copyWith(color: t.ink),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: t.accentLight,
              borderRadius: BorderRadius.circular(AppCorners.pill),
              border: Border.all(color: t.accentSoft),
            ),
            child: Text(
              '${s.version} $version',
              style: AppText.micro.copyWith(color: t.accentDark),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            s.aboutDescription,
            textAlign: TextAlign.center,
            style: AppText.body.copyWith(color: t.inkSoft),
          ),
        ],
      ),
    );
  }
}
