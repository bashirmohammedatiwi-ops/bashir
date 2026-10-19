import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'app.dart';
import 'core/bootstrap/app_storage.dart';
import 'core/theme/theme_mode_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  _registerFontLicenses();
  // يُقرأ بالتوازي مع التهيئة: يقرّر هل يُعرض مشهد الافتتاح كاملاً (إصدار جديد).
  final appVersion = _readAppVersion();
  await initializeDateFormatting('ar', null);
  await initializeDateFormatting('en', null);
  await initAppStorage();
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }
  // الأساس قبل أول إطار فقط (المظهر المحفوظ)؛ بعدها يتبع الشريطان السطوع
  // المطبَّق عبر AnnotatedRegion في جذر التطبيق (app.dart).
  SystemChrome.setSystemUIOverlayStyle(
    systemOverlayStyleFor(initialAppBrightness()),
  );
  runApp(buildAppRoot(AlhayaaApp(appVersion: await appVersion)));
}

/// «1.0.0+11» — أو نص فارغ إن تعذّرت القراءة (يُعامل كأن الإصدار لم يتغيّر).
Future<String> _readAppVersion() async {
  try {
    final info = await PackageInfo.fromPlatform().timeout(
      const Duration(milliseconds: 600),
    );
    return '${info.version}+${info.buildNumber}';
  } catch (_) {
    return '';
  }
}

/// تراخيص الخطوط المضمّنة (SIL Open Font License 1.1) — تظهر في صفحة التراخيص.
/// تُقرأ الملفات فقط حين تُفتح تلك الصفحة.
void _registerFontLicenses() {
  LicenseRegistry.addLicense(() async* {
    const fonts = [
      ('IBM Plex Sans Arabic', 'IBMPlexSansArabic'),
      ('El Messiri', 'ElMessiri'),
      ('Cormorant Garamond', 'CormorantGaramond'),
      ('Cinzel', 'Cinzel'),
    ];
    for (final (family, file) in fonts) {
      final text = await rootBundle.loadString(
        'assets/fonts/licenses/$file-OFL.txt',
      );
      yield LicenseEntryWithLineBreaks([family], text);
    }
  });
}
