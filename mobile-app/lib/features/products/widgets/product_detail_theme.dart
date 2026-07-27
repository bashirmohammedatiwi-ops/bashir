import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// ثيم صفحة تفاصيل المنتج — أنيق، نظيف، بسيط.
abstract final class ProductDetailTheme {
  static const galleryBg = Color(0xFFFBF8F9);
  static const sheetRadius = 32.0;
  static const overlap = 26.0;
  static const padH = 18.0;
  static const sectionGap = 12.0;

  static BoxDecoration sheetDecoration() => BoxDecoration(
        color: AppColors.scaffold,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(sheetRadius)),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.05),
            blurRadius: 28,
            offset: const Offset(0, -6),
          ),
        ],
      );

  static BoxDecoration heroCardDecoration() => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: AppColors.cardShadow,
      );

  static BoxDecoration sectionDecoration() => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.03),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      );

  static BoxDecoration chipDecoration({bool active = false}) => BoxDecoration(
        color: active ? AppColors.primaryLight : AppColors.elevated,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(
          color: active ? AppColors.primary.withValues(alpha: 0.35) : AppColors.hairline,
          width: 0.8,
        ),
      );

  static BoxDecoration bottomBarDecoration() => BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
      );

  static TextStyle sectionTitleStyle = const TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w800,
    color: AppColors.textPrimary,
    letterSpacing: -0.2,
  );
}
