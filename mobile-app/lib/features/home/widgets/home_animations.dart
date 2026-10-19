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

/// ظهور هادئ لقسم أول مرة يدخل الشاشة فعلاً: يتلاشى للداخل ويصعد قليلاً.
///
/// الأقسام تُبنى قبل ظهورها (cacheExtent)، فالحركة لا تبدأ مع البناء بل حين يصل أعلى
/// القسم إلى ما تحت حافة الشاشة بـ [_lead] — بمتابعة التمرير ما دام لم يظهر بعد.
/// تُعرض مرة واحدة لكل [id]؛ العودة بالتمرير لا تعيدها، وتقليل الحركة يلغيها.
class HomeReveal extends StatefulWidget {
  final String id;
  final Widget child;

  const HomeReveal({super.key, required this.id, required this.child});

  static final Set<String> _shown = <String>{};

  /// كم بكسل تحت حافة الشاشة تبدأ الحركة — تكتمل والقسم يدخل.
  static const double _lead = 80;

  @override
  State<HomeReveal> createState() => _HomeRevealState();
}

class _HomeRevealState extends State<HomeReveal>
    with SingleTickerProviderStateMixin {
  AnimationController? _ctrl;
  Animation<Offset>? _slide;
  ScrollableState? _scrollable;
  ScrollPosition? _position;

  bool get _pending =>
      _ctrl != null && !_ctrl!.isAnimating && _ctrl!.value == 0;

  @override
  void initState() {
    super.initState();
    if (HomeReveal._shown.contains(widget.id)) return;
    final ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 560),
    );
    _ctrl = ctrl;
    _slide = Tween<Offset>(
      begin: const Offset(0, 0.06),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: ctrl, curve: Curves.easeOutCubic));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_ctrl == null) return;
    if (MediaQuery.disableAnimationsOf(context)) {
      _finish();
      return;
    }
    _scrollable = Scrollable.maybeOf(context);
    final position = _scrollable?.position;
    if (position != _position) {
      _position?.removeListener(_check);
      _position = position;
      _position?.addListener(_check);
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _check());
  }

  /// يبدأ الحركة إن صار أعلى القسم ضمن الشاشة (+ [_lead]).
  void _check() {
    if (!mounted || !_pending) return;
    final position = _position;
    final box = context.findRenderObject();
    final viewport = _scrollable?.context.findRenderObject();
    if (position == null ||
        box is! RenderBox ||
        !box.attached ||
        !box.hasSize ||
        viewport is! RenderBox ||
        !viewport.attached) {
      return;
    }
    final top = box.localToGlobal(Offset.zero, ancestor: viewport).dy;
    if (top > position.viewportDimension + HomeReveal._lead) return;
    _detach();
    HomeReveal._shown.add(widget.id);
    _ctrl!.forward();
  }

  void _finish() {
    _detach();
    HomeReveal._shown.add(widget.id);
    _ctrl?.value = 1;
  }

  void _detach() {
    _position?.removeListener(_check);
    _position = null;
    _scrollable = null;
  }

  @override
  void dispose() {
    _detach();
    _ctrl?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ctrl = _ctrl;
    if (ctrl == null) return widget.child;
    return FadeTransition(
      opacity: ctrl,
      child: SlideTransition(position: _slide!, child: widget.child),
    );
  }
}
