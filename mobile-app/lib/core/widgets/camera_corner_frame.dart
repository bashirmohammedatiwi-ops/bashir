import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// زاويتان متقابلتان صغيرتان، بلون الهوية، شفافتان على الصورة.
class CameraCornerFrame extends StatelessWidget {
  final double inset;
  final double arm;
  final double opacity;
  /// يرفع الزاوية السفلية حتى لا تغطيها أيقونة السلة.
  final double bottomClearance;

  const CameraCornerFrame({
    super.key,
    this.inset = 8,
    this.arm = 12,
    this.opacity = 0.45,
    this.bottomClearance = 0,
  });

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: CustomPaint(
        painter: _CameraCornerPainter(
          direction: Directionality.of(context),
          inset: inset,
          arm: arm,
          bottomClearance: bottomClearance,
          color: AppColors.primary.withValues(alpha: opacity),
        ),
        child: const SizedBox.expand(),
      ),
    );
  }
}

class _CameraCornerPainter extends CustomPainter {
  final TextDirection direction;
  final double inset;
  final double arm;
  final double bottomClearance;
  final Color color;

  const _CameraCornerPainter({
    required this.direction,
    required this.inset,
    required this.arm,
    required this.bottomClearance,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final mark = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.35
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..color = color;

    final startRight = direction == TextDirection.rtl;
    final lowerY = size.height - inset - bottomClearance;
    final corners = startRight
        ? <(Offset, Offset)>[
            (Offset(inset, inset), const Offset(1, 1)),
            (Offset(size.width - inset, lowerY), const Offset(-1, -1)),
          ]
        : <(Offset, Offset)>[
            (Offset(size.width - inset, inset), const Offset(-1, 1)),
            (Offset(inset, lowerY), const Offset(1, -1)),
          ];

    for (final corner in corners) {
      final origin = corner.$1;
      final sign = corner.$2;
      final path = Path()
        ..moveTo(origin.dx + sign.dx * arm, origin.dy)
        ..quadraticBezierTo(origin.dx, origin.dy, origin.dx, origin.dy + sign.dy * arm);
      canvas.drawPath(path, mark);
    }
  }

  @override
  bool shouldRepaint(covariant _CameraCornerPainter oldDelegate) =>
      oldDelegate.direction != direction ||
      oldDelegate.color != color ||
      oldDelegate.inset != inset ||
      oldDelegate.arm != arm ||
      oldDelegate.bottomClearance != bottomClearance;
}
