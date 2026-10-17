import 'package:flutter/material.dart';

/// هوية ديما الحياة: بنفسجي عميق + وردي، بخط Cairo.
class AppColors {
  static const primary = Color(0xFF6E45B0);
  static const primaryDeep = Color(0xFF4A2C86);
  static const primarySoft = Color(0xFFEFE6FC);
  static const primaryLight = Color(0xFFF6F0FE);
  static const rose = Color(0xFFC0679A);
  static const roseSoft = Color(0xFFFDEAF2);
  static const ink = Color(0xFF1A1426);
  static const muted = Color(0xFF7A7287);
  static const line = Color(0xFFEAE4F2);
  static const scaffold = Color(0xFFF7F5FA);
  static const surface = Colors.white;

  static const success = Color(0xFF1F9D63);
  static const successSoft = Color(0xFFE3F6EC);
  static const danger = Color(0xFFD64545);
  static const dangerSoft = Color(0xFFFCE8E8);
  static const warning = Color(0xFFDB8B12);
  static const warningSoft = Color(0xFFFFF3DC);
  static const info = Color(0xFF2F6FDE);
  static const infoSoft = Color(0xFFE6EEFD);

  /// ألوان مجموعات الباركودات (نفس مفاتيح السيرفر).
  static const groupColors = <String, Color>{
    'violet': Color(0xFF7B52C4),
    'rose': Color(0xFFD0588F),
    'gold': Color(0xFFC9931A),
    'mint': Color(0xFF16A085),
    'sky': Color(0xFF2F80ED),
    'coral': Color(0xFFE8664A),
    'slate': Color(0xFF5B6475),
  };

  static Color group(String? key) => groupColors[key] ?? groupColors['violet']!;
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    primary: AppColors.primary,
    secondary: AppColors.rose,
    surface: AppColors.surface,
    brightness: Brightness.light,
  );
  final base = ThemeData(useMaterial3: true, colorScheme: scheme, fontFamily: 'Cairo', scaffoldBackgroundColor: AppColors.scaffold);
  return base.copyWith(
    textTheme: base.textTheme.apply(bodyColor: AppColors.ink, displayColor: AppColors.ink),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.scaffold,
      foregroundColor: AppColors.ink,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
      titleTextStyle: TextStyle(fontFamily: 'Cairo', fontSize: 19, fontWeight: FontWeight.w700, color: AppColors.ink),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: AppColors.line),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.6),
      ),
      hintStyle: const TextStyle(color: AppColors.muted),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(48, 50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(48, 48),
        side: const BorderSide(color: AppColors.line),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w600),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(
      side: const BorderSide(color: AppColors.line),
      labelStyle: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w600, fontSize: 13),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.ink,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      contentTextStyle: const TextStyle(fontFamily: 'Cairo', color: Colors.white),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: Colors.white,
      showDragHandle: true,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((s) => Colors.white),
      trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.success : const Color(0xFFD5CFDD)),
      trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
    ),
    dividerTheme: const DividerThemeData(color: AppColors.line, space: 1),
  );
}
