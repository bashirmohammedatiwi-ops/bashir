import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// نظام تصميم الرئيسية — editorial beauty، بسيط وأنيق.
abstract final class HomeTheme {
  static const paddingH = 18.0;
  static const sectionGap = 26.0;
  static const compactGap = 14.0;
  static const itemGap = 10.0;
  static const cardRadius = 20.0;
  static const tileRadius = 18.0;
  static const squircle = 20.0;
  static const pillRadius = 999.0;

  // Canvas & surfaces — ألوان دافئة وهادئة
  static const canvas = Color(0xFFFBF9F6);
  static const canvasWarm = Color(0xFFF5F1EA);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceMuted = Color(0xFFEDE9E2);
  static const pearl = Color(0xFFF7F4EF);
  static const champagne = Color(0xFFF0E8DC);

  static const sage = Color(0xFF627058);
  static const sageDark = Color(0xFF4E5A47);
  static const sageLight = Color(0xFFEEF2EB);
  static const sageMid = Color(0xFFD8E0D3);
  static const roseWash = Color(0xFFF8EDF0);
  static const sand = Color(0xFFF3EEE6);
  static const lavender = Color(0xFFF0EEF5);
  static const blush = Color(0xFFF5ECE8);

  static const ink = Color(0xFF2A2826);
  static const inkSoft = Color(0xFF6E6860);
  static const inkMuted = Color(0xFFA49D94);

  static const categoryTileColors = [
    sageLight,
    roseWash,
    sand,
    lavender,
    blush,
    Color(0xFFE8F0F2),
    Color(0xFFEBF2EC),
    Color(0xFFF5F0EA),
  ];

  static TextStyle displayTitle({double size = 26, Color? color}) =>
      GoogleFonts.cairo(
        fontSize: size,
        fontWeight: FontWeight.w800,
        height: 1.12,
        letterSpacing: -0.3,
        color: color ?? ink,
      );

  static TextStyle sectionTitle({double size = 18, Color? color}) => GoogleFonts.cairo(
        fontSize: size,
        fontWeight: FontWeight.w700,
        height: 1.22,
        letterSpacing: -0.15,
        color: color ?? ink,
      );

  static TextStyle body({
    double size = 14,
    Color? color,
    FontWeight weight = FontWeight.w500,
  }) =>
      GoogleFonts.cairo(
        fontSize: size,
        fontWeight: weight,
        height: 1.45,
        color: color ?? inkSoft,
      );

  static TextStyle get overline => GoogleFonts.cairo(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.8,
        color: sage,
        height: 1.2,
      );

  static TextStyle get viewAll => GoogleFonts.cairo(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: sageDark,
        height: 1.2,
      );

  static TextStyle get chipLabel => GoogleFonts.cairo(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: ink,
        height: 1.2,
      );

  static TextStyle get circleLabel => GoogleFonts.cairo(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        color: inkSoft,
        height: 1.15,
      );

  static TextStyle get price => GoogleFonts.cairo(
        fontSize: 14,
        fontWeight: FontWeight.w800,
        color: ink,
        height: 1.2,
      );

  static TextStyle get brandLabel => GoogleFonts.cairo(
        fontSize: 9,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5,
        color: inkMuted,
        height: 1.2,
      );

  static List<BoxShadow> get whisperLift => [
        BoxShadow(
          color: ink.withValues(alpha: 0.03),
          blurRadius: 10,
          offset: const Offset(0, 2),
          spreadRadius: -1,
        ),
      ];

  static List<BoxShadow> get softShadow => [
        BoxShadow(
          color: ink.withValues(alpha: 0.05),
          blurRadius: 20,
          offset: const Offset(0, 6),
          spreadRadius: -4,
        ),
      ];

  static List<BoxShadow> get softLift => softShadow;

  static List<BoxShadow> get cardShadow => whisperLift;

  static List<BoxShadow> get stageShadow => softShadow;

