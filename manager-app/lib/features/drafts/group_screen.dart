import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../catalog/attach_shade_flow.dart';
import '../catalog/create_product_screen.dart';
import '../image/gallery_viewer.dart';
import '../product/product_screen.dart';
import '../scan/scan_screen.dart';
import 'group_picker.dart';
import 'save_draft_screen.dart';

/// باركودات مجموعة واحدة (أو كل المجموعات إن كانت group = null).
class GroupScreen extends ConsumerStatefulWidget {
  const GroupScreen({super.key, required this.group});
  final DraftGroup? group;
  @override
  ConsumerState<GroupScreen> createState() => _GroupScreenState();
}

class _GroupScreenState extends ConsumerState<GroupScreen> {
  String _status = 'all';
  final _q = TextEditingController();
  Timer? _debounce;
  List<Draft> _items = [];
  int _total = 0;
  bool _loading = true;
  Object? _error;
  final _selected = <String>{};

  bool get _selecting => _selected.isNotEmpty;
  int _seq = 0;

  @override
  void dispose() {
    _debounce?.cancel();
    _q.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    final seq = ++_seq;
    setState(() => _loading = true);
    try {
      final r = await ref.read(repoProvider).drafts(groupId: widget.group?.id, status: _status, q: _q.text, limit: 200);
      if (!mounted || seq != _seq) return;
      setState(() {
        _items = r.items;
        _total = r.total;
        _error = null;
      });
    } catch (e) {
      if (mounted && seq == _seq) setState(() => _error = e);
    } finally {
      if (mounted && seq == _seq) setState(() => _loading = false);
    }
  }

  void _refreshAll() {
    _load();
    ref.invalidate(groupsProvider);
    ref.invalidate(statsProvider);
  }

