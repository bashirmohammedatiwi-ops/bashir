import 'package:flutter/material.dart';

import '../../cart/widgets/cart_theme.dart';

/// ثيم صفحة حسابي — ألوان واضحة ومتناسقة مع هوية اللوغو.
abstract final class AccountTheme {
  static const pageBg = Color(0xFFF6FAF9);
  static const sectionGap = 18.0;
  static const hPad = 16.0;

  static const orders = Color(0xFF2F9E8F);
  static const wishlist = Color(0xFFE2557A);
  static const loyalty = Color(0xFFC99212);
  static const addresses = Color(0xFF4B7FD6);
  static const brands = Color(0xFF7B5FD4);
  static const notifications = Color(0xFF3A9E8F);
  static const settings = Color(0xFF5C6B7A);
  static const danger = Color(0xFFD64545);
  static const dangerSoft = Color(0xFFFFF0F0);

  static BoxDecoration pageCard({Color? color}) => BoxDecoration(
        color: color ?? CartTheme.card,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: CartTheme.brandSoft),
        boxShadow: CartTheme.softShadow,
      );

  static BoxDecoration heroDecoration() => BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color(0xFF45B0A1), Color(0xFF2A7A6F), Color(0xFF245F57)],
        ),
        borderRadius: BorderRadius.circular(26),
        boxShadow: [
          BoxShadow(
            color: CartTheme.brand.withValues(alpha: 0.28),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      );

  static Widget sectionTitle(String title, {IconData? icon}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 2, 4, 10),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 17, color: CartTheme.brandDark),
            const SizedBox(width: 8),
          ],
          Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w900,
              color: CartTheme.charcoal,
              letterSpacing: -0.2,
            ),
          ),
        ],
      ),
    );
  }
}