  /// خلفية الصفحة — تدرج خفيف من الأعلى.
  static BoxDecoration canvasDecoration() => const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [canvasWarm, canvas, canvas],
          stops: [0, 0.22, 1],
        ),
      );

  /// رأس الهيرو — غسيل sage ناعم.
  static BoxDecoration heroHeaderDecoration() => BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            sageLight.withValues(alpha: 0.55),
            canvas.withValues(alpha: 0),
          ],
          stops: const [0, 1],
        ),
      );

  static BoxDecoration sectionSurface({Color? tint}) => BoxDecoration(
        color: tint ?? surface,
        borderRadius: BorderRadius.circular(squircle),
        border: Border.all(color: surfaceMuted.withValues(alpha: 0.75)),
        boxShadow: whisperLift,
      );

  static BoxDecoration cardDecoration({Color? color}) => BoxDecoration(
        color: color ?? surface,
        borderRadius: BorderRadius.circular(cardRadius),
        border: Border.all(color: surfaceMuted.withValues(alpha: 0.65)),
        boxShadow: whisperLift,
      );

  static BoxDecoration pillSurface({Color? fill}) => BoxDecoration(
        color: fill ?? surface,
        borderRadius: BorderRadius.circular(pillRadius),
        border: Border.all(color: surfaceMuted.withValues(alpha: 0.8)),
        boxShadow: whisperLift,
      );

  static BoxDecoration viewAllChipDecoration() => BoxDecoration(
        color: sageLight,
        borderRadius: BorderRadius.circular(pillRadius),
        border: Border.all(color: sageMid.withValues(alpha: 0.7)),
      );

  // Legacy aliases
  static const petal = roseWash;
  static const mist = surfaceMuted;
  static const blushDeep = surfaceMuted;
  static const blushMid = surfaceMuted;
}

/// خلفية موحّدة للصفحة الرئيسية.
class HomeCanvasBackground extends StatelessWidget {
  final Widget child;

  const HomeCanvasBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: HomeTheme.canvasDecoration(),
      child: child,
    );
  }
}

/// عنوان قسم — خط accent رفيع + زر عرض الكل.
class HomeEditorialHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? headerImageUrl;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Widget? trailing;
  final bool compact;
  final String? overline;

  const HomeEditorialHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.headerImageUrl,
    this.actionLabel,
    this.onAction,
    this.trailing,
    this.compact = false,
    this.overline,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        HomeTheme.paddingH,
        compact ? 0 : 4,
        HomeTheme.paddingH,
        14,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (headerImageUrl != null && headerImageUrl!.isNotEmpty) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                headerImageUrl!,
                width: 38,
                height: 38,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (overline != null && overline!.isNotEmpty) ...[
                  Text(overline!, style: HomeTheme.overline),
                  const SizedBox(height: 4),
                ],
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 3,
                      height: compact ? 16 : 20,
                      margin: const EdgeInsets.only(left: 2),
                      decoration: BoxDecoration(
                        color: HomeTheme.sage,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        title,
                        style: HomeTheme.sectionTitle(size: compact ? 16 : 18),
                      ),
                    ),
                  ],
                ),
                if (subtitle != null && subtitle!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Padding(
                    padding: const EdgeInsets.only(right: 15),
                    child: Text(subtitle!, style: HomeTheme.body(size: 12)),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
          if (actionLabel != null && onAction != null)
            GestureDetector(
              onTap: onAction,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
                decoration: HomeTheme.viewAllChipDecoration(),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(actionLabel!, style: HomeTheme.viewAll),
                    const SizedBox(width: 3),
                    Icon(Icons.arrow_back_ios_new_rounded, size: 9, color: HomeTheme.sageDark),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// حبة أفقية للفلاتر.
class HomeFilterPill extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final String? icon;

  const HomeFilterPill({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? HomeTheme.sage : HomeTheme.surface,
      borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
      elevation: selected ? 0 : 0,
      shadowColor: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 9),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
            border: Border.all(
              color: selected ? HomeTheme.sage : HomeTheme.surfaceMuted,
            ),
            boxShadow: selected ? null : HomeTheme.whisperLift,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null && icon!.isNotEmpty) ...[
                Text(icon!, style: const TextStyle(fontSize: 13)),
                const SizedBox(width: 5),
              ],
              Text(
                label,
                style: HomeTheme.chipLabel.copyWith(
                  color: selected ? Colors.white : HomeTheme.ink,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class HomeCountdownBoxes extends StatelessWidget {
  final String hours;
  final String minutes;
  final String seconds;

  const HomeCountdownBoxes({
    super.key,
    required this.hours,
    required this.minutes,
    required this.seconds,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _box(hours),
        _sep(),
        _box(minutes),
        _sep(),
        _box(seconds),
      ],
    );
  }

  Widget _sep() => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 3),
        child: Text(
          ':',
          style: HomeTheme.body(size: 12, color: HomeTheme.sageDark, weight: FontWeight.w800),
        ),
      );

  Widget _box(String v) => Container(
        width: 30,
        padding: const EdgeInsets.symmetric(vertical: 6),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: HomeTheme.sageDark,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          v,
          style: GoogleFonts.cairo(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: Colors.white,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      );
}
