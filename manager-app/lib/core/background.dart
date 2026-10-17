import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart' show Color;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:workmanager/workmanager.dart';

import 'config.dart';

const _task = 'manager.newOrders';
const _channel = AndroidNotificationDetails(
  'new_orders',
  'الطلبات الجديدة',
  channelDescription: 'تنبيه عند وصول طلب جديد',
  importance: Importance.high,
  priority: Priority.high,
  color: Color(0xFF6E45B0),
);

final _notifications = FlutterLocalNotificationsPlugin();

/// تنبيهات الطلبات الجديدة والتطبيق مغلق: فحص خفيف كل ~15 دقيقة (أقل فترة يسمح بها أندرويد).
class BackgroundOrders {
  static bool get supported => !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  static Future<void> init() async {
    if (!supported) return;
    await _notifications.initialize(settings: const InitializationSettings(android: AndroidInitializationSettings('@mipmap/ic_launcher')));
    await Workmanager().initialize(callbackDispatcher);
  }

  /// بعد الدخول (أو عند التفعيل من الإعدادات).
  static Future<void> enable() async {
    if (!supported) return;
    await _notifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.requestNotificationsPermission();
    await Workmanager().registerPeriodicTask(
      _task,
      _task,
      frequency: const Duration(minutes: 15),
      constraints: Constraints(networkType: NetworkType.connected),
      existingWorkPolicy: ExistingPeriodicWorkPolicy.keep,
    );
  }

  static Future<void> disable() async {
    if (!supported) return;
    await Workmanager().cancelByUniqueName(_task);
  }

  /// التطبيق المفتوح يسجّل آخر طلب رآه — حتى لا يُنبَّه عنه مرة ثانية من الخلفية.
  static Future<void> markSeen(String? latestOrderId) async {
    final p = await SharedPreferences.getInstance();
    await p.setInt('bgForegroundAt', DateTime.now().millisecondsSinceEpoch);
    if (latestOrderId != null) await p.setString('bgLastOrderId', latestOrderId);
  }
}

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, input) async {
    try {
      await _checkOrders();
    } catch (_) {
      // لا نُفشل المهمة — نحاول في الدورة التالية
    }
    return true;
  });
}

Future<void> _checkOrders() async {
  final prefs = await SharedPreferences.getInstance();
  if (prefs.getBool('bgOrders') == false) return;
  // التطبيق مفتوح الآن (يفحص بنفسه كل 45 ثانية) — لا داعي
  final fg = prefs.getInt('bgForegroundAt') ?? 0;
  if (DateTime.now().millisecondsSinceEpoch - fg < 3 * 60 * 1000) return;

  const storage = FlutterSecureStorage();
  var access = await storage.read(key: 'mgr_access');
  final refresh = await storage.read(key: 'mgr_refresh');
  if (refresh == null) return;
  final dio = Dio(
    BaseOptions(baseUrl: AppConfig.apiBase, connectTimeout: const Duration(seconds: 15), receiveTimeout: const Duration(seconds: 20)),
  );

  bool expired(String? jwt) {
    if (jwt == null) return true;
    try {
      final payload = jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(jwt.split('.')[1])))) as Map;
      return DateTime.fromMillisecondsSinceEpoch(
        (payload['exp'] as num).toInt() * 1000,
      ).isBefore(DateTime.now().add(const Duration(seconds: 30)));
    } catch (_) {
      return true;
    }
  }

  if (expired(access)) {
    final r = await dio.post('/auth/refresh', data: {'refreshToken': refresh});
    final d = (r.data is Map && r.data['data'] != null ? r.data['data'] : r.data) as Map;
    access = '${d['accessToken']}';
    await storage.write(key: 'mgr_access', value: access);
    await storage.write(key: 'mgr_refresh', value: '${d['refreshToken']}');
  }

  final res = await dio.get('/control/orders/pulse', options: Options(headers: {'Authorization': 'Bearer $access'}));
  final body = (res.data['data'] ?? res.data) as Map;
  final pending = (body['pending'] as num?)?.toInt() ?? 0;
  final latest = body['latest'] as Map?;
  final latestId = latest?['id']?.toString();
  final seen = prefs.getString('bgLastOrderId');
  if (latestId == null || latestId == seen) return;
  await prefs.setString('bgLastOrderId', latestId);
  if (seen == null) return; // أول تشغيل: نحفظ المرجع فقط

  await _notifications.initialize(settings: const InitializationSettings(android: AndroidInitializationSettings('@mipmap/ic_launcher')));
  await _notifications.show(
    id: 1001,
    title: 'طلب جديد ${latest?['orderNumber'] ?? ''}',
    body: pending > 1 ? 'لديك $pending طلبات جديدة بانتظار التأكيد' : 'افتح التطبيق لتأكيد الطلب',
    notificationDetails: const NotificationDetails(android: _channel),
  );
}
