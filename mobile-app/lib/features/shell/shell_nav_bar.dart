import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/responsive.dart';
import '../cart/widgets/cart_theme.dart';
import '../home/widgets/home_theme.dart';

/// شريط تنقل سفلي — ملتصق بأسفل الشاشة، الخلفية تمتد لمنطقة النظام.
class ShellNavBar extends StatelessWidget {
  final int currentIndex;
  final int cartCount;
  final ValueChanged<int> onSelect;
  final AppStrings strings;

  const ShellNavBar({
    super.key,
    required this.currentIndex,
    required this.cartCount,
    required this.onSelect,
    required this.strings,
  });

  static const _duration = Duration(milliseconds: 220);

  @override
  Widget build(BuildContext context) {
    final barHeight = Responsive.bottomNavHeight(context);
    final systemInset = Responsive.systemBottomInset(context);

    final items = [
      _NavItemData(0, Icons.home_outlined, Icons.home_rounded, strings.navHome),
      _NavItemData(1, Icons.grid_view_outlined, Icons.grid_view_rounded, strings.navCategories),
      _NavItemData(2, Icons.local_offer_outlined, Icons.local_offer_rounded, strings.navOffers),
      _NavItemData(3, Icons.shopping_bag_outlined, Icons.shopping_bag_rounded, strings.navCart, badge: cartCount),
      _NavItemData(4, Icons.person_outline_rounded, Icons.person_rounded, strings.navAccount),
    ];

    return RepaintBoundary(
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: HomeTheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          border: Border(
            top: BorderSide(color: CartTheme.brandSoft),
          ),
          boxShadow: CartTheme.dockShadow,
        ),
        child: ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          child: Material(
            color: HomeTheme.surface,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: barHeight,
                  child: Row(
                    children: [
                      for (final item in items)
                        _NavTab(
                          item: item,
                          active: currentIndex == item.index,
                          onTap: () {
                            HapticFeedback.selectionClick();
                            onSelect(item.index);
                          },
                        ),
                    ],
                  ),
                ),
                if (systemInset > 0) SizedBox(height: systemInset),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItemData {
  final int index;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final int badge;

  const _NavItemData(this.index, this.icon, this.activeIcon, this.label, {this.badge = 0});
}

class _NavTab extends StatelessWidget {
  final _NavItemData item;
  final bool active;
  final VoidCallback onTap;

  const _NavTab({
    required this.item,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final compact = Responsive.isCompact(context);
    final iconSize = compact ? 22.0 : 23.0;
    final inactiveColor = CartTheme.charcoal.withValues(alpha: 0.38);
    final activeColor = CartTheme.brandDark;

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          splashColor: CartTheme.brandSoft,
          highlightColor: CartTheme.brandWash,
          child: Stack(
            alignment: Alignment.topCenter,
            children: [
              if (active)
                Positioned(
                  top: 0,
                  left: 10,
                  right: 10,
                  child: Container(
                    height: 3,
                    decoration: BoxDecoration(
                      gradient: CartTheme.brandGradient,
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.only(top: 7),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    AnimatedContainer(
                      duration: ShellNavBar._duration,
                      curve: Curves.easeOutCubic,
                      width: compact ? 42 : 44,
                      height: compact ? 30 : 32,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: active ? CartTheme.brandSoft : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Stack(
                        clipBehavior: Clip.none,
                        alignment: Alignment.center,
                        children: [
                          Icon(
                            active ? item.activeIcon : item.icon,
                            size: iconSize,
                            color: active ? activeColor : inactiveColor,
                          ),
                          if (item.badge > 0)
                            Positioned(
                              top: -5,
                              right: -4,
                              child: _Badge(count: item.badge),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 3),
                    AnimatedDefaultTextStyle(
                      duration: ShellNavBar._duration,
                      curve: Curves.easeOutCubic,
                      style: GoogleFonts.cairo(
                        fontSize: Responsive.navLabelSize(context, active: active),
                        fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                        color: active ? activeColor : inactiveColor,
                        height: 1.05,
                      ),
                      child: Text(
                        item.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final int count;
  const _Badge({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
      decoration: BoxDecoration(
        gradient: CartTheme.brandGradient,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: Colors.white, width: 1.5),
      ),
      alignment: Alignment.center,
      child: Text(
        count > 9 ? '9+' : '$count',
        style: GoogleFonts.cairo(
          color: Colors.white,
          fontSize: 8,
          fontWeight: FontWeight.w800,
          height: 1,
        ),
      ),
    );
  }
}

/// ارتفاع الشريط + منطقة النظام — للمحتوى خارج الـ shell إن لزم.
double shellNavOuterHeight(BuildContext context) {
  return Responsive.shellNavDockHeight(context);
}
