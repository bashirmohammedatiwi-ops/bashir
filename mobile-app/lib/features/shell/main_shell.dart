import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/utils/responsive.dart';
import '../cart/cart_provider.dart';
import '../cart/cart_screen.dart';
import '../categories/categories_screen.dart';
import '../home/home_screen.dart';
import '../offers/offers_screen.dart';
import '../profile/account_screen.dart';
import '../worlds/world_theme.dart';
import 'nav_tabs.dart';
import 'shell_nav_bar.dart';

export 'shell_nav_bar.dart' show ShellNavBar;

final navIndexProvider = StateProvider<int>((ref) => 0);

class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  final _visited = <int>{0};

  @override
  Widget build(BuildContext context) {
    final index = ref.watch(navIndexProvider);
    final cartCount = ref.watch(cartProvider.select((c) => c.count));
    final theme = ref.watch(activeWorldThemeProvider);
    final navHeight = Responsive.shellNavDockHeight(context);
    _visited.add(index);
    final baseTheme = Theme.of(context);

    return AnimatedTheme(
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
      data: theme.applyTo(baseTheme),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
        color: theme.canvas,
        child: Scaffold(
          backgroundColor: theme.canvas,
          body: Stack(
            fit: StackFit.expand,
            children: [
              Padding(
                padding: EdgeInsets.only(bottom: navHeight),
                child: IndexedStack(
                  index: index,
                  sizing: StackFit.expand,
                  children: [
                    TickerMode(enabled: index == 0, child: const HomeScreen()),
                    TickerMode(
                      enabled: index == NavTabs.categories,
                      child: _visited.contains(NavTabs.categories) ? const CategoriesScreen() : const SizedBox.shrink(),
                    ),
                    TickerMode(
                      enabled: index == NavTabs.offers,
                      child: _visited.contains(NavTabs.offers) ? const OffersScreen() : const SizedBox.shrink(),
                    ),
                    TickerMode(
                      enabled: index == NavTabs.cart,
                      child: _visited.contains(NavTabs.cart) ? const CartScreen() : const SizedBox.shrink(),
                    ),
                    TickerMode(
                      enabled: index == NavTabs.account,
                      child: _visited.contains(NavTabs.account) ? const AccountScreen() : const SizedBox.shrink(),
                    ),
                  ],
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: ShellNavBar(
                  currentIndex: index,
                  cartCount: cartCount,
                  onSelect: _selectTab,
                  strings: ref.watch(stringsProvider),
                  theme: theme,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _selectTab(int i) {
    if (ref.read(navIndexProvider) != i) {
      HapticFeedback.selectionClick();
    }
    ref.read(navIndexProvider.notifier).state = i;
  }
}
