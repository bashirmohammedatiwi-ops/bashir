import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../cart/widgets/cart_theme.dart';

/// هوية صفحة العروض — بسيطة وأنيقة بألوان اللوغو.
abstract final class OffersTheme {
  static const brand = CartTheme.brand;
  static const brandDark = CartTheme.brandDark;
  static const brandSoft = CartTheme.brandSoft;
  static const brandWash = CartTheme.brandWash;

  static const sale = Color(0xFFE2557A);

  static const canvas = brandWash;
  static const surface = Colors.white;
  static const line = Color(0xFFE3EDEA);

  static const ink = CartTheme.charcoal;
  static const inkSoft = Color(0xFF6B7A76);
  static const inkMuted = Color(0xFF9AABA6);

  static const hPad = 20.0;
  static const cardRadius = 16.0;

  static TextStyle title({double size = 18, Color? color}) => GoogleFonts.cairo(
        fontSize: size,
        fontWeight: FontWeight.w800,
        height: 1.2,
        letterSpacing: -0.2,
        color: color ?? brand,
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
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: selected ? Colors.white : ink,
        height: 1.2,
      );

  static BoxDecoration canvasDecoration() => const BoxDecoration(color: canvas);

  static BoxDecoration surfaceCard() => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(cardRadius),
        border: Border.all(color: line),
      );

  static BoxDecoration chipDecoration({bool selected = false}) => BoxDecoration(
        color: selected ? brand : surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: selected ? brand : line),
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
      padding: const EdgeInsets.fromLTRB(OffersTheme.hPad, 22, OffersTheme.hPad, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: OffersTheme.title(size: 17, color: OffersTheme.ink)),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!, style: OffersTheme.body(size: 12)),
          ],
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
      child: Material(
        color: OffersTheme.brand,
        borderRadius: BorderRadius.circular(26),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(26),
          child: Center(
            child: Text(
              label,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
            ),
          ),
        ),
      ),
    );
  }
}
