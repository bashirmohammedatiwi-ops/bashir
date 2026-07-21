import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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

/// شريط تنقل عائم — بدون blur ثقيل لسلاسة التمرير.
class _BottomNav extends StatelessWidget {
  final int currentIndex;
  final int cartCount;
  final ValueChanged<int> onSelect;

  const _BottomNav({
    required this.currentIndex,
    required this.cartCount,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(14, 0, 14, bottom > 0 ? 6 : 12),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.96),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: Colors.white.withValues(alpha: 0.85)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.07),
              blurRadius: 20,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
          child: Row(
            children: [
              _NavItem(
                index: 0,
                current: currentIndex,
                icon: Icons.home_outlined,
                activeIcon: Icons.home_rounded,
                label: 'الرئيسية',
                onTap: onSelect,
              ),
              _NavItem(
                index: 1,
                current: currentIndex,
                icon: Icons.grid_view_outlined,
                activeIcon: Icons.grid_view_rounded,
                label: 'الفئات',
                onTap: onSelect,
              ),
              _NavItem(
                index: 2,
                current: currentIndex,
                icon: Icons.local_offer_outlined,
                activeIcon: Icons.local_offer_rounded,
                label: 'عروضنا',
                onTap: onSelect,
                accent: true,
              ),
              _NavItem(
                index: 3,
                current: currentIndex,
                icon: Icons.shopping_cart_outlined,
                activeIcon: Icons.shopping_cart_rounded,
                label: 'السلة',
                badge: cartCount,
                onTap: onSelect,
              ),
              _NavItem(
                index: 4,
                current: currentIndex,
                icon: Icons.person_outline_rounded,
                activeIcon: Icons.person_rounded,
                label: 'حسابي',
                onTap: onSelect,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final int index;
  final int current;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final int badge;
  final bool accent;
  final ValueChanged<int> onTap;

  const _NavItem({
    required this.index,
    required this.current,
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.onTap,
    this.badge = 0,
    this.accent = false,
  });

  @override
  Widget build(BuildContext context) {
    final active = index == current;
    final color = active
        ? (accent ? AppColors.primary : HomeTheme.accent)
        : AppColors.textMuted;

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => onTap(index),
          borderRadius: BorderRadius.circular(20),
          child: SizedBox(
            height: 52,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.center,
                  children: [
                    Icon(active ? activeIcon : icon, size: 22, color: color),
                    if (badge > 0)
                      Positioned(
                        top: -6,
                        right: -8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          decoration: BoxDecoration(
                            color: AppColors.sale,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.white, width: 1.5),
                          ),
                          constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                          child: Text(
                            badge > 99 ? '99+' : '$badge',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 8,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    color: color,
                    height: 1,
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
