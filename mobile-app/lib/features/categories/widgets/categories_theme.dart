import 'package:flutter/material.dart';

/// ثيم صفحة الأقسام — إطار ناعم مع بلور خفيف (أسلوب Sephora).
abstract final class CategoriesTheme {
  static const pad = 12.0;
  static const gap = 12.0;

  static const cardRadius = 6.0;
  static const cardAspectRatio = 1.48;
  static const subCardAspectRatio = 1.22;
  static const titlePad = 12.0;
  static const titleSize = 14.0;
  static const titleZoneHeight = 34.0;
  static const subFooterHeight = 28.0;
  static const iconScale = 0.97;
  static const iconHeightScale = 1.0;

  static SliverGridDelegate get subGridDelegate =>
      const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: gap,
        crossAxisSpacing: gap,
        childAspectRatio: subCardAspectRatio,
      );

  static const chipRadius = 4.0;
  static const cardBorderWidth = 1.0;

  static const canvas = Color(0xFFFFFFFF);
  static const surface = Color(0xFFFFFFFF);
  static const imageBg = Color(0xFFF7F7F7);
  static const cardBorderColor = Color(0xFFE6E6E6);
  static const titleColor = Color(0xFF000000);

  static const transition = Duration(milliseconds: 320);
  static const transitionReverse = Duration(milliseconds: 280);
  static const imageFadeIn = Duration(milliseconds: 280);
  static const curve = Curves.easeOutCubic;
  static const curveIn = Curves.easeOutCubic;
  static const curveOut = Curves.easeInCubic;

  /// حركة التنقّل بين الجذر والأقسام الفرعية.
  static const navEnterDistance = 0.10;
  static const navExitDistance = 0.04;
  static const navSlideIn = Cubic(0.22, 1.0, 0.36, 1.0);
  static const navSlideOut = Cubic(0.4, 0.0, 0.78, 1.0);

  /// بلور منتشر خفيف جداً حول البطاقة.
  static List<BoxShadow> cardGlow({double radius = cardRadius}) => [
        BoxShadow(
          color: const Color(0x12000000),
          blurRadius: 10,
          spreadRadius: 0.5,
          offset: const Offset(0, 2),
        ),
        BoxShadow(
          color: const Color(0x08000000),
          blurRadius: 18,
          spreadRadius: 1,
          offset: const Offset(0, 4),
        ),
        BoxShadow(
          color: const Color(0x0D000000),
          blurRadius: 2,
          spreadRadius: 0,
          offset: const Offset(0, 0),
        ),
      ];

  static SliverGridDelegate get gridDelegate => const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: gap,
        crossAxisSpacing: gap,
        childAspectRatio: cardAspectRatio,
      );

  static BoxDecoration cardDecoration({double radius = cardRadius, bool withGlow = true}) => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: cardBorderColor, width: cardBorderWidth),
        boxShadow: withGlow ? cardGlow(radius: radius) : null,
      );

  static BoxDecoration cardBorder({double radius = cardRadius}) => cardDecoration(radius: radius);

  static BoxDecoration searchBar() => cardDecoration(radius: cardRadius);
}

/// سطح بإطار ناعم وبلور خفيف — للبطاقات والعناصر الفرعية.
class CategoriesFramedSurface extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double radius;
  final bool withGlow;

  const CategoriesFramedSurface({
    super.key,
    required this.child,
    this.onTap,
    this.radius = CategoriesTheme.cardRadius,
    this.withGlow = true,
  });

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: CategoriesTheme.cardDecoration(radius: radius, withGlow: withGlow),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: Material(
          color: CategoriesTheme.surface,
          elevation: 0,
          shadowColor: Colors.transparent,
          child: onTap == null
              ? child
              : InkWell(
                  onTap: onTap,
                  splashColor: const Color(0x12000000),
                  highlightColor: const Color(0x08000000),
                  child: child,
                ),
        ),
      ),
    );
  }
}
