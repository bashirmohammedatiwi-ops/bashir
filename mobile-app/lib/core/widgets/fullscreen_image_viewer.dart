import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../perf/device_perf.dart';
import 'app_network_image.dart';

/// عارض صور بملء الشاشة: تكبير بالقرص أو بالنقر المزدوج، تمرير بين الصور،
/// وسحب عمودي للإغلاق.
class FullScreenImageViewer extends StatefulWidget {
  final List<String> urls;
  final int initialIndex;

  const FullScreenImageViewer({
    super.key,
    required this.urls,
    this.initialIndex = 0,
  });

  static Future<void> show(
    BuildContext context, {
    required List<String> urls,
    int initialIndex = 0,
  }) {
    final valid = urls.where((u) => u.trim().isNotEmpty).toList();
    if (valid.isEmpty) return Future.value();

    final index = initialIndex.clamp(0, valid.length - 1);
    return Navigator.of(context).push(
      PageRouteBuilder<void>(
        // الخلفية السوداء يرسمها العارض نفسه لتخفت أثناء سحب الإغلاق.
        opaque: false,
        transitionDuration: const Duration(milliseconds: 220),
        reverseTransitionDuration: const Duration(milliseconds: 180),
        pageBuilder: (_, __, ___) => FullScreenImageViewer(
          urls: valid,
          initialIndex: index,
        ),
        transitionsBuilder: (_, animation, __, child) =>
            FadeTransition(opacity: animation, child: child),
      ),
    );
  }

  @override
  State<FullScreenImageViewer> createState() => _FullScreenImageViewerState();
}

class _FullScreenImageViewerState extends State<FullScreenImageViewer>
    with SingleTickerProviderStateMixin {
  /// مسافة السحب (أو سرعته) التي تُغلق العارض.
  static const _dismissDistance = 110.0;
  static const _dismissVelocity = 800.0;

  late final PageController _pageController;
  late final AnimationController _settle;
  final _dragOffset = ValueNotifier<double>(0);
  late int _index;
  bool _zoomed = false;
  Animation<double>? _settleAnimation;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    _settle = AnimationController(vsync: this, duration: const Duration(milliseconds: 180))
      ..addListener(() => _dragOffset.value = _settleAnimation?.value ?? 0);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _pageController.dispose();
    _settle.dispose();
    _dragOffset.dispose();
    super.dispose();
  }

  void _onZoomChanged(bool zoomed) {
    if (zoomed != _zoomed) setState(() => _zoomed = zoomed);
  }

  void _onDismissDrag(double dy) {
    if (_settle.isAnimating) _settle.stop();
    _dragOffset.value += dy;
  }

  void _onDismissEnd(double velocity) {
    final offset = _dragOffset.value;
    if (offset.abs() > _dismissDistance || velocity.abs() > _dismissVelocity) {
      Navigator.of(context).maybePop();
      return;
    }
    if (offset == 0) return;
    if (MediaQuery.disableAnimationsOf(context)) {
      _dragOffset.value = 0;
      return;
    }
    _settleAnimation = Tween<double>(begin: offset, end: 0)
        .animate(CurvedAnimation(parent: _settle, curve: Curves.easeOutCubic));
    _settle.forward(from: 0);
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final dpr = MediaQuery.devicePixelRatioOf(context);
    // دقة أعلى من الشاشة حتى يبقى التكبير حاداً (حتى 2.5×) دون حجز ذاكرة بلا حدّ —
    // فيُنزَّل مقاس large (1600) لا medium المعروض في الصفحة. الجهاز البسيط أقل (ذاكرة).
    final decodeWidth = math.min(DevicePerf.pick(low: 1280, mid: 2400), (size.width * dpr * 2.5).round());
    // بديل التحميل: الصورة كما ظهرت في الصفحة (مفكوكة في الذاكرة غالباً) — بلا شاشة سوداء.
    final previewWidth = math.min(1600, (size.width * dpr).round());

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: ValueListenableBuilder<double>(
        valueListenable: _dragOffset,
        builder: (context, offset, pages) {
          // كلما ابتعدت الصورة خفّت الخلفية والأزرار.
          final progress = (offset.abs() / (size.height * 0.4)).clamp(0.0, 1.0);
          return Stack(
            fit: StackFit.expand,
            children: [
              ColoredBox(color: Colors.black.withValues(alpha: 1 - progress * 0.7)),
              Transform.translate(offset: Offset(0, offset), child: pages),
              Opacity(
                opacity: 1 - progress,
                child: _Chrome(index: _index, count: widget.urls.length),
              ),
            ],
          );
        },
        child: PageView.builder(
          controller: _pageController,
          // الصورة مكبّرة: السحب يحرّكها داخل الإطار لا ينتقل للصورة التالية.
          physics: _zoomed ? const NeverScrollableScrollPhysics() : null,
          onPageChanged: (i) => setState(() => _index = i),
          itemCount: widget.urls.length,
          itemBuilder: (_, i) => _ZoomableImage(
            url: widget.urls[i],
            width: size.width,
            height: size.height,
            decodeWidth: decodeWidth,
            previewWidth: previewWidth,
            onZoomChanged: _onZoomChanged,
            onDismissDrag: _onDismissDrag,
            onDismissEnd: _onDismissEnd,
          ),
        ),
      ),
    );
  }
}

