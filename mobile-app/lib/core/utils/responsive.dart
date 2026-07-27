import 'dart:math' as math;

import 'package:flutter/material.dart';

/// أحجام الشاشة الشائعة في الهواتف والأجهزة اللوحية الصغيرة.
enum ScreenTier {
  /// عرض < 340 (هواتف صغيرة جداً)
  compact,

  /// 340–399
  medium,

  /// 400–599 (معظم الهواتف)
  regular,

  /// ≥ 600 (أجهزة لوحية / شاشات عريضة)
  expanded,
}

/// أدوات التكيّف مع أحجام الشاشات المختلفة.
abstract final class Responsive {
  static ScreenTier tierOf(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w < 340) return ScreenTier.compact;
    if (w < 400) return ScreenTier.medium;
    if (w < 600) return ScreenTier.regular;
    return ScreenTier.expanded;
  }

  static bool isCompact(BuildContext context) => tierOf(context) == ScreenTier.compact;

  static bool isExpanded(BuildContext context) => tierOf(context) == ScreenTier.expanded;

  /// يمنع كسر التخطيط عند تكبير الخط في إعدادات النظام.
  static TextScaler clampTextScaler(BuildContext context) {
    return MediaQuery.textScalerOf(context).clamp(
      minScaleFactor: 0.85,
      maxScaleFactor: 1.25,
    );
  }

  static double horizontalPadding(BuildContext context) {
    return switch (tierOf(context)) {
      ScreenTier.compact => 12,
      ScreenTier.medium => 14,
      ScreenTier.regular => 16,
      ScreenTier.expanded => 20,
    };
  }

  static int gridColumns(BuildContext context) => isExpanded(context) ? 3 : 2;

  static double gridChildAspectRatio(BuildContext context, {bool listing = false}) {
    if (listing) {
      return switch (tierOf(context)) {
        ScreenTier.compact => 0.52,
        ScreenTier.medium => 0.53,
        _ => 0.54,
      };
    }
    return switch (tierOf(context)) {
      ScreenTier.compact => 0.58,
      ScreenTier.medium => 0.60,
      ScreenTier.regular => 0.62,
      ScreenTier.expanded => 0.64,
    };
  }

  static double gridSpacing(BuildContext context) {
    return switch (tierOf(context)) {
      ScreenTier.compact => 10,
      _ => 12,
    };
  }

  static double productCardWidth(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w < 340) return 136;
    if (w < 380) return 148;
    if (w >= 600) return 172;
    return 158;
  }

  static double productCardHeight(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w < 340) return 248;
    if (w >= 600) return 280;
    return 268;
  }

  static double cartItemImageSize(BuildContext context) {
    return switch (tierOf(context)) {
      ScreenTier.compact => 76,
      ScreenTier.medium => 82,
      _ => 88,
    };
  }

  static double bottomNavHeight(BuildContext context) {
    return isCompact(context) ? 60 : 64;
  }

  /// ارتفاع منطقة أزرار/إيماءات النظام السفلية.
  static double systemBottomInset(BuildContext context) {
    final mq = MediaQuery.of(context);
    final inset = math.max(mq.viewPadding.bottom, mq.padding.bottom);
    if (inset > 0) return inset;

    // edge-to-edge على أندرويد: بعض الأجهزة بأزرار ثلاثية لا تبلّغ inset
    if (Theme.of(context).platform == TargetPlatform.android) return 48;

    return 0;
  }

  /// هامش بصري صغير بين الشريط ومنطقة النظام.
  static const double shellNavVisualGap = 6;

  /// ارتفاع منطقة الشريط السفلي كاملة (شريط + هامش + أزرار النظام).
  static double shellNavDockHeight(BuildContext context) {
    return bottomNavHeight(context) + shellNavVisualGap + systemBottomInset(context);
  }

  static double navLabelSize(BuildContext context, {required bool active}) {
    if (isCompact(context)) return active ? 9 : 8;
    return active ? 10 : 9;
  }

  /// حشوة أسفل المحتوى القابل للتمرير داخل الـ shell.
  /// الشريط خارج الـ body — لا نحجز ارتفاعه مرتين.
  static double shellBottomReserve(BuildContext context, {double base = 68}) {
    return 20;
  }
}

extension ResponsiveContext on BuildContext {
  ScreenTier get screenTier => Responsive.tierOf(this);
  bool get isCompactScreen => Responsive.isCompact(this);
}
