import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/bootstrap/app_warmup.dart';
import 'core/l10n/locale_provider.dart';
import 'core/push/push_service.dart';
import 'core/config/app_config.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/responsive_app.dart';
import 'core/widgets/scroll_perf.dart';
import 'features/auth/auth_provider.dart';
import 'features/catalog/catalog_refresh.dart';
import 'features/splash/splash_screen.dart';

class AlhayaaApp extends ConsumerStatefulWidget {
  const AlhayaaApp({super.key});

  @override
  ConsumerState<AlhayaaApp> createState() => _AlhayaaAppState();
}

class _AlhayaaAppState extends ConsumerState<AlhayaaApp> with WidgetsBindingObserver {
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
    Future<void>.delayed(const Duration(milliseconds: 1100), () {
      if (mounted) setState(() => _minSplashDone = true);
    });
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
      WidgetsBinding.instance.addPostFrameCallback((_) => PushService.init(ref));
    }

    final localeSettings = ref.watch(appLocaleProvider);
    final locale = localeSettings.locale;
    final direction = localeSettings.direction;
    final booting = authStatus == AuthStatus.unknown || !localeSettings.loaded;
    final showSplash = booting || !_minSplashDone;

    if (showSplash) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        scrollBehavior: const AppScrollBehavior(),
        locale: locale,
        supportedLocales: _locales,
        localizationsDelegates: _delegates,
        builder: (context, child) => ResponsiveApp(
          child: Directionality(
            textDirection: direction,
            child: child ?? const SizedBox.shrink(),
          ),
        ),
        home: SplashScreen(
          lang: localeSettings.loaded ? locale.languageCode : 'ar',
        ),
      );
    }

    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: AppConfig.storeName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      scrollBehavior: const AppScrollBehavior(),
      routerConfig: router,
      locale: locale,
      supportedLocales: _locales,
      localizationsDelegates: _delegates,
      builder: (context, child) => ResponsiveApp(
        child: Directionality(
          textDirection: direction,
          child: child ?? const SizedBox.shrink(),
        ),
      ),
    );
  }
}