  Future<void> _open(Draft d) async {
    if (_selecting) return _toggleSel(d);
    if (d.added && d.productId != null) {
      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductScreen(productId: d.productId!)));
      return;
    }
    final a = await showModalBottomSheet<String>(
      context: context,
      builder: (c) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.add_box_rounded, color: AppColors.primary),
              title: const Text('أضف المنتج للتطبيق الآن', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('بصوره ومعلوماته المحفوظة'),
              onTap: () => Navigator.pop(c, 'create'),
            ),
            ListTile(
              leading: const Icon(Icons.palette_outlined, color: AppColors.rose),
              title: const Text('أضفه كتدرج لمنتج موجود', style: TextStyle(fontWeight: FontWeight.w700)),
              onTap: () => Navigator.pop(c, 'shade'),
            ),
            ListTile(
              leading: const Icon(Icons.edit_rounded),
              title: const Text('تعديل / إضافة صور'),
              onTap: () => Navigator.pop(c, 'edit'),
            ),
          ],
        ),
      ),
    );
    if (a == null || !mounted) return;
    if (a == 'create') {
      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => CreateProductScreen(draft: d)));
      _refreshAll();
    } else if (a == 'shade') {
      if (await attachAsShade(context, ref, d.barcode, hint: d.name)) _refreshAll();
    } else {
      final saved = await Navigator.of(context).push<Draft>(
        MaterialPageRoute(
          builder: (_) => SaveDraftScreen(barcode: d.barcode, draft: d),
        ),
      );
      if (saved != null) _refreshAll();
    }
  }

  void _toggleSel(Draft d) => setState(() => _selected.contains(d.id) ? _selected.remove(d.id) : _selected.add(d.id));

  Future<void> _move() async {
    String? target;
    final ok = await showModalBottomSheet<bool>(
      context: context,
      builder: (c) => StatefulBuilder(
        builder: (c, setS) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('نقل ${_selected.length} إلى:', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
                const SizedBox(height: 12),
                GroupPicker(selected: target, exclude: widget.group?.id, onChanged: (id) => setS(() => target = id)),
                const SizedBox(height: 16),
                FilledButton(onPressed: () => Navigator.pop(c, true), child: const Text('نقل')),
              ],
            ),
          ),
        ),
      ),
    );
    if (ok != true || target == null) return;
    try {
      await ref.read(repoProvider).moveDrafts(_selected.toList(), target!);
      if (!mounted) return;
      toast(context, 'تم النقل');
      setState(_selected.clear);
      _refreshAll();
    } catch (e) {
      if (mounted) toastError(context, e);
    }
  }

  Future<void> _delete() async {
    if (!await confirm(context, title: 'حذف ${_selected.length} باركود؟', ok: 'حذف', danger: true)) return;
    try {
      await ref.read(repoProvider).deleteDrafts(_selected.toList());
      if (!mounted) return;
      setState(_selected.clear);
      _refreshAll();
    } catch (e) {
      if (mounted) toastError(context, e);
    }
  }

  void _copy() {
    final list = _selecting ? _items.where((d) => _selected.contains(d.id)) : _items.where((d) => !d.added);
    final text = list.map((d) => [d.barcode, if (d.name != null) d.name, if (d.quantity != null) '× ${d.quantity}'].join('  ')).join('\n');
    Clipboard.setData(ClipboardData(text: text));
    toast(context, 'نُسخ ${list.length} باركود — الصقها في واتساب أو ملاحظة');
  }

  @override
  Widget build(BuildContext context) {
    final g = widget.group;
    final color = AppColors.group(g?.color);
    return PopScope(
      canPop: !_selecting,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) setState(_selected.clear);
      },
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: _selecting ? AppColors.primarySoft : null,
          title: _selecting
              ? Text('${_selected.length} محدد')
              : Row(
                  children: [
                    Icon(g == null ? Icons.all_inbox_rounded : Icons.folder_rounded, color: color),
                    const SizedBox(width: 8),
                    Flexible(child: Text(g?.name ?? 'كل الباركودات', overflow: TextOverflow.ellipsis)),
                  ],
                ),
          actions: _selecting
              ? [
                  IconButton(
                    tooltip: 'تحديد الكل',
                    onPressed: () => setState(() => _selected.addAll(_items.map((e) => e.id))),
                    icon: const Icon(Icons.select_all_rounded),
                  ),
                  IconButton(tooltip: 'نسخ', onPressed: _copy, icon: const Icon(Icons.copy_all_rounded)),
                  IconButton(tooltip: 'نقل', onPressed: _move, icon: const Icon(Icons.drive_file_move_outline)),
                  IconButton(
                    tooltip: 'حذف',
                    onPressed: _delete,
                    icon: const Icon(Icons.delete_outline_rounded, color: AppColors.danger),
                  ),
                ]
              : [
                  IconButton(
                    tooltip: 'نسخ الباركودات المنتظرة',
                    onPressed: _items.isEmpty ? null : _copy,
                    icon: const Icon(Icons.copy_all_rounded),
                  ),
                ],
        ),
        floatingActionButton: g == null || _selecting
            ? null
            : FloatingActionButton.extended(
                heroTag: 'scanGroup',
                onPressed: () async {
                  await Navigator.of(context).push(MaterialPageRoute(builder: (_) => ScanScreen(targetGroupId: g.id, continuous: true)));
                  _refreshAll();
                },
                backgroundColor: color,
                foregroundColor: Colors.white,
                icon: const Icon(Icons.qr_code_scanner_rounded),
                label: const Text('مسح إلى هذه المجموعة', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              child: Column(
                children: [
                  TextField(
                    controller: _q,
                    onChanged: (_) {
                      _debounce?.cancel();
                      _debounce = Timer(const Duration(milliseconds: 300), _load);
                    },
                    decoration: const InputDecoration(
                      hintText: 'ابحث بالباركود أو الاسم أو الملاحظة',
                      prefixIcon: Icon(Icons.search_rounded),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      for (final f in const [('all', 'الكل'), ('pending', 'بانتظار الإضافة'), ('added', 'أُضيف')])
                        Padding(
                          padding: const EdgeInsetsDirectional.only(end: 8),
                          child: ChoiceChip(
                            label: Text(f.$2),
                            selected: _status == f.$1,
                            showCheckmark: false,
                            selectedColor: f.$1 == 'added'
                                ? AppColors.successSoft
                                : f.$1 == 'pending'
                                ? AppColors.warningSoft
                                : AppColors.primarySoft,
                            onSelected: (_) {
                              setState(() => _status = f.$1);
                              _load();
                            },
                          ),
                        ),
                      const Spacer(),
                      if (_loading)
                        const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      else
                        Text(
                          '$_total',
                          style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _load,
                child: _error != null
                    ? ListView(children: [ErrorView(_error!, onRetry: _load)])
                    : !_loading && _items.isEmpty
                    ? ListView(
                        children: [
                          _q.text.trim().isNotEmpty
                              ? EmptyState(icon: Icons.search_off_rounded, title: 'لا نتائج لـ «${_q.text.trim()}»')
                              : const EmptyState(
                                  icon: Icons.qr_code_2_rounded,
                                  title: 'لا توجد باركودات هنا',
                                  message: 'امسح منتجاً غير موجود في التطبيق واحفظه في هذه المجموعة.',
                                ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                        itemCount: _items.length + (_total > _items.length ? 1 : 0),
                        separatorBuilder: (_, _) => const SizedBox(height: 10),
                        itemBuilder: (_, i) => i >= _items.length
                            ? Text(
                                'يظهر أول ${_items.length} من ${numFmt(_total)} — ابحث أو اختر حالة لتضييق القائمة',
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                              )
                            : _DraftTile(
                                draft: _items[i],
                                showGroup: g == null,
                                selected: _selected.contains(_items[i].id),
                                onTap: () => _open(_items[i]),
                                onLongPress: () => _toggleSel(_items[i]),
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

class _DraftTile extends StatelessWidget {
  const _DraftTile({required this.draft, required this.onTap, required this.onLongPress, this.showGroup = false, this.selected = false});
  final Draft draft;
  final VoidCallback onTap;
  final VoidCallback onLongPress;
  final bool showGroup;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final d = draft;
    final added = d.added;
    final accent = added ? AppColors.success : AppColors.warning;
    return Material(
      color: selected ? AppColors.primarySoft : (added ? AppColors.successSoft : Colors.white),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        onLongPress: onLongPress,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: selected ? AppColors.primary : (added ? const Color(0xFFB7E4CB) : AppColors.line),
              width: selected ? 2 : 1,
            ),
          ),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  width: 6,
                  decoration: BoxDecoration(
                    color: accent,
                    borderRadius: const BorderRadiusDirectional.horizontal(start: Radius.circular(18)).resolve(Directionality.of(context)),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        GestureDetector(
                          onTap: d.images.isEmpty ? null : () => openGallery(context, d.images, 0),
                          child: Stack(
                            children: [
                              NetImg(
                                added ? (d.productThumb ?? d.images.firstOrNull?.thumb) : d.images.firstOrNull?.thumb,
                                size: 66,
                                icon: Icons.qr_code_2_rounded,
                              ),
                              if (d.images.length > 1)
                                PositionedDirectional(
                                  bottom: 3,
                                  end: 3,
                                  child: Pill(
                                    '${d.images.length}',
                                    color: Colors.white,
                                    bg: const Color(0x99000000),
                                    small: true,
                                    icon: Icons.photo_library_rounded,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      d.title,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontWeight: FontWeight.w800),
                                    ),
                                  ),
                                  if (selected) const Icon(Icons.check_circle_rounded, color: AppColors.primary),
                                ],
                              ),
                              Text(
                                d.barcode,
                                textDirection: TextDirection.ltr,
                                style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600, fontSize: 13),
                              ),
                              if ((d.note ?? '').isNotEmpty)
                                Text(
                                  d.note!,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 12.5, height: 1.5),
                                ),
                              const SizedBox(height: 6),
                              Wrap(
                                spacing: 6,
                                runSpacing: 4,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  added
                                      ? Pill(
                                          'أُضيف للتطبيق ✓',
                                          color: AppColors.success,
                                          bg: Colors.white,
                                          small: true,
                                          icon: Icons.check_rounded,
                                        )
                                      : const Pill(
                                          'بانتظار الإضافة',
                                          color: AppColors.warning,
                                          bg: AppColors.warningSoft,
                                          small: true,
                                          icon: Icons.schedule_rounded,
                                        ),
                                  if (showGroup)
                                    Pill(
                                      d.groupName,
                                      color: AppColors.group(d.groupColor),
                                      bg: AppColors.group(d.groupColor).withValues(alpha: .1),
                                      small: true,
                                    ),
                                  if (d.quantity != null)
                                    Pill('× ${d.quantity}', color: AppColors.primary, bg: AppColors.primaryLight, small: true),
                                  if (d.pos != null)
                                    Pill('كاشير: ${money(d.pos!.price)}', color: AppColors.info, bg: AppColors.infoSoft, small: true),
                                  Text(timeAgo(d.createdAt), style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
                                ],
                              ),
                              if (added && d.productName != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  '← ${d.productName}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w700, fontSize: 12.5),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
