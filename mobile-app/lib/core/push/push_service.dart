import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../navigation/app_navigation.dart';
import '../navigation/notification_navigation.dart';
import '../utils/media_url.dart';
import 'firebase_init.dart';
import 'foreground_notification_banner.dart';
import '../../data/services/api_service.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/profile/profile_providers.dart';

/// معالجة الإشعارات في الخلفية (مطلوب لـ FCM).
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await initFirebaseApp();
}

class PushService {
  PushService._();

  static String? _token;
  static bool _initialized = false;

  static Future<void> init(WidgetRef ref) async {
    if (_initialized) return;

    try {
      await initFirebaseApp();
    } catch (e) {
      debugPrint('[PushService] Firebase not configured: $e');
      return;
    }

    _initialized = true;

    try {
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
      if (_token != null) {
        await _registerToken(ref, _token!);
      }

      messaging.onTokenRefresh.listen((token) async {
        _token = token;
        await _registerToken(ref, token);
      });

      ref.listen(authProvider, (prev, next) async {
        if (_token == null) return;
        if (next.isAuthenticated && prev?.isAuthenticated != true) {
          await _registerToken(ref, _token!);
        }
      });

      FirebaseMessaging.onMessage.listen((message) {
        _handleForegroundMessage(ref, message);
      });

      FirebaseMessaging.onMessageOpenedApp.listen((message) {
        _openFromMessage(message.data);
      });

      final initial = await messaging.getInitialMessage();
      if (initial != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _openFromMessage(initial.data);
        });
      }
    } catch (e) {
      debugPrint('[PushService] init failed: $e');
    }
  }

  static Future<void> _registerToken(WidgetRef ref, String token) async {
    try {
      final api = ref.read(apiServiceProvider);
      final platform = Platform.isIOS ? 'ios' : 'android';
      final authed = ref.read(authProvider).isAuthenticated;
      if (authed) {
        await api.registerDevice(token: token, platform: platform);
      } else {
        await api.registerGuestDevice(token: token, platform: platform);
      }
    } catch (e) {
      debugPrint('[PushService] register failed: $e');
    }
  }

  static void _handleForegroundMessage(WidgetRef ref, RemoteMessage message) {
    if (ref.read(authProvider).isAuthenticated) {
      ref.invalidate(notificationsProvider);
    }

    final notification = message.notification;
    final data = Map<String, dynamic>.from(message.data);
    final title = notification?.title ?? data['title']?.toString() ?? '';
    final body = notification?.body ?? data['body']?.toString() ?? '';
    if (title.isEmpty && body.isEmpty) return;

    final imageUrl = resolveMediaUrl(
      notification?.android?.imageUrl ??
          notification?.apple?.imageUrl ??
          data['imageUrl']?.toString(),
    );

    ForegroundNotificationBanner.show(
      title: title,
      body: body,
      imageUrl: imageUrl,
      payload: data,
    );
  }

  static void _openFromMessage(Map<String, dynamic> data) {
    final ctx = rootNavigatorKey.currentContext;
    if (ctx == null || !ctx.mounted) return;
    ForegroundNotificationBanner.dismiss();
    openPushPayload(ctx, data);
  }
}
