import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/bootstrap/app_storage.dart';
import 'core/bootstrap/app_warmup.dart';
import 'core/config/app_config.dart';
import 'core/connectivity/connectivity_provider.dart';
import 'core/l10n/locale_provider.dart';
import 'core/l10n/localized_text.dart';
import 'core/navigation/pending_push_navigation.dart';
import 'core/push/firebase_init.dart';
import 'core/push/push_service.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_text.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/keyboard_dismiss.dart';
import 'core/widgets/responsive_app.dart';
import 'core/widgets/scroll_perf.dart';
import 'features/auth/auth_provider.dart';
import 'features/catalog/catalog_providers.dart';
import 'features/catalog/catalog_refresh.dart';
import 'features/profile/profile_providers.dart';
import 'features/splash/splash_screen.dart';
import 'features/update/app_update.dart';
import 'features/worlds/world_theme.dart';
import 'features/worlds/worlds_provider.dart';

class AlhayaaApp extends ConsumerStatefulWidget {
  /// إصدار التطبيق («1.0.0+11») — إصدار جديد يعيد مشهد الافتتاح كاملاً.
  final String appVersion;

  const AlhayaaApp({super.key, this.appVersion = ''});

  @override
  ConsumerState<AlhayaaApp> createState() => _AlhayaaAppState();
}

