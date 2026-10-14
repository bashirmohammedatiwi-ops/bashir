import 'package:flutter/material.dart';

/// سلّم الخطوط الموحّد — 10 مستويات فقط لكل التطبيق.
///
/// الأنماط بلا لون عمداً: اللون يأتي من الثيم (حبر العالم النشط)،
/// ويُضاف عند الحاجة بـ `.copyWith(color: ...)`.
abstract final class AppText {
  /// عناوين البطاقات الكبيرة وأغلفة الأقسام.
  static const display = TextStyle(fontSize: 26, fontWeight: FontWeight.w800, height: 1.25, letterSpacing: -0.2);

  /// عنوان الشاشة الكبير.
  static const title1 = TextStyle(fontSize: 21, fontWeight: FontWeight.w800, height: 1.3);

  /// عنوان القسم داخل الشاشة.
  static const title2 = TextStyle(fontSize: 18, fontWeight: FontWeight.w800, height: 1.3);

  /// عنوان بطاقة / عنصر قائمة مهم.
  static const title3 = TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700, height: 1.35);

  static const body = TextStyle(fontSize: 14.5, fontWeight: FontWeight.w500, height: 1.6);
  static const bodySmall = TextStyle(fontSize: 13, fontWeight: FontWeight.w500, height: 1.5);

  /// أزرار، شرائح، تبويبات.
  static const label = TextStyle(fontSize: 13, fontWeight: FontWeight.w700, height: 1.3);

  static const caption = TextStyle(fontSize: 12, fontWeight: FontWeight.w500, height: 1.4);

  /// شارات صغيرة وأعداد.
  static const micro = TextStyle(fontSize: 11, fontWeight: FontWeight.w700, height: 1.2);

  static const price = TextStyle(fontSize: 15, fontWeight: FontWeight.w800, height: 1.15);
  static const priceLarge = TextStyle(fontSize: 24, fontWeight: FontWeight.w800, height: 1.1, letterSpacing: -0.3);
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
