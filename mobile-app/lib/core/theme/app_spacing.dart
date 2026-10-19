/// مقاييس التباعد والزوايا الموحّدة في التطبيق.
abstract final class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double huge = 32;

  static const double screenH = 16;
  static const double sectionV = 10;
  static const double cardGap = 12;
  static const double productCardWidth = 164;
  static const double productRowHeight = 286;
}

/// قديم: سلّم زوايا ثانٍ (10/14/18/22) يخالف `AppCorners` (12/16/20/28).
/// المقابل: sm ← AppCorners.sm، md ← md، lg ← lg، xl ← lg أو xl، xxl ← xl.
/// يُحذف بعد نقل آخر استخدام.
@Deprecated('استعملي AppCorners من core/theme/app_text.dart')
abstract final class AppRadius {
  static const double sm = 10;
  static const double md = 14;
  static const double lg = 18;
  static const double xl = 22;
  static const double xxl = 28;
  static const double pill = 999;
}
