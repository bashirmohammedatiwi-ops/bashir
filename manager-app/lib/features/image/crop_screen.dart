import 'dart:math' as math;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../widgets/common.dart';

/// نتيجة التعديل: المنتج بعد الاستبدال + المعرّف القديم للتراجع.
class CropResult {
  CropResult({required this.product, required this.previousMediaId, required this.newMediaId});
  final ProductDetail? product;
  final String previousMediaId;
  final String newMediaId;
}

enum _Hit { none, move, tl, tr, bl, br, l, r, t, b }

/// محرر قص: الإطار يُرسم على الهاتف، والقص الفعلي يتم على السيرفر من الصورة الأصلية بدقتها الكاملة.
class CropScreen extends ConsumerStatefulWidget {
  const CropScreen({super.key, required this.image, this.productId, this.shadeId, this.title});
  final MediaImage image;
  final String? productId;
  final String? shadeId;
  final String? title;

  @override
  ConsumerState<CropScreen> createState() => _CropScreenState();
}

class _CropScreenState extends ConsumerState<CropScreen> {
  // المستطيل بنسب 0..1 من الصورة المعروضة (بعد التدوير)
  Rect _rect = const Rect.fromLTWH(0, 0, 1, 1);
  int _turns = 0; // ربع دورات مع عقارب الساعة
  bool _flip = false;
  double? _aspect; // null = حر
  bool _busy = false;
  String _busyLabel = '';
  _Hit _hit = _Hit.none;
  Size _shown = Size.zero;

  int get _w => widget.image.width ?? 1000;
  int get _h => widget.image.height ?? 1000;
  // أبعاد الصورة بعد التدوير
  double get _rw => (_turns.isOdd ? _h : _w).toDouble();
  double get _rh => (_turns.isOdd ? _w : _h).toDouble();

  bool get _dirty => _turns != 0 || _flip || _rect != const Rect.fromLTWH(0, 0, 1, 1);

  void _setAspect(double? a) {
    setState(() {
      _aspect = a;
      if (a == null) return;
      // أكبر مستطيل بالنسبة المطلوبة في المنتصف
      final imgRatio = _rw / _rh;
      double w = 1, h = 1;
      if (a > imgRatio) {
        h = imgRatio / a;
      } else {
        w = a / imgRatio;
      }
      _rect = Rect.fromLTWH((1 - w) / 2, (1 - h) / 2, w, h);
    });
  }

  void _rotate(int delta) {
    setState(() {
      _turns = (_turns + delta) % 4;
      _rect = const Rect.fromLTWH(0, 0, 1, 1);
      if (_aspect != null) _setAspect(_aspect);
    });
  }

  _Hit _hitTest(Offset p) {
    final r = Rect.fromLTRB(_rect.left * _shown.width, _rect.top * _shown.height, _rect.right * _shown.width, _rect.bottom * _shown.height);
    const t = 30.0;
    bool near(Offset a) => (a - p).distance < t;
    if (near(r.topLeft)) return _Hit.tl;
    if (near(r.topRight)) return _Hit.tr;
    if (near(r.bottomLeft)) return _Hit.bl;
    if (near(r.bottomRight)) return _Hit.br;
    final inY = p.dy > r.top - t && p.dy < r.bottom + t;
    final inX = p.dx > r.left - t && p.dx < r.right + t;
    if (_aspect == null) {
      if ((p.dx - r.left).abs() < t && inY) return _Hit.l;
      if ((p.dx - r.right).abs() < t && inY) return _Hit.r;
      if ((p.dy - r.top).abs() < t && inX) return _Hit.t;
      if ((p.dy - r.bottom).abs() < t && inX) return _Hit.b;
    }
    if (r.contains(p)) return _Hit.move;
    return _Hit.none;
  }

