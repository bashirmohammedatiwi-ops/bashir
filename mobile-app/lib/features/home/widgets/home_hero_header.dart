import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/app_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/support_links.dart';
import '../../auth/auth_provider.dart';
import '../../cart/cart_provider.dart';
import '../../catalog/catalog_providers.dart';
import '../../profile/profile_providers.dart';
import 'home_animations.dart';
import 'home_theme.dart';

/// رأس الهيرو — هوية بوتيك فاخرة مع بحث بارز وإجراءات سريعة.
class HomeHeroHeader extends ConsumerWidget {
  const HomeHeroHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final topPad = MediaQuery.paddingOf(context).top;
    final feed = ref.watch(homeFeedProvider).valueOrNull;
    final storeName = (feed?.settings.storeName ?? AppConfig.storeName).trim();
    final whatsapp = feed?.settings.whatsapp;
    final threshold = feed?.settings.freeShippingThreshold;
    final auth = ref.watch(authProvider);
    final unread =
        auth.isAuthenticated ? ref.watch(unreadNotificationsCountProvider) : 0;
    final cartCount = ref.watch(cartProvider).count;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Positioned(
          top: -28,
          left: -36,
          child: _AmbientOrb(
            size: 160,
            colors: [
              HomeTheme.roseWash.withValues(alpha: 0.95),
              HomeTheme.roseWash.withValues(alpha: 0),
            ],
          ),
        ),
        Positioned(
          top: 36,
          right: -24,
          child: _AmbientOrb(
            size: 120,
            colors: [
              HomeTheme.sageLight.withValues(alpha: 0.9),
              HomeTheme.sageLight.withValues(alpha: 0),
            ],
          ),
        ),
        Padding(
          padding: EdgeInsets.fromLTRB(
            HomeTheme.paddingH,
            topPad + 6,
            HomeTheme.paddingH,
            0,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _BrandActionBar(
                storeName: storeName,
                unread: unread,
                cartCount: cartCount,
                whatsapp: whatsapp,
                onCart: () => context.push('/cart'),
                onNotifications: () => context.push('/notifications'),
              ),
              const SizedBox(height: 18),
              _GreetingBlock(),
              const SizedBox(height: 14),
              _PremiumSearchBar(
                onSearch: () => context.push('/search'),
                onScan: () => context.push('/scan'),
              ),
              const SizedBox(height: 10),
              _TrustPills(freeShippingThreshold: threshold),
            ],
          ),
        ),
      ],
    );
  }
}

class _AmbientOrb extends StatelessWidget {
  final double size;
  final List<Color> colors;

  const _AmbientOrb({required this.size, required this.colors});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(colors: colors),
        ),
      ),
    );
  }
}

class _BrandActionBar extends StatelessWidget {
  final String storeName;
  final int unread;
  final int cartCount;
  final String? whatsapp;
  final VoidCallback onCart;
  final VoidCallback onNotifications;

  const _BrandActionBar({
    required this.storeName,
    required this.unread,
    required this.cartCount,
    required this.whatsapp,
    required this.onCart,
    required this.onNotifications,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(child: _BrandMark(storeName: storeName)),
        _ActionCluster(
          unread: unread,
          cartCount: cartCount,
          whatsapp: whatsapp,
          onCart: onCart,
          onNotifications: onNotifications,
        ),
      ],
    );
  }
}

class _BrandMark extends StatelessWidget {
  final String storeName;

