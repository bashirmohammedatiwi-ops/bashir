import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';

/// نظام تصميم الرئيسية — خلفية بيضاء، نظيفة، عصرية.
abstract final class HomeTheme {
  static const paddingH = 16.0;
  static const sectionGap = 20.0;
  static const compactGap = 10.0;
  static const itemGap = 10.0;
  static const cardRadius = 14.0;
  static const tileRadius = 12.0;
  static const squircle = 14.0;
  static const pillRadius = 999.0;

  static const productCardWidth = 158.0;
  static const productCardHeight = 268.0;
  static const productImageSize = 158.0;
  static const productRowHeight = 272.0;
  static const bannerAspect = 1.92;
  static const bannerInset = 16.0;
  static const bannerRadius = 16.0;

  // خلفية بيضاء بالكامل
  static const canvas = Color(0xFFFFFFFF);
  static const canvasWarm = Color(0xFFFFFFFF);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceMuted = Color(0xFFF3F4F6);
  static const pearl = Color(0xFFFAFAFA);
  static const champagne = Color(0xFFF5F5F5);

  static const accent = AppColors.primary;
  static const accentDark = AppColors.primaryDark;
  static const accentLight = AppColors.primaryLight;
  static const accentMid = Color(0xFFFCE4EC);

  static const sage = Color(0xFF627058);
  static const sageDark = Color(0xFF4E5A47);
  static const sageLight = Color(0xFFF5F7F4);
  static const sageMid = Color(0xFFE8EDE5);

  static const roseWash = Color(0xFFFFF5F8);
  static const sand = Color(0xFFFAFAFA);
  static const lavender = Color(0xFFF8F7FC);
  static const blush = Color(0xFFFFF8FA);

  static const ink = Color(0xFF1A1A1A);
  static const inkSoft = Color(0xFF6B7280);
  static const inkMuted = Color(0xFF9CA3AF);
  static const divider = Color(0xFFF0F0F0);

  static const categoryTileColors = [
    roseWash,
    sageLight,
    sand,
    lavender,
    accentLight,
    blush,
    Color(0xFFF0F4F1),
    Color(0xFFFAF8F6),
  ];

  static TextStyle brandTitle({double size = 22, required String lang, Color? color}) =>
      brandTitleStyle(size: size, lang: lang, color: color ?? ink);

  static TextStyle displayTitle({double size = 22, Color? color}) =>
      GoogleFonts.cairo(
        fontSize: size,
        fontWeight: FontWeight.w800,
        height: 1.2,
        letterSpacing: -0.3,
        color: color ?? ink,
      );

  static TextStyle sectionTitle({double size = 17, Color? color}) => GoogleFonts.cairo(
        fontSize: size,
        fontWeight: FontWeight.w800,
        height: 1.25,
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
        height: 1.4,
        color: color ?? inkSoft,
      );

  static TextStyle get overline => GoogleFonts.cairo(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.5,
        color: accent,
        height: 1.2,
      );

  static TextStyle get viewAll => GoogleFonts.cairo(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: accent,
        height: 1.2,
      );

  static BoxDecoration sectionSurface({Color? tint}) => BoxDecoration(
        color: tint ?? surface,
        borderRadius: BorderRadius.circular(cardRadius),
        border: Border.all(color: divider),
      );

  static TextStyle get chipLabel => GoogleFonts.cairo(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: ink,
        height: 1.2,
      );

  static TextStyle get circleLabel => GoogleFonts.cairo(
        fontSize: 11,
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
        fontSize: 10,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.3,
        color: inkMuted,
        height: 1.2,
      );

  static List<BoxShadow> get whisperLift => [
        BoxShadow(
          color: ink.withValues(alpha: 0.03),
          blurRadius: 8,
          offset: const Offset(0, 2),
          spreadRadius: -1,
        ),
      ];

  static List<BoxShadow> get softShadow => [
        BoxShadow(
          color: ink.withValues(alpha: 0.05),
          blurRadius: 16,
          offset: const Offset(0, 4),
          spreadRadius: -4,
        ),
      ];

  static List<BoxShadow> get softLift => softShadow;
  static List<BoxShadow> get cardShadow => whisperLift;
  static List<BoxShadow> get stageShadow => softShadow;

  static BoxDecoration canvasDecoration() => const BoxDecoration(color: canvas);

  static BoxDecoration heroHeaderDecoration() => const BoxDecoration(color: canvas);

  static BoxDecoration heroActionClusterDecoration() => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(pillRadius),
        border: Border.all(color: divider),
      );

  static BoxDecoration heroSearchDecoration() => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: divider),
      );

  static BoxDecoration heroDateChipDecoration() => BoxDecoration(
        color: pearl,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: divider),
      );

  static BoxDecoration heroTrustPillDecoration() => BoxDecoration(
        color: pearl,
        borderRadius: BorderRadius.circular(pillRadius),
        border: Border.all(color: divider),
      );

  static BoxDecoration cardDecoration({Color? color}) => BoxDecoration(
        color: color ?? surface,
        borderRadius: BorderRadius.circular(cardRadius),
        border: Border.all(color: divider),
      );

  static BoxDecoration pillSurface({Color? fill}) => BoxDecoration(
        color: fill ?? surface,
        borderRadius: BorderRadius.circular(pillRadius),
        border: Border.all(color: divider),
      );

  static BoxDecoration searchDecoration() => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: divider),
      );

  static BoxDecoration dockDecoration() => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(cardRadius),
        border: Border.all(color: divider),
      );

  // Legacy aliases
  static const petal = roseWash;
  static const mist = surfaceMuted;
  static const blushDeep = divider;
  static const blushMid = divider;
}

class HomeCanvasBackground extends StatelessWidget {
  final Widget child;

  const HomeCanvasBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(color: HomeTheme.canvas, child: child);
  }
}

class HomeSectionDivider extends StatelessWidget {
  const HomeSectionDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: HomeTheme.paddingH, vertical: 4),
      child: Divider(height: 1, thickness: 1, color: HomeTheme.divider),
    );
  }
}

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
        12,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (headerImageUrl != null && headerImageUrl!.isNotEmpty) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: AppNetworkImage(
                url: headerImageUrl!,
                width: 32,
                height: 32,
                fit: BoxFit.cover,
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
                  style: HomeTheme.sectionTitle(size: compact ? 16 : 17),
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
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(actionLabel!, style: HomeTheme.viewAll),
                    const SizedBox(width: 2),
                    Icon(Icons.chevron_left_rounded, size: 16, color: HomeTheme.accent),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

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
      color: selected ? HomeTheme.accent : HomeTheme.surface,
      borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
            border: Border.all(color: selected ? HomeTheme.accent : HomeTheme.divider),
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
        width: 28,
        padding: const EdgeInsets.symmetric(vertical: 5),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: HomeTheme.ink,
          borderRadius: BorderRadius.circular(6),
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
