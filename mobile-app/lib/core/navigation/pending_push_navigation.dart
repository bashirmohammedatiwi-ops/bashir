import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'app_navigation.dart';
import 'notification_navigation.dart';

/// يخزّن وجهة إشعار Push حتى يصبح الـ router جاهزاً (بعد الـ splash).
class PendingPushNavigation {
  PendingPushNavigation._();

  static Map<String, dynamic>? _pending;
  static Timer? _retryTimer;
  static int _attempts = 0;

  static void queue(Map<String, dynamic> data) {
    if (data.isEmpty) return;
    _pending = Map<String, dynamic>.from(data);
    _attempts = 0;
    _scheduleFlush();
  }

  static void flush() {
    final data = _pending;
    if (data == null) return;

    final ctx = rootNavigatorKey.currentContext;
    if (ctx == null || !ctx.mounted) {
      _scheduleFlush();
      return;
    }

    // تأكد أن GoRouter مربوط بهذا السياق (ليس شاشة الـ splash المنفصلة).
    try {
      GoRouter.of(ctx);
    } catch (_) {
      _scheduleFlush();
      return;
    }

    _pending = null;
    _retryTimer?.cancel();
    _retryTimer = null;
    _attempts = 0;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final c = rootNavigatorKey.currentContext;
      if (c == null || !c.mounted) {
        queue(data);
        return;
      }
      openPushPayload(c, data);
    });
  }

  static void _scheduleFlush() {
    _retryTimer?.cancel();
    if (_attempts >= 40) {
      debugPrint('[PendingPushNavigation] gave up flushing pending notification');
      return;
    }
    _attempts += 1;
    _retryTimer = Timer(Duration(milliseconds: 250 + (_attempts * 50)), flush);
  }
}
