import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// ثيم موحّد لصفحة قائمة المنتجات.
abstract final class ListingTheme {
  static const canvas = AppColors.scaffold;
  static const headerBg = Color(0xFFFFFBFC);
  static const card = Colors.white;
  static const wash = AppColors.primaryLight;
  static const chipBg = Color(0xFFF3F0F2);

  static const cardRadius = 20.0;
  static const chipRadius = 14.0;
  static const padH = 16.0;

  static BoxDecoration cardDecoration() => BoxDecoration(
        color: card,
        borderRadius: BorderRadius.circular(cardRadius),
        border: Border.all(color: AppColors.hairline.withValues(alpha: 0.75)),
        boxShadow: AppColors.cardShadow,
      );

  static TextStyle sectionTitle = const TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.2,
    color: AppColors.textPrimary,
  );

  static TextStyle sectionHint = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    color: AppColors.textMuted.withValues(alpha: 0.95),
  );
}
