import 'package:flutter/material.dart';
import '../constants/app_motion.dart';

/// Reveal: مغلف ينتشر دخوله بسلاسة (fade + slide).
class Reveal extends StatefulWidget {
  const Reveal({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.offset = const Offset(0, 16),
    this.duration = const Duration(milliseconds: 520),
    this.curve = AppMotion.precise,
  });

  final Widget child;
  final Duration delay;
  final Offset offset;
  final Duration duration;
  final Curve curve;

  @override
  State<Reveal> createState() => _RevealState();
}

class _RevealState extends State<Reveal> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: widget.duration);

  @override
  void initState() {
    super.initState();
    Future.delayed(widget.delay, () {
      if (mounted) _c.forward();
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = CurvedAnimation(parent: _c, curve: widget.curve);
    return AnimatedBuilder(
      animation: t,
      builder: (context, child) {
        final v = t.value;
        return Opacity(
          opacity: v,
          child: Transform.translate(
            offset: Offset(
              widget.offset.dx * (1 - v),
              widget.offset.dy * (1 - v),
            ),
            child: child,
          ),
        );
      },
      child: widget.child,
    );
  }
}

/// RevealList: ينشر عناصر القائمة بتأخير متتالي.
class RevealList extends StatelessWidget {
  const RevealList({
    super.key,
    required this.children,
    this.stagger = AppMotion.staggerMd,
    this.startDelay = Duration.zero,
    this.offset = const Offset(0, 14),
  });

  final List<Widget> children;
  final Duration stagger;
  final Duration startDelay;
  final Offset offset;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (int i = 0; i < children.length; i++)
          Reveal(
            delay: startDelay + stagger * i,
            offset: offset,
            child: children[i],
          ),
      ],
    );
  }
}
