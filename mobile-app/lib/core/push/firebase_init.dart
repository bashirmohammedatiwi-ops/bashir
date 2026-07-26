import 'package:firebase_core/firebase_core.dart';

/// تهيئة Firebase من --dart-define أو من GoogleService-Info.plist / google-services.json
Future<void> initFirebaseApp() async {
  if (Firebase.apps.isNotEmpty) return;

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
  return FirebaseOptions(
    apiKey: const String.fromEnvironment('FIREBASE_API_KEY', defaultValue: ''),
    appId: const String.fromEnvironment('FIREBASE_APP_ID', defaultValue: ''),
    messagingSenderId: const String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID', defaultValue: ''),
    projectId: const String.fromEnvironment('FIREBASE_PROJECT_ID', defaultValue: ''),
    iosBundleId: const String.fromEnvironment('FIREBASE_IOS_BUNDLE_ID', defaultValue: 'com.deemaalhayat.app'),
  );
}
