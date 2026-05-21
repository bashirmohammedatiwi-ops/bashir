import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_motion.dart';
import '../constants/app_sizes.dart';
import '../constants/app_strings.dart';
import '../theme/text_styles.dart';
import 'animated_counter.dart';

/// شريط تنقّل عائم فاخر — Floating Pill Premium.
///
/// تصميم:
/// - حاوية بيضاء عائمة بحواف دائرية مع ظل ناعم.
/// - مؤشر منزلق (pill) يلتحم خلف التاب النشط.
/// - الأيقونة النشطة ترتفع قليلاً + ينمو نصها بأناقة.
/// - Badge ذهبي على السلة بحركة نبض.
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
    with TickerProviderStateMixin {
  late final AnimationController _pop;
  late final AnimationController _pulse;
  int _prevCart = 0;
  bool _badgePop = false;

  static const _items = <_NavItem>[
    _NavItem(
      label: AppStrings.tabHome,
      filled: Icons.home_rounded,
      outlined: Icons.home_outlined,
    ),
    _NavItem(
      label: AppStrings.tabCategories,
      filled: Icons.grid_view_rounded,
      outlined: Icons.grid_view_outlined,
    ),
    _NavItem(
      label: AppStrings.tabBrands,
      filled: Icons.diamond_rounded,
      outlined: Icons.diamond_outlined,
    ),
    _NavItem(
      label: AppStrings.tabCart,
      filled: Icons.shopping_bag_rounded,
      outlined: Icons.shopping_bag_outlined,
    ),
    _NavItem(
      label: AppStrings.tabProfile,
      filled: Icons.person_rounded,
      outlined: Icons.person_outline_rounded,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _pop = AnimationController(vsync: this, duration: AppMotion.medium)
      ..value = 1.0;
    _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1800))
      ..repeat(reverse: true);
  }

  @override
  void didUpdateWidget(AnimatedBottomNav old) {
    super.didUpdateWidget(old);
    if (widget.currentIndex != old.currentIndex) {
      _pop.forward(from: 0);
    }
    if (widget.cartCount > _prevCart) {
      setState(() => _badgePop = true);
      Future.delayed(const Duration(milliseconds: 420), () {
        if (mounted) setState(() => _badgePop = false);
      });
    }
    _prevCart = widget.cartCount;
  }

  @override
  void dispose() {
    _pop.dispose();
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mqBottom = MediaQuery.paddingOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppSizes.navMarginH,
        0,
        AppSizes.navMarginH,
        AppSizes.navMarginBottom + mqBottom * 0.25,
      ),
      child: Container(
        height: AppSizes.navHeight,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSizes.navRadius),
          border: Border.all(color: AppColors.divider),
          boxShadow: const [
            BoxShadow(
              color: Color(0x14000000),
              blurRadius: 24,
              offset: Offset(0, 10),
            ),
            BoxShadow(
              color: Color(0x08000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSizes.navRadius),
          child: LayoutBuilder(
            builder: (context, c) {
              final tabWidth = c.maxWidth / _items.length;
              return Stack(
                children: [
                  // Sliding pill
                  AnimatedPositionedDirectional(
                    duration: AppMotion.medium,
                    curve: AppMotion.precise,
                    start: widget.currentIndex * tabWidth + 8,
                    top: 8,
                    bottom: 8,
                    width: tabWidth - 16,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topRight,
                          end: Alignment.bottomLeft,
                          colors: [AppColors.primary, AppColors.primaryDark],
                        ),
                        borderRadius: BorderRadius.circular(
                          AppSizes.navRadius - 8,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.22),
                            blurRadius: 18,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Top accent line (gold) on active
                  AnimatedPositionedDirectional(
                    duration: AppMotion.medium,
                    curve: AppMotion.precise,
                    start: widget.currentIndex * tabWidth + (tabWidth / 2) - 12,
                    top: 5,
                    child: Container(
                      width: 24,
                      height: 2.5,
                      decoration: BoxDecoration(
                        color: AppColors.gold,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  // Items row
                  Row(
                    children: List.generate(_items.length, (i) {
                      final active = i == widget.currentIndex;
                      return Expanded(
                        child: _NavCell(
                          item: _items[i],
                          active: active,
                          pop: _pop,
                          pulse: _pulse,
                          showBadge: i == 3 && widget.cartCount > 0,
                          badgeCount: widget.cartCount,
                          badgePop: _badgePop && i == 3,
                          onTap: () => widget.onTap(i),
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

class _NavItem {
  const _NavItem({
    required this.label,
    required this.filled,
    required this.outlined,
  });
  final String label;
  final IconData filled;
  final IconData outlined;
}

class _NavCell extends StatelessWidget {
  const _NavCell({
    required this.item,
    required this.active,
    required this.pop,
    required this.pulse,
    required this.showBadge,
    required this.badgeCount,
    required this.badgePop,
    required this.onTap,
  });

  final _NavItem item;
  final bool active;
  final Animation<double> pop;
  final Animation<double> pulse;
  final bool showBadge;
  final int badgeCount;
  final bool badgePop;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedBuilder(
        animation: pop,
        builder: (context, _) {
          final t = active ? Curves.easeOutBack.transform(pop.value.clamp(0, 1)) : 1.0;
          final lift = active ? -1.5 * t : 0.0;
          return Stack(
            alignment: Alignment.center,
            children: [
              Transform.translate(
                offset: Offset(0, lift),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Icon swap (animated)
                    AnimatedSwitcher(
                      duration: AppMotion.fast,
                      transitionBuilder: (child, a) => ScaleTransition(
                        scale: a,
                        child: FadeTransition(opacity: a, child: child),
                      ),
                      child: Icon(
                        active ? item.filled : item.outlined,
                        key: ValueKey(active),
                        size: 22,
                        color: active ? AppColors.gold : AppColors.navInactive,
                      ),
                    ),
                    // Label appears beside icon when active
                    AnimatedSize(
                      duration: AppMotion.medium,
                      curve: AppMotion.precise,
                      child: AnimatedOpacity(
                        opacity: active ? 1 : 0,
                        duration: AppMotion.fast,
                        child: active
                            ? Padding(
                                padding: const EdgeInsets.only(right: 6),
                                child: Text(
                                  item.label,
                                  style: AppTextStyles.caption(
                                    color: Colors.white,
                                    size: 11,
                                  ).copyWith(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.2,
                                  ),
                                  maxLines: 1,
                                ),
                              )
                            : const SizedBox.shrink(),
                      ),
                    ),
                  ],
                ),
              ),
              if (showBadge)
                Positioned(
                  top: 12,
                  right: 18,
                  child: _Badge(
                    count: badgeCount,
                    pop: badgePop,
                    pulse: pulse,
                    onActive: active,
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({
    required this.count,
    required this.pop,
    required this.pulse,
    required this.onActive,
  });
  final int count;
  final bool pop;
  final Animation<double> pulse;
  final bool onActive;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: pulse,
      builder: (context, _) {
        final p = 1.0 + (pulse.value * 0.08);
        return Transform.scale(
          scale: pop ? 1.35 : p,
          child: AnimatedContainer(
            duration: AppMotion.fast,
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
            decoration: BoxDecoration(
              color: AppColors.gold,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: onActive ? AppColors.primaryDark : AppColors.surface,
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.gold.withValues(alpha: 0.45),
                  blurRadius: 6,
                ),
              ],
            ),
            constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
            child: Center(child: AnimatedCounterSmall(value: count)),
          ),
        );
      },
    );
  }
}
