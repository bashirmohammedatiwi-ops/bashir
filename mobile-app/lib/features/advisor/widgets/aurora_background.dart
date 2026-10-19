import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/brand/brand_logo.dart';
import '../advisor_controller.dart';
import 'advisor_style.dart';

/// خلفية «شفق» هادئة: توهجات بألوان الهوية — تدرّجات شعاعية خفيفة (بلا مرشحات
/// ضبابية). تُرسم ثابتة أثناء القراءة، وتنساب فقط بينما «ديما» تفكر — وأبداً مع
/// «تقليل الحركة» — حتى تهدأ الشاشة ولا تُستنزف البطارية.
class AuroraBackground extends ConsumerStatefulWidget {
  final Widget child;
  const AuroraBackground({super.key, required this.child});

  @override
  ConsumerState<AuroraBackground> createState() => _AuroraBackgroundState();
}

class _AuroraBackgroundState extends ConsumerState<AuroraBackground> with SingleTickerProviderStateMixin {
  late final AnimationController _t = AnimationController(vsync: this, duration: const Duration(seconds: 18));

  bool _still = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _still = MediaQuery.disableAnimationsOf(context);
    _sync();
  }

  void _sync() {
    final run = ref.read(advisorProvider).thinking && !_still;
    if (run) {
      if (!_t.isAnimating) _t.repeat();
    } else {
      // تتوقف حيث هي — لا قفزة للوضع الأول.
      _t.stop();
    }
  }

  @override
  void dispose() {
    _t.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(advisorProvider.select((s) => s.thinking), (_, __) => _sync());
    return Stack(
      fit: StackFit.expand,
      children: [
        const ColoredBox(color: AdvisorStyle.bg),
        RepaintBoundary(
          child: AnimatedBuilder(
            animation: _t,
            builder: (_, __) => CustomPaint(painter: _AuroraPainter(_t.value)),
          ),
        ),
        widget.child,
      ],
    );
  }
}

class _AuroraPainter extends CustomPainter {
  final double t;
  _AuroraPainter(this.t);

  @override
  void paint(Canvas canvas, Size size) {
    final a = t * math.pi * 2;
    void blob(Offset center, double radius, Color color) {
      canvas.drawCircle(
        center,
        radius,
        Paint()
          ..shader = RadialGradient(
            colors: [color, color.withValues(alpha: 0)],
          ).createShader(Rect.fromCircle(center: center, radius: radius)),
      );
    }

    final w = size.width;
    final h = size.height;
    blob(
      Offset(w * (0.18 + 0.08 * math.sin(a)), h * (0.12 + 0.05 * math.cos(a))),
      w * 0.75,
      BrandColors.orchidLight.withValues(alpha: 0.22),
    );
    blob(
      Offset(w * (0.88 + 0.06 * math.cos(a * 1.3)), h * (0.30 + 0.06 * math.sin(a * 0.8))),
      w * 0.65,
      BrandColors.roseLight.withValues(alpha: 0.26),
    );
    blob(
      Offset(w * (0.40 + 0.10 * math.sin(a * 0.7 + 1)), h * (0.86 + 0.04 * math.cos(a))),
      w * 0.8,
      BrandColors.orchid.withValues(alpha: 0.10),
    );
  }

  @override
  bool shouldRepaint(_AuroraPainter old) => old.t != t;
}
