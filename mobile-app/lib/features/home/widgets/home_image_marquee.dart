import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'gallery_photo_card.dart';
import '../home_link.dart';
import 'photo_shape_kit.dart';

/// صور متحركة أفقياً — حلقة سينمائية مع سحب يدوي ونقر موثوق لكل الصور.
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
  final String? linkType;
  final String? linkValue;
  final String? link;

  const HomeMarqueeImage({
    required this.url,
    required this.width,
    required this.item,
    this.navPath,
    this.linkType,
    this.linkValue,
    this.link,
    this.height = 120,
    this.shape = 'rounded',
  });

  factory HomeMarqueeImage.fromItem({
    required String url,
    required double width,
    required double height,
    required String shape,
    required Map<String, dynamic> raw,
  }) {
    final item = Map<String, dynamic>.from(raw);
    return HomeMarqueeImage(
      url: url,
      width: width,
      height: height,
      shape: shape,
      item: item,
      navPath: resolveSectionItemPath(item),
      linkType: item['linkType']?.toString(),
      linkValue: item['linkValue']?.toString(),
      link: item['link']?.toString(),
    );
  }

  String get linkSignature =>
      '${navPath ?? ''}_${link ?? ''}_${linkType ?? ''}_${linkValue ?? ''}';

  void openLink(BuildContext context) {
    HapticFeedback.selectionClick();
    if (navPath != null && navPath!.isNotEmpty) {
      navigateSectionPath(context, navPath!);
      return;
    }
    openSectionItemLink(context, item);
  }
}

class _HomeImageMarqueeState extends State<HomeImageMarquee>
    with SingleTickerProviderStateMixin {
  final GlobalKey _periodKey = GlobalKey();
  late final AnimationController _ctrl;
  Timer? _resumeTimer;

  double _periodWidth = 0;
  bool _measurePending = false;
  bool _userDragging = false;
  Offset? _pointerDown;
  static const _dragSlop = 12.0;

  double get _pxPerSec => 24 + widget.speed.clamp(1, 10) * 10;

  double _estimatePeriodWidth() {
    if (widget.images.isEmpty) return 1;
    return widget.images.fold<double>(0, (sum, img) => sum + img.width + widget.gap);
  }

  double get _activePeriod =>
      _periodWidth > 0 ? _periodWidth : _estimatePeriodWidth();

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

  void _resumeMotion() {
    _resumeTimer?.cancel();
    if (!mounted || _periodWidth <= 0 || _userDragging) return;
    if (!_ctrl.isAnimating) _ctrl.repeat();
  }

  void _onPointerDown(PointerDownEvent event) {
    _pointerDown = event.position;
    _userDragging = false;
    _pauseMotion();
  }

  void _onPointerMove(PointerMoveEvent event) {
    if (_pointerDown == null) return;

    final deltaFromDown = event.position - _pointerDown!;
    if (!_userDragging) {
      if (deltaFromDown.dx.abs() < _dragSlop) return;
      if (deltaFromDown.dx.abs() <= deltaFromDown.dy.abs()) return;
      _userDragging = true;
    }

    final period = _activePeriod;
    if (period <= 0) return;
    final px = _wrapPixels(_ctrl.value * period + event.delta.dx, period);
    _ctrl.value = px / period;
  }

  void _onPointerUp(PointerUpEvent event) {
    final wasDragging = _userDragging;
    _userDragging = false;
    _pointerDown = null;

    if (wasDragging) {
      _resumeMotion();
      return;
    }

    _resumeMotion();
  }

  void _onPointerCancel(PointerCancelEvent event) {
    _userDragging = false;
    _pointerDown = null;
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
      _pointerDown = null;
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

        return RepaintBoundary(
          child: ClipRect(
            clipBehavior: Clip.hardEdge,
            child: Listener(
              behavior: HitTestBehavior.translucent,
              onPointerDown: _onPointerDown,
              onPointerMove: _onPointerMove,
              onPointerUp: _onPointerUp,
              onPointerCancel: _onPointerCancel,
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
                          _period(key: _periodKey),
                          _period(),
                        ],
                      ),
                    );
                  },
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

  @override
  Widget build(BuildContext context) {
    final h = image.height > 0 ? image.height : defaultHeight;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => image.openLink(context),
      child: GalleryPhotoCard(
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
      ),
    );
  }
}
