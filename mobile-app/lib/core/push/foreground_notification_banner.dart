import 'dart:async';

import 'package:flutter/material.dart';

import '../navigation/app_navigation.dart';
import '../navigation/pending_push_navigation.dart';
import '../theme/app_colors.dart';
import '../theme/app_text.dart';
import '../../features/worlds/world_theme.dart';
import '../brand/brand_logo.dart';
import '../widgets/app_network_image.dart';

/// بانر إشعار أثناء فتح التطبيق (foreground): ينزلق من الأعلى، يُسحب للأعلى
/// ليُغلق، ويختفي وحده بعد ثوانٍ.
class ForegroundNotificationBanner {
  ForegroundNotificationBanner._();

  static const _visibleFor = Duration(seconds: 6);

  static OverlayEntry? _entry;
  static GlobalKey<_BannerState>? _bannerKey;
  static Timer? _timer;

  static void show({
    required String title,
    required String body,
    String? imageUrl,
    Map<String, dynamic>? payload,
  }) {
    dismiss();

    // rootNavigatorKey مفتاح الـ Navigator نفسه، والـ Overlay ابنٌ له لا جدّ —
    // فـ Overlay.maybeOf على سياقه يعيد null دائماً. نأخذه من حالة الـ Navigator.
    final overlay = rootNavigatorKey.currentState?.overlay;
    if (overlay == null || !overlay.mounted) return;

    final key = GlobalKey<_BannerState>();
    late final OverlayEntry entry;
    entry = OverlayEntry(
      builder: (_) => _Banner(
        key: key,
        title: title,
        body: body,
        imageUrl: imageUrl,
        onTap: () {
          _remove(entry);
          if (payload != null) PendingPushNavigation.queue(payload);
        },
        onClose: _hide,
        onSwiped: () => _remove(entry),
      ),
    );
    _entry = entry;
    _bannerKey = key;
    overlay.insert(entry);
    _timer = Timer(_visibleFor, _hide);
  }

  /// إزالة فورية (مثلاً عند فتح التطبيق من إشعار).
  static void dismiss() {
    final entry = _entry;
    if (entry != null) _remove(entry);
  }

  /// إخفاء بانزلاق للأعلى ثم الإزالة — للمؤقّت وزر الإغلاق.
  static Future<void> _hide() async {
    final entry = _entry;
    if (entry == null) return;
    _timer?.cancel();
    _timer = null;
    await _bannerKey?.currentState?.slideOut();
    _remove(entry);
  }

  static void _remove(OverlayEntry entry) {
    // كل بانر يُزال مرة واحدة فقط: إن حلّ محله بانر أحدث فقد أُزيل سابقاً.
    if (!identical(_entry, entry)) return;
    _timer?.cancel();
    _timer = null;
    _entry = null;
    _bannerKey = null;
    entry.remove();
    entry.dispose();
  }
}

class _Banner extends StatefulWidget {
  final String title;
  final String body;
  final String? imageUrl;
  final VoidCallback onTap;
  final VoidCallback onClose;
  final VoidCallback onSwiped;

  const _Banner({
    super.key,
    required this.title,
    required this.body,
    this.imageUrl,
    required this.onTap,
    required this.onClose,
    required this.onSwiped,
  });

  @override
  State<_Banner> createState() => _BannerState();
}

class _BannerState extends State<_Banner> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 280),
    reverseDuration: const Duration(milliseconds: 200),
  );
  late final Animation<Offset> _slide = Tween<Offset>(
    begin: const Offset(0, -1.2),
    end: Offset.zero,
  ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic, reverseCurve: Curves.easeInCubic));
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    // «تقليل الحركة»: يظهر في مكانه مباشرة.
    if (MediaQuery.disableAnimationsOf(context)) {
      _ctrl.value = 1;
    } else {
      _ctrl.forward();
    }
  }

  /// يعكس حركة الدخول؛ يكتمل فوراً مع «تقليل الحركة» أو إن أُزيل البانر.
  Future<void> slideOut() async {
    if (!mounted || MediaQuery.disableAnimationsOf(context)) return;
    try {
      await _ctrl.reverse().orCancel;
    } on TickerCanceled {
      // أُزيل البانر أثناء الحركة.
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PositionedDirectional(
      top: MediaQuery.paddingOf(context).top + 8,
      start: 12,
      end: 12,
      child: Align(
        alignment: AlignmentDirectional.topCenter,
        heightFactor: 1,
        child: ConstrainedBox(
          // على الأجهزة اللوحية لا يمتد البانر بعرض الشاشة كاملاً.
          constraints: const BoxConstraints(maxWidth: 560),
          child: SlideTransition(
            position: _slide,
            child: FadeTransition(
              opacity: _ctrl,
              child: Dismissible(
                key: const ValueKey('foreground-push-banner'),
                direction: DismissDirection.up,
                onDismissed: (_) => widget.onSwiped(),
                child: Semantics(
                  container: true,
                  liveRegion: true,
                  child: _BannerCard(
                    title: widget.title,
                    body: widget.body,
                    imageUrl: widget.imageUrl,
                    onTap: widget.onTap,
                    onClose: widget.onClose,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// بطاقة البانر: صورة الإشعار (إن وُجدت)، شعار ديما، العنوان والنص، وزر إغلاق.
class _BannerCard extends StatelessWidget {
  final String title;
  final String body;
  final String? imageUrl;
  final VoidCallback onTap;
  final VoidCallback onClose;

  const _BannerCard({
    required this.title,
    required this.body,
    required this.imageUrl,
    required this.onTap,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final image = imageUrl;
    final radius = BorderRadius.circular(AppCorners.lg);

    return DecoratedBox(
      // الظل خارج الـ Material كي لا يقصّه تقليم الزوايا.
      decoration: BoxDecoration(borderRadius: radius, boxShadow: AppColors.elevatedShadow),
      child: Material(
        color: t.surface,
        shape: RoundedRectangleBorder(borderRadius: radius, side: BorderSide(color: t.accentSoft)),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (image != null && image.isNotEmpty)
                // خط الصور المشترك: يُفك بعرض الإشعار الفعلي (لا بحجم الصورة الأصلي أثناء انزلاقه)،
                // بكاش التطبيق وبديله الموحّد إن تعذّر التحميل.
                ExcludeSemantics(
                  child: SizedBox(
                    width: double.infinity,
                    height: 120,
                    child: AppNetworkImage(url: image, height: 120, fit: BoxFit.cover),
                  ),
                ),
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(14, 10, 4, 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsetsDirectional.only(top: 2),
                      child: ExcludeSemantics(
                        child: Container(
                          width: 36,
                          height: 36,
                          padding: const EdgeInsets.all(7),
                          decoration: BoxDecoration(
                            gradient: t.signatureGradient,
                            borderRadius: BorderRadius.circular(AppCorners.sm),
                          ),
                          child: const Center(
                            child: BrandMark(height: 22, color: Colors.white, weight: 1.2),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (title.isNotEmpty)
                              Text(
                                title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppText.title3.copyWith(color: t.ink),
                              ),
                            if (title.isNotEmpty && body.isNotEmpty) const SizedBox(height: 2),
                            if (body.isNotEmpty)
                              Text(
                                body,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: AppText.bodySmall.copyWith(color: t.inkSoft),
                              ),
                          ],
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: onClose,
                      tooltip: MaterialLocalizations.of(context).closeButtonTooltip,
                      constraints: const BoxConstraints(minWidth: kMinTapTarget, minHeight: kMinTapTarget),
                      icon: Icon(Icons.close_rounded, size: 20, color: t.inkMuted),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
