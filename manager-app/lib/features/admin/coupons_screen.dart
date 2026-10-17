import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart' show DateFormat;

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/admin_repo.dart';
import '../../data/repo.dart';
import '../../widgets/common.dart';

final _couponsProvider = FutureProvider.autoDispose<List<Coupon>>((ref) => ref.watch(repoProvider).coupons());

const _typeLabels = {'PERCENT': 'نسبة %', 'AMOUNT': 'مبلغ ثابت', 'FREE_SHIPPING': 'توصيل مجاني', 'FIRST_ORDER': 'أول طلب %'};

/// الكوبونات: تشغيل/إيقاف، إنشاء وتعديل، وأداء كل كوبون (طلبات، خصم، مبيعات).
class CouponsScreen extends ConsumerWidget {
  const CouponsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(_couponsProvider);
    Future<void> edit([Coupon? c]) async {
      final saved = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        builder: (_) => _CouponSheet(coupon: c),
      );
      if (saved == true) ref.invalidate(_couponsProvider);
    }

    return Scaffold(
      appBar: AppBar(title: const Text('الكوبونات')),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'newCoupon',
        onPressed: () => edit(),
        icon: const Icon(Icons.add_rounded),
        label: const Text('كوبون جديد', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(_couponsProvider.future),
        child: list.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [ErrorView(e, onRetry: () => ref.invalidate(_couponsProvider))]),
          data: (items) => items.isEmpty
              ? ListView(
                  children: const [EmptyState(icon: Icons.confirmation_number_outlined, title: 'لا كوبونات بعد')],
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final c = items[i];
                    return Panel(
                      onTap: () => edit(c),
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryLight,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppColors.primary.withValues(alpha: .3)),
                                ),
                                child: Text(
                                  c.code,
                                  textDirection: TextDirection.ltr,
                                  style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1, color: AppColors.primary),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(c.valueLabel, style: const TextStyle(fontWeight: FontWeight.w800)),
                              const Spacer(),
                              AsyncSwitch(
                                value: c.isActive,
                                onChanged: (v) async {
                                  try {
                                    await ref.read(repoProvider).saveCoupon(c.id, {'isActive': v});
                                    ref.invalidate(_couponsProvider);
                                    if (context.mounted) toast(context, v ? 'شُغّل ${c.code}' : 'أُوقف ${c.code}');
                                    return true;
                                  } catch (e) {
                                    if (context.mounted) toastError(context, e);
                                    return false;
                                  }
                                },
                              ),
                            ],
                          ),
                          if ((c.title ?? '').isNotEmpty) Text(c.title!, style: const TextStyle(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 4),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              c.live
                                  ? const Pill('فعّال الآن', color: AppColors.success, bg: AppColors.successSoft, small: true)
                                  : const Pill('غير فعّال', color: AppColors.muted, bg: AppColors.line, small: true),
                              if (c.showOnHome) const Pill('في الرئيسية', color: AppColors.rose, bg: AppColors.roseSoft, small: true),
                              if (c.minOrder > 0)
                                Pill('حد أدنى ${money(c.minOrder)}', color: AppColors.info, bg: AppColors.infoSoft, small: true),
                              if (c.maxRedemptions != null)
                                Pill(
                                  'استُخدم ${c.redeemedCount}/${c.maxRedemptions}',
                                  color: AppColors.warning,
                                  bg: AppColors.warningSoft,
                                  small: true,
                                ),
                              if (c.endsAt != null)
                                Pill(
                                  'ينتهي ${DateFormat('d/M').format(c.endsAt!.toLocal())}',
                                  color: AppColors.muted,
                                  bg: AppColors.line,
                                  small: true,
                                ),
                            ],
                          ),
                          const Divider(height: 18),
                          Row(
                            children: [
                              _Stat('طلبات', '${c.ordersCount}'),
                              _Stat('خصم مُعطى', money(c.discountGiven)),
                              _Stat('مبيعات', money(c.sales)),
                            ],
                          ),
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

