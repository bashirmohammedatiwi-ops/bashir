import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/states.dart';
import '../../data/models/category.dart';
import '../catalog/catalog_providers.dart';

class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});
  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  int _selected = 0;
  final _expanded = <String>{};

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(categoriesProvider);
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: cats.when(
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
          error: (e, _) =>
              ErrorView(message: e.toString(), onRetry: () => ref.invalidate(categoriesProvider)),
          data: (list) {
            final parents = list.where((c) => c.parentId == null).toList();
            if (parents.isEmpty) {
              return const EmptyState(icon: Icons.grid_view, title: 'لا توجد أقسام');
            }
            final selected = parents[_selected.clamp(0, parents.length - 1)];
            if (_expanded.isEmpty && selected.children.isNotEmpty) {
              _expanded.add(selected.id);
            }
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
                  child: GestureDetector(
                    onTap: () => context.push('/search'),
                    child: Container(
                      height: 44,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: AppColors.scaffold,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.search, color: AppColors.textMuted),
                          SizedBox(width: 8),
                          Text('ابحث', style: TextStyle(color: AppColors.textMuted)),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(child: _SubcategoryPane(
                        parent: selected,
                        expanded: _expanded,
                        onToggle: (id) => setState(() {
                          if (_expanded.contains(id)) {
                            _expanded.remove(id);
                          } else {
                            _expanded.add(id);
                          }
                        }),
                      )),
                      _ParentRail(
                        parents: parents,
                        selected: _selected,
                        onTap: (i) => setState(() {
                          _selected = i;
                          _expanded.clear();
                          if (parents[i].children.isNotEmpty) {
                            _expanded.add(parents[i].id);
                          }
                        }),
                      ),
                    ],
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

class _ParentRail extends StatelessWidget {
  final List<Category> parents;
  final int selected;
  final ValueChanged<int> onTap;
  const _ParentRail({required this.parents, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 108,
      color: AppColors.scaffold,
      child: ListView.builder(
        itemCount: parents.length,
        itemBuilder: (_, i) {
          final active = i == selected;
          return InkWell(
            onTap: () => onTap(i),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
              decoration: BoxDecoration(
                color: active ? AppColors.surface : Colors.transparent,
                border: Border(
                  right: BorderSide(
                    color: active ? AppColors.primary : Colors.transparent,
                    width: 3,
                  ),
                ),
              ),
              child: Text(
                parents[i].name,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: active ? FontWeight.w800 : FontWeight.w500,
                  color: active ? AppColors.primary : AppColors.textSecondary,
                  height: 1.3,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _SubcategoryPane extends StatelessWidget {
  final Category parent;
  final Set<String> expanded;
  final ValueChanged<String> onToggle;
  const _SubcategoryPane({
    required this.parent,
    required this.expanded,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final children = parent.children;
    return ListView(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(parent.name,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            ),
            TextButton(
              onPressed: () => context.push(
                  '/products?categoryId=${parent.id}&title=${Uri.encodeComponent(parent.name)}'),
              child: const Text('جميع المنتجات'),
            ),
          ],
        ),
        if (children.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 40),
            child: Center(
              child: ElevatedButton(
                onPressed: () => context.push(
                    '/products?categoryId=${parent.id}&title=${Uri.encodeComponent(parent.name)}'),
                child: Text('تصفّح ${parent.name}'),
              ),
            ),
          )
        else
          _CategorySection(
            title: parent.name,
            id: parent.id,
            items: children,
            expanded: expanded.contains(parent.id),
            onToggle: () => onToggle(parent.id),
          ),
      ],
    );
  }
}

class _CategorySection extends StatelessWidget {
  final String title;
  final String id;
  final List<Category> items;
  final bool expanded;
  final VoidCallback onToggle;

  const _CategorySection({
    required this.title,
    required this.id,
    required this.items,
    required this.expanded,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        InkWell(
          onTap: onToggle,
          borderRadius: BorderRadius.circular(10),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              children: [
                Expanded(
                  child: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                ),
                Icon(expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                    color: AppColors.textMuted),
              ],
            ),
          ),
        ),
        if (expanded)
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  childAspectRatio: 0.72,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 14,
                ),
                itemCount: items.length,
                itemBuilder: (_, i) {
                  final c = items[i];
                  return GestureDetector(
                    onTap: () => context.push(
                        '/products?subcategoryId=${c.id}&title=${Uri.encodeComponent(c.name)}'),
                    child: Column(
                      children: [
                        Expanded(
                          child: Container(
                            width: double.infinity,
                            decoration: const BoxDecoration(
                              color: AppColors.scaffold,
                              shape: BoxShape.circle,
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: c.imageUrl.isNotEmpty
                                ? AppNetworkImage(url: c.imageUrl)
                                : const Icon(Icons.spa_outlined, color: AppColors.primary, size: 28),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(c.name,
                            maxLines: 2,
                            textAlign: TextAlign.center,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 11, fontWeight: FontWeight.w600, height: 1.2)),
                      ],
                    ),
                  );
                },
              ),
              ...items.where((c) => c.children.isNotEmpty).map((sub) {
                return Padding(
                  padding: const EdgeInsets.only(top: 8, bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(sub.name,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: sub.children.map((t) {
                          return ActionChip(
                            label: Text(t.name, style: const TextStyle(fontSize: 12)),
                            onPressed: () => context.push(
                                '/products?tertiaryCategoryId=${t.id}&title=${Uri.encodeComponent(t.name)}'),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
      ],
    );
  }
}
