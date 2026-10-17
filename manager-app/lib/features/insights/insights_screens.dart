import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/insights_repo.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../product/product_screen.dart';

int _n(dynamic v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;
List<Map<String, dynamic>> _rows(dynamic v) => v is List ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList() : const [];
void _openProduct(BuildContext context, String id) =>
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductScreen(productId: id)));

// ======================================================================= demand

final _demandProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) => ref.watch(repoProvider).demand());

/// ما تطلبه الزبونات ولا يجدنه: انتظار عودة المخزون، مفضّلة نافدة، وأسئلة لم تفهمها ديما.
class DemandScreen extends ConsumerWidget {
  const DemandScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final d = ref.watch(_demandProvider);
    final v = d.valueOrNull;
    final restock = _rows(v?['restock']), wished = _rows(v?['wishlisted']), questions = _rows(v?['questions']);
    Widget wrap(Widget Function() child) => d.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => ListView(children: [ErrorView(e, onRetry: () => ref.invalidate(_demandProvider))]),
      data: (_) => RefreshIndicator(onRefresh: () => ref.refresh(_demandProvider.future), child: child()),
    );
    Widget products(List<Map<String, dynamic>> rows, String Function(Map<String, dynamic>) badge, String empty) => rows.isEmpty
        ? ListView(
            children: [EmptyState(icon: Icons.sentiment_satisfied_alt_rounded, title: empty)],
          )
        : ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
            itemCount: rows.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final r = rows[i];
              final p = Map<String, dynamic>.from(r['product'] as Map);
              final stock = _n(p['stock']);
              return Panel(
                padding: const EdgeInsets.all(10),
                onTap: () => _openProduct(context, '${p['id']}'),
                child: Row(
                  children: [
                    NetImg(p['thumb'] as String?, size: 54, fit: BoxFit.contain),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${p['name']}',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 3),
                          Wrap(
                            spacing: 6,
                            children: [
                              if (p['brand'] != null) Text('${p['brand']}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                              if (p['isActive'] == false)
                                const Pill('موقوف', color: AppColors.danger, bg: AppColors.dangerSoft, small: true)
                              else if (stock <= 0)
                                const Pill('نافد', color: AppColors.warning, bg: AppColors.warningSoft, small: true)
                              else
                                Pill('متوفر $stock', color: AppColors.success, bg: AppColors.successSoft, small: true),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(color: AppColors.roseSoft, borderRadius: BorderRadius.circular(12)),
                      child: Text(
                        badge(r),
                        style: const TextStyle(color: AppColors.rose, fontWeight: FontWeight.w800, fontSize: 12.5),
                      ),
                    ),
                  ],
                ),
              );
            },
          );
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('طلب الزبونات'),
          bottom: TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            tabs: [
              Tab(text: 'ينتظرن عودته${restock.isEmpty ? '' : ' (${restock.length})'}'),
              Tab(text: 'مفضّلة نافدة${wished.isEmpty ? '' : ' (${wished.length})'}'),
              Tab(text: 'أسئلة ديما${questions.isEmpty ? '' : ' (${questions.length})'}'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            wrap(() => products(restock, (r) => '${r['waiting']} تنتظر', 'لا أحد ينتظر منتجاً نافداً')),
            wrap(() => products(wished, (r) => '♥ ${r['wishes']}', 'لا منتجات نافدة في المفضّلة')),
            wrap(
              () => questions.isEmpty
                  ? ListView(
                      children: const [EmptyState(icon: Icons.forum_rounded, title: 'ديما فهمت كل الأسئلة')],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 40),
                      itemCount: questions.length + 1,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (_, i) {
                        if (i == 0) {
                          return const Text(
                            'كلمات بحثت عنها الزبونات عند ديما ولم تجد لها منتجاً — فرصة لإضافة منتج أو اسم بديل.',
                            style: TextStyle(color: AppColors.muted, height: 1.6, fontSize: 12.5),
                          );
                        }
                        final q = questions[i - 1];
                        return Panel(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              const Icon(Icons.help_outline_rounded, color: AppColors.primary),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text('${q['text']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                              ),
                              Text(
                                '×${q['count']}',
                                style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary),
                              ),
                              const SizedBox(width: 8),
                              Text(timeAgo(parseDate(q['lastAt'])), style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ======================================================================= reports

final _reportDays = StateProvider.autoDispose<int>((_) => 30);
final _reportProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) => ref.watch(repoProvider).report(ref.watch(_reportDays)));

const _weekdays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/// تقرير المبيعات: لمن نبيع، ماذا، متى، وكيف يدفعون.
class ReportsScreen extends ConsumerWidget {
  const ReportsScreen({super.key});

  String _csv(Map<String, dynamic> r) {
    final t = Map<String, dynamic>.from(r['totals'] as Map);
    final b = StringBuffer('تقرير مبيعات ديما الحياة — آخر ${r['days']} يوم\n')
      ..writeln('الإيرادات,${t['revenue']}')
      ..writeln('الطلبات,${t['orders']}')
      ..writeln('القطع,${t['units']}')
      ..writeln('متوسط الطلب,${t['averageOrder']}')
      ..writeln('الخصومات,${t['discount']}')
      ..writeln('ملغاة,${t['cancelled']}');
    void section(String title, String key, String col) {
      b
        ..writeln()
        ..writeln('$title,الإيراد,$col');
      for (final x in _rows(r[key])) {
        b.writeln('"${x['name']}",${x['revenue']},${x[col == 'القطع' ? 'units' : 'orders']}');
      }
    }

    section('البراند', 'byBrand', 'القطع');
    section('القسم', 'byCategory', 'القطع');
    section('المحافظة', 'byGovernorate', 'الطلبات');
    section('طريقة الدفع', 'byPayment', 'الطلبات');
    return b.toString();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final days = ref.watch(_reportDays);
    final rep = ref.watch(_reportProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('التقارير'),
        actions: [
          if (rep.valueOrNull != null)
            IconButton(
              tooltip: 'مشاركة',
              onPressed: () => SharePlus.instance.share(ShareParams(text: _csv(rep.value!), subject: 'تقرير المبيعات')),
              icon: const Icon(Icons.ios_share_rounded),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(_reportProvider.future),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
          children: [
            SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 7, label: Text('7 أيام')),
                ButtonSegment(value: 30, label: Text('30 يوم')),
                ButtonSegment(value: 90, label: Text('3 أشهر')),
                ButtonSegment(value: 365, label: Text('سنة')),
              ],
              selected: {days},
              showSelectedIcon: false,
              onSelectionChanged: (s) => ref.read(_reportDays.notifier).state = s.first,
            ),
            const SizedBox(height: 12),
            ...rep.when(
              loading: () => [
                const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(child: CircularProgressIndicator()),
                ),
              ],
              error: (e, _) => [ErrorView(e, onRetry: () => ref.invalidate(_reportProvider))],
              data: (r) => _body(context, r),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _body(BuildContext context, Map<String, dynamic> r) {
    final t = Map<String, dynamic>.from(r['totals'] as Map);
    final hours = (r['hours'] as List? ?? const []).map(_n).toList();
    final week = _rows(r['weekdays']);
    final peakHour = hours.isEmpty ? 0 : hours.indexOf(hours.reduce((a, b) => a > b ? a : b));
    return [
      GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 2.1,
        children: [
          _Kpi('الإيرادات', money(_n(t['revenue'])), Icons.payments_rounded, AppColors.success),
          _Kpi('الطلبات', numFmt(_n(t['orders'])), Icons.receipt_long_rounded, AppColors.primary),
          _Kpi('متوسط الطلب', money(_n(t['averageOrder'])), Icons.shopping_bag_rounded, AppColors.info),
          _Kpi('القطع المباعة', numFmt(_n(t['units'])), Icons.inventory_2_rounded, AppColors.rose),
          _Kpi('الخصومات', money(_n(t['discount'])), Icons.local_offer_rounded, AppColors.warning),
          _Kpi('ملغاة', numFmt(_n(t['cancelled'])), Icons.cancel_rounded, AppColors.danger),
        ],
      ),
      if (_n(t['orders']) > 0) ...[
        SectionTitle(
          'ساعات الطلب',
          subtitle:
              'الذروة حوالي الساعة ${peakHour == 0 ? 12 : (peakHour > 12 ? peakHour - 12 : peakHour)} ${peakHour < 12 ? 'صباحاً' : 'مساءً'}',
        ),
        Panel(child: _HourBars(hours)),
        const SectionTitle('أيام الأسبوع'),
        Panel(
          child: Column(
            children: [
              for (var i = 0; i < week.length; i++)
                _BarRow(
                  label: _weekdays[i],
                  value: _n(week[i]['revenue']),
                  max: week.map((w) => _n(w['revenue'])).fold(1, (a, b) => a > b ? a : b),
                  trailing: '${week[i]['orders']} طلب',
                  color: AppColors.primary,
                ),
            ],
          ),
        ),
      ],
      _breakdown('حسب البراند', _rows(r['byBrand']), 'units', 'قطعة', AppColors.rose),
      _breakdown('حسب القسم', _rows(r['byCategory']), 'units', 'قطعة', AppColors.info),
      _breakdown('حسب المحافظة', _rows(r['byGovernorate']), 'orders', 'طلب', AppColors.success),
      _breakdown(
        'طريقة الدفع',
        _rows(r['byPayment']).map((x) => {...x, 'name': paymentMethodLabels[x['name']] ?? x['name']}).toList(),
        'orders',
        'طلب',
        AppColors.warning,
      ),
    ];
  }

  Widget _breakdown(String title, List<Map<String, dynamic>> rows, String key, String unit, Color color) {
    if (rows.isEmpty) return const SizedBox.shrink();
    final max = rows.map((x) => _n(x['revenue'])).fold(1, (a, b) => a > b ? a : b);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionTitle(title),
        Panel(
          child: Column(
            children: [
              for (final x in rows)
                _BarRow(label: '${x['name']}', value: _n(x['revenue']), max: max, trailing: '${numFmt(_n(x[key]))} $unit', color: color),
            ],
          ),
        ),
      ],
    );
  }
}

class _Kpi extends StatelessWidget {
  const _Kpi(this.label, this.value, this.icon, this.color);
  final String label, value;
  final IconData icon;
  final Color color;
  @override
  Widget build(BuildContext context) => Panel(
    padding: const EdgeInsets.all(12),
    child: Row(
      children: [
        Icon(icon, color: color),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FittedBox(
                child: Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
              ),
              Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
            ],
          ),
        ),
      ],
    ),
  );
}

