import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// ثيم صفحة تفاصيل المنتج.
abstract final class ProductDetailTheme {
  static const galleryBg = Color(0xFFF5F5F5);
  static const sheetRadius = 28.0;
  static const overlap = 22.0;
  static const padH = 16.0;

  static BoxDecoration sheetDecoration() => BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(sheetRadius)),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, -4),
          ),
        ],
      );

  static BoxDecoration sectionDecoration() => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.hairline.withValues(alpha: 0.8)),
      );

  static BoxDecoration priceBoxDecoration() => BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primaryLight.withValues(alpha: 0.55),
            Colors.white,
          ],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primarySoft),
      );
}
