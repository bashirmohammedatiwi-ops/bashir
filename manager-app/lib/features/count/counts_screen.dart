import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/format.dart';
import '../../core/prefs.dart';
import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../../data/insights_repo.dart';
import '../../data/repo.dart';
import '../../widgets/common.dart';
import '../product/product_screen.dart';
import '../scan/scan_screen.dart';

final _countsProvider = FutureProvider.autoDispose<List<CountSummary>>((ref) => ref.watch(repoProvider).counts());

/// جلسات الجرد: رف، قسم، أو المحل كاملاً.
class CountsScreen extends ConsumerWidget {
  const CountsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(_countsProvider);
    Future<void> create() async {
      final name = await promptText(context, title: 'جرد جديد', hint: 'مثلاً: رف المكياج، المخزن، المحل كاملاً', ok: 'ابدأ');
      if (name == null) return;
      try {
        final c = await ref.read(repoProvider).createCount(name);
        if (!context.mounted) return;
        await Navigator.of(context).push(MaterialPageRoute(builder: (_) => CountScreen(id: c.id)));
        ref.invalidate(_countsProvider);
      } catch (e) {
        if (context.mounted) toastError(context, e);
      }
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
                          'ابدأ جرداً وامسح القطع على الرف بالكاميرا أو قارئ الباركود — يقارن التطبيق العدد بمخزون الكاشير ويُظهر النقص والزيادة.',
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
                      onTap: () async {
                        await Navigator.of(context).push(MaterialPageRoute(builder: (_) => CountScreen(id: c.id)));
                        ref.invalidate(_countsProvider);
                      },
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
                                Text(c.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                                Text(
                                  '${c.lines} صنف · ${c.units} قطعة · ${timeAgo(c.createdAt)}',
                                  style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                                ),
                              ],
                            ),
                          ),
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
  final _code = TextEditingController();
  String? _flashId;
  bool _scanning = false;

  @override
  void initState() {
    super.initState();
    _load();
    ScannerBus.instance.push(_onScan);
  }

  @override
  void dispose() {
    ScannerBus.instance.pop(_onScan);
    super.dispose();
  }

  bool _onScan(ScanEvent e) {
    if (_c?.open != true) return false;
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

  Future<void> _add(String raw, {int qty = 1}) async {
    final code = normalizeCode(raw);
    if (code.isEmpty) return;
    try {
      final r = await ref.read(repoProvider).countScan(widget.id, code, qty: qty);
      Prefs.instance.feedback(error: r.line.name == null);
      if (!mounted) return;
      setState(() => _flashId = r.line.id);
      await _load();
      if (r.line.name == null && mounted) toast(context, 'الباركود $code غير معروف في التطبيق ولا الكاشير', error: true);
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
      await _add(code);
    }
    if (mounted) setState(() => _scanning = false);
  }

  Future<void> _edit(CountLine l) async {
    final v = await promptText(
      context,
      title: l.name ?? l.barcode,
      initial: '${l.counted}',
      keyboard: TextInputType.number,
      direction: TextDirection.ltr,
      ok: 'حفظ العدد',
    );
    final n = int.tryParse((v ?? '').replaceAll(RegExp(r'\D'), ''));
    if (n == null) return;
    try {
      final c = await ref.read(repoProvider).setCountLine(widget.id, l.id, n);
      if (mounted) setState(() => _c = c);
    } catch (e) {
      if (mounted) toastError(context, e);
    }
  }

  String _report(CountDetail c) {
    final b = StringBuffer('جرد: ${c.name}\n')
      ..writeln('${c.s('lines')} صنف · ${c.s('units')} قطعة · مطابق ${c.s('matched')} · نقص ${c.s('short')} · زيادة ${c.s('over')}')
      ..writeln();
    final diffs = c.lines.where((l) => (l.diff ?? 0) != 0 || l.diff == null).toList()..sort((a, b) => (a.diff ?? 0).compareTo(b.diff ?? 0));
    for (final l in diffs) {
      b.writeln('${l.barcode}\t${l.name ?? 'غير معروف'}\tمعدود ${l.counted}\tالمتوقع ${l.expected ?? '—'}\tالفرق ${l.diff ?? '—'}');
    }
    return b.toString();
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
    final lines = c.lines.where((l) {
      switch (_filter) {
        case 'short':
          return (l.diff ?? 0) < 0;
        case 'over':
          return (l.diff ?? 0) > 0;
        case 'ok':
          return l.diff == 0;
        case 'unknown':
          return l.diff == null;
      }
      return true;
    }).toList();
    return Scaffold(
      appBar: AppBar(
        title: Text(c.name),
        actions: [
          IconButton(
            tooltip: 'مشاركة التقرير',
            onPressed: () => SharePlus.instance.share(ShareParams(text: _report(c))),
            icon: const Icon(Icons.ios_share_rounded),
          ),
          PopupMenuButton<String>(
            onSelected: (v) async {
              final repo = ref.read(repoProvider);
              final nav = Navigator.of(context);
              try {
                if (v == 'close') {
                  final ok = await confirm(
                    context,
                    title: 'إغلاق الجرد؟',
                    message: 'لن يُضاف مسح جديد. يمكنك إعادة فتحه لاحقاً.',
                    ok: 'إغلاق',
                  );
                  if (!ok) return;
                  final x = await repo.closeCount(widget.id);
                  if (mounted) setState(() => _c = x);
                } else if (v == 'reopen') {
                  final x = await repo.closeCount(widget.id, reopen: true);
                  if (mounted) setState(() => _c = x);
                } else if (v == 'delete') {
                  if (!await confirm(context, title: 'حذف الجرد نهائياً؟', ok: 'حذف', danger: true)) return;
                  await repo.deleteCount(widget.id);
                  nav.pop();
                }
              } catch (e) {
                if (context.mounted) toastError(context, e);
              }
            },
            itemBuilder: (_) => [
              if (c.open)
                const PopupMenuItem(value: 'close', child: Text('إغلاق الجرد'))
              else
                const PopupMenuItem(value: 'reopen', child: Text('إعادة فتح')),
              const PopupMenuItem(
                value: 'delete',
                child: Text('حذف', style: TextStyle(color: AppColors.danger)),
              ),
            ],
          ),
        ],
      ),
      bottomNavigationBar: !c.open
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _code,
                        textDirection: TextDirection.ltr,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (v) {
                          _code.clear();
                          _add(v);
                        },
                        decoration: const InputDecoration(
                          hintText: 'باركود يدوي أو بالقارئ',
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
                _Num('نقص', c.s('short'), AppColors.danger),
                _Num('زيادة', c.s('over'), AppColors.warning),
              ],
            ),
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final f in const [('all', 'الكل'), ('short', 'نقص'), ('over', 'زيادة'), ('ok', 'مطابق'), ('unknown', 'غير معروف')])
                    Padding(
                      padding: const EdgeInsetsDirectional.only(end: 8),
                      child: ChoiceChip(
                        label: Text(f.$2),
                        selected: _filter == f.$1,
                        showCheckmark: false,
                        selectedColor: AppColors.primarySoft,
                        onSelected: (_) => setState(() => _filter = f.$1),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            if (c.lines.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'اضغط «مسح» أو استخدم قارئ الباركود — كل قراءة تضيف قطعة.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.muted, height: 1.7),
                ),
              ),
            for (final l in lines)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 400),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: _flashId == l.id ? const [BoxShadow(color: Color(0x553B82F6), blurRadius: 12)] : null,
                  ),
                  child: Panel(
                    padding: const EdgeInsets.all(10),
                    onTap: () => _edit(l),
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
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                              Text(
                                '${l.barcode} · المتوقع ${l.expected ?? '—'}${l.source == 'pos'
                                    ? ' (الكاشير)'
                                    : l.source == 'app'
                                    ? ' (التطبيق)'
                                    : ''}',
                                style: const TextStyle(color: AppColors.muted, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        if (c.open)
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            onPressed: l.counted > 0 ? () => _add(l.barcode, qty: -1) : null,
                            icon: const Icon(Icons.remove_circle_outline_rounded),
                          ),
                        Column(
                          children: [
                            Text('${l.counted}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                            if (l.diff != null)
                              Text(
                                l.diff == 0 ? '✓' : (l.diff! > 0 ? '+${l.diff}' : '${l.diff}'),
                                textDirection: TextDirection.ltr,
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                  color: l.diff == 0 ? AppColors.success : (l.diff! < 0 ? AppColors.danger : AppColors.warning),
                                ),
                              ),
                          ],
                        ),
                        if (c.open)
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            onPressed: () => _add(l.barcode),
                            icon: const Icon(Icons.add_circle_outline_rounded),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
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
        Text(
          numFmt(value),
          style: TextStyle(fontSize: 19, fontWeight: FontWeight.w900, color: color),
        ),
        Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
      ],
    ),
  );
}
