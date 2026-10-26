import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/motion/offscreen_pause.dart';
import '../../../core/perf/device_perf.dart';
import '../home_link.dart';
import '../../worlds/world_theme.dart';
import 'gallery_photo_card.dart';
import 'home_theme.dart';
import 'photo_shape_kit.dart';

/// صور متحركة أفقياً — حلقة سينمائية مع سحب يدوي ونقر موثوق لكل الصور.
class HomeImageMarquee extends StatefulWidget {
  final List<HomeMarqueeImage> images;
  final double height;
  final double speed;
  final double gap;

  /// زاوية البلاطات — تُتجاهل للأشكال ذات الزوايا المحسوبة (حبة، قوس، دائرة).
  final double radius;

  /// في الواجهة العربية تبدأ الحلقة والصورة الأولى عند الحافة اليمنى (بداية القراءة).
  final bool startFromEndInRtl;

  /// الحركة نحو اليمين بدل اليسار.
  final bool reverse;

  const HomeImageMarquee({
    super.key,
    required this.images,
    this.height = 120,
    this.speed = 5,
    this.gap = 12,
    this.radius = 14,
    this.startFromEndInRtl = false,
    this.reverse = false,
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

  String get linkSignature => '${navPath ?? ''}_${link ?? ''}_${linkType ?? ''}_${linkValue ?? ''}';

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
    with SingleTickerProviderStateMixin, MotionGateMixin {
  final GlobalKey _periodKey = GlobalKey();
  late final Ticker _ticker;

  /// إزاحة الشريط بالبكسل (تكبر = يتحرك المحتوى نحو اليسار)، وسرعته الحالية بكسل/ثانية.
  /// السرعة تقترب من سرعة التجوال بنعومة — لا وقوف ولا انطلاق مفاجئ.
  final ValueNotifier<double> _offset = ValueNotifier(0);
  double _velocity = 0;
  Duration _lastTick = Duration.zero;

  /// بعد ترك الشريط: ثوانٍ متبقية يكمل فيها القذف ويتباطأ قبل العودة للتجوال
  /// (تُعدّ بزمن الإطارات نفسه، لا بساعة الجهاز).
  double _coast = 0;
  static const _coastAfterDrag = 1.4;
  static const _coastAfterTap = 0.7;

  double _periodWidth = 0;
  double _viewportWidth = 0;
  bool _measurePending = false;
  bool _placed = false;
  bool _reduceMotion = false;
  bool _holding = false;
  bool _userDragging = false;
  Offset? _pointerDown;
  VelocityTracker? _tracker;
  ScrollHoldController? _scrollHold;
  static const _dragSlop = 8.0;

  /// الشريط يتحرك مع الصفحة وهي تُمرَّر — يتوقف فقط تحت إصبع العميلة نفسها.
  @override
  bool get pauseWhileParentScrolls => false;

  double get _pxPerSec => 18 + widget.speed.clamp(1, 10) * 7;

  /// سرعة التجوال (موجّهة). «تقليل الحركة» والأجهزة البسيطة: صفر — شريط يُسحب باليد.
  double get _cruise {
    if (_reduceMotion || DevicePerf.isLow) return 0;
    return widget.reverse ? -_pxPerSec : _pxPerSec;
  }

  double _estimatePeriodWidth() {
    if (widget.images.isEmpty) return 1;
    return widget.images.fold<double>(0, (sum, img) => sum + img.width + widget.gap);
  }

  double get _activePeriod => _periodWidth > 0 ? _periodWidth : _estimatePeriodWidth();

  int _copyCount(double viewportWidth, double period) {
    if (period <= 0) return 4;
    return math.max(3, (viewportWidth / period).ceil() + 2);
  }

  double _wrapPixels(double px, double period) {
    if (period <= 0) return 0;
    var v = px % period;
    if (v < 0) v += period;
    return v;
  }

  /// الإزاحة المرسومة: من 0 إلى −period دائماً — الحلقة متطابقة بالبكسل فلا فجوة.
  double _shift(double period) => -_wrapPixels(_offset.value, period);

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

  void _scheduleMeasure() {
    if (_measurePending) return;
    _measurePending = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _measurePending = false;
      _measure();
    });
  }

  /// في RTL تقف الصورة الأولى عند الحافة اليمنى (بداية القراءة).
  double _initialOffset(double period) {
    if (!widget.startFromEndInRtl ||
        Directionality.of(context) != TextDirection.rtl ||
        period <= 0 ||
        _viewportWidth <= 0) {
      return 0;
    }
    return _wrapPixels(widget.images.first.width - _viewportWidth, period);
  }

  void _measure() {
    if (!mounted || widget.images.isEmpty) return;
    final box = _periodKey.currentContext?.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) {
      _scheduleMeasure();
      return;
    }
    final measured = box.size.width;
    if (measured <= 0) return;
    if (_periodWidth <= 0 || (measured - _periodWidth).abs() > 0.5) {
      setState(() => _periodWidth = measured);
    }
    if (!_placed) {
      _placed = true;
      _offset.value = _initialOffset(measured);
      // يبدأ من الهدوء ويتسارع بنعومة — لا قفزة عند الظهور.
      _velocity = 0;
    }
    _syncTicker();
  }

