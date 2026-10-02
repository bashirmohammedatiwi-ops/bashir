import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// انفجار احتفالي خفيف — فراشات ونقاط بألوان الهوية تتطاير لمرة واحدة
/// عند البناء (لحظة نجاح الطلب). CustomPainter بدون أي حزم خارجية.
class SuccessBurst extends StatefulWidget {
  final Widget child;
  final int particleCount;

  const SuccessBurst({
    super.key,
    required this.child,
    this.particleCount = 22,
  });

  @override
  State<SuccessBurst> createState() => _SuccessBurstState();
}

class _SuccessBurstState extends State<SuccessBurst>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final List<_Particle> _particles;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    final rand = math.Random(7);
    const palette = [AppColors.primary, AppColors.accent, AppColors.rose, AppColors.success];
    _particles = List.generate(widget.particleCount, (i) {
      final angle = (2 * math.pi * i) / widget.particleCount + rand.nextDouble() * 0.5;
      return _Particle(
        angle: angle,
        distance: 70 + rand.nextDouble() * 110,
        size: 5 + rand.nextDouble() * 5,
        spin: rand.nextDouble() * math.pi,
        color: palette[i % palette.length],
        butterfly: i.isEven,
      );
    });
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      foregroundPainter: _BurstPainter(controller: _controller, particles: _particles),
      child: widget.child,
    );
  }
}

class _Particle {
  final double angle;
  final double distance;
  final double size;
  final double spin;
  final Color color;
  final bool butterfly;

  const _Particle({
    required this.angle,
    required this.distance,
    required this.size,
    required this.spin,
    required this.color,
    required this.butterfly,
  });
}

class _BurstPainter extends CustomPainter {
  final Animation<double> controller;
  final List<_Particle> particles;

  _BurstPainter({required this.controller, required this.particles})
      : super(repaint: controller);

  @override
  void paint(Canvas canvas, Size size) {
    final t = Curves.easeOutCubic.transform(controller.value);
    final fade = (1 - controller.value).clamp(0.0, 1.0);
    final center = Offset(size.width / 2, size.height / 2);

    for (final p in particles) {
      final progress = Curves.easeOut.transform(t);
      final dx = math.cos(p.angle) * p.distance * progress;
      final dy = math.sin(p.angle) * p.distance * progress + 30 * progress * progress; // جاذبية خفيفة.
      final offset = center + Offset(dx, dy);
      final paint = Paint()..color = p.color.withValues(alpha: fade);

      if (p.butterfly) {
        _drawButterfly(canvas, offset, p.size * (0.6 + 0.4 * fade), p.spin + t * 1.2, paint, fade);
      } else {
        canvas.drawCircle(offset, p.size * 0.5 * fade + 1, paint);
      }
    }
  }

  /// فراشة صغيرة من جناحين بيضاويين — إيماءة لشعار المتجر.
  void _drawButterfly(Canvas canvas, Offset center, double size, double rotation, Paint paint, double fade) {
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(rotation);
    final wing = size * 0.9;
    final body = Paint()
      ..color = AppColors.ink.withValues(alpha: (fade * 0.5).clamp(0.0, 1.0))
      ..strokeWidth = 1.2
      ..style = PaintingStyle.stroke;
    canvas.drawOval(Rect.fromCenter(center: Offset(-wing * 0.5, -wing * 0.3), width: wing, height: wing * 1.2), paint);
    canvas.drawOval(Rect.fromCenter(center: Offset(wing * 0.5, -wing * 0.3), width: wing, height: wing * 1.2), paint);
    canvas.drawOval(Rect.fromCenter(center: Offset(-wing * 0.4, wing * 0.55), width: wing * 0.7, height: wing * 0.9), paint);
    canvas.drawOval(Rect.fromCenter(center: Offset(wing * 0.4, wing * 0.55), width: wing * 0.7, height: wing * 0.9), paint);
    canvas.drawLine(Offset(0, -wing * 0.6), Offset(0, wing * 0.9), body);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _BurstPainter oldDelegate) =>
      oldDelegate.controller != controller || oldDelegate.particles != particles;
}
