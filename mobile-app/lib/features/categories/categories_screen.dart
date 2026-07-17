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

/// صفحة الأقسام — تكوين بصري واحد: شريط أقسام رئيسي + مساحة استكشاف واسعة.
class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  int _selected = 0;
  bool _didForceRefresh = false;

  @override
  void initState() {
    super.initState();
    // إجبار جلب الأقسام من السيرفر مرة عند فتح التبويب بعد تحديث الشجرة
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (_didForceRefresh || !mounted) return;
      _didForceRefresh = true;
      try {
        await refreshCategories(ref);
      } catch (_) {}
    });
  }

  Future<void> _onRefresh() async {
    HapticFeedback.mediumImpact();
    try {
      await refreshCategories(ref);
    } catch (_) {
      ref.invalidate(categoriesProvider);
    }
  }

  void _selectParent(int index) {
    if (index == _selected) return;
    HapticFeedback.selectionClick();
    setState(() => _selected = index);
  }

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F8),
      body: cats.when(
        loading: () => const _CategoriesLoading(),
        error: (e, _) => SafeArea(
          child: ErrorView(
            message: friendlyError(e),
            onRetry: () => refreshCategories(ref),
          ),
        ),
        data: (list) {
          final parents = list.where((c) => c.parentId == null).toList();
          if (parents.isEmpty) {
            return const SafeArea(
              child: EmptyState(icon: Icons.grid_view_rounded, title: 'لا توجد أقسام'),
            );
          }

          final safeIndex = _selected.clamp(0, parents.length - 1);
          final selected = parents[safeIndex];

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: _onRefresh,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              slivers: [
                SliverToBoxAdapter(
                  child: _CategoriesTop(
                    onSearch: () => context.push('/search'),
                    parents: parents,
                    selected: safeIndex,
                    onSelect: _selectParent,
                  ),
                ),
                SliverToBoxAdapter(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 280),
                    switchInCurve: Curves.easeOutCubic,
                    switchOutCurve: Curves.easeInCubic,
                    transitionBuilder: (child, anim) => FadeTransition(
                      opacity: anim,
                      child: SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(0.04, 0),
                          end: Offset.zero,
                        ).animate(anim),
                        child: child,
                      ),
                    ),
                    child: _ExplorePane(
                      key: ValueKey(selected.id),
                      parent: selected,
                    ),
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 48)),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _CategoriesTop extends StatelessWidget {
  final VoidCallback onSearch;
  final List<Category> parents;
  final int selected;
  final ValueChanged<int> onSelect;

  const _CategoriesTop({
    required this.onSearch,
    required this.parents,
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFFFF0F4),
            Color(0xFFFAF7F8),
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(height: top + 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'الأقسام',
                        style: AppTypography.sectionTitle.copyWith(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'اكتشفِ مجموعتنا كاملة',
                        style: AppTypography.caption.copyWith(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Material(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  child: InkWell(
                    onTap: onSearch,
                    borderRadius: BorderRadius.circular(14),
                    child: const SizedBox(
                      width: 46,
                      height: 46,
                      child: Icon(Icons.search_rounded, color: AppColors.textPrimary),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            height: 108,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              itemCount: parents.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) {
                final active = i == selected;
                final cat = parents[i];
                return _ParentChip(
                  category: cat,
                  active: active,
                  onTap: () => onSelect(i),
                );
              },
            ),
          ),
          const SizedBox(height: AppSpacing.md),
        ],
      ),
    );
  }
}

class _ParentChip extends StatelessWidget {
  final Category category;
  final bool active;
  final VoidCallback onTap;

  const _ParentChip({
    required this.category,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        width: 78,
        padding: const EdgeInsets.fromLTRB(6, 6, 6, 8),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: active ? AppColors.primary : const Color(0xFFE8E4E6),
            width: 1,
          ),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.28),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Column(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: ColoredBox(
                  color: active ? Colors.white.withValues(alpha: 0.18) : const Color(0xFFF3F0F2),
                  child: category.imageUrl.isNotEmpty
                      ? AppNetworkImage(url: category.imageUrl, fit: BoxFit.cover)
                      : Center(
                          child: Text(
                            category.icon ?? category.name.characters.first,
                            style: TextStyle(
                              fontSize: 22,
                              color: active ? Colors.white : AppColors.primary,
                            ),
                          ),
                        ),
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              category.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: active ? Colors.white : AppColors.textPrimary,
                height: 1.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ExplorePane extends StatelessWidget {
  final Category parent;

  const _ExplorePane({super.key, required this.parent});

  void _openAll(BuildContext context) {
    context.push('/products?categoryId=${parent.id}&title=${Uri.encodeComponent(parent.name)}');
  }

  @override
  Widget build(BuildContext context) {
    final children = parent.children;

    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 4, AppSpacing.lg, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _HeroBanner(parent: parent, onTap: () => _openAll(context)),
          const SizedBox(height: AppSpacing.xl),
          Row(
            children: [
              Expanded(
                child: Text(
                  parent.name,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.3,
                  ),
                ),
              ),
              TextButton(
                onPressed: () => _openAll(context),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('كل المنتجات', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    SizedBox(width: 4),
                    Icon(Icons.arrow_back_ios_new_rounded, size: 13),
                  ],
                ),
              ),
            ],
          ),
          if (children.isEmpty) ...[
            const SizedBox(height: AppSpacing.lg),
            _EmptyCategoryCTA(parent: parent),
          ] else ...[
            const SizedBox(height: AppSpacing.md),
            ..._buildSections(context, children),
          ],
        ],
      ),
    );
  }

  List<Widget> _buildSections(BuildContext context, List<Category> children) {
    final widgets = <Widget>[];

    // شبكة الأقسام الفرعية
    widgets.add(
      GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: children.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.78,
        ),
        itemBuilder: (_, i) => _SubcategoryTile(category: children[i]),
      ),
    );

    // أقسام ثانوية تحت كل فرعي يحتوي أبناء
    for (final sub in children.where((c) => c.children.isNotEmpty)) {
      widgets.add(const SizedBox(height: AppSpacing.xxl));
      widgets.add(_TertiaryBlock(category: sub));
    }

    return widgets;
  }
}

