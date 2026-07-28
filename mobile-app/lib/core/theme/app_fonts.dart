import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// تحميل الخطوط مسبقاً لتجنب وميض تغيّر الخط عند فتح التطبيق أو تبديل اللغة.
Future<void> preloadAppFonts() {
  return GoogleFonts.pendingFonts([
    GoogleFonts.cairo(),
    GoogleFonts.cairo(fontWeight: FontWeight.w700),
    GoogleFonts.cairo(fontWeight: FontWeight.w800),
    GoogleFonts.elMessiri(fontWeight: FontWeight.w700),
    GoogleFonts.cormorantGaramond(fontWeight: FontWeight.w600),
    GoogleFonts.cormorantGaramond(fontWeight: FontWeight.w700),
  ]);
}

/// خط العلامة التجارية — يُستخدم في الرئيسية والافتتاح فقط.
TextStyle brandTitleStyle({
  required String lang,
  double size = 22,
  Color? color,
}) {
  if (lang == 'ar') {
    return GoogleFonts.elMessiri(
      fontSize: size,
      fontWeight: FontWeight.w700,
      height: 1.12,
      letterSpacing: 0.8,
      color: color,
    );
  }
  return GoogleFonts.cormorantGaramond(
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
