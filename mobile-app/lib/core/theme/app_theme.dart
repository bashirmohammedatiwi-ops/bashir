import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_fonts.dart';
import 'app_text.dart';

class AppTheme {
  AppTheme._();

  static const _radius = AppCorners.md;

  /// يُبنى مرة واحدة: كل قراءة تعيد النسخة نفسها فلا يرى Flutter "ثيماً جديداً"
  /// في كل إعادة بناء (ولا يعيد حركة AnimatedTheme).
  static final ThemeData light = _build(_ThemeTokens.light);

  /// الوضع الليلي — نفس البناء والخطوط المضمّنة بألوان داكنة (ألوان العالم الليلية
  /// تُطبَّق فوقه في WorldThemePalette.applyTo).
  static final ThemeData dark = _build(_ThemeTokens.dark);

  /// التباعد صفر لكل أنماط السلّم — بدونها يرث العربي 0.25–0.5 من Material
  /// (tall2021) فتنقطع وصلات الحروف في النصوص والحقول.
  static TextTheme _withoutTracking(TextTheme t) {
    TextStyle? z(TextStyle? s) => s?.copyWith(letterSpacing: 0);
    return t.copyWith(
      displayLarge: z(t.displayLarge),
      displayMedium: z(t.displayMedium),
      displaySmall: z(t.displaySmall),
      headlineLarge: z(t.headlineLarge),
      headlineMedium: z(t.headlineMedium),
      headlineSmall: z(t.headlineSmall),
      titleLarge: z(t.titleLarge),
      titleMedium: z(t.titleMedium),
      titleSmall: z(t.titleSmall),
      bodyLarge: z(t.bodyLarge),
      bodyMedium: z(t.bodyMedium),
      bodySmall: z(t.bodySmall),
      labelLarge: z(t.labelLarge),
      labelMedium: z(t.labelMedium),
      labelSmall: z(t.labelSmall),
    );
  }

