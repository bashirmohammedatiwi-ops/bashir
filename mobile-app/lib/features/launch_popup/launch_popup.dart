import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/navigation/app_navigation.dart';
import '../../core/network/api_client.dart';
import '../../core/push/push_service.dart';
import '../../core/utils/json.dart';
import '../../data/models/banner.dart';
import '../../data/models/media.dart';
import '../../data/services/api_service.dart';
import '../home/home_link.dart';
import '../update/app_update.dart';

/// إعلان عند فتح التطبيق — يُدار من لوحة التحكم (الإعدادات ← إعلان عند الفتح).
class LaunchPopup {
  final String id;
  final AppBanner banner;

  /// once | daily | always
  final String frequency;

  /// عرض/ارتفاع الصورة الأصلية (للنسبة) — 4:5 افتراضياً.
  final double aspect;

  const LaunchPopup({
    required this.id,
    required this.banner,
    required this.frequency,
    required this.aspect,
  });

  static LaunchPopup? fromJson(Map<String, dynamic>? j) {
    if (j == null) return null;
    final image = asMap(j['image']);
    final banner = AppBanner(
      id: asString(j['id']),
      title: j['title']?.toString(),
      linkType: j['linkType']?.toString(),
      linkValue: j['linkValue']?.toString(),
      link: j['link']?.toString(),
      image: image.isEmpty ? null : AppMedia.fromJson(image),
    );
    if (!banner.hasImage || banner.id.isEmpty) return null;
    final w = asDouble(image['width']);
    final h = asDouble(image['height']);
    final aspect = (w > 0 && h > 0) ? (w / h).clamp(0.5, 1.2).toDouble() : 0.8;
    return LaunchPopup(
      id: banner.id,
      banner: banner,
      frequency: asString(j['frequency'], 'daily'),
      aspect: aspect,
    );
  }
}

const _seenPrefix = 'launch_popup_seen_';

String _today() {
  final d = DateTime.now();
  return '${d.year}-${d.month}-${d.day}';
}

/// يلفّ التطبيق: بعد اختفاء مشهد البداية يطلب الإعلان مرة واحدة في كل تشغيل،
/// ويعرضه فوق الرئيسية بحسب «التكرار» (العدّ على الجهاز). لا يظهر فوق شاشة
/// التحديث الإجباري، ولا إن فُتح التطبيق على صفحة أخرى (إشعار/رابط).
class LaunchPopupHost extends ConsumerStatefulWidget {
  final Widget child;
  const LaunchPopupHost({super.key, required this.child});

  @override
  ConsumerState<LaunchPopupHost> createState() => _LaunchPopupHostState();
}

class _LaunchPopupHostState extends ConsumerState<LaunchPopupHost> {
  static bool _handledThisRun = false;

  @override
  void initState() {
    super.initState();
    if (_handledThisRun) return;
    if (PushService.uiVisible.value) {
      _schedule();
    } else {
      PushService.uiVisible.addListener(_onUiVisible);
    }
  }

  void _onUiVisible() {
    if (!PushService.uiVisible.value) return;
    PushService.uiVisible.removeListener(_onUiVisible);
    _schedule();
  }

  @override
  void dispose() {
    PushService.uiVisible.removeListener(_onUiVisible);
    super.dispose();
  }

  void _schedule() {
    if (_handledThisRun) return;
    _handledThisRun = true;
    unawaited(_run());
  }

