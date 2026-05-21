import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/onboarding_screen.dart';
import '../../features/auth/screens/otp_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/brands/screens/brands_screen.dart';
import '../../features/cart/screens/cart_screen.dart';
import '../../features/categories/screens/categories_screen.dart';
import '../../features/chat/screens/chat_screen.dart';
import '../../features/checkout/screens/checkout_screen.dart';
import '../../features/checkout/screens/order_confirmation_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/packages/screens/package_detail_screen.dart';
import '../../features/loyalty/screens/loyalty_screen.dart';
import '../../features/orders/screens/order_detail_screen.dart';
import '../../features/orders/screens/orders_screen.dart';
import '../../features/products/screens/product_comparison_screen.dart';
import '../../features/products/screens/product_detail_screen.dart';
import '../../features/products/screens/product_listing_screen.dart';
import '../../features/profile/screens/addresses_screen.dart';
import '../../features/profile/screens/edit_profile_screen.dart';
import '../../features/profile/screens/notifications_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/search/screens/search_screen.dart';
import '../../features/wishlist/screens/wishlist_screen.dart';
import '../constants/app_routes.dart';
import '../providers/prefs_provider.dart';
import '../widgets/main_shell.dart';
import 'router_refresh.dart';

CustomTransitionPage<T> _fadeScalePage<T>({
  required Widget child,
  required GoRouterState state,
}) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(opacity: animation, child: child);
    },
    transitionDuration: const Duration(milliseconds: 150),
  );
}

CustomTransitionPage<T> _slideUpPage<T>({
  required Widget child,
  required GoRouterState state,
}) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 1),
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
        child: FadeTransition(opacity: animation, child: child),
      );
    },
  );
}

