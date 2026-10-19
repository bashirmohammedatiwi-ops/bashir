import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/brand/brand_logo.dart';

/// كرة «ديما»: كرة بتدرّج الهوية، حلقة هالة، وتنفّس هادئ.
///
/// هادئة افتراضياً حتى لا تُرسم إطارات بلا داعٍ: الحلقة تدور فقط أثناء التفكير
/// (وتدور حولها نجيمات)، والتنفّس للكرات الكبيرة فقط (40 فأكثر). مع «تقليل الحركة»
/// تُرسم ثابتة تماماً.
class AdvisorOrb extends StatefulWidget {
  final double size;
  final bool thinking;

  /// عدد الأنفاس ثم تستقر الكرة — null = تنفّس متواصل (كرات شاشة «ديما» نفسها).
  /// زر الإطلاق على الرئيسية يتنفّس قليلاً ثم يهدأ، فلا تُرسم إطارات طوال الجلسة.
  final int? breaths;

  const AdvisorOrb({super.key, this.size = 44, this.thinking = false, this.breaths});

  @override
  State<AdvisorOrb> createState() => _AdvisorOrbState();
}

class _AdvisorOrbState extends State<AdvisorOrb> with TickerProviderStateMixin {
  late final AnimationController _spin = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600));
  late final AnimationController _breath = AnimationController(vsync: this, duration: const Duration(milliseconds: 2600), value: 0.5);
  bool _still = false;

  /// انتهت الأنفاس المحدودة — لا تبدأ من جديد مع كل تغيّر في الاعتماديات.
  bool _breathDone = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _still = MediaQuery.disableAnimationsOf(context);
    _sync();
  }

  @override
  void didUpdateWidget(covariant AdvisorOrb old) {
    super.didUpdateWidget(old);
    if (old.thinking != widget.thinking || old.size != widget.size) _sync();
  }

  /// تشغيل/إيقاف الحركتين حسب الحالة — بلا تكرار دائم.
  void _sync() {
    if (widget.thinking && !_still) {
      if (!_spin.isAnimating) _spin.repeat();
    } else {
      _spin.stop();
    }
    final breaths = widget.breaths;
    if (widget.size >= 40 && !_still && !_breathDone) {
      if (_breath.isAnimating) return;
      if (breaths == null) {
        _breath.repeat(reverse: true);
      } else {
        // كل نفَس = شهيق وزفير، ثم تستقر في المنتصف.
        _breath.repeat(reverse: true, count: breaths * 2).whenCompleteOrCancel(() {
          if (!mounted || _breath.isAnimating) return;
          _breathDone = true;
          if (_breath.value != 0.5) _breath.animateTo(0.5, duration: const Duration(milliseconds: 700));
        });
      }
    } else if (!_breathDone || _still) {
      _breath.stop();
      _breath.value = 0.5;
    }
  }

  @override
  void dispose() {
    _spin.dispose();
    _breath.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: Listenable.merge([_spin, _breath]),
        builder: (_, __) {
          final breath = Curves.easeInOut.transform(_breath.value);
          return SizedBox.square(
            dimension: widget.size,
            child: CustomPaint(
              painter: _OrbPainter(spin: _spin.value, breath: breath, thinking: widget.thinking),
              child: Center(
                child: Transform.scale(
                  scale: 0.94 + breath * 0.06,
                  child: BrandMark(height: widget.size * 0.38, color: Colors.white),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _OrbPainter extends CustomPainter {
  final double spin;
  final double breath;
  final bool thinking;
  _OrbPainter({required this.spin, required this.breath, required this.thinking});

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final r = size.width / 2;

    // هالة ناعمة خارجية
    final glowR = r * (1.0 + 0.08 * breath + (thinking ? 0.08 : 0));
    canvas.drawCircle(
      c,
      glowR,
      Paint()
        ..shader = RadialGradient(
          colors: [
            BrandColors.rose.withValues(alpha: thinking ? 0.32 : 0.22),
            BrandColors.orchid.withValues(alpha: 0),
          ],
        ).createShader(Rect.fromCircle(center: c, radius: glowR)),
    );

    // الكرة: تدرّج دائري يدور
    final body = r * 0.82;
    final rect = Rect.fromCircle(center: c, radius: body);
    canvas.drawCircle(
      c,
      body,
      Paint()
        ..shader = SweepGradient(
          colors: const [BrandColors.orchidLight, BrandColors.orchid, BrandColors.rose, BrandColors.roseLight, BrandColors.orchidLight],
          transform: GradientRotation(spin * math.pi * 2),
        ).createShader(rect),
    );
    // لمعة زجاجية في الأعلى
    canvas.drawCircle(
      c.translate(-body * 0.25, -body * 0.32),
      body * 0.55,
      Paint()
        ..shader = RadialGradient(
          colors: [Colors.white.withValues(alpha: 0.55), Colors.white.withValues(alpha: 0)],
        ).createShader(Rect.fromCircle(center: c.translate(-body * 0.25, -body * 0.32), radius: body * 0.55)),
    );

    // حلقة الهالة: قوس متدرّج يدور
    final ringR = r * 0.95;
    final ringRect = Rect.fromCircle(center: c, radius: ringR);
    final start = -spin * math.pi * 2;
    final sweep = math.pi * (thinking ? 1.2 : 0.7);
    final frac = sweep / (math.pi * 2);
    canvas.drawArc(
      ringRect,
      start,
      sweep,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeWidth = math.max(1.4, r * 0.06)
        ..shader = SweepGradient(
          colors: [Colors.white.withValues(alpha: 0), BrandColors.rose, BrandColors.orchid],
          stops: [0, frac * 0.6, frac],
          transform: GradientRotation(start),
        ).createShader(ringRect),
    );

    // نجيمات تدور أثناء التفكير
    if (thinking) {
      for (var i = 0; i < 3; i++) {
        final a = spin * math.pi * 2 * 1.6 + i * (math.pi * 2 / 3);
        final p = c + Offset(math.cos(a), math.sin(a)) * (r * 1.02);
        canvas.drawCircle(p, math.max(1.2, r * 0.07), Paint()..color = BrandColors.rose.withValues(alpha: 0.85 - i * 0.2));
      }
    }
  }

  @override
  bool shouldRepaint(_OrbPainter old) => old.spin != spin || old.breath != breath || old.thinking != thinking;
}
