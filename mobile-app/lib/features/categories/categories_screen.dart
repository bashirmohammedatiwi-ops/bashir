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
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../catalog/catalog_providers.dart';
import '../home/widgets/home_scroll_perf.dart';
import 'widgets/category_brands_strip.dart';

const double _kRailWidth = 88;
const double _kRailItemHeight = 92;

/// ألوان الصفحة.
abstract final class _CatPalette {
  static const canvas = Color(0xFFF8F5F6);
  static const railBg = Color(0xFFFFFFFF);
  static const panelBg = Color(0xFFFFFFFF);
  static const surface = Color(0xFFFFFFFF);
  static const wash = Color(0xFFFFF8FA);
  static const chipBg = Color(0xFFF3F0F1);
  static const tileBg = Color(0xFFF8F6F7);
  static const tileActive = Color(0xFFFFF5F8);
}

abstract final class _CatPerf {
  static const switchDuration = Duration(milliseconds: 200);
  static const railAnimDuration = Duration(milliseconds: 160);
  static const railCacheExtent = 240.0;
  static const bodyCacheExtent = 560.0;
  static ScrollPhysics get scrollPhysics => HomeScrollPerf.physics;
}

/// صفحة الأقسام — شريط جانبي + محتوى محسّن.
class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  bool _didForceRefresh = false;

  @override
  void initState() {
    super.initState();
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

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: _CatPalette.canvas,
      body: cats.when(
        loading: () => const _CategoriesLoading(),
        error: (e, _) => SafeArea(
          child: ErrorView(
            message: friendlyError(e),
            onRetry: () => refreshCategories(ref),
          ),
        ),
        data: (list) {
          final parents = _parentCategories(list);
          if (parents.isEmpty) {
            return const SafeArea(
              child: EmptyState(icon: Icons.grid_view_rounded, title: 'لا توجد أقسام'),
            );
          }

          return _CategoriesLayout(
            parents: parents,
            onRefresh: _onRefresh,
            onSearch: () => context.push('/search'),
          );
        },
      ),
    );
  }
}

List<Category> _parentCategories(List<Category> list) {
  return list.where((c) => c.parentId == null).toList(growable: false);
}

// ─── Layout + rail ────────────────────────────────────────────────────────────

class _CategoriesLayout extends StatefulWidget {
  final List<Category> parents;
  final Future<void> Function() onRefresh;
  final VoidCallback onSearch;

  const _CategoriesLayout({
    required this.parents,
    required this.onRefresh,
    required this.onSearch,
  });

  @override
  State<_CategoriesLayout> createState() => _CategoriesLayoutState();
}

class _CategoriesLayoutState extends State<_CategoriesLayout> {
  int _selected = 0;
  final _railScroll = ScrollController();

  @override
  void dispose() {
    _railScroll.dispose();
    super.dispose();
  }

  void _selectParent(int index) {
    if (index == _selected) return;
    HapticFeedback.selectionClick();
    setState(() => _selected = index);
    _revealRailItem(index);
  }