  void _drag(Offset delta) {
    if (_shown.isEmpty) return;
    final dx = delta.dx / _shown.width;
    final dy = delta.dy / _shown.height;
    const minS = 0.08;
    var l = _rect.left, t = _rect.top, r = _rect.right, b = _rect.bottom;
    switch (_hit) {
      case _Hit.move:
        final w = r - l, h = b - t;
        l = (l + dx).clamp(0.0, 1 - w);
        t = (t + dy).clamp(0.0, 1 - h);
        r = l + w;
        b = t + h;
      case _Hit.tl:
        l = (l + dx).clamp(0.0, r - minS);
        t = (t + dy).clamp(0.0, b - minS);
      case _Hit.tr:
        r = (r + dx).clamp(l + minS, 1.0);
        t = (t + dy).clamp(0.0, b - minS);
      case _Hit.bl:
        l = (l + dx).clamp(0.0, r - minS);
        b = (b + dy).clamp(t + minS, 1.0);
      case _Hit.br:
        r = (r + dx).clamp(l + minS, 1.0);
        b = (b + dy).clamp(t + minS, 1.0);
      case _Hit.l:
        l = (l + dx).clamp(0.0, r - minS);
      case _Hit.r:
        r = (r + dx).clamp(l + minS, 1.0);
      case _Hit.t:
        t = (t + dy).clamp(0.0, b - minS);
      case _Hit.b:
        b = (b + dy).clamp(t + minS, 1.0);
      case _Hit.none:
        return;
    }
    if (_aspect != null && _hit != _Hit.move) {
      // نحافظ على النسبة: العرض يقود، والارتفاع يتبعه (بنسب البكسل)
      final a = _aspect!;
      var w = r - l;
      var h = (w * _rw) / (a * _rh);
      final anchorTop = _hit == _Hit.bl || _hit == _Hit.br;
      if (anchorTop) {
        if (t + h > 1) {
          h = 1 - t;
          w = h * a * _rh / _rw;
        }
        b = t + h;
      } else {
        if (b - h < 0) {
          h = b;
          w = h * a * _rh / _rw;
        }
        t = b - h;
      }
      final anchorLeft = _hit == _Hit.tr || _hit == _Hit.br;
      if (anchorLeft) {
        r = l + w;
      } else {
        l = r - w;
      }
      if (l < 0 || r > 1 || t < 0 || b > 1 || w < minS || h < minS) return;
    }
    setState(() => _rect = Rect.fromLTRB(l, t, r, b));
  }

  Future<void> _apply(Map<String, dynamic> body, String label) async {
    setState(() {
      _busy = true;
      _busyLabel = label;
    });
    try {
      final res = await ref.read(repoProvider).editImage(widget.image.mediaId, {
        ...body,
        'productId': ?widget.productId,
        'shadeId': ?widget.shadeId,
      });
      if (!mounted) return;
      if (res.unchanged) {
        toast(context, 'الصورة لم تتغير');
        setState(() => _busy = false);
        return;
      }
      Navigator.pop(context, CropResult(product: res.product, previousMediaId: res.previous, newMediaId: res.mediaId));
    } catch (e) {
      if (mounted) {
        toastError(context, e);
        setState(() => _busy = false);
      }
    }
  }

  void _save() {
    if (!_dirty) {
      Navigator.pop(context);
      return;
    }
    double r4(double v) => (v * 10000).roundToDouble() / 10000;
    _apply({
      'mode': 'crop',
      'rect': {'x': r4(_rect.left), 'y': r4(_rect.top), 'w': r4(_rect.width), 'h': r4(_rect.height)},
      'rotate': _turns * 90,
      'flipH': _flip,
    }, 'جارٍ القص بدقة كاملة...');
  }

