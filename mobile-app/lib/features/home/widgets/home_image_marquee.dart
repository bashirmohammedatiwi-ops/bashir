import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'gallery_photo_card.dart';
import 'photo_shape_kit.dart';

/// صور متحركة أفقياً — حلقة لا نهائية بدون فراغات.
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
  final VoidCallback? onTap;

  const HomeMarqueeImage({
    required this.url,
    required this.width,
    this.height = 120,
    this.shape = 'rounded',
    this.onTap,
  });
}

class _HomeImageMarqueeState extends State<HomeImageMarquee> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  double _segmentWidth = 1;
  double? _lastViewportWidth;
  int? _lastImageCount;
  double? _lastSpeed;
  double? _lastGap;

  double _calcSegmentWidth() {
    if (widget.images.isEmpty) return 1;
    return widget.images.fold<double>(0, (sum, img) => sum + img.width + widget.gap);
  }

  /// نكرّر المقطع حتى يملأ الشاشة + مقطع إضافي — يمنع الفراغ عند قلة الصور.
  int _copyCount(double viewportWidth, double segmentWidth) {
    final needed = (viewportWidth / segmentWidth).ceil() + 2;
    return needed.clamp(2, 32);
  }

  void _syncAnimation(double viewportWidth) {
    if (!mounted || widget.images.isEmpty) return;

    final segmentWidth = _calcSegmentWidth();
    if (segmentWidth <= 0) return;

    final imageCount = widget.images.length;
    final speed = widget.speed;
    final gap = widget.gap;
    if (_lastViewportWidth == viewportWidth &&
        _lastImageCount == imageCount &&
        _lastSpeed == speed &&
        _lastGap == gap &&
        (_segmentWidth - segmentWidth).abs() < 0.5 &&
        _ctrl.isAnimating) {
      return;
    }

    _lastViewportWidth = viewportWidth;
    _lastImageCount = imageCount;
    _lastSpeed = speed;
    _lastGap = gap;
    _segmentWidth = segmentWidth;

    final pxPerSec = 24 + speed.clamp(1, 10) * 10;
    final ms = ((segmentWidth / pxPerSec) * 1000).round().clamp(5000, 120000);
    _ctrl
      ..stop()
      ..duration = Duration(milliseconds: ms)
      ..repeat();
  }

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this);
  }

  @override
  void didUpdateWidget(HomeImageMarquee old) {
    super.didUpdateWidget(old);
    if (old.images != widget.images ||
        old.speed != widget.speed ||
        old.gap != widget.gap ||
        old.height != widget.height) {
      _lastViewportWidth = null;
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Widget _buildSegment(TextDirection direction) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      textDirection: direction,
      children: [
        for (final img in widget.images) ...[
          _MarqueeTile(image: img, defaultHeight: widget.height),
          SizedBox(width: widget.gap),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) return const SizedBox.shrink();

    final direction = Directionality.of(context);
    final isRtl = direction == TextDirection.rtl;

    return LayoutBuilder(
      builder: (context, constraints) {
        final viewportW = constraints.maxWidth.isFinite
            ? constraints.maxWidth
            : MediaQuery.sizeOf(context).width;
        final segmentWidth = _calcSegmentWidth();
        final copies = _copyCount(viewportW, segmentWidth);

        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _syncAnimation(viewportW);
        });

        return ClipRect(
          child: SizedBox(
            height: widget.height,
            width: viewportW,
            child: AnimatedBuilder(
              animation: _ctrl,
              builder: (_, __) {
                final dx = (isRtl ? 1 : -1) * _ctrl.value * _segmentWidth;
                return Transform.translate(
                  offset: Offset(dx, 0),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    textDirection: direction,
                    children: [
                      for (var i = 0; i < copies; i++) _buildSegment(direction),
                    ],
                  ),
                );
              },
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

  const _MarqueeTile({required this.image, required this.defaultHeight});

  @override
  Widget build(BuildContext context) {
    final h = image.height > 0 ? image.height : defaultHeight;
    return GalleryPhotoCard(
      data: PhotoTileData(
        imageUrl: image.url,
        shape: image.shape,
        showShadow: false,
        overlayStyle: 'none',
        borderStyle: 'none',
      ),
      width: image.width,
      height: h,
      onTap: image.onTap != null
          ? () {
              HapticFeedback.selectionClick();
              image.onTap!();
            }
          : null,
    );
  }
}
