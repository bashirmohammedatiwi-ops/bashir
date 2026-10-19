import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/motion/offscreen_pause.dart';
import '../../../core/perf/device_perf.dart';
import '../home_link.dart';
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
  late final AnimationController _ctrl;

  double _periodWidth = 0;
  double _viewportWidth = 0;
  bool _measurePending = false;
  bool _started = false;
  bool _reduceMotion = false;
  bool _userDragging = false;
  Offset? _pointerDown;
  ScrollHoldController? _scrollHold;
  static const _dragSlop = 8.0;

  double get _pxPerSec => 24 + widget.speed.clamp(1, 10) * 10;

  /// الحركة الدائمة مسموحة؟ «تقليل الحركة» والأجهزة البسيطة: شريط ثابت يُسحب باليد.
  bool get _autoMotion => !_reduceMotion && !DevicePerf.isLow;

  double _estimatePeriodWidth() {
    if (widget.images.isEmpty) return 1;
    return widget.images.fold<double>(0, (sum, img) => sum + img.width + widget.gap);
  }

  double get _activePeriod => _periodWidth > 0 ? _periodWidth : _estimatePeriodWidth();

  /// تكرارات كافية لتغطية العرض أثناء الحلقة (في الاتجاهين).
  int _copyCount(double viewportWidth, double period) {
    if (period <= 0) return 4;
    return math.max(3, (viewportWidth / period).ceil() + 2);
  }

  /// إزاحة الشريط الحالية بالبكسل — للأمام: من 0 إلى −period، وبالعكس: من −period إلى 0
  /// (فلا تنفتح فجوة فارغة على اليسار في الوضع المعكوس).
  double _shift(double period) =>
      widget.reverse ? (_ctrl.value - 1) * period : -_ctrl.value * period;

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

  /// قيمة البداية: في RTL تقف الصورة الأولى عند الحافة اليمنى للشريط.
  double _initialValue(double period) {
    if (!widget.startFromEndInRtl ||
        Directionality.of(context) != TextDirection.rtl ||
        period <= 0 ||
        _viewportWidth <= 0) {
      return 0;
    }
    final firstW = widget.images.first.width;
    // نريد: shift + firstW ≡ viewport (mod period).
    final px = widget.reverse
        ? _wrapPixels(_viewportWidth - firstW, period)
        : _wrapPixels(firstW - _viewportWidth, period);
    return px / period;
  }

  void _applyLoopDuration({required double period, double? startValue}) {
    final ms = (period / _pxPerSec * 1000).round().clamp(6000, 120000);
    final progress = startValue ?? _ctrl.value;
    _ctrl
      ..stop()
      ..duration = Duration(milliseconds: ms)
      ..value = progress;
    // «تقليل الحركة»/جهاز بسيط/خارج الشاشة: شريط ثابت يُسحب باليد فقط.
    if (_autoMotion && motionAllowed) _ctrl.repeat();
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

    final periodChanged = _periodWidth <= 0 || (measured - _periodWidth).abs() > 0.5;
    if (periodChanged) {
      setState(() => _periodWidth = measured);
    }

    if (_userDragging) return;
    if (!_started) {
      _started = true;
      _applyLoopDuration(period: measured, startValue: _initialValue(measured));
    } else if (periodChanged || (!_ctrl.isAnimating && _autoMotion && motionAllowed)) {
      _applyLoopDuration(period: measured);
    }
  }

  void _pauseMotion() {
    if (_ctrl.isAnimating) _ctrl.stop();
  }

  void _resumeMotion() {
    if (!mounted || _periodWidth <= 0 || _userDragging || !_autoMotion) return;
    if (!motionAllowed) return;
    if (!_ctrl.isAnimating) _ctrl.repeat();
  }

  void _releaseScrollHold() {
    _scrollHold?.cancel();
    _scrollHold = null;
  }

  /// يحسب أي صورة وُجد النقر عليها حسب موضع الإزاحة الحالي.
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
    _pauseMotion();
  }

  void _onPointerMove(PointerMoveEvent event) {
    if (_pointerDown == null) return;

    final deltaFromDown = event.position - _pointerDown!;
    if (!_userDragging) {
      if (deltaFromDown.dx.abs() < _dragSlop && deltaFromDown.dy.abs() < _dragSlop) {
        return;
      }
      if (deltaFromDown.dx.abs() <= deltaFromDown.dy.abs()) return;
      _userDragging = true;
      _scrollHold = Scrollable.maybeOf(context)?.position.hold(() {});
    }

    if (!_userDragging) return;

    final period = _activePeriod;
    if (period <= 0) return;
    // الشريط يتبع الإصبع في الاتجاهين — القيمة تزيد عكس الإزاحة للأمام ومعها في المعكوس.
    final dir = widget.reverse ? -1.0 : 1.0;
    final px = _wrapPixels(_ctrl.value * period - dir * event.delta.dx, period);
    _ctrl.value = px / period;
  }

  void _onPointerUp(PointerUpEvent event) {
    if (!_userDragging && _pointerDown != null) {
      final moved = (event.position - _pointerDown!).distance;
      if (moved <= _dragSlop) {
        final image = _imageAtLocalX(event.localPosition.dx);
        image?.openLink(context);
      }
    }
    _releaseScrollHold();
    _userDragging = false;
    _pointerDown = null;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _resumeMotion();
    });
  }

  void _onPointerCancel(PointerCancelEvent event) {
    _releaseScrollHold();
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
  void onMotionGateChanged(bool allowed) {
    if (!allowed) {
      _pauseMotion();
    } else if (_started) {
      _resumeMotion();
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reduce = MediaQuery.disableAnimationsOf(context);
    if (reduce == _reduceMotion) return;
    _reduceMotion = reduce;
    if (reduce) {
      _ctrl.stop();
    } else {
      _resumeMotion();
    }
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
      _started = false;
      _userDragging = false;
      _pointerDown = null;
      _releaseScrollHold();
      _ctrl.stop();
      _scheduleMeasure();
      scheduleMotionGateCheck();
    }
  }

  @override
  void dispose() {
    _releaseScrollHold();
    _ctrl.dispose();
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

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) return const SizedBox.shrink();

    if (_periodWidth <= 0) _scheduleMeasure();

    return LayoutBuilder(
      builder: (context, constraints) {
        final viewportW = constraints.maxWidth.isFinite
            ? constraints.maxWidth
            : MediaQuery.sizeOf(context).width;
        _viewportWidth = viewportW;
        final period = _activePeriod;
        final copies = _copyCount(viewportW, period);

        // الشريط يُبنى مرة واحدة لكل تخطيط؛ كل إطار يحرّكه فقط (Transform) دون إعادة بناء البلاطات.
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

        // حدّ رسم خارجي: حركة الشريط لا تعيد رسم بقية الصفحة.
        return RepaintBoundary(
          child: ClipRect(
            clipBehavior: Clip.hardEdge,
            child: SizedBox(
              height: widget.height,
              width: viewportW,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // الصور للعين فقط — قارئ الشاشة يقرأ الطبقة التالية.
                  ExcludeSemantics(
                    child: IgnorePointer(
                      child: OverflowBox(
                        alignment: Alignment.centerLeft,
                        maxWidth: double.infinity,
                        child: AnimatedBuilder(
                          animation: _ctrl,
                          child: strip,
                          builder: (_, child) => Transform.translate(
                            offset: Offset(_shift(_activePeriod), 0),
                            child: child,
                          ),
                        ),
                      ),
                    ),
                  ),
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
      // الظل يُقصّ مسطّحاً عند حافة الشريط — بلا ظل هنا.
      showShadow: false,
      cornerRadiusOverride: _shapeOwnsRadius.contains(image.shape) ? null : radius,
    );
  }
}
