import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/brand/brand_logo_paths.dart';
import '../../core/theme/app_fonts.dart';

/// لوحة "أوركيد ووردي" — ألوان الشعار المعتمدة.
abstract final class SplashTheme {
  /// لون الخلفية — نفسه في شاشة الإقلاع الأصلية (Android/iOS) حتى لا يظهر وميض.
  static const background = Color(0xFFFFFAFB);
  static const orchidLight = Color(0xFFB07AE6);
  static const orchid = Color(0xFF8A55C9);
  static const rose = Color(0xFFC2508A);
  static const roseLight = Color(0xFFE7A6C4);
  static const ink = Color(0xFF3B2650);
  static const inkDeep = Color(0xFF22162F);
}

/// شاشة الافتتاح — موشن جرافيك بشعار الشركة الحقيقي:
///
/// 1. البذرة: نقطة أوركيد تظهر بارتداد مرن في وسط الشاشة.
/// 2. الانقسام: تنقسم لأربع نقاط تطير في أقواس إلى أماكنها.
/// 3. النمو: كل نقطة ملوّنة تنمو إلى خصلة شعر من طرفها كضربة فرشاة،
///    والنقطة الداكنة تتمدد وتنضغط لتصبح الحاجب.
/// 4. الانزلاق: الرمز ينزلق لمكانه في الشعار الكامل، وحروف alhayat ترتفع
///    واحداً تلو الآخر بارتداد، ثم تهبط حروف deema.
/// 5. الختام: "ديما الحياة" بالعربية تحته.
///
/// لمسة في أي مكان تُنهي المشهد فوراً، و[onFinished] يُستدعى مرة واحدة عند
/// اكتماله (طبيعياً أو باللمس) — التطبيق ينتقل للرئيسية حينها.
class SplashScreen extends StatefulWidget {
  final SplashIntro intro;
  final VoidCallback? onFinished;

  const SplashScreen({
    super.key,
    this.intro = SplashIntro.full,
    this.onFinished,
  });

  /// مدة المشهد الكامل.
  static const introDuration = Duration(milliseconds: 4300);

  /// بداية النسخة المختصرة (نسبة من المشهد): لحظة انزلاق الرمز المكتمل لمكانه.
  static const double shortStart = _T.glide / _T.end;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

/// كيف يُعرض مشهد الافتتاح.
enum SplashIntro {
  /// المشهد كله (4.3 ث): أول تشغيل، بعد كل تحديث للتطبيق، ومرة كل أسبوع.
  full,

  /// من انزلاق الرمز لمكانه حتى الختام (نحو ثانيتين) — للزبونة العائدة.
  short,
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: SplashScreen.introDuration,
  );
  late final bool _short = widget.intro == SplashIntro.short;
  late bool _browHaptic;
  late bool _settleHaptic;
  bool _finished = false;

  @override
  void initState() {
    super.initState();
    if (_short) _c.value = SplashScreen.shortStart;
    // ما سبق نقطة البداية لا يهتز (المختصرة تبدأ بعد ولادة الحاجب).
    _browHaptic = _seconds >= _T.brow;
    _settleHaptic = _seconds >= _T.settle;
    _c.addListener(() {
      // لمستان خفيفتان: ولادة الحاجب، ثم استقرار الشعار.
      if (!_browHaptic && _seconds >= _T.brow) {
        _browHaptic = true;
        HapticFeedback.lightImpact();
      }
      if (!_settleHaptic && _seconds >= _T.settle) {
        _settleHaptic = true;
        HapticFeedback.mediumImpact();
      }
    });
    _c.addStatusListener((status) {
      if (status == AnimationStatus.completed) _finish();
    });
    _c.forward();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // من فعّلت "تقليل الحركة": المشهد يظهر مكتملاً مباشرة.
    if (MediaQuery.disableAnimationsOf(context) && !_c.isCompleted) {
      _skipToEnd();
    }
  }

  /// يقفز للإطار الأخير بلا اهتزاز (اللمسات كانت ستنطلق كلها معاً).
  void _skipToEnd() {
    if (_c.isCompleted) return;
    _browHaptic = true;
    _settleHaptic = true;
    _c.value = 1;
  }

