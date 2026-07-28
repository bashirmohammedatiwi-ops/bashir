import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/app_config.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_fonts.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/widgets/app_search_scan_bar.dart';
import '../../../core/utils/support_links.dart';
import '../../auth/auth_provider.dart';
import '../../cart/cart_provider.dart';
import '../../catalog/catalog_providers.dart';
import '../../profile/profile_providers.dart';
import 'home_animations.dart';
import 'home_theme.dart';

/// رأس الرئيسية — نظيف على خلفية بيضاء.
class HomeHeroHeader extends ConsumerWidget {
  const HomeHeroHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final topPad = MediaQuery.paddingOf(context).top;
    final feed = ref.watch(homeFeedProvider).valueOrNull;
    final lang = ref.watch(languageCodeProvider);
    final storeName = AppConfig.displayStoreName(lang);
    final whatsapp = feed?.settings.whatsapp;
    final threshold = feed?.settings.freeShippingThreshold;
    final auth = ref.watch(authProvider);
    final unread =
        auth.isAuthenticated ? ref.watch(unreadNotificationsCountProvider) : 0;
    final cartCount = ref.watch(cartProvider).count;
    final s = ref.s;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        Responsive.horizontalPadding(context),
        topPad + 8,
        Responsive.horizontalPadding(context),
        0,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _BrandActionBar(
            storeName: storeName,
            lang: lang,
            unread: unread,
            cartCount: cartCount,
            whatsapp: whatsapp,
            s: s,
            onCart: () => openCartTab(context, ProviderScope.containerOf(context, listen: false)),
            onNotifications: () => context.push('/notifications'),
          ),
          const SizedBox(height: 16),
          AppSearchScanBar(
            hint: s.searchHintHome,
            scanLabel: s.scan,
            fillColor: Colors.white,
            borderColor: HomeTheme.divider,
            onSearchTap: () => context.push('/search'),
            onScanTap: () => context.push('/scan'),
          ),
          const SizedBox(height: 10),
          _TrustPills(s: s, freeShippingThreshold: threshold),
        ],
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
                color: HomeTheme.ink,
              ),
              const SizedBox(height: 2),
              Text(
                s.storeTagline,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: HomeTheme.body(size: 11.5, color: HomeTheme.inkMuted),
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
          border: Border.all(color: HomeTheme.divider),
        ),
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            Icon(icon, size: size * 0.5, color: iconColor ?? HomeTheme.ink),
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
        _pill(Icons.verified_outlined, s.authentic),
        const SizedBox(width: 6),
        _pill(Icons.local_shipping_outlined, shipping),
        const SizedBox(width: 6),
        _pill(Icons.support_agent_outlined, s.supportShort),
      ],
    );
  }

  static String _format(int n) {
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(0)}k';
    return '$n';
  }

  Widget _pill(IconData icon, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 7),
        decoration: HomeTheme.heroTrustPillDecoration(),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 13, color: HomeTheme.accent),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: HomeTheme.body(size: 10, weight: FontWeight.w600),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
