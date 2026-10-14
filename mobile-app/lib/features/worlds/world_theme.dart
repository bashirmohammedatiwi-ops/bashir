import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/store_world.dart';
import 'worlds_provider.dart';

/// ألوان الواجهة المرتبطة بالعالم النشط — مع fallback لهوية ديما الحياة.
class WorldThemePalette {
  final Color accent;
  final Color accentDark;
  final Color accentSoft;
  final Color accentLight;
  final Color canvas;
  final Color canvasWarm;
  final Color ink;
  final Color inkSoft;
  final Color inkMuted;
  final Color surface;
  final Color hairline;
  final Color divider;
  final LinearGradient signatureGradient;
  final LinearGradient primaryGradient;

  const WorldThemePalette({
    required this.accent,
    required this.accentDark,
    required this.accentSoft,
    required this.accentLight,
    required this.canvas,
    required this.canvasWarm,
    required this.ink,
    required this.inkSoft,
    required this.inkMuted,
    required this.surface,
    required this.hairline,
    required this.divider,
    required this.signatureGradient,
    required this.primaryGradient,
  });

  factory WorldThemePalette.brand() => WorldThemePalette(
        accent: AppColors.primary,
        accentDark: AppColors.primaryDark,
        accentSoft: AppColors.primarySoft,
        accentLight: AppColors.primaryLight,
        canvas: AppColors.scaffold,
        canvasWarm: AppColors.homeGradientTop,
        ink: AppColors.ink,
        inkSoft: AppColors.textSecondary,
        inkMuted: AppColors.textMuted,
        surface: AppColors.surface,
        hairline: AppColors.hairline,
        divider: AppColors.divider,
        signatureGradient: AppColors.signatureGradient,
        primaryGradient: AppColors.primaryGradient,
      );

  factory WorldThemePalette.fromWorld(StoreWorld world) {
    final accent = world.accent;
    final canvas = world.canvas;
    final ink = world.ink;
    final surface = world.surface;
    final accentDark = Color.lerp(accent, Colors.black, 0.22)!;
    final accentSoft = Color.alphaBlend(accent.withValues(alpha: 0.14), canvas);
    final accentLight = Color.alphaBlend(accent.withValues(alpha: 0.08), surface);
    final inkSoft = Color.lerp(ink, canvas, 0.35)!;
    final inkMuted = Color.lerp(ink, canvas, 0.55)!;
    final hairline = Color.lerp(canvas, ink, 0.12)!;
    final divider = Color.lerp(canvas, ink, 0.08)!;
    final mid = Color.lerp(accent, AppColors.rose, 0.38)!;
    final light = Color.lerp(accent, Colors.white, 0.28)!;

    return WorldThemePalette(
      accent: accent,
      accentDark: accentDark,
      accentSoft: accentSoft,
      accentLight: accentLight,
      canvas: canvas,
      canvasWarm: Color.lerp(canvas, Colors.white, 0.35)!,
      ink: ink,
      inkSoft: inkSoft,
      inkMuted: inkMuted,
      surface: surface,
      hairline: hairline,
      divider: divider,
      signatureGradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [accent, mid, light],
        stops: const [0.0, 0.62, 1.0],
      ),
      primaryGradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color.lerp(accent, Colors.white, 0.18)!, accentDark],
      ),
    );
  }

  /// يطبّق ألوان العالم على كل عناصر Material — النصوص والأزرار والحقول
  /// والأوراق السفلية — حتى لا يحتاج أي مكوّن لون ثابت.
  ThemeData applyTo(ThemeData base) {
    final scheme = base.colorScheme.copyWith(
      primary: accent,
      onPrimary: Colors.white,
      primaryContainer: accentSoft,
      onPrimaryContainer: accentDark,
      secondary: accentDark,
      onSecondary: Colors.white,
      surface: surface,
      onSurface: ink,
      onSurfaceVariant: inkSoft,
      outline: hairline,
      outlineVariant: divider,
    );
    OutlineInputBorder border(Color c, [double w = 1]) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: c, width: w),
        );
    final input = base.inputDecorationTheme;
    return base.copyWith(
      colorScheme: scheme,
      primaryColor: accent,
      scaffoldBackgroundColor: canvas,
      canvasColor: canvas,
      dividerColor: divider,
      textTheme: base.textTheme.apply(bodyColor: ink, displayColor: ink),
      iconTheme: base.iconTheme.copyWith(color: ink),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: accent,
        selectionColor: accent.withValues(alpha: 0.22),
        selectionHandleColor: accent,
      ),
      progressIndicatorTheme: base.progressIndicatorTheme.copyWith(color: accent),
      appBarTheme: base.appBarTheme.copyWith(
        backgroundColor: surface,
        foregroundColor: ink,
        titleTextStyle: base.appBarTheme.titleTextStyle?.copyWith(color: ink),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: accentDark).merge(base.textButtonTheme.style),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(backgroundColor: accent, foregroundColor: Colors.white).merge(base.filledButtonTheme.style),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
            backgroundColor: accent,
            foregroundColor: Colors.white,
            disabledBackgroundColor: accentSoft,
            disabledForegroundColor: inkMuted,
          ).merge(base.elevatedButtonTheme.style),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
            foregroundColor: accentDark,
            side: BorderSide(color: accent, width: 1.3),
          ).merge(base.outlinedButtonTheme.style),
      ),
      inputDecorationTheme: input.copyWith(
        fillColor: surface,
        hintStyle: input.hintStyle?.copyWith(color: inkMuted),
        labelStyle: input.labelStyle?.copyWith(color: inkSoft),
        floatingLabelStyle: input.floatingLabelStyle?.copyWith(color: accentDark),
        prefixIconColor: inkMuted,
        suffixIconColor: inkMuted,
        border: border(hairline),
        enabledBorder: border(hairline),
        focusedBorder: border(accent, 1.5),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? Colors.white : null,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? accent : null,
        ),
        trackOutlineColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? accent : hairline,
        ),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? accent : null,
        ),
        side: BorderSide(color: hairline, width: 1.4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? accent : inkMuted,
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: surface,
        selectedColor: accentSoft,
        side: BorderSide(color: hairline),
        checkmarkColor: accentDark,
      ),
      bottomSheetTheme: base.bottomSheetTheme.copyWith(
        backgroundColor: surface,
        modalBackgroundColor: surface,
        dragHandleColor: hairline,
      ),
      dialogTheme: base.dialogTheme.copyWith(backgroundColor: surface),
      snackBarTheme: base.snackBarTheme.copyWith(backgroundColor: ink),
      extensions: [
        for (final ext in base.extensions.values)
          if (ext is! WorldTheme) ext,
        WorldTheme(palette: this),
      ],
    );
  }

  List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: accentDark.withValues(alpha: 0.055),
          blurRadius: 16,
          offset: const Offset(0, 6),
        ),
      ];

  Color get blush => canvasWarm;
}

