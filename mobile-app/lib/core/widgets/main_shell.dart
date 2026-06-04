import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/cart/providers/cart_provider.dart';
import '../constants/app_routes.dart';
import 'animated_bottom_nav.dart';

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  static const _paths = [
    AppRoutes.home,
    AppRoutes.categories,
    AppRoutes.brands,
    AppRoutes.cart,
    AppRoutes.profile,
  ];

  int _indexFromLocation(String location) {
    for (var i = 0; i < _paths.length; i++) {
      if (location.startsWith(_paths[i])) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final index = _indexFromLocation(location);
    final cartCount = ref.watch(cartCountProvider);

    return Scaffold(
      body: widget.child,
      extendBody: true,
      bottomNavigationBar: AnimatedBottomNav(
        currentIndex: index,
        cartCount: cartCount,
        onTap: (i) => context.go(_paths[i]),
      ),
    );
  }
}
