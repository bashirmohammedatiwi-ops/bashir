import 'package:flutter/material.dart';

/// موجة ناعمة تدمج مشهد البنر مع جسم الصفحة — مثل المرجع.
class HomeWaveClipper extends CustomClipper<Path> {
  final double waveDepth;

  const HomeWaveClipper({this.waveDepth = 36});

  @override
  Path getClip(Size size) {
    final h = size.height;
    final w = size.width;
    final d = waveDepth;

    return Path()
      ..moveTo(0, 0)
      ..lineTo(w, 0)
      ..lineTo(w, h - d)
      ..cubicTo(w * 0.78, h + d * 0.15, w * 0.22, h - d * 1.35, 0, h - d * 0.55)
      ..close();
  }

  @override
  bool shouldReclip(covariant HomeWaveClipper old) => old.waveDepth != waveDepth;
}
