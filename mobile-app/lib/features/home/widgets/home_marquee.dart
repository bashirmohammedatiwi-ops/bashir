import 'package:flutter/material.dart';

/// شريط نص متحرك — نشرة إخبارية (RTL).
class HomeMarquee extends StatefulWidget {
  final String text;
  final TextStyle style;
  /// 1 بطيء — 10 سريع
  final double speed;
  final String gap;

  const HomeMarquee({
    super.key,
    required this.text,
    required this.style,
    this.speed = 5,
    this.gap = '    •    ',
  });

  @override
  State<HomeMarquee> createState() => _HomeMarqueeState();
}

class _HomeMarqueeState extends State<HomeMarquee> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  double _loopWidth = 320;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _measureAndStart());
  }

  @override
  void didUpdateWidget(HomeMarquee old) {
    super.didUpdateWidget(old);
    if (old.text != widget.text || old.speed != widget.speed) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _measureAndStart());
    }
  }

  void _measureAndStart() {
    if (!mounted || widget.text.trim().isEmpty) return;

    final painter = TextPainter(
      text: TextSpan(text: '${widget.text}${widget.gap}', style: widget.style),
      textDirection: TextDirection.rtl,
      maxLines: 1,
    )..layout();

    final w = painter.width.clamp(120.0, 4000.0);
    final pxPerSec = 18 + widget.speed.clamp(1, 10) * 8;
    final ms = ((w / pxPerSec) * 1000).round().clamp(4000, 90000);

    setState(() => _loopWidth = w);
    _ctrl
      ..stop()
      ..duration = Duration(milliseconds: ms)
      ..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.text.trim().isEmpty) return const SizedBox.shrink();

    final segment = '${widget.text}${widget.gap}';

    return ClipRect(
      child: SizedBox(
        height: (widget.style.fontSize ?? 14) * (widget.style.height ?? 1.3),
        child: AnimatedBuilder(
          animation: _ctrl,
          builder: (_, __) => Transform.translate(
            offset: Offset(-_ctrl.value * _loopWidth, 0),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              textDirection: TextDirection.rtl,
              children: [
                Text(segment, style: widget.style, maxLines: 1),
                Text(segment, style: widget.style, maxLines: 1),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
