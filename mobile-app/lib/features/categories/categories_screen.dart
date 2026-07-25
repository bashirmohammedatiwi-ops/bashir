import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
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
    final s = ref.s;

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
            return SafeArea(
              child: EmptyState(icon: Icons.grid_view_rounded, title: s.noCategories),
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
  int _slideDirection = 1;
  final _railScroll = ScrollController();

  @override
  void dispose() {
    _railScroll.dispose();
    super.dispose();
  }

  void _selectParent(int index) {
    if (index == _selected) return;
    _slideDirection = index > _selected ? 1 : -1;
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
                      duration: const Duration(milliseconds: 240),
                      switchInCurve: Curves.easeOutCubic,
                      switchOutCurve: Curves.easeInCubic,
                      layoutBuilder: (current, _) => current ?? const SizedBox.shrink(),
                      transitionBuilder: (child, anim) {
                        final slide = Tween<Offset>(
                          begin: Offset(_slideDirection * 0.05, 0),
                          end: Offset.zero,
                        ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOutCubic));
                        return FadeTransition(
                          opacity: anim,
                          child: SlideTransition(position: slide, child: child),
                        );
                      },
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

class _TopBar extends ConsumerWidget {
  final VoidCallback onSearch;

  const _TopBar({required this.onSearch});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 4, AppSpacing.lg, 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  s.categoriesHeader,
                  style: AppTypography.sectionTitle.copyWith(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  s.categoriesBrowseHint,
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
                    Text(s.searchShort, style: AppTypography.caption.copyWith(fontSize: 12.5)),
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
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
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

class _RailTile extends ConsumerWidget {
  final Category category;
  final bool active;
  final VoidCallback onTap;

  const _RailTile({
    super.key,
    required this.category,
    required this.active,
    required this.onTap,
  });

  static const _iconSize = 46.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    return RepaintBoundary(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: AnimatedContainer(
            duration: _CatPerf.railAnimDuration,
            curve: Curves.easeOutCubic,
            height: _kRailItemHeight,
            decoration: BoxDecoration(
              color: active ? _CatPalette.tileActive : Colors.transparent,
              borderRadius: BorderRadius.circular(16),
              border: active ? Border.all(color: AppColors.primarySoft, width: 0.8) : null,
            ),
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                if (active)
                  PositionedDirectional(
                    start: 2,
                    top: 14,
                    bottom: 14,
                    child: Container(
                      width: 3,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
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
                            width: _iconSize,
                            height: _iconSize,
                            child: Center(
                              child: _CatImage(
                                category: category,
                                lang: lang,
                                fallbackSize: 16,
                                size: _iconSize,
                                fit: BoxFit.contain,
                                padded: true,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        category.localizedName(lang),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 9.5,
                          height: 1.15,
                          fontWeight: active ? FontWeight.w800 : FontWeight.w500,
                          color: active ? AppColors.primaryDark : AppColors.textMuted,
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

// ─── Body ─────────────────────────────────────────────────────────────────────

class _CategoryBody extends ConsumerStatefulWidget {
  final Category parent;
  final Future<void> Function() onRefresh;

  const _CategoryBody({super.key, required this.parent, required this.onRefresh});

  @override
  ConsumerState<_CategoryBody> createState() => _CategoryBodyState();
}

class _CategoryBodyState extends ConsumerState<_CategoryBody> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToTop(animated: false));
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToTop({bool animated = true}) {
    if (!_scroll.hasClients) return;
    if (animated) {
      _scroll.animateTo(
        0,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
      );
    } else {
      _scroll.jumpTo(0);
    }
  }

  void _openAll() {
    final lang = ref.read(languageCodeProvider);
    context.push(
      '/products?categoryId=${widget.parent.id}&title=${Uri.encodeComponent(widget.parent.localizedName(lang))}',
    );
  }

  void _openSub(Category sub) {
    final lang = ref.read(languageCodeProvider);
    context.push(
      '/products?subcategoryId=${sub.id}&title=${Uri.encodeComponent(sub.localizedName(lang))}',
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(languageCodeProvider);
    final subs = widget.parent.children;
    final detailed = subs.where((c) => c.children.isNotEmpty).toList(growable: false);
    final brandsAsync = ref.watch(categoryBrandsProvider(widget.parent.id));

    return RefreshIndicator(
      color: AppColors.primary,
      edgeOffset: 8,
      onRefresh: () async {
          ref.invalidate(categoryBrandsProvider(widget.parent.id));
          await widget.onRefresh();
        },
        child: CustomScrollView(
          controller: _scroll,
          physics: _CatPerf.scrollPhysics,
          cacheExtent: _CatPerf.bodyCacheExtent,
          slivers: [
            SliverToBoxAdapter(
              child: _HeroBanner(
                parent: widget.parent,
                subCount: subs.length,
                onBrowseAll: _openAll,
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
                child: _SubcategoryGrid(
                  subs: subs,
                  onOpenAll: _openAll,
                  onOpenSub: _openSub,
                ),
              ),
              _brandsSliver(brandsAsync, widget.parent.id),
              if (detailed.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(14, 16, 14, 4),
                    child: _SectionTitle(
                      title: ref.s.tertiaryCategory,
                      subtitle: ref.s.groupCount(detailed.length),
                    ),
                  ),
                ),
              if (detailed.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
                  sliver: SliverList.separated(
                    itemCount: detailed.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _DetailBlock(
                      key: ValueKey(detailed[i].id),
                      category: detailed[i],
                      onOpenSub: _openSub,
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
    final s = ref.s;
    return SliverToBoxAdapter(
      child: brandsAsync.when(
        loading: () => Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _SectionTitle(title: s.sectionBrands),
              const CategoryBrandsStripLoading(),
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
                  title: s.sectionBrands,
                  subtitle: s.brandCountLabel(brands.length),
                  trailing: brands.length > 6 ? s.swipeForMore : null,
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

class _HeroBanner extends ConsumerWidget {
  final Category parent;
  final int subCount;
  final VoidCallback onBrowseAll;

  const _HeroBanner({
    required this.parent,
    required this.subCount,
    required this.onBrowseAll,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 4),
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: AppColors.luxuryGradient,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.primarySoft.withValues(alpha: 0.6)),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onBrowseAll,
            borderRadius: BorderRadius.circular(20),
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
                        lang: lang,
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
                          parent.localizedName(lang),
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
                          subCount > 0
                              ? s.subcategoryCount(subCount)
                              : s.allSectionProducts,
                          style: AppTypography.caption.copyWith(fontSize: 11.5),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 16,
                    color: AppColors.primaryDark.withValues(alpha: 0.55),
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

class _SubcategoryGrid extends ConsumerWidget {
  final List<Category> subs;
  final VoidCallback onOpenAll;
  final ValueChanged<Category> onOpenSub;

  const _SubcategoryGrid({
    required this.subs,
    required this.onOpenAll,
    required this.onOpenSub,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 0),
          child: _SectionTitle(
            title: s.subcategories,
            subtitle: s.tapNameToOpenProducts,
          ),
        ),
        _CircleScroller(
          slotCount: subs.length + 1,
          singleRowMax: 5,
          slotBuilder: (slot) {
            if (slot == 0) {
              return _CircleCategoryTile(
                label: s.all,
                icon: Icons.apps_rounded,
                onTap: onOpenAll,
              );
            }
            final sub = subs[slot - 1];
            return _CircleCategoryTile(
              label: sub.localizedName(lang),
              category: sub,
              lang: lang,
              onTap: () => onOpenSub(sub),
            );
          },
        ),
      ],
    );
  }
}

/// تمرير أفقي بدوائر — صف واحد عند القلة، صفّان عند الكثرة.
class _CircleScroller extends StatelessWidget {
  final int slotCount;
  final Widget Function(int slot) slotBuilder;
  final int singleRowMax;
  final bool compact;

  const _CircleScroller({
    required this.slotCount,
    required this.slotBuilder,
    this.singleRowMax = 4,
    this.compact = false,
  });

  int get _rows => slotCount <= singleRowMax ? 1 : 2;

  double get _tileHeight =>
      compact ? _CircleCategoryTile.compactTileHeight : _CircleCategoryTile.tileHeight;

  double get _height => _tileHeight * _rows + (_rows == 1 ? 12 : 20);

  @override
  Widget build(BuildContext context) {
    if (_rows == 1) {
      return SizedBox(
        height: _height,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          physics: _CatPerf.scrollPhysics,
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
          itemCount: slotCount,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (_, i) => slotBuilder(i),
        ),
      );
    }

    final columnCount = (slotCount + 1) ~/ 2;

    return SizedBox(
      height: _height,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: _CatPerf.scrollPhysics,
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
        itemCount: columnCount,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, col) {
          return SizedBox(
            width: _CircleCategoryTile.tileWidth,
            child: Column(
              children: [
                _slotOrEmpty(col * 2),
                const SizedBox(height: 10),
                _slotOrEmpty(col * 2 + 1),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _slotOrEmpty(int slot) {
    if (slot >= slotCount) {
      return SizedBox(height: _tileHeight);
    }
    return slotBuilder(slot);
  }
}

class _CircleCategoryTile extends StatelessWidget {
  final String label;
  final Category? category;
  final String? lang;
  final IconData? icon;
  final VoidCallback onTap;
  final bool compact;

  const _CircleCategoryTile({
    required this.label,
    required this.onTap,
    this.category,
    this.lang,
    this.icon,
    this.compact = false,
  });

  static const circleSize = 60.0;
  static const compactCircleSize = 52.0;
  static const tileWidth = 78.0;
  static const tileHeight = 96.0;
  static const compactTileHeight = 84.0;

  double get _circle => compact ? compactCircleSize : circleSize;
  double get _width => tileWidth;
  double get _height => compact ? compactTileHeight : tileHeight;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _width,
      height: _height,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          borderRadius: BorderRadius.circular(14),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: _circle,
                height: _circle,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _CatPalette.surface,
                  border: Border.all(
                    color: icon != null
                        ? AppColors.primary.withValues(alpha: 0.35)
                        : AppColors.hairline,
                    width: icon != null ? 1.6 : 1.1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.ink.withValues(alpha: 0.06),
                      blurRadius: compact ? 6 : 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: icon != null
                      ? ColoredBox(
                          color: AppColors.primaryLight,
                          child: Center(
                            child: Icon(icon, color: AppColors.primary, size: compact ? 22 : 26),
                          ),
                        )
                      : Center(
                          child: _CatImage(
                            category: category!,
                            lang: lang!,
                            fallbackSize: compact ? 16 : 18,
                            size: _circle,
                            fit: BoxFit.cover,
                            padded: true,
                          ),
                        ),
                ),
              ),
              SizedBox(height: compact ? 5 : 7),
              Text(
                label,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: compact ? 10 : 10.5,
                  height: 1.15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
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

class _DetailBlock extends ConsumerWidget {
  final Category category;
  final ValueChanged<Category> onOpenSub;

  const _DetailBlock({
    super.key,
    required this.category,
    required this.onOpenSub,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;
    final items = category.children;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: _CatPalette.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.hairline.withValues(alpha: 0.75)),
        boxShadow: [
          BoxShadow(
            color: AppColors.ink.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                HapticFeedback.selectionClick();
                onOpenSub(category);
              },
              borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 14, 12, 12),
                child: Row(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.primarySoft, width: 1.2),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.08),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: _CatImage(
                          category: category,
                          lang: lang,
                          fallbackSize: 16,
                          size: 50,
                          fit: BoxFit.cover,
                          padded: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            category.localizedName(lang),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.2,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            items.isNotEmpty
                                ? s.childGroupCount(items.length)
                                : s.viewAllProducts,
                            style: AppTypography.caption.copyWith(fontSize: 11.5),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            s.viewAll,
                            style: const TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primaryDark,
                            ),
                          ),
                          const SizedBox(width: 2),
                          Icon(
                            Icons.arrow_forward_ios_rounded,
                            size: 10,
                            color: AppColors.primaryDark.withValues(alpha: 0.75),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (items.isNotEmpty) ...[
            Divider(height: 1, color: AppColors.hairline.withValues(alpha: 0.7)),
            _CircleScroller(
              slotCount: items.length,
              singleRowMax: items.length <= 3 ? items.length : 4,
              compact: items.length <= 3,
              slotBuilder: (slot) {
                final item = items[slot];
                return _CircleCategoryTile(
                  label: item.localizedName(lang),
                  category: item,
                  lang: lang,
                  compact: items.length <= 3,
                  onTap: () {
                    context.push(
                      '/products?subcategoryId=${category.id}&tertiaryCategoryId=${item.id}&title=${Uri.encodeComponent(item.localizedName(lang))}',
                    );
                  },
                );
              },
            ),
          ],
        ],
      ),
    );
  }
}

class _CatImage extends StatelessWidget {
  final Category category;
  final String lang;
  final double fallbackSize;
  final double? size;
  final BoxFit fit;
  final bool padded;

  const _CatImage({
    required this.category,
    required this.lang,
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
          category.icon ?? category.localizedName(lang).characters.first,
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

class _NoSubsEmpty extends ConsumerWidget {
  final VoidCallback onBrowse;

  const _NoSubsEmpty({required this.onBrowse});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.inventory_2_outlined, size: 40, color: AppColors.textMuted.withValues(alpha: 0.45)),
            const SizedBox(height: 12),
            Text(s.noSubcategories, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(s.browseAllProductsDirect, style: AppTypography.caption),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: onBrowse,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.pill)),
              ),
              child: Text(s.viewProducts),
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
