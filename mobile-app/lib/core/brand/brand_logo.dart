import 'package:flutter/material.dart';

import 'brand_logo_paths.dart';

/// ألوان هوية ديما الحياة — لوحة "أوركيد ووردي".
abstract final class BrandColors {
  static const orchidLight = Color(0xFFB07AE6);
  static const orchid = Color(0xFF8A55C9);
  static const rose = Color(0xFFC2508A);
  static const roseLight = Color(0xFFE7A6C4);
  static const ink = Color(0xFF3B2650);
  static const inkDeep = Color(0xFF22162F);

  static const orchidRose = [orchidLight, orchid, rose];
  static const roseOnly = [roseLight, rose];
  static const inkGradient = [ink, inkDeep];
}

/// رمز الشعار (الخصلات الثلاث والحاجب) — متجه وحاد بأي حجم.
/// بدون [color] يُرسم بألوان الهوية المتدرجة؛ مع [color] بلون واحد (مثلاً أبيض فوق لون العالم).
class BrandMark extends StatelessWidget {
  final double height;
  final Color? color;

  /// سماكة إضافية للخصل بوحدات الشعار — تفيد الأحجام الصغيرة جداً.
  final double weight;

  const BrandMark({super.key, this.height = 40, this.color, this.weight = 0});

  @override
  Widget build(BuildContext context) {
    const b = BrandLogo.markBounds;
    return SizedBox(
      height: height,
      width: height * b.width / b.height,
      child: CustomPaint(
        painter: _BrandPainter(mark: true, color: color, weight: weight),
      ),
    );
  }
}

/// الشعار الكامل: deema alhayat مع الخصلات.
class BrandWordmark extends StatelessWidget {
  final double width;
  final Color? color;

  const BrandWordmark({super.key, this.width = 220, this.color});

  @override
  Widget build(BuildContext context) {
    const b = BrandLogo.bounds;
    return SizedBox(
      width: width,
      height: width * b.height / b.width,
      child: CustomPaint(painter: _BrandPainter(mark: false, color: color)),
    );
  }
}

class _BrandPainter extends CustomPainter {
  final bool mark;
  final Color? color;
  final double weight;

  _BrandPainter({required this.mark, this.color, this.weight = 0});

  Paint _paint(Rect r, List<Color> colors) {
    final p = Paint()..isAntiAlias = true;
    if (color != null) {
      p.color = color!;
    } else {
      p.shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: colors,
      ).createShader(r);
    }
    return p;
  }

  void _draw(Canvas canvas, BrandShape s, List<Color> colors, [Rect? r]) {
    final paint = _paint(r ?? s.bounds, colors);
    canvas.drawPath(s.path, paint);
    if (weight > 0) {
      canvas.drawPath(
        s.path,
        _paint(r ?? s.bounds, colors)
          ..style = PaintingStyle.stroke
          ..strokeWidth = weight
          ..strokeJoin = StrokeJoin.round,
      );
    }
  }

  @override
  void paint(Canvas canvas, Size size) {
    final b = mark ? BrandLogo.markBounds : BrandLogo.bounds;
    final scale = size.height / b.height;
    canvas.save();
    canvas.scale(scale);
    canvas.translate(-b.left, -b.top);
    final strands = BrandLogo.strands;
    _draw(canvas, strands[0], BrandColors.orchidRose);
    _draw(canvas, strands[1], BrandColors.roseOnly);
    _draw(canvas, strands[2], BrandColors.orchidRose);
    _draw(canvas, BrandLogo.brow, BrandColors.inkGradient);
    if (!mark) {
      const alRect = Rect.fromLTRB(1, 68, 53, 119);
      const hayatRect = Rect.fromLTRB(63, 68, 250, 136);
      const deemaRect = Rect.fromLTRB(77, 55, 182, 78);
      for (final s in BrandLogo.al) {
        _draw(canvas, s, BrandColors.orchidRose, alRect);
      }
      for (final s in BrandLogo.hayat) {
        _draw(canvas, s, BrandColors.inkGradient, hayatRect);
      }
      for (final s in BrandLogo.deema) {
        _draw(canvas, s, BrandColors.orchidRose, deemaRect);
      }
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _BrandPainter old) =>
      old.mark != mark || old.color != color || old.weight != weight;
}
