import 'package:flutter/material.dart';
import 'app_colors.dart';

/// أنماط نص متجر فاخر — تدرج واضح للعناوين والأسعار.
///
/// قديم: سلّم ثانٍ يخالف `AppText` في الأحجام والأوزان. الشاشات الجديدة تستعمل
/// AppText (sectionTitle ← title2، caption ← caption، price ← price)، وهذا الملف
/// يُحذف بعد نقل آخر استخدام. الأوزان هنا محصورة في 700 (أثقل وزن في الخط)
/// والتباعد صفر حتى لا ينقطع وصل الحروف العربية.
@Deprecated('استعملي AppText من core/theme/app_text.dart')
abstract final class AppTypography {
  static const display = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    letterSpacing: 0,
    height: 1.1,
  );

  static const sectionTitle = TextStyle(
    fontSize: 19,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    letterSpacing: 0,
    height: 1.15,
  );

  static const screenTitle = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    letterSpacing: 0,
  );

  static const body = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: AppColors.textPrimary,
    letterSpacing: 0,
    height: 1.45,
  );

  static const bodyStrong = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    letterSpacing: 0,
    height: 1.35,
  );

  static const caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: AppColors.textMuted,
    letterSpacing: 0,
    height: 1.35,
  );

  static const overline = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    color: AppColors.textSecondary,
    letterSpacing: 0,
    height: 1.2,
  );

  static const price = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: AppColors.primary,
    letterSpacing: 0,
    height: 1.1,
  );

  static const priceLarge = TextStyle(
    fontSize: 26,
    fontWeight: FontWeight.w700,
    color: AppColors.primary,
    letterSpacing: 0,
  );

  static const brand = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    color: AppColors.primary,
    letterSpacing: 0,
    height: 1.1,
  );
}