  static ThemeData _build(_ThemeTokens k) {
    final base = ThemeData(
      useMaterial3: true,
      brightness: k.brightness,
      fontFamily: AppFonts.body,
    );
    final textTheme = _withoutTracking(
      appTextTheme(base.textTheme).apply(
        bodyColor: k.textPrimary,
        displayColor: k.textPrimary,
      ),
    );
    final rounded = RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius));
    final scheme = k.brightness == Brightness.dark
        ? ColorScheme.dark(
            primary: k.primary,
            onPrimary: k.onPrimary,
            primaryContainer: k.primarySoft,
            onPrimaryContainer: k.primaryDeep,
            secondary: k.roseDeep,
            onSecondary: k.onRose,
            secondaryContainer: k.roseSoft,
            onSecondaryContainer: k.roseDeep,
            tertiary: k.rose,
            surface: k.surface,
            onSurface: k.textPrimary,
            surfaceTint: Colors.transparent,
            outline: k.border,
            outlineVariant: k.divider,
            error: k.sale,
          )
        : ColorScheme.light(
            primary: k.primary,
            onPrimary: k.onPrimary,
            primaryContainer: k.primarySoft,
            onPrimaryContainer: k.primaryDeep,
            secondary: k.roseDeep,
            onSecondary: k.onRose,
            secondaryContainer: k.roseSoft,
            onSecondaryContainer: k.roseDeep,
            tertiary: k.rose,
            surface: k.surface,
            onSurface: k.textPrimary,
            surfaceTint: Colors.transparent,
            outline: k.border,
            outlineVariant: k.divider,
            error: k.sale,
          );

    return base.copyWith(
      scaffoldBackgroundColor: k.scaffold,
      primaryColor: k.primary,
      splashFactory: InkSparkle.splashFactory,
      colorScheme: scheme,
      textTheme: textTheme,
      primaryTextTheme: _withoutTracking(base.primaryTextTheme),
      appBarTheme: AppBarTheme(
        backgroundColor: k.surface,
        foregroundColor: k.textPrimary,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        shadowColor: k.primaryDeep.withValues(alpha: 0.12),
        centerTitle: true,
        titleTextStyle: appFont(color: k.textPrimary, fontSize: 18, fontWeight: FontWeight.w700),
      ),
      cardTheme: CardThemeData(
        color: k.card,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: rounded,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: k.primary,
          foregroundColor: k.onPrimary,
          disabledBackgroundColor: k.primarySoft,
          disabledForegroundColor: k.textMuted,
          elevation: 0,
          minimumSize: const Size.fromHeight(54),
          shape: rounded,
          textStyle: appFont(fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: k.primary,
          foregroundColor: k.onPrimary,
          shape: rounded,
          textStyle: appFont(fontSize: 15, fontWeight: FontWeight.w700),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: k.primaryDark,
          side: BorderSide(color: k.primary, width: 1.3),
          minimumSize: const Size.fromHeight(54),
          shape: rounded,
          textStyle: appFont(fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: k.primaryDark,
          textStyle: appFont(fontSize: 14, fontWeight: FontWeight.w700),
        ),
      ),
      iconButtonTheme: IconButtonThemeData(style: IconButton.styleFrom(foregroundColor: k.textPrimary)),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: k.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        hintStyle: appFont(color: k.textMuted, fontSize: 14, letterSpacing: 0),
        labelStyle: appFont(color: k.textSecondary, fontSize: 14, letterSpacing: 0),
        floatingLabelStyle: appFont(color: k.primaryDark, fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 0),
        prefixIconColor: k.textMuted,
        suffixIconColor: k.textMuted,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radius),
          borderSide: BorderSide(color: k.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radius),
          borderSide: BorderSide(color: k.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radius),
          borderSide: BorderSide(color: k.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radius),
          borderSide: BorderSide(color: k.sale),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: k.surface,
        selectedItemColor: k.primary,
        unselectedItemColor: k.textMuted,
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
        elevation: 0,
      ),
      // كل ورقة في التطبيق ترسم مقبضها بنفسها (showAppSheet وغيرها): مقبض Material
      // الافتراضي كان يظهر مقبضاً ثانياً عائماً فوق الخلفية الداكنة.
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: k.surface,
        surfaceTintColor: Colors.transparent,
        showDragHandle: false,
        dragHandleColor: k.hairline,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppCorners.xl))),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: k.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        titleTextStyle: appFont(color: k.textPrimary, fontSize: 18, fontWeight: FontWeight.w700),
        contentTextStyle: appFont(color: k.textSecondary, fontSize: 14.5, height: 1.5),
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: k.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: appFont(color: k.textPrimary, fontSize: 14, fontWeight: FontWeight.w600),
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: k.primaryDark,
        unselectedLabelColor: k.textSecondary,
        indicatorColor: k.primary,
        dividerColor: k.divider,
        labelStyle: appFont(fontSize: 14, fontWeight: FontWeight.w700),
        unselectedLabelStyle: appFont(fontSize: 14, fontWeight: FontWeight.w600),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: k.primary,
        linearTrackColor: k.primarySoft,
        circularTrackColor: Colors.transparent,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) => states.contains(WidgetState.selected) ? Colors.white : k.textMuted),
        trackColor: WidgetStateProperty.resolveWith((states) => states.contains(WidgetState.selected) ? k.primary : k.divider),
        trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) => states.contains(WidgetState.selected) ? k.primary : Colors.transparent),
        side: BorderSide(color: k.hairline, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) => states.contains(WidgetState.selected) ? k.primary : k.hairline),
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: k.primary,
        inactiveTrackColor: k.primarySoft,
        thumbColor: k.primary,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: k.primary,
        foregroundColor: Colors.white,
        elevation: 2,
      ),
      badgeTheme: BadgeThemeData(backgroundColor: k.roseDeep, textColor: Colors.white),
      dividerTheme: DividerThemeData(color: k.divider, thickness: 1),
      listTileTheme: ListTileThemeData(iconColor: k.primaryDark),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: k.snackBackground,
        behavior: SnackBarBehavior.floating,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        contentTextStyle: appFont(color: Colors.white, fontWeight: FontWeight.w700),
        actionTextColor: k.rose,
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: k.primaryLight,
        selectedColor: k.primary,
        labelStyle: appFont(color: k.primaryDark, fontWeight: FontWeight.w700),
        side: BorderSide.none,
        shape: const StadiumBorder(),
      ),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: k.primary,
        selectionColor: k.primary.withValues(alpha: 0.22),
        selectionHandleColor: k.primary,
      ),
    );
  }
}

