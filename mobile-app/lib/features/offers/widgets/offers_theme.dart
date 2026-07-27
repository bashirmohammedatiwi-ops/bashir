import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';

/// هوية صفحة العروض — ألوان اللوغو (وردي + ذهبي).
abstract final class OffersTheme {
  static const brand = AppColors.primary;
  static const brandDark = AppColors.primaryDark;
  static const brandSoft = AppColors.primaryLight;
  static const brandWash = AppColors.blush;
  static const sale = AppColors.sale;
  static const accent = AppColors.accent;

  static const canvas = AppColors.scaffold;
  static const surface = Colors.white;
  static const line = AppColors.hairline;

  static const ink = AppColors.textPrimary;
  static const inkSoft = AppColors.textSecondary;
  static const inkMuted = AppColors.textMuted;

  static const hPad = 16.0;
  static const cardRadius = 18.0;

  static TextStyle title({double size = 18, Color? color}) => GoogleFonts.cairo(
        fontSize: size,
        fontWeight: FontWeight.w900,
        height: 1.2,
        letterSpacing: -0.3,
        color: color ?? ink,
      );

  static TextStyle body({
    double size = 13,
    Color? color,
    FontWeight weight = FontWeight.w500,
  }) =>
      GoogleFonts.cairo(
        fontSize: size,
        fontWeight: weight,
        height: 1.45,
        color: color ?? inkSoft,
      );

  static TextStyle chip({bool selected = false}) => GoogleFonts.cairo(
        fontSize: 12.5,
        fontWeight: FontWeight.w800,
        color: selected ? Colors.white : ink,
        height: 1.2,
      );

  static BoxDecoration canvasDecoration() => const BoxDecoration(color: canvas);

  static BoxDecoration heroDecoration() => BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [
            AppColors.primaryLight.withValues(alpha: 0.9),
            Colors.white,
            AppColors.accentSoft.withValues(alpha: 0.35),
          ],
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.primarySoft),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.08),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      );

  static BoxDecoration surfaceCard() => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(cardRadius),
        border: Border.all(color: line.withValues(alpha: 0.8)),
        boxShadow: AppColors.cardShadow,
      );

  static BoxDecoration chipDecoration({bool selected = false}) => BoxDecoration(
        gradient: selected ? AppColors.primaryGradient : null,
        color: selected ? null : surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: selected ? Colors.transparent : line),
        boxShadow: selected
            ? [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.22),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ]
            : null,
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

class OffersSectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;

  const OffersSectionHeader({
    super.key,
    required this.title,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(OffersTheme.hPad, 20, OffersTheme.hPad, 8),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 18,
            decoration: BoxDecoration(
              color: OffersTheme.brand,
              borderRadius: BorderRadius.circular(99),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: OffersTheme.title(size: 16)),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!, style: OffersTheme.body(size: 12)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class OffersPrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;

  const OffersPrimaryButton({super.key, required this.label, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: AppColors.primaryGradient,
          borderRadius: BorderRadius.circular(26),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.25),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onPressed,
            borderRadius: BorderRadius.circular(26),
            child: Center(
              child: Text(
                label,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
