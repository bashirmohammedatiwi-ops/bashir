import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/format.dart';
import '../../core/prefs.dart';
import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../../data/insights_repo.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../catalog/pickers.dart';
import '../product/product_screen.dart';
import '../scan/scan_screen.dart';

final _countsProvider = FutureProvider.autoDispose<List<CountSummary>>((ref) => ref.watch(repoProvider).counts());

/// جلسات الجرد: رف، براند، قسم، أو المحل كاملاً.
class CountsScreen extends ConsumerWidget {
  const CountsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(_countsProvider);
    Future<void> open(String id) async {
      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => CountScreen(id: id)));
      ref.invalidate(_countsProvider);
    }

    Future<void> create() async {
      final c = await showModalBottomSheet<CountDetail>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        builder: (_) => const _NewCountSheet(),
      );
      if (c != null && context.mounted) await open(c.id);
    }

    return Scaffold(
      appBar: AppBar(title: const Text('جرد المخزون')),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'newCount',
        onPressed: create,
        icon: const Icon(Icons.playlist_add_check_rounded),
        label: const Text('جرد جديد', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(_countsProvider.future),
        child: list.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [ErrorView(e, onRetry: () => ref.invalidate(_countsProvider))]),
          data: (items) => items.isEmpty
              ? ListView(
                  children: [
                    EmptyState(
                      icon: Icons.inventory_rounded,
                      title: 'لا جرد بعد',
                      message:
                          'ابدأ جرداً وامسح القطع على الرف بالكاميرا أو قارئ الباركود — يقارن التطبيق العدد بمخزون الكاشير ويُظهر النقص والزيادة.\nاختر برانداً أو قسماً ليُظهر لك أيضاً ما لم تمسحه.',
                      action: FilledButton.icon(onPressed: create, icon: const Icon(Icons.add_rounded), label: const Text('ابدأ أول جرد')),
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final c = items[i];
                    return Panel(
                      onTap: () => open(c.id),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: c.open ? AppColors.infoSoft : AppColors.successSoft,
                            child: Icon(
                              c.open ? Icons.qr_code_scanner_rounded : Icons.task_alt_rounded,
                              color: c.open ? AppColors.info : AppColors.success,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  c.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontWeight: FontWeight.w800),
                                ),
                                Text(
                                  '${numFmt(c.lines)} صنف · ${numFmt(c.units)} قطعة · ${timeAgo(c.createdAt)}',
                                  style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 6),
                          c.open
                              ? const Pill('جارٍ', color: AppColors.info, bg: AppColors.infoSoft, small: true)
                              : const Pill('مُغلق', color: AppColors.success, bg: AppColors.successSoft, small: true),
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

/// بدء جرد: اسم اختياري ونطاق (المحل، براند، أو قسم).
class _NewCountSheet extends ConsumerStatefulWidget {
  const _NewCountSheet();
  @override
  ConsumerState<_NewCountSheet> createState() => _NewCountSheetState();
}

class _NewCountSheetState extends ConsumerState<_NewCountSheet> {
  final _name = TextEditingController();
  String _scope = 'all';
  NamedRef? _brand;
  CategoryPick? _category;
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _pickScope(String v) async {
    if (v == 'brand') {
      final b = await pickBrand(context);
      if (b == null || !mounted) return;
      if (b.id.isEmpty) return toast(context, 'اختر برانداً موجوداً — الجرد يقارن بمنتجاته', error: true);
      setState(() => (_scope = v, _brand = b));
    } else if (v == 'category') {
      final c = await pickCategory(context);
      if (c == null || c.path.isEmpty) return;
      setState(() => (_scope = v, _category = c));
    } else {
      setState(() => _scope = v);
    }
  }

  Future<void> _start() async {
    setState(() => _busy = true);
    try {
      final c = await ref
          .read(repoProvider)
          .createCount(
            _name.text.trim(),
            brandId: _scope == 'brand' ? _brand?.id : null,
            categoryId: _scope == 'category' ? _category?.path.last.id : null,
          );
      if (mounted) Navigator.pop(context, c);
    } catch (e) {
      if (mounted) {
        setState(() => _busy = false);
        toastError(context, e);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final scopeText = switch (_scope) {
      'brand' => _brand?.name,
      'category' => _category?.label,
      _ => null,
    };
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('جرد جديد', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 14),
          TextField(
            controller: _name,
            textInputAction: TextInputAction.done,
            decoration: InputDecoration(
              labelText: 'اسم الجرد (اختياري)',
              hintText: scopeText != null ? 'جرد $scopeText' : 'مثلاً: رف المكياج، المخزن',
            ),
          ),
          const SizedBox(height: 16),
          const Text('ماذا ستجرد؟', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'all', label: Text('أي شيء'), icon: Icon(Icons.store_rounded)),
              ButtonSegment(value: 'brand', label: Text('براند'), icon: Icon(Icons.sell_rounded)),
              ButtonSegment(value: 'category', label: Text('قسم'), icon: Icon(Icons.category_rounded)),
            ],
            selected: {_scope},
            showSelectedIcon: false,
            onSelectionChanged: (s) => _pickScope(s.first),
          ),
          const SizedBox(height: 10),
          Text(
            scopeText != null
                ? '«${ltr(scopeText)}» — سيظهر لك كل صنف فيه متوقع على الرف ولم تمسحه بعد.'
                : 'تمسح ما تجده فقط ويُقارن بالمخزون. اختر برانداً أو قسماً لترى أيضاً ما لم تمسحه.',
            style: const TextStyle(color: AppColors.muted, fontSize: 12.5, height: 1.6),
          ),
          if (scopeText != null)
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: TextButton.icon(
                onPressed: () => _pickScope(_scope),
                icon: const Icon(Icons.edit_rounded, size: 18),
                label: const Text('تغيير'),
              ),
            ),
          const SizedBox(height: 14),
          FilledButton.icon(
            onPressed: _busy ? null : _start,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(50)),
            icon: _busy
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.play_arrow_rounded),
            label: const Text('ابدأ الجرد'),
          ),
        ],
      ),
    );
  }
}

