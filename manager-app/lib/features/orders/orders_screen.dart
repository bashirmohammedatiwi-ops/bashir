import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../pick/pick_scan_screen.dart';
import '../pick/pick_screen.dart';
import 'order_screen.dart';
import 'order_widgets.dart';

/// أعداد طلبات التطبيق لكل مرحلة (للوحة الرئيسية) — صفحة بطلب واحد، تتحدّث مع أي تغيير في الطلبات.
final orderCountsProvider = FutureProvider.autoDispose<Map<String, int>>((ref) async {
  ref.watch(ordersVersionProvider);
  final r = await ref.watch(repoProvider).orders(status: 'open', limit: 1);
  return r.counts;
});

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

/// تبويبات المدير: مراحل التجهيز نفسها في تطبيق التجهيز + الملغاة.
const managerOrderTabs = [...orderTabs, tabCancelled];

/// الطلبات: تبويبات حسب مرحلة التجهيز مع العدد، بحث برقم الطلب أو اسم/هاتف الزبونة.
class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key, this.embedded = false, this.initialStatus});
  final bool embedded;

  /// يفتح على تبويب معيّن: مفتاح تبويب («stage:PICKING») أو حالة قديمة («PENDING» من صحة المتجر).
  final String? initialStatus;
  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  late String _status = orderTabKey(widget.initialStatus, _tabs);
  final _q = TextEditingController();
  Timer? _debounce;
  final _scroll = ScrollController();
  final _items = <OrderSummary>[];
  Map<String, int> _counts = {};
  int _page = 1;
  bool _hasNext = false;
  bool _loading = false;
  Object? _error;
  int _seq = 0;
  int _seenVersion = 0;

  static const _tabs = managerOrderTabs;

  OrderTab get _filter => _tabs.firstWhere((t) => t.key == _status, orElse: () => tabOpen);

  @override
  void initState() {
    super.initState();
    ScannerBus.instance.push(_onHardware);
    _seenVersion = ref.read(ordersVersionProvider);
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 500) _more();
    });
    _load();
  }

  @override
  void dispose() {
    ScannerBus.instance.pop(_onHardware);
    _debounce?.cancel();
    _scroll.dispose();
    super.dispose();
  }

  /// قارئ خارجي: مسح QR قائمة التجهيز يفتح تجهيز الطلب مباشرة.
  bool _onHardware(ScanEvent e) {
    if (ModalRoute.of(context)?.isCurrent != true || !isOrderCode(e.code)) return false;
    _openByCode(e.code);
    return true;
  }

  Future<void> _scanOrder() async {
    String? code;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (c) => PickScanScreen(
          hint: 'امسح QR قائمة التجهيز',
          onCode: (v) async {
            code = v;
            Navigator.of(c).pop();
            return null;
          },
        ),
      ),
    );
    if (code != null && mounted) await _openByCode(code!);
  }

  Future<void> _openByCode(String code) async {
    if (!isOrderCode(code)) {
      toast(context, 'هذا ليس رمز طلب — امسح QR قائمة التجهيز', error: true);
      return;
    }
    try {
      final id = await ref.read(repoProvider).orderIdByCode(code);
      if (!mounted) return;
      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => PickScreen(orderId: id)));
      if (mounted) _load();
    } catch (e) {
      if (mounted) toastError(context, e);
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
        title: const Text('الطلبات'),
        actions: [
          IconButton(tooltip: 'مسح QR طلب', onPressed: _scanOrder, icon: const Icon(Icons.qr_code_scanner_rounded)),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded)),
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
                children: const [EmptyState(icon: Icons.receipt_long_outlined, title: 'لا توجد طلبات هنا')],
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
