import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/widgets/app_network_image.dart';

/// صور متحركة أفقياً — مثل النشرة الإخبارية.
class HomeImageMarquee extends StatefulWidget {
  final List<HomeMarqueeImage> images;
  final double height;
  final double speed;
  final double gap;
  final double radius;

  const HomeImageMarquee({
    super.key,
    required this.images,
    this.height = 120,
    this.speed = 5,
    this.gap = 12,
    this.radius = 14,
  });

  @override
  State<HomeImageMarquee> createState() => _HomeImageMarqueeState();
}

class HomeMarqueeImage {
  final String url;
  final double width;
  final VoidCallback? onTap;

  const HomeMarqueeImage({
    required this.url,
    required this.width,
    this.onTap,
  });
}

class _HomeImageMarqueeState extends State<HomeImageMarquee>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  double _loopWidth = 400;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _restart());
  }

  @override
  void didUpdateWidget(HomeImageMarquee old) {
    super.didUpdateWidget(old);
    if (old.images != widget.images || old.speed != widget.speed) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _restart());
    }
  }

  void _restart() {
    if (!mounted || widget.images.isEmpty) return;
    final total = widget.images.fold<double>(
          0,
          (sum, img) => sum + img.width + widget.gap,
        ) +
        widget.gap;
    final pxPerSec = 24 + widget.speed.clamp(1, 10) * 10;
    final ms = ((total / pxPerSec) * 1000).round().clamp(5000, 120000);
    setState(() => _loopWidth = total);
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
    if (widget.images.isEmpty) return const SizedBox.shrink();

    Widget row = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final img in widget.images) ...[
          _MarqueeTile(
            image: img,
            height: widget.height,
            radius: widget.radius,
          ),
          SizedBox(width: widget.gap),
        ],
      ],
    );

    return ClipRect(
      child: SizedBox(
        height: widget.height,
        child: AnimatedBuilder(
          animation: _ctrl,
          builder: (_, __) => Transform.translate(
            offset: Offset(-_ctrl.value * _loopWidth, 0),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [row, row],
            ),
          ),
        ),
      ),
    );
  }
}

class _MarqueeTile extends StatelessWidget {
  final HomeMarqueeImage image;
  final double height;
  final double radius;

  const _MarqueeTile({
    required this.image,
    required this.height,
    required this.radius,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: image.onTap != null
            ? () {
                HapticFeedback.selectionClick();
                image.onTap!();
              }
            : null,
        borderRadius: BorderRadius.circular(radius),
        child: Ink(
          width: image.width,
          height: height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(radius),
            color: Colors.white,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(radius),
            child: AppNetworkImage(url: image.url, fit: BoxFit.cover),
          ),
        ),
      ),
    );
  }
}
