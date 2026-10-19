import 'dart:async';
import 'dart:io';

import 'package:app_settings/app_settings.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../bootstrap/app_storage.dart';
import '../l10n/app_strings.dart';
import '../navigation/app_navigation.dart';
import '../navigation/pending_push_navigation.dart';
import '../theme/app_text.dart';
import '../utils/media_url.dart';
import 'firebase_init.dart';
import 'foreground_notification_banner.dart';
import '../../data/services/api_service.dart';
import '../../features/alerts/restock_watch_provider.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/cart/widgets/pill_buttons.dart';
import '../../features/profile/profile_providers.dart';
import '../../features/worlds/world_theme.dart';
import '../config/app_config.dart';

/// معالجة الإشعارات في الخلفية (مطلوب لـ FCM).
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await initFirebaseApp();
}

class PushService {
  PushService._();

  static String? _token;
  static bool _initialized = false;

  /// لم يصل توكن FCM بعد (APNs متأخر، أو جهاز بلا خدمات Google) — يُعاد عند العودة للواجهة.
  static bool _tokenMissing = false;
  static bool _ensuringToken = false;

  /// فشل آخر تسجيل للتوكن على الخادم (شبكة) — يُعاد عند العودة للواجهة.
  static bool _registrationPending = false;
  static bool _requestingPermission = false;
  static bool _softAskOpen = false;
  static AppLifecycleListener? _lifecycle;

  static const _softAskAtKey = 'push_soft_ask_at';

  /// رفضت الزبونة نافذة النظام بعد أن اختارت «تفعيل» — لا نعيد السؤال اللطيف بعدها.
  static const _softAskBlockedKey = 'push_soft_ask_blocked';
  static const _sessionsKey = 'app_sessions';
  static const _softAskEvery = Duration(days: 14);

  /// توكن FCM لهذا الجهاز (null قبل وصوله) — يلتقطه الخروج لفصل الجهاز عن الحساب.
  static String? get currentToken => _token;

  /// يطلب إذن الإشعارات في لحظة لها معنى للمستخدم (بعد إتمام طلب) بدل شاشة البداية.
  static Future<void> requestPermissionInContext() async {
    await _requestPermission();
  }

  /// يعيد حالة الإذن بعد الطلب، أو null إن تعذّر.
  static Future<AuthorizationStatus?> _requestPermission() async {
    if (!AppConfig.pushNotificationsEnabled || !_initialized || _requestingPermission) return null;
    _requestingPermission = true;
    try {
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.getNotificationSettings();
      if (!_canPrompt(settings.authorizationStatus)) return settings.authorizationStatus;
      final result = await messaging.requestPermission(alert: true, badge: true, sound: true);
      return result.authorizationStatus;
    } catch (e) {
      debugPrint('[PushService] permission request failed: $e');
      return null;
    } finally {
      _requestingPermission = false;
    }
  }

  /// هل يمكن أن تظهر نافذة الإذن؟ iOS: مرة واحدة قبل أي قرار. Android: يُبلَّغ
  /// «مرفوض» قبل السؤال أصلاً (13+)، والنظام يتجاهل الطلب بنفسه إن رُفض نهائياً.
  static bool _canPrompt(AuthorizationStatus status) => Platform.isIOS
      ? status == AuthorizationStatus.notDetermined
      : status == AuthorizationStatus.denied || status == AuthorizationStatus.notDetermined;

  /// الإشعارات مرفوضة أو معطّلة لهذا التطبيق — لإظهار صفّ «تفعيل الإشعارات».
  /// على Android 13+ يشمل ذلك «لم تُسأل بعد» (النظام لا يميّز بينهما).
  static Future<bool> isPermissionDenied() async {
    if (!AppConfig.pushNotificationsEnabled || !_initialized) return false;
    try {
      final settings = await FirebaseMessaging.instance.getNotificationSettings();
      return settings.authorizationStatus == AuthorizationStatus.denied;
    } catch (_) {
      return false;
    }
  }