  @override
  Widget build(BuildContext context) {
    final url = widget.image.url ?? widget.image.large ?? widget.image.thumb;
    final outW = (_rect.width * _rw).round();
    final outH = (_rect.height * _rh).round();
    return Scaffold(
      backgroundColor: const Color(0xFF111015),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111015),
        foregroundColor: Colors.white,
        title: Text(
          widget.title ?? 'قص الصورة',
          style: const TextStyle(color: Colors.white, fontFamily: 'Cairo', fontWeight: FontWeight.w700, fontSize: 18),
        ),
        actions: [
          TextButton(
            onPressed: _busy ? null : _save,
            child: const Text(
              'حفظ',
              style: TextStyle(color: Color(0xFFC9B2F2), fontWeight: FontWeight.w800, fontSize: 16),
            ),
          ),
        ],
      ),
      body: BusyOverlay(
        busy: _busy,
        label: _busyLabel,
        child: Column(
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(22),
                child: LayoutBuilder(
                  builder: (context, c) {
                    final scale = math.min(c.maxWidth / _rw, c.maxHeight / _rh);
                    _shown = Size(_rw * scale, _rh * scale);
                    return Center(
                      child: SizedBox(
                        width: _shown.width,
                        height: _shown.height,
                        child: GestureDetector(
                          onPanStart: (d) => _hit = _hitTest(d.localPosition),
                          onPanUpdate: (d) => _drag(d.delta),
                          onPanEnd: (_) => _hit = _Hit.none,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              Transform.flip(
                                flipX: _flip,
                                child: RotatedBox(
                                  quarterTurns: _turns,
                                  child: url == null
                                      ? const SizedBox()
                                      : CachedNetworkImage(
                                          imageUrl: url,
                                          fit: BoxFit.fill,
                                          placeholder: (_, _) => const Center(child: CircularProgressIndicator(color: Colors.white)),
                                        ),
                                ),
                              ),
                              CustomPaint(painter: _CropPainter(_rect)),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            Text('$outW × $outH بكسل', style: const TextStyle(color: Colors.white54, fontSize: 12.5)),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  for (final a in const [(null, 'حر'), (1.0, '1:1'), (0.8, '4:5'), (0.75, '3:4')])
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: ChoiceChip(
                        label: Text(a.$2),
                        selected: _aspect == a.$1,
                        onSelected: (_) => _setAspect(a.$1),
                        backgroundColor: const Color(0xFF26232E),
                        selectedColor: AppColors.primary,
                        labelStyle: const TextStyle(color: Colors.white, fontFamily: 'Cairo', fontWeight: FontWeight.w700),
                        side: BorderSide.none,
                        showCheckmark: false,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 0, 8, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _Tool(icon: Icons.rotate_left_rounded, label: 'تدوير', onTap: () => _rotate(3)),
                    _Tool(icon: Icons.rotate_right_rounded, label: 'تدوير', onTap: () => _rotate(1)),
                    _Tool(icon: Icons.flip_rounded, label: 'قلب', onTap: () => setState(() => _flip = !_flip)),
                    _Tool(
                      icon: Icons.crop_free_rounded,
                      label: 'قص الحواف',
                      onTap: () => _apply({'mode': 'trim'}, 'إزالة الحواف الفارغة...'),
                    ),
                    _Tool(
                      icon: Icons.crop_square_rounded,
                      label: 'إطار مربع',
                      onTap: () => _apply({'mode': 'trimSquare', 'padding': 0.06}, 'تأطير المنتج في مربع أبيض...'),
                    ),
                    _Tool(
                      icon: Icons.restart_alt_rounded,
                      label: 'إعادة',
                      onTap: () => setState(() {
                        _turns = 0;
                        _flip = false;
                        _aspect = null;
                        _rect = const Rect.fromLTWH(0, 0, 1, 1);
                      }),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Tool extends StatelessWidget {
  const _Tool({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(12),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 26),
          const SizedBox(height: 3),
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11.5)),
        ],
      ),
    ),
  );
}

class _CropPainter extends CustomPainter {
  _CropPainter(this.rect);
  final Rect rect;

  @override
  void paint(Canvas canvas, Size size) {
    final r = Rect.fromLTRB(rect.left * size.width, rect.top * size.height, rect.right * size.width, rect.bottom * size.height);
    final shade = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(Offset.zero & size)
      ..addRect(r);
    canvas.drawPath(shade, Paint()..color = const Color(0xAA000000));
    final line = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6;
    canvas.drawRect(r, line);
    // شبكة الأثلاث
    final grid = Paint()
      ..color = Colors.white38
      ..strokeWidth = 0.8;
    for (var i = 1; i < 3; i++) {
      final x = r.left + r.width * i / 3;
      final y = r.top + r.height * i / 3;
      canvas.drawLine(Offset(x, r.top), Offset(x, r.bottom), grid);
      canvas.drawLine(Offset(r.left, y), Offset(r.right, y), grid);
    }
    // مقابض الزوايا
    final h = Paint()
      ..color = Colors.white
      ..strokeWidth = 4.5
      ..strokeCap = StrokeCap.round;
    const k = 20.0;
    for (final c in [r.topLeft, r.topRight, r.bottomLeft, r.bottomRight]) {
      final sx = c.dx == r.left ? 1.0 : -1.0;
      final sy = c.dy == r.top ? 1.0 : -1.0;
      canvas.drawLine(c, c + Offset(k * sx, 0), h);
      canvas.drawLine(c, c + Offset(0, k * sy), h);
    }
  }

  @override
  bool shouldRepaint(_CropPainter old) => old.rect != rect;
}
