import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/brands/brands_screen.dart';
import '../../features/checkout/checkout_screen.dart';
import '../../features/checkout/order_success_screen.dart';
import '../../features/orders/order_detail_screen.dart';
import '../../features/orders/orders_screen.dart';
import '../../features/products/product_detail_screen.dart';
import '../../features/products/product_listing_screen.dart';
import '../../features/profile/addresses_screen.dart';
import '../../features/profile/edit_profile_screen.dart';
import '../../features/profile/loyalty_screen.dart';
import '../../features/profile/notifications_screen.dart';
import '../../features/search/search_screen.dart';
import '../../features/shell/main_shell.dart';
import '../../features/wishlist/wishlist_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, __) => const MainShell()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
      GoRoute(path: '/brands', builder: (_, __) => const BrandsScreen()),
      GoRoute(
        path: '/product/:id',
        builder: (_, s) => ProductDetailScreen(idOrSlug: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/products',
        builder: (_, s) => ProductListingScreen(
          title: s.uri.queryParameters['title'] ?? 'المنتجات',
          categoryId: s.uri.queryParameters['categoryId'],
          brandId: s.uri.queryParameters['brandId'],
          search: s.uri.queryParameters['search'],
          isNew: s.uri.queryParameters['isNew'] == '1',
          isBestSeller: s.uri.queryParameters['isBestSeller'] == '1',
          isPromo: s.uri.queryParameters['isPromo'] == '1',
        ),
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
      GoRoute(path: '/wishlist', builder: (_, __) => const WishlistScreen()),
    ],
    errorBuilder: (_, __) => const Scaffold(
      body: Center(child: Text('الصفحة غير موجودة')),
    ),
  );
});
