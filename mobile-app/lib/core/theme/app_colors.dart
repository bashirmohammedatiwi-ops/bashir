import 'package:flutter/material.dart';

/// هوية ديما الحياة: ليلكي أساسي، وردي للمسات الأنثوية، ورماديات باردة مائلة للبنفسجي.
class AppColors {
  AppColors._();

  // الليلكي
  static const Color primary = Color(0xFF9B6BD8);
  static const Color primaryDark = Color(0xFF6E45B0);
  static const Color primaryDeep = Color(0xFF4A2C86);
  static const Color primaryLight = Color(0xFFF6F0FE);
  static const Color primarySoft = Color(0xFFEFE6FC);
  static const Color onPrimary = Color(0xFFFFFFFF);

  // الوردي
  static const Color rose = Color(0xFFF0A7C4);
  static const Color roseDeep = Color(0xFFC0679A);
  static const Color roseSoft = Color(0xFFFDEAF2);

  // لمسة فاخرة: وردي داكن للنصوص المميزة بدل الذهبي.
  static const Color accent = roseDeep;
  static const Color accentSoft = roseSoft;
  static const Color ink = Color(0xFF1A1426);
  static const Color blush = Color(0xFFFBF8FF);

  // خلفيات
  static const Color scaffold = Color(0xFFF8F6FB);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color card = Color(0xFFFFFFFF);
  static const Color elevated = Color(0xFFFDFBFF);

  // نصوص
  static const Color textPrimary = Color(0xFF1A1426);
  static const Color textSecondary = Color(0xFF655F72);
  static const Color textMuted = Color(0xFF9891A6);

  // حالات
  static const Color sale = Color(0xFFE0457B);
  static const Color success = Color(0xFF0F8A4F);
  static const Color warning = Color(0xFFE8A317);
  static const Color star = Color(0xFFF5B942);

  // حدود
  static const Color border = Color(0xFFECE8F1);
  static const Color divider = Color(0xFFF2EFF6);
  static const Color hairline = Color(0xFFE5E0EC);

  // الرئيسية
  static const Color homeGradientTop = Color(0xFFF6F0FE);
  static const Color homeGradientMid = Color(0xFFFBF9FF);
  static const Color homeSurface = Color(0xFFFFFFFF);

  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFB08AE6), primaryDark],
  );

  /// ليلكي إلى وردي: للأزرار الرئيسية واللحظات المميزة.
  static const LinearGradient signatureGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF9B6BD8), Color(0xFFC77DBA), Color(0xFFF0A7C4)],
    stops: [0.0, 0.62, 1.0],
  );

  static const LinearGradient luxuryGradient = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [Color(0xFFF3EBFD), Color(0xFFFBF8FF), Color(0xFFFDEEF4)],
  );

  static const LinearGradient offerHeroGradient = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [Color(0xFF1E1433), Color(0xFF4A2C86), Color(0xFF9B6BD8)],
  );

  static const LinearGradient homeBackgroundGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [homeGradientTop, homeGradientMid, scaffold],
    stops: [0.0, 0.28, 1.0],
  );

  static const LinearGradient flashSaleGradient = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [Color(0xFFFDEAF2), Color(0xFFFBF8FF)],
  );

  static const Color shimmerBase = Color(0xFFECE9F1);
  static const Color shimmerHighlight = Color(0xFFF8F6FB);

  static List<BoxShadow> get softShadow => [
        BoxShadow(
          color: primaryDeep.withValues(alpha: 0.06),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
      ];

  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: primaryDeep.withValues(alpha: 0.055),
          blurRadius: 16,
          offset: const Offset(0, 6),
        ),
      ];

  static List<BoxShadow> get elevatedShadow => [
        BoxShadow(
          color: primary.withValues(alpha: 0.18),
          blurRadius: 26,
          offset: const Offset(0, 12),
        ),
        BoxShadow(
          color: ink.withValues(alpha: 0.04),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ];
}
