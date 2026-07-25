import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../home/widgets/home_theme.dart';
import '../cart/cart_provider.dart';
import '../cart/cart_screen.dart';
import '../categories/categories_screen.dart';
import '../home/home_screen.dart';
import '../offers/offers_screen.dart';
import '../profile/account_screen.dart';

final navIndexProvider = StateProvider<int>((ref) => 0);

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  final _visited = <int>{0};

  @override
  Widget build(BuildContext context) {
    final index = ref.watch(navIndexProvider);
    final cartCount = ref.watch(cartProvider.select((c) => c.count));
    _visited.add(index);

    return Scaffold(
      backgroundColor: HomeTheme.canvas,
      extendBody: true,
      body: IndexedStack(
        index: index,
        sizing: StackFit.expand,
        children: [
          TickerMode(enabled: index == 0, child: const HomeScreen()),
          TickerMode(
            enabled: index == 1,
            child: _visited.contains(1) ? const CategoriesScreen() : const SizedBox.shrink(),
          ),
          TickerMode(
            enabled: index == 2,
            child: _visited.contains(2) ? const OffersScreen() : const SizedBox.shrink(),
          ),
          TickerMode(
            enabled: index == 3,
            child: _visited.contains(3) ? const CartScreen() : const SizedBox.shrink(),
          ),
          TickerMode(
            enabled: index == 4,
            child: _visited.contains(4) ? const AccountScreen() : const SizedBox.shrink(),
          ),
        ],
      ),
      bottomNavigationBar: _BottomNav(
        currentIndex: index,
        cartCount: cartCount,
        onSelect: _selectTab,
        s: ref.watch(stringsProvider),
      ),
    );
  }

  void _selectTab(int i) {
    if (ref.read(navIndexProvider) != i) {
      HapticFeedback.selectionClick();
    }
    ref.read(navIndexProvider.notifier).state = i;
  }
}

/// شريط تنقل عائم — كل تبويب يُظلّل نفسه عند التفعيل (بدون مؤشر منفصل).
class _BottomNav extends StatelessWidget {
  final int currentIndex;
  final int cartCount;
  final ValueChanged<int> onSelect;
  final AppStrings s;

  const _BottomNav({
    required this.currentIndex,
    required this.cartCount,
    required this.onSelect,
    required this.s,
  });

  static const _duration = Duration(milliseconds: 280);
  static const _curve = Curves.easeOutCubic;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    final navHeight = Responsive.bottomNavHeight(context);

    return RepaintBoundary(
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, 0, 16, bottom > 0 ? 10 : 16),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(30),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.09),
                blurRadius: 22,
                offset: const Offset(0, 8),
              ),
              BoxShadow(
                color: AppColors.ink.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(30),
            child: ColoredBox(
              color: Colors.white,
              child: SizedBox(
                height: navHeight,
                child: Row(
                  children: [
                    _NavItem(
                      index: 0,
                      active: currentIndex == 0,
                      icon: Icons.home_outlined,
                      activeIcon: Icons.home_rounded,
                      label: s.navHome,
                      onTap: onSelect,
                    ),
                    _NavItem(
                      index: 1,
                      active: currentIndex == 1,
                      icon: Icons.grid_view_outlined,
                      activeIcon: Icons.grid_view_rounded,
                      label: s.navCategories,
                      onTap: onSelect,
                    ),
                    _NavItem(
                      index: 2,
                      active: currentIndex == 2,
                      icon: Icons.local_offer_outlined,
                      activeIcon: Icons.local_offer_rounded,
                      label: s.navOffers,
                      onTap: onSelect,
                      isCenter: true,
                    ),
                    _NavItem(
                      index: 3,
                      active: currentIndex == 3,
                      icon: Icons.shopping_bag_outlined,
                      activeIcon: Icons.shopping_bag_rounded,
                      label: s.navCart,
                      badge: cartCount,
                      onTap: onSelect,
                    ),
                    _NavItem(
                      index: 4,
                      active: currentIndex == 4,
                      icon: Icons.person_outline_rounded,
                      activeIcon: Icons.person_rounded,
                      label: s.navAccount,
                      onTap: onSelect,
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

class _NavItem extends StatelessWidget {
  final int index;
  final bool active;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final int badge;
  final bool isCenter;
  final ValueChanged<int> onTap;

  const _NavItem({
    required this.index,
    required this.active,
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.onTap,
    this.badge = 0,
    this.isCenter = false,
  });

  @override
  Widget build(BuildContext context) {
    final compact = Responsive.isCompact(context);
    final pillW = isCenter ? (compact ? 42.0 : 46.0) : (compact ? 38.0 : 42.0);
    final pillH = isCenter ? (compact ? 42.0 : 46.0) : (compact ? 34.0 : 38.0);

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => onTap(index),
          splashColor: AppColors.primary.withValues(alpha: 0.07),
          highlightColor: AppColors.primary.withValues(alpha: 0.03),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                height: pillH,
                child: Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.center,
                  children: [
                    AnimatedContainer(
                      duration: _BottomNav._duration,
                      curve: _BottomNav._curve,
                      width: active ? pillW : 0,
                      height: active ? pillH : 0,
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(
                          isCenter ? 99 : 13,
                        ),
                        boxShadow: active
                            ? [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.28),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ]
                            : null,
                      ),
                    ),
                    Icon(
                      active ? activeIcon : icon,
                      size: isCenter ? 22 : 20,
                      color: active
                          ? Colors.white
                          : (isCenter ? AppColors.primary : AppColors.textMuted),
                    ),
                    if (badge > 0)
                      Positioned(
                        top: -2,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          decoration: BoxDecoration(
                            color: AppColors.sale,
                            borderRadius: BorderRadius.circular(99),
                            border: Border.all(color: Colors.white, width: 1.5),
                          ),
                          constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                          child: Text(
                            badge > 99 ? '99+' : '$badge',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.cairo(
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
              const SizedBox(height: 4),
              AnimatedDefaultTextStyle(
                duration: _BottomNav._duration,
                curve: _BottomNav._curve,
                style: GoogleFonts.cairo(
                  fontSize: Responsive.navLabelSize(context, active: active),
                  fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                  color: active ? AppColors.primaryDark : AppColors.textMuted,
                  height: 1,
                ),
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(height: 3),
              AnimatedContainer(
                duration: _BottomNav._duration,
                curve: _BottomNav._curve,
                width: active ? 4 : 0,
                height: active ? 4 : 0,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
