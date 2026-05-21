import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';

/// نظام تيبوغرافيا فاخر:
/// - Playfair Display (Serif Italic): لمسة بوتيكية للأرقام والشعارات اللاتينية.
/// - Cormorant Garamond: عناوين أنيقة للمنتجات (Editorial).
/// - Cairo: نصوص عربية بأوزان متناغمة.
abstract final class AppTextStyles {
  // ── Base styles (cached) ─────────────────────────────────────
  static final TextStyle _displayBase = GoogleFonts.cairo(
    fontWeight: FontWeight.w800,
    fontSize: 30,
    color: AppColors.textPrimary,
    letterSpacing: -0.7,
    height: 1.18,
  );
  static final TextStyle _headlineBase = GoogleFonts.cairo(
    fontWeight: FontWeight.w800,
    fontSize: 22,
    color: AppColors.textPrimary,
    letterSpacing: -0.4,
    height: 1.22,
  );
  static final TextStyle _titleBase = GoogleFonts.cairo(
    fontWeight: FontWeight.w700,
    fontSize: 16,
    color: AppColors.textPrimary,
    letterSpacing: -0.2,
    height: 1.3,
  );
  static final TextStyle _bodyBase = GoogleFonts.cairo(
    fontWeight: FontWeight.w400,
    fontSize: 13,
    color: AppColors.textPrimary,
    height: 1.6,
  );
  static final TextStyle _captionBase = GoogleFonts.cairo(
    fontWeight: FontWeight.w500,
    fontSize: 11,
    color: AppColors.textSecondary,
    height: 1.4,
  );

  static TextStyle display({Color? color, double? size, FontWeight? weight}) =>
      _displayBase.copyWith(color: color, fontSize: size, fontWeight: weight);

  static TextStyle headline({Color? color, double? size, FontWeight? weight}) =>
      _headlineBase.copyWith(color: color, fontSize: size, fontWeight: weight);

  static TextStyle title({Color? color, double? size, FontWeight? weight}) =>
      _titleBase.copyWith(color: color, fontSize: size, fontWeight: weight);

  static TextStyle body({Color? color, double? size, FontWeight? weight}) =>
      _bodyBase.copyWith(color: color, fontSize: size, fontWeight: weight);

  static TextStyle caption({Color? color, double? size, FontWeight? weight}) =>
      _captionBase.copyWith(color: color, fontSize: size, fontWeight: weight);

  /// Serif Italic (Playfair) — للأرقام واللمسات الكلاسيكية.
  static TextStyle serif({
    Color? color,
    double? size,
    FontWeight? weight,
    FontStyle? style,
  }) =>
      GoogleFonts.playfairDisplay(
        color: color ?? AppColors.textPrimary,
        fontSize: size ?? 22,
        fontWeight: weight ?? FontWeight.w500,
        letterSpacing: -0.3,
        height: 1.15,
        fontStyle: style ?? FontStyle.normal,
      );

  /// Editorial Serif (Cormorant) — لعناوين Editorial في الـ Hero/المنتجات.
  static TextStyle editorial({
    Color? color,
    double? size,
    FontWeight? weight,
    FontStyle? style,
  }) =>
      GoogleFonts.cormorantGaramond(
        color: color ?? AppColors.textPrimary,
        fontSize: size ?? 28,
        fontWeight: weight ?? FontWeight.w500,
        letterSpacing: -0.4,
        height: 1.18,
        fontStyle: style ?? FontStyle.normal,
      );

  /// Splash / brand wordmark
  static TextStyle brandLatin({Color? color, double? size}) =>
      GoogleFonts.playfairDisplay(
        fontSize: size ?? 38,
        fontWeight: FontWeight.w400,
        color: color ?? AppColors.primaryDark,
        letterSpacing: 6,
        height: 1,
        fontStyle: FontStyle.italic,
      );

  static TextStyle brandArabic({Color? color, double? size}) =>
      GoogleFonts.cairo(
        fontSize: size ?? 24,
        fontWeight: FontWeight.w800,
        color: color ?? AppColors.primary,
        height: 1.15,
        letterSpacing: -0.4,
      );

  static TextStyle brandTagline({Color? color, double? size}) =>
      GoogleFonts.cairo(
        fontSize: size ?? 11,
        fontWeight: FontWeight.w500,
        color: color ?? AppColors.textSecondary,
        letterSpacing: 3,
      );
}
