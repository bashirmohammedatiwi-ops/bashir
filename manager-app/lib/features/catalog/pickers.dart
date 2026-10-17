import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';

final categoriesProvider = FutureProvider<List<CategoryNode>>((ref) => ref.watch(repoProvider).categories());

/// اختيار البراند — أو كتابة اسم براند جديد (id فارغ = جديد).
Future<NamedRef?> pickBrand(BuildContext context, {String? suggestion}) {
  return showModalBottomSheet<NamedRef>(
    context: context,
    isScrollControlled: true,
    builder: (_) => _BrandSheet(suggestion: suggestion),
  );
}

class _BrandSheet extends ConsumerStatefulWidget {
  const _BrandSheet({this.suggestion});
  final String? suggestion;
  @override
  ConsumerState<_BrandSheet> createState() => _BrandSheetState();
}

class _BrandSheetState extends ConsumerState<_BrandSheet> {
  late final _q = TextEditingController(text: widget.suggestion ?? '');

  @override
  Widget build(BuildContext context) {
    final brands = ref.watch(brandsProvider);
    final q = _q.text.trim().toLowerCase();
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * .8,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: TextField(
              controller: _q,
              autofocus: widget.suggestion == null,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(hintText: 'ابحث عن البراند أو اكتب اسماً جديداً', prefixIcon: Icon(Icons.sell_outlined)),
            ),
          ),
          Expanded(
            child: brands.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => ErrorView(e, onRetry: () => ref.invalidate(brandsProvider)),
              data: (list) {
                final hits = list.where((b) => q.isEmpty || b.name.toLowerCase().contains(q)).toList();
                final exact = list.any((b) => b.name.toLowerCase() == q);
                return ListView(
                  children: [
                    if (q.isNotEmpty && !exact)
                      ListTile(
                        leading: const CircleAvatar(
                          backgroundColor: AppColors.primarySoft,
                          child: Icon(Icons.add_rounded, color: AppColors.primary),
                        ),
                        title: Text(
                          'براند جديد: «${_q.text.trim()}»',
                          style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary),
                        ),
                        subtitle: const Text('يُنشأ تلقائياً عند الحفظ'),
                        onTap: () => Navigator.pop(context, NamedRef('', _q.text.trim())),
                      ),
                    for (final b in hits.take(200))
                      ListTile(
                        title: Text(b.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                        onTap: () => Navigator.pop(context, b),
                      ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// القسم المختار: رئيسي + فرعي اختياري + ثانوي اختياري.
class CategoryPick {
  CategoryPick(this.path);
  final List<CategoryNode> path;
  String? get categoryId => path.isNotEmpty ? path[0].id : null;
  List<String> get subcategoryIds => path.length > 1 ? [path[1].id] : const [];
  List<String> get tertiaryIds => path.length > 2 ? [path[2].id] : const [];
  String get label => path.map((n) => n.name).join(' › ');
}

/// يبني المسار من المعرّفات المحفوظة (لعرض القسم الحالي).
CategoryPick? categoryPathFor(List<CategoryNode> roots, String? categoryId, List<String> subIds, List<String> terIds) {
  if (categoryId == null) return null;
  final root = roots.where((r) => r.id == categoryId).firstOrNull;
  if (root == null) return null;
  final path = [root];
  final sub = root.children.where((c) => subIds.contains(c.id)).firstOrNull;
  if (sub != null) {
    path.add(sub);
    final ter = sub.children.where((c) => terIds.contains(c.id)).firstOrNull;
    if (ter != null) path.add(ter);
  }
  return CategoryPick(path);
}

Future<CategoryPick?> pickCategory(BuildContext context) {
  return showModalBottomSheet<CategoryPick>(context: context, isScrollControlled: true, builder: (_) => const _CategorySheet());
}

class _CategorySheet extends ConsumerStatefulWidget {
  const _CategorySheet();
  @override
  ConsumerState<_CategorySheet> createState() => _CategorySheetState();
}

class _CategorySheetState extends ConsumerState<_CategorySheet> {
  final _path = <CategoryNode>[];

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(categoriesProvider);
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * .8,
      child: cats.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorView(e, onRetry: () => ref.invalidate(categoriesProvider)),
        data: (roots) {
          final level = _path.isEmpty ? roots : _path.last.children;
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: Row(
                  children: [
                    if (_path.isNotEmpty)
                      IconButton(onPressed: () => setState(_path.removeLast), icon: const Icon(Icons.arrow_forward_rounded)),
                    Expanded(
                      child: Text(
                        _path.isEmpty ? 'اختر القسم الرئيسي' : _path.map((n) => n.name).join(' › '),
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                      ),
                    ),
                    if (_path.isNotEmpty)
                      FilledButton(onPressed: () => Navigator.pop(context, CategoryPick([..._path])), child: const Text('اختيار')),
                  ],
                ),
              ),
              const Divider(),
              Expanded(
                child: level.isEmpty
                    ? const Center(
                        child: Text('لا أقسام أدق — اضغط «اختيار»', style: TextStyle(color: AppColors.muted)),
                      )
                    : ListView(
                        children: [
                          for (final c in level)
                            ListTile(
                              title: Text(
                                c.name,
                                style: TextStyle(fontWeight: FontWeight.w700, color: c.isActive ? AppColors.ink : AppColors.muted),
                              ),
                              subtitle: c.isActive ? null : const Text('قسم مخفي'),
                              trailing: c.children.isEmpty || _path.length >= 2
                                  ? const Icon(Icons.check_circle_outline_rounded, color: AppColors.muted)
                                  : const Icon(Icons.chevron_left_rounded),
                              onTap: () {
                                if (c.children.isEmpty || _path.length >= 2) {
                                  Navigator.pop(context, CategoryPick([..._path, c]));
                                } else {
                                  setState(() => _path.add(c));
                                }
                              },
                            ),
                        ],
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// بحث صور المنتج في الويب والمتاجر (بالباركود أو بالاسم) واختيار عدة صور.
Future<List<WebImage>?> pickWebImages(BuildContext context, {String? barcode, String? name, bool single = false}) {
  return showModalBottomSheet<List<WebImage>>(
    context: context,
    isScrollControlled: true,
    builder: (_) => _WebImagesSheet(barcode: barcode, name: name, single: single),
  );
}

class _WebImagesSheet extends ConsumerStatefulWidget {
  const _WebImagesSheet({this.barcode, this.name, this.single = false});
  final String? barcode, name;
  final bool single;
  @override
  ConsumerState<_WebImagesSheet> createState() => _WebImagesSheetState();
}

class _WebImagesSheetState extends ConsumerState<_WebImagesSheet> {
  late bool _byName = (widget.barcode ?? '').replaceAll(RegExp(r'\D'), '').length < 6;
  late final _q = TextEditingController(text: widget.name ?? '');
  List<WebImage>? _items;
  Object? _error;
  bool _loading = false;
  final _sel = <WebImage>[];

  @override
  void initState() {
    super.initState();
    _search();
  }

  Future<void> _search() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final r = await ref.read(repoProvider).webImages(barcode: widget.barcode, name: _q.text, byName: _byName);
      if (mounted) setState(() => _items = r);
    } catch (e) {
      if (mounted) setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * .9,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Column(
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text('صور من الويب والمتاجر', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
                    ),
                    if (_sel.isNotEmpty)
                      FilledButton(onPressed: () => Navigator.pop(context, [..._sel]), child: Text('إضافة ${_sel.length}')),
                  ],
                ),
                const SizedBox(height: 8),
                SegmentedButton<bool>(
                  segments: const [
                    ButtonSegment(value: false, label: Text('بالباركود'), icon: Icon(Icons.qr_code_rounded)),
                    ButtonSegment(value: true, label: Text('بالاسم'), icon: Icon(Icons.text_fields_rounded)),
                  ],
                  selected: {_byName},
                  onSelectionChanged: (v) {
                    setState(() => _byName = v.first);
                    _search();
                  },
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _q,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _search(),
                  decoration: InputDecoration(
                    hintText: _byName ? 'اسم المنتج (إنجليزي أفضل)' : 'اسم مساعد للبحث (اختياري)',
                    prefixIcon: const Icon(Icons.search_rounded),
                    isDense: true,
                    suffixIcon: IconButton(onPressed: _search, icon: const Icon(Icons.arrow_back_rounded)),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [CircularProgressIndicator(), SizedBox(height: 12), Text('نبحث في المتاجر والويب…')],
                    ),
                  )
                : _error != null
                ? ErrorView(_error!, onRetry: _search)
                : (_items ?? []).isEmpty
                ? const EmptyState(icon: Icons.image_search_rounded, title: 'لم نجد صوراً', message: 'جرّب البحث بالاسم بالإنجليزي')
                : GridView.builder(
                    padding: const EdgeInsets.all(12),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      mainAxisSpacing: 8,
                      crossAxisSpacing: 8,
                    ),
                    itemCount: _items!.length,
                    itemBuilder: (_, i) {
                      final img = _items![i];
                      final on = _sel.contains(img);
                      return GestureDetector(
                        onTap: () {
                          if (widget.single) {
                            Navigator.pop(context, [img]);
                            return;
                          }
                          setState(() => on ? _sel.remove(img) : _sel.add(img));
                        },
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: on ? AppColors.primary : AppColors.line, width: on ? 3 : 1),
                              ),
                              child: NetImg(img.thumb ?? img.url, radius: 10, fit: BoxFit.contain),
                            ),
                            if (on)
                              const PositionedDirectional(
                                top: 6,
                                end: 6,
                                child: CircleAvatar(
                                  radius: 12,
                                  backgroundColor: AppColors.primary,
                                  child: Icon(Icons.check_rounded, size: 16, color: Colors.white),
                                ),
                              ),
                            if (img.source != null)
                              PositionedDirectional(
                                bottom: 4,
                                start: 4,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5),
                                  decoration: BoxDecoration(color: const Color(0x99000000), borderRadius: BorderRadius.circular(6)),
                                  child: Text(img.source!, style: const TextStyle(color: Colors.white, fontSize: 9)),
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
