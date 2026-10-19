import 'package:firebase_core/firebase_core.dart';

/// تهيئة جارية/منتهية — يشترك فيها كل من يطلبها (فحص إشعار الفتح وPushService
/// يطلبانها معاً عند الإقلاع) فلا تُهيّأ مرتين بالتوازي. الفشل لا يُحفظ: يُعاد عند الطلب التالي.
Future<void>? _initializing;

/// تهيئة Firebase من --dart-define أو من GoogleService-Info.plist / google-services.json
Future<void> initFirebaseApp() {
  if (Firebase.apps.isNotEmpty) return Future<void>.value();
  return _initializing ??= _initialize().catchError((Object e, StackTrace st) {
    _initializing = null;
    Error.throwWithStackTrace(e, st);
  });
}

Future<void> _initialize() async {
  final env = _firebaseOptionsFromEnv();
  if (env.apiKey.isNotEmpty) {
    await Firebase.initializeApp(options: env);
    return;
  }

  // iOS: GoogleService-Info.plist في ios/Runner/
  // Android: google-services.json في android/app/
  await Firebase.initializeApp();
}

FirebaseOptions _firebaseOptionsFromEnv() {
  return const FirebaseOptions(
    apiKey: String.fromEnvironment('FIREBASE_API_KEY', defaultValue: ''),
    appId: String.fromEnvironment('FIREBASE_APP_ID', defaultValue: ''),
    messagingSenderId: String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID', defaultValue: ''),
    projectId: String.fromEnvironment('FIREBASE_PROJECT_ID', defaultValue: ''),
    iosBundleId: String.fromEnvironment('FIREBASE_IOS_BUNDLE_ID', defaultValue: 'com.deemaalhayat.app'),
  );
}
