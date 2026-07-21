import 'package:flutter/material.dart';

/// يمرّر offset التمرير لأقسام الرئيسية (parallax + reveal).
class HomeScrollScope extends InheritedWidget {
  final double offset;

  const HomeScrollScope({
    super.key,
    required this.offset,
    required super.child,
  });

  static HomeScrollScope? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<HomeScrollScope>();

  static double offsetOf(BuildContext context) =>
      maybeOf(context)?.offset ?? 0;

  @override
  bool updateShouldNotify(HomeScrollScope old) => old.offset != offset;
}

/// ضغطة ناعمة — scale + haptic.
class HomeTapScale extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;

  const HomeTapScale({super.key, required this.child, this.onTap});

  @override
  State<HomeTapScale> createState() => _HomeTapScaleState();
}

class _HomeTapScaleState extends State<HomeTapScale> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onTap != null ? (_) => setState(() => _pressed = true) : null,
      onTapUp: widget.onTap != null ? (_) => setState(() => _pressed = false) : null,
      onTapCancel: widget.onTap != null ? () => setState(() => _pressed = false) : null,
      onTap: widget.onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedScale(
        scale: _pressed ? 0.96 : 1,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: widget.child,
      ),
    );
  }
}

/// طفو خفيف — للمنتجات PNG في البنر.
class HomeFloat extends StatefulWidget {
  final Widget child;
  final double amplitude;

  const HomeFloat({super.key, required this.child, this.amplitude = 8});

  @override
  State<HomeFloat> createState() => _HomeFloatState();
}

class _HomeFloatState extends State<HomeFloat> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _y;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2800),
    )..repeat(reverse: true);
    _y = Tween<double>(begin: 0, end: widget.amplitude).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _y,
      builder: (_, child) => Transform.translate(
        offset: Offset(0, -_y.value),
        child: child,
      ),
      child: widget.child,
    );
  }
}

/// ظهور تدريجي عند التحميل — scale + fade + slide.
class HomeSectionEntrance extends StatefulWidget {
  final int index;
  final Widget child;

  const HomeSectionEntrance({super.key, required this.index, required this.child});

  @override
  State<HomeSectionEntrance> createState() => _HomeSectionEntranceState();
}

class _HomeSectionEntranceState extends State<HomeSectionEntrance>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 460),
    );
    final curve = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic);
    _fade = curve;
    _slide = Tween<Offset>(begin: const Offset(0, 0.04), end: Offset.zero).animate(curve);

    final delay = Duration(milliseconds: 40 + widget.index.clamp(0, 6) * 35);
    Future<void>.delayed(delay, () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}

/// ظهور بطاقة أفقية — للمنتجات والفئات.
class HomeStaggerItem extends StatefulWidget {
  final int index;
  final Widget child;

  const HomeStaggerItem({super.key, required this.index, required this.child});

  @override
  State<HomeStaggerItem> createState() => _HomeStaggerItemState();
}

class _HomeStaggerItemState extends State<HomeStaggerItem>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 360));
    final curve = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _fade = curve;
    _slide = Tween<Offset>(begin: const Offset(0.06, 0), end: Offset.zero).animate(curve);
    Future<void>.delayed(Duration(milliseconds: widget.index.clamp(0, 8) * 45), () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}

/// parallax wrapper — يتحرك ببطء مع التمرير.
class HomeParallax extends StatelessWidget {
  final Widget child;
  final double factor;

  const HomeParallax({super.key, required this.child, this.factor = 0.18});

  @override
  Widget build(BuildContext context) {
    final offset = HomeScrollScope.offsetOf(context);
    return Transform.translate(
      offset: Offset(0, offset * factor),
      child: child,
    );
  }
}

/// Ken Burns خفيف على صور البنر.
class KenBurnsImage extends StatefulWidget {
  final Widget child;

  const KenBurnsImage({super.key, required this.child});

  @override
  State<KenBurnsImage> createState() => _KenBurnsImageState();
}

class _KenBurnsImageState extends State<KenBurnsImage> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 10))
      ..repeat(reverse: true);
    _scale = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(scale: _scale, child: widget.child);
  }
}

/// نبض خفيف للشارات.
class PulseBadge extends StatefulWidget {
  final Widget child;

  const PulseBadge({super.key, required this.child});

  @override
  State<PulseBadge> createState() => _PulseBadgeState();
}

class _PulseBadgeState extends State<PulseBadge> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500))
      ..repeat(reverse: true);
    _scale = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(scale: _scale, child: widget.child);
  }
}
