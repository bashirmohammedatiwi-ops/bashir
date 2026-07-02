import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../cart/cart_provider.dart';
import '../cart/cart_screen.dart';
import '../categories/categories_screen.dart';
import '../home/home_screen.dart';
import '../offers/offers_screen.dart';
import '../profile/account_screen.dart';

final navIndexProvider = StateProvider<int>((ref) => 0);

class MainShell extends ConsumerWidget {
  const MainShell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final index = ref.watch(navIndexProvider);
    final cartCount = ref.watch(cartProvider.select((c) => c.count));

    const tabs = [
      HomeScreen(),
      CategoriesScreen(),
      OffersScreen(),
      CartScreen(),
      AccountScreen(),
    ];

    return Scaffold(
      backgroundColor: AppColors.scaffold,
      extendBody: true,
      body: IndexedStack(index: index, children: tabs),
      bottomNavigationBar: _LuxuryBottomNav(
        currentIndex: index,
        cartCount: cartCount,
        onSelect: (i) => _selectTab(ref, i),
      ),
    );
  }

  void _selectTab(WidgetRef ref, int i) {
    if (ref.read(navIndexProvider) != i) {
      HapticFeedback.selectionClick();
    }
    ref.read(navIndexProvider.notifier).state = i;
  }
}

/// شريط تنقل فاخر بشق مركزي للفراشة وتأثير زجاجي.
class _LuxuryBottomNav extends StatelessWidget {
  final int currentIndex;
  final int cartCount;
  final ValueChanged<int> onSelect;

  const _LuxuryBottomNav({
    required this.currentIndex,
    required this.cartCount,
    required this.onSelect,
  });

