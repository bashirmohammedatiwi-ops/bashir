import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// نظام تصميم الرئيسية — بسيط، أنيق، cream + sage.
abstract final class HomeTheme {
  static const paddingH = 16.0;
  static const sectionGap = 22.0;
  static const compactGap = 12.0;
  static const itemGap = 12.0;
  static const cardRadius = 18.0;
  static const tileRadius = 16.0;
  static const squircle = 18.0;
  static const pillRadius = 999.0;

  // Canvas & surfaces — palette مبسّطة
  static const canvas = Color(0xFFFAF8F5);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceMuted = Color(0xFFEEEBE4);

  static const sage = Color(0xFF5C6B52);
  static const sageLight = Color(0xFFE8EFE4);
  static const sageMid = Color(0xFFD4DFCF);
  static const roseWash = Color(0xFFF5E8EC);
  static const sand = Color(0xFFF0EBE2);
  static const lavender = Color(0xFFEDEAF2);

  static const ink = Color(0xFF2C2A28);
  static const inkSoft = Color(0xFF6B6660);
  static const inkMuted = Color(0xFF9A948C);

  static const categoryTileColors = [
    sageLight,
    roseWash,
    sand,
    lavender,
    Color(0xFFE8F0F2),
    Color(0xFFF2EBE6),
    Color(0xFFEBF2EC),
    Color(0xFFF5F0EA),
  ];

  static TextStyle displayTitle({double size = 26, Color? color}) =>
      GoogleFonts.cairo(
        fontSize: size,
        fontWeight: FontWeight.w800,
        height: 1.15,
        letterSpacing: -0.2,
        color: color ?? ink,
      );

  static TextStyle sectionTitle({double size = 18}) => GoogleFonts.cairo(
        fontSize: size,
        fontWeight: FontWeight.w700,
        height: 1.25,
        color: ink,
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
        letterSpacing: 0.3,
        color: sage,
        height: 1.2,
      );

  static TextStyle get viewAll => GoogleFonts.cairo(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: sage,
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
        letterSpacing: 0.4,
        color: inkMuted,
        height: 1.2,
      );

  static List<BoxShadow> get softShadow => [
        BoxShadow(
          color: ink.withValues(alpha: 0.04),
          blurRadius: 16,
          offset: const Offset(0, 4),
          spreadRadius: -2,
        ),
      ];

  static BoxDecoration sectionSurface({Color? tint}) => BoxDecoration(
        color: tint ?? surface,
        borderRadius: BorderRadius.circular(squircle),
        border: Border.all(color: surfaceMuted.withValues(alpha: 0.85)),
      );

  static BoxDecoration cardDecoration({Color? color}) => BoxDecoration(
        color: color ?? surface,
        borderRadius: BorderRadius.circular(cardRadius),
        boxShadow: softShadow,
      );

  static BoxDecoration pillSurface({Color? fill}) => BoxDecoration(
        color: fill ?? surface,
        borderRadius: BorderRadius.circular(pillRadius),
        border: Border.all(color: surfaceMuted.withValues(alpha: 0.9)),
      );

  // Legacy aliases — للملفات القديمة
  static const blush = canvas;
  static const petal = roseWash;
  static const mist = surfaceMuted;
  static const blushDeep = surfaceMuted;
  static const blushMid = surfaceMuted;
  static List<BoxShadow> get cardShadow => softShadow;
  static List<BoxShadow> get stageShadow => softShadow;
  static List<BoxShadow> get softLift => softShadow;
  static List<BoxShadow> get whisperLift => softShadow;
}

/// عنوان قسم — بسيط بدون زخرفة زائدة.
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
        compact ? 0 : 2,
        HomeTheme.paddingH,
        12,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (headerImageUrl != null && headerImageUrl!.isNotEmpty) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                headerImageUrl!,
                width: 36,
                height: 36,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (overline != null && overline!.isNotEmpty) ...[
                  Text(overline!, style: HomeTheme.overline),
                  const SizedBox(height: 2),
                ],
                Text(
                  title,
                  style: HomeTheme.sectionTitle(size: compact ? 16 : 18),
                ),
                if (subtitle != null && subtitle!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!, style: HomeTheme.body(size: 12)),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
          if (actionLabel != null && onAction != null)
            GestureDetector(
              onTap: onAction,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(actionLabel!, style: HomeTheme.viewAll),
                    const SizedBox(width: 2),
                    Icon(Icons.arrow_back_ios_new_rounded, size: 10, color: HomeTheme.sage),
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
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
            border: Border.all(
              color: selected ? HomeTheme.sage : HomeTheme.surfaceMuted,
            ),
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
          style: HomeTheme.body(size: 13, color: HomeTheme.ink, weight: FontWeight.w800),
        ),
      );

  Widget _box(String v) => Container(
        width: 30,
        padding: const EdgeInsets.symmetric(vertical: 6),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: HomeTheme.ink,
          borderRadius: BorderRadius.circular(7),
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
