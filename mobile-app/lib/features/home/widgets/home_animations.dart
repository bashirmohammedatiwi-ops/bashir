import 'package:flutter/material.dart';

/// ضغطة ناعمة — scale خفيف عند اللمس فقط (بدون controller دائم).
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
      onTapDown: widget.onTap != null
          ? (_) => setState(() => _pressed = true)
          : null,
      onTapUp: widget.onTap != null
          ? (_) => setState(() => _pressed = false)
          : null,
      onTapCancel: widget.onTap != null
          ? () => setState(() => _pressed = false)
          : null,
      onTap: widget.onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOutCubic,
        child: widget.child,
      ),
    );
  }
}

/// عزل رسم للعناصر الأفقية — بدون animation controllers.
class HomeStaggerItem extends StatelessWidget {
  final int index;
  final Widget child;

  const HomeStaggerItem({super.key, required this.index, required this.child});

  @override
  Widget build(BuildContext context) => RepaintBoundary(child: child);
}

/// غلاف قسم — يمرّر المحتوى مباشرة (بدون fade/slide على التمرير).
class HomeSectionEntrance extends StatelessWidget {
  final int index;
  final Widget child;

  const HomeSectionEntrance({
    super.key,
    required this.index,
    required this.child,
  });

  @override
  Widget build(BuildContext context) => child;
}

/// نبض خفيف للشارات — يتوقف تلقائياً عند تعطيل TickerMode.
class PulseBadge extends StatefulWidget {
  final Widget child;

  const PulseBadge({super.key, required this.child});

  @override
  State<PulseBadge> createState() => _PulseBadgeState();
}

class _PulseBadgeState extends State<PulseBadge>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _scale = Tween<double>(
      begin: 1.0,
      end: 1.04,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
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

/// ظهور هادئ لقسم أول مرة يدخل الشاشة: يتلاشى للداخل ويصعد قليلاً.
/// يُعرض مرة واحدة لكل [id] — العودة بالتمرير لا تعيد الحركة.
class HomeReveal extends StatefulWidget {
  final String id;
  final Widget child;

  const HomeReveal({super.key, required this.id, required this.child});

  static final Set<String> _shown = <String>{};

  @override
  State<HomeReveal> createState() => _HomeRevealState();
}

class _HomeRevealState extends State<HomeReveal> {
  late final bool _animate = HomeReveal._shown.add(widget.id);

  @override
  Widget build(BuildContext context) {
    if (!_animate || MediaQuery.disableAnimationsOf(context)) {
      return widget.child;
    }
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 560),
      curve: Curves.easeOutCubic,
      child: widget.child,
      builder: (_, v, child) => Opacity(
        opacity: v,
        child: Transform.translate(
          offset: Offset(0, 26 * (1 - v)),
          child: child,
        ),
      ),
    );
  }
}
