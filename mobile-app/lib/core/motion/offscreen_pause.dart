import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

/// بوّابة الحركة الدائمة: تسمح بالحركة فقط والعنصر ظاهر فعلاً على الشاشة،
/// والتبويب ظاهر (TickerMode)، والشاشة في الأعلى (ModalRoute.isCurrent)،
/// والقائمة الأم (العمودية) لا تُمرَّر الآن.
///
/// الأشرطة المتحركة والدوّارات تُبنى قبل ظهورها بكثير (cacheExtent)، ومؤقّتها
/// يطلب إطاراً كل vsync — على Impeller يعني إعادة رسم كاملة حتى وهي خارج الشاشة
/// أو تحت إصبع العميلة أثناء القذف. هذه البوّابة توقفها هناك وتستأنفها بعد ذلك.
///
/// الاستعمال: `with MotionGateMixin` ثم:
/// * قراءة [motionAllowed] قبل بدء أي حركة/تقليب.
/// * تجاوز [onMotionGateChanged] لإيقاف المتحكّم أو استئنافه.
///
/// الحالة تبدأ «غير مسموحة» حتى أول فحص بعد التخطيط — فلا تبدأ حركة عنصر مبني
/// مسبقاً خارج الشاشة ولو لإطار واحد.
mixin MotionGateMixin<T extends StatefulWidget> on State<T> {
  ScrollableState? _mgScrollable;
  ScrollPosition? _mgPosition;
  ValueListenable<bool>? _mgScrollingListenable;
  bool _mgVisible = false;
  bool _mgParentScrolling = false;
  bool _mgTickerEnabled = true;
  bool _mgRouteCurrent = true;
  bool _mgCheckScheduled = false;
  bool _mgAllowed = false;
  double _mgScreenHeight = 0;

  /// إيقاف الحركة ما دامت القائمة الأم تُمرَّر (سحب أو قذف). افتراضياً: نعم.
  @protected
  bool get pauseWhileParentScrolls => true;

  /// هل يُسمح بالحركة الآن؟
  bool get motionAllowed => _mgAllowed;

  /// يُستدعى كلما تغيّر [motionAllowed]. قد يُستدعى من didChangeDependencies،
  /// فيجب أن يكون منطق المزامنة فيه متكرّر الأمان (idempotent).
  @protected
  void onMotionGateChanged(bool allowed) {}

  bool get _mgCompute =>
      _mgVisible &&
      _mgTickerEnabled &&
      _mgRouteCurrent &&
      !(pauseWhileParentScrolls && _mgParentScrolling);

  void _mgNotify() {
    final next = _mgCompute;
    if (next == _mgAllowed) return;
    _mgAllowed = next;
    if (mounted) onMotionGateChanged(next);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _mgTickerEnabled = TickerMode.valuesOf(context).enabled;
    _mgRouteCurrent = ModalRoute.isCurrentOf(context) ?? true;
    _mgScreenHeight = MediaQuery.sizeOf(context).height;
    final scrollable = Scrollable.maybeOf(context, axis: Axis.vertical);
    final position = scrollable?.position;
    _mgScrollable = scrollable;
    if (!identical(position, _mgPosition)) {
      _mgDetach();
      _mgPosition = position;
      final scrolling = position?.isScrollingNotifier;
      _mgScrollingListenable = scrolling;
      position?.addListener(_mgOnScroll);
      scrolling?.addListener(_mgOnScrollingChanged);
      _mgParentScrolling = scrolling?.value ?? false;
    }
    scheduleMotionGateCheck();
    _mgNotify();
  }

  @override
  void activate() {
    super.activate();
    scheduleMotionGateCheck();
  }

  @override
  void dispose() {
    _mgDetach();
    super.dispose();
  }

  void _mgDetach() {
    _mgPosition?.removeListener(_mgOnScroll);
    _mgScrollingListenable?.removeListener(_mgOnScrollingChanged);
    _mgPosition = null;
    _mgScrollingListenable = null;
  }

  void _mgOnScroll() {
    // أثناء التمرير الحركة موقوفة أصلاً — الفحص عند التوقف يكفي ويوفّر كل إطار.
    if (pauseWhileParentScrolls && _mgParentScrolling) return;
    // الإزاحة الجديدة لم تُطبَّق في التخطيط بعد: الفحص بعد الإطار (مرة لكل إطار).
    scheduleMotionGateCheck();
  }

  void _mgOnScrollingChanged() {
    final scrolling = _mgScrollingListenable?.value ?? false;
    if (scrolling == _mgParentScrolling) return;
    _mgParentScrolling = scrolling;
    if (scrolling) {
      _mgNotify();
    } else {
      // آخر إزاحة قد لا تكون طُبّقت في التخطيط بعد — نفحص بعد الإطار.
      scheduleMotionGateCheck();
    }
  }

  /// فحص الظهور بعد الإطار القادم — عند تغيّر تخطيط العنصر أو محتواه.
  void scheduleMotionGateCheck() {
    if (_mgCheckScheduled) return;
    _mgCheckScheduled = true;
    final binding = WidgetsBinding.instance;
    binding.addPostFrameCallback((_) {
      _mgCheckScheduled = false;
      if (mounted) _mgCheckNow();
    });
    // بلا إطار مجدول (واجهة ساكنة) لن يأتي الاستدعاء أبداً — نطلب إطاراً واحداً.
    binding.ensureVisualUpdate();
  }

  void _mgCheckNow() {
    if (!mounted) return;
    _mgVisible = _mgComputeVisible();
    _mgNotify();
  }

  bool _mgComputeVisible() {
    final box = context.findRenderObject();
    if (box is! RenderBox || !box.attached || !box.hasSize) return false;
    final viewport = _mgScrollable?.context.findRenderObject();
    if (viewport is RenderBox && viewport.attached && viewport.hasSize) {
      final top = box.localToGlobal(Offset.zero, ancestor: viewport).dy;
      return top < viewport.size.height && top + box.size.height > 0;
    }
    final top = box.localToGlobal(Offset.zero).dy;
    final screen = _mgScreenHeight > 0 ? _mgScreenHeight : double.infinity;
    return top < screen && top + box.size.height > 0;
  }
}
