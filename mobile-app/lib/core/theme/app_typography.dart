import 'package:flutter/material.dart';
import 'app_colors.dart';

/// أنماط نص متجر فاخر — تدرج واضح للعناوين والأسعار.
abstract final class AppTypography {
  static const display = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w900,
    color: AppColors.textPrimary,
    letterSpacing: -0.8,
    height: 1.1,
  );

  static const sectionTitle = TextStyle(
    fontSize: 19,
    fontWeight: FontWeight.w900,
    color: AppColors.textPrimary,
    letterSpacing: -0.4,
    height: 1.15,
  );

  static const screenTitle = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w800,
    color: AppColors.textPrimary,
    letterSpacing: -0.2,
  );

  static const body = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: AppColors.textPrimary,
    height: 1.45,
  );

  static const bodyStrong = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    height: 1.35,
  );

  static const caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: AppColors.textMuted,
    height: 1.35,
  );

  static const overline = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    color: AppColors.textSecondary,
    letterSpacing: 0.4,
    height: 1.2,
  );

  static const price = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w900,
    color: AppColors.primary,
    height: 1.1,
  );

  static const priceLarge = TextStyle(
    fontSize: 26,
    fontWeight: FontWeight.w900,
    color: AppColors.primary,
    letterSpacing: -0.5,
  );

  static const brand = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    color: AppColors.primary,
    letterSpacing: 0.2,
    height: 1.1,
  );
}