  /// المؤقّت يعمل والشريط ظاهر وفيه حركة (تجوال أو قذف يتباطأ) — وإلا يتوقف فعلاً.
  void _syncTicker() {
    if (!mounted) return;
    final moving = !_holding && (_cruise != 0 || _velocity.abs() > 1 || _coast > 0);
    final shouldRun = _placed && motionAllowed && moving;
    if (shouldRun && !_ticker.isActive) {
      _lastTick = Duration.zero;
      _ticker.start();
    } else if (!shouldRun && _ticker.isActive) {
      _ticker.stop();
    }
  }

  void _onTick(Duration elapsed) {
    final dt = (elapsed - _lastTick).inMicroseconds / 1e6;
    _lastTick = elapsed;
    if (dt <= 0 || dt > 0.1 || _holding) return;
    if (_coast > 0) {
      // قذف العميلة: احتكاك ناعم حتى يهدأ.
      _coast -= dt;
      _velocity *= math.exp(-dt * 3.2);
    } else {
      // عودة سلسة لسرعة التجوال (≈ ثانية ونصف للوصول).
      _velocity += (_cruise - _velocity) * (1 - math.exp(-dt * 2.2));
    }
    if (_velocity.abs() < 0.5 && _cruise == 0) {
      _velocity = 0;
      _syncTicker();
      return;
    }
    final period = _activePeriod;
    _offset.value = _wrapPixels(_offset.value + _velocity * dt, period);
  }

  void _releaseScrollHold() {
    _scrollHold?.cancel();
    _scrollHold = null;
  }

  HomeMarqueeImage? _imageAtLocalX(double localX) {
    final period = _activePeriod;
    if (period <= 0 || widget.images.isEmpty) return null;
    final wrapped = _wrapPixels(localX - _shift(period), period);
    var x = 0.0;
    for (final image in widget.images) {
      if (wrapped >= x && wrapped < x + image.width) return image;
      x += image.width + widget.gap;
    }
    return null;
  }

  void _onPointerDown(PointerDownEvent event) {
    _pointerDown = event.position;
    _userDragging = false;
    _holding = true;
    _velocity = 0;
    _tracker = VelocityTracker.withKind(event.kind)..addPosition(event.timeStamp, event.position);
    _syncTicker();
  }

  void _onPointerMove(PointerMoveEvent event) {
    if (_pointerDown == null) return;
    _tracker?.addPosition(event.timeStamp, event.position);
    final fromDown = event.position - _pointerDown!;
    if (!_userDragging) {
      if (fromDown.dx.abs() < _dragSlop && fromDown.dy.abs() < _dragSlop) return;
      // سحب عمودي: الصفحة تتمرّر كالمعتاد والشريط ينتظر الإفلات.
      if (fromDown.dx.abs() <= fromDown.dy.abs()) return;
      _userDragging = true;
      _scrollHold = Scrollable.maybeOf(context)?.position.hold(() {});
    }
    _offset.value = _wrapPixels(_offset.value - event.delta.dx, _activePeriod);
  }

  void _release({Velocity? velocity}) {
    _releaseScrollHold();
    final vx = velocity?.pixelsPerSecond.dx ?? 0;
    // يكمل باتجاه القذف (بسقف معقول) ثم يتباطأ ويعود للتجوال بعد المهلة.
    _velocity = _userDragging ? (-vx).clamp(-2400.0, 2400.0) : 0;
    _coast = _userDragging ? _coastAfterDrag : _coastAfterTap;
    _holding = false;
    _userDragging = false;
    _pointerDown = null;
    _tracker = null;
    _syncTicker();
  }

  void _onPointerUp(PointerUpEvent event) {
    if (!_userDragging && _pointerDown != null) {
      final moved = (event.position - _pointerDown!).distance;
      if (moved <= _dragSlop) {
        _imageAtLocalX(event.localPosition.dx)?.openLink(context);
      }
    }
    _release(velocity: _userDragging ? _tracker?.getVelocity() : null);
  }

  void _onPointerCancel(PointerCancelEvent event) => _release();

  @override
  void initState() {
    super.initState();
    _ticker = createTicker(_onTick);
    _scheduleMeasure();
  }

