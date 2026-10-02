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

  ThemeData applyTo(ThemeData base) {
    final scheme = base.colorScheme.copyWith(
      primary: accent,
      onPrimary: Colors.white,
      secondary: accentDark,
      onSecondary: Colors.white,
      surface: surface,
      onSurface: ink,
      outline: hairline,
    );
    return base.copyWith(
      colorScheme: scheme,
      scaffoldBackgroundColor: canvas,
      progressIndicatorTheme: base.progressIndicatorTheme.copyWith(color: accent),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: accent),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: accent,
          foregroundColor: Colors.white,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accent,
          foregroundColor: Colors.white,
        ),
      ),
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
    if (t < 0.5) return this;
    return other;
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
