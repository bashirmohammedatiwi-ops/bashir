import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_fonts.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/utils/support_links.dart';
import '../../auth/auth_provider.dart';
import '../../cart/cart_provider.dart';
import '../../catalog/catalog_providers.dart';
import '../../profile/profile_providers.dart';
import '../../worlds/world_theme.dart';
import 'home_animations.dart';
import 'home_theme.dart';

/// رأس الرئيسية — نظيف على خلفية بيضاء.
class HomeHeroHeader extends ConsumerWidget {
  final bool overBanner;

  const HomeHeroHeader({super.key, this.overBanner = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final topPad = MediaQuery.paddingOf(context).top;
    final feed = ref.watch(homeFeedProvider).valueOrNull;
    final whatsapp = feed?.settings.whatsapp;
    final auth = ref.watch(authProvider);
    final unread =
        auth.isAuthenticated ? ref.watch(unreadNotificationsCountProvider) : 0;
    final cartCount = ref.watch(cartProvider).count;
    final s = ref.s;
    final t = context.worldTheme;

    final iconColor = overBanner ? Colors.white : t.ink;
    if (overBanner) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(12, 6, 12, 0),
        child: Row(
          children: [
            _GlassRoundButton(
              icon: Icons.notifications_none_rounded,
              badge: unread,
              onTap: () => context.push('/notifications'),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _BannerSearchField(
                hint: s.searchHintHome,
                onSearch: () => context.push('/search'),
              ),
            ),
            const SizedBox(width: 8),
            _GlassRoundButton(
              icon: Icons.barcode_reader,
              onTap: () => context.push('/scan'),
            ),
            if (whatsapp != null && whatsapp.isNotEmpty) ...[
              const SizedBox(width: 8),
              _GlassRoundButton(
                icon: Icons.chat_rounded,
                iconColor: const Color(0xFF25D366),
                onTap: () => openWhatsApp(whatsapp, message: s.whatsappHelpMessage),
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
              onPressed: () => openWhatsApp(whatsapp, message: s.whatsappHelpMessage),
              visualDensity: VisualDensity.compact,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
              icon: const Icon(Icons.chat_rounded, color: Color(0xFF25D366), size: 26),
            )
          else
            IconButton(
              onPressed: () => openCartTab(context, ProviderScope.containerOf(context, listen: false)),
              visualDensity: VisualDensity.compact,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
              icon: Badge(
                isLabelVisible: cartCount > 0,
                label: Text(cartCount > 9 ? '9+' : '$cartCount'),
                child: Icon(Icons.shopping_bag_outlined, size: 24, color: iconColor),
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
                    ? [BoxShadow(color: t.ink.withValues(alpha: 0.18), blurRadius: 14, offset: const Offset(0, 4))]
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
                            Icon(Icons.search_rounded, size: 20, color: t.inkMuted),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                s.searchHintHome,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: appFont(fontSize: 13, color: t.inkMuted, fontWeight: FontWeight.w500),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => context.push('/scan'),
                    visualDensity: VisualDensity.compact,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                    icon: Icon(Icons.photo_camera_outlined, size: 20, color: t.inkSoft),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 2),
          IconButton(
            onPressed: () => context.push('/notifications'),
            visualDensity: VisualDensity.compact,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
            icon: Badge(
              isLabelVisible: unread > 0,
              label: Text(unread > 9 ? '9+' : '$unread'),
              child: Icon(Icons.notifications_none_rounded, size: 26, color: iconColor),
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
  final int badge;
  final Color iconColor;

  const _GlassRoundButton({
    required this.icon,
    required this.onTap,
    this.badge = 0,
    this.iconColor = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return ClipOval(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Material(
          color: Colors.white.withValues(alpha: 0.22),
          child: InkWell(
            onTap: () {
              HapticFeedback.selectionClick();
              onTap();
            },
            child: SizedBox(
              width: 44,
              height: 44,
              child: Badge(
                isLabelVisible: badge > 0,
                backgroundColor: AppColors.roseDeep,
                label: Text(badge > 9 ? '9+' : '$badge', style: const TextStyle(fontSize: 9)),
                child: Icon(icon, size: 22, color: iconColor),
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
  final VoidCallback onSearch;

  const _BannerSearchField({required this.hint, required this.onSearch});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(23),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Material(
          color: Colors.white.withValues(alpha: 0.92),
          child: InkWell(
            onTap: onSearch,
            child: SizedBox(
              height: 44,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Row(
                  children: [
                    Icon(Icons.search_rounded, size: 20, color: AppColors.textSecondary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        hint,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: appFont(fontSize: 13.5, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BrandActionBar extends StatelessWidget {
  final String storeName;
  final String lang;
  final int unread;
  final int cartCount;
  final String? whatsapp;
  final AppStrings s;
  final VoidCallback onCart;
  final VoidCallback onNotifications;

  const _BrandActionBar({
    required this.storeName,
    required this.lang,
    required this.unread,
    required this.cartCount,
    required this.whatsapp,
    required this.s,
    required this.onCart,
    required this.onNotifications,
  });

  @override
  Widget build(BuildContext context) {
    final narrow = Responsive.isNarrow(context);
    final logoSize = narrow ? 40.0 : 46.0;
    final iconSize = narrow ? 36.0 : 40.0;
    final titleSize = Responsive.isCompact(context) ? 21.0 : (narrow ? 22.0 : 24.0);
    final t = context.worldTheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Image.asset(
          'assets/images/app_icon_source.png',
          width: logoSize,
          height: logoSize,
          fit: BoxFit.contain,
        ),
        SizedBox(width: narrow ? 10 : 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              StoreBrandTitle(
                name: storeName,
                lang: lang,
                size: titleSize,
                color: t.ink,
              ),
              const SizedBox(height: 2),
              Text(
                s.storeTagline,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: HomeTheme.body(size: 11.5, color: t.inkMuted),
              ),
            ],
          ),
        ),
        _HeaderIconButton(
          size: iconSize,
          icon: Icons.shopping_bag_outlined,
          badge: cartCount,
          onTap: onCart,
        ),
        SizedBox(width: narrow ? 2 : 4),
        _HeaderIconButton(
          size: iconSize,
          icon: Icons.notifications_none_rounded,
          badge: unread,
          onTap: onNotifications,
        ),
        if (whatsapp != null && whatsapp!.isNotEmpty) ...[
          SizedBox(width: narrow ? 2 : 4),
          _HeaderIconButton(
            size: iconSize,
            icon: Icons.chat_rounded,
            iconColor: const Color(0xFF25D366),
            onTap: () => openWhatsApp(whatsapp, message: s.whatsappHelpMessage),
          ),
        ],
      ],
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final int badge;
  final Color? iconColor;
  final double size;

  const _HeaderIconButton({
    required this.icon,
    required this.onTap,
    this.badge = 0,
    this.iconColor,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return HomeTapScale(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: t.divider),
        ),
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            Icon(icon, size: size * 0.5, color: iconColor ?? t.ink),
            if (badge > 0)
              Positioned(
                top: 0,
                left: 0,
                child: Container(
                  constraints: const BoxConstraints(minWidth: 15),
                  height: 15,
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.sale,
                    borderRadius: BorderRadius.circular(99),
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                  child: Text(
                    badge > 9 ? '9+' : '$badge',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.w800,
                      height: 1,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _TrustPills extends StatelessWidget {
  final AppStrings s;
  final int? freeShippingThreshold;

  const _TrustPills({required this.s, this.freeShippingThreshold});

  @override
  Widget build(BuildContext context) {
    final threshold = freeShippingThreshold;
    final shipping = threshold != null && threshold > 0
        ? s.freeShippingPlus(_format(threshold))
        : s.fastDelivery;

    return Row(
      children: [
        _pill(context, Icons.verified_outlined, s.authentic),
        const SizedBox(width: 6),
        _pill(context, Icons.local_shipping_outlined, shipping),
        const SizedBox(width: 6),
        _pill(context, Icons.support_agent_outlined, s.supportShort),
      ],
    );
  }

  static String _format(int n) {
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(0)}k';
    return '$n';
  }

  Widget _pill(BuildContext context, IconData icon, String label) {
    final t = context.worldTheme;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 7),
        decoration: BoxDecoration(
          color: t.accentLight,
          borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
          border: Border.all(color: t.divider),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 13, color: t.accent),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: HomeTheme.body(size: 10, weight: FontWeight.w600, color: t.inkSoft),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
