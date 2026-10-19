import 'dart:math' as math;

import 'package:flutter/material.dart';

/// شريط نص متحرك — نشرة إخبارية تتبع اتجاه اللغة:
/// بالعربي يتحرك نحو اليمين (يدخل من اليسار)، وبالإنجليزي نحو اليسار.
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
  late final AnimationController _ctrl;
  double _loopWidth = 0;
  double _textHeight = 20;

  TextScaler? _scaler;
  TextDirection? _direction;
  TextStyle? _baseStyle;
  bool _reduceMotion = false;

  String get _segment => '${widget.text}${widget.gap}';

  /// النمط الفعلي كما سيرسمه Text (مع DefaultTextStyle) — القياس يطابق الرسم.
  TextStyle get _effectiveStyle => (_baseStyle ?? const TextStyle()).merge(widget.style);

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final scaler = MediaQuery.textScalerOf(context);
    final direction = Directionality.of(context);
    final base = DefaultTextStyle.of(context).style;
    final reduce = MediaQuery.disableAnimationsOf(context);
    if (scaler != _scaler ||
        direction != _direction ||
        base != _baseStyle ||
        reduce != _reduceMotion) {
      _scaler = scaler;
      _direction = direction;
      _baseStyle = base;
      _reduceMotion = reduce;
      _measureAndStart();
    }
  }

  @override
  void didUpdateWidget(HomeMarquee old) {
    super.didUpdateWidget(old);
    if (old.text != widget.text ||
        old.speed != widget.speed ||
        old.style != widget.style ||
        old.gap != widget.gap) {
      _measureAndStart();
    }
  }

  /// يقيس المقطع بنفس مقياس الخط واتجاه النص المعروضين — الحلقة تلتحم بلا قفزة.
  /// يُستدعى من didChangeDependencies/didUpdateWidget، ويتبعهما build تلقائياً.
  void _measureAndStart() {
    if (widget.text.trim().isEmpty) {
      _ctrl.stop();
      return;
    }

    final painter = TextPainter(
      text: TextSpan(text: _segment, style: _effectiveStyle),
      textDirection: _direction ?? TextDirection.rtl,
      textScaler: _scaler ?? TextScaler.noScaling,
      maxLines: 1,
    )..layout();
    final w = painter.width;
    final fontSize = (_scaler ?? TextScaler.noScaling).scale(_effectiveStyle.fontSize ?? 14);
    // الإيموجي والحروف العربية قد تتجاوز ارتفاع السطر — هامش صغير.
    final h = painter.height + (fontSize * 0.45).clamp(3.0, 10.0);
    painter.dispose();

    _loopWidth = w;
    _textHeight = h;

    _ctrl.stop();
    if (_reduceMotion || w <= 0) {
      _ctrl.value = 0;
      return;
    }
    final pxPerSec = 18 + widget.speed.clamp(1, 10) * 8;
    final ms = ((w / pxPerSec) * 1000).round().clamp(4000, 90000);
    _ctrl
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

    // «تقليل الحركة»: نص ثابت بسطر واحد مع «…».
    if (_reduceMotion) {
      return SizedBox(
        height: _textHeight,
        child: Align(
          alignment: AlignmentDirectional.centerStart,
          child: Text(
            widget.text,
            style: widget.style,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            softWrap: false,
          ),
        ),
      );
    }

    final rtl = Directionality.of(context) == TextDirection.rtl;
    final segment = _segment;

    return Semantics(
      label: widget.text,
      child: ExcludeSemantics(
        child: ClipRect(
          child: SizedBox(
            height: _textHeight,
            child: LayoutBuilder(
              builder: (context, constraints) {
                final maxW = constraints.maxWidth.isFinite
                    ? constraints.maxWidth
                    : MediaQuery.sizeOf(context).width;
                // نُسخ كافية لتغطية الشريط كله طوال الحلقة — لا فراغ للنصوص القصيرة.
                final copies = _loopWidth > 0 ? math.max(2, (maxW / _loopWidth).ceil() + 1) : 2;
                // OverflowBox: النص المتحرك أعرض من الشريط عمداً — لا قيود عرض ولا تحذير تجاوز.
                return OverflowBox(
                  alignment: rtl ? Alignment.centerRight : Alignment.centerLeft,
                  maxWidth: double.infinity,
                  child: AnimatedBuilder(
                    animation: _ctrl,
                    builder: (_, child) => Transform.translate(
                      offset: Offset((rtl ? 1 : -1) * _ctrl.value * _loopWidth, 0),
                      child: child,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        for (var i = 0; i < copies; i++)
                          Text(segment, style: widget.style, maxLines: 1, softWrap: false),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
