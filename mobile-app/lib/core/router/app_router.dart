import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_colors.dart';
import '../theme/app_motion.dart';

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
import '../../features/assistant/assistant_screen.dart';
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
      GoRoute(
        path: '/assistant',
        pageBuilder: (_, state) => appPage(
          child: AssistantScreen(screenProductId: state.extra as String?),
        ),
      ),
      GoRoute(path: '/language', pageBuilder: (_, __) => appPage(child: const LanguagePickerScreen())),
      GoRoute(path: '/', builder: (_, __) => const MainShell()),
      GoRoute(path: '/login', pageBuilder: (_, __) => appPage(child: const LoginScreen())),
      GoRoute(path: '/register', pageBuilder: (_, __) => appPage(child: const RegisterScreen())),
      GoRoute(path: '/search', pageBuilder: (_, __) => appPage(child: const SearchScreen())),
      GoRoute(path: '/scan', pageBuilder: (_, __) => appPage(child: const QrScanScreen())),
      GoRoute(path: '/brands', pageBuilder: (_, __) => appPage(child: const BrandsScreen())),
      GoRoute(
        path: '/product/:id',
        pageBuilder: (_, s) =>
            appPage(child: ProductDetailScreen(idOrSlug: s.pathParameters['id']!)),
      ),
      GoRoute(
        path: '/category/:slug',
        pageBuilder: (_, s) =>
            appPage(child: CategorySlugListingScreen(slug: s.pathParameters['slug']!)),
      ),
      GoRoute(
        path: '/brand/:slug',
        pageBuilder: (_, s) =>
            appPage(child: BrandSlugListingScreen(slug: s.pathParameters['slug']!)),
      ),
      GoRoute(
        path: '/products',
        pageBuilder: (_, s) => appPage(child: ProductListingScreen(
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
        )),
      ),
      GoRoute(
        path: '/package/:id',
        pageBuilder: (_, s) =>
            appPage(child: PackageDetailScreen(idOrSlug: s.pathParameters['id']!)),
      ),
      GoRoute(path: '/checkout', pageBuilder: (_, __) => appPage(child: const CheckoutScreen())),
      GoRoute(
        path: '/order-success/:id',
        pageBuilder: (_, s) =>
            appPage(child: OrderSuccessScreen(orderId: s.pathParameters['id']!)),
      ),
      GoRoute(path: '/orders', pageBuilder: (_, __) => appPage(child: const OrdersScreen())),
      GoRoute(
        path: '/orders/:id',
        pageBuilder: (_, s) =>
            appPage(child: OrderDetailScreen(orderId: s.pathParameters['id']!)),
      ),
      GoRoute(path: '/addresses', pageBuilder: (_, __) => appPage(child: const AddressesScreen())),
      GoRoute(path: '/notifications', pageBuilder: (_, __) => appPage(child: const NotificationsScreen())),
      GoRoute(path: '/loyalty', pageBuilder: (_, __) => appPage(child: const LoyaltyScreen())),
      GoRoute(path: '/edit-profile', pageBuilder: (_, __) => appPage(child: const EditProfileScreen())),
      GoRoute(path: '/change-password', pageBuilder: (_, __) => appPage(child: const ChangePasswordScreen())),
      GoRoute(path: '/wishlist', pageBuilder: (_, __) => appPage(child: const WishlistScreen())),
      GoRoute(
        path: '/language-settings',
        pageBuilder: (_, __) =>
            appPage(child: const LanguagePickerScreen(fromSettings: true)),
      ),
      GoRoute(
        path: '/privacy',
        pageBuilder: (_, __) =>
            appPage(child: const LegalDocumentScreen(type: LegalDocumentType.privacy)),
      ),
      GoRoute(
        path: '/terms',
        pageBuilder: (_, __) =>
            appPage(child: const LegalDocumentScreen(type: LegalDocumentType.terms)),
      ),
      GoRoute(path: '/about', pageBuilder: (_, __) => appPage(child: const AboutAppScreen())),
      GoRoute(path: '/licenses', pageBuilder: (_, __) => appPage(child: const OpenSourceLicensesScreen())),
    ],
    errorBuilder: (context, state) => Consumer(
      builder: (context, ref, _) {
        final s = ref.watch(stringsProvider);
        return Scaffold(
          backgroundColor: AppColors.scaffold,
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.explore_off_rounded, size: 38, color: AppColors.primary),
                  ),
                  const SizedBox(height: 18),
                  Text(s.pageNotFound, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: () => context.go('/'),
                    icon: const Icon(Icons.home_outlined, size: 18),
                    label: Text(s.goHome),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    ),
  );
});
