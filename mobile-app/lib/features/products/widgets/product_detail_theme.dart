import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// ثيم صفحة تفاصيل المنتج — ألوان اللوغو (وردي + ذهبي).
abstract final class ProductDetailTheme {
  static const galleryBg = AppColors.blush;
  static const sheetRadius = 28.0;
  static const overlap = 24.0;
  static const padH = 16.0;
  static const sectionGap = 10.0;

  static BoxDecoration sheetDecoration() => BoxDecoration(
        color: AppColors.scaffold,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(sheetRadius)),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, -8),
          ),
        ],
      );

  static BoxDecoration heroCardDecoration() => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primarySoft.withValues(alpha: 0.7)),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      );

  static BoxDecoration sectionDecoration() => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.hairline.withValues(alpha: 0.8)),
      );

  static BoxDecoration shadeSectionDecoration() => BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [
            AppColors.primaryLight.withValues(alpha: 0.65),
            Colors.white,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primarySoft),
      );

  static BoxDecoration chipDecoration({bool active = false}) => BoxDecoration(
        color: active ? AppColors.primaryLight : AppColors.elevated,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(
          color: active ? AppColors.primary.withValues(alpha: 0.4) : AppColors.hairline,
          width: active ? 1.2 : 0.8,
        ),
      );

  static BoxDecoration bottomBarDecoration() => BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, -6),
          ),
        ],
      );

  static TextStyle sectionTitleStyle = const TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w800,
    color: AppColors.textPrimary,
    letterSpacing: -0.2,
  );
}