class _Stat extends StatelessWidget {
  const _Stat(this.label, this.value);
  final String label, value;
  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(
      children: [
        FittedBox(
          child: Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
        ),
        Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
      ],
    ),
  );
}

class _CouponSheet extends ConsumerStatefulWidget {
  const _CouponSheet({this.coupon});
  final Coupon? coupon;
  @override
  ConsumerState<_CouponSheet> createState() => _CouponSheetState();
}

class _CouponSheetState extends ConsumerState<_CouponSheet> {
  late final c = widget.coupon;
  late final _code = TextEditingController(text: c?.code ?? '');
  late final _value = TextEditingController(text: c == null ? '' : '${c!.value}');
  late final _title = TextEditingController(text: c?.title ?? '');
  late final _subtitle = TextEditingController(text: c?.subtitle ?? '');
  late final _min = TextEditingController(text: c == null || c!.minOrder == 0 ? '' : '${c!.minOrder}');
  late final _maxDisc = TextEditingController(text: c?.maxDiscount?.toString() ?? '');
  late final _maxUses = TextEditingController(text: c?.maxRedemptions?.toString() ?? '');
  late final _perUser = TextEditingController(text: c?.perUserLimit?.toString() ?? '');
  late String _type = c?.type ?? 'PERCENT';
  late bool _home = c?.showOnHome ?? false;
  late DateTime? _ends = c?.endsAt?.toLocal();
  bool _saving = false;
  bool _dirty = false;

  @override
  void initState() {
    super.initState();
    for (final t in [_code, _value, _title, _subtitle, _min, _maxDisc, _maxUses, _perUser]) {
      t.addListener(_markDirty);
    }
  }

  void _markDirty() {
    if (!_dirty && mounted) setState(() => _dirty = true);
  }

