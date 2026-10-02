import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_fonts.dart';
import '../../core/utils/responsive.dart';
import '../worlds/world_theme.dart';
import 'nav_tabs.dart';

/// شريط سفلي هادئ: خمسة تبويبات بنفس الخط.
class ShellNavBar extends StatelessWidget {
  final int currentIndex;
  final int cartCount;
  final ValueChanged<int> onSelect;
  final AppStrings strings;
  final WorldThemePalette theme;

  const ShellNavBar({
    super.key,
    required this.currentIndex,
    required this.cartCount,
    required this.onSelect,
    required this.strings,
    required this.theme,
  });

  static const _duration = Duration(milliseconds: 180);

  @override
  Widget build(BuildContext context) {
    final barHeight = Responsive.bottomNavHeight(context);
    final systemInset = Responsive.systemBottomInset(context);
    final narrow = Responsive.isNarrow(context);

    final items = <_NavItemData>[
      _NavItemData(NavTabs.home, Icons.home_outlined, Icons.home_rounded, strings.navHome),
      _NavItemData(NavTabs.categories, Icons.grid_view_outlined, Icons.grid_view_rounded, strings.navCategories),
      _NavItemData(NavTabs.offers, Icons.local_offer_outlined, Icons.local_offer_rounded, strings.navOffers),
      _NavItemData(NavTabs.cart, Icons.shopping_bag_outlined, Icons.shopping_bag_rounded, strings.navCart, badge: cartCount),
      _NavItemData(NavTabs.account, Icons.person_outline_rounded, Icons.person_rounded, strings.navAccount),
    ];

    return RepaintBoundary(
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: theme.surface,
          border: Border(top: BorderSide(color: theme.hairline.withValues(alpha: 0.85))),
          boxShadow: [
            BoxShadow(
              color: theme.accentDark.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: Material(
          color: theme.surface,
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
                        narrow: narrow,
                        theme: theme,
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
  final bool narrow;
  final WorldThemePalette theme;
  final VoidCallback onTap;

  const _NavTab({
    required this.item,
    required this.active,
    required this.narrow,
    required this.theme,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = active ? theme.accent : theme.inkMuted;
    final iconSize = narrow ? 21.0 : 22.0;

    return Expanded(
      child: InkWell(
        onTap: onTap,
        splashColor: theme.accent.withValues(alpha: 0.06),
        highlightColor: Colors.transparent,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: ShellNavBar._duration,
              curve: Curves.easeOutCubic,
              width: narrow ? 36 : 40,
              height: 28,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: active ? theme.accentSoft : Colors.transparent,
                borderRadius: BorderRadius.circular(99),
              ),
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  Icon(
                    active ? item.activeIcon : item.icon,
                    size: iconSize,
                    color: color,
                  ),
                  if (item.badge > 0)
                    Positioned(
                      top: -6,
                      right: -8,
                      child: _Badge(count: item.badge, theme: theme),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 3),
            Text(
              item.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: appFont(
                fontSize: narrow ? 9.5 : 10.5,
                fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                color: color,
                height: 1.05,
              ),
            ),
            AnimatedContainer(
              duration: ShellNavBar._duration,
              curve: Curves.easeOutCubic,
              margin: const EdgeInsets.only(top: 3),
              height: 2.5,
              width: active ? (narrow ? 16 : 18) : 0,
              decoration: BoxDecoration(
                color: theme.accent,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final int count;
  final WorldThemePalette theme;
  const _Badge({required this.count, required this.theme});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      constraints: const BoxConstraints(minWidth: 15, minHeight: 15),
      decoration: BoxDecoration(
        gradient: theme.signatureGradient,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: theme.surface, width: 1.5),
      ),
      alignment: Alignment.center,
      child: Text(
        count > 9 ? '9+' : '$count',
        style: appFont(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w800, height: 1),
      ),
    );
  }
}

double shellNavOuterHeight(BuildContext context) {
  return Responsive.shellNavDockHeight(context);
}
