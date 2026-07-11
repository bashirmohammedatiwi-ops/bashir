import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../features/auth/login_screen.dart';
import '../features/scan/scan_screen.dart';
import '../features/import/results_screen.dart';
import '../features/import/text_search_screen.dart';
import '../features/import/product_import_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/scan',
    refreshListenable: _AuthListenable(ref),
    redirect: (context, state) {
      if (auth.loading) return null;
      final loggingIn = state.matchedLocation == '/login';
      if (!auth.isAuthenticated) return loggingIn ? null : '/login';
      if (loggingIn) return '/scan';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/scan', builder: (_, __) => const ScanScreen()),
      GoRoute(
        path: '/results',
        builder: (_, state) {
          final barcode = state.uri.queryParameters['barcode'] ?? '';
          return ResultsScreen(barcode: barcode);
        },
      ),
      GoRoute(
        path: '/search',
        builder: (_, state) {
          final q = state.uri.queryParameters['q'] ?? '';
          return TextSearchScreen(initialQuery: q);
        },
      ),
      GoRoute(
        path: '/import/:store/:id',
        builder: (_, state) {
          final store = state.pathParameters['store'] ?? '';
          final id = state.pathParameters['id'] ?? '';
          final barcode = state.uri.queryParameters['barcode'];
          final shadeCount = int.tryParse(state.uri.queryParameters['shades'] ?? '') ?? 0;
          final storeLabel = state.uri.queryParameters['label'] ?? '';
          return ProductImportScreen(
            key: ValueKey('import-$store-$id'),
            store: store,
            sourceId: id,
            barcode: barcode,
            shadeCountHint: shadeCount,
            storeLabel: storeLabel,
          );
        },
      ),
    ],
  );
});

class _AuthListenable extends ChangeNotifier {
  _AuthListenable(this.ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }
  final Ref ref;
}
