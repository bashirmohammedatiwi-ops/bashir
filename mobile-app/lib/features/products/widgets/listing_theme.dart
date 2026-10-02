import 'package:flutter/material.dart';

import '../../worlds/world_theme.dart';

/// ثيم موحّد لصفحة قائمة المنتجات — يتبع العالم النشط.
abstract final class ListingTheme {
  static const cardRadius = 20.0;
  static const chipRadius = 14.0;
  static const padH = 16.0;

  static Color canvas(BuildContext context) => context.worldTheme.canvas;

  static Color headerBg(BuildContext context) => context.worldTheme.surface;

  static Color card(BuildContext context) => context.worldTheme.surface;

  static Color wash(BuildContext context) => context.worldTheme.accentLight;

  static Color chipBg(BuildContext context) => context.worldTheme.canvasWarm;

  static BoxDecoration cardDecoration(BuildContext context) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: t.surface,
      borderRadius: BorderRadius.circular(cardRadius),
      border: Border.all(color: t.hairline.withValues(alpha: 0.75)),
      boxShadow: t.cardShadow,
    );
  }

  static TextStyle sectionTitle(BuildContext context) => TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.2,
        color: context.worldTheme.ink,
      );

  static TextStyle sectionHint(BuildContext context) => TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: context.worldTheme.inkMuted.withValues(alpha: 0.95),
      );
}
