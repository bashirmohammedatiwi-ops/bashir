import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../widgets/common.dart';
import '../drafts/save_draft_screen.dart';
import 'attach_shade_flow.dart';
import 'create_product_screen.dart';

/// أصناف لها مخزون في الكاشير لكنها غير موجودة في التطبيق — فرص بيع ضائعة، الأكثر مخزوناً أولاً.
class PosMissingScreen extends ConsumerStatefulWidget {
  const PosMissingScreen({super.key});
  @override
  ConsumerState<PosMissingScreen> createState() => _PosMissingScreenState();
}

class _PosMissingScreenState extends ConsumerState<PosMissingScreen> {
  final _q = TextEditingController();
  Timer? _debounce;
  bool _unsaved = false;
  final _items = <PosItem>[];
  int _total = 0, _units = 0, _page = 1;
  bool _hasNext = false, _loading = false;
  Object? _error;
  final _scroll = ScrollController();
  int _seq = 0;

  @override
  void dispose() {
    _debounce?.cancel();
    _q.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 500) _more();
    });
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    final seq = ++_seq;
    setState(() => (_loading = true, _error = null));
    try {
      final r = await ref.read(repoProvider).posMissing(q: _q.text, unsavedOnly: _unsaved);
      if (!mounted || seq != _seq) return;
      setState(() {
        _items
          ..clear()
          ..addAll(r.items);
        _total = r.total;
        _units = r.units;
        _page = 1;
        _hasNext = r.hasNext;
      });
    } catch (e) {
      if (mounted && seq == _seq) setState(() => _error = e);
    } finally {
      if (mounted && seq == _seq) setState(() => _loading = false);
    }
  }

  /// بعد إجراء على صنف: نحدّثه وحده (أو نزيله إن أُضيف) فيبقى مكانك في القائمة.
  Future<void> _refreshItem(PosItem it) async {
    try {
      final r = await ref.read(repoProvider).posMissing(q: it.barcode);
      if (!mounted) return;
      final fresh = r.items.where((x) => x.barcode == it.barcode).firstOrNull;
      setState(() {
        final i = _items.indexWhere((x) => x.barcode == it.barcode);
        if (i < 0) return;
        if (fresh == null || (_unsaved && fresh.drafts.isNotEmpty)) {
          _items.removeAt(i);
          _total = (_total - 1).clamp(0, _total);
          _units = (_units - it.stock).clamp(0, _units);
        } else {
          _items[i] = fresh;
        }
      });
    } catch (_) {
      _load();
    }
  }

  Future<void> _more() async {
    if (_loading || !_hasNext) return;
    final seq = _seq;
    setState(() => _loading = true);
    try {
      final r = await ref.read(repoProvider).posMissing(q: _q.text, unsavedOnly: _unsaved, page: _page + 1);
      if (!mounted || seq != _seq) return;
      setState(() {
        _page += 1;
        _items.addAll(r.items);
        _hasNext = r.hasNext;
      });
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted && seq == _seq) setState(() => _loading = false);
    }
  }

  Future<void> _actions(PosItem it) async {
    final a = await showModalBottomSheet<String>(
      context: context,
      builder: (c) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(it.name ?? 'بدون اسم', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    Text(
                      '${it.barcode} · ${money(it.price)} · ${it.stock} قطعة',
                      textDirection: TextDirection.ltr,
                      style: const TextStyle(color: AppColors.muted),
                    ),
                  ],
                ),
              ),
              ListTile(
                leading: const Icon(Icons.add_box_rounded, color: AppColors.primary),
                title: const Text('أضفه للتطبيق كمنتج جديد', style: TextStyle(fontWeight: FontWeight.w700)),
                onTap: () => Navigator.pop(c, 'create'),
              ),
              ListTile(
                leading: const Icon(Icons.palette_outlined, color: AppColors.rose),
                title: const Text('أضفه كتدرج لمنتج موجود', style: TextStyle(fontWeight: FontWeight.w700)),
                onTap: () => Navigator.pop(c, 'shade'),
              ),
              ListTile(
                leading: const Icon(Icons.bookmark_add_rounded, color: AppColors.warning),
                title: const Text('احفظه في مجموعة لأضيفه لاحقاً', style: TextStyle(fontWeight: FontWeight.w700)),
                onTap: () => Navigator.pop(c, 'draft'),
              ),
              ListTile(leading: const Icon(Icons.copy_rounded), title: const Text('نسخ الباركود'), onTap: () => Navigator.pop(c, 'copy')),
            ],
          ),
        ),
      ),
    );
    if (a == null || !mounted) return;
    switch (a) {
      case 'create':
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => CreateProductScreen(barcode: it.barcode, posName: it.name, posPrice: it.price, posStock: it.stock),
          ),
        );
        _refreshItem(it);
      case 'shade':
        if (await attachAsShade(context, ref, it.barcode)) _refreshItem(it);
      case 'draft':
        final saved = await Navigator.of(context).push<Object>(
          MaterialPageRoute(
            builder: (_) => SaveDraftScreen(barcode: it.barcode, posName: it.name),
          ),
        );
        if (saved != null) _refreshItem(it);
      case 'copy':
        Clipboard.setData(ClipboardData(text: it.barcode));
        toast(context, 'نُسخ الباركود');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('نواقص الكاشير'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(104),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Column(
              children: [
                TextField(
                  controller: _q,
                  onChanged: (_) {
                    setState(() {});
                    _debounce?.cancel();
                    _debounce = Timer(const Duration(milliseconds: 350), _load);
                  },
                  decoration: InputDecoration(
                    hintText: 'بحث بالاسم أو الباركود',
                    prefixIcon: const Icon(Icons.search_rounded),
                    isDense: true,
                    suffixIcon: _q.text.isEmpty
                        ? null
                        : IconButton(
                            tooltip: 'مسح',
                            onPressed: () {
                              _q.clear();
                              _load();
                            },
                            icon: const Icon(Icons.close_rounded),
                          ),
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${numFmt(_total)} صنف · ${numFmt(_units)} قطعة في الكاشير غير معروضة',
                        style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700, fontSize: 12.5),
                      ),
                    ),
                    FilterChip(
                      label: const Text('غير المحفوظ فقط'),
                      selected: _unsaved,
                      selectedColor: AppColors.primarySoft,
                      onSelected: (v) {
                        setState(() => _unsaved = v);
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
                children: [
                  _q.text.trim().isNotEmpty
                      ? EmptyState(icon: Icons.search_off_rounded, title: 'لا نتائج لـ «${_q.text.trim()}»')
                      : _unsaved
                      ? const EmptyState(
                          icon: Icons.bookmark_added_rounded,
                          title: 'كل النواقص محفوظة',
                          message: 'أطفئ «غير المحفوظ فقط» لرؤيتها.',
                        )
                      : const EmptyState(
                          icon: Icons.verified_rounded,
                          title: 'كل ما في الكاشير موجود في التطبيق',
                          message: 'لا أصناف بمخزون غير معروضة.',
                        ),
                ],
              )
            : ListView.separated(
                controller: _scroll,
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 60),
                itemCount: _items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final it = _items[i];
                  return Panel(
                    padding: const EdgeInsets.all(12),
                    onTap: () => _actions(it),
                    child: Row(
                      children: [
                        Container(
                          width: 54,
                          height: 54,
                          decoration: BoxDecoration(color: AppColors.infoSoft, borderRadius: BorderRadius.circular(14)),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                '${it.stock}',
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.info),
                              ),
                              const Text('قطعة', style: TextStyle(fontSize: 10, color: AppColors.info)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                it.name ?? 'بدون اسم',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                              Text(
                                it.barcode,
                                textDirection: TextDirection.ltr,
                                style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                              ),
                              const SizedBox(height: 4),
                              Wrap(
                                spacing: 6,
                                children: [
                                  Pill(money(it.price), color: AppColors.primary, bg: AppColors.primaryLight, small: true),
                                  if (it.discountPercent > 0)
                                    Pill('خصم ${it.discountPercent}%', color: AppColors.rose, bg: AppColors.roseSoft, small: true),
                                  for (final d in it.drafts)
                                    Pill(
                                      d.groupName,
                                      color: AppColors.group(d.groupColor),
                                      bg: AppColors.group(d.groupColor).withValues(alpha: .12),
                                      small: true,
                                      icon: Icons.bookmark_rounded,
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_left_rounded, color: AppColors.muted),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}