  @override
  void dispose() {
    for (final t in [_code, _value, _title, _subtitle, _min, _maxDisc, _maxUses, _perUser]) {
      t.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    int? n(TextEditingController t) => int.tryParse(normalizeCode(t.text).replaceAll(RegExp(r'\D'), ''));
    final code = normalizeCode(_code.text).toUpperCase();
    String? problem;
    if (code.length < 3) {
      problem = 'اكتب كوداً من 3 أحرف إنجليزية أو أرقام على الأقل';
    } else if (!RegExp(r'^[A-Z0-9_-]+$').hasMatch(code)) {
      problem = 'الكود: أحرف إنجليزية وأرقام فقط بلا فراغ';
    } else if (_type != 'FREE_SHIPPING' && (n(_value) ?? 0) <= 0) {
      problem = 'اكتب قيمة الخصم';
    } else if ((_type == 'PERCENT' || _type == 'FIRST_ORDER') && (n(_value) ?? 0) > 100) {
      problem = 'النسبة لا تتجاوز 100%';
    }
    if (problem != null) {
      toast(context, problem, error: true);
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(repoProvider).saveCoupon(c?.id, {
        'code': code,
        'type': _type,
        'value': _type == 'FREE_SHIPPING' ? 0 : (n(_value) ?? 0),
        'title': _title.text.trim(),
        'subtitle': _subtitle.text.trim(),
        'minOrder': n(_min) ?? 0,
        'maxDiscount': n(_maxDisc),
        'maxRedemptions': n(_maxUses),
        'perUserLimit': n(_perUser),
        'showOnHome': _home,
        'endsAt': _ends?.toUtc().toIso8601String(),
        if (c == null) 'isActive': true,
      });
      if (!mounted) return;
      _dirty = false;
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _num(TextEditingController t, String label, {String? suffix}) => TextField(
    controller: t,
    keyboardType: TextInputType.number,
    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
    decoration: InputDecoration(labelText: label, suffixText: suffix, isDense: true),
  );

  @override
  Widget build(BuildContext context) {
    return UnsavedGuard(
      dirty: _dirty,
      child: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(c == null ? 'كوبون جديد' : 'تعديل ${c!.code}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              const SizedBox(height: 14),
              TextField(
                controller: _code,
                textDirection: TextDirection.ltr,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(labelText: 'الكود (إنجليزي بلا فراغ)', hintText: 'EID20', isDense: true),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                children: [
                  for (final e in _typeLabels.entries)
                    ChoiceChip(
                      label: Text(e.value),
                      selected: _type == e.key,
                      onSelected: (_) => setState(() => (_type = e.key, _dirty = true)),
                      showCheckmark: false,
                    ),
                ],
              ),
              const SizedBox(height: 10),
              if (_type != 'FREE_SHIPPING')
                _num(_value, _type == 'AMOUNT' ? 'قيمة الخصم' : 'نسبة الخصم', suffix: _type == 'AMOUNT' ? 'د.ع' : '%'),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(child: _num(_min, 'حد أدنى للطلب', suffix: 'د.ع')),
                  const SizedBox(width: 8),
                  if (_type == 'PERCENT' || _type == 'FIRST_ORDER') Expanded(child: _num(_maxDisc, 'سقف الخصم', suffix: 'د.ع')),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(child: _num(_maxUses, 'مرات الاستخدام')),
                  const SizedBox(width: 8),
                  Expanded(child: _num(_perUser, 'لكل زبونة')),
                ],
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _title,
                decoration: const InputDecoration(labelText: 'العنوان في التطبيق', hintText: 'خصم الجمعة', isDense: true),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _subtitle,
                decoration: const InputDecoration(labelText: 'سطر ثانٍ (اختياري)', isDense: true),
              ),
              const SizedBox(height: 6),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                value: _home,
                onChanged: (v) => setState(() => (_home = v, _dirty = true)),
                title: const Text('أظهره كبطاقة في الصفحة الرئيسية', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.event_rounded),
                title: Text(_ends == null ? 'بلا تاريخ انتهاء' : 'ينتهي ${DateFormat('d/M/yyyy').format(_ends!)}'),
                subtitle: _ends != null && _ends!.isBefore(DateTime.now())
                    ? const Text('انتهى — اختر تاريخاً جديداً لتشغيله', style: TextStyle(color: AppColors.danger))
                    : null,
                trailing: _ends == null
                    ? null
                    : IconButton(
                        tooltip: 'بلا تاريخ انتهاء',
                        onPressed: () => setState(() => (_ends = null, _dirty = true)),
                        icon: const Icon(Icons.close_rounded),
                      ),
                onTap: () async {
                  final today = DateUtils.dateOnly(DateTime.now());
                  final initial = _ends == null || _ends!.isBefore(today) ? today.add(const Duration(days: 7)) : _ends!;
                  final d = await showDatePicker(
                    context: context,
                    initialDate: initial,
                    firstDate: today,
                    lastDate: today.add(const Duration(days: 730)),
                  );
                  if (d != null) setState(() => (_ends = DateTime(d.year, d.month, d.day, 23, 59), _dirty = true));
                },
              ),
              const SizedBox(height: 10),
              FilledButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                    : const Text('حفظ'),
              ),
              if (c != null)
                TextButton(
                  style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                  onPressed: () async {
                    if (!await confirm(
                      context,
                      title: 'حذف ${c!.code}؟',
                      message: 'إن استُخدم في طلبات يُوقف بدل الحذف.',
                      ok: 'حذف',
                      danger: true,
                    )) {
                      return;
                    }
                    try {
                      final archived = await ref.read(repoProvider).deleteCoupon(c!.id);
                      if (!context.mounted) return;
                      toast(context, archived ? 'أُوقف (مستخدم في طلبات)' : 'حُذف الكوبون');
                      Navigator.pop(context, true);
                    } catch (e) {
                      if (context.mounted) toastError(context, e);
                    }
                  },
                  child: const Text('حذف الكوبون'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