  void _revealRailItem(int index) {
    if (!_railScroll.hasClients) return;
    final viewport = _railScroll.position.viewportDimension;
    final target = (index * _kRailItemHeight) - (viewport - _kRailItemHeight) / 2;
    _railScroll.animateTo(
      target.clamp(0.0, _railScroll.position.maxScrollExtent),
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final safeIndex = _selected.clamp(0, widget.parents.length - 1);
    final selected = widget.parents[safeIndex];

    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          _TopBar(onSearch: widget.onSearch),
          Expanded(
            child: Row(
              textDirection: TextDirection.rtl,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _CategoryRail(
                  controller: _railScroll,
                  parents: widget.parents,
                  selected: safeIndex,
                  onTap: _selectParent,
                ),
                Expanded(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: _CatPalette.panelBg,
                      borderRadius: const BorderRadius.horizontal(left: Radius.circular(26)),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.ink.withValues(alpha: 0.04),
                          blurRadius: 16,
                          offset: const Offset(-2, 0),
                        ),
                      ],
                    ),
                    child: AnimatedSwitcher(
                      duration: _CatPerf.switchDuration,
                      switchInCurve: Curves.easeOut,
                      switchOutCurve: Curves.easeIn,
                      layoutBuilder: (current, _) => current ?? const SizedBox.shrink(),
                      transitionBuilder: (child, anim) => FadeTransition(
                        opacity: anim.drive(CurveTween(curve: Curves.easeOut)),
                        child: child,
                      ),
                      child: _CategoryBody(
                        key: ValueKey(selected.id),
                        parent: selected,
                        onRefresh: widget.onRefresh,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  final VoidCallback onSearch;

  const _TopBar({required this.onSearch});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 4, AppSpacing.lg, 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'الأقسام',
                  style: AppTypography.sectionTitle.copyWith(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'اختاري من الشريط · تصفّحي البراندات',
                  style: AppTypography.caption.copyWith(fontSize: 11.5),
                ),
              ],
            ),
          ),
          Material(
            color: _CatPalette.surface,
            borderRadius: BorderRadius.circular(14),
            child: InkWell(
              onTap: onSearch,
              borderRadius: BorderRadius.circular(14),
              child: Ink(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.hairline),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.search_rounded, size: 18, color: AppColors.textMuted.withValues(alpha: 0.9)),
                    const SizedBox(width: 6),
                    Text('بحث', style: AppTypography.caption.copyWith(fontSize: 12.5)),
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

class _CategoryRail extends StatelessWidget {
  final ScrollController controller;
  final List<Category> parents;
  final int selected;
  final ValueChanged<int> onTap;

  const _CategoryRail({
    required this.controller,
    required this.parents,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: _CatPalette.railBg,
      child: SizedBox(
        width: _kRailWidth,
        child: ListView.builder(
          controller: controller,
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
          cacheExtent: _CatPerf.railCacheExtent,
          addAutomaticKeepAlives: false,
          addRepaintBoundaries: true,
          itemCount: parents.length,
          itemExtent: _kRailItemHeight,
          itemBuilder: (_, i) => _RailTile(
            key: ValueKey(parents[i].id),
            category: parents[i],
            active: i == selected,
            onTap: () => onTap(i),
          ),
        ),
      ),
    );
  }
}

class _RailTile extends StatelessWidget {
  final Category category;
  final bool active;
  final VoidCallback onTap;

  const _RailTile({
    super.key,
    required this.category,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(16),
            child: AnimatedContainer(
              duration: _CatPerf.railAnimDuration,
              curve: Curves.easeOutCubic,
              decoration: BoxDecoration(
                color: active ? _CatPalette.tileActive : Colors.transparent,
                borderRadius: BorderRadius.circular(16),
                border: active ? Border.all(color: AppColors.primarySoft, width: 0.8) : null,
              ),
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  if (active)
                    Positioned(
                      left: -4,
                      top: 10,
                      bottom: 10,
                      child: Container(
                        width: 3,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                    ),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      DecoratedBox(
                        decoration: BoxDecoration(
                          color: active ? AppColors.surface : _CatPalette.tileBg,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: active
                                ? AppColors.primary.withValues(alpha: 0.25)
                                : AppColors.hairline.withValues(alpha: 0.7),
                            width: active ? 1.2 : 0.8,
                          ),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(13),
                          child: SizedBox(
                            width: 48,
                            height: 48,
                            child: _CatImage(
                              category: category,
                              fallbackSize: 17,
                              size: 48,
                              fit: BoxFit.contain,
                              padded: true,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        category.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 9.5,
                          height: 1.2,
                          fontWeight: active ? FontWeight.w800 : FontWeight.w500,
                          color: active ? AppColors.primaryDark : AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Body ─────────────────────────────────────────────────────────────────────

class _CategoryBody extends ConsumerStatefulWidget {
  final Category parent;
  final Future<void> Function() onRefresh;

  const _CategoryBody({super.key, required this.parent, required this.onRefresh});

  @override
  ConsumerState<_CategoryBody> createState() => _CategoryBodyState();
}

class _CategoryBodyState extends ConsumerState<_CategoryBody> {
  String? _selectedSubId;

  @override
  void didUpdateWidget(covariant _CategoryBody oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.parent.id != widget.parent.id) _selectedSubId = null;
  }

  Category? get _selectedSub {
    if (_selectedSubId == null) return null;
    for (final s in widget.parent.children) {
      if (s.id == _selectedSubId) return s;
    }
    return null;
  }

  void _openAll() {
    context.push(
      '/products?categoryId=${widget.parent.id}&title=${Uri.encodeComponent(widget.parent.name)}',
    );
  }

  void _openSub(Category sub) {
    context.push(
      '/products?subcategoryId=${sub.id}&title=${Uri.encodeComponent(sub.name)}',
    );
  }

  void _selectSub(String? id) {
    HapticFeedback.selectionClick();
    setState(() => _selectedSubId = id);
  }

  @override
  Widget build(BuildContext context) {
    final subs = widget.parent.children;
    final detailed = subs.where((c) => c.children.isNotEmpty).toList(growable: false);
    final selectedSub = _selectedSub;
    final brandsAsync = ref.watch(categoryBrandsProvider(widget.parent.id));

    return RefreshIndicator(
      color: AppColors.primary,
      edgeOffset: 8,
      onRefresh: () async {
          ref.invalidate(categoryBrandsProvider(widget.parent.id));
          await widget.onRefresh();
        },
        child: CustomScrollView(
          key: PageStorageKey<String>('cat_body_${widget.parent.id}'),
          physics: _CatPerf.scrollPhysics,
          cacheExtent: _CatPerf.bodyCacheExtent,
          slivers: [
            SliverToBoxAdapter(
              child: _HeroBanner(
                parent: widget.parent,
                subCount: subs.length,
                selectedSub: selectedSub,
                onBrowseAll: _openAll,
                onBrowseSub: selectedSub != null ? () => _openSub(selectedSub) : null,
              ),
            ),
            if (subs.isEmpty) ...[
              SliverFillRemaining(
                hasScrollBody: false,
                child: _NoSubsEmpty(onBrowse: _openAll),
              ),
              _brandsSliver(brandsAsync, widget.parent.id),
            ] else ...[
              SliverToBoxAdapter(
                child: _SubcategoryStrip(
                  subs: subs,
                  selectedId: _selectedSubId,
                  onSelect: _selectSub,
                  onOpen: _openSub,
                ),
              ),
              _brandsSliver(brandsAsync, widget.parent.id),
              if (detailed.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(14, 16, 14, 8),
                    child: _SectionTitle(
                      title: 'تصفّح بالتفصيل',
                      subtitle: '${detailed.length} مجموعة',
                    ),
                  ),
                ),
              if (detailed.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(14, 0, 14, 0),
                  sliver: SliverList.separated(
                    itemCount: detailed.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _DetailBlock(
                      key: ValueKey(detailed[i].id),
                      category: detailed[i],
                    ),
                  ),
                ),
            ],
            const SliverToBoxAdapter(child: SizedBox(height: 110)),
          ],
        ),
      );
  }

  Widget _brandsSliver(AsyncValue<List<Brand>> brandsAsync, String categoryId) {
    return SliverToBoxAdapter(
      child: brandsAsync.when(
        loading: () => const Padding(
          padding: EdgeInsets.only(top: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _SectionTitle(title: 'براندات القسم'),
              CategoryBrandsStripLoading(),
            ],
          ),
        ),
        error: (_, __) => const SizedBox.shrink(),
        data: (brands) {
          if (brands.isEmpty) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _SectionTitle(
                  title: 'براندات القسم',
                  subtitle: '${brands.length} براند',
                  trailing: brands.length > 6 ? 'مرّري للمزيد' : null,
                ),
                CategoryBrandsStrip(
                  brands: brands,
                  categoryId: categoryId,
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _HeroBanner extends StatelessWidget {
  final Category parent;
  final int subCount;
  final Category? selectedSub;
  final VoidCallback onBrowseAll;
  final VoidCallback? onBrowseSub;

  const _HeroBanner({
    required this.parent,
    required this.subCount,
    required this.selectedSub,
    required this.onBrowseAll,
    this.onBrowseSub,
  });

  @override
  Widget build(BuildContext context) {
    final showSubCta = selectedSub != null && onBrowseSub != null;

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 4),
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: AppColors.luxuryGradient,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.primarySoft.withValues(alpha: 0.6)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: SizedBox(
                  width: 52,
                  height: 52,
                  child: _CatImage(
                    category: parent,
                    fallbackSize: 18,
                    size: 52,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      selectedSub?.name ?? parent.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      showSubCta
                          ? 'منتجات ${selectedSub!.name}'
                          : subCount > 0
                              ? '$subCount قسم فرعي'
                              : 'كل منتجات القسم',
                      style: AppTypography.caption.copyWith(fontSize: 11.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                children: [
                  _HeroButton(
                    label: 'الكل',
                    filled: true,
                    onTap: onBrowseAll,
                  ),
                  if (showSubCta) ...[
                    const SizedBox(height: 6),
                    _HeroButton(
                      label: 'منتجات',
                      filled: false,
                      onTap: onBrowseSub!,
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroButton extends StatelessWidget {
  final String label;
  final bool filled;
  final VoidCallback onTap;

  const _HeroButton({
    required this.label,
    required this.filled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: filled ? AppColors.primary : Colors.white.withValues(alpha: 0.85),
      borderRadius: BorderRadius.circular(99),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(99),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              color: filled ? Colors.white : AppColors.primaryDark,
            ),
          ),
        ),
      ),
    );
  }
}

class _SubcategoryStrip extends StatelessWidget {
  final List<Category> subs;
  final String? selectedId;
  final ValueChanged<String?> onSelect;
  final ValueChanged<Category> onOpen;

  const _SubcategoryStrip({
    required this.subs,
    required this.selectedId,
    required this.onSelect,
    required this.onOpen,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 0),
          child: _SectionTitle(
            title: 'الأقسام الفرعية',
            subtitle: 'اضغطي الاسم لفتح المنتجات',
          ),
        ),
        SizedBox(
          height: 108,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: _CatPerf.scrollPhysics,
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
            itemCount: subs.length + 1,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) {
              if (i == 0) {
                return _SubChip(
                  label: 'الكل',
                  selected: selectedId == null,
                  icon: Icons.apps_rounded,
                  onCircleTap: () => onSelect(null),
                );
              }
              final sub = subs[i - 1];
              return _SubChip(
                label: sub.name,
                selected: selectedId == sub.id,
                category: sub,
                onCircleTap: () => onSelect(sub.id),
                onLabelTap: () => onOpen(sub),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _SubChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Category? category;
  final IconData? icon;
  final VoidCallback onCircleTap;
  final VoidCallback? onLabelTap;

  const _SubChip({
    required this.label,
    required this.selected,
    required this.onCircleTap,
    this.category,
    this.icon,
    this.onLabelTap,
  });

  static const _size = 56.0;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 72,
      child: Column(
        children: [
          GestureDetector(
            onTap: onCircleTap,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: _size,
              height: _size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected
                    ? (icon != null ? AppColors.primary : AppColors.primaryLight)
                    : _CatPalette.chipBg,
                border: Border.all(
                  color: selected ? AppColors.primary : AppColors.hairline,
                  width: selected ? 2 : 1,
                ),
              ),
              child: ClipOval(
                child: icon != null
                    ? Icon(icon, color: selected ? Colors.white : AppColors.textMuted, size: 22)
                    : Padding(
                        padding: const EdgeInsets.all(5),
                        child: _CatImage(
                          category: category!,
                          fallbackSize: 16,
                          size: _size - 10,
                          fit: BoxFit.contain,
                          padded: true,
                        ),
                      ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          GestureDetector(
            onTap: onLabelTap ?? onCircleTap,
            child: Text(
              label,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                height: 1.15,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                color: selected ? AppColors.primaryDark : AppColors.textSecondary,
                decoration: onLabelTap != null ? TextDecoration.underline : null,
                decorationColor: AppColors.primary.withValues(alpha: 0.35),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? trailing;

  const _SectionTitle({required this.title, this.subtitle, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.2,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!, style: AppTypography.caption.copyWith(fontSize: 11)),
                ],
              ],
            ),
          ),
          if (trailing != null)
            Text(trailing!, style: AppTypography.caption.copyWith(fontSize: 11)),
        ],
      ),
    );
  }
}

class _DetailBlock extends StatelessWidget {
  final Category category;

  const _DetailBlock({super.key, required this.category});

  @override
  Widget build(BuildContext context) {
    final items = category.children;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: _CatPalette.chipBg.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            InkWell(
              onTap: () => context.push(
                '/products?subcategoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
              ),
              borderRadius: BorderRadius.circular(10),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: SizedBox(
                        width: 32,
                        height: 32,
                        child: _CatImage(
                          category: category,
                          fallbackSize: 12,
                          size: 32,
                          fit: BoxFit.contain,
                          padded: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        category.name,
                        style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800),
                      ),
                    ),
                    Icon(Icons.arrow_back_ios_new_rounded, size: 12, color: AppColors.primary.withValues(alpha: 0.7)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final item in items)
                  _TertiaryChip(
                    category: item,
                    subcategoryId: category.id,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TertiaryChip extends StatelessWidget {
  final Category category;
  final String subcategoryId;

  const _TertiaryChip({required this.category, required this.subcategoryId});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: _CatPalette.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          context.push(
            '/products?subcategoryId=$subcategoryId&tertiaryCategoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: _CatImage(
                    category: category,
                    fallbackSize: 10,
                    size: 24,
                    fit: BoxFit.contain,
                    padded: true,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 120),
                child: Text(
                  category.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CatImage extends StatelessWidget {
  final Category category;
  final double fallbackSize;
  final double? size;
  final BoxFit fit;
  final bool padded;

  const _CatImage({
    required this.category,
    required this.fallbackSize,
    this.size,
    this.fit = BoxFit.cover,
    this.padded = false,
  });

  @override
  Widget build(BuildContext context) {
    if (category.imageUrl.isNotEmpty) {
      final image = AppNetworkImage(
        url: category.imageUrl,
        width: size,
        height: size,
        fit: fit,
        backgroundColor: padded ? Colors.white : null,
      );
      if (!padded) return image;
      return ColoredBox(
        color: Colors.white,
        child: Padding(
          padding: EdgeInsets.all((size ?? 40) * 0.08),
          child: image,
        ),
      );
    }
    return ColoredBox(
      color: _CatPalette.wash,
      child: Center(
        child: Text(
          category.icon ?? category.name.characters.first,
          style: TextStyle(
            fontSize: fallbackSize,
            fontWeight: FontWeight.w800,
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }
}

class _NoSubsEmpty extends StatelessWidget {
  final VoidCallback onBrowse;

  const _NoSubsEmpty({required this.onBrowse});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.inventory_2_outlined, size: 40, color: AppColors.textMuted.withValues(alpha: 0.45)),
            const SizedBox(height: 12),
            const Text('لا أقسام فرعية', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('تصفّحي كل المنتجات مباشرة', style: AppTypography.caption),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: onBrowse,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.pill)),
              ),
              child: const Text('عرض المنتجات'),
            ),
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
    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(AppSpacing.lg, 4, AppSpacing.lg, 10),
            child: Row(
              children: [
                Expanded(child: ShimmerBox(height: 28, width: 100, radius: 8)),
                ShimmerBox(height: 40, width: 72, radius: 14),
              ],
            ),
          ),
          Expanded(
            child: Row(
              textDirection: TextDirection.rtl,
              children: [
                Container(
                  width: _kRailWidth,
                  color: _CatPalette.railBg,
                  padding: const EdgeInsets.all(6),
                  child: Column(
                    children: List.generate(
                      5,
                      (_) => const Padding(
                        padding: EdgeInsets.only(bottom: 8),
                        child: ShimmerBox(height: 76, radius: 16),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: DecoratedBox(
                    decoration: const BoxDecoration(
                      color: _CatPalette.panelBg,
                      borderRadius: BorderRadius.horizontal(left: Radius.circular(26)),
                    ),
                    child: ListView(
                      physics: _CatPerf.scrollPhysics,
                      padding: const EdgeInsets.all(14),
                      children: const [
                        ShimmerBox(height: 84, radius: 18),
                        SizedBox(height: 18),
                        ShimmerBox(height: 12, width: 90, radius: 6),
                        SizedBox(height: 12),
                        Row(
                          children: [
                            ShimmerBox(height: 68, width: 68, radius: 34),
                            SizedBox(width: 10),
                            ShimmerBox(height: 68, width: 68, radius: 34),
                            SizedBox(width: 10),
                            ShimmerBox(height: 68, width: 68, radius: 34),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
