import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../cache/image_cache.dart';
import '../network/api_client.dart';

late SharedPreferences appSharedPreferences;

/// تهيئة التخزين المحلي وكاش الصور قبل تشغيل التطبيق.
Future<void> initAppStorage() async {
  appSharedPreferences = await SharedPreferences.getInstance();
  configureImageCache();
}

/// ProviderScope مع SharedPreferences جاهزة.
Widget buildAppRoot(Widget app) {
  return ProviderScope(
    overrides: [
      sharedPreferencesProvider.overrideWithValue(appSharedPreferences),
    ],
    child: app,
  );
}
