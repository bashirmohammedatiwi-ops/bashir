import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/responsive.dart';
import '../cart/widgets/cart_theme.dart';

/// شريط تنقل سفلي عائم — أنيق ومميز بألوان اللوغو.
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

  static const _duration = Duration(milliseconds: 320);
  static const _curve = Curves.easeOutCubic;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    final compact = Responsive.isCompact(context);
    final barHeight = Responsive.bottomNavHeight(context);
    final centerLift = compact ? 18.0 : 22.0;

    return RepaintBoundary(
      child: Padding(
        padding: EdgeInsets.fromLTRB(14, 0, 14, bottom > 0 ? 8 : 14),
        child: SizedBox(
          height: barHeight + centerLift,
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.bottomCenter,
            children: [
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: _NavDock(
                  height: barHeight,
                  child: Row(
                    children: [
                      _SideNavSlot(
                        item: _NavSpec(
                          index: 0,
                          icon: Icons.home_outlined,
                          activeIcon: Icons.home_rounded,
                          label: strings.navHome,
                        ),
                        active: currentIndex == 0,
                        onTap: onSelect,
                      ),
                      _SideNavSlot(
                        item: _NavSpec(
                          index: 1,
                          icon: Icons.grid_view_outlined,
                          activeIcon: Icons.grid_view_rounded,
                          label: strings.navCategories,
                        ),
                        active: currentIndex == 1,
                        onTap: onSelect,
                      ),
                      SizedBox(width: compact ? 52 : 58),
                      _SideNavSlot(
                        item: _NavSpec(
                          index: 3,
                          icon: Icons.shopping_bag_outlined,
                          activeIcon: Icons.shopping_bag_rounded,
                          label: strings.navCart,
                          badge: cartCount,
                        ),
                        active: currentIndex == 3,
                        onTap: onSelect,
                      ),
                      _SideNavSlot(
                        item: _NavSpec(
                          index: 4,
                          icon: Icons.person_outline_rounded,
                          activeIcon: Icons.person_rounded,
                          label: strings.navAccount,
                        ),
                        active: currentIndex == 4,
                        onTap: onSelect,
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                bottom: barHeight - centerLift,
                child: _CenterOffersButton(
                  active: currentIndex == 2,
                  label: strings.navOffers,
                  onTap: () => onSelect(2),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavDock extends StatelessWidget {
  final double height;
  final Widget child;

  const _NavDock({required this.height, required this.child});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: CartTheme.brand.withValues(alpha: 0.14),
            blurRadius: 28,
            offset: const Offset(0, 10),
            spreadRadius: -4,
          ),
          BoxShadow(
            color: CartTheme.charcoal.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: Container(
            height: height,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.92),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: CartTheme.brandSoft.withValues(alpha: 0.9)),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

class _NavSpec {
  final int index;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final int badge;

  const _NavSpec({
    required this.index,
    required this.icon,
    required this.activeIcon,
    required this.label,
    this.badge = 0,
  });
}

class _SideNavSlot extends StatelessWidget {
  final _NavSpec item;
  final bool active;
  final ValueChanged<int> onTap;

  const _SideNavSlot({
    required this.item,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final compact = Responsive.isCompact(context);

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => onTap(item.index),
          splashColor: CartTheme.brand.withValues(alpha: 0.08),
          highlightColor: CartTheme.brand.withValues(alpha: 0.04),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: ShellNavBar._duration,
                curve: ShellNavBar._curve,
                width: active ? (compact ? 44 : 48) : 36,
                height: active ? (compact ? 30 : 32) : 28,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: active ? CartTheme.brandSoft : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.center,
                  children: [
                    AnimatedSwitcher(
                      duration: ShellNavBar._duration,
                      switchInCurve: ShellNavBar._curve,
                      switchOutCurve: ShellNavBar._curve,
                      child: Icon(
                        active ? item.activeIcon : item.icon,
                        key: ValueKey(active),
                        size: compact ? 20 : 21,
                        color: active ? CartTheme.brand : CartTheme.charcoal.withValues(alpha: 0.38),
                      ),
                    ),
                    if (item.badge > 0)
                      Positioned(
                        top: -5,
                        right: -2,
                        child: _CartBadge(count: item.badge),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 3),
              AnimatedDefaultTextStyle(
                duration: ShellNavBar._duration,
                curve: ShellNavBar._curve,
                style: GoogleFonts.cairo(
                  fontSize: Responsive.navLabelSize(context, active: active),
                  fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                  color: active ? CartTheme.brandDark : CartTheme.charcoal.withValues(alpha: 0.42),
                  height: 1,
                ),
                child: Text(
                  item.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CenterOffersButton extends StatefulWidget {
  final bool active;
  final String label;
  final VoidCallback onTap;

  const _CenterOffersButton({
    required this.active,
    required this.label,
    required this.onTap,
  });

  @override
  State<_CenterOffersButton> createState() => _CenterOffersButtonState();
}

class _CenterOffersButtonState extends State<_CenterOffersButton> with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1800))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final compact = Responsive.isCompact(context);
    final size = compact ? 54.0 : 58.0;

    return GestureDetector(
      onTap: widget.onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedBuilder(
            animation: _pulse,
            builder: (context, child) {
              final glow = widget.active ? 0.0 : 0.08 + _pulse.value * 0.06;
              return Container(
                width: size + 8,
                height: size + 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: CartTheme.brand.withValues(alpha: 0.22 + glow),
                      blurRadius: 16 + _pulse.value * 6,
                      spreadRadius: _pulse.value * 2,
                    ),
                  ],
                ),
                child: child,
              );
            },
            child: AnimatedContainer(
              duration: ShellNavBar._duration,
              curve: ShellNavBar._curve,
              width: size,
              height: size,
              margin: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: widget.active
                    ? const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF45B5A6), CartTheme.brand, CartTheme.brandDark],
                      )
                    : const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFFE2557A), Color(0xFFC43D62)],
                      ),
                border: Border.all(color: Colors.white, width: 3),
                boxShadow: [
                  BoxShadow(
                    color: (widget.active ? CartTheme.brand : const Color(0xFFE2557A)).withValues(alpha: 0.35),
                    blurRadius: 14,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Icon(
                widget.active ? Icons.local_offer_rounded : Icons.local_offer_outlined,
                color: Colors.white,
                size: compact ? 24 : 26,
              ),
            ),
          ),
          const SizedBox(height: 5),
          Text(
            widget.label,
            style: GoogleFonts.cairo(
              fontSize: Responsive.navLabelSize(context, active: widget.active),
              fontWeight: FontWeight.w800,
              color: widget.active ? CartTheme.brandDark : const Color(0xFFC43D62),
              height: 1,
            ),
          ),
        ],
      ),
    );
  }
}

class _CartBadge extends StatelessWidget {
  final int count;

  const _CartBadge({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE2557A), Color(0xFFC43D62)],
        ),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: Colors.white, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE2557A).withValues(alpha: 0.35),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      constraints: const BoxConstraints(minWidth: 17, minHeight: 17),
      child: Text(
        count > 99 ? '99+' : '$count',
        textAlign: TextAlign.center,
        style: GoogleFonts.cairo(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w800,
          height: 1,
        ),
      ),
    );
  }
}
