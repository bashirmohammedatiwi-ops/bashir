import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_fonts.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/utils/support_links.dart';
import '../../auth/auth_provider.dart';
import '../../cart/cart_provider.dart';
import '../../profile/profile_providers.dart';
import '../../worlds/world_theme.dart';
import '../../worlds/worlds_provider.dart';

/// وصف زر بشارة لقارئ الشاشة: «الإشعارات، 3 جديدة».
extension _HeroHeaderStrings on AppStrings {
  String withBadge(String label, int n) =>
      n <= 0 ? label : (isAr ? '$label، $n جديدة' : '$label, $n new');
}

/// رأس الرئيسية — نظيف على خلفية بيضاء.
class HomeHeroHeader extends ConsumerWidget {
  final bool overBanner;

  const HomeHeroHeader({super.key, this.overBanner = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final topPad = MediaQuery.paddingOf(context).top;
    final whatsapp = ref.watch(storeSettingsProvider)?.whatsapp;
    final auth = ref.watch(authProvider);
    final unread = auth.isAuthenticated
        ? ref.watch(unreadNotificationsCountProvider)
        : 0;
    final cartCount = ref.watch(cartProvider).count;
    final s = ref.s;
    final t = context.worldTheme;

    final iconColor = overBanner ? Colors.white : t.ink;
    if (overBanner) {
      // شريط واحد هادئ: بحث (مع زر مسح الباركود داخله) + الإشعارات + الدعم.
      return Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(14, 6, 10, 0),
        child: Row(
          children: [
            Expanded(
              child: _BannerSearchField(
                hint: s.searchHintHome,
                scanLabel: s.scanBarcode,
                onSearch: () => context.push('/search'),
                onScan: () => context.push('/scan'),
              ),
            ),
            const SizedBox(width: 8),
            _GlassRoundButton(
              icon: Icons.notifications_none_rounded,
              label: s.withBadge(s.notifications, unread),
              badge: unread,
              onTap: () => context.push('/notifications'),
            ),
            if (whatsapp != null && whatsapp.isNotEmpty) ...[
              const SizedBox(width: 8),
              _GlassRoundButton(
                icon: Icons.support_agent_rounded,
                label: s.whatsappSupport,
                onTap: () =>
                    openWhatsApp(whatsapp, message: s.whatsappHelpMessage),
              ),
            ],
          ],
        ),
      );
    }
    return Padding(
      padding: EdgeInsets.fromLTRB(8, overBanner ? 4 : topPad + 8, 8, 0),
      child: Row(
        children: [
          if (whatsapp != null && whatsapp.isNotEmpty)
            IconButton(
              onPressed: () =>
                  openWhatsApp(whatsapp, message: s.whatsappHelpMessage),
              tooltip: s.whatsappSupport,
              visualDensity: VisualDensity.compact,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
              icon: Icon(
                Icons.support_agent_rounded,
                color: iconColor,
                size: 25,
              ),
            )
          else
            IconButton(
              onPressed: () => openCartTab(
                context,
                ProviderScope.containerOf(context, listen: false),
              ),
              tooltip: s.withBadge(s.navCart, cartCount),
              visualDensity: VisualDensity.compact,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
              icon: Badge(
                isLabelVisible: cartCount > 0,
                label: Text(cartCount > 9 ? '9+' : '$cartCount'),
                child: Icon(
                  Icons.shopping_bag_outlined,
                  size: 24,
                  color: iconColor,
                ),
              ),
            ),
          const SizedBox(width: 4),
          Expanded(
            child: Container(
              height: 42,
              decoration: BoxDecoration(
                color: t.surface,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: t.divider),
                boxShadow: overBanner
                    ? [
                        BoxShadow(
                          color: t.ink.withValues(alpha: 0.18),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : t.cardShadow,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => context.push('/search'),
                      borderRadius: BorderRadius.circular(22),
                      child: Padding(
                        padding: const EdgeInsetsDirectional.only(start: 12),
                        child: Row(
                          children: [
                            Icon(
                              Icons.search_rounded,
                              size: 20,
                              color: t.inkMuted,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                s.searchHintHome,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: appFont(
                                  fontSize: 13,
                                  color: t.inkMuted,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => context.push('/scan'),
                    tooltip: s.scanBarcode,
                    visualDensity: VisualDensity.compact,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(
                      minWidth: 44,
                      minHeight: 42,
                    ),
                    icon: Icon(
                      Icons.qr_code_scanner_rounded,
                      size: 20,
                      color: t.inkSoft,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 2),
          IconButton(
            onPressed: () => context.push('/notifications'),
            tooltip: s.withBadge(s.notifications, unread),
            visualDensity: VisualDensity.compact,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            icon: Badge(
              isLabelVisible: unread > 0,
              label: Text(unread > 9 ? '9+' : '$unread'),
              child: Icon(
                Icons.notifications_none_rounded,
                size: 26,
                color: iconColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GlassRoundButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final String label;
  final int badge;

  const _GlassRoundButton({
    required this.icon,
    required this.onTap,
    required this.label,
    this.badge = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      onTap: onTap,
      child: _button(),
    );
  }

  Widget _button() {
    // بلا BackdropFilter: تمويه ما خلف زر 44 نقطة يُعاد كل إطار على Impeller
    // ولا يكاد يُرى — تعبئة أكثف قليلاً تعطي نفس الحضور الزجاجي.
    return ClipOval(
      child: Material(
        color: Colors.white.withValues(alpha: 0.26),
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withValues(alpha: 0.18),
                  Colors.transparent,
                ],
              ),
              border: Border.all(color: Colors.white.withValues(alpha: 0.30)),
            ),
            child: Center(
              child: Badge(
                isLabelVisible: badge > 0,
                backgroundColor: AppColors.sale,
                label: Text(
                  badge > 9 ? '9+' : '$badge',
                  style: const TextStyle(fontSize: 9),
                ),
                child: Icon(icon, size: 22, color: Colors.white),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BannerSearchField extends StatelessWidget {
  final String hint;
  final String scanLabel;
  final VoidCallback onSearch;
  final VoidCallback onScan;

  const _BannerSearchField({
    required this.hint,
    required this.scanLabel,
    required this.onSearch,
    required this.onScan,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    // تعبئة 93% معتمة: التمويه خلفها لا يُرى، وكلفته (saveLayer + blur كل إطار) كاملة.
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: Material(
        color: Colors.white.withValues(alpha: 0.93),
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onSearch();
          },
          child: Container(
            height: 46,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.white.withValues(alpha: 0.7)),
            ),
            child: Row(
              children: [
                const SizedBox(width: 14),
                Icon(Icons.search_rounded, size: 21, color: t.inkSoft),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    hint,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: appFont(
                      fontSize: 13.5,
                      color: t.inkMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                Container(width: 1, height: 22, color: t.hairline),
                Semantics(
                  button: true,
                  label: scanLabel,
                  child: InkWell(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      onScan();
                    },
                    customBorder: const CircleBorder(),
                    child: SizedBox(
                      width: 46,
                      height: 46,
                      child: Icon(
                        Icons.qr_code_scanner_rounded,
                        size: 21,
                        color: t.accentDark,
                      ),
                    ),
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
