import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// ثيم صفحة تفاصيل المنتج — أنيق، بسيط، ألوان اللوغو.
abstract final class ProductDetailTheme {
  static const galleryBg = Color(0xFFFFFCFD);
  static const sheetRadius = 26.0;
  static const overlap = 20.0;
  static const padH = 18.0;
  static const sectionGap = 12.0;

  static BoxDecoration sheetDecoration() => const BoxDecoration(
        color: AppColors.scaffold,
        borderRadius: BorderRadius.vertical(top: Radius.circular(sheetRadius)),
      );

  static BoxDecoration heroCardDecoration() => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.primarySoft.withValues(alpha: 0.55)),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      );

  static BoxDecoration sectionDecoration() => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.hairline.withValues(alpha: 0.65)),
      );

  static BoxDecoration shadeSectionDecoration() => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primarySoft.withValues(alpha: 0.7)),
      );

  static BoxDecoration chipDecoration({bool active = false}) => BoxDecoration(
        color: active ? AppColors.primaryLight : AppColors.elevated,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(
          color: active ? AppColors.primary.withValues(alpha: 0.25) : AppColors.hairline,
        ),
      );

  static BoxDecoration stockPillDecoration(Color color) => BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: color.withValues(alpha: 0.22)),
      );

  static BoxDecoration bottomBarDecoration() => BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.hairline.withValues(alpha: 0.8))),
      );

  static TextStyle sectionTitleStyle = const TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w800,
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  );

  static TextStyle brandStyle = const TextStyle(
    color: AppColors.accent,
    fontWeight: FontWeight.w800,
    fontSize: 10.5,
    letterSpacing: 1.4,
  );
}