  @override
  void onMotionGateChanged(bool allowed) => _syncTicker();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reduce = MediaQuery.disableAnimationsOf(context);
    if (reduce == _reduceMotion) return;
    _reduceMotion = reduce;
    _syncTicker();
  }

  @override
  void didUpdateWidget(HomeImageMarquee old) {
    super.didUpdateWidget(old);
    if (_imagesChanged(old.images, widget.images) ||
        old.gap != widget.gap ||
        old.height != widget.height ||
        old.speed != widget.speed ||
        old.reverse != widget.reverse) {
      _periodWidth = 0;
      _placed = false;
      _holding = false;
      _userDragging = false;
      _pointerDown = null;
      _releaseScrollHold();
      _ticker.stop();
      _scheduleMeasure();
      scheduleMotionGateCheck();
    }
  }

  @override
  void dispose() {
    _releaseScrollHold();
    _ticker.dispose();
    _offset.dispose();
    super.dispose();
  }

  List<Widget> _tileWidgets(int periodIndex) {
    return [
      for (var i = 0; i < widget.images.length; i++) ...[
        _MarqueeTile(
          key: ValueKey('mq-$periodIndex-$i-${widget.images[i].url}'),
          image: widget.images[i],
          defaultHeight: widget.height,
          radius: widget.radius,
        ),
        SizedBox(width: widget.gap),
      ],
    ];
  }

  Widget _period({Key? key, required int periodIndex}) {
    return Row(
      key: key,
      mainAxisSize: MainAxisSize.min,
      textDirection: TextDirection.ltr,
      children: _tileWidgets(periodIndex),
    );
  }

  /// مساحة فوق وتحت البلاطات ليظهر ظلها كاملاً بدل أن يُقصّ مسطّحاً.
  static const _shadowRoom = 10.0;

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) return const SizedBox.shrink();
    if (_periodWidth <= 0) _scheduleMeasure();
    final canvas = context.worldTheme.canvas;

    return LayoutBuilder(
      builder: (context, constraints) {
        final viewportW = constraints.maxWidth.isFinite ? constraints.maxWidth : MediaQuery.sizeOf(context).width;
        _viewportWidth = viewportW;
        final period = _activePeriod;
        final copies = _copyCount(viewportW, period);

        final strip = RepaintBoundary(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            textDirection: TextDirection.ltr,
            children: [
              for (var i = 0; i < copies; i++)
                _period(key: i == 0 ? _periodKey : ValueKey('period-$i'), periodIndex: i),
            ],
          ),
        );

        Widget fade(AlignmentGeometry from) => IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: from,
                    end: from == AlignmentDirectional.centerStart
                        ? AlignmentDirectional.centerEnd
                        : AlignmentDirectional.centerStart,
                    colors: [canvas, canvas.withValues(alpha: 0)],
                  ),
                ),
              ),
            );

        return RepaintBoundary(
          child: ClipRect(
            clipBehavior: Clip.hardEdge,
            child: SizedBox(
              height: widget.height + _shadowRoom * 2,
              width: viewportW,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ExcludeSemantics(
                    child: IgnorePointer(
                      child: OverflowBox(
                        alignment: Alignment.centerLeft,
                        maxWidth: double.infinity,
                        child: ValueListenableBuilder<double>(
                          valueListenable: _offset,
                          child: strip,
                          builder: (_, __, child) => Transform.translate(
                            offset: Offset(_shift(_activePeriod), 0),
                            child: child,
                          ),
                        ),
                      ),
                    ),
                  ),
                  // حوافّ تذوب في الخلفية: الصور تدخل وتخرج بنعومة بدل قصّ حاد.
                  PositionedDirectional(start: 0, top: 0, bottom: 0, width: 22, child: fade(AlignmentDirectional.centerStart)),
                  PositionedDirectional(end: 0, top: 0, bottom: 0, width: 22, child: fade(AlignmentDirectional.centerEnd)),
                  _MarqueeSemanticsLayer(images: widget.images),
                  Listener(
                    behavior: HitTestBehavior.translucent,
                    onPointerDown: _onPointerDown,
                    onPointerMove: _onPointerMove,
                    onPointerUp: _onPointerUp,
                    onPointerCancel: _onPointerCancel,
                    child: const SizedBox.expand(),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

/// زر لكل صورة لقارئ الشاشة (TalkBack/VoiceOver) — شرائح ثابتة شفافة بعرض الشريط،
/// لا ترسم شيئاً ولا تلتقط اللمس؛ النقر الفعلي يمرّ عبر Listener فوقها.
class _MarqueeSemanticsLayer extends ConsumerWidget {
  final List<HomeMarqueeImage> images;

  const _MarqueeSemanticsLayer({required this.images});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.watch(stringsProvider);
    return IgnorePointer(
      child: Semantics(
        container: true,
        explicitChildNodes: true,
        child: Row(
          children: [
            for (final img in images)
              Expanded(
                child: Semantics(
                  button: true,
                  image: true,
                  label: PhotoTileData.fromMap(img.item).titleForLang(lang) ?? s.homeMediaPhoto,
                  onTap: () => img.openLink(context),
                  child: const SizedBox.expand(),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _MarqueeTile extends StatelessWidget {
  final HomeMarqueeImage image;
  final double defaultHeight;
  final double radius;

  const _MarqueeTile({
    super.key,
    required this.image,
    required this.defaultHeight,
    required this.radius,
  });

  static const _shapeOwnsRadius = {'pill', 'arch', 'circle'};

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
      showCaption: false,
      // للشريط مساحة فوق البلاطات وتحتها — ظل ناعم يرفعها عن الخلفية.
      showShadow: true,
      cornerRadiusOverride: _shapeOwnsRadius.contains(image.shape) ? null : radius,
    );
  }
}
