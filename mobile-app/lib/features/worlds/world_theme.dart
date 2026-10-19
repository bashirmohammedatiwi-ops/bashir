import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/store_world.dart';
import 'worlds_provider.dart';

/// نسبة التباين بين لونين حسب WCAG (من 1 إلى 21). النص العادي يحتاج 4.5 على الأقل.
double contrastRatio(Color a, Color b) {
  final la = a.computeLuminance();
  final lb = b.computeLuminance();
  return (math.max(la, lb) + 0.05) / (math.min(la, lb) + 0.05);
}

const double _minTextContrast = 4.5;

/// نص الأزرار وتعبئتها فوق لون العالم: الأبيض إن قُرئ بوضوح، وإلا حبر العالم،
/// وإلا تبقى الكتابة بيضاء ونغمّق التعبئة بخطوات 5% حتى يبلغ التباين 4.5:1.
/// (ذهبي الهدايا مثلاً: الأبيض 2.8:1 فقط، والحبر 5.6:1.)
({Color onAccent, Color buttonFill}) _accessibleAccent(Color accent, Color ink) {
  if (contrastRatio(Colors.white, accent) >= _minTextContrast) {
    return (onAccent: Colors.white, buttonFill: accent);
  }
  if (contrastRatio(ink, accent) >= _minTextContrast) {
    return (onAccent: ink, buttonFill: accent);
  }
  for (var step = 1; step < 20; step++) {
    final fill = Color.lerp(accent, Colors.black, step * 0.05)!;
    if (contrastRatio(Colors.white, fill) >= _minTextContrast) {
      return (onAccent: Colors.white, buttonFill: fill);
    }
  }
  return (onAccent: Colors.white, buttonFill: Colors.black);
}

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

  /// لون النص والأيقونات فوق [buttonFill] (وفوق [accent] متى طابقته التعبئة).
  final Color onAccent;

  /// تعبئة الأزرار الممتلئة: [accent] نفسه، أو نسخة أغمق قليلاً حين لا يُقرأ
  /// فوقه الأبيض ولا الحبر.
  final Color buttonFill;

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
    this.onAccent = Colors.white,
    Color? buttonFill,
  }) : buttonFill = buttonFill ?? accent;

  /// هوية المتجر نفسها في كل استدعاء (WorldTheme.of يعود إليها خارج الـ router).
  factory WorldThemePalette.brand() => _brand;

  static final WorldThemePalette _brand = _buildBrand();

  static WorldThemePalette _buildBrand() {
    final on = _accessibleAccent(AppColors.primary, AppColors.ink);
    return WorldThemePalette(
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
      onAccent: on.onAccent,
      buttonFill: on.buttonFill,
    );
  }

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
    final on = _accessibleAccent(accent, ink);

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
      onAccent: on.onAccent,
      buttonFill: on.buttonFill,
    );
  }

  /// آخر نتائج [applyTo]: ThemeData جديدة لنفس الألوان كانت تُفشل مقارنة الثيم،
  /// فيعيد AnimatedTheme حركته ويُبنى كل ما يقرأ الثيم في كل إعادة بناء.
  static final _applied = <({WorldThemePalette palette, ThemeData base, ThemeData theme})>[];

  /// يطبّق ألوان العالم على كل عناصر Material — النصوص والأزرار والحقول
  /// والأوراق السفلية — حتى لا يحتاج أي مكوّن لون ثابت.
  ///
  /// نفس الألوان على نفس [base] تعيد النسخة نفسها.
  ThemeData applyTo(ThemeData base) {
    for (final entry in _applied) {
      if (identical(entry.base, base) && entry.palette == this) return entry.theme;
    }
    final theme = _themeFor(base);
    _applied.insert(0, (palette: this, base: base, theme: theme));
    if (_applied.length > 4) _applied.removeLast();
    return theme;
  }

  ThemeData _themeFor(ThemeData base) {
    final scheme = base.colorScheme.copyWith(
      primary: accent,
      onPrimary: onAccent,
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
          borderRadius: BorderRadius.circular(AppCorners.md),
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
        style: _overBase(TextButton.styleFrom(foregroundColor: accentDark), base.textButtonTheme.style),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: _overBase(
          FilledButton.styleFrom(backgroundColor: buttonFill, foregroundColor: onAccent),
          base.filledButtonTheme.style,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: _overBase(
          ElevatedButton.styleFrom(
            backgroundColor: buttonFill,
            foregroundColor: onAccent,
            disabledBackgroundColor: accentSoft,
            disabledForegroundColor: inkMuted,
          ),
          base.elevatedButtonTheme.style,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: _overBase(
          OutlinedButton.styleFrom(
            foregroundColor: accentDark,
            side: BorderSide(color: accent, width: 1.3),
          ),
          base.outlinedButtonTheme.style,
        ),
      ),
      floatingActionButtonTheme: base.floatingActionButtonTheme.copyWith(
        backgroundColor: buttonFill,
        foregroundColor: onAccent,
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
          (s) => s.contains(WidgetState.selected) ? onAccent : null,
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

  /// ألوان العالم فوق نمط زر الأساس (الشكل والحجم والخط من الأساس).
  /// styleFrom يضع textStyle فارغاً دائماً (WidgetStatePropertyAll(null))، فكان
  /// الدمج وحده يُسقط خط الأزرار (700) ويعود لافتراضي Material (500).
  static ButtonStyle _overBase(ButtonStyle colors, ButtonStyle? base) =>
      colors.copyWith(textStyle: base?.textStyle).merge(base);

  List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: accentDark.withValues(alpha: 0.055),
          blurRadius: 16,
          offset: const Offset(0, 6),
        ),
      ];

  Color get blush => canvasWarm;

  /// مقارنة بالقيمة: تحديث العوالم بنفس الألوان لا يُعدّ تغييراً للثيم
  /// (Riverpod لا يُبلغ، وMaterialApp لا يعيد حركة الثيم).
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is WorldThemePalette &&
          other.accent == accent &&
          other.accentDark == accentDark &&
          other.accentSoft == accentSoft &&
          other.accentLight == accentLight &&
          other.canvas == canvas &&
          other.canvasWarm == canvasWarm &&
          other.ink == ink &&
          other.inkSoft == inkSoft &&
          other.inkMuted == inkMuted &&
          other.surface == surface &&
          other.hairline == hairline &&
          other.divider == divider &&
          other.signatureGradient == signatureGradient &&
          other.primaryGradient == primaryGradient &&
          other.onAccent == onAccent &&
          other.buttonFill == buttonFill;

  @override
  int get hashCode => Object.hash(
        accent,
        accentDark,
        accentSoft,
        accentLight,
        canvas,
        canvasWarm,
        ink,
        inkSoft,
        inkMuted,
        surface,
        hairline,
        divider,
        signatureGradient,
        primaryGradient,
        onAccent,
        buttonFill,
      );
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
        onAccent: Color.lerp(from.onAccent, to.onAccent, t)!,
        buttonFill: Color.lerp(from.buttonFill, to.buttonFill, t)!,
      ),
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is WorldTheme && other.palette == palette;

  @override
  int get hashCode => palette.hashCode;
}