CustomTransitionPage<T> _slideHorizontalPage<T>({
  required Widget child,
  required GoRouterState state,
}) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(-1, 0),
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
        child: FadeTransition(opacity: animation, child: child),
      );
    },
  );
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = RouterRefresh();
  ref.listen(authProvider, (_, __) => refresh.refresh());
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    refreshListenable: refresh,
    redirect: (context, state) {
      final loc = state.matchedLocation;
      if (loc == AppRoutes.splash) return null;

      final prefs = ref.read(prefsProvider);
      final isAuth = ref.read(authProvider).valueOrNull != null;

      const authRoutes = {
        AppRoutes.onboarding,
        AppRoutes.login,
        AppRoutes.register,
        AppRoutes.forgotPassword,
        AppRoutes.otp,
      };

      if (!isAuth && !authRoutes.contains(loc)) {
        if (!prefs.onboardingDone) return AppRoutes.onboarding;
        return AppRoutes.login;
      }
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboarding,
        pageBuilder: (_, state) =>
            _fadeScalePage(child: const OnboardingScreen(), state: state),
      ),
      GoRoute(
        path: AppRoutes.login,
        pageBuilder: (_, state) =>
            _fadeScalePage(child: const LoginScreen(), state: state),
      ),
      GoRoute(
        path: AppRoutes.register,
        pageBuilder: (_, state) =>
            _slideHorizontalPage(child: const RegisterScreen(), state: state),
      ),
      GoRoute(
        path: AppRoutes.forgotPassword,
        builder: (_, __) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: AppRoutes.otp,
        builder: (_, __) => const OtpScreen(),
      ),
      ShellRoute(
        builder: (_, __, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.home,
            pageBuilder: (_, state) =>
                _fadeScalePage(child: const HomeScreen(), state: state),
          ),
          GoRoute(
            path: AppRoutes.categories,
            pageBuilder: (_, state) => _fadeScalePage(
              child: const CategoriesScreen(),
              state: state,
            ),
          ),
          GoRoute(
            path: AppRoutes.brands,
            pageBuilder: (_, state) =>
                _fadeScalePage(child: const BrandsScreen(), state: state),
          ),
          GoRoute(
            path: AppRoutes.cart,
            pageBuilder: (_, state) =>
                _fadeScalePage(child: const CartScreen(), state: state),
          ),
          GoRoute(
            path: AppRoutes.profile,
            pageBuilder: (_, state) =>
                _fadeScalePage(child: const ProfileScreen(), state: state),
          ),
        ],
      ),
      GoRoute(
        path: AppRoutes.products,
        pageBuilder: (_, state) {
          final categoryId = state.uri.queryParameters['categoryId'];
          final subcategoryId = state.uri.queryParameters['subcategoryId'];
          final brandId = state.uri.queryParameters['brandId'];
          final title = state.uri.queryParameters['title'];
          return _slideHorizontalPage(
            child: ProductListingScreen(
              categoryId: categoryId,
              subcategoryId: subcategoryId,
              brandId: brandId,
              title: title,
            ),
            state: state,
          );
        },
      ),
      GoRoute(
        path: '/product/:id',
        pageBuilder: (_, state) => _slideUpPage(
          child: ProductDetailScreen(
            productId: state.pathParameters['id']!,
          ),
          state: state,
        ),
      ),
      GoRoute(
        path: '/package/:id',
        pageBuilder: (_, state) => _slideUpPage(
          child: PackageDetailScreen(
            packageId: state.pathParameters['id']!,
          ),
          state: state,
        ),
      ),
      GoRoute(
        path: AppRoutes.search,
        pageBuilder: (_, state) =>
            _slideHorizontalPage(child: const SearchScreen(), state: state),
      ),
      GoRoute(
        path: AppRoutes.checkout,
        pageBuilder: (_, state) =>
            _slideUpPage(child: const CheckoutScreen(), state: state),
      ),
      GoRoute(
        path: AppRoutes.orderConfirmation,
        pageBuilder: (_, state) => _fadeScalePage(
          child: OrderConfirmationScreen(
            orderNumber: state.uri.queryParameters['order'] ?? '',
          ),
          state: state,
        ),
      ),
      GoRoute(
        path: AppRoutes.orders,
        pageBuilder: (_, state) =>
            _slideHorizontalPage(child: const OrdersScreen(), state: state),
      ),
      GoRoute(
        path: '/orders/:id',
        pageBuilder: (_, state) => _slideHorizontalPage(
          child: OrderDetailScreen(orderId: state.pathParameters['id']!),
          state: state,
        ),
      ),
      GoRoute(
        path: AppRoutes.wishlist,
        pageBuilder: (_, state) =>
            _slideHorizontalPage(child: const WishlistScreen(), state: state),
      ),
      GoRoute(
        path: AppRoutes.loyalty,
        pageBuilder: (_, state) =>
            _slideHorizontalPage(child: const LoyaltyScreen(), state: state),
      ),
      GoRoute(
        path: AppRoutes.chat,
        pageBuilder: (_, state) =>
            _slideUpPage(child: const ChatScreen(), state: state),
      ),
      GoRoute(
        path: AppRoutes.compare,
        pageBuilder: (_, state) {
          final id1 = state.uri.queryParameters['id1'] ?? '';
          final id2 = state.uri.queryParameters['id2'] ?? '';
          return _slideUpPage(
            child: ProductComparisonScreen(id1: id1, id2: id2),
            state: state,
          );
        },
      ),
      GoRoute(
        path: AppRoutes.notifications,
        pageBuilder: (_, state) => _slideHorizontalPage(
          child: const NotificationsScreen(),
          state: state,
        ),
      ),
      GoRoute(
        path: AppRoutes.editProfile,
        pageBuilder: (_, state) => _slideHorizontalPage(
          child: const EditProfileScreen(),
          state: state,
        ),
      ),
      GoRoute(
        path: AppRoutes.addresses,
        pageBuilder: (_, state) => _slideHorizontalPage(
          child: const AddressesScreen(),
          state: state,
        ),
      ),
    ],
  );
});
