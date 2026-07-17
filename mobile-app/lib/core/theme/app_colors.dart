import 'package:flutter/material.dart';

/// هوية متجر الحياة — ورد فاخر مع حبر عميق ولمسة ذهبية هادئة.
class AppColors {
  AppColors._();

  // الهوية
  static const Color primary = Color(0xFFD41F5C);
  static const Color primaryDark = Color(0xFFA01545);
  static const Color primaryLight = Color(0xFFFFF0F4);
  static const Color primarySoft = Color(0xFFFFE4EC);
  static const Color onPrimary = Color(0xFFFFFFFF);

  // لمسة فاخرة
  static const Color accent = Color(0xFFB8954A);
  static const Color accentSoft = Color(0xFFF7F0E4);
  static const Color ink = Color(0xFF14121A);
  static const Color blush = Color(0xFFFFF7F9);

  // خلفيات
  static const Color scaffold = Color(0xFFF8F5F6);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color card = Color(0xFFFFFFFF);
  static const Color elevated = Color(0xFFFFFBFC);

  // نصوص
  static const Color textPrimary = Color(0xFF14121A);
  static const Color textSecondary = Color(0xFF6A6570);
  static const Color textMuted = Color(0xFF9B95A0);

  // حالات
  static const Color sale = Color(0xFFE11D48);
  static const Color success = Color(0xFF0F8A4F);
  static const Color warning = Color(0xFFE8A317);
  static const Color star = Color(0xFFF5B942);

  // حدود
  static const Color border = Color(0xFFECE7EA);
  static const Color divider = Color(0xFFF2EEF0);
  static const Color hairline = Color(0xFFE6E0E3);

  // الرئيسية
  static const Color homeGradientTop = Color(0xFFFFF5F8);
  static const Color homeGradientMid = Color(0xFFFBF7F8);
  static const Color homeSurface = Color(0xFFFFFFFF);

  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFE83A72), primaryDark],
  );

  static const LinearGradient luxuryGradient = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [Color(0xFFFFE8EF), Color(0xFFFFF8F5), Color(0xFFF5EDE0)],
  );

  static const LinearGradient offerHeroGradient = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [Color(0xFF2A1220), Color(0xFF5C1A38), Color(0xFFD41F5C)],
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
    colors: [Color(0xFFFFF0F4), Color(0xFFFFFBFD)],
  );

  static const Color shimmerBase = Color(0xFFEDE9EB);
  static const Color shimmerHighlight = Color(0xFFF9F6F7);

  static List<BoxShadow> get softShadow => [
        BoxShadow(
          color: ink.withValues(alpha: 0.05),
          blurRadius: 18,
          offset: const Offset(0, 6),
        ),
      ];

  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: ink.withValues(alpha: 0.045),
          blurRadius: 14,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> get elevatedShadow => [
        BoxShadow(
          color: primary.withValues(alpha: 0.12),
          blurRadius: 24,
          offset: const Offset(0, 10),
        ),
        BoxShadow(
          color: ink.withValues(alpha: 0.04),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ];
}
