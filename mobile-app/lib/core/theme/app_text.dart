import 'package:flutter/material.dart';

import 'app_fonts.dart';

/// سلّم الخطوط الموحّد — 10 مستويات فقط لكل التطبيق.
///
/// الأنماط بلا لون عمداً: اللون يأتي من الثيم (حبر العالم النشط)،
/// ويُضاف عند الحاجة بـ `.copyWith(color: ...)`.
///
/// الخط مذكور صراحةً حتى يُرسم بالوزن الحقيقي حتى خارج DefaultTextStyle
/// (TextPainter و RichText). أثقل وزن في الخط 700. التباعد صفر دائماً:
/// أي تباعد يقطع وصل الحروف العربية (للإنجليزية فقط استعملي [tracking]).
abstract final class AppText {
  /// عناوين البطاقات الكبيرة وأغلفة الأقسام.
  static const display = TextStyle(fontFamily: AppFonts.body, fontSize: 26, fontWeight: FontWeight.w700, height: 1.25, letterSpacing: 0);

  /// عنوان الشاشة الكبير.
  static const title1 = TextStyle(fontFamily: AppFonts.body, fontSize: 21, fontWeight: FontWeight.w700, height: 1.3, letterSpacing: 0);

  /// عنوان القسم داخل الشاشة.
  static const title2 = TextStyle(fontFamily: AppFonts.body, fontSize: 18, fontWeight: FontWeight.w700, height: 1.3, letterSpacing: 0);

  /// عنوان بطاقة / عنصر قائمة مهم.
  static const title3 = TextStyle(fontFamily: AppFonts.body, fontSize: 15.5, fontWeight: FontWeight.w700, height: 1.35, letterSpacing: 0);

  static const body = TextStyle(fontFamily: AppFonts.body, fontSize: 14.5, fontWeight: FontWeight.w500, height: 1.6, letterSpacing: 0);
  static const bodySmall = TextStyle(fontFamily: AppFonts.body, fontSize: 13, fontWeight: FontWeight.w500, height: 1.5, letterSpacing: 0);

  /// أزرار، شرائح، تبويبات.
  static const label = TextStyle(fontFamily: AppFonts.body, fontSize: 13, fontWeight: FontWeight.w700, height: 1.3, letterSpacing: 0);

  static const caption = TextStyle(fontFamily: AppFonts.body, fontSize: 12, fontWeight: FontWeight.w500, height: 1.4, letterSpacing: 0);

  /// شارات صغيرة وأعداد.
  static const micro = TextStyle(fontFamily: AppFonts.body, fontSize: 11, fontWeight: FontWeight.w700, height: 1.2, letterSpacing: 0);

  static const price = TextStyle(fontFamily: AppFonts.body, fontSize: 15, fontWeight: FontWeight.w700, height: 1.15, letterSpacing: 0);
  static const priceLarge = TextStyle(fontFamily: AppFonts.body, fontSize: 24, fontWeight: FontWeight.w700, height: 1.1, letterSpacing: 0);
}

/// زوايا موحّدة — 6 قيم فقط.
abstract final class AppCorners {
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 20;
  static const double xl = 28;
  static const double pill = 999;
}

/// أقل مساحة لمس مريحة للإصبع (إرشادات Apple/Material).
const double kMinTapTarget = 44;
