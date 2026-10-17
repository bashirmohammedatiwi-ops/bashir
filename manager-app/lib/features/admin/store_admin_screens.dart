import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/admin_repo.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../widgets/common.dart';
import '../catalog/pickers.dart';
import '../orders/orders_screen.dart';
import '../search/search_screen.dart';
import 'reviews_screen.dart';

// ============================================================== store settings

final _settingsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) => ref.watch(repoProvider).settings());

/// إعدادات المتجر الأساسية: الدفع، التوصيل المجاني، النقاط، الظهور، والتنبيهات.
class StoreSettingsScreen extends ConsumerWidget {
  const StoreSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(_settingsProvider);
    Future<bool> save(Map<String, dynamic> patch, String ok) async {
      try {
        await ref.read(repoProvider).saveSettings(patch);
        ref.invalidate(_settingsProvider);
        if (context.mounted) toast(context, ok);
        return true;
      } catch (e) {
        if (context.mounted) toastError(context, e);
        return false;
      }
    }

    Future<void> editNum(Map<String, dynamic> v, String key, String label, {String? hint, bool decimal = false, num min = 0}) async {
      final t = await promptText(
        context,
        title: label,
        hint: hint,
        initial: '${v[key] ?? ''}',
        keyboard: TextInputType.numberWithOptions(decimal: decimal),
        direction: TextDirection.ltr,
      );
      if (t == null) return;
      final clean = normalizeCode(t).replaceAll(',', '');
      final n = decimal ? num.tryParse(clean) : int.tryParse(clean.replaceAll(RegExp(r'\D'), ''));
      if (n == null || n < min) {
        if (context.mounted) toast(context, 'اكتب رقماً صحيحاً${min > 0 ? ' أكبر من $min' : ''}', error: true);
        return;
      }
      if (n == v[key]) return;
      await save({key: n}, 'تم الحفظ');
    }

    Future<void> editText(Map<String, dynamic> v, String key, String label, {bool latin = false}) async {
      final t = await promptText(
        context,
        title: label,
        initial: '${v[key] ?? ''}',
        keyboard: latin ? TextInputType.phone : null,
        direction: latin ? TextDirection.ltr : null,
      );
      if (t == null) return;
      final x = latin ? normalizeCode(t) : t.trim();
      if (x.isEmpty || x == v[key]) return;
      await save({key: x}, 'تم الحفظ');
    }

