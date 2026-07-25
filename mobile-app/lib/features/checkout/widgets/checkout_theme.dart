import 'package:flutter/material.dart';

import '../../home/widgets/home_theme.dart';
import '../../cart/widgets/cart_theme.dart';

/// ثيم إتمام الطلب — نفس ألوان اللوغو المستخدمة في السلة.
abstract final class CheckoutTheme {
  static const brand = CartTheme.brand;
  static const brandDark = CartTheme.brandDark;
  static const brandSoft = CartTheme.brandSoft;
  static const brandWash = CartTheme.brandWash;
  static const charcoal = CartTheme.charcoal;
  static const bg = CartTheme.bg;
  static const card = CartTheme.card;

  static const brandGradient = CartTheme.brandGradient;

  static List<BoxShadow> get softShadow => CartTheme.softShadow;
  static List<BoxShadow> get dockShadow => CartTheme.dockShadow;

  static double shellNavReserve(BuildContext context) => CartTheme.shellNavReserve(context);

  static BoxDecoration cardDecoration({Color? color, bool selected = false}) => BoxDecoration(
        color: color ?? card,
        borderRadius: BorderRadius.circular(CartTheme.radiusLg),
        border: Border.all(
          color: selected ? brand : brandSoft,
          width: selected ? 1.5 : 1,
        ),
        boxShadow: softShadow,
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
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(CartTheme.radiusXl)),
      );

  static InputDecoration fieldDecoration({
    required String label,
    String? hint,
    IconData? icon,
  }) =>
      InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: icon != null ? Icon(icon, color: brand, size: 20) : null,
        filled: true,
        fillColor: brandWash,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CartTheme.radiusMd),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CartTheme.radiusMd),
          borderSide: BorderSide(color: brandSoft),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CartTheme.radiusMd),
          borderSide: const BorderSide(color: brand, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      );
}

class CheckoutSectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;

  const CheckoutSectionHeader({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              gradient: CheckoutTheme.brandGradient,
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: HomeTheme.sectionTitle(size: 15, color: CheckoutTheme.charcoal)),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: TextStyle(
                      fontSize: 11.5,
                      color: CheckoutTheme.charcoal.withValues(alpha: 0.55),
                      height: 1.3,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}
