import 'package:flutter/material.dart';

import '../../worlds/world_theme.dart';

/// ثيم صفحة تفاصيل المنتج — يتبع العالم النشط.
abstract final class ProductDetailTheme {
  static const sheetRadius = 26.0;
  static const overlap = 20.0;
  static const padH = 18.0;
  static const sectionGap = 14.0;

  static Color galleryBg(BuildContext context) => context.worldTheme.blush;

  static BoxDecoration sheetDecoration(BuildContext context) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: t.canvas,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(sheetRadius)),
      boxShadow: [
        BoxShadow(
          color: t.ink.withValues(alpha: 0.05),
          blurRadius: 24,
          offset: const Offset(0, -6),
        ),
      ],
    );
  }

  static BoxDecoration heroCardDecoration(BuildContext context) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: t.surface,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: t.hairline.withValues(alpha: 0.55)),
    );
  }

  static BoxDecoration sectionDecoration(BuildContext context) => BoxDecoration(
        color: context.worldTheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: context.worldTheme.hairline.withValues(alpha: 0.6)),
      );

  static BoxDecoration shadeSectionDecoration(BuildContext context) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: t.surface,
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: t.accentSoft.withValues(alpha: 0.55)),
    );
  }

  static BoxDecoration chipDecoration(BuildContext context, {bool active = false}) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: active ? t.accentLight : t.canvasWarm,
      borderRadius: BorderRadius.circular(99),
      border: Border.all(
        color: active ? t.accent.withValues(alpha: 0.25) : t.hairline,
      ),
    );
  }

  static BoxDecoration stockPillDecoration(Color color) => BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: color.withValues(alpha: 0.22)),
      );

  static BoxDecoration bottomBarDecoration(BuildContext context) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: t.surface,
      border: Border(top: BorderSide(color: t.hairline.withValues(alpha: 0.8))),
      boxShadow: [
        BoxShadow(
          color: t.accentDark.withValues(alpha: 0.06),
          blurRadius: 20,
          offset: const Offset(0, -4),
        ),
      ],
    );
  }

  static TextStyle sectionTitleStyle(BuildContext context) => TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w800,
        color: context.worldTheme.ink,
        letterSpacing: -0.3,
      );

  static TextStyle brandStyle(BuildContext context) => TextStyle(
        color: context.worldTheme.accentDark,
        fontWeight: FontWeight.w800,
        fontSize: 10.5,
        letterSpacing: 0.4,
      );
}