  /// صفّ «تفعيل الإشعارات»: نافذة النظام إن كان السؤال ممكناً (Android 13+ قبل أي
  /// قرار يُبلَّغ «مرفوض» أيضاً)، وإلا إعدادات إشعارات التطبيق في النظام.
  /// يعيد true إن صار الإذن ممنوحاً فوراً.
  static Future<bool> requestOrOpenSettings() async {
    final status = await _requestPermission();
    if (status == AuthorizationStatus.authorized || status == AuthorizationStatus.provisional) {
      return true;
    }
    try {
      await AppSettings.openAppSettings(type: AppSettingsType.notification);
    } catch (e) {
      debugPrint('[PushService] open notification settings failed: $e');
    }
    return false;
  }

  /// سؤال لطيف قبل نافذة النظام: ورقة سفلية تشرح [reason] (نص مترجم يمرّره
  /// المستدعي)، ثم نافذة الإذن عند «تفعيل». مرة كل 14 يوماً على الأكثر، ولا
  /// تظهر إن كان الإذن ممنوحاً أو لا يمكن طلبه.
  static Future<void> maybeSoftAsk(BuildContext context, {required String reason}) async {
    if (!AppConfig.pushNotificationsEnabled || !_initialized || _softAskOpen) return;
    _softAskOpen = true;
    try {
      final settings = await FirebaseMessaging.instance.getNotificationSettings();
      if (!_canPrompt(settings.authorizationStatus)) return;

      final prefs = appSharedPreferences;
      if (prefs.getBool(_softAskBlockedKey) == true) return;
      final now = DateTime.now();
      final last = prefs.getInt(_softAskAtKey);
      if (last != null && now.difference(DateTime.fromMillisecondsSinceEpoch(last)) < _softAskEvery) {
        return;
      }
      if (!context.mounted) return;
      await prefs.setInt(_softAskAtKey, now.millisecondsSinceEpoch);
      if (!context.mounted) return;

      final strings = AppStrings(Localizations.localeOf(context).languageCode);
      final allow = await showModalBottomSheet<bool>(
        context: context,
        useRootNavigator: true,
        isScrollControlled: true,
        useSafeArea: true,
        backgroundColor: Colors.transparent,
        // «تقليل الحركة»: تظهر الورقة في مكانها بلا انزلاق.
        sheetAnimationStyle:
            MediaQuery.disableAnimationsOf(context) ? AnimationStyle.noAnimation : null,
        builder: (_) => _SoftAskSheet(strings: strings, reason: reason),
      );
      if (allow != true) return;

      final status = await _requestPermission();
      if (status == AuthorizationStatus.denied) await prefs.setBool(_softAskBlockedKey, true);
    } catch (e) {
      debugPrint('[PushService] soft ask failed: $e');
    } finally {
      _softAskOpen = false;
    }
  }

