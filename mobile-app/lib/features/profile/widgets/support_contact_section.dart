import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/support_links.dart';
import '../../cart/widgets/cart_theme.dart';
import '../../catalog/catalog_providers.dart';
import 'account_theme.dart';
import 'profile_ui.dart';

/// قسم الدعم — واتساب/هاتف من إعدادات المتجر + بريد ثابت دائماً.
class SupportContactSection extends ConsumerWidget {
  final AppStrings s;

  const SupportContactSection({super.key, required this.s});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(homeFeedProvider).maybeWhen(data: (d) => d.settings, orElse: () => null);
    final whatsapp = settings?.whatsapp;
    final phone = settings?.supportPhone;
    final email = AppConfig.supportEmail;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ProfileSectionTitle(s.support, icon: Icons.support_agent_outlined),
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
            ProfileMenuTile(
              icon: Icons.email_outlined,
              title: s.emailSupport,
              subtitle: email,
              iconColor: AccountTheme.settings,
              onTap: () => openEmail(email, subject: s.isAr ? 'دعم ديما الحياة' : 'deema alhayat support'),
            ),
          ],
        ),
      ],
    );
  }
}
