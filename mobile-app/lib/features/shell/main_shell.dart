import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/app_strings.dart';
import '../home/widgets/home_theme.dart';
import '../cart/cart_provider.dart';
import '../cart/cart_screen.dart';
import '../categories/categories_screen.dart';
import '../home/home_screen.dart';
import '../offers/offers_screen.dart';
import '../profile/account_screen.dart';
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
    _visited.add(index);

    return Scaffold(
      backgroundColor: HomeTheme.canvas,
      extendBody: true,
      body: IndexedStack(
        index: index,
        sizing: StackFit.expand,
        children: [
          TickerMode(enabled: index == 0, child: const HomeScreen()),
          TickerMode(
            enabled: index == 1,
            child: _visited.contains(1) ? const CategoriesScreen() : const SizedBox.shrink(),
          ),
          TickerMode(
            enabled: index == 2,
            child: _visited.contains(2) ? const OffersScreen() : const SizedBox.shrink(),
          ),
          TickerMode(
            enabled: index == 3,
            child: _visited.contains(3) ? const CartScreen() : const SizedBox.shrink(),
          ),
          TickerMode(
            enabled: index == 4,
            child: _visited.contains(4) ? const AccountScreen() : const SizedBox.shrink(),
          ),
        ],
      ),
      bottomNavigationBar: ShellNavBar(
        currentIndex: index,
        cartCount: cartCount,
        onSelect: _selectTab,
        strings: ref.watch(stringsProvider),
      ),
    );
  }

  void _selectTab(int i) {
    if (ref.read(navIndexProvider) != i) {
      if (i == 2) {
        HapticFeedback.mediumImpact();
      } else {
        HapticFeedback.selectionClick();
      }
    }
    ref.read(navIndexProvider.notifier).state = i;
  }
}
