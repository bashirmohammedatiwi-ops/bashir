import 'package:flutter/material.dart';

import '../utils/responsive.dart';

/// غلاف عام يطبّق قيود التكيّف على كل الشاشات.
///
/// يحدّ تكبير الخط بـ [Responsive.maxTextScale]، ويحفظ قيمة النظام الأصلية
/// ليرفع السقفَ [LargeTextScope] للشاشات النصية التي تحتمل خطاً أكبر.
class ResponsiveApp extends StatelessWidget {
  final Widget child;

  const ResponsiveApp({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    return _SystemTextScale(
      scaler: mq.textScaler,
      child: MediaQuery(
        data: mq.copyWith(
          textScaler: Responsive.clampTextScaler(context),
        ),
        child: child,
      ),
    );
  }
}

/// يرفع سقف تكبير الخط لشاشة نصية واحدة (الدفع، تفاصيل الطلب، الوثائق، وصف
/// المنتج، الإشعارات) حتى [maxScaleFactor]، فيقرأ من يحتاج الخط الكبير الأسعار
/// والمجاميع بالحجم الذي اختاره في النظام. خارج [ResponsiveApp] لا يغيّر شيئاً.
class LargeTextScope extends StatelessWidget {
  final double maxScaleFactor;
  final Widget child;

  const LargeTextScope({
    super.key,
    this.maxScaleFactor = 1.6,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final system = context
        .dependOnInheritedWidgetOfExactType<_SystemTextScale>()
        ?.scaler;
    if (system == null) return child;
    return MediaQuery(
      data: MediaQuery.of(context).copyWith(
        textScaler: system.clamp(
          minScaleFactor: Responsive.minTextScale,
          maxScaleFactor: maxScaleFactor < Responsive.maxTextScale
              ? Responsive.maxTextScale
              : maxScaleFactor,
        ),
      ),
      child: child,
    );
  }
}

/// تكبير الخط كما ضبطه النظام قبل أي حدّ.
class _SystemTextScale extends InheritedWidget {
  final TextScaler scaler;

  const _SystemTextScale({required this.scaler, required super.child});

  @override
  bool updateShouldNotify(_SystemTextScale oldWidget) =>
      oldWidget.scaler != scaler;
}
