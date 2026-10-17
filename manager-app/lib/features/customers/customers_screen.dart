import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/admin_repo.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../orders/order_screen.dart';
import '../orders/orders_screen.dart';

String intlPhone(String raw) {
  var d = raw.replaceAll(RegExp(r'\D'), '');
  if (d.startsWith('00')) d = d.substring(2);
  if (d.startsWith('0')) d = '964${d.substring(1)}';
  if (!d.startsWith('964')) d = '964$d';
  return d;
}

/// الزبونات: بحث بالاسم أو الهاتف، وترتيب بالأحدث أو الأكثر شراءً.
class CustomersScreen extends ConsumerStatefulWidget {
  const CustomersScreen({super.key});
  @override
  ConsumerState<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends ConsumerState<CustomersScreen> {
  final _q = TextEditingController();
  Timer? _debounce;
  String _sort = 'recent';
  final _items = <Customer>[];
  int _total = 0, _page = 1;
  bool _hasNext = false, _loading = false;
  Object? _error;
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 400) _more();
    });
    _load();
  }

  Future<void> _load() async {
    setState(() => (_loading = true, _error = null));
    try {
      final r = await ref.read(repoProvider).customers(q: _q.text, sort: _sort);
      if (!mounted) return;
      setState(() {
        _items
          ..clear()
          ..addAll(r.items);
        _total = r.total;
        _page = 1;
        _hasNext = r.hasNext;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _more() async {
    if (_loading || !_hasNext) return;
    setState(() => _loading = true);
    try {
      final r = await ref.read(repoProvider).customers(q: _q.text, sort: _sort, page: _page + 1);
      if (!mounted) return;
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('الزبونات'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(108),
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
                  decoration: const InputDecoration(hintText: 'الاسم أو رقم الهاتف', prefixIcon: Icon(Icons.search_rounded), isDense: true),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      '$_total زبونة',
                      style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700),
                    ),
                    const Spacer(),
                    SegmentedButton<String>(
                      showSelectedIcon: false,
                      style: const ButtonStyle(visualDensity: VisualDensity.compact),
                      segments: const [
                        ButtonSegment(value: 'recent', label: Text('الأحدث')),
                        ButtonSegment(value: 'spent', label: Text('الأكثر شراءً')),
                        ButtonSegment(value: 'orders', label: Text('الطلبات')),
                      ],
                      selected: {_sort},
                      onSelectionChanged: (v) {
                        setState(() => _sort = v.first);
                        _load();
                      },
                    ),
                  ],
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
                children: const [EmptyState(icon: Icons.people_outline_rounded, title: 'لا نتائج')],
              )
            : ListView.separated(
                controller: _scroll,
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 60),
                itemCount: _items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final c = _items[i];
                  return Panel(
                    padding: const EdgeInsets.all(12),
                    onTap: () async {
                      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => CustomerScreen(id: c.id)));
                      _load();
                    },
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: c.isActive ? AppColors.roseSoft : AppColors.dangerSoft,
                          child: Text(
                            c.name.characters.first,
                            style: TextStyle(color: c.isActive ? AppColors.rose : AppColors.danger, fontWeight: FontWeight.w800),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      c.name,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontWeight: FontWeight.w800),
                                    ),
                                  ),
                                  if (!c.isActive) ...[
                                    const SizedBox(width: 6),
                                    const Pill('محظورة', color: AppColors.danger, bg: AppColors.dangerSoft, small: true),
                                  ],
                                ],
                              ),
                              Text(
                                [c.phone, 'منذ ${timeAgo(c.createdAt).replaceFirst('قبل ', '')}'].whereType<String>().join(' · '),
                                textDirection: TextDirection.rtl,
                                style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              money(c.spent),
                              style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary),
                            ),
                            Text('${c.orders} طلب', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}

class CustomerScreen extends ConsumerStatefulWidget {
  const CustomerScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<CustomerScreen> createState() => _CustomerScreenState();
}

