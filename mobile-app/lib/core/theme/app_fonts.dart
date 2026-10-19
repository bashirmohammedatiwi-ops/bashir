import 'package:flutter/material.dart';

import 'app_colors.dart';

/// أسماء عائلات الخطوط المضمّنة في التطبيق (pubspec.yaml ← fonts).
///
/// الملفات داخل الحزمة نفسها: لا تحميل من الإنترنت عند التشغيل، وكل وزن له ملفه
/// الحقيقي فيختار المحرك الأقرب لأي fontWeight (أثقل وزن متوفر 700).
abstract final class AppFonts {
  /// خط التطبيق كله (IBM Plex Sans Arabic — راقٍ وهادئ، عربي ولاتيني) بأوزان 400–700.
  static const body = 'IBMPlexSansArabic';

  /// عناوين العلامة بالعربية (El Messiri — 700).
  static const brandArabic = 'ElMessiri';

  /// عناوين العلامة بالإنجليزية (Cormorant Garamond — 600/700).
  static const brandLatin = 'CormorantGaramond';

  /// السطر اللاتيني في شاشة الافتتاح (Cinzel — 500).
  static const display = 'Cinzel';
}

/// خط التطبيق كله. تغييره هنا يغيّر كل الشاشات.
TextStyle appFont({
  TextStyle? textStyle,
  Color? color,
  double? fontSize,
  FontWeight? fontWeight,
  FontStyle? fontStyle,
  double? height,
  double? letterSpacing,
  TextDecoration? decoration,
  Color? decorationColor,
  List<Shadow>? shadows,
  List<FontFeature>? fontFeatures,
}) {
  return (textStyle ?? const TextStyle()).copyWith(
    fontFamily: AppFonts.body,
    fontFeatures: fontFeatures,
    color: color,
    fontSize: fontSize,
    fontWeight: fontWeight,
    fontStyle: fontStyle,
    height: height,
    letterSpacing: letterSpacing,
    decoration: decoration,
    decorationColor: decorationColor,
    shadows: shadows,
  );
}

/// سلّم نصوص Material بخط التطبيق.
TextTheme appTextTheme(TextTheme base) => base.apply(fontFamily: AppFonts.body);

/// تباعد الحروف حسب اللغة: العربية بلا تباعد أبداً.
///
/// المحرك يضيف المسافة بين الحروف المتصلة دون أن يمدّ خط الوصل، فتظهر فجوات
/// بين الحروف (أو تتداخل مع القيم السالبة). [v] يُطبَّق على الإنجليزية فقط.
double tracking(String lang, double v) => lang == 'ar' ? 0 : v;

/// خط العلامة التجارية — يُستخدم في الرئيسية والافتتاح فقط.
TextStyle brandTitleStyle({
  required String lang,
  double size = 22,
  Color? color,
}) {
  if (lang == 'ar') {
    return TextStyle(
      fontFamily: AppFonts.brandArabic,
      fontSize: size,
      fontWeight: FontWeight.w700,
      height: 1.12,
      letterSpacing: 0,
      color: color,
    );
  }
  return TextStyle(
    fontFamily: AppFonts.brandLatin,
    fontSize: size,
    fontWeight: FontWeight.w700,
    height: 1.18,
    letterSpacing: 0.35,
    color: color ?? AppColors.textPrimary,
  );
}

/// اسم المتجر في الهيدر — يتكيّف مع عرض الشاشة دون قصّ.
class StoreBrandTitle extends StatelessWidget {
  final String name;
  final String lang;
  final double size;
  final Color? color;

  const StoreBrandTitle({
    super.key,
    required this.name,
    required this.lang,
    this.size = 24,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final style = brandTitleStyle(lang: lang, size: size, color: color);

    if (lang == 'ar') {
      return Text(
        name,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: style,
      );
    }

    return Align(
      alignment: AlignmentDirectional.centerStart,
      child: FittedBox(
        fit: BoxFit.scaleDown,
        alignment: AlignmentDirectional.centerStart,
        child: Text(
          name,
          maxLines: 1,
          style: style,
        ),
      ),
    );
  }
}
