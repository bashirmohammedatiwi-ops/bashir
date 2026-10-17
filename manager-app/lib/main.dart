import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/background.dart';
import 'core/prefs.dart';
import 'core/scanner_bus.dart';
import 'core/theme.dart';
import 'data/session.dart';
import 'features/auth/login_screen.dart';
import 'features/shell/home_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Prefs.init();
  await BackgroundOrders.init();
  ScannerBus.instance.attach();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarIconBrightness: Brightness.dark),
  );
  runApp(const ProviderScope(child: ManagerApp()));
}

final _navKey = GlobalKey<NavigatorState>();

class ManagerApp extends ConsumerWidget {
  const ManagerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    // خروج أو انتهاء الجلسة: نغلق كل الصفحات المفتوحة فوق شاشة الدخول.
    ref.listen(sessionProvider, (prev, next) {
      if (prev?.state == AuthState.signedIn && next.state == AuthState.signedOut) {
        _navKey.currentState?.popUntil((r) => r.isFirst);
      }
    });
    return MaterialApp(
      navigatorKey: _navKey,
      title: 'ديما — المدير',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: switch (session.state) {
        AuthState.loading => const _Splash(),
        AuthState.signedOut => const LoginScreen(),
        AuthState.signedIn => const HomeShell(),
      },
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => const Scaffold(
    backgroundColor: AppColors.primaryDeep,
    body: Center(child: CircularProgressIndicator(color: Colors.white)),
  );
}