class _CustomerScreenState extends ConsumerState<CustomerScreen> {
  CustomerDetail? _c;
  Object? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final c = await ref.read(repoProvider).customer(widget.id);
      if (mounted) setState(() => (_c = c, _error = null));
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _run(Future<CustomerDetail> Function() op, String ok) async {
    setState(() => _busy = true);
    try {
      final c = await op();
      if (!mounted) return;
      setState(() => _c = c);
      toast(context, ok);
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _points() async {
    final amount = TextEditingController();
    final reason = TextEditingController();
    var add = true;
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => StatefulBuilder(
        builder: (c, setS) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('نقاط الولاء', style: TextStyle(fontWeight: FontWeight.w800)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SegmentedButton<bool>(
                segments: const [
                  ButtonSegment(value: true, label: Text('إضافة'), icon: Icon(Icons.add_rounded)),
                  ButtonSegment(value: false, label: Text('خصم'), icon: Icon(Icons.remove_rounded)),
                ],
                selected: {add},
                onSelectionChanged: (v) => setS(() => add = v.first),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amount,
                autofocus: true,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(labelText: 'عدد النقاط'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: reason,
                decoration: const InputDecoration(labelText: 'السبب (يظهر لها)', hintText: 'هدية، تعويض، تصحيح...'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('إلغاء')),
            FilledButton(onPressed: () => Navigator.pop(c, true), child: const Text('حفظ')),
          ],
        ),
      ),
    );
    final n = int.tryParse(amount.text) ?? 0;
    if (ok != true || n <= 0) return;
    await _run(() => ref.read(repoProvider).adjustPoints(widget.id, add ? n : -n, reason.text), add ? 'أُضيفت $n نقطة' : 'خُصمت $n نقطة');
  }

  @override
  Widget build(BuildContext context) {
    final c = _c;
    final isAdmin = ref.watch(sessionProvider).me?.role != 'STAFF';
    if (c == null) {
      return Scaffold(
        appBar: AppBar(),
        body: _error != null ? ErrorView(_error!, onRetry: _load) : const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: Text(c.name),
        actions: [
          if (isAdmin)
            PopupMenuButton<String>(
              onSelected: (v) async {
                if (v == 'points') return _points();
                final block = v == 'block';
                if (block &&
                    !await confirm(
                      context,
                      title: 'حظر ${c.name}؟',
                      message: 'لن تستطيع الدخول أو الطلب، وتُسجَّل خارجاً من أجهزتها.',
                      ok: 'حظر',
                      danger: true,
                    )) {
                  return;
                }
                await _run(() => ref.read(repoProvider).setCustomerActive(widget.id, !block), block ? 'تم الحظر' : 'أُلغي الحظر');
              },
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'points', child: Text('إضافة/خصم نقاط')),
                c.isActive
                    ? const PopupMenuItem(
                        value: 'block',
                        child: Text('حظر الحساب', style: TextStyle(color: AppColors.danger)),
                      )
                    : const PopupMenuItem(value: 'unblock', child: Text('إلغاء الحظر')),
              ],
            ),
        ],
      ),
      body: BusyOverlay(
        busy: _busy,
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 40),
            children: [
              if (!c.isActive)
                const Padding(
                  padding: EdgeInsets.only(bottom: 10),
                  child: Panel(
                    color: AppColors.dangerSoft,
                    child: Text(
                      'هذا الحساب محظور',
                      style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
              Panel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (c.phone != null)
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => launchUrl(Uri.parse('tel:${c.phone}'), mode: LaunchMode.externalApplication),
                              icon: const Icon(Icons.call_rounded, color: AppColors.success),
                              label: Text(c.phone!, textDirection: TextDirection.ltr),
                            ),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton.icon(
                            onPressed: () =>
                                launchUrl(Uri.parse('https://wa.me/${intlPhone(c.phone!)}'), mode: LaunchMode.externalApplication),
                            icon: const Icon(Icons.chat_rounded, color: Color(0xFF25D366)),
                            label: const Text('واتساب'),
                          ),
                        ],
                      ),
                    if (c.email != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(c.email!, style: const TextStyle(color: AppColors.muted)),
                      ),
                    const SizedBox(height: 6),
                    Text(
                      'مسجّلة ${timeAgo(c.createdAt)}${c.lastLoginAt != null ? ' · آخر دخول ${timeAgo(c.lastLoginAt)}' : ''}',
                      style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              GridView.count(
                crossAxisCount: 3,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 1.25,
                children: [
                  _Kpi('مجموع الشراء', compactNum(c.spent)),
                  _Kpi('الطلبات', '${c.orders}'),
                  _Kpi('متوسط الطلب', compactNum(c.averageOrder)),
                  _Kpi('النقاط', '${c.points}', color: AppColors.warning),
                  _Kpi('ملغاة', '${c.cancelled}', color: c.cancelled > 0 ? AppColors.danger : null),
                  _Kpi('المفضلة', '${c.wishlistCount}'),
                ],
              ),
              if (c.addresses.isNotEmpty) ...[
                const SectionTitle('العناوين'),
                for (final a in c.addresses)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Panel(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          Icon(a['isDefault'] == true ? Icons.home_rounded : Icons.place_outlined, color: AppColors.muted),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              [a['governorate'], a['city'], a['area'], a['street']].where((e) => e != null && '$e'.isNotEmpty).join(' · '),
                              style: const TextStyle(height: 1.5),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
              const SectionTitle('الطلبات'),
              if (c.recentOrders.isEmpty) const Text('لا طلبات بعد', style: TextStyle(color: AppColors.muted)),
              for (final o in c.recentOrders)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Panel(
                    padding: const EdgeInsets.all(12),
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => OrderScreen(orderId: '${o['id']}'))),
                    child: Row(
                      children: [
                        Text(
                          '${o['orderNumber']}',
                          textDirection: TextDirection.ltr,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(width: 8),
                        OrderStatusPill('${o['status']}', small: true),
                        const Spacer(),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(money((o['total'] as num).toInt()), style: const TextStyle(fontWeight: FontWeight.w800)),
                            Text(timeAgo(parseDate(o['createdAt'])), style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              if (c.loyalty.isNotEmpty) ...[
                const SectionTitle('سجل النقاط'),
                Panel(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      for (final l in c.loyalty)
                        ListTile(
                          dense: true,
                          leading: Icon(
                            l['isEarned'] == true ? Icons.add_circle_outline_rounded : Icons.remove_circle_outline_rounded,
                            color: l['isEarned'] == true ? AppColors.success : AppColors.danger,
                          ),
                          title: Text('${l['title']}'),
                          subtitle: Text(timeAgo(parseDate(l['createdAt']))),
                          trailing: Text(
                            '${l['isEarned'] == true ? '+' : '-'}${l['points']}',
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

String compactNum(int v) => v >= 1000000
    ? '${(v / 1000000).toStringAsFixed(1)}م'
    : v >= 1000
    ? '${(v / 1000).round()}ألف'
    : '$v';

class _Kpi extends StatelessWidget {
  const _Kpi(this.label, this.value, {this.color});
  final String label, value;
  final Color? color;
  @override
  Widget build(BuildContext context) => Panel(
    padding: const EdgeInsets.all(10),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        FittedBox(
          child: Text(
            value,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color ?? AppColors.ink),
          ),
        ),
        Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
      ],
    ),
  );
}
