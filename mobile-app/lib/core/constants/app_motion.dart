import 'package:flutter/animation.dart';

/// نظام حركات موحد للتطبيق — Premium Motion System.
///
/// المنهج: حركات قصيرة وأنيقة، تعتمد على Curves رفيعة (easeOutCubic) لمستوى Aesop/Chanel.
abstract final class AppMotion {
  // Durations
  static const Duration micro = Duration(milliseconds: 120);
  static const Duration fast = Duration(milliseconds: 220);
  static const Duration medium = Duration(milliseconds: 380);
  static const Duration slow = Duration(milliseconds: 620);
  static const Duration cinematic = Duration(milliseconds: 1100);

  // Curves
  static const Curve standard = Curves.easeOutCubic;
  static const Curve gentle = Curves.easeInOutCubic;
  static const Curve elastic = Curves.easeOutBack;
  static const Curve bounce = Curves.easeOutBack;
  static const Curve precise = Curves.easeOutQuint;

  // Stagger delays
  static const Duration staggerSm = Duration(milliseconds: 40);
  static const Duration staggerMd = Duration(milliseconds: 70);
  static const Duration staggerLg = Duration(milliseconds: 110);
}
