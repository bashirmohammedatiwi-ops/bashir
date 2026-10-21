import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import 'web_image_search.dart';

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

/// بحث صور المنتج في الويب مثل Google Images (مع البحث بالصورة) واختيار صورة أو أكثر.
Future<List<WebImage>?> pickWebImages(BuildContext context, {String? barcode, String? name, bool single = false}) {
  return Navigator.of(context).push<List<WebImage>>(
    MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => WebImageSearchScreen(barcode: barcode, name: name, single: single),
    ),
  );
}