  static Future<void> init(WidgetRef ref) async {
    if (!AppConfig.pushNotificationsEnabled) return;
    if (_initialized) return;

    try {
      await initFirebaseApp();
    } catch (e) {
      debugPrint('[PushService] Firebase not configured: $e');
      return;
    }

    _initialized = true;
    final messaging = FirebaseMessaging.instance;

    // 1) المستمعون أولاً — فتح الإشعارات واستقبالها لا يتوقف على وصول التوكن.
    try {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      FirebaseMessaging.onMessage.listen((message) => _handleForegroundMessage(ref, message));
      FirebaseMessaging.onMessageOpenedApp.listen((message) => _openFromMessage(ref, message));
      messaging.onTokenRefresh.listen((token) async {
        _token = token;
        _tokenMissing = false;
        await _registerToken(ref, token);
      });

      // listenManual: هذا خارج build — ref.listen هنا كان يرمي استثناء فيُلغى تسجيل التوكن بعد الدخول.
      ref.listenManual<AuthState>(authProvider, (prev, next) {
        final token = _token;
        if (token == null) return;
        final before = prev?.isAuthenticated == true ? prev!.user!.id : null;
        final after = next.isAuthenticated ? next.user!.id : null;
        // دخول: نربط الجهاز بالحساب. خروج أو انتهاء جلسة: نسجّله كزائر فيفصله
        // الخادم عن الحساب السابق ويبقى يستقبل الإشعارات العامة.
        if (before != after) unawaited(_registerToken(ref, token));
      });
    } catch (e) {
      debugPrint('[PushService] listeners failed: $e');
    }

    // 2) الإشعار الذي فُتح منه التطبيق وهو مغلق.
    try {
      final initial = await messaging.getInitialMessage();
      if (initial != null) _openFromMessage(ref, initial, launch: true);
    } catch (e) {
      debugPrint('[PushService] initial message failed: $e');
    }

    // 3) iOS: بانر التطبيق يعرض الإشعار في الواجهة؛ النظام يضيف الشارة والصوت فقط.
    if (Platform.isIOS) {
      try {
        await messaging.setForegroundNotificationPresentationOptions(
          alert: false,
          badge: true,
          sound: true,
        );
      } catch (e) {
        debugPrint('[PushService] presentation options failed: $e');
      }
    }

    _lifecycle ??= AppLifecycleListener(onResume: () {
      final token = _token;
      if (_tokenMissing) {
        unawaited(_ensureToken(ref));
      } else if (_registrationPending && token != null) {
        unawaited(_registerToken(ref, token));
      }
    });

    unawaited(_autoSoftAsk());

    // 4) التوكن أخيراً — قد يتأخر على iOS ولا يجب أن يؤخر ما سبق.
    await _ensureToken(ref);
  }

  static Future<void> _ensureToken(WidgetRef ref) async {
    if (_ensuringToken) return;
    _ensuringToken = true;
    try {
      final messaging = FirebaseMessaging.instance;
      if (Platform.isIOS && !await _waitForApnsToken(messaging)) {
        _tokenMissing = true;
        return;
      }
      final token = await messaging.getToken();
      if (token == null || token.isEmpty) {
        _tokenMissing = true;
        return;
      }
      _tokenMissing = false;
      _token = token;
      await _registerToken(ref, token);
    } catch (e) {
      _tokenMissing = true;
      debugPrint('[PushService] token unavailable: $e');
    } finally {
      _ensuringToken = false;
    }
  }

  /// iOS: getToken يرمي «apns-token-not-set» قبل وصول توكن APNs (شبكة ضعيفة، أول
  /// تثبيت) — ننتظره حتى 10 ثوانٍ.
  static Future<bool> _waitForApnsToken(FirebaseMessaging messaging) async {
    for (var attempt = 0; attempt < 10; attempt++) {
      if (attempt > 0) await Future<void>.delayed(const Duration(seconds: 1));
      final apns = await messaging.getAPNSToken();
      if (apns != null && apns.isNotEmpty) return true;
    }
    return false;
  }

  static Future<void> _registerToken(WidgetRef ref, String token) async {
    try {
      final api = ref.read(apiServiceProvider);
      final platform = Platform.isIOS ? 'ios' : 'android';
      final authed = ref.read(authProvider).isAuthenticated;
      if (authed) {
        await api.registerDevice(token: token, platform: platform);
      } else {
        await api.registerGuestDevice(token: token, platform: platform);
      }
      _registrationPending = false;
    } catch (e) {
      _registrationPending = true;
      debugPrint('[PushService] register failed: $e');
    }
  }

