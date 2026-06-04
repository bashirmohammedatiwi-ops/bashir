import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../constants/app_colors.dart';
import '../constants/app_motion.dart';
import '../constants/app_strings.dart';
import '../theme/text_styles.dart';

/// شريط تنقّل بسيط وأنيق — ألوان هادئة ومؤشر منزلق ناعم.
class AnimatedBottomNav extends StatefulWidget {
  const AnimatedBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.cartCount,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;
  final int cartCount;

  @override
  State<AnimatedBottomNav> createState() => _AnimatedBottomNavState();
}

class _AnimatedBottomNavState extends State<AnimatedBottomNav>
    with SingleTickerProviderStateMixin {
  static const _tabs = <_TabSpec>[
    _TabSpec(
      label: AppStrings.tabHome,
      icon: Icons.home_outlined,
      activeIcon: Icons.home_rounded,
    ),
    _TabSpec(
      label: AppStrings.tabCategories,
      icon: Icons.grid_view_outlined,
      activeIcon: Icons.grid_view_rounded,
    ),
    _TabSpec(
      label: AppStrings.tabBrands,
      icon: Icons.diamond_outlined,
      activeIcon: Icons.diamond_rounded,
    ),
    _TabSpec(
      label: AppStrings.tabCart,
      icon: Icons.shopping_bag_outlined,
      activeIcon: Icons.shopping_bag_rounded,
      isCart: true,
    ),
    _TabSpec(
      label: AppStrings.tabProfile,
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
    ),
  ];

  late final AnimationController _slide;
  int _fromIndex = 0;
  int _lastCart = 0;
  bool _cartBump = false;

  @override
  void initState() {
    super.initState();
    _fromIndex = widget.currentIndex;
    _lastCart = widget.cartCount;
    _slide = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 380),
    )..value = 1;
  }

  @override
  void didUpdateWidget(AnimatedBottomNav oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.currentIndex != oldWidget.currentIndex) {
      _fromIndex = oldWidget.currentIndex;
      _slide.forward(from: 0);
    }
    if (widget.cartCount > _lastCart) {
      setState(() => _cartBump = true);
      Future.delayed(const Duration(milliseconds: 400), () {
        if (mounted) setState(() => _cartBump = false);
      });
    }
    _lastCart = widget.cartCount;
  }

  @override
  void dispose() {
    _slide.dispose();
    super.dispose();
  }

  double get _animatedIndex {
    final t = Curves.easeInOutCubic.transform(_slide.value.clamp(0.0, 1.0));
    return _fromIndex + (widget.currentIndex - _fromIndex) * t;
  }

  double _indicatorStart(double barWidth) {
    const dotW = 28.0;
    final tabW = barWidth / _tabs.length;
    final center = _animatedIndex * tabW + tabW / 2;
    return (center - dotW / 2).clamp(8.0, barWidth - dotW - 8);
  }

  void _onTap(int index) {
    if (index == widget.currentIndex) return;
    if (!kIsWeb) HapticFeedback.selectionClick();
    widget.onTap(index);
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, 10 + bottom * 0.35),
      child: Container(
        height: 64,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.divider),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0D000000),
              blurRadius: 16,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: LayoutBuilder(
            builder: (context, constraints) {
              return Stack(
                children: [
                  AnimatedBuilder(
                    animation: _slide,
                    builder: (context, _) {
                      final start = _indicatorStart(constraints.maxWidth);
                      return PositionedDirectional(
                        bottom: 0,
                        start: start,
                        child: Container(
                          width: 28,
                          height: 3,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(3),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                  Row(
                    children: List.generate(_tabs.length, (i) {
                      return Expanded(
                        child: _NavItem(
                          spec: _tabs[i],
                          selected: i == widget.currentIndex,
                          badge: _tabs[i].isCart &&
                                  widget.cartCount > 0
                              ? widget.cartCount
                              : null,
                          badgeBump: _cartBump && _tabs[i].isCart,
                          onTap: () => _onTap(i),
                        ),
                      );
                    }),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _TabSpec {
  const _TabSpec({
    required this.label,
    required this.icon,
    required this.activeIcon,
    this.isCart = false,
  });
  final String label;
  final IconData icon;
  final IconData activeIcon;
  final bool isCart;
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.spec,
    required this.selected,
    required this.onTap,
    this.badge,
    this.badgeBump = false,
  });

  final _TabSpec spec;
  final bool selected;
  final VoidCallback onTap;
  final int? badge;
  final bool badgeBump;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        splashColor: AppColors.primarySoft,
        highlightColor: AppColors.primaryMist.withValues(alpha: 0.5),
        child: SizedBox(
          height: 64,
          child: Stack(
            alignment: Alignment.center,
            clipBehavior: Clip.none,
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AnimatedScale(
                    scale: selected ? 1.05 : 1.0,
                    duration: AppMotion.fast,
                    curve: Curves.easeOut,
                    child: AnimatedSwitcher(
                      duration: AppMotion.fast,
                      child: Icon(
                        selected ? spec.activeIcon : spec.icon,
                        key: ValueKey(selected),
                        size: 24,
                        color: selected
                            ? AppColors.primary
                            : AppColors.navInactive,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  AnimatedDefaultTextStyle(
                    duration: AppMotion.fast,
                    style: AppTextStyles.caption(
                      size: 10,
                      color: selected
                          ? AppColors.primary
                          : AppColors.textMuted,
                    ).copyWith(
                      fontWeight:
                          selected ? FontWeight.w600 : FontWeight.w500,
                    ),
                    child: Text(
                      spec.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              if (badge != null)
                PositionedDirectional(
                  top: 8,
                  end: 12,
                  child: _Badge(count: badge!, bump: badgeBump),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.count, required this.bump});
  final int count;
  final bool bump;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: bump ? 1.2 : 1,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOut,
      child: Container(
        constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          count > 99 ? '99+' : '$count',
          style: AppTextStyles.caption(
            color: Colors.white,
            size: 8,
          ).copyWith(fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}
