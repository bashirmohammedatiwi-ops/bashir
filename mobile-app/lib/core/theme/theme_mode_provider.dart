import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../bootstrap/app_storage.dart';
import '../config/app_config.dart';

const _themeModeKey = 'theme_mode';

/// يقرأ اختيار المظهر المحفوظ (system/light/dark) — النظام إن لم تختر بعد.
ThemeMode _readThemeMode() {
  final saved = appSharedPreferences.getString(_themeModeKey);
  return ThemeMode.values.firstWhere(
    (m) => m.name == saved,
    orElse: () => ThemeMode.system,
  );
}

/// اختيار الزبونة للمظهر: يتبع النظام، أو فاتح، أو ليلي — محفوظ بين الجلسات.
///
/// قبل تفعيل [AppConfig.darkModeEnabled] يُحفظ الاختيار لكنه لا يُطبَّق:
/// [effectiveBrightnessProvider] يعيد الفاتح دائماً.
class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(_readThemeMode());

  Future<void> setMode(ThemeMode mode) async {
    if (mode == state) return;
    state = mode;
    await appSharedPreferences
        .setString(_themeModeKey, mode.name)
        .catchError((_) => false);
  }
}

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>(
  (ref) => ThemeModeNotifier(),
);

/// سطوع النظام الحالي — يتحدّث لحظة تبديل الهاتف بين الفاتح والليلي.
class PlatformBrightnessNotifier extends StateNotifier<Brightness>
    with WidgetsBindingObserver {
  PlatformBrightnessNotifier()
      : super(WidgetsBinding.instance.platformDispatcher.platformBrightness) {
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangePlatformBrightness() {
    state = WidgetsBinding.instance.platformDispatcher.platformBrightness;
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }
}

final platformBrightnessProvider =
    StateNotifierProvider<PlatformBrightnessNotifier, Brightness>(
  (ref) => PlatformBrightnessNotifier(),
);

/// السطوع المطبَّق فعلاً على التطبيق كله (الثيم، ألوان العالم، شريطا النظام).
/// الفاتح دائماً حتى يُفعَّل الوضع الليلي في [AppConfig.darkModeEnabled].
final effectiveBrightnessProvider = Provider<Brightness>((ref) {
  if (!AppConfig.darkModeEnabled) return Brightness.light;
  return switch (ref.watch(themeModeProvider)) {
    ThemeMode.light => Brightness.light,
    ThemeMode.dark => Brightness.dark,
    ThemeMode.system => ref.watch(platformBrightnessProvider),
  };
});

/// السطوع قبل إنشاء الـ ProviderScope — لضبط شريطي النظام في main قبل أول إطار.
Brightness initialAppBrightness() {
  if (!AppConfig.darkModeEnabled) return Brightness.light;
  return switch (_readThemeMode()) {
    ThemeMode.light => Brightness.light,
    ThemeMode.dark => Brightness.dark,
    ThemeMode.system =>
      WidgetsBinding.instance.platformDispatcher.platformBrightness,
  };
}

/// شريط الحالة شفاف دائماً، والأيقونات عكس الخلفية. شريط التنقّل السفلي
/// بلون [navigationBar] (أبيض في الفاتح كما كان).
SystemUiOverlayStyle systemOverlayStyleFor(
  Brightness brightness, {
  Color? navigationBar,
}) {
  final dark = brightness == Brightness.dark;
  return SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: dark ? Brightness.light : Brightness.dark,
    // iOS: سطوع الخلفية نفسها لا الأيقونات (الفاتح يبقى على افتراضيه كما كان).
    statusBarBrightness: dark ? Brightness.dark : null,
    systemNavigationBarColor:
        navigationBar ?? (dark ? const Color(0xFF120E19) : const Color(0xFFFFFFFF)),
    systemNavigationBarIconBrightness: dark ? Brightness.light : Brightness.dark,
    systemNavigationBarContrastEnforced: false,
  );
}
