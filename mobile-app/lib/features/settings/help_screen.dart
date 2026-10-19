import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/json.dart';
import '../../core/widgets/responsive_app.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/loyalty_rules.dart';
import '../../data/models/store_settings.dart';
import '../catalog/catalog_providers.dart';
import '../profile/profile_providers.dart';
import '../profile/widgets/account_strings.dart';
import '../profile/widgets/account_theme.dart';
import '../profile/widgets/profile_ui.dart';
import '../profile/widgets/support_contact_section.dart';
import '../worlds/world_theme.dart';
import '../worlds/worlds_provider.dart';

/// مركز المساعدة: أجوبة سريعة (نفس صفحة المساعدة في الموقع) مجمّعة حسب الموضوع،
/// جدول التوصيل لكل محافظة، ثم قنوات التواصل — حتى لا يتحوّل كل سؤال لمحادثة.
class HelpScreen extends ConsumerWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final settings = ref.watch(storeSettingsProvider);
    final rules = ref.watch(loyaltyRulesProvider);
    final zones = ref.watch(shippingZonesProvider);

    return ProfileScaffold(
      title: s.helpAndFaq,
      // نص للقراءة: يتبع تكبير الخط في النظام حتى 1.6.
      body: LargeTextScope(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            ProfileUi.hPad,
            16,
            ProfileUi.hPad,
            32,
          ),
          children: [
            _HelpIntro(title: s.helpTitle, subtitle: s.helpSubtitle),
            for (final group in _groups(s, settings, rules)) ...[
              const SizedBox(height: AccountTheme.sectionGap),
              ProfileSectionTitle(group.title, icon: group.icon),
              ProfileMenuCard(
                children: [
                  for (final faq in group.items) _FaqTile(faq: faq),
                ],
              ),
            ],
            ...zones.maybeWhen(
              data: (list) => list.isEmpty
                  ? const <Widget>[]
                  : [
                      const SizedBox(height: AccountTheme.sectionGap),
                      ProfileSectionTitle(
                        s.helpDeliveryTable,
                        icon: Icons.local_shipping_outlined,
                      ),
                      _DeliveryTable(zones: list, s: s),
                    ],
              orElse: () => const <Widget>[],
            ),
            const SizedBox(height: AccountTheme.sectionGap),
            ProfileMenuCard(
              children: [
                ProfileMenuTile(
                  icon: Icons.receipt_long_outlined,
                  title: s.helpTrackOrder,
                  onTap: () => context.push('/orders'),
                ),
                ProfileMenuTile(
                  icon: Icons.face_retouching_natural_outlined,
                  title: s.helpSkinQuiz,
                  onTap: () => context.push('/skin-quiz'),
                ),
                // «ديما» بالعربي فقط.
                if (s.isAr)
                  ProfileMenuTile(
                    icon: Icons.auto_awesome_outlined,
                    title: s.helpAskDeema,
                    onTap: () => openAssistantTab(
                      context,
                      ProviderScope.containerOf(context, listen: false),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: AccountTheme.sectionGap),
            SupportContactSection(s: s, showHelp: false),
          ],
        ),
      ),
    );
  }

  static List<_FaqGroup> _groups(
    AppStrings s,
    StoreSettings? settings,
    LoyaltyRules rules,
  ) {
    final threshold = settings?.freeShippingThreshold ?? 0;
    final pickup = settings != null && settings.pickupEnabled;
    // «2.5» لا «2.50»، و«1» لا «1.0».
    String trim(double v) => v == v.roundToDouble() ? v.toStringAsFixed(0) : '$v';
    return [
      _FaqGroup(s.helpDelivery, Icons.local_shipping_outlined, [
        _Faq(
          s.helpQDeliveryFee,
          s.helpADeliveryFee(threshold > 0 ? formatPrice(threshold, lang: s.lang) : null),
        ),
        if (pickup)
          _Faq(s.helpQPickup, s.helpAPickup(settings.pickupAddress, settings.pickupHours)),
      ]),
      _FaqGroup(s.helpOrders, Icons.receipt_long_outlined, [
        _Faq(s.helpQCancel, s.helpACancel),
        _Faq(s.helpQGift, s.helpAGift),
      ]),
      _FaqGroup(s.helpPayment, Icons.payments_outlined, [
        _Faq(s.helpQPay, s.helpAPay),
      ]),
      _FaqGroup(s.helpPoints, Icons.stars_outlined, [
        _Faq(
          s.helpQPoints,
          s.helpAPoints(
            earnPercent: trim(rules.earnPercent),
            pointValue: formatPrice(rules.pointValue, lang: s.lang),
            redeemStep: rules.redeemStep,
            firstOrderBonus: rules.firstOrderBonus,
          ),
        ),
      ]),
      _FaqGroup(s.helpProducts, Icons.verified_outlined, [
        _Faq(s.helpQOriginal, s.helpAOriginal),
        _Faq(s.helpQDamaged, s.helpADamaged),
        _Faq(s.helpQShade, s.helpAShade),
        _Faq(s.helpQRestock, s.helpARestock),
      ]),
    ];
  }
}

