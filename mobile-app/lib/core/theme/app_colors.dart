import 'package:flutter/material.dart';

/// هوية متجر الحياة — تركواز اللوغو مع فحم عميق ولمسة ذهبية هادئة،
/// والوردي لون العروض والتخفيضات والقلوب.
///
/// المصدر الوحيد للحقيقة اللونية: بقية الثيمات (CartTheme/HomeTheme/
/// OffersTheme/...) تقرأ من هنا ولا تعرّف ثوابت خاصة.
class AppColors {
  AppColors._();

  // الهوية الأساسية (تركواز اللوغو)
  static const Color primary = Color(0xFF3A9E8F);
  static const Color primaryDark = Color(0xFF2F7F73);
  static const Color primaryLight = Color(0xFFE8F5F3);
  static const Color primarySoft = Color(0xFFF4FAF9);
  static const Color onPrimary = Color(0xFFFFFFFF);

  // الوردي — مخصص للعروض والتخفيضات والمفضلة
  static const Color rose = Color(0xFFD41F5C);
  static const Color roseDark = Color(0xFFA01545);
  static const Color roseLight = Color(0xFFFFF0F4);
  static const Color roseSoft = Color(0xFFFFE4EC);
  static const Color blush = Color(0xFFFFF7F9);

  // لمسة فاخرة (ذهبي)
  static const Color accent = Color(0xFFB8954A);
  static const Color accentSoft = Color(0xFFF7F0E4);
  static const Color ink = Color(0xFF2D2D2D);

  // خلفيات
  static const Color scaffold = Color(0xFFF6FAF9);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color card = Color(0xFFFFFFFF);
  static const Color elevated = Color(0xFFFAFCFB);

  // نصوص — رمادية واحدة عبر التطبيق
  static const Color textPrimary = Color(0xFF2D2D2D);
  static const Color textSecondary = Color(0xFF6B7A76);
  static const Color textMuted = Color(0xFF9AABA6);

  // حالات
  static const Color sale = Color(0xFFE11D48);
  static const Color success = Color(0xFF0F8A4F);
  static const Color warning = Color(0xFFE8A317);
  static const Color star = Color(0xFFF5B942);

  // حدود — حد واحد وdivider واحد لكل التطبيق
  static const Color border = Color(0xFFE3EDEA);
  static const Color divider = Color(0xFFEDF3F1);
  static const Color hairline = Color(0xFFE3EDEA);

  // الرئيسية
  static const Color homeGradientTop = Color(0xFFF6FAF9);
  static const Color homeGradientMid = Color(0xFFFAFCFB);
  static const Color homeSurface = Color(0xFFFFFFFF);

  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryDark],
  );

  static const LinearGradient roseGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFE83A72), roseDark],
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

  static const Color shimmerBase = Color(0xFFE9F0EE);
  static const Color shimmerHighlight = Color(0xFFF8FBFA);

  // مخزنة مرة واحدة — الظلال تُقرأ في كل build ولا يجب أن تُنشأ قوائم جديدة.
  static final List<BoxShadow> softShadow = [
    BoxShadow(
      color: ink.withValues(alpha: 0.05),
      blurRadius: 18,
      offset: const Offset(0, 6),
    ),
  ];

  static final List<BoxShadow> cardShadow = [
    BoxShadow(
      color: ink.withValues(alpha: 0.045),
      blurRadius: 14,
      offset: const Offset(0, 4),
    ),
  ];

  static final List<BoxShadow> elevatedShadow = [
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
