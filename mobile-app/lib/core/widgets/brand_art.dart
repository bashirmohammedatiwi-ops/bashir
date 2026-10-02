import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// فراشة الهوية — رسم خطي خفيف بجناحين، يستخدم في الحالات الفارغة والسبلاش.
class ButterflyArt extends StatelessWidget {
  final double size;
  final Color color;
  final double strokeWidth;

  const ButterflyArt({
    super.key,
    this.size = 120,
    this.color = AppColors.primary,
    this.strokeWidth = 2.2,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size.square(size),
      painter: _ButterflyPainter(color: color, strokeWidth: strokeWidth),
    );
  }
}

class _ButterflyPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;

  _ButterflyPainter({required this.color, required this.strokeWidth});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final c = Offset(size.width / 2, size.height / 2);
    final w = size.width * 0.36;
    final h = size.height * 0.30;

    // الجناحان العلويان.
    final upper = Path()
      ..moveTo(c.dx, c.dy - size.height * 0.02)
      ..cubicTo(
        c.dx - w * 1.15, c.dy - h * 1.55,
        c.dx - w * 1.05, c.dy + h * 0.1,
        c.dx - w * 0.18, c.dy + h * 0.16,
      );
    canvas.drawPath(upper, paint);
    final upperMirrored = Path()
      ..moveTo(c.dx, c.dy - size.height * 0.02)
      ..cubicTo(
        c.dx + w * 1.15, c.dy - h * 1.55,
        c.dx + w * 1.05, c.dy + h * 0.1,
        c.dx + w * 0.18, c.dy + h * 0.16,
      );
    canvas.drawPath(upperMirrored, paint);

    // الجناحان السفليان الأصغر.
    final lower = Path()
      ..moveTo(c.dx - w * 0.08, c.dy + h * 0.2)
      ..cubicTo(
        c.dx - w * 0.85, c.dy + h * 0.55,
        c.dx - w * 0.62, c.dy + h * 1.5,
        c.dx - w * 0.05, c.dy + h * 1.05,
      );
    canvas.drawPath(lower, paint);
    final lowerMirrored = Path()
      ..moveTo(c.dx + w * 0.08, c.dy + h * 0.2)
      ..cubicTo(
        c.dx + w * 0.85, c.dy + h * 0.55,
        c.dx + w * 0.62, c.dy + h * 1.5,
        c.dx + w * 0.05, c.dy + h * 1.05,
      );
    canvas.drawPath(lowerMirrored, paint);

    // الجسم والقرون.
    canvas.drawLine(
      Offset(c.dx, c.dy - size.height * 0.05),
      Offset(c.dx, c.dy + size.height * 0.16),
      paint,
    );
    canvas.drawLine(c, Offset(c.dx - w * 0.16, c.dy - h * 0.95), paint);
    canvas.drawLine(c, Offset(c.dx + w * 0.16, c.dy - h * 0.95), paint);
  }

  @override
  bool shouldRepaint(covariant _ButterflyPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.strokeWidth != strokeWidth;
}

/// خلفية محيطية متحركة — بقع ضوء ناعمة تنساب ببطء شديد خلف محتوى الشاشة.
/// عدّاد واحد منخفض التكلفة + RepaintBoundary، ويكتم تلقائياً عبر TickerMode.
class AmbientBackground extends StatefulWidget {
  final Widget child;
  final Color baseColor;

  const AmbientBackground({
    super.key,
    required this.child,
    this.baseColor = AppColors.scaffold,
  });

  @override
  State<AmbientBackground> createState() => _AmbientBackgroundState();
}

class _AmbientBackgroundState extends State<AmbientBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 16000),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: CustomPaint(
        foregroundPainter: _AmbientPainter(animation: _controller),
        child: widget.child,
      ),
    );
  }
}

class _AmbientPainter extends CustomPainter {
  final Animation<double> animation;

  _AmbientPainter({required this.animation}) : super(repaint: animation);

  @override
  void paint(Canvas canvas, Size size) {
    final t = animation.value * 2 * math.pi;
    final blob = (Offset center, double radius, Color color) => Paint()
          ..shader = RadialGradient(
            colors: [color, color.withValues(alpha: 0)],
          ).createShader(
            Rect.fromCircle(center: center, radius: radius),
          );

    // ثلاث بقع ضوء بألوان الهوية تنساب بدورات مختلفة.
    final spots = [
      (
        center: Offset(
          size.width * (0.22 + 0.05 * math.sin(t)),
          size.height * (0.12 + 0.04 * math.cos(t * 0.8)),
        ),
        radius: size.width * 0.55,
        color: AppColors.primaryLight,
      ),
      (
        center: Offset(
          size.width * (0.85 + 0.04 * math.cos(t * 0.6)),
          size.height * (0.30 + 0.05 * math.sin(t * 0.9)),
        ),
        radius: size.width * 0.5,
        color: const Color(0xFFF3EEE6), // لمسة ذهبية شاحبة
      ),
      (
        center: Offset(
          size.width * (0.5 + 0.06 * math.sin(t * 0.7)),
          size.height * (0.62 + 0.04 * math.cos(t)),
        ),
        radius: size.width * 0.6,
        color: const Color(0xFFEFF6F4),
      ),
    ];
    for (final spot in spots) {
      canvas.drawCircle(spot.center, spot.radius, blob(spot.center, spot.radius, spot.color));
    }
  }

  @override
  bool shouldRepaint(covariant _AmbientPainter oldDelegate) => true;
}

/// فاصل موجي زخرفي بين أقسام الصفحة — موجة واحدة بمنحنى ناعم.
class WaveDivider extends StatelessWidget {
  final Color color;
  final bool flip;
  final double height;

  const WaveDivider({
    super.key,
    this.color = AppColors.divider,
    this.flip = false,
    this.height = 10,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(double.infinity, height),
      painter: _WavePainter(color: color, flip: flip),
    );
  }
}

class _WavePainter extends CustomPainter {
  final Color color;
  final bool flip;

  _WavePainter({required this.color, required this.flip});

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(0, flip ? 0 : size.height)
      ..quadraticBezierTo(
        size.width * 0.28,
        flip ? size.height * 1.1 : size.height * 0.05,
        size.width * 0.55,
        flip ? size.height * 0.45 : size.height * 0.62,
      )
      ..quadraticBezierTo(
        size.width * 0.8,
        flip ? size.height * 0.05 : size.height,
        size.width,
        flip ? size.height * 0.5 : size.height * 0.35,
      );
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _WavePainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.flip != flip;
}
