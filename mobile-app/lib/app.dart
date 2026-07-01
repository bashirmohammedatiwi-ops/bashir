import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/config/app_config.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/auth_provider.dart';
import 'features/auth/screens/splash_screen.dart';

class AlhayaaApp extends ConsumerStatefulWidget {
  const AlhayaaApp({super.key});

  @override
  ConsumerState<AlhayaaApp> createState() => _AlhayaaAppState();
}

class _AlhayaaAppState extends ConsumerState<AlhayaaApp> {
  bool _animationDone = false;

  static const _locales = [Locale('ar'), Locale('en')];
  static const _delegates = [
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ];

  @override
  Widget build(BuildContext context) {
    final authStatus = ref.watch(authProvider).status;
    final showSplash = authStatus == AuthStatus.unknown || !_animationDone;

    if (showSplash) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: ThemeData(brightness: Brightness.dark),
        locale: const Locale('ar'),
        supportedLocales: _locales,
        localizationsDelegates: _delegates,
        home: SplashScreen(
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