class _Faq {
  final String question;
  final String answer;
  const _Faq(this.question, this.answer);
}

class _FaqGroup {
  final String title;
  final IconData icon;
  final List<_Faq> items;
  const _FaqGroup(this.title, this.icon, this.items);
}

class _HelpIntro extends StatelessWidget {
  final String title;
  final String subtitle;
  const _HelpIntro({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return ProfileSurfaceCard(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
      child: Row(
        children: [
          AccountTheme.iconTile(context, Icons.support_agent_rounded, size: 52),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppText.title2.copyWith(color: t.ink)),
                const SizedBox(height: 4),
                Text(subtitle, style: AppText.bodySmall.copyWith(color: t.inkSoft)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// سؤال يتوسّع لجوابه — نفس شكل صفوف التراخيص.
class _FaqTile extends StatelessWidget {
  final _Faq faq;
  const _FaqTile({required this.faq});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final still = MediaQuery.disableAnimationsOf(context);
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: const EdgeInsetsDirectional.fromSTEB(16, 2, 12, 2),
        childrenPadding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 16),
        minTileHeight: ProfileUi.rowMinHeight,
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        iconColor: t.accentDark,
        collapsedIconColor: t.inkMuted,
        expansionAnimationStyle: still ? AnimationStyle.noAnimation : null,
        title: Text(faq.question, style: ProfileUi.bodyStyle(context)),
        onExpansionChanged: (_) => HapticFeedback.selectionClick(),
        children: [
          SelectableText(
            faq.answer,
            style: AppText.body.copyWith(color: t.inkSoft, height: 1.7),
          ),
        ],
      ),
    );
  }
}

/// سعر ومدة التوصيل لكل محافظة كما في لوحة التحكم.
class _DeliveryTable extends StatelessWidget {
  final List<Map<String, dynamic>> zones;
  final AppStrings s;
  const _DeliveryTable({required this.zones, required this.s});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final rows = [
      for (final z in zones)
        if (asString(z['governorate']).isNotEmpty) z,
    ];
    return ProfileSurfaceCard(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            if (i > 0) Divider(height: 1, thickness: 1, color: t.divider),
            _zoneRow(context, rows[i]),
          ],
        ],
      ),
    );
  }

  Widget _zoneRow(BuildContext context, Map<String, dynamic> z) {
    final t = context.worldTheme;
    final fee = z['standardFee'] == null ? null : asInt(z['standardFee']);
    final hasDays = z['deliveryDaysMin'] != null || z['deliveryDaysMax'] != null;
    final minDays = asInt(z['deliveryDaysMin'], 1);
    final maxDays = asInt(z['deliveryDaysMax'], minDays);
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 48),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            Expanded(
              child: Text(
                s.governorateName(asString(z['governorate'])),
                style: AppText.label.copyWith(color: t.ink),
              ),
            ),
            if (hasDays) ...[
              const SizedBox(width: 8),
              Text(
                s.helpDays(minDays, maxDays),
                style: AppText.caption.copyWith(color: t.inkMuted),
              ),
            ],
            if (fee != null) ...[
              const SizedBox(width: 12),
              Text(
                fee <= 0 ? s.free : formatPrice(fee, lang: s.lang),
                style: AppText.label.copyWith(color: t.accentDark),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
