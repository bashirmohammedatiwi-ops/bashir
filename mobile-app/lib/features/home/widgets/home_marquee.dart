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
  double _textHeight = 20;

  TextPainter _buildPainter(String text) => TextPainter(
        text: TextSpan(text: text, style: widget.style),
        textDirection: TextDirection.rtl,
        maxLines: 1,
      )..layout();

  double _contentHeight(TextPainter painter) {
    final fontSize = widget.style.fontSize ?? 14;
    // Emojis and Arabic glyphs can exceed fontSize * height — keep a small buffer.
    final buffer = (fontSize * 0.45).clamp(3.0, 10.0);
    return painter.height + buffer;
  }

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _measureAndStart());
  }

  @override
  void didUpdateWidget(HomeMarquee old) {
    super.didUpdateWidget(old);
    if (old.text != widget.text ||
        old.speed != widget.speed ||
        old.style != widget.style ||
        old.gap != widget.gap) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _measureAndStart());
    }
  }

  void _measureAndStart() {
    if (!mounted || widget.text.trim().isEmpty) return;

    final segment = '${widget.text}${widget.gap}';
    final painter = _buildPainter(segment);

    final w = painter.width.clamp(120.0, 4000.0);
    final h = _contentHeight(painter);
    final pxPerSec = 18 + widget.speed.clamp(1, 10) * 8;
    final ms = ((w / pxPerSec) * 1000).round().clamp(4000, 90000);

    setState(() {
      _loopWidth = w;
      _textHeight = h;
    });
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
        height: _textHeight,
        child: Align(
          alignment: Alignment.center,
          child: AnimatedBuilder(
            animation: _ctrl,
            builder: (_, __) => Transform.translate(
              offset: Offset(-_ctrl.value * _loopWidth, 0),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                textDirection: TextDirection.rtl,
                children: [
                  Text(segment, style: widget.style, maxLines: 1, overflow: TextOverflow.visible),
                  Text(segment, style: widget.style, maxLines: 1, overflow: TextOverflow.visible),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
