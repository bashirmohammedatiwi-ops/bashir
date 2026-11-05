import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../data/session.dart';
import '../orders/orders_screen.dart';
import '../stats/stats_screen.dart';

/// واجهة بسيطة بتبويبتين: الطلبات (الطابور) و أدائي.
class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});
  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _tab = 0;
  final _loaded = <int>{0};

  void _go(int i) => setState(() {
    _tab = i;
    _loaded.add(i);
  });

  @override
  Widget build(BuildContext context) {
    final pending = ref.watch(pendingOrdersProvider);
    const pages = [OrdersScreen(embedded: true), StatsScreen()];
    return Scaffold(
      body: IndexedStack(
        index: _tab,
        children: [for (var i = 0; i < pages.length; i++) _loaded.contains(i) ? pages[i] : const SizedBox()],
      ),
      bottomNavigationBar: BottomAppBar(
        height: 64,
        padding: EdgeInsets.zero,
        color: Colors.white,
        child: Row(
          children: [
            _NavItem(icon: Icons.receipt_long_rounded, label: 'الطلبات', selected: _tab == 0, badge: pending, onTap: () => _go(0)),
            _NavItem(icon: Icons.insights_rounded, label: 'أدائي', selected: _tab == 1, onTap: () => _go(1)),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({required this.icon, required this.label, required this.selected, required this.onTap, this.badge = 0});
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final int badge;

  @override
  Widget build(BuildContext context) {
    final color = selected ? AppColors.primary : AppColors.muted;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Badge(
              isLabelVisible: badge > 0,
              label: Text('$badge'),
              backgroundColor: AppColors.rose,
              child: Icon(icon, color: color, size: 25),
            ),
            const SizedBox(height: 3),
            Text(label, style: TextStyle(color: color, fontSize: 11.5, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
