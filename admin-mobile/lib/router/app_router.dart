import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/network/api_client.dart';
import '../providers/auth_provider.dart';
import '../features/auth/login_screen.dart';
import '../features/scan/scan_screen.dart';
import '../features/ai/ai_add_screen.dart';
import '../features/ai/existing_product_review_screen.dart';
import '../features/shades/shade_family_scan_screen.dart';
import '../features/shades/shade_family_wizard_screen.dart';
import '../features/home/home_shell.dart';
import '../features/home/daily_progress_screen.dart';
import '../features/import/results_screen.dart';
import '../features/import/text_search_screen.dart';
import '../features/import/gpt_autofill_screen.dart';
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
      ShellRoute(
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(
            path: '/scan',
            builder: (_, __) => const ScanScreen(),
          ),
          GoRoute(
            path: '/ai-add',
            builder: (_, __) => const AiAddScreen(),
          ),
          GoRoute(
            path: '/shade-family',
            builder: (_, __) => const ShadeFamilyScanScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/shade-family/wizard',
        builder: (_, state) {
          final extra = state.extra;
          var barcodes = <String>[];
          String? hint;
          String? model;
          if (extra is Map) {
            barcodes = (extra['barcodes'] as List? ?? []).map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
            hint = extra['hint']?.toString();
            model = extra['model']?.toString();
          }
          if (barcodes.isEmpty) {
            barcodes = (state.uri.queryParameters['barcodes'] ?? '')
                .split(',')
                .map((s) => s.trim())
                .where((s) => s.isNotEmpty)
                .toList();
            hint ??= state.uri.queryParameters['hint'];
            model ??= state.uri.queryParameters['model'];
          }
          return ShadeFamilyWizardScreen(
            barcodes: barcodes,
            hint: hint,
            modelId: model,
          );
        },
      ),
      GoRoute(
        path: '/daily-progress',
        builder: (_, __) => const DailyProgressScreen(),
      ),
      GoRoute(
        path: '/results',
        builder: (_, state) {
          final barcode = state.uri.queryParameters['barcode'] ?? '';
          return ResultsScreen(barcode: barcode);
        },
      ),
      GoRoute(
        path: '/gpt-autofill',
        builder: (_, state) {
          final barcode = state.uri.queryParameters['barcode'] ?? '';
          final hint = state.uri.queryParameters['hint'];
          final manual = state.uri.queryParameters['manual'] == '1';
          final model = state.uri.queryParameters['model'];
          return GptAutofillScreen(
            barcode: barcode,
            hint: hint,
            manualMode: manual,
            modelId: model,
          );
        },
      ),
      GoRoute(
        path: '/product-review',
        builder: (_, state) {
          final id = state.uri.queryParameters['id'] ?? '';
          final barcode = state.uri.queryParameters['barcode'] ?? '';
          final model = state.uri.queryParameters['model'];
          final auto = state.uri.queryParameters['auto'] == '1';
          return ExistingProductReviewScreen(
            productId: id,
            barcode: barcode,
            modelId: model,
            autoReview: auto,
          );
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
    ref.listen<int>(sessionLostProvider, (prev, next) {
      if ((prev ?? 0) < next) {
        ref.read(authProvider.notifier).logout();
      }
      notifyListeners();
    });
  }
  final Ref ref;
}
