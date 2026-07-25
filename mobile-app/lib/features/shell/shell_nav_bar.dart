import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/responsive.dart';
import '../cart/widgets/cart_theme.dart';

/// شريط تنقل سفلي — 5 تبويبات متساوية، بسيط ومستقر.
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
    final bottom = MediaQuery.paddingOf(context).bottom;
    final barHeight = Responsive.bottomNavHeight(context);

    final items = [
      _NavItemData(0, Icons.home_outlined, Icons.home_rounded, strings.navHome),
      _NavItemData(1, Icons.grid_view_outlined, Icons.grid_view_rounded, strings.navCategories),
      _NavItemData(2, Icons.local_offer_outlined, Icons.local_offer_rounded, strings.navOffers),
      _NavItemData(3, Icons.shopping_bag_outlined, Icons.shopping_bag_rounded, strings.navCart, badge: cartCount),
      _NavItemData(4, Icons.person_outline_rounded, Icons.person_rounded, strings.navAccount),
    ];

    return RepaintBoundary(
      child: Padding(
        padding: EdgeInsets.fromLTRB(12, 0, 12, bottom > 0 ? 6 : 10),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            boxShadow: CartTheme.softShadow,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Material(
              color: Colors.white,
              child: SizedBox(
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
    final color = active ? CartTheme.brand : CartTheme.charcoal.withValues(alpha: 0.4);

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: ShellNavBar._duration,
                curve: Curves.easeOutCubic,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: active ? CartTheme.brandSoft : Colors.transparent,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.center,
                  children: [
                    Icon(
                      active ? item.activeIcon : item.icon,
                      size: compact ? 21 : 22,
                      color: color,
                    ),
                    if (item.badge > 0)
                      Positioned(
                        top: -4,
                        right: -6,
                        child: _Badge(count: item.badge),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 2),
              Text(
                item.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.cairo(
                  fontSize: Responsive.navLabelSize(context, active: active),
                  fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                  color: active ? CartTheme.brandDark : CartTheme.charcoal.withValues(alpha: 0.45),
                  height: 1,
                ),
              ),
              const SizedBox(height: 3),
              AnimatedContainer(
                duration: ShellNavBar._duration,
                width: active ? 4 : 0,
                height: active ? 4 : 0,
                decoration: const BoxDecoration(
                  color: CartTheme.brand,
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

class _Badge extends StatelessWidget {
  final int count;
  const _Badge({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFE2557A),
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

/// ارتفاع الشريط + الهامش للمحتوى القابل للتمرير.
double shellNavOuterHeight(BuildContext context) {
  final bottom = MediaQuery.paddingOf(context).bottom;
  return Responsive.bottomNavHeight(context) + (bottom > 0 ? 6 : 10) + 4;
}
