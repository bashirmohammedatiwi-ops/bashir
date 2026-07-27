import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'gallery_photo_card.dart';
import '../home_link.dart';
import 'photo_shape_kit.dart';

/// صور متحركة أفقياً — حلقة سينمائية مع سحب يدوي واستئناف فوري.
class HomeImageMarquee extends StatefulWidget {
  final List<HomeMarqueeImage> images;
  final double height;
  final double speed;
  final double gap;
  final double radius;
  final bool startFromEndInRtl;

  const HomeImageMarquee({
    super.key,
    required this.images,
    this.height = 120,
    this.speed = 5,
    this.gap = 12,
    this.radius = 14,
    this.startFromEndInRtl = false,
  });

  @override
  State<HomeImageMarquee> createState() => _HomeImageMarqueeState();
}

class HomeMarqueeImage {
  final String url;
  final double width;
  final double height;
  final String shape;
  final Map<String, dynamic> item;
  final String? navPath;

  const HomeMarqueeImage({
    required this.url,
    required this.width,
    required this.item,
    this.navPath,
    this.height = 120,
    this.shape = 'rounded',
  });

  String get linkSignature =>
      '${navPath ?? ''}_${item['link']}_${item['linkType']}_${item['linkValue']}_${item['targetType']}_${item['targetId']}';
}

