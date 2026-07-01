import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/services/api_service.dart';
import '../../features/auth/auth_provider.dart';

/// معالجة الإشعارات في الخلفية (مطلوب لـ FCM).
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: _firebaseOptionsFromEnv());
}

class PushService {
  PushService._();

  static String? _token;
  static bool _initialized = false;

  static bool get isConfigured => _firebaseOptionsFromEnv().apiKey.isNotEmpty;

  static Future<void> init(WidgetRef ref) async {
    if (_initialized || !isConfigured) return;
    _initialized = true;

    try {
      await Firebase.initializeApp(options: _firebaseOptionsFromEnv());
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(alert: true, badge: true, sound: true);

      if (Platform.isIOS) {
        await messaging.setForegroundNotificationPresentationOptions(
          alert: true,
          badge: true,
          sound: true,
        );
      }

      _token = await messaging.getToken();
      if (_token != null && ref.read(authProvider).isAuthenticated) {
        await _register(ref, _token!);
      }

      messaging.onTokenRefresh.listen((token) async {
        _token = token;
        if (ref.read(authProvider).isAuthenticated) {
          await _register(ref, token);
        }
      });

      ref.listen(authProvider, (prev, next) async {
        if (next.isAuthenticated && _token != null) {
          await _register(ref, _token!);
        } else if (prev?.isAuthenticated == true && _token != null) {
          await _unregister(ref, _token!);
        }
      });
    } catch (e) {
      debugPrint('[PushService] init failed: $e');
    }
  }

  static Future<void> _register(WidgetRef ref, String token) async {
    try {
      final platform = Platform.isIOS ? 'ios' : 'android';
      await ref.read(apiServiceProvider).registerDevice(token: token, platform: platform);
    } catch (e) {
      debugPrint('[PushService] register failed: $e');
    }
  }

  static Future<void> _unregister(WidgetRef ref, String token) async {
    try {
      await ref.read(apiServiceProvider).unregisterDevice(token: token);
    } catch (_) {}
  }
}

FirebaseOptions _firebaseOptionsFromEnv() {
  return FirebaseOptions(
    apiKey: const String.fromEnvironment('FIREBASE_API_KEY', defaultValue: ''),
    appId: const String.fromEnvironment('FIREBASE_APP_ID', defaultValue: ''),
    messagingSenderId: const String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID', defaultValue: ''),
    projectId: const String.fromEnvironment('FIREBASE_PROJECT_ID', defaultValue: ''),
    iosBundleId: const String.fromEnvironment('FIREBASE_IOS_BUNDLE_ID', defaultValue: 'com.alhayaa.alhayaa'),
  );
}