  const _BrandMark({required this.storeName});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.primaryGradient,
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.22),
                blurRadius: 14,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          padding: const EdgeInsets.all(2.5),
          child: DecoratedBox(
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: Padding(
              padding: const EdgeInsets.all(7),
              child: Image.asset(
                'assets/images/alhayaa_logo.png',
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                storeName.isNotEmpty ? storeName : AppConfig.storeName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: HomeTheme.displayTitle(size: 20),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Container(
                    width: 14,
                    height: 2,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(99),
                      gradient: AppColors.primaryGradient,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'جمالك يبدأ هنا',
                    style: HomeTheme.body(
                      size: 11,
                      color: HomeTheme.sage,
                      weight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ActionCluster extends StatelessWidget {
  final int unread;
  final int cartCount;
  final String? whatsapp;
  final VoidCallback onCart;
  final VoidCallback onNotifications;

  const _ActionCluster({
    required this.unread,
    required this.cartCount,
    required this.whatsapp,
    required this.onCart,
    required this.onNotifications,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: HomeTheme.heroActionClusterDecoration(),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _HeaderIconButton(
            icon: Icons.shopping_bag_outlined,
            badge: cartCount,
            onTap: onCart,
          ),
          _HeaderIconButton(
            icon: Icons.notifications_none_rounded,
            badge: unread,
            onTap: onNotifications,
          ),
          if (whatsapp != null && whatsapp!.isNotEmpty)
            _HeaderIconButton(
              icon: Icons.chat_rounded,
              iconColor: const Color(0xFF25D366),
              onTap: () => openWhatsApp(whatsapp, message: 'مرحباً، أحتاج مساعدة'),
            ),
        ],
      ),
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final int badge;
  final Color? iconColor;

  const _HeaderIconButton({
    required this.icon,
    required this.onTap,
    this.badge = 0,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return HomeTapScale(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: SizedBox(
        width: 38,
        height: 38,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            Icon(icon, size: 21, color: iconColor ?? HomeTheme.ink),
            if (badge > 0)
              Positioned(
                top: 2,
                left: 2,
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

class _GreetingBlock extends StatelessWidget {
  const _GreetingBlock();

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final greeting = _greetingForHour(now.hour);
    final subtitle = _subtitleForHour(now.hour);
    final weekday = _weekdayArabic(now.weekday);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('مرحباً بك', style: HomeTheme.overline),
              const SizedBox(height: 5),
              Text(
                greeting,
                style: HomeTheme.displayTitle(size: 26, color: HomeTheme.ink),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: HomeTheme.body(size: 13, color: HomeTheme.inkSoft),
              ),
            ],
          ),
        ),
        const SizedBox(width: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: HomeTheme.heroDateChipDecoration(),
          child: Column(
            children: [
              Text(
                weekday,
                style: HomeTheme.body(
                  size: 10,
                  color: HomeTheme.sageDark,
                  weight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '${now.day}/${now.month}',
                style: HomeTheme.body(
                  size: 11,
                  color: HomeTheme.ink,
                  weight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  static String _greetingForHour(int hour) {
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء النور';
  }

  static String _subtitleForHour(int hour) {
    if (hour < 12) return 'ابدئي يومك بروتين يناسبك';
    if (hour < 17) return 'اكتشفي أحدث العروض والوصول الجديد';
    return 'تسوقي بأمان — توصيل سريع لبابك';
  }

  static String _weekdayArabic(int weekday) {
    const days = [
      'الاثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة',
      'السبت',
      'الأحد',
    ];
    return days[(weekday - 1).clamp(0, 6)];
  }
}

class _PremiumSearchBar extends StatelessWidget {
  final VoidCallback onSearch;
  final VoidCallback onScan;

  const _PremiumSearchBar({
    required this.onSearch,
    required this.onScan,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      decoration: HomeTheme.heroSearchDecoration(),
      child: Row(
        children: [
          Expanded(
            child: HomeTapScale(
              onTap: onSearch,
              child: Padding(
                padding: const EdgeInsetsDirectional.only(start: 6, end: 8),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: HomeTheme.sageLight,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.search_rounded,
                        size: 20,
                        color: HomeTheme.sageDark,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'ابحثي عن منتج، براند، أو باركود…',
                        style: HomeTheme.body(size: 13, color: HomeTheme.inkMuted),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsetsDirectional.only(end: 6),
            child: HomeTapScale(
              onTap: () {
                HapticFeedback.lightImpact();
                onScan();
              },
              child: Container(
                height: 40,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(999),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.24),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.qr_code_scanner_rounded, size: 17, color: Colors.white),
                    const SizedBox(width: 6),
                    Text(
                      'مسح',
                      style: HomeTheme.body(
                        size: 12,
                        color: Colors.white,
                        weight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TrustPills extends StatelessWidget {
  final int? freeShippingThreshold;

  const _TrustPills({this.freeShippingThreshold});

  @override
  Widget build(BuildContext context) {
    final threshold = freeShippingThreshold;
    final shipping = threshold != null && threshold > 0
        ? 'شحن +${_format(threshold)}'
        : 'توصيل سريع';

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      alignment: WrapAlignment.center,
      children: [
        _TrustPill(icon: Icons.verified_outlined, label: 'منتجات أصلية'),
        _TrustPill(icon: Icons.local_shipping_outlined, label: shipping),
        _TrustPill(icon: Icons.support_agent_outlined, label: 'دعم واتساب'),
      ],
    );
  }

  static String _format(int n) {
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(0)}k';
    return '$n';
  }
}

class _TrustPill extends StatelessWidget {
  final IconData icon;
  final String label;

  const _TrustPill({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: HomeTheme.heroTrustPillDecoration(),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: HomeTheme.sage),
          const SizedBox(width: 5),
          Text(
            label,
            style: HomeTheme.body(
              size: 10,
              color: HomeTheme.inkSoft,
              weight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