class _BarRow extends StatelessWidget {
  const _BarRow({required this.label, required this.value, required this.max, required this.trailing, required this.color});
  final String label, trailing;
  final int value, max;
  final Color color;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 5),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ),
            Text(money(value), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5)),
            const SizedBox(width: 8),
            Text(trailing, style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: max == 0 ? 0 : value / max,
            minHeight: 7,
            backgroundColor: color.withValues(alpha: .1),
            valueColor: AlwaysStoppedAnimation(color),
          ),
        ),
      ],
    ),
  );
}

class _HourBars extends StatelessWidget {
  const _HourBars(this.hours);
  final List<int> hours;
  @override
  Widget build(BuildContext context) {
    final max = hours.fold(1, (a, b) => a > b ? a : b);
    return SizedBox(
      height: 120,
      child: Directionality(
        textDirection: TextDirection.ltr,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            for (var h = 0; h < hours.length; h++)
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Tooltip(
                      message: '$h:00 — ${hours[h]} طلب',
                      child: Container(
                        height: 4 + 84 * hours[h] / max,
                        margin: const EdgeInsets.symmetric(horizontal: 1.5),
                        decoration: BoxDecoration(
                          color: hours[h] == max ? AppColors.primary : AppColors.primary.withValues(alpha: .35),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(h % 6 == 0 ? '$h' : '', style: const TextStyle(fontSize: 10, color: AppColors.muted)),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ======================================================================= staff

final _staffProvider = FutureProvider.autoDispose<List<Staff>>((ref) => ref.watch(repoProvider).staff());

/// فريق العمل: من نشط، آخر دخول، وماذا فعل كل شخص.
class StaffScreen extends ConsumerWidget {
  const StaffScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(_staffProvider);
    final meId = ref.watch(sessionProvider).me?.id;
    return Scaffold(
      appBar: AppBar(title: const Text('فريق العمل')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(_staffProvider.future),
        child: list.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [ErrorView(e, onRetry: () => ref.invalidate(_staffProvider))]),
          data: (items) => ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final s = items[i];
              final editable = s.role == 'STAFF' && s.id != meId;
              return Panel(
                padding: const EdgeInsets.all(12),
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => StaffActivityScreen(staff: s))),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: s.isActive ? AppColors.primarySoft : AppColors.dangerSoft,
                      child: Text(
                        s.name.characters.first,
                        style: TextStyle(fontWeight: FontWeight.w800, color: s.isActive ? AppColors.primary : AppColors.danger),
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
                                  s.name,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontWeight: FontWeight.w800),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Pill(s.roleLabel, color: AppColors.primary, bg: AppColors.primaryLight, small: true),
                              if (s.id == meId) ...[
                                const SizedBox(width: 4),
                                const Pill('أنت', color: AppColors.info, bg: AppColors.infoSoft, small: true),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            [
                              s.lastLoginAt == null ? 'لم يدخل بعد' : 'دخول ${timeAgo(s.lastLoginAt)}',
                              '${s.actions7d} تعديل هذا الأسبوع',
                            ].join(' · '),
                            style: const TextStyle(color: AppColors.muted, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    if (editable)
                      Switch(
                        value: s.isActive,
                        onChanged: (v) async {
                          if (!v &&
                              !await confirm(
                                context,
                                title: 'إيقاف حساب ${s.name}؟',
                                message: 'سيُسجَّل خروجه من كل الأجهزة ولن يستطيع الدخول حتى تعيد تشغيله.',
                                ok: 'إيقاف',
                                danger: true,
                              )) {
                            return;
                          }
                          try {
                            await ref.read(repoProvider).setStaffActive(s.id, v);
                            ref.invalidate(_staffProvider);
                          } catch (e) {
                            if (context.mounted) toastError(context, e);
                          }
                        },
                      )
                    else if (!s.isActive)
                      const Pill('موقوف', color: AppColors.danger, bg: AppColors.dangerSoft, small: true),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class StaffActivityScreen extends ConsumerWidget {
  const StaffActivityScreen({super.key, required this.staff});
  final Staff staff;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fut = ref.watch(_activityOf(staff.id));
    return Scaffold(
      appBar: AppBar(title: Text(staff.name)),
      body: fut.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorView(e, onRetry: () => ref.invalidate(_activityOf(staff.id))),
        data: (rows) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
          children: [
            Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${staff.roleLabel}${staff.isActive ? '' : ' · موقوف'}', style: const TextStyle(fontWeight: FontWeight.w800)),
                  if (staff.email != null)
                    Text(
                      staff.email!,
                      textDirection: TextDirection.ltr,
                      style: const TextStyle(color: AppColors.muted),
                    ),
                  if (staff.phone != null)
                    Text(
                      staff.phone!,
                      textDirection: TextDirection.ltr,
                      style: const TextStyle(color: AppColors.muted),
                    ),
                  Text(
                    'آخر دخول: ${staff.lastLoginAt == null ? '—' : timeAgo(staff.lastLoginAt)}',
                    style: const TextStyle(color: AppColors.muted),
                  ),
                ],
              ),
            ),
            SectionTitle('آخر ما فعله', subtitle: rows.isEmpty ? 'لا تعديلات مسجّلة' : '${rows.length} عملية'),
            for (final a in rows)
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                dense: true,
                leading: const Icon(Icons.bolt_rounded, color: AppColors.primary),
                title: Text(ActivityItem.fromJson(a).label, style: const TextStyle(fontWeight: FontWeight.w700)),
                subtitle: Text(
                  [
                    timeAgo(parseDate(a['createdAt'])),
                    if (a['meta'] is Map && (a['meta'] as Map)['name'] != null) '${(a['meta'] as Map)['name']}',
                  ].join(' · '),
                ),
                onTap: a['meta'] is Map && (a['meta'] as Map)['productId'] != null
                    ? () => _openProduct(context, '${(a['meta'] as Map)['productId']}')
                    : (a['entity'] == 'Product' ? () => _openProduct(context, '${a['entityId']}') : null),
              ),
          ],
        ),
      ),
    );
  }
}

final _activityOf = FutureProvider.autoDispose.family<List<Map<String, dynamic>>, String>(
  (ref, id) => ref.watch(repoProvider).staffActivity(id),
);

// ======================================================================= banners

/// بنرات الرئيسية: تشغيل/إيقاف وترتيب بالسحب.
class BannersScreen extends ConsumerStatefulWidget {
  const BannersScreen({super.key});
  @override
  ConsumerState<BannersScreen> createState() => _BannersScreenState();
}

class _BannersScreenState extends ConsumerState<BannersScreen> {
  List<Map<String, dynamic>>? _items;
  Object? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final b = await ref.read(repoProvider).banners();
      if (mounted) setState(() => (_items = b, _error = null));
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _run(Future<void> Function() f) async {
    setState(() => _busy = true);
    try {
      await f();
    } catch (e) {
      if (mounted) toastError(context, e);
    }
    await _load();
    if (mounted) setState(() => _busy = false);
  }

  Future<void> _reorder(int from, int to) async {
    final list = [..._items!];
    if (to > from) to--;
    list.insert(to, list.removeAt(from));
    setState(() => _items = list);
    await _run(() async {
      final repo = ref.read(repoProvider);
      for (var i = 0; i < list.length; i++) {
        if (_n(list[i]['position']) != i) await repo.patchBanner(list[i], {'position': i});
      }
    });
    if (mounted) toast(context, 'تم حفظ الترتيب');
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;
    return Scaffold(
      appBar: AppBar(
        title: const Text('بنرات الرئيسية'),
        bottom: _busy ? const PreferredSize(preferredSize: Size.fromHeight(2), child: LinearProgressIndicator(minHeight: 2)) : null,
      ),
      body: items == null
          ? (_error != null ? ErrorView(_error!, onRetry: _load) : const Center(child: CircularProgressIndicator()))
          : items.isEmpty
          ? const EmptyState(
              icon: Icons.view_carousel_rounded,
              title: 'لا بنرات',
              message: 'أضف البنرات من لوحة التحكم ثم تحكّم بها من هنا.',
            )
          : ReorderableListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
              header: const Padding(
                padding: EdgeInsets.only(bottom: 10),
                child: Text('اسحب من المقبض لتغيير الترتيب في التطبيق.', style: TextStyle(color: AppColors.muted, fontSize: 12.5)),
              ),
              itemCount: items.length,
              onReorder: _busy ? (_, _) {} : _reorder,
              itemBuilder: (_, i) {
                final b = items[i];
                final active = b['isActive'] == true;
                final expired = b['expired'] == true, scheduled = b['scheduled'] == true;
                return Padding(
                  key: ValueKey(b['id']),
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Panel(
                    padding: const EdgeInsets.all(10),
                    child: Row(
                      children: [
                        ReorderableDragStartListener(
                          index: i,
                          child: const Padding(
                            padding: EdgeInsets.all(4),
                            child: Icon(Icons.drag_indicator_rounded, color: AppColors.muted),
                          ),
                        ),
                        Opacity(
                          opacity: active ? 1 : .45,
                          child: NetImg(b['thumb'] as String?, width: 96, height: 54, icon: Icons.image_rounded),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${b['title']}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w800),
                              ),
                              if ((b['subtitle'] ?? '').toString().isNotEmpty)
                                Text(
                                  '${b['subtitle']}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: AppColors.muted, fontSize: 12),
                                ),
                              if (expired || scheduled)
                                Padding(
                                  padding: const EdgeInsets.only(top: 3),
                                  child: expired
                                      ? const Pill('انتهت مدته', color: AppColors.danger, bg: AppColors.dangerSoft, small: true)
                                      : const Pill('مجدول — لم يبدأ بعد', color: AppColors.info, bg: AppColors.infoSoft, small: true),
                                ),
                            ],
                          ),
                        ),
                        Switch(
                          value: active,
                          onChanged: _busy ? null : (v) => _run(() => ref.read(repoProvider).patchBanner(b, {'isActive': v})),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
