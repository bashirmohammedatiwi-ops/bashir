import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';

/// هوية صفحة العروض — نظيفة، واضحة، بدون تعقيد.
abstract final class OffersTheme {
  static const canvas = Color(0xFFFBF7F5);
  static const canvasTop = Color(0xFFFFF0F4);
  static const surface = Color(0xFFFFFFFF);
  static const line = Color(0xFFF0E6EA);

  static const accent = Color(0xFFD4145A);
  static const accentDark = Color(0xFF9E0F42);
  static const accentSoft = Color(0xFFFFE8F0);
  static const accentMid = Color(0xFFFFC2D6);

  static const ink = Color(0xFF22181D);
  static const inkSoft = Color(0xFF6F5A63);
  static const inkMuted = Color(0xFF9E8A93);

  static const headerRadius = 24.0;
  static const cardRadius = 16.0;

  static TextStyle display({double size = 28, Color? color}) => GoogleFonts.cairo(
        fontSize: size,
        fontWeight: FontWeight.w900,
        height: 1.1,
        letterSpacing: -0.5,
        color: color ?? ink,
      );

  static TextStyle title({double size = 17, Color? color}) => GoogleFonts.cairo(
        fontSize: size,
        fontWeight: FontWeight.w800,
        height: 1.25,
        color: color ?? ink,
      );

  static TextStyle body({
    double size = 13,
    Color? color,
    FontWeight weight = FontWeight.w600,
  }) =>
      GoogleFonts.cairo(
        fontSize: size,
        fontWeight: weight,
        height: 1.4,
        color: color ?? inkSoft,
      );

  static TextStyle chip({bool selected = false}) => GoogleFonts.cairo(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: selected ? Colors.white : ink,
        height: 1.2,
      );

  static TextStyle overline({Color? color}) => GoogleFonts.cairo(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.1,
        color: color ?? accent,
        height: 1.2,
      );

  static BoxDecoration canvasDecoration() => const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [canvasTop, canvas, canvas],
          stops: [0, 0.22, 1],
        ),
      );

  static BoxDecoration headerDecoration() => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(headerRadius),
        border: Border.all(color: line),
        boxShadow: [
          BoxShadow(
            color: accent.withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, 10),
            spreadRadius: -8,
          ),
        ],
      );

  static BoxDecoration accentBarDecoration() => BoxDecoration(
        gradient: const LinearGradient(
          colors: [accent, accentDark],
        ),
        borderRadius: BorderRadius.circular(999),
      );

  static BoxDecoration sectionDecoration() => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(cardRadius),
        border: Border.all(color: AppColors.hairline.withValues(alpha: 0.75)),
      );

  static BoxDecoration flashDecoration() => BoxDecoration(
        color: accentSoft,
        borderRadius: BorderRadius.circular(cardRadius),
        border: Border.all(color: accentMid.withValues(alpha: 0.55)),
      );

  static BoxDecoration chipDecoration({bool selected = false}) => BoxDecoration(
        color: selected ? accent : surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: selected ? accent : line),
      );
}

class OffersCanvas extends StatelessWidget {
  final Widget child;

  const OffersCanvas({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: OffersTheme.canvasDecoration(),
      child: child,
    );
  }
}
