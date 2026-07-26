import 'dart:math' as math;

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
  final GlobalKey _periodKey = GlobalKey();
  late AnimationController _ctrl;

  double _periodWidth = 0;

  double get _pxPerSec => 24 + widget.speed.clamp(1, 10) * 10;

  double _estimatePeriodWidth() {
    if (widget.images.isEmpty) return 1;
    return widget.images.fold<double>(0, (sum, img) => sum + img.width + widget.gap);
  }

  /// عدد التكرارات اللازمة لتغطية الشاشة بالكامل أثناء الحلقة.
  int _copyCount(double viewportWidth, double period) {
    if (period <= 0) return 4;
    return math.max(3, (viewportWidth / period).ceil() + 2);
  }

  void _measureAndStart() {
    if (!mounted || widget.images.isEmpty) return;

    final box = _periodKey.currentContext?.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _measureAndStart());
      return;
    }

    final measured = box.size.width;
    if (measured <= 0) return;

    final changed = (measured - _periodWidth).abs() > 0.5;
    if (changed) {
      setState(() => _periodWidth = measured);
    }

    final ms = ((_periodWidth > 0 ? _periodWidth : measured) / _pxPerSec * 1000)
        .round()
        .clamp(6000, 120000);

    _ctrl
      ..stop()
      ..duration = Duration(milliseconds: ms)
      ..repeat();
  }

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _measureAndStart());
  }

  @override
  void didUpdateWidget(HomeImageMarquee old) {
    super.didUpdateWidget(old);
    if (old.images != widget.images ||
        old.gap != widget.gap ||
        old.height != widget.height ||
        old.speed != widget.speed) {
      _periodWidth = 0;
      _ctrl.stop();
      WidgetsBinding.instance.addPostFrameCallback((_) => _measureAndStart());
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  List<Widget> _tileWidgets() {
    return [
      for (final img in widget.images) ...[
        _MarqueeTile(image: img, defaultHeight: widget.height),
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

    return LayoutBuilder(
      builder: (context, constraints) {
        final viewportW = constraints.maxWidth.isFinite
            ? constraints.maxWidth
            : MediaQuery.sizeOf(context).width;
        final period = _periodWidth > 0 ? _periodWidth : _estimatePeriodWidth();
        final copies = _copyCount(viewportW, period);

        WidgetsBinding.instance.addPostFrameCallback((_) => _measureAndStart());

        return ClipRect(
          child: SizedBox(
            height: widget.height,
            width: viewportW,
            child: AnimatedBuilder(
              animation: _ctrl,
              builder: (_, __) {
                final loop = _periodWidth > 0 ? _periodWidth : period;
                // نفس منطق شريط النص — تمرير سلس وحلقة دائرية
                final dx = -_ctrl.value * loop;
                return Transform.translate(
                  offset: Offset(dx, 0),
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