  static const _barHeight = 68.0;
  static const _notchRadius = 36.0;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, bottom > 0 ? 8 : 14),
      child: SizedBox(
        height: _barHeight + 28,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.bottomCenter,
          children: [
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              height: _barHeight,
              child: ClipPath(
                clipper: _NotchedBarClipper(notchRadius: _notchRadius),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          AppColors.surface.withValues(alpha: 0.97),
                          const Color(0xFFFFF8FA).withValues(alpha: 0.94),
                        ],
                      ),
                      border: Border.all(
                        color: AppColors.border.withValues(alpha: 0.7),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.textPrimary.withValues(alpha: 0.09),
                          blurRadius: 32,
                          offset: const Offset(0, 12),
                        ),
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.07),
                          blurRadius: 24,
                          spreadRadius: -4,
                          offset: const Offset(0, -4),
                        ),
                      ],
                    ),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(6, 10, 6, 8),
                      child: Stack(
                        children: [
                          _SlidingIndicator(currentIndex: currentIndex),
                          Row(
                            children: [
                              _NavSlot(
                                index: 0,
                                current: currentIndex,
                                icon: Icons.home_outlined,
                                activeIcon: Icons.home_rounded,
                                label: 'الرئيسية',
                                onTap: onSelect,
                              ),
                              _NavSlot(
                                index: 1,
                                current: currentIndex,
                                icon: Icons.grid_view_outlined,
                                activeIcon: Icons.grid_view_rounded,
                                label: 'الأقسام',
                                onTap: onSelect,
                              ),
                              SizedBox(width: _notchRadius * 2 + 4),
                              _NavSlot(
                                index: 3,
                                current: currentIndex,
                                icon: Icons.shopping_bag_outlined,
                                activeIcon: Icons.shopping_bag_rounded,
                                label: 'السلة',
                                badge: cartCount,
                                onTap: onSelect,
                              ),
                              _NavSlot(
                                index: 4,
                                current: currentIndex,
                                icon: Icons.person_outline_rounded,
                                activeIcon: Icons.person_rounded,
                                label: 'حسابي',
                                onTap: onSelect,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 0,
              child: _ButterflyHub(
                selected: currentIndex == 2,
                onTap: () => onSelect(2),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotchedBarClipper extends CustomClipper<Path> {
  final double notchRadius;

  const _NotchedBarClipper({required this.notchRadius});

  @override
  Path getClip(Size size) {
    final cx = size.width / 2;
    const corner = 28.0;
    const notchDepth = 14.0;

    final path = Path()
      ..moveTo(0, corner)
      ..quadraticBezierTo(0, 0, corner, 0)
      ..lineTo(cx - notchRadius - 16, 0)
      ..cubicTo(
        cx - notchRadius - 4,
        0,
        cx - notchRadius + 4,
        notchDepth,
        cx,
        notchDepth,
      )
      ..cubicTo(
        cx + notchRadius - 4,
        notchDepth,
        cx + notchRadius + 4,
        0,
        cx + notchRadius + 16,
        0,
      )
      ..lineTo(size.width - corner, 0)
      ..quadraticBezierTo(size.width, 0, size.width, corner)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    return path;
  }

  @override
  bool shouldReclip(covariant _NotchedBarClipper oldClipper) =>
      oldClipper.notchRadius != notchRadius;
}

class _SlidingIndicator extends StatelessWidget {
  final int currentIndex;

  const _SlidingIndicator({required this.currentIndex});

  Alignment _alignmentFor(int index) => switch (index) {
        0 => const Alignment(-0.86, 1),
        1 => const Alignment(-0.30, 1),
        3 => const Alignment(0.30, 1),
        4 => const Alignment(0.86, 1),
        _ => Alignment.center,
      };

  @override
  Widget build(BuildContext context) {
    if (currentIndex == 2) return const SizedBox.shrink();

    return Positioned.fill(
      child: AnimatedAlign(
        alignment: _alignmentFor(currentIndex),
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
        child: Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: Container(
            width: 36,
            height: 3,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(2),
              gradient: const LinearGradient(
                colors: [AppColors.primary, Color(0xFFFF6B9D)],
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.4),
                  blurRadius: 6,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavSlot extends StatelessWidget {
  final int index;
  final int current;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final int badge;
  final ValueChanged<int> onTap;

  const _NavSlot({
    required this.index,
    required this.current,
    required this.icon,
    required this.activeIcon,
    required this.label,
    this.badge = 0,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final active = index == current;

    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => onTap(index),
          borderRadius: BorderRadius.circular(20),
          splashColor: AppColors.primary.withValues(alpha: 0.06),
          child: SizedBox(
            height: 50,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.center,
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 280),
                      curve: Curves.easeOutCubic,
                      width: active ? 40 : 34,
                      height: active ? 40 : 34,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: active
                            ? LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  AppColors.primaryLight,
                                  AppColors.primary.withValues(alpha: 0.14),
                                ],
                              )
                            : null,
                        border: active
                            ? Border.all(color: AppColors.primary.withValues(alpha: 0.15))
                            : null,
                      ),
                      child: Icon(
                        active ? activeIcon : icon,
                        size: active ? 22 : 21,
                        color: active ? AppColors.primary : AppColors.textMuted,
                      ),
                    ),
                    if (badge > 0)
                      Positioned(
                        top: -4,
                        right: -6,
                        child: _CartBadge(count: badge),
                      ),
                  ],
                ),
                const SizedBox(height: 3),
                AnimatedOpacity(
                  opacity: active ? 1 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: AnimatedSlide(
                    offset: active ? Offset.zero : const Offset(0, 0.4),
                    duration: const Duration(milliseconds: 220),
                    curve: Curves.easeOutCubic,
                    child: Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                        height: 1,
                      ),
                    ),
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

class _CartBadge extends StatelessWidget {
  final int count;

  const _CartBadge({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFF6B6B), AppColors.sale],
        ),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.surface, width: 2),
        boxShadow: [
          BoxShadow(
            color: AppColors.sale.withValues(alpha: 0.45),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
      child: Text(
        count > 99 ? '99+' : '$count',
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w900,
          height: 1.1,
        ),
      ),
    );
  }
}

class _ButterflyHub extends StatelessWidget {
  static const _asset = 'assets/images/nav_butterfly.png';

  final bool selected;
  final VoidCallback onTap;

  const _ButterflyHub({
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedScale(
            scale: selected ? 1.12 : 1.0,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutBack,
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: selected ? 0.45 : 0.18),
                    blurRadius: selected ? 28 : 16,
                    spreadRadius: selected ? 2 : 0,
                  ),
                  BoxShadow(
                    color: AppColors.textPrimary.withValues(alpha: 0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Image.asset(
                _asset,
                width: 64,
                height: 64,
                fit: BoxFit.contain,
                filterQuality: FilterQuality.high,
                gaplessPlayback: true,
              ),
            ),
          ),
          const SizedBox(height: 2),
          AnimatedContainer(
            duration: const Duration(milliseconds: 280),
            curve: Curves.easeOutCubic,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              gradient: selected
                  ? const LinearGradient(
                      colors: [AppColors.primary, Color(0xFFFF4D8D)],
                    )
                  : null,
              color: selected ? null : AppColors.surface.withValues(alpha: 0.9),
              borderRadius: BorderRadius.circular(AppRadius.pill),
              border: Border.all(
                color: selected ? Colors.transparent : AppColors.border,
              ),
              boxShadow: selected
                  ? [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.35),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ]
                  : null,
            ),
            child: Text(
              'العروض',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: selected ? Colors.white : AppColors.textMuted,
                height: 1,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