/// ألوان الأساس لكل سطوع — قيم الفاتح هي AppColors نفسها (الثيم الفاتح لم يتغيّر).
class _ThemeTokens {
  final Brightness brightness;
  final Color scaffold;
  final Color surface;
  final Color card;
  final Color primary;
  final Color onPrimary;
  final Color primarySoft;
  final Color primaryLight;
  final Color primaryDark;
  final Color primaryDeep;
  final Color rose;
  final Color roseDeep;
  final Color roseSoft;
  final Color onRose;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color border;
  final Color divider;
  final Color hairline;
  final Color sale;

  /// خلفية الرسائل السفلية — نصها أبيض في الوضعين.
  final Color snackBackground;

  const _ThemeTokens({
    required this.brightness,
    required this.scaffold,
    required this.surface,
    required this.card,
    required this.primary,
    required this.onPrimary,
    required this.primarySoft,
    required this.primaryLight,
    required this.primaryDark,
    required this.primaryDeep,
    required this.rose,
    required this.roseDeep,
    required this.roseSoft,
    required this.onRose,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.border,
    required this.divider,
    required this.hairline,
    required this.sale,
    required this.snackBackground,
  });

  static const light = _ThemeTokens(
    brightness: Brightness.light,
    scaffold: AppColors.scaffold,
    surface: AppColors.surface,
    card: AppColors.card,
    primary: AppColors.primary,
    onPrimary: AppColors.onPrimary,
    primarySoft: AppColors.primarySoft,
    primaryLight: AppColors.primaryLight,
    primaryDark: AppColors.primaryDark,
    primaryDeep: AppColors.primaryDeep,
    rose: AppColors.rose,
    roseDeep: AppColors.roseDeep,
    roseSoft: AppColors.roseSoft,
    onRose: Colors.white,
    textPrimary: AppColors.textPrimary,
    textSecondary: AppColors.textSecondary,
    textMuted: AppColors.textMuted,
    border: AppColors.border,
    divider: AppColors.divider,
    hairline: AppColors.hairline,
    sale: AppColors.sale,
    snackBackground: AppColors.ink,
  );

  /// هوية المتجر الليلية (مطابقة لـ WorldThemePalette.brandDark ولمتجر الويب):
  /// خلفيات بنفسجية داكنة، وليلكي ووردي مرفوعان ليُقرآ 4.5:1 فوق البطاقات.
  /// «primaryDark/primaryDeep» هنا ألوان التوكيد للنص — أفتح لا أغمق.
  static const dark = _ThemeTokens(
    brightness: Brightness.dark,
    scaffold: Color(0xFF1B1425),
    surface: Color(0xFF261D34),
    card: Color(0xFF261D34),
    primary: Color(0xFFAD86DF),
    onPrimary: Colors.white,
    primarySoft: Color(0xFF3A2950),
    primaryLight: Color(0xFF39294E),
    primaryDark: Color(0xFFC3A6E8),
    primaryDeep: Color(0xFFD9C7F2),
    rose: Color(0xFFF0A7C4),
    roseDeep: Color(0xFFE48AB8),
    roseSoft: Color(0xFF4A2A3E),
    onRose: Color(0xFF1B1425),
    textPrimary: Color(0xFFF4EFFA),
    textSecondary: Color(0xFFC9C1D4),
    textMuted: Color(0xFF8E8898),
    border: Color(0xFF3E3549),
    divider: Color(0xFF342B40),
    hairline: Color(0xFF433A4F),
    sale: Color(0xFFF06A98),
    snackBackground: Color(0xFF443B50),
  );
}
