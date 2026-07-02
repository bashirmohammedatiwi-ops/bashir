import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/shimmer_box.dart';
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
  final _railScroll = ScrollController();

  @override
  void dispose() {
    _railScroll.dispose();
    super.dispose();
  }

  void _selectParent(int index, List<Category> parents) {
    if (index == _selected) return;
    HapticFeedback.selectionClick();
    setState(() => _selected = index);
    _scrollRailTo(index);
  }

  void _scrollRailTo(int index) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_railScroll.hasClients) return;
      const itemHeight = 88.0;
      final offset = (index * itemHeight) - 80;
      _railScroll.animateTo(
        offset.clamp(0.0, _railScroll.position.maxScrollExtent),
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: AppColors.scaffold,
      body: SafeArea(
        child: cats.when(
          loading: () => const _CategoriesLoading(),
          error: (e, _) => ErrorView(
            message: friendlyError(e),
            onRetry: () => ref.invalidate(categoriesProvider),
          ),
          data: (list) {
            final parents = list.where((c) => c.parentId == null).toList();
            if (parents.isEmpty) {
              return const EmptyState(icon: Icons.grid_view_rounded, title: 'لا توجد أقسام');
            }

            final safeIndex = _selected.clamp(0, parents.length - 1);
            final selected = parents[safeIndex];

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _CategoriesHeader(onSearch: () => context.push('/search')),
                Expanded(
                  child: Row(
                    textDirection: TextDirection.rtl,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _ParentRail(
                        controller: _railScroll,
                        parents: parents,
                        selected: safeIndex,
                        onTap: (i) => _selectParent(i, parents),
                      ),
                      Expanded(
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 220),
                          switchInCurve: Curves.easeOutCubic,
                          switchOutCurve: Curves.easeInCubic,
                          child: _SubcategoryPane(
                            key: ValueKey(selected.id),
                            parent: selected,
                          ),
                        ),
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

class _CategoriesHeader extends StatelessWidget {
  final VoidCallback onSearch;

  const _CategoriesHeader({required this.onSearch});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('الأقسام', style: AppTypography.sectionTitle.copyWith(fontSize: 22)),
          const SizedBox(height: AppSpacing.md),
          Material(
            color: AppColors.surface,
            elevation: 0,
            shadowColor: AppColors.textPrimary.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(AppRadius.lg),
            child: InkWell(
              onTap: onSearch,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              child: Ink(
                height: 48,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: AppColors.border),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.textPrimary.withValues(alpha: 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.search_rounded, color: AppColors.primary, size: 20),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Text(
                      'ابحث عن منتج أو قسم…',
                      style: AppTypography.caption.copyWith(color: AppColors.textMuted, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ParentRail extends StatelessWidget {
  final ScrollController controller;
  final List<Category> parents;
  final int selected;
  final ValueChanged<int> onTap;

  const _ParentRail({
    required this.controller,
    required this.parents,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 96,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(left: BorderSide(color: AppColors.border, width: 0.5)),
        boxShadow: [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 12,
            offset: Offset(-2, 0),
          ),
        ],
      ),
      child: ListView.builder(
        controller: controller,
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        itemCount: parents.length,
        itemBuilder: (_, i) {
          final active = i == selected;
          final cat = parents[i];

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
            child: Material(
              color: active ? AppColors.primaryLight.withValues(alpha: 0.45) : Colors.transparent,
              borderRadius: BorderRadius.circular(AppRadius.md),
              child: InkWell(
                onTap: () => onTap(i),
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border(
                      left: BorderSide(
                        color: active ? AppColors.primary : Colors.transparent,
                        width: 3,
                      ),
                    ),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _CategoryThumb(category: cat, size: 44, active: active),
                      const SizedBox(height: 6),
                      Text(
                        cat.name,
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                          color: active ? AppColors.primary : AppColors.textSecondary,
                          height: 1.25,
                        ),
                      ),
                    ],
                  ),
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

  const _SubcategoryPane({
    super.key,
    required this.parent,
  });

  void _openAll(BuildContext context) {
    context.push('/products?categoryId=${parent.id}&title=${Uri.encodeComponent(parent.name)}');
  }

  @override
  Widget build(BuildContext context) {
    final children = parent.children;

    return ColoredBox(
      color: AppColors.scaffold,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.md, AppSpacing.xxl),
        children: [
          _ParentHeroBanner(parent: parent, onTap: () => _openAll(context)),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: Text(
                  'تصفّح ${parent.name}',
                  style: AppTypography.screenTitle.copyWith(fontSize: 16),
                ),
              ),
              TextButton.icon(
                onPressed: () => _openAll(context),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 14),
                label: const Text('الكل'),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          if (children.isEmpty)
            _EmptyCategoryCTA(parent: parent)
          else ...[
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.92,
                crossAxisSpacing: AppSpacing.md,
                mainAxisSpacing: AppSpacing.md,
              ),
              itemCount: children.length,
              itemBuilder: (_, i) => _SubcategoryCard(category: children[i]),
            ),
            ...children.where((c) => c.children.isNotEmpty).map(
                  (sub) => _TertiarySection(category: sub),
                ),
          ],
        ],
      ),
    );
  }
}

class _ParentHeroBanner extends StatelessWidget {
  final Category parent;
  final VoidCallback onTap;

  const _ParentHeroBanner({required this.parent, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        child: Ink(
          height: 112,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.xl),
            gradient: const LinearGradient(
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
              colors: [Color(0xFFFCE4EC), Color(0xFFF3E8FF), Color(0xFFE8F4FC)],
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.08),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Stack(
            children: [
              if (parent.imageUrl.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                  child: AppNetworkImage(
                    url: parent.imageUrl,
                    fit: BoxFit.cover,
                    height: 112,
                  ),
                ),
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                  gradient: LinearGradient(
                    begin: Alignment.centerRight,
                    end: Alignment.centerLeft,
                    colors: [
                      Colors.black.withValues(alpha: parent.imageUrl.isNotEmpty ? 0.15 : 0),
                      Colors.black.withValues(alpha: parent.imageUrl.isNotEmpty ? 0.55 : 0),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            parent.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: parent.imageUrl.isNotEmpty ? Colors.white : AppColors.textPrimary,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${parent.children.length} قسم فرعي',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: parent.imageUrl.isNotEmpty
                                  ? Colors.white.withValues(alpha: 0.88)
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: parent.imageUrl.isNotEmpty
                            ? Colors.white.withValues(alpha: 0.2)
                            : AppColors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(AppRadius.pill),
                        border: Border.all(
                          color: parent.imageUrl.isNotEmpty
                              ? Colors.white.withValues(alpha: 0.35)
                              : AppColors.primary.withValues(alpha: 0.25),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'استكشف',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: parent.imageUrl.isNotEmpty ? Colors.white : AppColors.primary,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            Icons.arrow_back_ios_new_rounded,
                            size: 12,
                            color: parent.imageUrl.isNotEmpty ? Colors.white : AppColors.primary,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SubcategoryCard extends StatelessWidget {
  final Category category;

  const _SubcategoryCard({required this.category});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      elevation: 0,
      shadowColor: AppColors.textPrimary.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: InkWell(
        onTap: () => context.push(
          '/products?subcategoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
        ),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: AppColors.textPrimary.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.lg - 1)),
                  child: ColoredBox(
                    color: AppColors.divider,
                    child: category.imageUrl.isNotEmpty
                        ? AppNetworkImage(url: category.imageUrl, fit: BoxFit.cover)
                        : Center(child: _CategoryThumb(category: category, size: 52)),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                child: Text(
                  category.name,
                  maxLines: 2,
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    height: 1.25,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TertiarySection extends StatelessWidget {
  final Category category;

  const _TertiarySection({required this.category});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  category.name,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: category.children.map((t) => _TertiaryChip(category: t)).toList(),
          ),
        ],
      ),
    );
  }
}

class _TertiaryChip extends StatelessWidget {
  final Category category;

  const _TertiaryChip({required this.category});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(AppRadius.pill),
      child: InkWell(
        onTap: () => context.push(
          '/products?tertiaryCategoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
        ),
        borderRadius: BorderRadius.circular(AppRadius.pill),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.pill),
            border: Border.all(color: AppColors.border),
          ),
          child: Text(
            category.name,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ),
      ),
    );
  }
}

class _EmptyCategoryCTA extends StatelessWidget {
  final Category parent;

  const _EmptyCategoryCTA({required this.parent});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: AppSpacing.xl),
      padding: const EdgeInsets.all(AppSpacing.xxl),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          _CategoryThumb(category: parent, size: 64),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'تصفّح منتجات ${parent.name}',
            textAlign: TextAlign.center,
            style: AppTypography.screenTitle,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'اكتشفي أحدث المنتجات في هذا القسم',
            textAlign: TextAlign.center,
            style: AppTypography.caption,
          ),
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => context.push(
                '/products?categoryId=${parent.id}&title=${Uri.encodeComponent(parent.name)}',
              ),
              child: const Text('عرض المنتجات'),
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryThumb extends StatelessWidget {
  final Category category;
  final double size;
  final bool active;

  const _CategoryThumb({
    required this.category,
    this.size = 40,
    this.active = false,
  });

  @override
  Widget build(BuildContext context) {
    final radius = size > 48 ? AppRadius.lg : AppRadius.md;

    if (category.imageUrl.isNotEmpty) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(radius),
          border: Border.all(
            color: active ? AppColors.primary.withValues(alpha: 0.5) : AppColors.border,
            width: active ? 1.5 : 1,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: AppNetworkImage(url: category.imageUrl, fit: BoxFit.cover),
      );
    }

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: active
              ? [AppColors.primaryLight, const Color(0xFFF3E8FF)]
              : [AppColors.divider, AppColors.shimmerBase],
        ),
        border: Border.all(
          color: active ? AppColors.primary.withValues(alpha: 0.35) : AppColors.border,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        category.icon ?? category.name.characters.first,
        style: TextStyle(
          fontSize: size * 0.38,
          fontWeight: FontWeight.w700,
          color: active ? AppColors.primary : AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _CategoriesLoading extends StatelessWidget {
  const _CategoriesLoading();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              ShimmerBox(height: 26, width: 90, radius: 8),
              SizedBox(height: AppSpacing.md),
              ShimmerBox(height: 48, radius: AppRadius.lg),
            ],
          ),
        ),
        Expanded(
          child: Row(
            textDirection: TextDirection.rtl,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                width: 96,
                color: AppColors.surface,
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm, horizontal: 6),
                child: Column(
                  children: List.generate(
                    7,
                    (_) => const Padding(
                      padding: EdgeInsets.only(bottom: 10),
                      child: ShimmerBox(height: 72, radius: AppRadius.md),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  children: const [
                    ShimmerBox(height: 112, radius: AppRadius.xl),
                    SizedBox(height: AppSpacing.lg),
                    ShimmerBox(height: 20, width: 140, radius: 6),
                    SizedBox(height: AppSpacing.md),
                    Row(
                      children: [
                        Expanded(child: ShimmerBox(height: 150, radius: AppRadius.lg)),
                        SizedBox(width: AppSpacing.md),
                        Expanded(child: ShimmerBox(height: 150, radius: AppRadius.lg)),
                      ],
                    ),
                    SizedBox(height: AppSpacing.md),
                    Row(
                      children: [
                        Expanded(child: ShimmerBox(height: 150, radius: AppRadius.lg)),
                        SizedBox(width: AppSpacing.md),
                        Expanded(child: ShimmerBox(height: 150, radius: AppRadius.lg)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