class _HomeImageMarqueeState extends State<HomeImageMarquee>
    with SingleTickerProviderStateMixin {
  final GlobalKey _periodKey = GlobalKey();
  late final AnimationController _ctrl;
  Timer? _resumeTimer;

  double _periodWidth = 0;
  bool _measurePending = false;
  bool _userDragging = false;
  int _activePointers = 0;

  double get _pxPerSec => 24 + widget.speed.clamp(1, 10) * 10;

  double _estimatePeriodWidth() {
    if (widget.images.isEmpty) return 1;
    return widget.images.fold<double>(0, (sum, img) => sum + img.width + widget.gap);
  }

  double get _activePeriod =>
      _periodWidth > 0 ? _periodWidth : _estimatePeriodWidth();

  int _copyCount(double viewportWidth, double period) {
    if (period <= 0) return 4;
    return math.max(3, (viewportWidth / period).ceil() + 2);
  }

  static bool _imagesChanged(List<HomeMarqueeImage> a, List<HomeMarqueeImage> b) {
    if (a.length != b.length) return true;
    for (var i = 0; i < a.length; i++) {
      final x = a[i];
      final y = b[i];
      if (x.url != y.url ||
          x.width != y.width ||
          x.height != y.height ||
          x.shape != y.shape ||
          x.linkSignature != y.linkSignature) {
        return true;
      }
    }
    return false;
  }

  double _wrapPixels(double px, double period) {
    if (period <= 0) return 0;
    var v = px % period;
    if (v < 0) v += period;
    return v;
  }

  void _scheduleMeasure() {
    if (_measurePending) return;
    _measurePending = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _measurePending = false;
      _measureAndStart();
    });
  }

  void _applyLoopDuration({required double period, bool preserveProgress = true}) {
    final ms = (period / _pxPerSec * 1000).round().clamp(6000, 120000);
    final progress = preserveProgress ? _ctrl.value : 0.0;
    _ctrl
      ..stop()
      ..duration = Duration(milliseconds: ms)
      ..value = progress
      ..repeat();
  }

  void _measureAndStart() {
    if (!mounted || widget.images.isEmpty) return;

    final box = _periodKey.currentContext?.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) {
      _scheduleMeasure();
      return;
    }

    final measured = box.size.width;
    if (measured <= 0) return;

    final periodChanged =
        _periodWidth <= 0 || (measured - _periodWidth).abs() > 0.5;
    if (periodChanged) {
      setState(() => _periodWidth = measured);
    }

    if (!_ctrl.isAnimating && !_userDragging) {
      _applyLoopDuration(period: measured, preserveProgress: false);
    } else if (periodChanged && !_userDragging) {
      _applyLoopDuration(period: measured);
    }
  }

  void _pauseMotion() {
    _resumeTimer?.cancel();
    if (_ctrl.isAnimating) _ctrl.stop();
  }

  void _resumeMotion({Duration delay = Duration.zero}) {
    _resumeTimer?.cancel();
    if (delay == Duration.zero) {
      if (!mounted || _periodWidth <= 0 || _userDragging) return;
      if (!_ctrl.isAnimating) _ctrl.repeat();
      return;
    }
    _resumeTimer = Timer(delay, () {
      if (!mounted || _periodWidth <= 0 || _userDragging) return;
      if (!_ctrl.isAnimating) _ctrl.repeat();
    });
  }

  void _onPointerDown(PointerDownEvent _) {
    _activePointers++;
    _pauseMotion();
  }

  void _onPointerUp(PointerUpEvent _) {
    _activePointers = math.max(0, _activePointers - 1);
    if (_activePointers == 0 && !_userDragging) {
      _resumeMotion();
    }
  }

  void _onPointerCancel(PointerCancelEvent _) {
    _activePointers = math.max(0, _activePointers - 1);
    if (_activePointers == 0 && !_userDragging) {
      _resumeMotion();
    }
  }

  void _onHorizontalDragStart(DragStartDetails _) {
    _userDragging = true;
    _pauseMotion();
  }

  void _onHorizontalDragUpdate(DragUpdateDetails details) {
    final period = _activePeriod;
    if (period <= 0) return;
    final px = _wrapPixels(_ctrl.value * period - details.delta.dx, period);
    _ctrl.value = px / period;
  }

  void _onHorizontalDragEnd(DragEndDetails _) {
    _userDragging = false;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _resumeMotion();
    });
  }

  void _onHorizontalDragCancel() {
    _userDragging = false;
    _resumeMotion();
  }

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this);
    _scheduleMeasure();
  }

  @override
  void didUpdateWidget(HomeImageMarquee old) {
    super.didUpdateWidget(old);
    if (_imagesChanged(old.images, widget.images) ||
        old.gap != widget.gap ||
        old.height != widget.height ||
        old.speed != widget.speed) {
      _periodWidth = 0;
      _userDragging = false;
      _ctrl.stop();
      _scheduleMeasure();
    }
  }

  @override
  void dispose() {
    _resumeTimer?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  List<Widget> _tileWidgets() {
    return [
      for (final img in widget.images) ...[
        _MarqueeTile(
          image: img,
          defaultHeight: widget.height,
        ),
        SizedBox(width: widget.gap),
      ],
    ];
  }

  Widget _period({Key? key}) {
    return Row(
      key: key,
      mainAxisSize: MainAxisSize.min,
      textDirection: TextDirection.ltr,
      children: _tileWidgets(),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) return const SizedBox.shrink();

    if (_periodWidth <= 0) _scheduleMeasure();

    return LayoutBuilder(
      builder: (context, constraints) {
        final viewportW = constraints.maxWidth.isFinite
            ? constraints.maxWidth
            : MediaQuery.sizeOf(context).width;
        final period = _activePeriod;
        final copies = _copyCount(viewportW, period);

        return RepaintBoundary(
          child: ClipRect(
            child: Listener(
              behavior: HitTestBehavior.translucent,
              onPointerDown: _onPointerDown,
              onPointerUp: _onPointerUp,
              onPointerCancel: _onPointerCancel,
              child: GestureDetector(
                behavior: HitTestBehavior.translucent,
                onHorizontalDragStart: _onHorizontalDragStart,
                onHorizontalDragUpdate: _onHorizontalDragUpdate,
                onHorizontalDragEnd: _onHorizontalDragEnd,
                onHorizontalDragCancel: _onHorizontalDragCancel,
                child: SizedBox(
                  height: widget.height,
                  width: viewportW,
                  child: AnimatedBuilder(
                    animation: _ctrl,
                    builder: (_, __) {
                      final loop = _activePeriod;
                      return Transform.translate(
                        offset: Offset(-_ctrl.value * loop, 0),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          textDirection: TextDirection.ltr,
                          children: [
                            for (var i = 0; i < copies; i++)
                              _period(key: i == 0 ? _periodKey : null),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _MarqueeTile extends StatelessWidget {
  final HomeMarqueeImage image;
  final double defaultHeight;

  const _MarqueeTile({
    required this.image,
    required this.defaultHeight,
  });

  void _handleTap(BuildContext context) {
    HapticFeedback.selectionClick();
    final path = image.navPath;
    if (path != null && path.isNotEmpty) {
      navigateSectionPath(context, path);
      return;
    }
    openSectionItemLink(context, image.item);
  }

  @override
  Widget build(BuildContext context) {
    final h = image.height > 0 ? image.height : defaultHeight;
    final card = GalleryPhotoCard(
      data: PhotoTileData(
        imageUrl: image.url,
        shape: image.shape,
        showShadow: false,
        overlayStyle: 'none',
        borderStyle: 'none',
      ),
      width: image.width,
      height: h,
      showCaption: false,
      onTap: null,
    );

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => _handleTap(context),
      child: card,
    );
  }
}
