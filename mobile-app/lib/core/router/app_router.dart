import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/navigation/deep_link_redirect.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/navigation/app_navigation.dart';

import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/brands/brands_screen.dart';
import '../../features/checkout/checkout_screen.dart';
import '../../features/checkout/order_success_screen.dart';
import '../../features/orders/order_detail_screen.dart';
import '../../features/orders/orders_screen.dart';
import '../../features/packages/package_detail_screen.dart';
import '../../features/products/product_detail_screen.dart';
import '../../features/products/product_listing_screen.dart';
import '../../features/products/slug_listing_screen.dart';
import '../../features/profile/addresses_screen.dart';
import '../../features/profile/change_password_screen.dart';
import '../../features/profile/edit_profile_screen.dart';
import '../../features/profile/loyalty_screen.dart';
import '../../features/profile/notifications_screen.dart';
import '../../features/search/qr_scan_screen.dart';
import '../../features/search/search_screen.dart';
import '../../features/settings/about_app_screen.dart';
import '../../features/settings/language_picker_screen.dart';
import '../../features/settings/legal_document_screen.dart';
import '../../features/settings/open_source_licenses_screen.dart';
import '../../features/shell/main_shell.dart';
import '../../features/wishlist/wishlist_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(appLocaleProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final localeSettings = ref.read(appLocaleProvider);
      if (!localeSettings.loaded) return null;

      final path = state.uri.path;
      if (!localeSettings.hasChosen && path != '/language') {
        return '/language';
      }
      if (localeSettings.hasChosen && path == '/language') {
        return '/';
      }

      final mapped = resolveDeepLink(state.uri);
      if (mapped != null) {
        final current = state.uri.hasQuery ? '$path?${state.uri.query}' : path;
        if (mapped != current && mapped != path) return mapped;
      }

      if (path == '/cart') {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final container = ProviderScope.containerOf(context);
          openCartTab(context, container);
        });
        return '/';
      }
      if (path == '/offers') {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final container = ProviderScope.containerOf(context);
          openOffersTab(context, container);
        });
        return '/';
      }
      if (path == '/categories' || path == '/categories-tab') {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final container = ProviderScope.containerOf(context);
          openCategoriesTab(context, container);
        });
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/language', builder: (_, __) => const LanguagePickerScreen()),
      GoRoute(path: '/', builder: (_, __) => const MainShell()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
      GoRoute(path: '/scan', builder: (_, __) => const QrScanScreen()),
      GoRoute(path: '/brands', builder: (_, __) => const BrandsScreen()),
      GoRoute(
        path: '/product/:id',
        builder: (_, s) => ProductDetailScreen(idOrSlug: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/category/:slug',
        builder: (_, s) => CategorySlugListingScreen(slug: s.pathParameters['slug']!),
      ),
      GoRoute(
        path: '/brand/:slug',
        builder: (_, s) => BrandSlugListingScreen(slug: s.pathParameters['slug']!),
      ),
      GoRoute(
        path: '/products',
        builder: (_, s) => ProductListingScreen(
          title: s.uri.queryParameters['title'] ?? ref.read(stringsProvider).products,
          categoryId: s.uri.queryParameters['categoryId'],
          subcategoryId: s.uri.queryParameters['subcategoryId'],
          tertiaryCategoryId: s.uri.queryParameters['tertiaryCategoryId'],
          brandId: s.uri.queryParameters['brandId'],
          search: s.uri.queryParameters['search'],
          isNew: s.uri.queryParameters['isNew'] == '1',
          isBestSeller: s.uri.queryParameters['isBestSeller'] == '1',
          isPromo: s.uri.queryParameters['isPromo'] == '1',
          isFeatured: s.uri.queryParameters['isFeatured'] == '1',
          concernSlug: s.uri.queryParameters['concernSlug'],
        ),
      ),
      GoRoute(
        path: '/package/:id',
        builder: (_, s) => PackageDetailScreen(idOrSlug: s.pathParameters['id']!),
      ),
      GoRoute(path: '/checkout', builder: (_, __) => const CheckoutScreen()),
      GoRoute(
        path: '/order-success/:id',
        builder: (_, s) => OrderSuccessScreen(orderId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/orders', builder: (_, __) => const OrdersScreen()),
      GoRoute(
        path: '/orders/:id',
        builder: (_, s) => OrderDetailScreen(orderId: s.pathParameters['id']!),
      ),
      GoRoute(path: '/addresses', builder: (_, __) => const AddressesScreen()),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: '/loyalty', builder: (_, __) => const LoyaltyScreen()),
      GoRoute(path: '/edit-profile', builder: (_, __) => const EditProfileScreen()),
      GoRoute(path: '/change-password', builder: (_, __) => const ChangePasswordScreen()),
      GoRoute(path: '/wishlist', builder: (_, __) => const WishlistScreen()),
      GoRoute(
        path: '/language-settings',
        builder: (_, __) => const LanguagePickerScreen(fromSettings: true),
      ),
      GoRoute(
        path: '/privacy',
        builder: (_, __) => const LegalDocumentScreen(type: LegalDocumentType.privacy),
      ),
      GoRoute(
        path: '/terms',
        builder: (_, __) => const LegalDocumentScreen(type: LegalDocumentType.terms),
      ),
      GoRoute(path: '/about', builder: (_, __) => const AboutAppScreen()),
      GoRoute(path: '/licenses', builder: (_, __) => const OpenSourceLicensesScreen()),
    ],
    errorBuilder: (context, state) => Consumer(
      builder: (context, ref, _) {
        final s = ref.watch(stringsProvider);
        return Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(s.pageNotFound, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                TextButton(onPressed: () => context.go('/'), child: Text(s.goHome)),
              ],
            ),
          ),
        );
      },
    ),
  );
});