  Future<void> _run() async {
    try {
      final popup = LaunchPopup.fromJson(
        await ref.read(apiServiceProvider).getLaunchPopup(),
      );
      if (popup == null || !mounted) return;

      final prefs = ref.read(sharedPreferencesProvider);
      final key = '$_seenPrefix${popup.id}';
      final last = prefs.getString(key);
      if (popup.frequency == 'once' && last != null) return;
      if (popup.frequency == 'daily' && last == _today()) return;

      // تحميل الصورة قبل الظهور — لا نعرض إطاراً فارغاً. فشل/بطء = لا إعلان هذه المرة.
      final ctx0 = rootNavigatorKey.currentContext;
      if (ctx0 == null || !ctx0.mounted) return;
      await precacheImage(NetworkImage(popup.banner.imageUrl), ctx0)
          .timeout(const Duration(seconds: 8));

      // نترك الرئيسية تستقر لحظة بعد المشهد.
      await Future<void>.delayed(const Duration(milliseconds: 600));
      if (!mounted) return;
      if (ref.read(appUpdateProvider).valueOrNull?.force ?? false) return;
      final ctx = rootNavigatorKey.currentContext;
      if (ctx == null || !ctx.mounted) return;
      if (GoRouter.of(ctx).state.uri.path != '/') return;

      await prefs.setString(key, _today());
      if (!ctx.mounted) return;
      await showLaunchPopup(ctx, popup);
    } catch (_) {
      // بلا إنترنت أو صورة معطوبة: لا شيء — الإعلان لا يعطّل فتح التطبيق أبداً.
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

/// يعرض الإعلان: صورة بزوايا ناعمة فوق خلفية معتمة، زر إغلاق، والضغط يفتح الرابط.
Future<void> showLaunchPopup(BuildContext context, LaunchPopup popup) {
  final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
  return showGeneralDialog<void>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'إغلاق الإعلان',
    barrierColor: Colors.black.withValues(alpha: .62),
    transitionDuration: reduceMotion ? Duration.zero : const Duration(milliseconds: 320),
    pageBuilder: (dialogCtx, _, _) => _LaunchPopupView(popup: popup),
    transitionBuilder: (_, anim, _, child) {
      final curved = CurvedAnimation(parent: anim, curve: Curves.easeOutCubic);
      return FadeTransition(
        opacity: curved,
        child: ScaleTransition(
          scale: Tween<double>(begin: .92, end: 1).animate(curved),
          child: child,
        ),
      );
    },
  );
}

class _LaunchPopupView extends StatelessWidget {
  final LaunchPopup popup;
  const _LaunchPopupView({required this.popup});

  void _open(BuildContext context) {
    HapticFeedback.selectionClick();
    Navigator.of(context).pop();
    if (!popup.banner.hasLink) return;
    final root = rootNavigatorKey.currentContext;
    if (root != null && root.mounted) openBannerLink(root, popup.banner);
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    // يتسع للشاشة مع هامش، ولا يتجاوز 440 عرضاً ولا 78% من الارتفاع.
    var width = (size.width - 48).clamp(220.0, 440.0);
    final maxH = size.height * .78;
    if (width / popup.aspect > maxH) width = maxH * popup.aspect;
    final height = width / popup.aspect;

    return SafeArea(
      child: Center(
        child: SizedBox(
          width: width,
          height: height + 56,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                height: height,
                child: Semantics(
                  button: popup.banner.hasLink,
                  label: popup.banner.title ?? 'إعلان',
                  child: GestureDetector(
                    onTap: () => _open(context),
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(22),
                        boxShadow: const [
                          BoxShadow(color: Color(0x66000000), blurRadius: 40, offset: Offset(0, 18)),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(22),
                        child: Image.network(
                          popup.banner.imageUrl,
                          fit: BoxFit.cover,
                          width: width,
                          height: height,
                          filterQuality: FilterQuality.medium,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              // زر الإغلاق فوق الزاوية (يمين في العربية، يسار في الإنجليزية).
              PositionedDirectional(
                top: 0,
                end: 0,
                child: Semantics(
                  button: true,
                  label: 'إغلاق الإعلان',
                  child: Material(
                    color: Colors.white,
                    shape: const CircleBorder(),
                    elevation: 6,
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        Navigator.of(context).pop();
                      },
                      child: const SizedBox(
                        width: 42,
                        height: 42,
                        child: Icon(Icons.close_rounded, size: 24, color: Color(0xFF2A0B18)),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
