import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/utils/support_links.dart';
import '../../core/widgets/ui/ui.dart';
import '../profile/widgets/account_strings.dart';
import '../profile/widgets/profile_ui.dart';
import '../../features/worlds/world_theme.dart';

enum LegalDocumentType { privacy, terms }

class LegalDocumentScreen extends ConsumerWidget {
  final LegalDocumentType type;

  const LegalDocumentScreen({super.key, required this.type});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final title = type == LegalDocumentType.privacy
        ? s.privacyPolicy
        : s.termsOfService;
    final body = type == LegalDocumentType.privacy
        ? _privacyBody(s)
        : _termsBody(s);

    final t = context.worldTheme;

    return ProfileScaffold(
      title: title,
      body: SelectionArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            ProfileUi.hPad,
            20,
            ProfileUi.hPad,
            32,
          ),
          children: [
            Text(title, style: AppText.title1.copyWith(color: t.ink)),
            const SizedBox(height: 6),
            Text(
              s.acctLastUpdated,
              style: AppText.caption.copyWith(color: t.inkMuted),
            ),
            const SizedBox(height: 16),
            ProfileInfoBanner(
              icon: Icons.info_outline_rounded,
              text: s.legalInAppNotice,
            ),
            const SizedBox(height: 16),
            ProfileSurfaceCard(
              padding: const EdgeInsets.fromLTRB(18, 20, 18, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  for (final block in _blocks(body)) _LegalBlock(lines: block),
                ],
              ),
            ),
            const SizedBox(height: 20),
            ProfileOutlineButton(
              label: s.viewOnWebsite,
              icon: Icons.open_in_new_rounded,
              onPressed: () async {
                final url = type == LegalDocumentType.privacy
                    ? AppConfig.privacyPolicyUrlFor(s.lang)
                    : AppConfig.termsOfServiceUrlFor(s.lang);
                final ok = await openExternalUrl(url);
                if (!context.mounted) return;
                if (!ok) AppSnackbar.error(context, s.linkOpenFailed);
              },
            ),
          ],
        ),
      ),
    );
  }

  /// يقسم النص إلى فقرات (كتل مفصولة بسطر فارغ) — للعرض فقط.
  static List<List<String>> _blocks(String body) => body
      .trim()
      .split(RegExp(r'\n\s*\n'))
      .map(
        (b) => b
            .split('\n')
            .map((l) => l.trim())
            .where((l) => l.isNotEmpty)
            .toList(),
      )
      .where((b) => b.isNotEmpty)
      .toList();

  static String _privacyBody(AppStrings s) {
    if (s.isAr) {
      return '''
نحن في ديما الحياة نحترم خصوصيتك. توضّح هذه السياسة البيانات التي نجمعها وكيف نستخدمها.

البيانات التي نجمعها
• الاسم ورقم الهاتف عند إنشاء الحساب أو إتمام الطلب.
• عناوين التوصيل التي تضيفينها.
• سجل الطلبات والمفضلة ونقاط الولاء المرتبطة بحسابك.
• إشعارات داخل التطبيق (قائمة حسابي) عند تسجيل الدخول.

كيف نستخدم البيانات
• معالجة الطلبات والتوصيل والدعم.
• تحسين تجربة التسوق والعروض.
• التواصل بخصوص حالة الطلب.

مشاركة البيانات
لا نبيع بياناتك الشخصية. نشارك الحد الأدنى اللازم مع شركاء التوصيل لتسليم طلبك.

الاحتفاظ بالبيانات
نحتفظ ببيانات الحساب طالما كان نشطاً. يمكنك حذف حسابك من التطبيق (حسابي ← حذف الحساب).

حقوقك
يمكنك تعديل بياناتك أو حذف حسابك من داخل التطبيق، أو التواصل معنا عبر قنوات الدعم.

التواصل
البريد: support@deemaalhayat.com
الموقع: https://deemaalhayat.com
''';
    }
    return '''
At Deema Alhayat we respect your privacy. This policy explains what we collect and how we use it.

Data we collect
• Name and phone number when you register or place an order.
• Delivery addresses you save.
• Order history, wishlist, and loyalty points linked to your account.
• In-app notifications (Account → Notifications) when signed in.

How we use data
• Process orders, delivery, and customer support.
• Improve shopping experience and relevant offers.
• Contact you about order status.

Sharing
We do not sell your personal data. We share only what is necessary with delivery partners to fulfill your order.

Retention
We keep account data while your account is active. You can delete your account in the app (Account → Delete Account).

Your rights
You may update or delete your account in the app, or contact us through support channels.

Contact
Email: support@deemaalhayat.com
Website: https://deemaalhayat.com
''';
  }

  static String _termsBody(AppStrings s) {
    if (s.isAr) {
      return '''
باستخدام تطبيق ديما الحياة فإنك توافقين على الشروط التالية:

الخدمة
التطبيق يتيح تصفح المنتجات وطلبها مع الدفع عند الاستلام (COD) ما لم يُفعّل لاحقاً الدفع الإلكتروني.

الحساب
• يجب تقديم معلومات صحيحة (الاسم، الهاتف، العنوان).
• أنتِ مسؤولة عن سرية كلمة المرور.
• يحق لنا تعليق الحساب عند إساءة الاستخدام.

الطلبات والأسعار
• الأسعار بالدينار العراقي وقد تتغير دون إشعار مسبق.
• نؤكد الطلب عبر الهاتف أو الإشعارات قبل الشحن.
• يمكن إلغاء الطلب قبل التجهيز وفق سياسة المتجر.

الدفع والتوصيل
الدفع عند الاستلام نقداً ما لم يُذكر خلاف ذلك. أوقات التوصيل تقديرية وقد تتأثر بعوامل خارجة عن إرادتنا.

الملكية الفكرية
العلامات والصور والمحتوى مملوكة لديما الحياة أو مورّديها ولا يجوز نسخها دون إذن.

إنهاء الخدمة
يمكنك حذف حسابك من التطبيق. نحتفظ بسجلات الطلبات السابقة للأغراض القانونية والمحاسبية.

القانون الحاكم
تخضع هذه الشروط للقوانين المعمول بها في جمهورية العراق.

التواصل: support@deemaalhayat.com
''';
    }
    return '''
By using the Deema Alhayat app you agree to these terms:

Service
The app lets you browse and order products with cash on delivery (COD) unless online payment is enabled later.

Account
• Provide accurate information (name, phone, address).
• You are responsible for keeping your password secure.
• We may suspend accounts for misuse.

Orders & pricing
• Prices are in Iraqi dinar and may change without prior notice.
• We confirm orders by phone or notification before shipping.
• Cancellation before fulfillment follows store policy.

Payment & delivery
Cash on delivery unless stated otherwise. Delivery times are estimates and may vary.

Intellectual property
Brands, images, and content belong to Deema Alhayat or suppliers and may not be copied without permission.

Termination
You may delete your account in the app. Past order records may be retained for legal and accounting purposes.

Governing law
These terms are governed by applicable laws in the Republic of Iraq.

Contact: support@deemaalhayat.com
''';
  }
}