  /// يعدّ جلسات الاستخدام، ومن الجلسة الثانية يعرض السؤال اللطيف مرة واحدة بعد
  /// ظهور الواجهة (لا فوق شاشة الافتتاح ولا لحظة الفتح).
  static Future<void> _autoSoftAsk() async {
    final int sessions;
    try {
      final prefs = appSharedPreferences;
      sessions = (prefs.getInt(_sessionsKey) ?? 0) + 1;
      await prefs.setInt(_sessionsKey, sessions);
    } catch (_) {
      return;
    }
    if (sessions < 2) return;

    await WidgetsBinding.instance.endOfFrame;
    // الـ router يظهر بعد مشهد الافتتاح — ننتظره ثم نترك الرئيسية تستقر قليلاً.
    for (var i = 0; i < 30 && !_routerReady; i++) {
      await Future<void>.delayed(const Duration(seconds: 1));
    }
    if (!_routerReady) return;
    await Future<void>.delayed(const Duration(seconds: 4));

    final context = rootNavigatorKey.currentContext;
    if (context == null || !context.mounted) return;
    // فقط على الشاشة الرئيسية — لا فوق صفحة فتحها إشعار، ولا فوق نافذة أو ورقة مفتوحة.
    if (rootNavigatorKey.currentState?.canPop() ?? true) return;
    if (GoRouter.of(context).state.uri.path != '/') return;
    final strings = AppStrings(Localizations.localeOf(context).languageCode);
    await maybeSoftAsk(context, reason: strings.pushAskDefaultReason);
  }

  static bool get _routerReady {
    final context = rootNavigatorKey.currentContext;
    return context != null && context.mounted && GoRouter.maybeOf(context) != null;
  }

  static Map<String, dynamic> _mergedData(RemoteMessage message) {
    final data = Map<String, dynamic>.from(message.data);
    final n = message.notification;
    if (n != null) {
      data.putIfAbsent('title', () => n.title ?? '');
      data.putIfAbsent('body', () => n.body ?? '');
      final image = n.android?.imageUrl ?? n.apple?.imageUrl;
      if (image != null && image.isNotEmpty) {
        data.putIfAbsent('imageUrl', () => image);
      }
    }
    return data;
  }

  static void _handleForegroundMessage(WidgetRef ref, RemoteMessage message) {
    final data = _mergedData(message);
    _refreshForPush(ref, data);

    final title = data['title']?.toString() ?? '';
    final body = data['body']?.toString() ?? '';
    if (title.isEmpty && body.isEmpty) return;

    final imageUrl = resolveMediaUrl(data['imageUrl']?.toString());

    ForegroundNotificationBanner.show(
      title: title,
      body: body,
      imageUrl: imageUrl.isEmpty ? null : imageUrl,
      payload: data,
    );
  }

  /// وصل إشعار: نحدّث ما يتأثر به فوراً — القائمة وشارة الجرس دائماً، والطلب
  /// ونقاط الولاء لإشعارات الطلبات، وتنبيهات التوفّر لإشعارات التذكير.
  static void _refreshForPush(WidgetRef ref, Map<String, dynamic> data) {
    try {
      ref.invalidate(notificationsProvider);
      if (!ref.read(authProvider).isAuthenticated) return;

      final type = data['type']?.toString().toUpperCase();
      final linkType = data['linkType']?.toString().toUpperCase();
      final linkId = data['linkId']?.toString() ?? '';
      if (type == 'ORDER' || linkType == 'ORDER') {
        ref.invalidate(ordersProvider);
        if (linkId.isNotEmpty) ref.invalidate(orderDetailProvider(linkId));
        unawaited(ref.read(authProvider.notifier).refreshUser());
      } else if (type == 'REMINDER') {
        // التنبيه يُحذف على الخادم بعد إرساله — نعيد مزامنة القائمة.
        unawaited(ref.read(restockWatchProvider.notifier).load());
      }
    } catch (e) {
      debugPrint('[PushService] refresh after push failed: $e');
    }
  }

  /// [launch]: الإشعار الذي فتح التطبيق وهو مغلق — لا بيانات محمّلة بعد لتحديثها.
  static void _openFromMessage(WidgetRef ref, RemoteMessage message, {bool launch = false}) {
    final data = _mergedData(message);
    if (data.isEmpty && (message.notification == null)) return;
    // عاد التطبيق من الخلفية بإشعار لم يمرّ على onMessage — نحدّث ما يتأثر به.
    if (!launch) _refreshForPush(ref, data);
    ForegroundNotificationBanner.dismiss();
    // لا نفتح فوراً — الـ splash يستخدم MaterialApp بدون GoRouter.
    PendingPushNavigation.queue(data);
  }
}