class _AlhayaaAppState extends ConsumerState<AlhayaaApp>
    with WidgetsBindingObserver {
  bool _warmedUp = false;
  bool _pushInited = false;

  /// انتهى ما يلزم من مشهد الافتتاح: اكتمل، أو لمسته الزبونة، أو لا داعي له.
  bool _minSplashDone = false;

  /// صمّام الأمان انطلق: نتجاوز الافتتاح حتى لو لم تُعرف الجلسة بعد.
  bool _bootTimedOut = false;
  Timer? _bootWatchdog;

  late final SplashIntro _intro;

  /// آخر تجديد للطلبات والإشعارات عند العودة للتطبيق.
  DateTime _lastAccountRefresh = DateTime.now();

  static const _introSeenAtKey = 'intro_seen_at';
  static const _introVersionKey = 'intro_seen_version';
  static const _fullIntroEvery = Duration(days: 7);
  static const _accountRefreshEvery = Duration(seconds: 60);
  static const _bootTimeout = Duration(seconds: 10);

  static const _locales = [Locale('ar'), Locale('en')];
  static const _delegates = [
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _intro = _planIntro();

    final dispatcher = WidgetsBinding.instance.platformDispatcher;
    final route = dispatcher.defaultRouteName;
    // فُتح من رابط، أو «تقليل الحركة» مفعّل: لا ننتظر المشهد، يكفي اكتمال الإقلاع.
    if ((route.isNotEmpty && route != '/') ||
        dispatcher.accessibilityFeatures.disableAnimations) {
      _minSplashDone = true;
    } else {
      _watchLaunchPush();
    }

    _bootWatchdog = Timer(_bootTimeout, _forcePastSplash);

    ref.listenManual<AsyncValue<bool>>(connectivityProvider, (previous, next) {
      if (previous?.valueOrNull == false && next.valueOrNull == true) {
        _onBackOnline();
      }
    });
  }

  @override
  void dispose() {
    _bootWatchdog?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) return;
    // المسار الوحيد لتجديد المتجر عند العودة (مقيّد بمرة كل 3 دقائق).
    refreshStorefrontCatalogOnResume(ref);
    _refreshAccountOnResume();
  }

  @override
  void didChangeAccessibilityFeatures() {
    // مدد الانتقالات تتبع «تقليل الحركة» لحظة تغييره.
    if (mounted) setState(() {});
  }

  /// المشهد كاملاً في أول تشغيل، وبعد كل تحديث للتطبيق، ومرة كل أسبوع؛
  /// وإلا النسخة المختصرة.
  SplashIntro _planIntro() {
    final prefs = appSharedPreferences;
    final now = DateTime.now();
    final version = widget.appVersion;
    final seenAt = prefs.getInt(_introSeenAtKey);
    final due =
        seenAt == null ||
        now.difference(DateTime.fromMillisecondsSinceEpoch(seenAt)) >=
            _fullIntroEvery ||
        (version.isNotEmpty && prefs.getString(_introVersionKey) != version);
    if (!due) return SplashIntro.short;
    prefs
        .setInt(_introSeenAtKey, now.millisecondsSinceEpoch)
        .catchError((_) => false);
    if (version.isNotEmpty) {
      prefs.setString(_introVersionKey, version).catchError((_) => false);
    }
    return SplashIntro.full;
  }

  /// فُتح التطبيق بلمس إشعار: نتجاوز المشهد ونأخذها لوجهة الإشعار مباشرة.
  ///
  /// النظام يسلّم إشعار الفتح مرة واحدة فقط، فنضعه هنا في طابور التنقّل مهما
  /// تأخر وصوله (PushService.init يجده فارغاً بعدها). لا شيء ينتظر هذا الفحص.
  Future<void> _watchLaunchPush() async {
    if (!AppConfig.pushNotificationsEnabled) return;
    try {
      await initFirebaseApp();
      final message = await FirebaseMessaging.instance.getInitialMessage();
      if (message == null) return;
      PendingPushNavigation.queue(_launchPayload(message));
      _endIntro();
    } catch (e) {
      debugPrint('[app] launch notification check failed: $e');
    }
  }

  /// بيانات الإشعار مع عنوانه ونصه وصورته — بنفس صيغة PushService.
  static Map<String, dynamic> _launchPayload(RemoteMessage message) {
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

  void _endIntro() {
    if (mounted && !_minSplashDone) setState(() => _minSplashDone = true);
  }

  /// صمّام أمان: قراءة الجلسة علِقت (مخزن المفاتيح بعد تحديث النظام مثلاً)
  /// فنفتح المتجر كزائرة بدل افتتاح لا ينتهي. الجلسة تلحق حين تُقرأ.
  void _forcePastSplash() {
    if (!mounted) return;
    final authUnknown = ref.read(authProvider).status == AuthStatus.unknown;
    if (!authUnknown && _minSplashDone) return;
    debugPrint('[app] boot watchdog fired (auth unknown: $authUnknown)');
    setState(() {
      _bootTimedOut = true;
      _minSplashDone = true;
    });
  }

  /// الطلبات والإشعارات تتغيّر من لوحة التحكم (شُحن، وصل…) وتبويب الحساب
  /// يبقى حياً: نجدّدها عند العودة، مرة كل دقيقة على الأكثر.
  void _refreshAccountOnResume() {
    if (!ref.read(authProvider).isAuthenticated) return;
    final now = DateTime.now();
    if (now.difference(_lastAccountRefresh) < _accountRefreshEvery) return;
    _lastAccountRefresh = now;
    ref.invalidate(ordersProvider);
    ref.invalidate(notificationsProvider);
  }

  /// عاد الاتصال: نجلب أحدث المتجر، ثم نعيد ما بقي فاشلاً من الانقطاع.
  Future<void> _onBackOnline() async {
    await refreshStorefrontCatalog(ref);
    if (!mounted) return;
    final worlds = ref.read(worldsProvider);
    if (worlds.hasError && !worlds.isLoading) ref.invalidate(worldsProvider);
    final categories = ref.read(categoriesProvider);
    if (categories.hasError && !categories.isLoading) {
      ref.invalidate(categoriesProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_warmedUp) {
      _warmedUp = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => warmupAppData(ref));
    }

    final authStatus = ref.watch(authProvider).status;
    if (AppConfig.pushNotificationsEnabled &&
        !_pushInited &&
        authStatus != AuthStatus.unknown) {
      _pushInited = true;
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => PushService.init(ref),
      );
    }

    final localeSettings = ref.watch(appLocaleProvider);
    final locale = localeSettings.locale;
    final lang = localeSettings.languageCode;
    final direction = localeSettings.direction;
    final booting = authStatus == AuthStatus.unknown || !localeSettings.loaded;
    final showSplash = (booting && !_bootTimedOut) || !_minSplashDone;
    final reduceMotion = WidgetsBinding
        .instance
        .platformDispatcher
        .accessibilityFeatures
        .disableAnimations;

    if (showSplash) {
      return _SplashSwitch(
        showSplash: true,
        reduceMotion: reduceMotion,
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          onGenerateTitle: (_) => AppConfig.displayStoreName(lang),
          theme: AppTheme.light,
          scrollBehavior: const AppScrollBehavior(),
          locale: locale,
          supportedLocales: _locales,
          localizationsDelegates: _delegates,
          builder: (context, child) => ResponsiveApp(
            child: Directionality(
              textDirection: direction,
              child: DismissKeyboard(child: child ?? const SizedBox.shrink()),
            ),
          ),
          home: SplashScreen(intro: _intro, onFinished: _endIntro),
        ),
      );
    }

    final router = ref.watch(routerProvider);
    // بعد ظهور الـ router (انتهاء الـ splash) نفّذ أي إشعار معلّق.
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => PendingPushNavigation.flush(),
    );

    return _SplashSwitch(
      showSplash: false,
      reduceMotion: reduceMotion,
      // MaterialApp يحرّك تغيّر الثيم بنفسه (تبديل العالم) — لا AnimatedTheme فوقه.
      child: MaterialApp.router(
        onGenerateTitle: (_) => AppConfig.displayStoreName(lang),
        debugShowCheckedModeBanner: false,
        theme: ref.watch(appThemeDataProvider),
        themeAnimationDuration: reduceMotion
            ? Duration.zero
            : const Duration(milliseconds: 320),
        themeAnimationCurve: Curves.easeOutCubic,
        scrollBehavior: const AppScrollBehavior(),
        routerConfig: router,
        locale: locale,
        supportedLocales: _locales,
        localizationsDelegates: _delegates,
        builder: (context, child) => ResponsiveApp(
          child: Directionality(
            textDirection: direction,
            child: _OfflineBanner(
              // فحص تحديث التطبيق (إجباري/اختياري) من إعدادات لوحة التحكم.
              child: AppUpdateGate(
                child: DismissKeyboard(child: child ?? const SizedBox.shrink()),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// انتقال الافتتاح: المشهد يتمدّد قليلاً ويتلاشى، والرئيسية تظهر من تحته بهدوء.
class _SplashSwitch extends StatelessWidget {
  final bool showSplash;
  final bool reduceMotion;
  final Widget child;
  const _SplashSwitch({
    required this.showSplash,
    required this.reduceMotion,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: AnimatedSwitcher(
        duration: reduceMotion
            ? Duration.zero
            : const Duration(milliseconds: 400),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        transitionBuilder: (child, animation) {
          final isSplash = child.key == const ValueKey('splash');
          if (isSplash) {
            // الخروج: تكبير خفيف مع التلاشي — كأننا نعبر من خلال الحلقة.
            return FadeTransition(
              opacity: animation,
              child: ScaleTransition(
                scale: Tween<double>(begin: 1.12, end: 1).animate(animation),
                child: child,
              ),
            );
          }
          return FadeTransition(
            opacity: animation,
            child: ScaleTransition(
              scale: Tween<double>(begin: 0.97, end: 1).animate(animation),
              child: child,
            ),
          );
        },
        child: KeyedSubtree(
          key: ValueKey(showSplash ? 'splash' : 'app'),
          child: child,
        ),
      ),
    );
  }
}

enum _NetNotice { hidden, offline, restored }

/// شريط رفيع أعلى الشاشة حين ينقطع الاتصال («نعرض آخر نسخة محفوظة»)، ثم
/// «عاد الاتصال» لحظة عودته قبل أن يُطوى.
///
/// يدفع المحتوى للأسفل بدل أن يغطيه: الشريط يأخذ مكان شريط الحالة، والمحتوى
/// تحته يفقد من هامشه العلوي بقدر ما ظهر من الشريط — فينزل بنعومة.
class _OfflineBanner extends ConsumerStatefulWidget {
  final Widget child;
  const _OfflineBanner({required this.child});

  @override
  ConsumerState<_OfflineBanner> createState() => _OfflineBannerState();
}

class _OfflineBannerState extends ConsumerState<_OfflineBanner> {
  _NetNotice _notice = _NetNotice.hidden;

  /// ما يُعرض أثناء طيّ الشريط (آخر رسالة ظهرت).
  _NetNotice _shown = _NetNotice.offline;
  Timer? _hideTimer;

  @override
  void initState() {
    super.initState();
    // الفحص الأول قد يسبق ظهور الواجهة (فتح التطبيق بلا شبكة).
    if (ref.read(connectivityProvider).valueOrNull == false) {
      _notice = _shown = _NetNotice.offline;
    }
    ref.listenManual<AsyncValue<bool>>(connectivityProvider, (_, next) {
      final online = next.valueOrNull;
      if (online == null) return;
      _hideTimer?.cancel();
      if (!online) {
        _show(_NetNotice.offline);
      } else if (_notice == _NetNotice.offline) {
        _show(_NetNotice.restored);
        _hideTimer = Timer(const Duration(milliseconds: 1800), () {
          if (mounted) setState(() => _notice = _NetNotice.hidden);
        });
      }
    });
  }

  void _show(_NetNotice notice) => setState(() => _notice = _shown = notice);

  @override
  void dispose() {
    _hideTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    return TweenAnimationBuilder<double>(
      tween: Tween(end: _notice == _NetNotice.hidden ? 0 : 1),
      duration: mq.disableAnimations
          ? Duration.zero
          : const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
      child: widget.child,
      builder: (context, v, child) {
        final contentTop = mq.padding.top * (1 - v);
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ClipRect(
              child: Align(
                alignment: Alignment.bottomCenter,
                heightFactor: v,
                child: v == 0
                    ? const SizedBox(width: double.infinity)
                    : _NetStrip(notice: _shown, insets: mq.padding),
              ),
            ),
            Expanded(
              child: MediaQuery(
                data: mq.copyWith(
                  padding: mq.padding.copyWith(top: contentTop),
                  viewPadding: mq.viewPadding.copyWith(
                    top: mq.viewPadding.top * (1 - v),
                  ),
                ),
                child: child!,
              ),
            ),
          ],
        );
      },
    );
  }
}

/// محتوى الشريط: حبر العالم عند الانقطاع، وأخضر هادئ عند العودة.
class _NetStrip extends ConsumerWidget {
  final _NetNotice notice;
  final EdgeInsets insets;
  const _NetStrip({required this.notice, required this.insets});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final offline = notice != _NetNotice.restored;
    final text = offline
        ? localizedText(
            languageCode: lang,
            ar: 'لا يوجد اتصال — نعرض آخر نسخة محفوظة',
            en: 'You are offline — showing saved items',
          )
        : localizedText(
            languageCode: lang,
            ar: 'عاد الاتصال',
            en: 'Back online',
          );
    final color = offline ? context.worldTheme.ink : AppColors.successDeep;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      // أيقونات شريط الحالة فاتحة فوق الشريط الداكن.
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
      child: AnimatedSwitcher(
        duration: MediaQuery.disableAnimationsOf(context)
            ? Duration.zero
            : const Duration(milliseconds: 220),
        child: Material(
          key: ValueKey(offline),
          color: color,
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              insets.left,
              insets.top,
              insets.right,
              0,
            ),
            child: Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(16, 6, 16, 7),
              child: Semantics(
                liveRegion: true,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      offline ? Icons.wifi_off_rounded : Icons.wifi_rounded,
                      size: 16,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        text,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: AppText.bodySmall.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
