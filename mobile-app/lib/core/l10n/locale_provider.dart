import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../bootstrap/app_storage.dart';

const _localeKey = 'app_locale';
const _localeChosenKey = 'locale_chosen';

class AppLocaleSettings {
  final Locale locale;
  final bool hasChosen;
  final bool loaded;

  const AppLocaleSettings({
    required this.locale,
    this.hasChosen = false,
    this.loaded = false,
  });

  bool get isArabic => locale.languageCode == 'ar';
  TextDirection get direction => isArabic ? TextDirection.rtl : TextDirection.ltr;
  String get languageCode => locale.languageCode;

  AppLocaleSettings copyWith({Locale? locale, bool? hasChosen, bool? loaded}) {
    return AppLocaleSettings(
      locale: locale ?? this.locale,
      hasChosen: hasChosen ?? this.hasChosen,
      loaded: loaded ?? this.loaded,
    );
  }
}

class LocaleNotifier extends StateNotifier<AppLocaleSettings> {
  LocaleNotifier() : super(const AppLocaleSettings(locale: Locale('ar'))) {
    _load();
  }

  Future<void> _load() async {
    final prefs = appSharedPreferences;
    final code = prefs.getString(_localeKey) ?? 'ar';
    final chosen = prefs.getBool(_localeChosenKey) ?? false;
    state = AppLocaleSettings(
      locale: Locale(code),
      hasChosen: chosen,
      loaded: true,
    );
  }

  Future<void> setLocale(Locale locale, {bool markChosen = false}) async {
    final prefs = appSharedPreferences;
    await prefs.setString(_localeKey, locale.languageCode);
    if (markChosen) {
      await prefs.setBool(_localeChosenKey, true);
    }
    state = state.copyWith(
      locale: locale,
      hasChosen: markChosen ? true : state.hasChosen,
    );
  }

  Future<void> chooseLanguage(Locale locale) => setLocale(locale, markChosen: true);
}

final appLocaleProvider =
    StateNotifierProvider<LocaleNotifier, AppLocaleSettings>((ref) => LocaleNotifier());

/// اختصار لرمز اللغة الحالية.
final languageCodeProvider = Provider<String>((ref) {
  return ref.watch(appLocaleProvider).languageCode;
});