  /// يُبلغ التطبيق بعد الإطار الحالي: قد يكتمل المشهد أثناء البناء
  /// (تقليل الحركة)، والتطبيق يعيد بناء نفسه حينها.
  void _finish() {
    if (_finished) return;
    _finished = true;
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => widget.onFinished?.call(),
    );
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  double get _seconds =>
      _c.value * SplashScreen.introDuration.inMilliseconds / 1000;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: SplashTheme.background,
      ),
      child: Scaffold(
        backgroundColor: SplashTheme.background,
        body: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: _skipToEnd,
          child: LayoutBuilder(
            builder: (context, box) {
              final size = box.biggest;
              final scale = math.min(
                (size.width - 56) / BrandLogo.bounds.width,
                1.2,
              );
              final center = Offset(size.width / 2, size.height * 0.44);
              final logoBottom =
                  center.dy + BrandLogo.bounds.height * scale / 2;

              return AnimatedBuilder(
                animation: _c,
                builder: (context, _) {
                  final t = _seconds;
                  // المختصرة تبدأ بالرمز مكتملاً: يظهر بتلاشٍ سريع بدل أن يقفز.
                  final entrance = _short
                      ? _ease(t, _T.glide, 0.22, Curves.easeOutCubic)
                      : 1.0;
                  return Stack(
                    fit: StackFit.expand,
                    children: [
                      // ضوء أبيض خافت في المركز — عمق بلا ازدحام.
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: RadialGradient(
                            center: Alignment(0, -0.12),
                            radius: 0.85,
                            colors: [Colors.white, SplashTheme.background],
                          ),
                        ),
                      ),
                      Opacity(
                        opacity: entrance,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            // هالة تتنفس بألوان الهوية خلف الشعار.
                            CustomPaint(
                              painter: _AuraPainter(t: t, center: center),
                            ),
                            CustomPaint(
                              painter: _LogoMotionPainter(
                                t: t,
                                scale: scale,
                                center: center,
                              ),
                            ),
                            Positioned(
                              left: 0,
                              right: 0,
                              top: logoBottom + 30,
                              child: _Tagline(t: t),
                            ),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }
}

/// «PERFUMES & COSMETICS» بين خطّين رفيعين — تظهر مع مرور حزمة الضوء على
/// الشعار، لحظة ختام واحدة.
class _Tagline extends StatelessWidget {
  final double t;
  const _Tagline({required this.t});

  @override
  Widget build(BuildContext context) {
    final tag = _ease(t, _T.shine + 0.06, 0.8, Curves.easeOutQuart);
    final line = _ease(t, _T.shine - 0.04, 0.65, Curves.easeInOutCubic);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _Hairline(width: 34 * line, fadeToStart: true),
          const SizedBox(width: 12),
          // لا يتجاوز عرض الشاشة أبداً: يصغر تلقائياً إن ضاقت المساحة.
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Opacity(
                opacity: tag,
                child: Text(
                  'PERFUMES & COSMETICS',
                  maxLines: 1,
                  textDirection: TextDirection.ltr,
                  style: TextStyle(
                    fontFamily: AppFonts.display,
                    fontSize: 12.5,
                    fontWeight: FontWeight.w500,
                    // الحروف تبدأ متباعدة ثم تتقارب حتى تستقر.
                    letterSpacing: 3.6 + 5 * (1 - tag),
                    color: SplashTheme.ink.withValues(alpha: 0.82),
                    height: 1,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          _Hairline(width: 34 * line, fadeToStart: false),
        ],
      ),
    );
  }
}

/// تقدّم 0→1 لحركة تبدأ عند [start] ثانية وتدوم [dur].
double _ease(
  double t,
  double start,
  double dur, [
  Curve curve = Curves.linear,
]) {
  final v = ((t - start) / dur).clamp(0.0, 1.0);
  return curve.transform(v);
}

double _lerp(double a, double b, double v) => a + (b - a) * v;

/// الجدول الزمني للمشهد (بالثواني) — مكان واحد لضبط الإيقاع.
abstract final class _T {
  static const seed = 0.0; // ظهور النقطة وانضغاطها
  static const pop = 0.18; // الانفجار المرن
  static const orbit = 0.58; // رقصة النقاط حول المركز
  static const orbitDur = 0.62;
  static const fly = 1.12; // الانطلاق نحو الأماكن
  static const flyDur = 0.42;
  static const grow = 1.4; // نمو الخصل (متتابعة)
  static const growGap = 0.1;
  static const growDur = 0.62;
  static const brow = 1.56;
  static const spark = 1.86;
  static const breath = 2.0; // تنفّس الرمز المكتمل
  static const glide = 2.22;
  static const glideDur = 0.7;
  static const letters = 2.42;
  static const deema = 2.9;
  static const settle = 3.32; // استقرار الشعار + اهتزاز خفيف
  static const shine = 3.36;
  static const sparkles = 3.5;
  static const end = 4.3; // = SplashScreen.introDuration
}

class _LogoMotionPainter extends CustomPainter {
  final double t;
  final double scale;
  final Offset center;

  _LogoMotionPainter({
    required this.t,
    required this.scale,
    required this.center,
  });

  static const _strandShaders = [
    [SplashTheme.orchidLight, SplashTheme.orchid, SplashTheme.rose],
    [SplashTheme.roseLight, SplashTheme.rose, SplashTheme.rose],
    [SplashTheme.orchidLight, SplashTheme.orchid, SplashTheme.rose],
  ];
  static const _dotColors = [
    SplashTheme.orchid,
    SplashTheme.rose,
    SplashTheme.orchidLight,
    SplashTheme.ink,
  ];

  Paint _gradient(Rect r, List<Color> colors, [double opacity = 1]) => Paint()
    ..isAntiAlias = true
    ..shader = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [for (final c in colors) c.withValues(alpha: opacity)],
    ).createShader(r);

  Offset _quad(Offset a, Offset c, Offset b, double v) {
    final u = 1 - v;
    return a * (u * u) + c * (2 * u * v) + b * (v * v);
  }

  /// موضع نقطة [i] أثناء رقصتها حول المركز.
  Offset _orbitPos(int i, double u) {
    final angle = -math.pi / 2 + i * math.pi / 2 + u * math.pi * 1.6;
    final r = 34 * Curves.easeOutCubic.transform(u);
    return center + Offset(math.cos(angle), math.sin(angle)) * r;
  }

  @override
  void paint(Canvas canvas, Size size) {
    // تنفّس الرمز المكتمل ثم انزلاقه لمكانه في الشعار الكامل.
    final breath = math.sin(_ease(t, _T.breath, 0.34) * math.pi) * 0.045;
    final glide = _ease(t, _T.glide, _T.glideDur, Curves.easeInOutCubic);
    final big = scale * 1.55 * (1 + breath);
    final markScale = _lerp(big, scale, glide);
    final markOrigin = Offset.lerp(
      center - BrandLogo.markBounds.center * big,
      center - BrandLogo.bounds.center * scale,
      glide,
    )!;
    // استقرار نهائي: نبضة صغيرة للشعار كله.
    final settle = math.sin(_ease(t, _T.settle, 0.3) * math.pi) * 0.018;
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.scale(1 + settle);
    canvas.translate(-center.dx, -center.dy);

    final logoOrigin = center - BrandLogo.bounds.center * scale;
    Offset toMark(Offset p) => markOrigin + p * markScale;

    // ── 1: البذرة — ظهور، انضغاط استعداداً، ثم انفجار مرن مع تموّجين ────
    final appear = _ease(t, _T.seed, 0.2, Curves.easeOutCubic);
    final pop = _ease(t, _T.pop, 0.55, Curves.elasticOut);
    for (var k = 0; k < 2; k++) {
      final ripple = _ease(
        t,
        _T.pop + 0.05 + k * 0.14,
        0.75,
        Curves.easeOutCubic,
      );
      if (ripple > 0 && ripple < 1) {
        canvas.drawCircle(
          center,
          10 + 80 * ripple,
          Paint()
            ..style = PaintingStyle.stroke
            ..strokeWidth = 1.4 - k * 0.4
            ..color = SplashTheme.orchid.withValues(
              alpha: (0.38 - k * 0.12) * (1 - ripple),
            ),
        );
      }
    }
    if (t < _T.orbit) {
      // الانضغاط: عرض أكبر وارتفاع أقل، ثم ينطلق منه الانفجار المرن مباشرة.
      final double sx, sy, r;
      if (t < _T.pop) {
        sx = 0.6 + 0.5 * appear;
        sy = math.max(0.01, 0.6 * appear);
        r = 7;
      } else {
        sx = _lerp(1.1, 1, pop);
        sy = _lerp(0.6, 1, pop);
        r = _lerp(7, 9, pop);
      }
      canvas.save();
      canvas.translate(center.dx, center.dy);
      canvas.scale(sx, sy);
      canvas.drawCircle(Offset.zero, r, Paint()..color = SplashTheme.orchid);
      canvas.restore();
    } else {
      // ── 2: رقصة النقاط حول المركز ثم الانطلاق نحو أماكنها ─────────────
      final anchors = [
        for (final s in BrandLogo.strands) s.tip,
        BrandLogo.brow.bounds.center,
      ];
      final u = _ease(t, _T.orbit, _T.orbitDur, Curves.easeInOutSine);
      final f = _ease(t, _T.fly, _T.flyDur, Curves.easeInOutCubic);
      for (var i = 0; i < 4; i++) {
        final growStart = i < 3 ? _T.grow + i * _T.growGap : _T.brow;
        final fade = 1 - _ease(t, growStart, 0.16);
        if (fade <= 0) continue;
        final from = _orbitPos(i, u);
        final target = toMark(anchors[i]);
        final dir = target - from;
        final normal = Offset(-dir.dy, dir.dx) * (i.isEven ? 0.3 : -0.3);
        final ctrl = from + dir * 0.5 + normal;
        Offset at(double v) =>
            f <= 0 ? _orbitPos(i, v) : _quad(from, ctrl, target, v);
        final p = f <= 0 ? from : at(f);
        final color = _dotColors[i];
        final radius = _lerp(7, 5.5, f) * fade;
        // ذيل مذنّب خلف النقطة أثناء الحركة.
        for (var k = 1; k <= 6; k++) {
          final back = f > 0
              ? at((f - k * 0.04).clamp(0.0, 1.0))
              : _orbitPos(i, (u - k * 0.035).clamp(0.0, 1.0));
          canvas.drawCircle(
            back,
            radius * (1 - k * 0.12),
            Paint()..color = color.withValues(alpha: 0.14 * (1 - k / 7) * fade),
          );
        }
        canvas.drawCircle(
          p,
          radius,
          Paint()..color = color.withValues(alpha: fade),
        );
      }
    }

    // ── 3: نمو الخصل بتأرجح الشعر، والحاجب يتمدد وينضغط ───────────────
    canvas.save();
    canvas.translate(markOrigin.dx, markOrigin.dy);
    canvas.scale(markScale);
    for (var i = 0; i < 3; i++) {
      final s = BrandLogo.strands[i];
      final start = _T.grow + i * _T.growGap;
      final grow = _ease(t, start, _T.growDur, Curves.easeOutCubic);
      if (grow <= 0) continue;
      // تأرجح: الخصلة تبدأ مائلة حول طرفها ثم تستقر بارتداد ناعم.
      final swing =
          (1 - _ease(t, start, _T.growDur + 0.25, Curves.easeOutBack)) *
          (i.isEven ? -0.16 : 0.12);
      canvas.save();
      canvas.translate(s.tip.dx, s.tip.dy);
      canvas.rotate(swing);
      canvas.translate(-s.tip.dx, -s.tip.dy);
      if (grow < 1) {
        canvas.clipPath(
          Path()
            ..addOval(Rect.fromCircle(center: s.tip, radius: s.reach * grow)),
        );
      }
      final glowA = math.sin(grow * math.pi) * 0.45;
      if (glowA > 0.01) {
        canvas.drawPath(
          s.path,
          Paint()
            ..color = _strandShaders[i][1].withValues(alpha: glowA)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5),
        );
      }
      canvas.drawPath(s.path, _gradient(s.bounds, _strandShaders[i]));
      canvas.restore();
    }
    if (t >= _T.brow) {
      final b = BrandLogo.brow;
      final c = b.bounds.center;
      final sx = _lerp(0.18, 1, _ease(t, _T.brow, 0.6, Curves.elasticOut));
      final sy = _lerp(1.9, 1, _ease(t, _T.brow, 0.45, Curves.easeOutBack));
      canvas.save();
      canvas.translate(c.dx, c.dy);
      canvas.scale(sx, sy);
      canvas.translate(-c.dx, -c.dy);
      canvas.drawPath(
        b.path,
        _gradient(b.bounds, const [SplashTheme.ink, SplashTheme.inkDeep]),
      );
      canvas.restore();
    }
    canvas.restore();

    // ── نجمة تلمع بجانب الخصل عند اكتمال الرمز ───────────────────────────
    final spark = _ease(t, _T.spark, 0.7);
    if (spark > 0 && spark < 1) {
      _star(
        canvas,
        toMark(const Offset(298, 18)),
        10 * math.sin(spark * math.pi),
        spark * math.pi / 3,
        SplashTheme.orchidLight.withValues(alpha: math.sin(spark * math.pi)),
      );
    }

    // ── 4: الحروف — ترتفع بتأرجح، ثم تهبط deema بارتداد ─────────────────
    canvas.save();
    canvas.translate(logoOrigin.dx, logoOrigin.dy);
    canvas.scale(scale);
    final rising = [...BrandLogo.al, ...BrandLogo.hayat];
    for (var k = 0; k < rising.length; k++) {
      final s = rising[k];
      final start = _T.letters + k * 0.065;
      final v = _ease(t, start, 0.5, Curves.easeOutBack);
      if (v <= 0) continue;
      final tilt = (1 - _ease(t, start, 0.6, Curves.easeOutBack)) * -0.32;
      final isAl = k < 2;
      _drawLetter(
        canvas,
        s,
        v,
        dy: (1 - v) * 26,
        tilt: tilt,
        anchor: Offset(s.bounds.center.dx, s.bounds.bottom),
        colors: isAl
            ? const [
                SplashTheme.orchidLight,
                SplashTheme.orchid,
                SplashTheme.rose,
              ]
            : const [SplashTheme.ink, SplashTheme.inkDeep],
        gradientRect: isAl
            ? const Rect.fromLTRB(1, 68, 53, 119)
            : const Rect.fromLTRB(63, 68, 250, 136),
      );
    }
    for (var k = 0; k < BrandLogo.deema.length; k++) {
      final s = BrandLogo.deema[k];
      final v = _ease(t, _T.deema + k * 0.055, 0.5, Curves.elasticOut);
      if (v <= 0) continue;
      _drawLetter(
        canvas,
        s,
        v,
        dy: -(1 - v) * 18,
        tilt: 0,
        anchor: Offset(s.bounds.center.dx, s.bounds.top),
        colors: const [
          SplashTheme.orchidLight,
          SplashTheme.orchid,
          SplashTheme.rose,
        ],
        gradientRect: const Rect.fromLTRB(77, 55, 182, 78),
      );
    }

    // ── حزمة ضوء تمرّ على الشعار المكتمل ────────────────────────────────
    final shine = _ease(t, _T.shine, 0.75, Curves.easeInOutSine);
    if (shine > 0 && shine < 1) {
      const b = BrandLogo.bounds;
      final x = _lerp(b.left - 60, b.right + 60, shine);
      final band = Paint()
        ..shader = LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [
            Colors.white.withValues(alpha: 0),
            Colors.white.withValues(alpha: 0.6),
            Colors.white.withValues(alpha: 0),
          ],
        ).createShader(Rect.fromLTRB(x - 40, b.top, x + 40, b.bottom));
      for (final s in [
        ...BrandLogo.al,
        ...BrandLogo.hayat,
        ...BrandLogo.deema,
        ...BrandLogo.strands,
        BrandLogo.brow,
      ]) {
        if (s.bounds.right < x - 40 || s.bounds.left > x + 40) continue;
        canvas.drawPath(s.path, band);
      }
    }

    // ── لمعات ختامية حول الشعار ─────────────────────────────────────────
    const twinkles = [
      (Offset(-6, 40), 0.0, SplashTheme.orchidLight),
      (Offset(150, 30), 0.12, SplashTheme.roseLight),
      (Offset(262, 146), 0.24, SplashTheme.orchid),
      (Offset(70, 140), 0.18, SplashTheme.rose),
    ];
    for (final (p, delay, color) in twinkles) {
      final v = _ease(t, _T.sparkles + delay, 0.6);
      if (v <= 0 || v >= 1) continue;
      final a = math.sin(v * math.pi);
      _star(canvas, p, 6 * a, v * math.pi / 2, color.withValues(alpha: a));
    }
    canvas.restore();
    canvas.restore();
  }

  void _star(Canvas canvas, Offset p, double r, double rot, Color color) {
    if (r <= 0) return;
    final star = Path()
      ..moveTo(p.dx, p.dy - r)
      ..quadraticBezierTo(p.dx, p.dy, p.dx + r, p.dy)
      ..quadraticBezierTo(p.dx, p.dy, p.dx, p.dy + r)
      ..quadraticBezierTo(p.dx, p.dy, p.dx - r, p.dy)
      ..quadraticBezierTo(p.dx, p.dy, p.dx, p.dy - r)
      ..close();
    canvas.save();
    canvas.translate(p.dx, p.dy);
    canvas.rotate(rot);
    canvas.translate(-p.dx, -p.dy);
    canvas.drawPath(star, Paint()..color = color);
    canvas.restore();
  }

  void _drawLetter(
    Canvas canvas,
    BrandShape s,
    double v, {
    required double dy,
    required double tilt,
    required Offset anchor,
    required List<Color> colors,
    required Rect gradientRect,
  }) {
    final opacity = (v * 2).clamp(0.0, 1.0);
    final sc = _lerp(0.4, 1, v.clamp(0.0, 1.25));
    canvas.save();
    canvas.translate(anchor.dx, anchor.dy + dy);
    canvas.rotate(tilt);
    canvas.scale(sc);
    canvas.translate(-anchor.dx, -anchor.dy);
    canvas.drawPath(s.path, _gradient(gradientRect, colors, opacity));
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _LogoMotionPainter old) =>
      old.t != t || old.scale != scale || old.center != center;
}

class _Hairline extends StatelessWidget {
  final double width;
  final bool fadeToStart;
  const _Hairline({required this.width, required this.fadeToStart});

  @override
  Widget build(BuildContext context) {
    const c = SplashTheme.orchid;
    return Container(
      width: width,
      height: 1,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: fadeToStart
              ? [c.withValues(alpha: 0), c.withValues(alpha: 0.7)]
              : [c.withValues(alpha: 0.7), c.withValues(alpha: 0)],
        ),
      ),
    );
  }
}