    Widget toggle(Map<String, dynamic> v, String key, String title, String sub, {String? confirmOff}) => ListTile(
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
      subtitle: sub.isEmpty ? null : Text(sub),
      trailing: AsyncSwitch(
        value: v[key] == true,
        confirmOff: confirmOff == null
            ? null
            : () => confirm(context, title: 'إيقاف «$title»؟', message: confirmOff, ok: 'إيقاف', danger: true),
        onChanged: (x) => save({key: x}, x ? 'شُغّل «$title»' : 'أُوقف «$title»'),
      ),
    );
    Widget value(
      Map<String, dynamic> v,
      String key,
      String title, {
      String? suffix,
      bool text = false,
      bool latin = false,
      bool decimal = false,
      num min = 0,
      String? hint,
    }) => ListTile(
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
      subtitle: hint == null ? null : Text(hint, style: const TextStyle(fontSize: 12)),
      trailing: Text(
        text ? (latin ? ltr('${v[key] ?? '—'}') : '${v[key] ?? '—'}') : '${numFmt(v[key] as num?)}${suffix != null ? ' $suffix' : ''}',
        style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary),
      ),
      onTap: () => text ? editText(v, key, title, latin: latin) : editNum(v, key, title, hint: hint, decimal: decimal, min: min),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('إعدادات المتجر')),
      body: s.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorView(e, onRetry: () => ref.invalidate(_settingsProvider)),
        data: (v) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 40),
          children: [
            const SectionTitle('الدفع والتوصيل'),
            Panel(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  toggle(
                    v,
                    'cashOnDelivery',
                    'الدفع عند الاستلام',
                    'خيار الدفع نقداً للمندوب',
                    confirmOff: 'لن تستطيع الزبونات الدفع نقداً عند الاستلام.',
                  ),
                  const Divider(),
                  toggle(
                    v,
                    'cardPaymentEnabled',
                    'الدفع بالبطاقة',
                    'كي كارد / ماستر / فيزا',
                    confirmOff: 'لن تظهر الدفع بالبطاقة عند إتمام الطلب.',
                  ),
                  const Divider(),
                  toggle(v, 'pickupEnabled', 'الاستلام من المتجر', '${v['pickupAddress'] ?? ''}'),
                  const Divider(),
                  value(v, 'shippingFee', 'رسوم التوصيل الافتراضية', suffix: 'د.ع'),
                  const Divider(),
                  value(v, 'freeShippingThreshold', 'توصيل مجاني فوق', suffix: 'د.ع'),
                ],
              ),
            ),
            const SectionTitle('ظهور المنتجات في التطبيق'),
            Panel(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  toggle(v, 'hideOutOfStock', 'إخفاء النافد', 'المنتج بمخزون 0 لا يظهر في القوائم'),
                  const Divider(),
                  toggle(v, 'hideProductsWithoutImages', 'إخفاء ما بلا صور', 'لا يظهر منتج بصورة افتراضية'),
                  const Divider(),
                  toggle(v, 'hideEmptyBrands', 'إخفاء البراندات الفارغة', 'براند بلا منتجات ظاهرة'),
                  const Divider(),
                  toggle(v, 'hideEmptyCategories', 'إخفاء الأقسام الفارغة', 'قسم بلا منتجات ظاهرة'),
                ],
              ),
            ),
            const SectionTitle('النقاط والمخزون'),
            Panel(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  value(
                    v,
                    'loyaltyEarnPercent',
                    'نسبة الكسب',
                    suffix: '%',
                    decimal: true,
                    hint: 'من قيمة الطلب تُضاف نقاطاً — 1% = 10 نقاط لكل 1,000 د.ع',
                  ),
                  const Divider(),
                  value(v, 'loyaltyPointValue', 'قيمة النقطة', suffix: 'د.ع', decimal: true, min: 0.01, hint: 'خصم كل نقطة عند الاستخدام'),
                  const Divider(),
                  value(v, 'loyaltyRedeemStep', 'خطوة الاستخدام', suffix: 'نقطة', min: 1, hint: 'تُستخدم النقاط بمضاعفاتها (مثلاً 250)'),
                  const Divider(),
                  value(v, 'firstOrderBonusPoints', 'هدية أول طلب', suffix: 'نقطة'),
                  const Divider(),
                  value(v, 'lowStockThreshold', 'حد المخزون القليل', suffix: 'قطعة'),
                  const Divider(),
                  toggle(v, 'stockAlertPushEnabled', 'إشعار «عاد للمخزون»', 'للزبونات المنتظرات عند توفر المنتج'),
                ],
              ),
            ),
            const SectionTitle('التواصل'),
            Panel(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  value(v, 'whatsapp', 'واتساب المتجر', text: true, latin: true),
                  const Divider(),
                  value(v, 'supportPhone', 'هاتف الدعم', text: true, latin: true),
                  const Divider(),
                  value(v, 'pickupHours', 'أوقات الاستلام', text: true),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================== shipping

final _zonesProvider = FutureProvider.autoDispose<List<ShipZone>>((ref) => ref.watch(repoProvider).zones());

/// رسوم التوصيل لكل محافظة ومنطقة.
class ShippingScreen extends ConsumerWidget {
  const ShippingScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final zones = ref.watch(_zonesProvider);
    Future<void> run(Future<void> Function() f, String ok) async {
      try {
        await f();
        ref.invalidate(_zonesProvider);
        if (context.mounted) toast(context, ok);
      } catch (e) {
        if (context.mounted) toastError(context, e);
      }
    }

    Future<int?> askFee(String title, int? current) async {
      final t = await promptText(
        context,
        title: title,
        initial: current?.toString() ?? '',
        keyboard: TextInputType.number,
        direction: TextDirection.ltr,
        hint: 'فارغ = رسوم المحافظة',
      );
      if (t == null) return null;
      return int.tryParse(normalizeCode(t).replaceAll(RegExp(r'\D'), '')) ?? -1;
    }

    return Scaffold(
      appBar: AppBar(title: const Text('التوصيل')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(_zonesProvider.future),
        child: zones.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [ErrorView(e, onRetry: () => ref.invalidate(_zonesProvider))]),
          data: (list) => list.isEmpty
              ? ListView(
                  children: const [
                    EmptyState(icon: Icons.local_shipping_outlined, title: 'لا مناطق توصيل', message: 'أضفها من لوحة التحكم'),
                  ],
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
                  children: [
                    for (final z in list)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Panel(
                          padding: EdgeInsets.zero,
                          child: ExpansionTile(
                            shape: const Border(),
                            title: Text(
                              z.governorate,
                              style: TextStyle(fontWeight: FontWeight.w800, color: z.isActive ? AppColors.ink : AppColors.muted),
                            ),
                            subtitle: Text('${money(z.fee)} · ${z.areas.length} منطقة'),
                            leading: AsyncSwitch(
                              value: z.isActive,
                              confirmOff: () => confirm(
                                context,
                                title: 'إيقاف التوصيل إلى ${z.governorate}؟',
                                message: 'لن تستطيع زبونات هذه المحافظة إتمام الطلب.',
                                ok: 'إيقاف',
                                danger: true,
                              ),
                              onChanged: (v) async {
                                try {
                                  await ref.read(repoProvider).saveZone(z, active: v);
                                  ref.invalidate(_zonesProvider);
                                  final msg = v ? 'شُغّل التوصيل إلى ${z.governorate}' : 'أُوقف التوصيل إلى ${z.governorate}';
                                  if (context.mounted) toast(context, msg);
                                  return true;
                                } catch (e) {
                                  if (context.mounted) toastError(context, e);
                                  return false;
                                }
                              },
                            ),
                            children: [
                              ListTile(
                                title: const Text('رسوم المحافظة'),
                                trailing: Text(
                                  money(z.fee),
                                  style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary),
                                ),
                                onTap: () async {
                                  final f = await askFee('رسوم ${z.governorate}', z.fee);
                                  if (f == null || f < 0 || f == z.fee) return;
                                  await run(() => ref.read(repoProvider).saveZone(z, fee: f), 'رسوم ${z.governorate}: ${money(f)}');
                                },
                              ),
                              for (final a in z.areas)
                                ListTile(
                                  dense: true,
                                  title: Text(
                                    '${a['name']}',
                                    style: TextStyle(color: a['isActive'] == false ? AppColors.muted : AppColors.ink),
                                  ),
                                  subtitle: a['isActive'] == false ? const Text('متوقفة') : null,
                                  trailing: Text(a['fee'] == null ? 'رسوم المحافظة' : money((a['fee'] as num).toInt())),
                                  onTap: () async {
                                    final f = await askFee('رسوم ${a['name']}', (a['fee'] as num?)?.toInt());
                                    if (f == null) return;
                                    await run(
                                      () => ref.read(repoProvider).saveArea('${a['id']}', {'fee': f < 0 ? null : f}),
                                      f < 0 ? '${a['name']}: رسوم المحافظة' : '${a['name']}: ${money(f)}',
                                    );
                                  },
                                  onLongPress: () async {
                                    final on = a['isActive'] == false;
                                    await run(
                                      () => ref.read(repoProvider).saveArea('${a['id']}', {'isActive': on}),
                                      on ? 'شُغّلت ${a['name']}' : 'أُوقفت ${a['name']}',
                                    );
                                  },
                                ),
                            ],
                          ),
                        ),
                      ),
                    const Text(
                      'اضغط مطولاً على منطقة لإيقافها أو تشغيلها.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.muted),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

// ============================================================== brands & categories

final _brandsAdminProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) => ref.watch(repoProvider).brandsAdmin());

/// البراندات (ظهور، مميز) والأقسام (ظهور).
class CatalogAdminScreen extends ConsumerStatefulWidget {
  const CatalogAdminScreen({super.key});
  @override
  ConsumerState<CatalogAdminScreen> createState() => _CatalogAdminScreenState();
}

class _CatalogAdminScreenState extends ConsumerState<CatalogAdminScreen> {
  String _q = '';

  Future<bool> _patchBrand(String id, Map<String, dynamic> patch, String ok) async {
    try {
      await ref.read(repoProvider).patchBrand(id, patch);
      ref.invalidate(_brandsAdminProvider);
      if (mounted) toast(context, ok);
      return true;
    } catch (e) {
      if (mounted) toastError(context, e);
      return false;
    }
  }

  Future<bool> _patchCategory(CategoryNode c, bool active) async {
    try {
      await ref.read(repoProvider).patchCategory(c.id, {'isActive': active});
      ref.invalidate(categoriesProvider);
      if (mounted) toast(context, active ? 'ظهر «${c.name}»' : 'أُخفي «${c.name}»');
      return true;
    } catch (e) {
      if (mounted) toastError(context, e);
      return false;
    }
  }

  Future<bool> _confirmHide(String name, String what) =>
      confirm(context, title: 'إخفاء «$name»؟', message: 'سيختفي $what من تطبيق الزبائن فوراً.', ok: 'إخفاء', danger: true);

  @override
  Widget build(BuildContext context) {
    final brands = ref.watch(_brandsAdminProvider);
    final cats = ref.watch(categoriesProvider);
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('البراندات والأقسام'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'البراندات'),
              Tab(text: 'الأقسام'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
                  child: TextField(
                    onChanged: (v) => setState(() => _q = v.trim().toLowerCase()),
                    decoration: const InputDecoration(hintText: 'ابحث عن براند', prefixIcon: Icon(Icons.search_rounded), isDense: true),
                  ),
                ),
                Expanded(
                  child: brands.when(
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (e, _) => ErrorView(e, onRetry: () => ref.invalidate(_brandsAdminProvider)),
                    data: (list) {
                      final items = list.where((b) => _q.isEmpty || '${b['name']}'.toLowerCase().contains(_q)).toList();
                      return ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 40),
                        itemCount: items.length,
                        separatorBuilder: (_, _) => const Divider(height: 1),
                        itemBuilder: (_, i) {
                          final b = items[i];
                          final active = b['isActive'] != false;
                          final featured = b['isFeatured'] == true;
                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                            title: Text(
                              '${b['name']}',
                              style: TextStyle(fontWeight: FontWeight.w700, color: active ? AppColors.ink : AppColors.muted),
                            ),
                            subtitle: Text('${b['productCount'] ?? (b['_count'] as Map?)?['products'] ?? 0} منتج'),
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => _BrandProducts(brandId: '${b['id']}', name: '${b['name']}'),
                              ),
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  tooltip: 'مميز',
                                  onPressed: () => _patchBrand('${b['id']}', {
                                    'isFeatured': !featured,
                                  }, featured ? 'أُزيل «${b['name']}» من المميزة' : 'صار «${b['name']}» مميزاً'),
                                  icon: Icon(
                                    featured ? Icons.star_rounded : Icons.star_outline_rounded,
                                    color: featured ? const Color(0xFFF2B01E) : AppColors.muted,
                                  ),
                                ),
                                AsyncSwitch(
                                  value: active,
                                  confirmOff: () => _confirmHide('${b['name']}', 'البراند وكل منتجاته'),
                                  onChanged: (v) =>
                                      _patchBrand('${b['id']}', {'isActive': v}, v ? 'ظهر «${b['name']}»' : 'أُخفي «${b['name']}»'),
                                ),
                              ],
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
            cats.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => ErrorView(e, onRetry: () => ref.invalidate(categoriesProvider)),
              data: (roots) => ListView(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 40),
                children: [
                  for (final r in roots)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Panel(
                        padding: EdgeInsets.zero,
                        child: ExpansionTile(
                          shape: const Border(),
                          title: Text(
                            r.name,
                            style: TextStyle(fontWeight: FontWeight.w800, color: r.isActive ? AppColors.ink : AppColors.muted),
                          ),
                          subtitle: Text('${r.children.length} قسم فرعي'),
                          leading: AsyncSwitch(
                            value: r.isActive,
                            confirmOff: () => _confirmHide(r.name, 'القسم وأقسامه الفرعية'),
                            onChanged: (v) => _patchCategory(r, v),
                          ),
                          children: [
                            for (final c in r.children)
                              ListTile(
                                dense: true,
                                trailing: AsyncSwitch(
                                  value: c.isActive,
                                  confirmOff: () => _confirmHide(c.name, 'القسم'),
                                  onChanged: (v) => _patchCategory(c, v),
                                ),
                                title: Text(c.name, style: TextStyle(color: c.isActive ? AppColors.ink : AppColors.muted)),
                                subtitle: c.children.isEmpty
                                    ? null
                                    : Text(c.children.map((x) => x.name).join('، '), maxLines: 1, overflow: TextOverflow.ellipsis),
                              ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BrandProducts extends StatelessWidget {
  const _BrandProducts({required this.brandId, required this.name});
  final String brandId, name;
  @override
  Widget build(BuildContext context) => SearchScreen(
    preset: SearchPreset(brandId: brandId, brandName: name),
  );
}

// ============================================================== POS sync

final _posProvider = FutureProvider.autoDispose<(Map<String, dynamic>, List<Map<String, dynamic>>)>((ref) async {
  final repo = ref.watch(repoProvider);
  final r = await Future.wait([repo.posOverview(), repo.posRuns()]);
  return (r[0] as Map<String, dynamic>, r[1] as List<Map<String, dynamic>>);
});

/// حالة المزامنة مع نظام الكاشير: آخر تشغيل، الأخطاء، والأرقام.
class PosSyncScreen extends ConsumerWidget {
  const PosSyncScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(_posProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('مزامنة الكاشير')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(_posProvider.future),
        child: data.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [ErrorView(e, onRetry: () => ref.invalidate(_posProvider))]),
          data: (d) {
            final o = d.$1;
            final runs = d.$2;
            final snaps = Map<String, dynamic>.from(o['snapshots'] as Map? ?? const {});
            final last = runs.isEmpty ? null : runs.first;
            // الأحدث بين سجل التشغيل وآخر صنف وصل من الكاشير (بعض أجهزة الكاشير لا تسجّل التشغيلات)
            final runAt = parseDate(last?['createdAt']);
            final snapAt = parseDate(snaps['lastSyncedAt']);
            final lastAt = _latest(runAt, snapAt);
            final stale = lastAt == null || DateTime.now().difference(lastAt.toLocal()).inMinutes > 60;
            final lastRunFailed = last?['ok'] == false && runAt != null && (snapAt == null || !snapAt.isAfter(runAt));
            final ok = !lastRunFailed && !stale;
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 40),
              children: [
                Panel(
                  color: ok ? AppColors.successSoft : AppColors.dangerSoft,
                  child: Row(
                    children: [
                      Icon(
                        ok ? Icons.cloud_done_rounded : Icons.cloud_off_rounded,
                        color: ok ? AppColors.success : AppColors.danger,
                        size: 32,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              ok ? 'المزامنة تعمل' : (stale ? 'لا مزامنة منذ أكثر من ساعة' : 'آخر مزامنة فشلت'),
                              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: ok ? AppColors.success : AppColors.danger),
                            ),
                            Text('آخر تحديث ${timeAgo(lastAt)}', style: const TextStyle(color: AppColors.muted)),
                            if (last?['errorMessage'] != null)
                              Text('${last!['errorMessage']}', style: const TextStyle(color: AppColors.danger, fontSize: 12.5)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 2,
                  children: [
                    _Box('أصناف الكاشير', numFmt(snaps['total'] as num?)),
                    _Box('مربوطة بالتطبيق', numFmt(snaps['matchedToCatalog'] as num?)),
                    _Box('نافدة في الكاشير', numFmt(snaps['outOfStock'] as num?)),
                    _Box('قليلة (≤ ${o['threshold']})', numFmt(snaps['lowStock'] as num?)),
                  ],
                ),
                const SectionTitle('آخر عمليات المزامنة'),
                if (runs.isEmpty) const Text('لا سجل بعد', style: TextStyle(color: AppColors.muted)),
                for (final r in runs)
                  ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                    leading: Icon(
                      r['ok'] == false ? Icons.error_rounded : Icons.check_circle_rounded,
                      color: r['ok'] == false ? AppColors.danger : AppColors.success,
                    ),
                    title: Text(
                      '${r['changedItems']} تغيير من ${numFmt(r['totalItems'] as num?)} صنف${r['manual'] == true ? ' · يدوي' : ''}',
                    ),
                    subtitle: Text(
                      [
                        timeAgo(parseDate(r['createdAt'])),
                        '${((r['durationMs'] as num? ?? 0) / 1000).toStringAsFixed(1)} ث',
                        if ((r['failedItems'] as num? ?? 0) > 0) 'فشل ${r['failedItems']}',
                        if (r['errorMessage'] != null) '${r['errorMessage']}',
                      ].join(' · '),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _Box extends StatelessWidget {
  const _Box(this.label, this.value);
  final String label, value;
  @override
  Widget build(BuildContext context) => Panel(
    padding: const EdgeInsets.all(12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
        Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
      ],
    ),
  );
}

// ============================================================== store health

/// صحة المتجر: كل ما يحتاج انتباهاً، مرتب بالأهمية، والضغط يفتح القائمة المعنية.
class HealthScreen extends ConsumerWidget {
  const HealthScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final h = ref.watch(healthProvider);
    void open(HealthItem it) {
      final parts = it.target.split(':');
      Widget? page;
      if (parts[0] == 'search') {
        page = SearchScreen(
          preset: SearchPreset(status: parts[1], filter: parts.length > 2 ? parts[2] : null),
        );
      } else if (parts[0] == 'orders') {
        page = OrdersScreen(initialStatus: parts.length > 1 ? parts[1] : null);
      } else if (parts[0] == 'reviews') {
        page = const ReviewsScreen();
      }
      if (page != null) Navigator.of(context).push(MaterialPageRoute(builder: (_) => page!));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('صحة المتجر')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(healthProvider.future),
        child: h.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [ErrorView(e, onRetry: () => ref.invalidate(healthProvider))]),
          data: (s) {
            final items = [...s.items]..sort((a, b) => (b.count > 0 ? 1 : 0).compareTo(a.count > 0 ? 1 : 0));
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 40),
              children: [
                Panel(
                  color: s.issues == 0 ? AppColors.successSoft : AppColors.warningSoft,
                  child: Row(
                    children: [
                      Icon(
                        s.issues == 0 ? Icons.verified_rounded : Icons.health_and_safety_rounded,
                        size: 34,
                        color: s.issues == 0 ? AppColors.success : AppColors.warning,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          s.issues == 0 ? 'المتجر بحالة ممتازة' : issuesLabel(s.issues),
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: s.issues == 0 ? AppColors.success : AppColors.warning,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                Panel(
                  padding: EdgeInsets.zero,
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PosSyncScreen())),
                  child: ListTile(
                    leading: Icon(
                      s.posLastOk == false ? Icons.cloud_off_rounded : Icons.cloud_done_rounded,
                      color: s.posLastOk == false ? AppColors.danger : AppColors.success,
                    ),
                    title: const Text('مزامنة الكاشير', style: TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(
                      'آخر تحديث ${timeAgo(_latest(s.posLastRunAt, s.posSyncedAt))}${s.posFailedDay > 0 ? ' · فشل ${s.posFailedDay} اليوم' : ''}',
                    ),
                    trailing: const Icon(Icons.chevron_left_rounded),
                  ),
                ),
                const SizedBox(height: 10),
                for (final it in items)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Panel(
                      padding: EdgeInsets.zero,
                      onTap: it.count > 0 ? () => open(it) : null,
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: it.count == 0
                              ? AppColors.successSoft
                              : it.severity == 'high'
                              ? AppColors.dangerSoft
                              : it.severity == 'medium'
                              ? AppColors.warningSoft
                              : AppColors.infoSoft,
                          child: it.count == 0
                              ? const Icon(Icons.check_rounded, color: AppColors.success)
                              : Text(
                                  it.count > 999 ? '999+' : '${it.count}',
                                  textDirection: TextDirection.ltr,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w900,
                                    color: it.severity == 'high'
                                        ? AppColors.danger
                                        : it.severity == 'medium'
                                        ? AppColors.warning
                                        : AppColors.info,
                                  ),
                                ),
                        ),
                        title: Text(
                          it.label,
                          style: TextStyle(fontWeight: FontWeight.w700, color: it.count == 0 ? AppColors.muted : AppColors.ink),
                        ),
                        trailing: it.count > 0 ? const Icon(Icons.chevron_left_rounded) : null,
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

DateTime? _latest(DateTime? a, DateTime? b) => a == null ? b : (b == null || a.isAfter(b) ? a : b);
