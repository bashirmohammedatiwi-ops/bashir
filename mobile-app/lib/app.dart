import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/bootstrap/app_storage.dart';
import 'core/bootstrap/app_warmup.dart';
import 'core/config/app_config.dart';
import 'core/connectivity/connectivity_provider.dart';
import 'core/l10n/locale_provider.dart';
import 'core/network/api_client.dart';
import 'core/l10n/localized_text.dart';
import 'core/navigation/pending_push_navigation.dart';
import 'core/push/push_service.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_text.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_mode_provider.dart';
import 'core/widgets/keyboard_dismiss.dart';
import 'core/widgets/responsive_app.dart';
import 'core/widgets/scroll_perf.dart';
import 'features/auth/auth_provider.dart';
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

  /// انتهى ما يلزم من مشهد الافتتاح: اكتمل (ووصلت واجهة الرئيسية أو انتهت مهلتها)،
  /// أو لمسته الزبونة، أو لا داعي له.
  bool _minSplashDone = false;

  /// صمّام الأمان انطلق: نتجاوز الافتتاح حتى لو لم تُعرف الجلسة بعد.
  bool _bootTimedOut = false;
  Timer? _bootWatchdog;

  late final SplashIntro _intro;

  /// واجهة الرئيسية (العالم الظاهر) وصلت أو فشلت — لا داعي لانتظارها خلف المشهد.
  bool _feedReady = false;

  /// اكتمل المشهد طبيعياً قبل وصول الواجهة: ننتظرها حتى [_feedGrace] على الأكثر.
  bool _awaitingFeed = false;
  Timer? _feedGraceTimer;
  ProviderSubscription<Object?>? _feedSub;

  /// آخر تجديد للطلبات والإشعارات عند العودة للتطبيق.
  DateTime _lastAccountRefresh = DateTime.now();

  /// متى غاب التطبيق فعلاً عن الشاشة (hidden/paused) — null إن لم يغب. «inactive»
  /// وحده (ستارة الإشعارات، نافذة إذن، شاشة دفع QiCard فوقه لحظةً) لا يُحتسب.
  DateTime? _hiddenAt;

  /// منذ متى انقطع الاتصال (null والاتصال قائم).
  DateTime? _offlineSince;

  static const _introSeenAtKey = 'intro_seen_at';
  static const _introVersionKey = 'intro_seen_version';
  static const _accountRefreshEvery = Duration(seconds: 60);
  static const _bootTimeout = Duration(seconds: 10);

  /// أقل غياب عن التطبيق (أو انقطاع) يستحق تجديد المتجر عند العودة.
  static const _awayForRefresh = Duration(seconds: 45);

  /// أقصى انتظار لواجهة الرئيسية بعد اكتمال المشهد — بعدها يظهر هيكل التحميل.
  static const _feedGrace = Duration(milliseconds: 1200);

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
      // الرئيسية تُبنى تحت المشهد: نعرف متى وصلت واجهتها كي لا يكشف المشهد هيكل تحميل.
      _feedSub = ref.listenManual<AsyncValue<Object?>>(activeHomeFeedProvider, (_, next) {
        if (!next.hasValue && !next.hasError) return;
        _feedReady = true;
        if (_awaitingFeed) _endIntro();
      }, fireImmediately: true);
    }

    _bootWatchdog = Timer(_bootTimeout, _forcePastSplash);

    ref.listenManual<AsyncValue<bool>>(connectivityProvider, (previous, next) {
      final online = next.valueOrNull;
      if (online == false) _offlineSince ??= DateTime.now();
      if (previous?.valueOrNull == false && online == true) _onBackOnline();
    });
  }

  @override
  void dispose() {
    _bootWatchdog?.cancel();
    _feedGraceTimer?.cancel();
    _feedSub?.close();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.hidden:
      case AppLifecycleState.paused:
        _hiddenAt ??= DateTime.now();
      case AppLifecycleState.resumed:
        final hiddenAt = _hiddenAt;
        _hiddenAt = null;
        // inactive ثم resumed فقط: لم يغب التطبيق عن الشاشة — لا تجديد.
        if (hiddenAt == null) return;
        // المسار الوحيد لتجديد المتجر عند العودة: بعد غياب حقيقي ≥45 ث، ومرة كل
        // 3 دقائق على الأكثر (الموعد مشترك مع الإقلاع وعودة الاتصال).
        if (DateTime.now().difference(hiddenAt) >= _awayForRefresh) {
          refreshStorefrontCatalogOnResume(ref);
        }
        _refreshAccountOnResume();
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
        break;
    }
  }

  @override
  void didHaveMemoryPressure() {
    // النظام يطلب ذاكرة (هاتف بسيط، تطبيقات كثيرة مفتوحة): نترك الصور المفكوكة
    // لتُفكّ من جديد عند الحاجة (ملفاتها باقية في كاش القرص) بدل أن يُغلق التطبيق.
    final images = PaintingBinding.instance.imageCache;
    images.clear();
    images.clearLiveImages();
    // ردود الـ API المفكوكة في الذاكرة — القراءة التالية من ملفات القرص.
    try {
      ref.read(apiCacheProvider).trimMemory();
    } catch (_) {}
  }

  @override
  void didChangeAccessibilityFeatures() {
    // مدد الانتقالات تتبع «تقليل الحركة» لحظة تغييره.
    if (mounted) setState(() {});
  }

  /// المشهد كاملاً في أول تشغيل، وأول تشغيل بعد كل تحديث للتطبيق؛ وإلا النسخة
  /// المختصرة (~1 ث).
  SplashIntro _planIntro() {
    final prefs = appSharedPreferences;
    final version = widget.appVersion;
    final seenBefore =
        prefs.containsKey(_introSeenAtKey) || prefs.containsKey(_introVersionKey);
    final newVersion =
        version.isNotEmpty && prefs.getString(_introVersionKey) != version;
    if (seenBefore && !newVersion) return SplashIntro.short;
    prefs
        .setInt(_introSeenAtKey, DateTime.now().millisecondsSinceEpoch)
        .catchError((_) => false);
    if (version.isNotEmpty) {
      prefs.setString(_introVersionKey, version).catchError((_) => false);
    }
    return SplashIntro.full;
  }

  /// فُتح التطبيق بلمس إشعار: نتجاوز المشهد ونأخذها لوجهة الإشعار مباشرة.
  ///
  /// النظام يسلّم إشعار الفتح مرة واحدة فقط: من يأخذه أولاً (هنا عادةً) يفتحه،
  /// وPushService.init يجده مأخوذاً. لا شيء ينتظر هذا الفحص.
  Future<void> _watchLaunchPush() async {
    if (!AppConfig.pushNotificationsEnabled) return;
    final message = await PushService.claimLaunchMessage();
    if (message == null || !mounted) return;
    _endIntro();
    // الـ router جاهز من أول إطار، لكن الوجهة (طلب، إشعاراتي…) تحتاج معرفة الجلسة.
    if (ref.read(authProvider).status == AuthStatus.unknown) {
      await _whenAuthKnown();
    }
    PendingPushNavigation.queue(PushService.payloadOf(message));
  }

  /// تنتهي حين تُعرف الجلسة (حساب أو زائرة)، أو بعد مهلة صمّام الأمان.
  Future<void> _whenAuthKnown() async {
    final known = Completer<void>();
    final sub = ref.listenManual<AuthStatus>(
      authProvider.select((a) => a.status),
      (_, status) {
        if (status != AuthStatus.unknown && !known.isCompleted) known.complete();
      },
    );
    try {
      await known.future.timeout(_bootTimeout, onTimeout: () {});
    } finally {
      sub.close();
    }
  }

  /// اكتمل المشهد: لمسة ([skipped]) تكشف الرئيسية فوراً؛ أما الاكتمال الطبيعي
  /// فينتظر واجهتها قليلاً إن لم تصل بعد (من الكاش تصل عادةً قبل نهايته).
  void _onIntroFinished(bool skipped) {
    final picking = !ref.read(appLocaleProvider).hasChosen;
    if (skipped || _feedReady || picking || _minSplashDone) {
      _endIntro();
      return;
    }
    _awaitingFeed = true;
    _feedGraceTimer ??= Timer(_feedGrace, _endIntro);
  }

  void _endIntro() {
    _awaitingFeed = false;
    _feedGraceTimer?.cancel();
    _feedSub?.close();
    _feedSub = null;
    if (mounted && !_minSplashDone) setState(() => _minSplashDone = true);
  }

  /// صمّام أمان: قراءة الجلسة علِقت (مخزن المفاتيح بعد تحديث النظام مثلاً)
  /// فنفتح المتجر كزائرة بدل افتتاح لا ينتهي. الجلسة تلحق حين تُقرأ.
  void _forcePastSplash() {
    if (!mounted) return;
    final authUnknown = ref.read(authProvider).status == AuthStatus.unknown;
    if (!authUnknown && _minSplashDone) return;
    debugPrint('[app] boot watchdog fired (auth unknown: $authUnknown)');
    _endIntro();
    setState(() => _bootTimedOut = true);
  }

  /// انتهى تلاشي المشهد: الواجهة ظاهرة للزبونة.
  void _onSplashGone() => PushService.uiVisible.value = true;

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

  /// عاد الاتصال: نعيد ما فشل أثناء الانقطاع فقط (بلا جلب إجباري ولا مسح كاش).
  /// إن لم يفشل شيء وطال الانقطاع (≥45 ث) فتجديد خفيف بموعد العودة نفسه (مرة كل
  /// 3 دقائق) — تذبذب الشبكة لا يكلّف طلباً واحداً.
  void _onBackOnline() {
    final offlineSince = _offlineSince;
    _offlineSince = null;
    if (!mounted) return;
    final retried = retryFailedStorefront(ref);
    if (retried || offlineSince == null) return;
    if (DateTime.now().difference(offlineSince) >= _awayForRefresh) {
      refreshStorefrontCatalogOnResume(ref);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_warmedUp) {
      _warmedUp = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => warmupAppData(ref));
    }

    final authStatus = ref.watch(authProvider.select((a) => a.status));
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

    final router = ref.watch(routerProvider);
    final brightness = ref.watch(effectiveBrightnessProvider);
    // شريطا النظام يتبعان السطوع المطبَّق؛ الشاشات التي تبدأ فوق صورة تضبط
    // شريط الحالة بنفسها فوق هذا الأساس.
    final overlay = systemOverlayStyleFor(
      brightness,
      navigationBar: brightness == Brightness.dark
          ? ref.watch(activeWorldThemeProvider).surface
          : null,
    );
    // الـ router موجود من أول إطار (تحت المشهد)؛ وجهة إشعار معلّق تُفتح حين تُعرف
    // الجلسة — فتُبنى تحت المشهد وتظهر لحظة انتهائه.
    if (!booting || _bootTimedOut) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => PendingPushNavigation.flush(),
      );
    }

    // تطبيق واحد من أول إطار: الرئيسية تُبنى وتُخطَّط تحت طبقة المشهد، فلا يبقى عند
    // الانتقال إلا تلاشي المشهد نفسه.
    // MaterialApp يحرّك تغيّر الثيم بنفسه (تبديل العالم) — لا AnimatedTheme فوقه.
    return MaterialApp.router(
      onGenerateTitle: (_) => AppConfig.displayStoreName(lang),
      debugShowCheckedModeBanner: false,
      theme: ref.watch(appThemeDataProvider),
      // الليلي لا يُبنى قبل تفعيله؛ وthemeMode من السطوع المحسوب نفسه حتى يتفق
      // الثيم مع ألوان العالم (context.worldTheme وref.worldTheme) دائماً.
      darkTheme: AppConfig.darkModeEnabled
          ? ref.watch(appDarkThemeDataProvider)
          : null,
      themeMode: brightness == Brightness.dark
          ? ThemeMode.dark
          : ThemeMode.light,
      themeAnimationDuration: reduceMotion
          ? Duration.zero
          : const Duration(milliseconds: 320),
      themeAnimationCurve: Curves.easeOutCubic,
      scrollBehavior: const AppScrollBehavior(),
      routerConfig: router,
      locale: locale,
      supportedLocales: _locales,
      localizationsDelegates: _delegates,
      builder: (context, child) => AnnotatedRegion<SystemUiOverlayStyle>(
        value: overlay,
        child: ResponsiveApp(
          child: Directionality(
            textDirection: direction,
            child: _SplashLayer(
              visible: showSplash,
              reduceMotion: reduceMotion,
              onGone: _onSplashGone,
              // المشهد بألوانه الثابتة (فاتح) مهما كان مظهر التطبيق.
              splash: Theme(
                data: AppTheme.light,
                child: SplashScreen(intro: _intro, onFinished: _onIntroFinished),
              ),
              child: _OfflineBanner(
                // فحص تحديث التطبيق (إجباري/اختياري) من إعدادات لوحة التحكم.
                child: AppUpdateGate(
                  child: DismissKeyboard(
                    child: child ?? const SizedBox.shrink(),
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

/// طبقة المشهد فوق التطبيق: ما دام المشهد ظاهراً كاملاً فالتطبيق تحته مبنيّ
/// ومُخطَّط لكنه لا يُرسم ولا تتحرك مؤقّتاته (لا يزاحم المشهد على الهواتف البسيطة)،
/// ولا يُلمس ولا يقرؤه قارئ الشاشة. عند الانتهاء يتلاشى المشهد وحده (شفافية فقط،
/// في طبقة رسم مستقلة) والتطبيق ظاهر تحته، ثم يُزال المشهد من الشجرة.
class _SplashLayer extends StatefulWidget {
  final bool visible;
  final bool reduceMotion;
  final Widget splash;
  final Widget child;

  /// المشهد زال تماماً (أو لم يظهر أصلاً).
  final VoidCallback onGone;

  const _SplashLayer({
    required this.visible,
    required this.reduceMotion,
    required this.splash,
    required this.child,
    required this.onGone,
  });

  @override
  State<_SplashLayer> createState() => _SplashLayerState();
}

class _SplashLayerState extends State<_SplashLayer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _fade = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 360),
    value: 1,
  );
  late final Animation<double> _opacity = CurvedAnimation(
    parent: _fade,
    curve: Curves.easeInCubic,
  );

  /// المشهد في الشجرة (ظاهر أو يتلاشى).
  late bool _present = widget.visible;

  @override
  void initState() {
    super.initState();
    if (!_present) {
      WidgetsBinding.instance.addPostFrameCallback((_) => widget.onGone());
    }
  }

  @override
  void didUpdateWidget(covariant _SplashLayer old) {
    super.didUpdateWidget(old);
    if (old.visible == widget.visible) return;
    if (widget.visible) {
      _fade.value = 1;
      _present = true;
      return;
    }
    if (widget.reduceMotion) {
      _fade.value = 0;
      _remove();
      return;
    }
    _fade.reverse().whenCompleteOrCancel(() {
      if (mounted && !widget.visible) setState(_remove);
    });
  }

  void _remove() {
    if (!_present) return;
    _present = false;
    WidgetsBinding.instance.addPostFrameCallback((_) => widget.onGone());
  }

  @override
  void dispose() {
    _fade.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // مغطّى بالكامل: المشهد ظاهر ولم يبدأ تلاشيه.
    final covered = _present && widget.visible;
    return Stack(
      fit: StackFit.expand,
      children: [
        Offstage(
          offstage: covered,
          child: TickerMode(enabled: !covered, child: widget.child),
        ),
        if (_present)
          IgnorePointer(
            // أثناء التلاشي اللمس للرئيسية تحته.
            ignoring: !widget.visible,
            child: ExcludeSemantics(
              excluding: !widget.visible,
              child: FadeTransition(
                opacity: _opacity,
                child: RepaintBoundary(child: widget.splash),
              ),
            ),
          ),
      ],
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
    // scrim: الحبر في الفاتح، وأغمق من الخلفية في الليلي (النص أبيض في الحالتين).
    final color = offline ? context.worldTheme.scrim : AppColors.successDeep;

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
