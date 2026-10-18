import 'features/update/app_update.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/bootstrap/app_warmup.dart';
import 'core/l10n/locale_provider.dart';
import 'core/navigation/pending_push_navigation.dart';
import 'core/push/push_service.dart';
import 'core/config/app_config.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/keyboard_dismiss.dart';
import 'core/widgets/responsive_app.dart';
import 'core/widgets/scroll_perf.dart';
import 'features/auth/auth_provider.dart';
import 'features/catalog/catalog_refresh.dart';
import 'features/splash/splash_screen.dart';
import 'features/worlds/world_theme.dart';

class AlhayaaApp extends ConsumerStatefulWidget {
  const AlhayaaApp({super.key});

  @override
  ConsumerState<AlhayaaApp> createState() => _AlhayaaAppState();
}

class _AlhayaaAppState extends ConsumerState<AlhayaaApp>
    with WidgetsBindingObserver {
  bool _warmedUp = false;
  bool _pushInited = false;
  bool _minSplashDone = false;

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
    // ننتظر اكتمال مشهد الافتتاح ثم ننتقل.
    Future<void>.delayed(
      SplashScreen.introDuration + const Duration(milliseconds: 150),
      () {
        if (mounted) setState(() => _minSplashDone = true);
      },
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      refreshStorefrontCatalogOnResume(ref);
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
    final direction = localeSettings.direction;
    final booting = authStatus == AuthStatus.unknown || !localeSettings.loaded;
    final showSplash = booting || !_minSplashDone;

    if (showSplash) {
      return _SplashSwitch(
        showSplash: true,
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
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
          home: SplashScreen(
            lang: localeSettings.loaded ? locale.languageCode : 'ar',
          ),
        ),
      );
    }

    final router = ref.watch(routerProvider);
    final worldTheme = ref.watch(activeWorldThemeProvider);
    // بعد ظهور الـ router (انتهاء الـ splash) نفّذ أي إشعار معلّق.
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => PendingPushNavigation.flush(),
    );

    return _SplashSwitch(
      showSplash: false,
      child: AnimatedTheme(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
        data: worldTheme.applyTo(AppTheme.light),
        child: MaterialApp.router(
          title: AppConfig.storeName,
          debugShowCheckedModeBanner: false,
          theme: worldTheme.applyTo(AppTheme.light),
          scrollBehavior: const AppScrollBehavior(),
          routerConfig: router,
          locale: locale,
          supportedLocales: _locales,
          localizationsDelegates: _delegates,
          builder: (context, child) => ResponsiveApp(
            child: Directionality(
              textDirection: direction,
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
  final Widget child;
  const _SplashSwitch({required this.showSplash, required this.child});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 750),
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
