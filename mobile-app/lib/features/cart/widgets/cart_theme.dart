import 'package:flutter/material.dart';

import '../../../core/utils/responsive.dart';
import '../../home/widgets/home_theme.dart';

/// ثيم السلة — ألوان اللوغو (تركواز + فحم) بأشكال ناعمة.
abstract final class CartTheme {
  // ألوان اللوغو
  static const brand = Color(0xFF3A9E8F);
  static const brandDark = Color(0xFF2F7F73);
  static const brandSoft = Color(0xFFE8F5F3);
  static const brandWash = Color(0xFFF4FAF9);
  static const charcoal = Color(0xFF2D2D2D);

  static const bg = Color(0xFFFAFCFB);
  static const card = Colors.white;
  static const radiusXl = 26.0;
  static const radiusLg = 20.0;
  static const radiusMd = 16.0;
  static const radiusSm = 12.0;
  static const hPad = 16.0;
  static const itemGap = 10.0;
  static const imageSize = 88.0;

  static const brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brand, brandDark],
  );

  static double shellNavReserve(BuildContext context) {
    return Responsive.shellBottomReserve(context);
  }

  static List<BoxShadow> get softShadow => [
        BoxShadow(
          color: brand.withValues(alpha: 0.07),
          blurRadius: 18,
          offset: const Offset(0, 6),
          spreadRadius: -4,
        ),
        BoxShadow(
          color: charcoal.withValues(alpha: 0.04),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get dockShadow => [
        BoxShadow(
          color: brand.withValues(alpha: 0.1),
          blurRadius: 22,
          offset: const Offset(0, -6),
          spreadRadius: -4,
        ),
      ];

  static BoxDecoration cardDecoration({Color? color}) => BoxDecoration(
        color: color ?? card,
        borderRadius: BorderRadius.circular(radiusLg),
        border: Border.all(color: brandSoft),
        boxShadow: softShadow,
      );

  static BoxDecoration pillDecoration({Color? fill}) => BoxDecoration(
        color: fill ?? brandWash,
        borderRadius: BorderRadius.circular(999),
      );

  static BoxDecoration headerDecoration() => BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [
            brandSoft,
            bg,
            Colors.white,
          ],
        ),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(radiusXl)),
      );
}

class CartSectionLabel extends StatelessWidget {
  final String title;

  const CartSectionLabel({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 18, CartTheme.hPad, 10),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              gradient: CartTheme.brandGradient,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 17),
          ),
          const SizedBox(width: 10),
          Text(title, style: HomeTheme.sectionTitle(size: 16, color: CartTheme.charcoal)),
        ],
      ),
    );
  }
}