/// جلسة جرد: كل مسح +1 على صنفه؛ القارئ الخارجي يعمل مباشرة.
class CountScreen extends ConsumerStatefulWidget {
  const CountScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<CountScreen> createState() => _CountScreenState();
}

class _CountScreenState extends ConsumerState<CountScreen> {
  CountDetail? _c;
  Object? _error;
  String _filter = 'all';
  String _query = '';
  final _code = TextEditingController();
  final _codeFocus = FocusNode();
  String? _flashId;
  Timer? _flashTimer;
  bool _scanning = false;

  /// المسحات تُرسل واحدة تلو الأخرى بترتيبها — القارئ أسرع من الشبكة.
  Future<void> _queue = Future.value();
  int _pending = 0;

  @override
  void initState() {
    super.initState();
    _load();
    ScannerBus.instance.push(_onScan);
  }

  @override
  void dispose() {
    ScannerBus.instance.pop(_onScan);
    _flashTimer?.cancel();
    _code.dispose();
    _codeFocus.dispose();
    super.dispose();
  }

  bool _onScan(ScanEvent e) {
    final c = _c;
    if (c == null) return false;
    if (!c.open) {
      Prefs.instance.feedback(error: true);
      toast(context, 'الجرد مغلق — أعد فتحه لإضافة قطع', error: true);
      return true;
    }
    _add(e.code);
    return true;
  }