class _HeroBanner extends StatelessWidget {
  final Category parent;
  final VoidCallback onTap;

  const _HeroBanner({required this.parent, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final hasImage = parent.imageUrl.isNotEmpty;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Ink(
          height: 168,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: const LinearGradient(
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
              colors: [
                Color(0xFFFFE4EC),
                Color(0xFFFFF5F8),
                Color(0xFFFFE8D6),
              ],
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (hasImage)
                  AppNetworkImage(url: parent.imageUrl, fit: BoxFit.cover),
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerRight,
                      end: Alignment.centerLeft,
                      colors: [
                        Colors.black.withValues(alpha: hasImage ? 0.05 : 0),
                        Colors.black.withValues(alpha: hasImage ? 0.55 : 0),
                      ],
                    ),
                  ),
                ),
                // زخرفة دائرية خفيفة
                Positioned(
                  left: -30,
                  top: -40,
                  child: Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: hasImage ? 0.08 : 0.35),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        parent.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          height: 1.15,
                          color: hasImage ? Colors.white : AppColors.textPrimary,
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        parent.children.isEmpty
                            ? 'تصفّح كل المنتجات'
                            : '${parent.children.length} قسم فرعي',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: hasImage
                              ? Colors.white.withValues(alpha: 0.9)
                              : AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                        decoration: BoxDecoration(
                          color: hasImage ? Colors.white : AppColors.primary,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'استكشف القسم',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w800,
                                color: hasImage ? AppColors.primary : Colors.white,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Icon(
                              Icons.arrow_back_rounded,
                              size: 16,
                              color: hasImage ? AppColors.primary : Colors.white,
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
      ),
    );
  }
}

class _SubcategoryTile extends StatelessWidget {
  final Category category;

  const _SubcategoryTile({required this.category});

  @override
  Widget build(BuildContext context) {
    final tertiaryCount = category.children.length;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push(
          '/products?subcategoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              flex: 5,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ColoredBox(
                    color: const Color(0xFFF4F1F3),
                    child: category.imageUrl.isNotEmpty
                        ? AppNetworkImage(url: category.imageUrl, fit: BoxFit.cover)
                        : Center(
                            child: Text(
                              category.icon ?? category.name.characters.first,
                              style: const TextStyle(fontSize: 36, color: AppColors.primary),
                            ),
                          ),
                  ),
                  if (tertiaryCount > 0)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.45),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '$tertiaryCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      category.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TertiaryBlock extends StatelessWidget {
  final Category category;

  const _TertiaryBlock({required this.category});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Container(
              width: 3,
              height: 18,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                category.name,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
              ),
            ),
            TextButton(
              onPressed: () => context.push(
                '/products?subcategoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
              ),
              child: const Text('الكل', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
            ),
          ],
        ),
        const SizedBox(height: 10),
        ...category.children.asMap().entries.map((entry) {
          final i = entry.key;
          final t = entry.value;
          final isLast = i == category.children.length - 1;
          return Column(
            children: [
              Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                child: InkWell(
                  onTap: () => context.push(
                    '/products?tertiaryCategoryId=${t.id}&title=${Uri.encodeComponent(t.name)}',
                  ),
                  borderRadius: BorderRadius.circular(14),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF7F2F4),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: t.imageUrl.isNotEmpty
                              ? AppNetworkImage(url: t.imageUrl, fit: BoxFit.cover)
                              : const Icon(Icons.spa_outlined, color: AppColors.primary, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            t.name,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                          ),
                        ),
                        const Icon(Icons.chevron_left_rounded, color: AppColors.textMuted),
                      ],
                    ),
                  ),
                ),
              ),
              if (!isLast) const SizedBox(height: 8),
            ],
          );
        }),
      ],
    );
  }
}

class _EmptyCategoryCTA extends StatelessWidget {
  final Category parent;

  const _EmptyCategoryCTA({required this.parent});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xxl),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFEDE8EA)),
      ),
      child: Column(
        children: [
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

class _CategoriesLoading extends StatelessWidget {
  const _CategoriesLoading();

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return ListView(
      padding: EdgeInsets.fromLTRB(AppSpacing.lg, top + 8, AppSpacing.lg, 24),
      children: [
        const ShimmerBox(height: 28, width: 120, radius: 8),
        const SizedBox(height: 8),
        const ShimmerBox(height: 14, width: 180, radius: 6),
        const SizedBox(height: 20),
        SizedBox(
          height: 108,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: 6,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, __) => const ShimmerBox(width: 78, height: 108, radius: 18),
          ),
        ),
        const SizedBox(height: 16),
        const ShimmerBox(height: 168, radius: 22),
        const SizedBox(height: 20),
        const Row(
          children: [
            Expanded(child: ShimmerBox(height: 190, radius: 18)),
            SizedBox(width: 12),
            Expanded(child: ShimmerBox(height: 190, radius: 18)),
          ],
        ),
      ],
    );
  }
}
