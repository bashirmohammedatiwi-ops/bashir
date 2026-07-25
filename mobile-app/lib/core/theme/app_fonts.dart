import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// تحميل الخطوط مسبقاً لتجنب وميض تغيّر الخط عند فتح التطبيق أو تبديل اللغة.
Future<void> preloadAppFonts() {
  return GoogleFonts.pendingFonts([
    GoogleFonts.cairo(),
    GoogleFonts.cairo(fontWeight: FontWeight.w700),
    GoogleFonts.cairo(fontWeight: FontWeight.w800),
    GoogleFonts.elMessiri(fontWeight: FontWeight.w700),
    GoogleFonts.playfairDisplay(fontWeight: FontWeight.w500),
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
  return GoogleFonts.playfairDisplay(
    fontSize: size,
    fontWeight: FontWeight.w500,
    height: 1.05,
    letterSpacing: 1.8,
    color: color,
  );
}
