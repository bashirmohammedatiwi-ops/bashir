import 'package:flutter/animation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// نظام حركة التطبيق — مدد ومنحنيات موحدة بدل القيم العشوائية.
/// كل حركة جديدة يجب أن تقرأ من هنا.
abstract final class AppMotion {
  // المدد
  static const Duration instant = Duration(milliseconds: 90);
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration base = Duration(milliseconds: 220);
  static const Duration slow = Duration(milliseconds: 320);
  static const Duration page = Duration(milliseconds: 260);

  // تتابع الدخول (stagger)
  static const Duration staggerStep = Duration(milliseconds: 45);
  static const int staggerMaxSteps = 8;

  // المنحنيات
  static const Curve ease = Curves.easeOutCubic;
  static const Curve emphasized = Curves.easeOutQuart;
  static const Curve enter = Curves.easeOutCubic;
  static const Curve exit = Curves.easeInCubic;
  static const Curve spring = Curves.easeOutBack;
  static const Curve springSoft = Cubic(0.34, 1.2, 0.64, 1);

  /// فاصل التتابع للعنصر رقم [index] (محدود حتى لا تطول القوائم الطويلة).
  static Duration staggerDelay(int index) =>
      Duration(milliseconds: 45 * index.clamp(0, staggerMaxSteps));

  /// منحنى ومُدة تبديل الحالة (fade-through بين تبويبات/نتائج).
  static const Duration fadeThrough = Duration(milliseconds: 180);
}

/// انتقال صفحات بهوية التطبيق — fade-through مع محور Z مشترك
/// (صفحة جديدة تظهر مقتربة، القديمة تبتعد) — أنعم من الانزلاق الافتراضي.
CustomTransitionPage<T> appPage<T>({
  required Widget child,
  Object? arguments,
  bool fullscreenDialog = false,
}) {
  return CustomTransitionPage<T>(
    child: child,
    arguments: arguments,
    fullscreenDialog: fullscreenDialog,
    transitionDuration: AppMotion.page,
    reverseTransitionDuration: AppMotion.fadeThrough,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(parent: animation, curve: AppMotion.emphasized);
      return FadeTransition(
        opacity: Tween(begin: 0.0, end: 1.0).animate(curved),
        child: ScaleTransition(
          scale: Tween(begin: 0.98, end: 1.0).animate(curved),
          child: child,
        ),
      );
    },
  );
}