  Future<void> _load() async {
    try {
      final c = await ref.read(repoProvider).count(widget.id);
      if (mounted) setState(() => (_c = c, _error = null));
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _add(String raw, {int qty = 1}) {
    final code = normalizeCode(raw);
    if (code.isEmpty) return Future.value();
    setState(() => _pending++);
    return _queue = _queue.then((_) => _send(code, qty)).whenComplete(() {
      if (mounted) setState(() => _pending--);
    });
  }

  Future<void> _send(String code, int qty) async {
    try {
      final r = await ref.read(repoProvider).countScan(widget.id, code, qty: qty);
      final unknown = r.line.name == null;
      if (qty > 0) Prefs.instance.feedback(error: unknown);
      if (!mounted) return;
      final c = _c;
      if (c != null) {
        // نحدّث محلياً بدل إعادة تحميل الجرد كاملاً بعد كل قطعة.
        setState(() {
          c.lines.removeWhere((l) => l.id == r.line.id);
          c.lines.insert(0, r.line);
          c.summary
            ..clear()
            ..addAll(r.summary);
          c.missing.removeWhere((m) => normalizeCode(m.barcode) == normalizeCode(r.line.barcode));
          _flashId = r.line.id;
        });
        _flashTimer?.cancel();
        _flashTimer = Timer(const Duration(milliseconds: 1400), () {
          if (mounted) setState(() => _flashId = null);
        });
      }
      if (unknown && qty > 0) toast(context, 'الباركود $code غير معروف في التطبيق ولا الكاشير', error: true);
    } catch (e) {
      Prefs.instance.feedback(error: true);
      if (mounted) toastError(context, e);
    }
  }

  /// الكاميرا تبقى مفتوحة: كل قراءة تُضاف ثم تعود للمسح.
  Future<void> _camera() async {
    final nav = Navigator.of(context);
    setState(() => _scanning = true);
    while (mounted && _scanning) {
      final code = await nav.push<String>(MaterialPageRoute(builder: (_) => const ScanScreen(pickOnly: true)));
      if (code == null) break;
      unawaited(_add(code));
    }
    if (mounted) setState(() => _scanning = false);
  }

  Future<void> _edit(CountLine l) async {
    final v = await promptText(
      context,
      title: l.name ?? l.barcode,
      initial: '${l.counted}',
      hint: 'العدد الموجود فعلاً',
      keyboard: TextInputType.number,
      direction: TextDirection.ltr,
      ok: 'حفظ العدد',
    );
    final n = parseIntLoose(v);
    if (n == null || n == l.counted) return;
    try {
      final c = await ref.read(repoProvider).setCountLine(widget.id, l.id, n);
      if (mounted) setState(() => _c = c);
    } catch (e) {
      if (mounted) toastError(context, e);
    }
  }

  Future<void> _delete(CountLine l) async {
    try {
      final c = await ref.read(repoProvider).deleteCountLine(widget.id, l.id);
      if (!mounted) return;
      setState(() => _c = c);
      toast(
        context,
        'حُذف «${l.name ?? l.barcode}»',
        action: SnackBarAction(
          label: 'تراجع',
          onPressed: () => _add(l.barcode, qty: l.counted),
        ),
      );
    } catch (e) {
      if (mounted) toastError(context, e);
      await _load();
    }
  }

  /// صنف لم يُمسح: نسأل كم وجدت منه (صفر = غير موجود فعلاً).
  Future<void> _foundMissing(MissingItem m) async {
    final v = await promptText(
      context,
      title: m.name,
      hint: 'كم قطعة وجدت؟ (المتوقع ${m.expected})',
      keyboard: TextInputType.number,
      direction: TextDirection.ltr,
      ok: 'أضف',
    );
    final n = parseIntLoose(v);
    if (n == null || n <= 0) return;
    await _add(m.barcode, qty: n);
  }

  String _report(CountDetail c) {
    final b = StringBuffer('جرد: ${c.name}${c.scopeLabel != null ? ' (${c.scopeLabel})' : ''}\n')
      ..writeln('التاريخ: ${dateTimeFmt(c.createdAt)}')
      ..writeln(
        '${c.s('lines')} صنف · ${c.s('units')} قطعة · مطابق ${c.s('matched')} · نقص ${c.s('short')} · زيادة ${c.s('over')} · غير معروف ${c.s('unknown')}',
      );
    if (c.scoped) b.writeln('لم يُمسح: ${c.s('missing')} صنف (${c.s('missingUnits')} قطعة متوقعة)');
    final diffs = c.lines.where((l) => l.diff != 0).toList()..sort((a, b) => (a.diff ?? 0).compareTo(b.diff ?? 0));
    if (diffs.isNotEmpty) {
      b
        ..writeln()
        ..writeln('الفروقات:');
      for (final l in diffs) {
        b.writeln('${l.barcode} · ${l.name ?? 'غير معروف'} · معدود ${l.counted} · المتوقع ${l.expected ?? '—'} · الفرق ${l.diff ?? '—'}');
      }
    }
    if (c.missing.isNotEmpty) {
      b
        ..writeln()
        ..writeln('لم يُمسح:');
      for (final m in c.missing) {
        b.writeln('${m.barcode} · ${m.name} · المتوقع ${m.expected}');
      }
    }
    return b.toString();
  }

  Future<void> _menu(String v) async {
    final repo = ref.read(repoProvider);
    final nav = Navigator.of(context);
    try {
      if (v == 'close') {
        final c = _c!;
        final ok = await confirm(
          context,
          title: 'إغلاق الجرد؟',
          message: c.scoped && c.s('missing') > 0
              ? 'ما زال ${c.s('missing')} صنف لم يُمسح وسيُحسب نقصاً في التقرير. يمكنك إعادة فتحه لاحقاً.'
              : 'لن يُضاف مسح جديد. يمكنك إعادة فتحه لاحقاً.',
          ok: 'إغلاق',
        );
        if (!ok) return;
        final x = await repo.closeCount(widget.id);
        if (mounted) setState(() => _c = x);
      } else if (v == 'reopen') {
        final x = await repo.closeCount(widget.id, reopen: true);
        if (mounted) setState(() => _c = x);
      } else if (v == 'delete') {
        if (!mounted) return;
        if (!await confirm(context, title: 'حذف الجرد نهائياً؟', message: 'تُحذف كل القطع المعدودة فيه.', ok: 'حذف', danger: true)) return;
        await repo.deleteCount(widget.id);
        nav.pop();
      }
    } catch (e) {
      if (mounted) toastError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _c;
    if (c == null) {
      return Scaffold(
        appBar: AppBar(),
        body: _error != null ? ErrorView(_error!, onRetry: _load) : const Center(child: CircularProgressIndicator()),
      );
    }
    final q = normalizeCode(_query).toLowerCase();
    bool hit(String? name, String barcode) =>
        q.isEmpty || (name ?? '').toLowerCase().contains(_query.trim().toLowerCase()) || barcode.contains(q);
    final showMissing = _filter == 'missing';
    final lines = showMissing
        ? const <CountLine>[]
        : c.lines.where((l) {
            if (!hit(l.name, l.barcode)) return false;
            return switch (_filter) {
              'short' => (l.diff ?? 0) < 0,
              'over' => (l.diff ?? 0) > 0,
              'ok' => l.diff == 0,
              'unknown' => l.diff == null,
              _ => true,
            };
          }).toList();
    final missing = showMissing ? c.missing.where((m) => hit(m.name, m.barcode)).toList() : const <MissingItem>[];
    final filters = [
      ('all', 'الكل', c.s('lines')),
      if (c.scoped) ('missing', 'لم يُمسح', c.s('missing')),
      ('short', 'نقص', c.s('short')),
      ('over', 'زيادة', c.s('over')),
      ('ok', 'مطابق', c.s('matched')),
      ('unknown', 'غير معروف', c.s('unknown')),
    ];
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(c.name, maxLines: 1, overflow: TextOverflow.ellipsis),
            if (c.scopeLabel != null)
              Text(
                '${ltr(c.scopeLabel!)} · ${numFmt(c.s('scopeExpected'))} صنف متوقع على الرف', style: const TextStyle(fontSize: 12, color: AppColors.muted)),
          ],
        ),
        bottom: _pending > 0 ? const PreferredSize(preferredSize: Size.fromHeight(2), child: LinearProgressIndicator(minHeight: 2)) : null,
        actions: [
          IconButton(
            tooltip: 'مشاركة التقرير',
            onPressed: () => SharePlus.instance.share(ShareParams(text: _report(c), subject: c.name)),
            icon: const Icon(Icons.ios_share_rounded),
          ),
          PopupMenuButton<String>(
            onSelected: _menu,
            itemBuilder: (_) => [
              if (c.open)
                const PopupMenuItem(value: 'close', child: Text('إغلاق الجرد'))
              else
                const PopupMenuItem(value: 'reopen', child: Text('إعادة فتح')),
              if (ref.read(sessionProvider).isAdmin)
                const PopupMenuItem(
                  value: 'delete',
                  child: Text('حذف', style: TextStyle(color: AppColors.danger)),
                ),
            ],
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
          child: !c.open
              ? Row(
                  children: [
                    const Icon(Icons.lock_rounded, color: AppColors.muted, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'أُغلق ${timeAgo(c.closedAt)} — للقراءة فقط',
                        style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600),
                      ),
                    ),
                    OutlinedButton(onPressed: () => _menu('reopen'), child: const Text('إعادة فتح')),
                  ],
                )
              : Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _code,
                        focusNode: _codeFocus,
                        textDirection: TextDirection.ltr,
                        keyboardType: TextInputType.number,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (v) {
                          _code.clear();
                          _add(v);
                          _codeFocus.requestFocus();
                        },
                        decoration: const InputDecoration(
                          hintText: 'اكتب الباركود',
                          isDense: true,
                          prefixIcon: Icon(Icons.keyboard_rounded),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton.icon(
                      onPressed: _camera,
                      style: FilledButton.styleFrom(minimumSize: const Size(0, 48)),
                      icon: const Icon(Icons.qr_code_scanner_rounded),
                      label: const Text('مسح'),
                    ),
                  ],
                ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 30),
          children: [
            Row(
              children: [
                _Num('أصناف', c.s('lines'), AppColors.primary),
                _Num('قطع', c.s('units'), AppColors.ink),
                _Num('مطابق', c.s('matched'), AppColors.success),
                _Num('نقص', c.s('short') + (c.scoped ? c.s('missing') : 0), AppColors.danger),
                _Num('زيادة', c.s('over'), AppColors.warning),
              ],
            ),
            if (c.scoped && c.s('scopeExpected') > 0) ...[
              const SizedBox(height: 10),
              _Progress(done: (c.s('scopeExpected') - c.s('missing')).clamp(0, c.s('scopeExpected')), total: c.s('scopeExpected')),
            ],
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final f in filters)
                    Padding(
                      padding: const EdgeInsetsDirectional.only(end: 8),
                      child: ChoiceChip(
                        label: Text(f.$3 > 0 && f.$1 != 'all' ? '${f.$2} ${f.$3}' : f.$2),
                        selected: _filter == f.$1,
                        showCheckmark: false,
                        selectedColor: f.$1 == 'missing' ? AppColors.dangerSoft : AppColors.primarySoft,
                        onSelected: (_) => setState(() => _filter = f.$1),
                      ),
                    ),
                ],
              ),
            ),
            if (c.lines.length + c.missing.length > 8) ...[
              const SizedBox(height: 8),
              TextField(
                onChanged: (v) => setState(() => _query = v),
                decoration: const InputDecoration(
                  hintText: 'ابحث بالاسم أو الباركود',
                  isDense: true,
                  prefixIcon: Icon(Icons.search_rounded),
                ),
              ),
            ],
            const SizedBox(height: 8),
            if (c.lines.isEmpty && !showMissing)
              Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  c.open ? 'اضغط «مسح» أو استخدم قارئ الباركود — كل قراءة تضيف قطعة.' : 'لم تُعدّ أي قطعة في هذا الجرد.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.muted, height: 1.7),
                ),
              )
            else if (showMissing && missing.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'مسحت كل ما هو متوقع على الرف 👏',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w700),
                ),
              )
            else if (!showMissing && lines.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'لا شيء هنا',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.muted),
                ),
              ),
            if (showMissing && missing.isNotEmpty)
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text(
                  'متوقع وجودها حسب المخزون ولم تُمسح. وجدت قطعة؟ امسحها أو اضغط عليها لإدخال العدد.',
                  style: TextStyle(color: AppColors.muted, fontSize: 12.5, height: 1.6),
                ),
              ),
            for (final m in missing)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Panel(
                  padding: const EdgeInsets.all(10),
                  onTap: c.open ? () => _foundMissing(m) : null,
                  child: Row(
                    children: [
                      NetImg(m.thumb, size: 48, fit: BoxFit.contain, icon: Icons.qr_code_2_rounded),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              m.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                            Text(
                              m.barcode,
                              textDirection: TextDirection.ltr,
                              style: const TextStyle(color: AppColors.muted, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        children: [
                          Text(
                            '${m.expected}',
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.danger),
                          ),
                          Text(m.source == 'pos' ? 'بالكاشير' : 'بالتطبيق', style: const TextStyle(color: AppColors.muted, fontSize: 10.5)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            for (final l in lines)
              Padding(
                key: ValueKey(l.id),
                padding: const EdgeInsets.only(bottom: 8),
                child: Dismissible(
                  key: ValueKey('d${l.id}'),
                  direction: c.open ? DismissDirection.endToStart : DismissDirection.none,
                  background: Container(
                    alignment: AlignmentDirectional.centerEnd,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    decoration: BoxDecoration(color: AppColors.dangerSoft, borderRadius: BorderRadius.circular(18)),
                    child: const Icon(Icons.delete_outline_rounded, color: AppColors.danger),
                  ),
                  onDismissed: (_) {
                    setState(() => c.lines.removeWhere((x) => x.id == l.id));
                    _delete(l);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 400),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: _flashId == l.id ? const [BoxShadow(color: Color(0x553B82F6), blurRadius: 12)] : null,
                    ),
                    child: _LineTile(
                      line: l,
                      open: c.open,
                      onTap: c.open ? () => _edit(l) : null,
                      onPlus: () => _add(l.barcode),
                      onMinus: l.counted > 0 ? () => _add(l.barcode, qty: -1) : null,
                    ),
                  ),
                ),
              ),
            if (c.open && lines.isNotEmpty && _filter == 'all')
              const Padding(
                padding: EdgeInsets.only(top: 6),
                child: Text(
                  'اضغط على صنف لكتابة عدده · اسحبه لليسار لحذفه',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.muted, fontSize: 11.5),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _LineTile extends StatelessWidget {
  const _LineTile({required this.line, required this.open, this.onTap, this.onPlus, this.onMinus});
  final CountLine line;
  final bool open;
  final VoidCallback? onTap, onPlus, onMinus;

  @override
  Widget build(BuildContext context) {
    final l = line;
    final diffColor = l.diff == null
        ? AppColors.muted
        : l.diff == 0
        ? AppColors.success
        : (l.diff! < 0 ? AppColors.danger : AppColors.warning);
    return Panel(
      padding: const EdgeInsets.all(10),
      onTap: onTap,
      child: Row(
        children: [
          GestureDetector(
            onTap: l.productId == null
                ? null
                : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductScreen(productId: l.productId!))),
            child: NetImg(l.thumb, size: 48, fit: BoxFit.contain, icon: Icons.qr_code_2_rounded),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l.name ?? 'غير معروف',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontWeight: FontWeight.w700, color: l.name == null ? AppColors.danger : null),
                ),
                const SizedBox(height: 2),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(text: l.barcode),
                      TextSpan(
                        text: l.expected == null
                            ? '  ·  لا مخزون مسجّل'
                            : '  ·  المتوقع ${l.expected}${l.source == 'pos' ? ' بالكاشير' : ' بالتطبيق'}',
                      ),
                    ],
                  ),
                  style: const TextStyle(color: AppColors.muted, fontSize: 12),
                ),
              ],
            ),
          ),
          if (open)
            IconButton(
              visualDensity: VisualDensity.compact,
              tooltip: 'إنقاص',
              onPressed: onMinus,
              icon: const Icon(Icons.remove_circle_outline_rounded),
            ),
          SizedBox(
            width: 40,
            child: Column(
              children: [
                FittedBox(
                  child: Text('${l.counted}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                ),
                if (l.diff != null)
                  Text(
                    l.diff == 0 ? '✓' : (l.diff! > 0 ? '+${l.diff}' : '${l.diff}'),
                    textDirection: TextDirection.ltr,
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: diffColor),
                  ),
              ],
            ),
          ),
          if (open)
            IconButton(
              visualDensity: VisualDensity.compact,
              tooltip: 'زيادة',
              onPressed: onPlus,
              icon: const Icon(Icons.add_circle_outline_rounded),
            ),
        ],
      ),
    );
  }
}

class _Progress extends StatelessWidget {
  const _Progress({required this.done, required this.total});
  final int done, total;
  @override
  Widget build(BuildContext context) => Panel(
    padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('التقدّم', style: TextStyle(fontWeight: FontWeight.w700)),
            const Spacer(),
            Text('$done من $total صنف', style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: total == 0 ? 0 : done / total,
            minHeight: 8,
            backgroundColor: AppColors.primaryLight,
            valueColor: const AlwaysStoppedAnimation(AppColors.success),
          ),
        ),
      ],
    ),
  );
}

class _Num extends StatelessWidget {
  const _Num(this.label, this.value, this.color);
  final String label;
  final int value;
  final Color color;
  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(
      children: [
        FittedBox(
          child: Text(
            numFmt(value),
            style: TextStyle(fontSize: 19, fontWeight: FontWeight.w900, color: color),
          ),
        ),
        Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
      ],
    ),
  );
}
