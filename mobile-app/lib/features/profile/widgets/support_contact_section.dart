import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/support_links.dart';
import '../../catalog/catalog_providers.dart';
import 'account_strings.dart';
import 'profile_ui.dart';

/// قسم الدعم — واتساب/هاتف من إعدادات المتجر + بريد ثابت دائماً.
class SupportContactSection extends ConsumerWidget {
  final AppStrings s;

  const SupportContactSection({super.key, required this.s});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref
        .watch(homeFeedProvider)
        .maybeWhen(data: (d) => d.settings, orElse: () => null);
    final whatsapp = settings?.whatsapp;
    final phone = settings?.supportPhone;
    final email = AppConfig.supportEmail;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ProfileSectionTitle(s.support),
        ProfileMenuCard(
          children: [
            if (whatsapp != null && whatsapp.isNotEmpty)
              ProfileMenuTile(
                icon: Icons.chat_outlined,
                title: s.whatsappSupport,
                subtitle: s.acctSupportChatHint,
                onTap: () =>
                    openWhatsApp(whatsapp, message: s.whatsappHelpMessage),
              ),
            if (phone != null && phone.isNotEmpty)
              ProfileMenuTile(
                icon: Icons.phone_outlined,
                title: s.callUs,
                subtitle: phone,
                onTap: () => callPhone(phone),
              ),
            ProfileMenuTile(
              icon: Icons.email_outlined,
              title: s.emailSupport,
              subtitle: email,
              onTap: () => openEmail(email),
            ),
          ],
        ),
      ],
    );
  }
}