/// ThemeExtension — يوزّع ألوان العالم على كل الشاشات (داخل وخارج الـ shell).
class WorldTheme extends ThemeExtension<WorldTheme> {
  final WorldThemePalette palette;

  const WorldTheme({required this.palette});

  static WorldThemePalette of(BuildContext context) {
    return Theme.of(context).extension<WorldTheme>()?.palette ?? WorldThemePalette.brand();
  }

  @override
  WorldTheme copyWith({WorldThemePalette? palette}) => WorldTheme(palette: palette ?? this.palette);

  @override
  WorldTheme lerp(covariant ThemeExtension<WorldTheme>? other, double t) {
    if (other is! WorldTheme) return this;
    if (identical(other, this)) return this;
    final from = palette;
    final to = other.palette;
    return WorldTheme(
      palette: WorldThemePalette(
        accent: Color.lerp(from.accent, to.accent, t)!,
        accentDark: Color.lerp(from.accentDark, to.accentDark, t)!,
        accentSoft: Color.lerp(from.accentSoft, to.accentSoft, t)!,
        accentLight: Color.lerp(from.accentLight, to.accentLight, t)!,
        canvas: Color.lerp(from.canvas, to.canvas, t)!,
        canvasWarm: Color.lerp(from.canvasWarm, to.canvasWarm, t)!,
        ink: Color.lerp(from.ink, to.ink, t)!,
        inkSoft: Color.lerp(from.inkSoft, to.inkSoft, t)!,
        inkMuted: Color.lerp(from.inkMuted, to.inkMuted, t)!,
        surface: Color.lerp(from.surface, to.surface, t)!,
        hairline: Color.lerp(from.hairline, to.hairline, t)!,
        divider: Color.lerp(from.divider, to.divider, t)!,
        signatureGradient:
            LinearGradient.lerp(from.signatureGradient, to.signatureGradient, t) ??
                from.signatureGradient,
        primaryGradient:
            LinearGradient.lerp(from.primaryGradient, to.primaryGradient, t) ??
                from.primaryGradient,
      ),
    );
  }
}

extension WorldThemeContext on BuildContext {
  WorldThemePalette get worldTheme => WorldTheme.of(this);
}

final activeWorldThemeProvider = Provider<WorldThemePalette>((ref) {
  final worlds = ref.watch(worldsProvider).valueOrNull;
  final selected = ref.watch(selectedWorldSlugProvider);
  final slug = resolveWorldSlug(selected: selected, worlds: worlds);
  if (slug == null) return WorldThemePalette.brand();

  final world = ref.watch(worldDetailProvider(slug)).valueOrNull;
  if (world == null) return WorldThemePalette.brand();
  return WorldThemePalette.fromWorld(world);
});

extension WorldThemeRef on WidgetRef {
  WorldThemePalette get worldTheme => watch(activeWorldThemeProvider);
}
