import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_motion.dart';

/// ظهور متتابع (fade + انزلاق خفيف للأعلى) — يعمل مرة واحدة عند أول بناء.
/// العناصر بعد [AppMotion.staggerMaxSteps] تظهر مباشرة (حماية أداء للقوائم الطويلة).
class StaggerEntrance extends StatefulWidget {
  final int index;
  final Duration? step;
  final Duration? duration;
  final Offset offset;
  final Widget child;

  const StaggerEntrance({
    super.key,
    required this.index,
    required this.child,
    this.step,
    this.duration,
    this.offset = const Offset(0, 14),
  });

  @override
  State<StaggerEntrance> createState() => _StaggerEntranceState();
}

class _StaggerEntranceState extends State<StaggerEntrance>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration ?? AppMotion.page,
    );
    if (widget.index >= AppMotion.staggerMaxSteps) {
      _controller.value = 1; // خارج نطاق التتابع — ظهور فوري.
    } else {
      final delay = widget.step == null
          ? AppMotion.staggerDelay(widget.index)
          : Duration(milliseconds: widget.step!.inMilliseconds * widget.index);
      _timer = Timer(delay, () {
        if (mounted) _controller.forward();
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = Curves.easeOutCubic.transform(_controller.value);
        return Opacity(
          opacity: t,
          child: Transform.translate(
            offset: Offset(
              widget.offset.dx * (1 - t),
              widget.offset.dy * (1 - t),
            ),
            child: child,
          ),
        );
      },
      child: widget.child,
    );
  }
}

/// عدّ رقم متحرك — للأجمالية والكميات (نقطة النقلة في تفاصيل السلة والدفع).
class AnimatedNumber extends StatelessWidget {
  final int value;
  final TextStyle? style;
  final Duration? duration;
  final String Function(int)? formatter;

  const AnimatedNumber({
    super.key,
    required this.value,
    this.style,
    this.duration,
    this.formatter,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<int>(
      tween: IntTween(begin: value, end: value),
      duration: duration ?? AppMotion.base,
      curve: AppMotion.ease,
      builder: (context, snapshot, _) {
        // نعرض القيمة الهدف فقط عند أول بناء ثم نتحرك للجديدة.
        return Text(
          formatter != null ? formatter!(snapshot) : '$snapshot',
          style: style,
        );
      },
    );
  }
}

/// نبضة لمرة واحدة عند تغيّر قيمة (للقلب/الشارات/الخطوة الحالية).
class PulseOnChange extends StatefulWidget {
  final Widget child;
  final Object trigger;
  final double from;

  const PulseOnChange({
    super.key,
    required this.child,
    required this.trigger,
    this.from = 1.12,
  });

  @override
  State<PulseOnChange> createState() => _PulseOnChangeState();
}

class _PulseOnChangeState extends State<PulseOnChange>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: AppMotion.base);
  }

  @override
  void didUpdateWidget(PulseOnChange oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.trigger != widget.trigger) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: Tween<double>(begin: widget.from, end: 1).animate(
        CurvedAnimation(parent: _controller, curve: AppMotion.springSoft),
      ),
      child: widget.child,
    );
  }
}

/// اهتزاز أفقي عند الخطأ (الكوبون، حقول غير صالحة).
class ShakeOnError extends StatefulWidget {
  final Widget child;
  final Object trigger;

  const ShakeOnError({super.key, required this.child, required this.trigger});

  @override
  State<ShakeOnError> createState() => _ShakeOnErrorState();
}

class _ShakeOnErrorState extends State<ShakeOnError>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 380));
  }

  @override
  void didUpdateWidget(ShakeOnError oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.trigger != widget.trigger) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = _controller.value;
        // موجة جيبية تخفت — 3 اهتزات.
        final dx = math.sin(t * 3 * math.pi) * 6 * (1 - t);
        return Transform.translate(offset: Offset(dx, 0), child: child!);
      },
      child: widget.child,
    );
  }
}
