import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/app_config.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/phone_util.dart';
import '../../../core/utils/support_links.dart';
import '../../../core/widgets/app_snackbar.dart';
import 'account_strings.dart';
import 'profile_ui.dart';
import '../../worlds/worlds_provider.dart';

/// يفتح رابط تواصل (واتساب، اتصال، بريد، موقع) — وإن لم يفتح شيء (لا تطبيق بريد
/// على الجهاز مثلاً) ينسخ [copyText] ويخبرها، بدل ضغطة لا تفعل شيئاً.
Future<void> launchSupportLink(
  BuildContext context,
  Future<bool> Function() open,
  String copyText,
) async {
  var ok = false;
  try {
    ok = await open();
  } catch (_) {
    ok = false;
  }
  if (ok || !context.mounted) return;
  await Clipboard.setData(ClipboardData(text: copyText));
  if (!context.mounted) return;
  final s = ProviderScope.containerOf(context, listen: false).read(stringsProvider);
  final label = copyText.startsWith('http') ? s.linkCopied : s.copied;
  AppSnackbar.show(context, '$label — $copyText');
}

/// قسم الدعم — المساعدة، ثم واتساب/هاتف من إعدادات المتجر + بريد ثابت دائماً.
class SupportContactSection extends ConsumerWidget {
  final AppStrings s;

  /// صف «المساعدة والأسئلة الشائعة» أولاً — يُخفى داخل شاشة المساعدة نفسها.
  final bool showHelp;

  const SupportContactSection({super.key, required this.s, this.showHelp = true});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // آخر إعدادات معروفة (محفوظة) — أرقام التواصل تظهر حتى بلا شبكة.
    final settings = ref.watch(storeSettingsProvider);
    final whatsapp = settings?.whatsapp?.trim();
    final phone = settings?.supportPhone?.trim();
    final email = AppConfig.supportEmail;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ProfileSectionTitle(s.support),
        ProfileMenuCard(
          children: [
            if (showHelp)
              ProfileMenuTile(
                icon: Icons.help_outline_rounded,
                title: s.helpAndFaq,
                subtitle: s.acctHelpHint,
                onTap: () => context.push('/help'),
              ),
            if (whatsapp != null && whatsapp.isNotEmpty)
              ProfileMenuTile(
                icon: Icons.chat_outlined,
                title: s.whatsappSupport,
                subtitle: s.acctSupportChatHint,
                onTap: () => launchSupportLink(
                  context,
                  () => openWhatsApp(whatsapp, message: s.whatsappHelpMessage),
                  formatPhoneLocal(whatsapp),
                ),
              ),
            if (phone != null && phone.isNotEmpty)
              ProfileMenuTile(
                icon: Icons.phone_outlined,
                title: s.callUs,
                subtitle: phone,
                subtitleLtr: true,
                onTap: () => launchSupportLink(context, () => callPhone(phone), phone),
              ),
            ProfileMenuTile(
              icon: Icons.email_outlined,
              title: s.emailSupport,
              subtitle: email,
              subtitleLtr: true,
              onTap: () => launchSupportLink(context, () => openEmail(email), email),
            ),
          ],
        ),
      ],
    );
  }
}
