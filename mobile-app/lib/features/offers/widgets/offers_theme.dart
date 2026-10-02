import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_fonts.dart';
import '../../worlds/world_theme.dart';

/// هوية صفحة العروض — تتبع العالم النشط مع ألوان العروض الثابتة (sale/accent).
abstract final class OffersTheme {
  static const sale = AppColors.sale;
  static const accent = AppColors.accent;

  static const hPad = 16.0;
  static const cardRadius = 18.0;

  static Color brand(BuildContext context) => context.worldTheme.accent;

  static Color brandDark(BuildContext context) => context.worldTheme.accentDark;

  static Color brandSoft(BuildContext context) => context.worldTheme.accentLight;

  static Color brandWash(BuildContext context) => context.worldTheme.blush;

  static Color canvas(BuildContext context) => context.worldTheme.canvas;

  static Color surface(BuildContext context) => context.worldTheme.surface;

  static Color line(BuildContext context) => context.worldTheme.hairline;

  static Color ink(BuildContext context) => context.worldTheme.ink;

  static Color inkSoft(BuildContext context) => context.worldTheme.inkSoft;

  static Color inkMuted(BuildContext context) => context.worldTheme.inkMuted;

  static TextStyle title(BuildContext context, {double size = 18, Color? color}) => appFont(
        fontSize: size,
        fontWeight: FontWeight.w900,
        height: 1.2,
        letterSpacing: -0.3,
        color: color ?? ink(context),
      );

  static TextStyle body(
    BuildContext context, {
    double size = 13,
    Color? color,
    FontWeight weight = FontWeight.w500,
  }) =>
      appFont(
        fontSize: size,
        fontWeight: weight,
        height: 1.45,
        color: color ?? inkSoft(context),
      );

  static TextStyle chip(BuildContext context, {bool selected = false}) => appFont(
        fontSize: 12.5,
        fontWeight: FontWeight.w800,
        color: selected ? Colors.white : ink(context),
        height: 1.2,
      );

  static BoxDecoration canvasDecoration(BuildContext context) =>
      BoxDecoration(color: canvas(context));

  static BoxDecoration heroDecoration(BuildContext context) {
    final t = context.worldTheme;
    return BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
        colors: [
          t.accentLight.withValues(alpha: 0.95),
          t.surface,
          t.accentSoft.withValues(alpha: 0.45),
        ],
      ),
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: t.accentSoft),
      boxShadow: [
        BoxShadow(
          color: t.accent.withValues(alpha: 0.08),
          blurRadius: 18,
          offset: const Offset(0, 6),
        ),
      ],
    );
  }

  static BoxDecoration surfaceCard(BuildContext context) {
    final t = context.worldTheme;
    return BoxDecoration(
      color: t.surface,
      borderRadius: BorderRadius.circular(cardRadius),
      border: Border.all(color: t.hairline.withValues(alpha: 0.8)),
      boxShadow: t.cardShadow,
    );
  }

  static BoxDecoration chipDecoration(BuildContext context, {bool selected = false}) {
    final t = context.worldTheme;
    return BoxDecoration(
      gradient: selected ? t.signatureGradient : null,
      color: selected ? null : t.surface,
      borderRadius: BorderRadius.circular(999),
      border: Border.all(color: selected ? Colors.transparent : t.hairline),
      boxShadow: selected
          ? [
              BoxShadow(
                color: t.accent.withValues(alpha: 0.22),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ]
          : null,
    );
  }
}

class OffersCanvas extends ConsumerWidget {
  final Widget child;

  const OffersCanvas({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DecoratedBox(
      decoration: OffersTheme.canvasDecoration(context),
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
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(OffersTheme.hPad, 20, OffersTheme.hPad, 8),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 18,
            decoration: BoxDecoration(
              gradient: t.signatureGradient,
              borderRadius: BorderRadius.circular(99),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: OffersTheme.title(context, size: 16)),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!, style: OffersTheme.body(context, size: 12)),
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
    final t = context.worldTheme;
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: t.signatureGradient,
          borderRadius: BorderRadius.circular(26),
          boxShadow: [
            BoxShadow(
              color: t.accent.withValues(alpha: 0.25),
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
