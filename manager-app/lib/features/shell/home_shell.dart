import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/background.dart';
import '../../core/prefs.dart';
import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../home/home_screen.dart';
import '../more/more_screen.dart';
import '../orders/order_screen.dart';
import '../orders/orders_screen.dart';
import '../scan/lookup_flow.dart';
import '../scan/scan_screen.dart';
import '../search/search_screen.dart';

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});
  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> with WidgetsBindingObserver {
  int _tab = 0;
  final _loaded = <int>{0};
  bool _busy = false;
  Timer? _pulseTimer;
  String? _lastOrderId;

  @override
  void initState() {
    super.initState();
    ScannerBus.instance.push(_onScan);
    WidgetsBinding.instance.addObserver(this);
    _pulse(first: true);
    _pulseTimer = Timer.periodic(const Duration(seconds: 45), (_) => _pulse());
  }

  @override
  void dispose() {
    ScannerBus.instance.pop(_onScan);
    WidgetsBinding.instance.removeObserver(this);
    _pulseTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _pulse();
  }

  /// طلب جديد وصل؟ شارة على تبويب الطلبات + تنبيه داخل التطبيق.
  Future<void> _pulse({bool first = false}) async {
    ref.read(sessionProvider.notifier).refreshMe();
    try {
      final p = await ref.read(repoProvider).pulse();
      if (!mounted) return;
      ref.read(pendingOrdersProvider.notifier).state = p.pending;
      BackgroundOrders.markSeen(p.latestId);
      final isNew = !first && p.latestId != null && _lastOrderId != null && p.latestId != _lastOrderId;
      _lastOrderId = p.latestId ?? _lastOrderId;
      if (isNew) {
        ref.read(ordersVersionProvider.notifier).state++;
        Prefs.instance.feedback();
        final id = p.latestId!;
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              duration: const Duration(seconds: 8),
              backgroundColor: AppColors.success,
              content: Row(
                children: [
                  const Icon(Icons.notifications_active_rounded, color: Colors.white),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text('طلب جديد ${p.latestNumber ?? ''}', style: const TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ],
              ),
              action: SnackBarAction(
                label: 'عرض',
                textColor: Colors.white,
                onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => OrderScreen(orderId: id))),
              ),
            ),
          );
      }
    } catch (_) {
      // بلا صلاحية أو بلا إنترنت — لا شيء
    }
  }

  /// قراءة من قارئ خارجي في أي مكان من التطبيق (ما لم تطلبها شاشة أعلى) → افتح النتيجة.
  bool _onScan(ScanEvent e) {
    if (_busy) return true;
    _busy = true;
    // openCode يعود فور فتح النتيجة، فالمسح التالي يفتح منتجه مكان السابق.
    openCode(context, ref, e.code, source: e.source).whenComplete(() => _busy = false);
    return true;
  }

  void _go(int i) => setState(() {
    _tab = i;
    _loaded.add(i);
  });

  @override
  Widget build(BuildContext context) {
    final pending = ref.watch(pendingOrdersProvider);
    final pages = [
      HomeScreen(onOpenOrders: () => _go(2)),
      const SearchScreen(embedded: true),
      const OrdersScreen(embedded: true),
      const MoreScreen(),
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
            _NavItem(icon: Icons.receipt_long_rounded, label: 'الطلبات', selected: _tab == 2, badge: pending, onTap: () => _go(2)),
            _NavItem(icon: Icons.grid_view_rounded, label: 'المزيد', selected: _tab == 3, onTap: () => _go(3)),
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
  Widget build(BuildContext context) => Expanded(
    child: InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Badge(
            isLabelVisible: badge > 0,
            label: Text('$badge'),
            backgroundColor: AppColors.danger,
            child: Icon(icon, color: selected ? AppColors.primary : AppColors.muted),
          ),
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