/// نصوص السؤال اللطيف عن الإشعارات.
extension _PushStringsX on AppStrings {
  String get pushAskTitle => isAr ? 'كوني أول من يعرف' : 'Be the first to know';
  String get pushAskDefaultReason => isAr
      ? 'فعّلي الإشعارات ونرسل لكِ ما يهمّكِ فقط — بلا إزعاج.'
      : 'Turn on notifications and we will only send what matters to you — no spam.';
  String get pushAskOrders =>
      isAr ? 'حالة طلبكِ لحظة بلحظة حتى باب البيت' : 'Live order updates, right to your door';
  String get pushAskRestock => isAr
      ? 'تنبيه حين تعود منتجاتكِ أو ينخفض سعرها'
      : 'Alerts when your favourites are back or cheaper';
  String get pushAskOffers =>
      isAr ? 'العروض الحصرية والتخفيضات قبل الجميع' : 'Exclusive offers and flash sales first';
  String get pushAskAllow => isAr ? 'تفعيل الإشعارات' : 'Turn on notifications';
  String get pushAskLater => isAr ? 'ليس الآن' : 'Not now';
}

/// ورقة السؤال اللطيف: أيقونة، عنوان، السبب، ثلاث فوائد، ثم «تفعيل» أو «ليس الآن».
class _SoftAskSheet extends StatelessWidget {
  final AppStrings strings;
  final String reason;

  const _SoftAskSheet({required this.strings, required this.reason});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final s = strings;

    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.86),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(AppCorners.xl)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsetsDirectional.fromSTEB(20, 10, 20, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: t.hairline,
                  borderRadius: BorderRadius.circular(AppCorners.pill),
                ),
              ),
              const SizedBox(height: 20),
              ExcludeSemantics(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    gradient: t.signatureGradient,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: t.accent.withValues(alpha: 0.26),
                        blurRadius: 18,
                        offset: const Offset(0, 8),
                        spreadRadius: -2,
                      ),
                    ],
                  ),
                  child: const Icon(Icons.notifications_active_rounded, color: Colors.white, size: 30),
                ),
              ),
              const SizedBox(height: 16),
              Semantics(
                header: true,
                child: Text(
                  s.pushAskTitle,
                  textAlign: TextAlign.center,
                  style: AppText.title2.copyWith(color: t.ink),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                reason,
                textAlign: TextAlign.center,
                style: AppText.body.copyWith(color: t.inkSoft),
              ),
              const SizedBox(height: 18),
              _SoftAskPerk(icon: Icons.local_shipping_outlined, label: s.pushAskOrders),
              _SoftAskPerk(icon: Icons.inventory_2_outlined, label: s.pushAskRestock),
              _SoftAskPerk(icon: Icons.local_offer_outlined, label: s.pushAskOffers),
              const SizedBox(height: 20),
              PrimaryPillButton(
                label: s.pushAskAllow,
                icon: Icons.notifications_rounded,
                onTap: () => Navigator.of(context).pop(true),
              ),
              const SizedBox(height: 6),
              SizedBox(
                width: double.infinity,
                height: kMinTapTarget,
                child: TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  style: TextButton.styleFrom(shape: const StadiumBorder()),
                  child: Text(s.pushAskLater, style: AppText.label.copyWith(color: t.inkSoft)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SoftAskPerk extends StatelessWidget {
  final IconData icon;
  final String label;

  const _SoftAskPerk({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          ExcludeSemantics(
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: t.accentLight,
                borderRadius: BorderRadius.circular(AppCorners.sm),
              ),
              child: Icon(icon, size: 19, color: t.accentDark),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: AppText.bodySmall.copyWith(color: t.ink, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