/// زر الإغلاق والعدّاد فوق الصور.
class _Chrome extends StatelessWidget {
  final int index;
  final int count;

  const _Chrome({required this.index, required this.count});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        SafeArea(
          child: Align(
            alignment: AlignmentDirectional.topStart,
            child: IconButton(
              onPressed: () => Navigator.of(context).maybePop(),
              tooltip: MaterialLocalizations.of(context).closeButtonTooltip,
              icon: const Icon(Icons.close_rounded, color: Colors.white, size: 28),
              style: IconButton.styleFrom(
                backgroundColor: Colors.black.withValues(alpha: 0.35),
              ),
            ),
          ),
        ),
        if (count > 1)
          SafeArea(
            child: Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: IgnorePointer(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.45),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    // «1 / 5» من اليسار في اللغتين — بدونها تنقلب في العربية إلى «5 / 1».
                    child: Text(
                      '${index + 1} / $count',
                      textDirection: TextDirection.ltr,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ZoomableImage extends StatefulWidget {
  final String url;
  final double width;
  final double height;
  final int decodeWidth;

  /// عرض فكّ البديل إن لم تظهر الصورة في هذه الجلسة بعد.
  final int previewWidth;
  final ValueChanged<bool> onZoomChanged;

  /// سحب عمودي بإصبع واحد والصورة غير مكبّرة — يحرّك العارض نحو الإغلاق.
  final ValueChanged<double> onDismissDrag;

  /// انتهى سحب الإغلاق بسرعة عمودية (بكسل/ثانية).
  final ValueChanged<double> onDismissEnd;

  const _ZoomableImage({
    required this.url,
    required this.width,
    required this.height,
    required this.decodeWidth,
    required this.previewWidth,
    required this.onZoomChanged,
    required this.onDismissDrag,
    required this.onDismissEnd,
  });

  @override
  State<_ZoomableImage> createState() => _ZoomableImageState();
}

class _ZoomableImageState extends State<_ZoomableImage> with SingleTickerProviderStateMixin {
  static const _doubleTapScale = 2.5;

  final _transform = TransformationController();
  late final AnimationController _zoom;
  Animation<Matrix4>? _zoomAnimation;
  Offset _doubleTapAt = Offset.zero;
  bool _zoomed = false;
  bool _dismissing = false;

  /// عرض فكّ البديل — يُقرأ مرة قبل أن تسجّل الصورة الكبيرة عرضها هي لنفس الرابط.
  late final int _previewDecode;

  @override
  void initState() {
    super.initState();
    _previewDecode = lastImageDecodeWidth(widget.url) ?? widget.previewWidth;
    _zoom = AnimationController(vsync: this, duration: const Duration(milliseconds: 240))
      ..addListener(() {
        final value = _zoomAnimation?.value;
        if (value != null) _transform.value = value;
      });
    _transform.addListener(_syncZoomed);
  }

  @override
  void dispose() {
    _transform.removeListener(_syncZoomed);
    _transform.dispose();
    _zoom.dispose();
    super.dispose();
  }

  void _syncZoomed() {
    final zoomed = _transform.value.getMaxScaleOnAxis() > 1.01;
    if (zoomed == _zoomed) return;
    // يتبدّل مع التكبير: السحب بإصبع واحد يحرّك الصورة بدل أن يغلق العارض.
    setState(() => _zoomed = zoomed);
    widget.onZoomChanged(zoomed);
  }

  void _toggleZoom() {
    final Matrix4 target;
    if (_zoomed) {
      target = Matrix4.identity();
    } else {
      // تكبير حول نقطة النقر: النقطة نفسها تبقى تحت الإصبع.
      const s = _doubleTapScale;
      final p = _doubleTapAt;
      target = Matrix4.diagonal3Values(s, s, 1)..setTranslationRaw(-p.dx * (s - 1), -p.dy * (s - 1), 0);
    }
    if (MediaQuery.disableAnimationsOf(context)) {
      _transform.value = target;
      return;
    }
    _zoomAnimation = Matrix4Tween(begin: _transform.value, end: target)
        .animate(CurvedAnimation(parent: _zoom, curve: Curves.easeOutCubic));
    _zoom.forward(from: 0);
  }

  void _onInteractionStart(ScaleStartDetails details) {
    if (_zoom.isAnimating) _zoom.stop();
    _dismissing = !_zoomed && details.pointerCount == 1;
  }

  void _onInteractionUpdate(ScaleUpdateDetails details) {
    if (!_dismissing) return;
    if (details.pointerCount > 1) {
      // إصبع ثانٍ: صار تكبيراً — تعود الصورة لمكانها.
      _dismissing = false;
      widget.onDismissEnd(0);
      return;
    }
    widget.onDismissDrag(details.focalPointDelta.dy);
  }

  void _onInteractionEnd(ScaleEndDetails details) {
    if (!_dismissing) return;
    _dismissing = false;
    widget.onDismissEnd(details.velocity.pixelsPerSecond.dy);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onDoubleTapDown: (d) => _doubleTapAt = d.localPosition,
      onDoubleTap: _toggleZoom,
      child: InteractiveViewer(
        transformationController: _transform,
        minScale: 1,
        maxScale: 4,
        // غير مكبّرة: لا تحريك — السحب العمودي للإغلاق والأفقي للصورة التالية.
        panEnabled: _zoomed,
        scaleEnabled: true,
        clipBehavior: Clip.none,
        onInteractionStart: _onInteractionStart,
        onInteractionUpdate: _onInteractionUpdate,
        onInteractionEnd: _onInteractionEnd,
        child: SizedBox(
          width: widget.width,
          height: widget.height,
          child: Center(
            child: AppNetworkImage(
              url: widget.url,
              width: widget.width,
              height: widget.height,
              fit: BoxFit.contain,
              decodeWidth: widget.decodeWidth,
              fallbackColor: Colors.black,
              placeholder: Stack(
                fit: StackFit.expand,
                children: [
                  // نفس الرابط وعرض الفكّ اللذين ظهرت بهما في الصفحة = نفس النسخة في الذاكرة.
                  AppNetworkImage(
                    url: widget.url,
                    width: widget.width,
                    height: widget.height,
                    fit: BoxFit.contain,
                    decodeWidth: _previewDecode,
                    backgroundColor: Colors.transparent,
                    fallbackColor: Colors.black,
                  ),
                  const Center(
                    child: SizedBox.square(
                      dimension: 26,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
