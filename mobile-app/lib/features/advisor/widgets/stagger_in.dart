import 'package:flutter/material.dart';

/// ظهور متتابع: تلاشٍ وانزلاق خفيف بالبكسل (لا يتأثر بطول العنصر).
/// التخطيط ثابت من أول إطار، فالتمرير إلى العنصر دقيق أثناء الحركة.
class StaggerIn extends StatefulWidget {
  final Widget child;
  final int index;
  final bool animate;
  final Duration step;
  final Duration duration;
  final Offset from;
  final double fromScale;
  /// تأخير صريح يحل محل «الترتيب × الخطوة».
  final Duration? delay;

  const StaggerIn({
    super.key,
    required this.child,
    this.index = 0,
    this.animate = true,
    this.step = const Duration(milliseconds: 110),
    this.duration = const Duration(milliseconds: 520),
    this.from = const Offset(0, 14),
    this.fromScale = 1,
    this.delay,
  });

  @override
  State<StaggerIn> createState() => _StaggerInState();
}

class _StaggerInState extends State<StaggerIn> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: widget.duration);
  late final Animation<double> _t = CurvedAnimation(parent: _c, curve: Curves.easeOutCubic);
  // يُقرأ مرة واحدة: إن تغيّر لاحقاً لا تُقطع الحركة الجارية.
  late final bool _animate = widget.animate;

  @override
  void initState() {
    super.initState();
    if (!_animate) {
      _c.value = 1;
    } else {
      final d = widget.delay ?? widget.step * widget.index;
      if (d == Duration.zero) {
        _c.forward();
      } else {
        Future<void>.delayed(d, () {
          if (mounted) _c.forward();
        });
      }
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_animate) return widget.child;
    return AnimatedBuilder(
      animation: _t,
      child: widget.child,
      builder: (_, child) {
        // البنية ثابتة طوال الحركة وبعدها — حتى لا تُعاد تهيئة حالة الابن.
        final v = _t.value;
        final scale = widget.fromScale + (1 - widget.fromScale) * v;
        return Opacity(
          opacity: v.clamp(0.0, 1.0),
          child: Transform.translate(
            offset: widget.from * (1 - v),
            child: Transform.scale(scale: scale, child: child),
          ),
        );
      },
    );
  }
}
