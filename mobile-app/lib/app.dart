import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/bootstrap/app_warmup.dart';
import 'core/push/push_service.dart';
import 'core/config/app_config.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/auth_provider.dart';
import 'features/auth/screens/welcome_screen.dart';

class AlhayaaApp extends ConsumerStatefulWidget {
  const AlhayaaApp({super.key});

  @override
  ConsumerState<AlhayaaApp> createState() => _AlhayaaAppState();
}

class _AlhayaaAppState extends ConsumerState<AlhayaaApp> {
  bool _animationDone = false;
  bool _warmedUp = false;
  bool _pushInited = false;

  static const _locales = [Locale('ar'), Locale('en')];
  static const _delegates = [
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ];

  @override
  Widget build(BuildContext context) {
    if (!_warmedUp) {
      _warmedUp = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => warmupAppData(ref));
    }

    final authStatus = ref.watch(authProvider).status;
    if (!_pushInited && authStatus != AuthStatus.unknown) {
      _pushInited = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => PushService.init(ref));
    }

    final showSplash = authStatus == AuthStatus.unknown || !_animationDone;

    if (showSplash) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        locale: const Locale('ar'),
        supportedLocales: _locales,
        localizationsDelegates: _delegates,
        builder: (context, child) => Directionality(
          textDirection: TextDirection.rtl,
          child: child ?? const SizedBox.shrink(),
        ),
        home: WelcomeScreen(
          onAnimationComplete: () {
            if (mounted) setState(() => _animationDone = true);
          },
        ),
      );
    }

    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: AppConfig.storeName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
      locale: const Locale('ar'),
      supportedLocales: _locales,
      localizationsDelegates: _delegates,
      builder: (context, child) => Directionality(
        textDirection: TextDirection.rtl,
        child: child ?? const SizedBox.shrink(),
      ),
    );
  }
}
