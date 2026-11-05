import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/background.dart';
import '../../core/format.dart';
import '../../core/prefs.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../settings/settings_screen.dart';
import 'order_screen.dart';

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

  // تبويبات التجهيز: المفتوحة أولاً، ثم حسب المرحلة.
  static const _tabs = [
    ('open', 'المفتوحة'),
    ('PENDING', 'جديدة'),
    ('CONFIRMED', 'مؤكدة'),
    ('PROCESSING', 'قيد التحضير'),
    ('SHIPPED', 'جاهزة'),
    ('DELIVERED', 'مكتملة'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
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
      final r = await ref.read(repoProvider).orders(status: _status, q: _q.text, page: 1);
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
      final r = await ref.read(repoProvider).orders(status: _status, q: _q.text, page: _page + 1);
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
                SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      for (final t in _tabs)
                        Padding(
                          padding: const EdgeInsetsDirectional.only(end: 8),
                          child: ChoiceChip(
                            showCheckmark: false,
                            selectedColor: AppColors.primarySoft,
                            selected: _status == t.$1,
                            label: Text('${t.$2}${_counts[t.$1] != null ? '  ${_counts[t.$1]}' : ''}'),
                            onSelected: (_) {
                              setState(() => _status = t.$1);
                              _load();
                            },
                          ),
                        ),
                    ],
                  ),
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

class OrderTile extends StatelessWidget {
  const OrderTile({super.key, required this.order, required this.onTap});
  final OrderSummary order;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final o = order;
    final isNew = o.status == 'PENDING';
    return Panel(
      onTap: onTap,
      padding: const EdgeInsets.all(12),
      color: isNew ? const Color(0xFFFFFBF2) : Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                o.orderNumber,
                textDirection: TextDirection.ltr,
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15.5),
              ),
              const SizedBox(width: 8),
              OrderStatusPill(o.status, small: true),
              const Spacer(),
              Text(timeAgo(o.createdAt), style: const TextStyle(color: AppColors.muted, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(o.customer, style: const TextStyle(fontWeight: FontWeight.w700)),
                    if (o.place != null)
                      Text(
                        o.place!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                      ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text('${o.quantity} قطعة', style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary)),
                        Text(money(o.total), style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
                        if (o.paymentMethod == 'CARD')
                          Pill(
                            o.paymentStatus == 'PAID' ? 'مدفوع بالبطاقة' : 'بطاقة',
                            color: AppColors.info,
                            bg: AppColors.infoSoft,
                            small: true,
                            icon: Icons.credit_card_rounded,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(
                width: 92,
                height: 44,
                child: Stack(
                  children: [
                    for (var k = o.thumbs.length.clamp(0, 3) - 1; k >= 0; k--)
                      PositionedDirectional(
                        start: k * 24.0,
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: NetImg(o.thumbs[k], size: 40, radius: 9, fit: BoxFit.contain),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
