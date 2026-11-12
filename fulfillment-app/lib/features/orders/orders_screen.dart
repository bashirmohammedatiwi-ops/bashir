import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/background.dart';
import '../../core/prefs.dart';
import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../settings/settings_screen.dart';
import '../pick/pick_screen.dart';
import '../scan/scan_screen.dart';
import 'order_screen.dart';
import 'order_widgets.dart';

Color orderStatusColor(String s) => switch (s) {
  'PENDING' => AppColors.warning,
  'CONFIRMED' => AppColors.info,
  'PROCESSING' => AppColors.primary,
  'SHIPPED' => const Color(0xFF0E9AA7),
  'DELIVERED' => AppColors.success,
  'CANCELLED' => AppColors.danger,
  _ => AppColors.muted,
};

class OrderStatusPill extends StatelessWidget {
  const OrderStatusPill(this.status, {super.key, this.small = false});
  final String status;
  final bool small;
  @override
  Widget build(BuildContext context) {
    final c = orderStatusColor(status);
    return Pill(orderStatusLabels[status] ?? status, color: c, bg: c.withValues(alpha: .12), small: small);
  }
}

/// طابور الطلبات: تبويبات حسب الحالة مع العدد، بحث، وتنبيه حيّ (صوت/اهتزاز) عند طلب جديد.
class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key, this.embedded = false});
  final bool embedded;
  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> with WidgetsBindingObserver {
  String _status = 'open';
  final _q = TextEditingController();
  Timer? _debounce;
  Timer? _pulse;
  final _scroll = ScrollController();
  final _items = <OrderSummary>[];
  Map<String, int> _counts = {};
  int _page = 1;
  bool _hasNext = false;
  bool _loading = false;
  Object? _error;
  int _seq = 0;
  int _seenVersion = 0;
  String? _lastSeenOrderId;
  bool _firstPulse = true;

  // تبويبات حسب مرحلة التجهيز: المفتوحة أولاً ثم بترتيب مسار الطلب.
  static const _tabs = orderTabs;

  OrderTab get _filter => _tabs.firstWhere((t) => t.key == _status, orElse: () => tabOpen);

  /// قارئ خارجي على الطابور: مسح QR قائمة التجهيز يفتح الطلب مباشرة.
  bool _onHardware(ScanEvent e) {
    if (ModalRoute.of(context)?.isCurrent != true || !isOrderCode(e.code)) return false;
    _openByCode(e.code);
    return true;
  }

  Future<void> _scanOrder() async {
    final code = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const ScanScreen(hint: 'امسح QR الطلب')),
    );
    if (code != null && mounted) await _openByCode(code);
  }

  Future<void> _openByCode(String code) async {
    if (!isOrderCode(code)) {
      Prefs.instance.feedback(error: true);
      toast(context, 'هذا ليس رمز طلب — امسح QR قائمة التجهيز', error: true);
      return;
    }
    try {
      final id = await ref.read(repoProvider).orderIdByCode(code);
      if (!mounted) return;
      Prefs.instance.feedback();
      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => PickScreen(orderId: id)));
      if (mounted) _load();
    } catch (e) {
      if (mounted) toastError(context, e);
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    ScannerBus.instance.push(_onHardware);
    _seenVersion = ref.read(ordersVersionProvider);
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 500) _more();
    });
    _load();
    _startPulse();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    ScannerBus.instance.pop(_onHardware);
    _debounce?.cancel();
    _pulse?.cancel();
    _scroll.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startPulse();
      _load();
    } else if (state == AppLifecycleState.paused) {
      _pulse?.cancel();
    }
  }

  /// فحص حيّ كل 45 ثانية: طلب جديد يصدر صوتاً/اهتزازاً ويحدّث الطابور.
  void _startPulse() {
    _pulse?.cancel();
    _pulse = Timer.periodic(const Duration(seconds: 45), (_) => _checkPulse());
    _checkPulse();
  }

  Future<void> _checkPulse() async {
    try {
      final p = await ref.read(repoProvider).pulse();
      if (!mounted) return;
      ref.read(pendingOrdersProvider.notifier).state = p.pending;
      BackgroundOrders.markSeen(p.latestId);
      final newest = p.latestId;
      if (newest != null && newest != _lastSeenOrderId) {
        final hadPrevious = _lastSeenOrderId != null;
        _lastSeenOrderId = newest;
        // لا ننبّه عند أول فحص بعد الفتح — فقط عند وصول طلب جديد فعلاً.
        if (!_firstPulse && hadPrevious) {
          Prefs.instance.feedback();
          if (mounted) {
            toast(context, 'وصل طلب جديد ${p.latestNumber ?? ''} 🛎️');
          }
          _load();
        }
      }
      _firstPulse = false;
    } catch (_) {
      // تجاهل أخطاء الفحص الدوري
    }
  }

  Future<void> _load() async {
    final seq = ++_seq;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final r = await ref.read(repoProvider).orders(status: _filter.status, stage: _filter.stage, q: _q.text, page: 1);
      if (seq != _seq || !mounted) return;
      setState(() {
        _items
          ..clear()
          ..addAll(r.items);
        _counts = r.counts;
        ref.read(pendingOrdersProvider.notifier).state = r.counts['PENDING'] ?? 0;
        _page = 1;
        _hasNext = r.hasNext;
      });
    } catch (e) {
      if (seq == _seq && mounted) setState(() => _error = e);
    } finally {
      if (seq == _seq && mounted) setState(() => _loading = false);
    }
  }

  Future<void> _more() async {
    if (_loading || !_hasNext) return;
    final seq = _seq;
    setState(() => _loading = true);
    try {
      final r = await ref.read(repoProvider).orders(status: _filter.status, stage: _filter.stage, q: _q.text, page: _page + 1);
      if (seq != _seq || !mounted) return;
      setState(() {
        _page += 1;
        _items.addAll(r.items);
        _hasNext = r.hasNext;
      });
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final v = ref.watch(ordersVersionProvider);
    if (v != _seenVersion) {
      _seenVersion = v;
      WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    }
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: !widget.embedded,
        title: const Text('طابور التجهيز'),
        actions: [
          IconButton(tooltip: 'مسح QR طلب', onPressed: _scanOrder, icon: const Icon(Icons.qr_code_scanner_rounded)),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded)),
          IconButton(
            tooltip: 'الإعدادات',
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen())),
            icon: const Icon(Icons.settings_outlined),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(112),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Column(
              children: [
                TextField(
                  controller: _q,
                  onChanged: (_) {
                    _debounce?.cancel();
                    _debounce = Timer(const Duration(milliseconds: 350), _load);
                  },
                  decoration: const InputDecoration(
                    hintText: 'رقم الطلب، اسم الزبونة أو هاتفها',
                    prefixIcon: Icon(Icons.search_rounded),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 8),
                OrderTabsBar(
                  tabs: _tabs,
                  selected: _status,
                  counts: _counts,
                  onSelect: (t) {
                    setState(() => _status = t.key);
                    _load();
                  },
                ),
              ],
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _error != null && _items.isEmpty
            ? ListView(children: [ErrorView(_error!, onRetry: _load)])
            : !_loading && _items.isEmpty
            ? ListView(
                children: const [EmptyState(icon: Icons.inventory_2_outlined, title: 'لا توجد طلبات هنا')],
              )
            : ListView.separated(
                controller: _scroll,
                padding: const EdgeInsets.fromLTRB(16, 6, 16, 100),
                itemCount: _items.length + (_loading ? 1 : 0),
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  if (i >= _items.length) {
                    return const Center(
                      child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator()),
                    );
                  }
                  final o = _items[i];
                  return OrderTile(
                    order: o,
                    onTap: () async {
                      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => OrderScreen(orderId: o.id)));
                    },
                  );
                },
              ),
      ),
    );
  }
}
