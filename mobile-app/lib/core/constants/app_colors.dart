import 'package:flutter/material.dart';

/// نظام ألوان فاخر "Boutique Plum + Champagne Gold + Rose Petal"
/// مستوحى من ماركات الجمال العالمية (Chanel, Hermès, Aesop, Charlotte Tilbury).
abstract final class AppColors {
  // ── PRIMARY: Royal Plum ────────────────────────────────────────
  static const Color primary = Color(0xFF4A2466);
  static const Color primaryLight = Color(0xFF8B6BA8);
  static const Color primaryDark = Color(0xFF2A1338);
  static const Color primarySoft = Color(0xFFEDE5F3);
  static const Color primaryMist = Color(0xFFF8F4FB);

  // ── ACCENT: Champagne Gold ─────────────────────────────────────
  static const Color gold = Color(0xFFC9A961);
  static const Color goldLight = Color(0xFFE8DDB8);
  static const Color goldDeep = Color(0xFFB8975A);
  static const Color goldSoft = Color(0xFFF7F1E1);

  // ── ROSE: Dusty Rose & Petal ──────────────────────────────────
  static const Color rose = Color(0xFFC97B8E);
  static const Color rosePetal = Color(0xFFE8B4BC);
  static const Color roseSoft = Color(0xFFF5E4E8);
  static const Color roseMist = Color(0xFFFDF5F7);

  // ── BACKGROUNDS: Warm Ivory ───────────────────────────────────
  static const Color surface = Color(0xFFFFFFFF);
  static const Color background = Color(0xFFFAF7F2);
  static const Color canvas = Color(0xFFF4EFE7);
  static const Color canvasDeep = Color(0xFFEDE6D8);

  // ── TEXT: Onyx + Warm Grays ───────────────────────────────────
  static const Color textPrimary = Color(0xFF1C1C24);
  static const Color textSecondary = Color(0xFF6E6A75);
  static const Color textMuted = Color(0xFFA8A2AE);
  static const Color textOnDark = Color(0xFFF8F5EF);

  // ── SEMANTIC ──────────────────────────────────────────────────
  static const Color error = Color(0xFFB54848);
  static const Color success = Color(0xFF4A7C59);
  static const Color warning = Color(0xFFD08C5C);
  static const Color info = Color(0xFF5A7BA3);
  static const Color badgeRed = Color(0xFFB54848);

  // ── DIVIDERS & BORDERS ────────────────────────────────────────
  static const Color divider = Color(0xFFEDE8E0);
  static const Color dividerLight = Color(0xFFF5F1EB);
  static const Color border = Color(0xFFE0D9CD);
  static const Color inputBorder = Color(0xFFE0D9CD);
  static const Color overlay = Color(0x661C1C24);

  // ── NAV / UI ──────────────────────────────────────────────────
  static const Color navInactive = Color(0xFFA8A2AE);
  static const Color accent = Color(0xFFF7F1E1);

  // ── EXTERNAL BRAND ────────────────────────────────────────────
  static const Color whatsapp = Color(0xFF25D366);
  static const Color chatOnline = Color(0xFF4A7C59);

  // ── GRADIENTS: Boutique signature ─────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryDark],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  static const LinearGradient logoGradient = LinearGradient(
    colors: [gold, primary],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  static const LinearGradient champagneGradient = LinearGradient(
    colors: [gold, goldDeep],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  static const LinearGradient roseGradient = LinearGradient(
    colors: [rose, rosePetal],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  static const LinearGradient nightGradient = LinearGradient(
    colors: [Color(0xFF1A0F26), primaryDark, primary],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    stops: [0.0, 0.55, 1.0],
  );

  static const LinearGradient ivoryGradient = LinearGradient(
    colors: [Color(0xFFFEFCF8), background, canvas],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient heroShimmer = LinearGradient(
    colors: [Color(0xFFEFE3F0), Color(0xFFF8E9D9), Color(0xFFF0E0DC)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ── SHADOWS: Neutral, Soft ────────────────────────────────────
  static const BoxShadow cardShadow = BoxShadow(
    color: Color(0x0F000000),
    blurRadius: 24,
    offset: Offset(0, 4),
  );

  static const BoxShadow softShadow = BoxShadow(
    color: Color(0x0A000000),
    blurRadius: 14,
    offset: Offset(0, 4),
  );

  static const BoxShadow elevatedShadow = BoxShadow(
    color: Color(0x14000000),
    blurRadius: 32,
    offset: Offset(0, 8),
  );

  static const BoxShadow plumShadow = BoxShadow(
    color: Color(0x1A4A2466),
    blurRadius: 20,
    offset: Offset(0, 8),
  );

  static const BoxShadow navShadow = BoxShadow(
    color: Color(0x12000000),
    blurRadius: 24,
    offset: Offset(0, -2),
  );

  // ── PRODUCT TINTS: للبطاقات ───────────────────────────────────
  static const List<Color> productTints = [
    Color(0xFFF5E4E8), // rose soft
    Color(0xFFEDE5F3), // primary soft
    Color(0xFFF7F1E1), // gold soft
    Color(0xFFE8DDD0), // beige
    Color(0xFFF0E4ED), // mauve
    Color(0xFFF8E9D9), // peach
  ];
}
