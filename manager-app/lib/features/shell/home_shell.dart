import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../drafts/groups_screen.dart';
import '../home/home_screen.dart';
import '../scan/lookup_flow.dart';
import '../scan/scan_screen.dart';
import '../search/search_screen.dart';
import '../settings/settings_screen.dart';

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});
  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _tab = 0;
  final _loaded = <int>{0};
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    ScannerBus.instance.push(_onScan);
  }

  @override
  void dispose() {
    ScannerBus.instance.pop(_onScan);
    super.dispose();
  }

  /// قراءة من قارئ خارجي في أي مكان من التطبيق (ما لم تطلبها شاشة أعلى) → افتح النتيجة.
  bool _onScan(ScanEvent e) {
    if (_busy) return true;
    _busy = true;
    openCode(context, ref, e.code, source: e.source).whenComplete(() => _busy = false);
    return true;
  }

  void _go(int i) => setState(() {
    _tab = i;
    _loaded.add(i);
  });

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(onOpenDrafts: () => _go(2)),
      const SearchScreen(embedded: true),
      const GroupsScreen(),
      const SettingsScreen(),
    ];
    return Scaffold(
      body: IndexedStack(index: _tab, children: [for (var i = 0; i < pages.length; i++) _loaded.contains(i) ? pages[i] : const SizedBox()]),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: SizedBox(
        width: 66,
        height: 66,
        child: FloatingActionButton(
          heroTag: 'scan',
          elevation: 4,
          shape: const CircleBorder(),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ScanScreen())),
          child: const Icon(Icons.qr_code_scanner_rounded, size: 32),
        ),
      ),
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        color: Colors.white,
        elevation: 8,
        padding: EdgeInsets.zero,
        height: 66,
        child: Row(
          children: [
            _NavItem(icon: Icons.space_dashboard_rounded, label: 'الرئيسية', selected: _tab == 0, onTap: () => _go(0)),
            _NavItem(icon: Icons.inventory_2_rounded, label: 'المنتجات', selected: _tab == 1, onTap: () => _go(1)),
            const SizedBox(width: 72),
            _NavItem(icon: Icons.bookmarks_rounded, label: 'المحفوظات', selected: _tab == 2, onTap: () => _go(2)),
            _NavItem(icon: Icons.settings_rounded, label: 'الإعدادات', selected: _tab == 3, onTap: () => _go(3)),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({required this.icon, required this.label, required this.selected, required this.onTap});
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Expanded(
    child: InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: selected ? AppColors.primary : AppColors.muted),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              color: selected ? AppColors.primary : AppColors.muted,
            ),
          ),
        ],
      ),
    ),
  );
}
