import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/utils/daily_progress_store.dart';

/// Shell with bottom navigation: catalog vs AI single-product add.
class HomeShell extends ConsumerWidget {
  const HomeShell({super.key, required this.child});

  final Widget child;

  int _indexForLocation(String location) {
    if (location.startsWith('/ai-add')) return 1;
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).uri.path;
    final selected = _indexForLocation(location);
    final todayCount = ref.watch(dailyProgressProvider).todayCount;

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selected,
        onDestinationSelected: (index) {
          if (index == selected) return;
          if (index == 0) context.go('/scan');
          if (index == 1) context.go('/ai-add');
        },
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.storefront_outlined),
            selectedIcon: Icon(Icons.storefront),
            label: 'الكتالوج',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: todayCount > 0,
              label: Text('$todayCount', style: const TextStyle(fontSize: 10)),
              child: const Icon(Icons.auto_awesome_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: todayCount > 0,
              label: Text('$todayCount', style: const TextStyle(fontSize: 10)),
              child: const Icon(Icons.auto_awesome),
            ),
            label: 'إضافة ذكية',
          ),
        ],
      ),
    );
  }
}