extension WorldThemeContext on BuildContext {
  WorldThemePalette get worldTheme => WorldTheme.of(this);
}

final activeWorldThemeProvider = Provider<WorldThemePalette>((ref) {
  final worlds = ref.watch(worldsProvider).valueOrNull;
  final selected = ref.watch(selectedWorldSlugProvider);
  final slug = resolveWorldSlug(selected: selected, worlds: worlds);
  if (slug == null) return WorldThemePalette.brand();

  // قائمة العوالم تحمل الألوان نفسها: لا ننتظر التفاصيل فيومض ليلكي المتجر أولاً.
  final fromList = worlds?.where((w) => w.slug == slug).firstOrNull;
  final world = ref.watch(worldDetailProvider(slug)).valueOrNull ?? fromList;
  if (world == null) return WorldThemePalette.brand();
  return WorldThemePalette.fromWorld(world);
});

/// ثيم التطبيق كله بألوان العالم النشط — يتغيّر فقط حين تتغيّر الألوان فعلاً.
final appThemeDataProvider = Provider<ThemeData>(
  (ref) => ref.watch(activeWorldThemeProvider).applyTo(AppTheme.light),
);

extension WorldThemeRef on WidgetRef {
  WorldThemePalette get worldTheme => watch(activeWorldThemeProvider);
}