void openLegalDocument(BuildContext context, LegalDocumentType type) {
  final path = type == LegalDocumentType.privacy ? '/privacy' : '/terms';
  context.push(path);
}

class _LegalBlock extends StatelessWidget {
  final List<String> lines;
  const _LegalBlock({required this.lines});

  bool _isBullet(String l) => l.startsWith('•');

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final bodyStyle = AppText.body.copyWith(color: t.inkSoft, height: 1.7);
    final first = lines.first;
    final hasHeading =
        lines.length > 1 && !_isBullet(first) && first.length <= 40;
    final rest = hasHeading ? lines.sublist(1) : lines;

    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (hasHeading) ...[
            Text(first, style: AppText.title3.copyWith(color: t.ink)),
            const SizedBox(height: 6),
          ],
          for (final l in rest)
            if (_isBullet(l))
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      margin: const EdgeInsetsDirectional.only(
                        top: 10,
                        end: 10,
                        start: 2,
                      ),
                      decoration: BoxDecoration(
                        color: t.accent,
                        shape: BoxShape.circle,
                      ),
                    ),
                    Expanded(
                      child: Text(l.substring(1).trim(), style: bodyStyle),
                    ),
                  ],
                ),
              )
            else
              Text(l, style: bodyStyle),
        ],
      ),
    );
  }
}
