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

const double _kRailWidth = 96;
const double _kRailItemHeight = 102;

/// صفحة الأقسام — شريط جانبي بسيط + شبكة أقسام فرعية واضحة.
class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  int _selected = 0;
  bool _didForceRefresh = false;
  final _railScroll = ScrollController();

  @override
  void initState() {
    super.initState();
    // جلب الأقسام من السيرفر مرة عند فتح التبويب
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (_didForceRefresh || !mounted) return;
      _didForceRefresh = true;
      try {
        await refreshCategories(ref);
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    _railScroll.dispose();
    super.dispose();
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
    _revealRailItem(index);
  }

  /// تمرير عنصر الشريط المختار إلى منتصف الشاشة إن كان بعيداً.
  void _revealRailItem(int index) {
    if (!_railScroll.hasClients) return;
    final viewport = _railScroll.position.viewportDimension;
    final target = (index * _kRailItemHeight) - (viewport - _kRailItemHeight) / 2;
    _railScroll.animateTo(
      target.clamp(0.0, _railScroll.position.maxScrollExtent),
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: AppColors.scaffold,
      body: SafeArea(
        bottom: false,
        child: cats.when(
          loading: () => const _CategoriesLoading(),
          error: (e, _) => ErrorView(
            message: friendlyError(e),
            onRetry: () => refreshCategories(ref),
          ),
          data: (list) {
            final parents = list.where((c) => c.parentId == null).toList();
            if (parents.isEmpty) {
              return const EmptyState(
                icon: Icons.grid_view_rounded,
                title: 'لا توجد أقسام',
              );
            }

            final safeIndex = _selected.clamp(0, parents.length - 1);
            final selected = parents[safeIndex];

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _Header(onSearch: () => context.push('/search')),
                Expanded(
                  child: Row(
                    textDirection: TextDirection.rtl,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _ParentRail(
                        controller: _railScroll,
                        parents: parents,
                        selected: safeIndex,
                        onTap: _selectParent,
                      ),
                      Expanded(
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 260),
                          switchInCurve: Curves.easeOutCubic,
                          switchOutCurve: Curves.easeIn,
                          transitionBuilder: (child, anim) => FadeTransition(
                            opacity: anim,
                            child: SlideTransition(
                              position: Tween<Offset>(
                                begin: const Offset(0, 0.015),
                                end: Offset.zero,
                              ).animate(anim),
                              child: child,
                            ),
                          ),
                          child: _ContentPane(
                            key: ValueKey(selected.id),
                            parent: selected,
                            onRefresh: _onRefresh,
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

class _Header extends StatelessWidget {
  final VoidCallback onSearch;
  const _Header({required this.onSearch});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 10, AppSpacing.lg, 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'الأقسام',
                  style: AppTypography.sectionTitle.copyWith(
                    fontSize: 24,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'كل ما تحتاجينه في مكان واحد',
                  style: AppTypography.caption.copyWith(
                    fontSize: 12,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          Material(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            child: InkWell(
              onTap: onSearch,
              borderRadius: BorderRadius.circular(14),
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.hairline),
                ),
                child: const Icon(Icons.search_rounded, color: AppColors.textPrimary, size: 22),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// الشريط الجانبي — صورة دائرية واسم لكل قسم رئيسي مع مؤشر متحرك.
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
      width: _kRailWidth,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(
          left: BorderSide(color: AppColors.divider),
        ),
      ),
      child: ListView.builder(
        controller: controller,
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: parents.length,
        itemExtent: _kRailItemHeight,
        itemBuilder: (_, i) => _RailItem(
          category: parents[i],
          active: i == selected,
          onTap: () => onTap(i),
        ),
      ),
    );
  }
}

class _RailItem extends StatelessWidget {
  final Category category;
  final bool active;
  final VoidCallback onTap;

  const _RailItem({
    required this.category,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Stack(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 240),
            curve: Curves.easeOutCubic,
            decoration: BoxDecoration(
              color: active ? AppColors.primaryLight.withValues(alpha: 0.6) : Colors.transparent,
            ),
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
            child: Column(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 240),
                  curve: Curves.easeOutCubic,
                  width: active ? 52 : 46,
                  height: active ? 52 : 46,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: active ? AppColors.primarySoft : const Color(0xFFF4F1F3),
                    border: Border.all(
                      color: active ? AppColors.primary : Colors.transparent,
                      width: 1.6,
                    ),
                    boxShadow: active
                        ? [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.18),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: category.imageUrl.isNotEmpty
                      ? AppNetworkImage(url: category.imageUrl, fit: BoxFit.cover)
                      : Center(
                          child: Text(
                            category.icon ?? category.name.characters.first,
                            style: TextStyle(
                              fontSize: 18,
                              color: active ? AppColors.primary : AppColors.textSecondary,
                            ),
                          ),
                        ),
                ),
                const SizedBox(height: 6),
                Expanded(
                  child: Text(
                    category.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10.5,
                      height: 1.25,
                      fontWeight: active ? FontWeight.w900 : FontWeight.w600,
                      color: active ? AppColors.primary : AppColors.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // مؤشر جانبي متحرك
          PositionedDirectional(
            start: 0,
            top: 0,
            bottom: 0,
            child: Center(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 240),
                curve: Curves.easeOutCubic,
                width: 3.5,
                height: active ? 34 : 0,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// محتوى القسم المختار — بطاقة القسم + شبكة الأقسام الفرعية.
class _ContentPane extends StatelessWidget {
  final Category parent;
  final Future<void> Function() onRefresh;

  const _ContentPane({super.key, required this.parent, required this.onRefresh});

  void _openAll(BuildContext context) {
    context.push('/products?categoryId=${parent.id}&title=${Uri.encodeComponent(parent.name)}');
  }

  @override
  Widget build(BuildContext context) {
    final children = parent.children;

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: onRefresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 4, AppSpacing.md, 120),
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        children: [
          _CategoryHeroCard(parent: parent, onTap: () => _openAll(context)),
          const SizedBox(height: AppSpacing.xl),
          if (children.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 36),
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.primaryLight,
                    ),
                    child: const Icon(Icons.spa_outlined, size: 28, color: AppColors.primary),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'كل منتجات ${parent.name} في مكان واحد',
                    textAlign: TextAlign.center,
                    style: AppTypography.caption.copyWith(fontSize: 13),
                  ),
                ],
              ),
            )
          else ...[
            _SubcategoryGrid(children: children),
            for (final sub in children.where((c) => c.children.isNotEmpty)) ...[
              const SizedBox(height: AppSpacing.xxl),
              _TertiaryGroup(category: sub),
            ],
          ],
        ],
      ),
    );
  }
}

/// بطاقة القسم — اسم القسم وعدد فروعه وزر تصفح الكل.
class _CategoryHeroCard extends StatelessWidget {
  final Category parent;
  final VoidCallback onTap;

  const _CategoryHeroCard({required this.parent, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final subCount = parent.children.length;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(18),
            boxShadow: AppColors.elevatedShadow,
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        parent.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        subCount > 0 ? 'تسوّقي كل المنتجات · $subCount قسم فرعي' : 'تسوّقي كل المنتجات',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
                  ),
                  child: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 18),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// شبكة أقسام فرعية — صورة دائرية واسم. بسيطة وواضحة.
class _SubcategoryGrid extends StatelessWidget {
  final List<Category> children;

  const _SubcategoryGrid({required this.children});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: children.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 16,
        crossAxisSpacing: 10,
        childAspectRatio: 0.7,
      ),
      itemBuilder: (context, i) {
        final cat = children[i];
        return InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            context.push(
              '/products?subcategoryId=${cat.id}&title=${Uri.encodeComponent(cat.name)}',
            );
          },
          borderRadius: BorderRadius.circular(14),
          child: Column(
            children: [
              AspectRatio(
                aspectRatio: 1,
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.surface,
                    boxShadow: AppColors.cardShadow,
                    border: Border.all(color: AppColors.hairline, width: 0.8),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: cat.imageUrl.isNotEmpty
                      ? AppNetworkImage(url: cat.imageUrl, fit: BoxFit.cover)
                      : Center(
                          child: Text(
                            cat.icon ?? cat.name.characters.first,
                            style: const TextStyle(fontSize: 22, color: AppColors.primary),
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 7),
              Expanded(
                child: Text(
                  cat.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    height: 1.25,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// مجموعة أقسام ثانوية — بطاقة أنيقة: عنوان القسم الفرعي + صفوف بصور.
class _TertiaryGroup extends StatelessWidget {
  final Category category;

  const _TertiaryGroup({required this.category});

  @override
  Widget build(BuildContext context) {
    final items = category.children;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.hairline, width: 0.8),
        boxShadow: AppColors.cardShadow,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // رأس المجموعة
          InkWell(
            onTap: () => context.push(
              '/products?subcategoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
            ),
            child: Container(
              padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerRight,
                  end: Alignment.centerLeft,
                  colors: [AppColors.primaryLight, Colors.white],
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 3.5,
                    height: 16,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Text(
                      category.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w900),
                    ),
                  ),
                  const Text(
                    'الكل',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 2),
                  const Icon(Icons.chevron_left_rounded, size: 18, color: AppColors.primary),
                ],
              ),
            ),
          ),
          // صفوف الأقسام الثانوية
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 14),
                child: Divider(height: 1, thickness: 0.6, color: AppColors.divider),
              ),
            _TertiaryRow(category: items[i]),
          ],
        ],
      ),
    );
  }
}

class _TertiaryRow extends StatelessWidget {
  final Category category;

  const _TertiaryRow({required this.category});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        context.push(
          '/products?tertiaryCategoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFFF6F3F5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.hairline, width: 0.6),
              ),
              clipBehavior: Clip.antiAlias,
              child: category.imageUrl.isNotEmpty
                  ? AppNetworkImage(url: category.imageUrl, fit: BoxFit.cover)
                  : Center(
                      child: Text(
                        category.icon ?? category.name.characters.first,
                        style: const TextStyle(fontSize: 15, color: AppColors.primary),
                      ),
                    ),
            ),
            const SizedBox(width: 11),
            Expanded(
              child: Text(
                category.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            const Icon(Icons.chevron_left_rounded, size: 20, color: AppColors.textMuted),
          ],
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
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(AppSpacing.lg, 10, AppSpacing.lg, 12),
          child: ShimmerBox(height: 30, width: 110, radius: 8),
        ),
        Expanded(
          child: Row(
            textDirection: TextDirection.rtl,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                width: _kRailWidth,
                color: AppColors.surface,
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                child: Column(
                  children: List.generate(
                    6,
                    (_) => const Padding(
                      padding: EdgeInsets.only(bottom: 16),
                      child: ShimmerBox(height: 70, radius: 14),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  children: [
                    const ShimmerBox(height: 62, radius: 18),
                    const SizedBox(height: 22),
                    for (var r = 0; r < 3; r++) ...[
                      const Row(
                        children: [
                          Expanded(child: ShimmerBox(height: 110, radius: 14)),
                          SizedBox(width: 10),
                          Expanded(child: ShimmerBox(height: 110, radius: 14)),
                          SizedBox(width: 10),
                          Expanded(child: ShimmerBox(height: 110, radius: 14)),
                        ],
                      ),
                      const SizedBox(height: 14),
                    ],
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