/// هالة ناعمة بالأوركيد والوردي تظهر ببطء وتنجرف حول المركز.
class _AuraPainter extends CustomPainter {
  final double t;
  final Offset center;
  _AuraPainter({required this.t, required this.center});

  @override
  void paint(Canvas canvas, Size size) {
    final v = _ease(t, 0.3, 1.4, Curves.easeOutCubic);
    if (v <= 0) return;
    void orb(Offset c, double r, Color color, double a) {
      final rect = Rect.fromCircle(center: c, radius: r);
      canvas.drawCircle(
        c,
        r,
        Paint()
          ..shader = RadialGradient(
            colors: [
              color.withValues(alpha: a * v),
              color.withValues(alpha: 0),
            ],
          ).createShader(rect),
      );
    }

    final w = size.width;
    orb(
      center +
          Offset(
            -w * 0.22 + 10 * math.sin(t * 0.9),
            -70 + 8 * math.cos(t * 0.7),
          ),
      w * 0.62,
      SplashTheme.orchidLight,
      0.16,
    );
    orb(
      center +
          Offset(w * 0.24 + 10 * math.cos(t * 0.8), 60 + 8 * math.sin(t * 0.6)),
      w * 0.58,
      SplashTheme.roseLight,
      0.16,
    );
  }

  @override
  bool shouldRepaint(covariant _AuraPainter old) =>
      old.t != t || old.center != center;
}
