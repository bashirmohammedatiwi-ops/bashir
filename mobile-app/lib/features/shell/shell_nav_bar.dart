import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text.dart';
import '../../core/utils/responsive.dart';
import '../worlds/world_theme.dart';
import 'nav_tabs.dart';

/// شريط التنقل: كبسولة زجاجية بيضاء عائمة بنفس لغة محدّد العوالم —
/// التبويب المختار يتمدّد إلى حبّة بتدرّج لون العالم تحمل أيقونته واسمه،
/// والبقية أيقونات رفيعة هادئة. كل الانتقالات ناعمة ومتزامنة.
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

  static const barHeight = 66.0;
  static const _dur = Duration(milliseconds: 460);
  static const _curve = Curves.easeOutQuart;
  static const _pad = 7.0;

  static double bottomGap(BuildContext context) {
    final inset = Responsive.systemBottomInset(context);
    return inset > 0 ? inset - 8 : 12;
  }

  @override
  Widget build(BuildContext context) {
    final items = <_NavItem>[
      _NavItem(NavTabs.home, HugeIcons.strokeRoundedHome09, strings.navHome),
      _NavItem(
        NavTabs.categories,
        HugeIcons.strokeRoundedDashboardSquare02,
        strings.navCategories,
      ),
      _NavItem(
        NavTabs.brands,
        HugeIcons.strokeRoundedCrown,
        strings.navBrands,
      ),
      _NavItem(
        NavTabs.offers,
        HugeIcons.strokeRoundedDiscountTag02,
        strings.navOffers,
      ),
      _NavItem(
        NavTabs.cart,
        HugeIcons.strokeRoundedShoppingBag02,
        strings.navCart,
        badge: cartCount,
      ),
      _NavItem(
        NavTabs.account,
        HugeIcons.strokeRoundedUser,
        strings.navAccount,
      ),
    ];

    // نفس لون حبّة العالم المختار في الرئيسية.
    final pill = Color.lerp(theme.accent, Colors.black, 0.1)!;

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, bottomGap(context)),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 420),
        height: barHeight,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(barHeight / 2),
          boxShadow: [
            BoxShadow(
              color: pill.withValues(alpha: 0.16),
              blurRadius: 34,
              offset: const Offset(0, 14),
              spreadRadius: -6,
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(barHeight / 2),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.white.withValues(alpha: 0.92),
                    Color.lerp(
                      Colors.white,
                      theme.accentLight,
                      0.6,
                    )!.withValues(alpha: 0.88),
                  ],
                ),
                borderRadius: BorderRadius.circular(barHeight / 2),
                border: Border.all(color: Colors.white, width: 1.2),
              ),
              child: Padding(
                padding: const EdgeInsets.all(_pad),
                child: LayoutBuilder(
                  builder: (context, c) {
                    final w = c.maxWidth;
                    final selW = (w * 0.36).clamp(108.0, 150.0);
                    final otherW = (w - selW) / (items.length - 1);
                    return Row(
                      children: [
                        for (final item in items)
                          _NavTab(
                            item: item,
                            selected: item.index == currentIndex,
                            width: item.index == currentIndex ? selW : otherW,
                            pill: pill,
                            idle: theme.ink.withValues(alpha: 0.5),
                            onTap: () {
                              if (item.index != currentIndex) {
                                HapticFeedback.selectionClick();
                              }
                              onSelect(item.index);
                            },
                          ),
                      ],
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final int index;
  final List<List<dynamic>> icon;
  final String label;
  final int badge;
  const _NavItem(this.index, this.icon, this.label, {this.badge = 0});
}

class _NavTab extends StatelessWidget {
  final _NavItem item;
  final bool selected;
  final double width;
  final Color pill;
  final Color idle;
  final VoidCallback onTap;

  const _NavTab({
    required this.item,
    required this.selected,
    required this.width,
    required this.pill,
    required this.idle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final icon = Stack(
      clipBehavior: Clip.none,
      children: [
        TweenAnimationBuilder<Color?>(
          tween: ColorTween(end: selected ? Colors.white : idle),
          duration: const Duration(milliseconds: 300),
          builder: (_, c, __) => HugeIcon(
            icon: item.icon,
            color: c ?? idle,
            size: 23,
            strokeWidth: selected ? 1.8 : 1.6,
          ),
        ),
        if (item.badge > 0)
          PositionedDirectional(
            top: -6,
            end: -8,
            child: _Badge(count: item.badge),
          ),
      ],
    );

    return Semantics(
      button: true,
      selected: selected,
      label: item.label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: ShellNavBar._dur,
          curve: ShellNavBar._curve,
          width: width,
          alignment: Alignment.center,
          child: AnimatedContainer(
            duration: ShellNavBar._dur,
            curve: ShellNavBar._curve,
            height: double.infinity,
            padding: EdgeInsets.symmetric(horizontal: selected ? 14 : 0),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: selected
                    ? [Color.lerp(pill, Colors.white, 0.18)!, pill]
                    : [pill.withValues(alpha: 0), pill.withValues(alpha: 0)],
              ),
              boxShadow: selected
                  ? [
                      BoxShadow(
                        color: pill.withValues(alpha: 0.36),
                        blurRadius: 14,
                        offset: const Offset(0, 6),
                      ),
                    ]
                  : const [],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AnimatedScale(
                  scale: selected ? 1.0 : 0.96,
                  duration: ShellNavBar._dur,
                  curve: Curves.easeOutBack,
                  child: icon,
                ),
                // الاسم ينفتح بجانب الأيقونة داخل الحبّة.
                Flexible(
                  child: ClipRect(
                    child: AnimatedSize(
                      duration: ShellNavBar._dur,
                      curve: ShellNavBar._curve,
                      alignment: AlignmentDirectional.centerStart,
                      child: selected
                          ? Padding(
                              padding: const EdgeInsetsDirectional.only(
                                start: 7,
                              ),
                              child: TweenAnimationBuilder<double>(
                                tween: Tween(begin: 0, end: 1),
                                duration: const Duration(milliseconds: 380),
                                curve: Curves.easeOut,
                                builder: (_, v, child) => Opacity(
                                  opacity: v,
                                  child: Transform.translate(
                                    offset: Offset(0, (1 - v) * 4),
                                    child: child,
                                  ),
                                ),
                                child: Text(
                                  item.label,
                                  maxLines: 1,
                                  softWrap: false,
                                  overflow: TextOverflow.fade,
                                  style: AppText.label.copyWith(
                                    color: Colors.white,
                                    fontSize: 13,
                                    height: 1,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            )
                          : const SizedBox(height: 0, width: 0),
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

/// شارة السلة — تنبض عند تغيّر العدد.
class _Badge extends StatelessWidget {
  final int count;
  const _Badge({required this.count});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      key: ValueKey(count),
      tween: Tween(begin: 1.45, end: 1.0),
      duration: const Duration(milliseconds: 520),
      curve: Curves.elasticOut,
      builder: (_, s, child) => Transform.scale(scale: s, child: child),
      child: Container(
        constraints: const BoxConstraints(minWidth: 17, minHeight: 17),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.sale,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: Colors.white, width: 1.6),
        ),
        child: Text(
          count > 9 ? '9+' : '$count',
          style: AppText.micro.copyWith(
            color: Colors.white,
            fontSize: 9.5,
            height: 1,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

/// ارتفاع منطقة الشريط كاملة (مع الهوامش ومؤشر النظام).
double shellNavOuterHeight(BuildContext context) =>
    Responsive.shellNavDockHeight(context);
