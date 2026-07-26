import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../catalog/catalog_providers.dart';
import '../home/widgets/home_scroll_perf.dart';
import 'widgets/categories_theme.dart';
import 'widgets/category_brands_strip.dart';
import 'widgets/category_visual_card.dart';
import 'widgets/subcategory_grid_cell.dart';

/// صفحة الأقسام — اكتشاف بصري مع تنقّل متدرّج.
class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  bool _didForceRefresh = false;
  bool _navForward = true;
  final _path = <Category>[];

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
    if (_path.isNotEmpty) {
      final id = _path.last.id;
      ref.invalidate(categoryBrandsProvider(id));
    }
  }

  void _push(Category category) {
    HapticFeedback.lightImpact();
    setState(() {
      _navForward = true;
      _path.add(category);
    });
  }

  void _pop() {
    if (_path.isEmpty) return;
    HapticFeedback.selectionClick();
    setState(() {
      _navForward = false;
      _path.removeLast();
    });
  }

  void _reset() => setState(() {
        _navForward = false;
        _path.clear();
      });

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(categoriesProvider);
    final s = ref.s;

    return PopScope(
      canPop: _path.isEmpty,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && _path.isNotEmpty) _pop();
      },
      child: Scaffold(
        backgroundColor: CategoriesTheme.canvas,
        body: cats.when(
          loading: () => const _CategoriesLoading(),
          error: (e, _) => SafeArea(
            child: ErrorView(
              message: friendlyError(e),
              onRetry: () => refreshCategories(ref),
            ),
          ),
          data: (list) {
            final parents = list.where((c) => c.parentId == null).toList(growable: false);
            if (parents.isEmpty) {
              return SafeArea(
                child: EmptyState(icon: Icons.grid_view_rounded, title: s.noCategories),
              );
            }

            return AnimatedSwitcher(
              duration: CategoriesTheme.transition,
              switchInCurve: CategoriesTheme.curveIn,
              switchOutCurve: CategoriesTheme.curveOut,
              layoutBuilder: (currentChild, previousChildren) {
                return Stack(
                  alignment: Alignment.topCenter,
                  fit: StackFit.expand,
                  children: [
                    ...previousChildren,
                    if (currentChild != null) currentChild,
                  ],
                );
              },
              transitionBuilder: (child, anim) => _CategoriesNavTransition(
                animation: anim,
                forward: _navForward,
                child: child,
              ),
              child: _path.isEmpty
                  ? _CategoriesRoot(
                      key: const ValueKey('root'),
                      parents: parents,
                      onRefresh: _onRefresh,
                      onSearch: () => context.push('/search'),
                      onOpen: _push,
                    )
                  : _CategoryExplorer(
                      key: ValueKey('explorer-${_path.last.id}'),
                      category: _path.last,
                      depth: _path.length,
                      onBack: _pop,
                      onRefresh: _onRefresh,
                      onSearch: () => context.push('/search'),
                      onOpenChild: _push,
                      onResetToRoot: _reset,
                    ),
            );
          },
        ),
      ),
    );
  }
}

// ─── Root grid ───────────────────────────────────────────────────────────────

class _CategoriesRoot extends ConsumerWidget {
  final List<Category> parents;
  final Future<void> Function() onRefresh;
  final VoidCallback onSearch;
  final ValueChanged<Category> onOpen;

  const _CategoriesRoot({
    super.key,
    required this.parents,
    required this.onRefresh,
    required this.onSearch,
    required this.onOpen,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final top = MediaQuery.paddingOf(context).top;

    return RefreshIndicator(
      color: AppColors.primary,
      edgeOffset: top + 8,
      onRefresh: onRefresh,
      child: CustomScrollView(
        physics: HomeScrollPerf.physics,
        cacheExtent: HomeScrollPerf.gridCacheExtent,
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(CategoriesTheme.pad, top + 8, CategoriesTheme.pad, 0),
              child: _CategoriesHeader(
                onSearch: onSearch,
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              CategoriesTheme.pad,
              8,
              CategoriesTheme.pad,
              110,
            ),
            sliver: SliverGrid(
              gridDelegate: CategoriesTheme.gridDelegate,
              delegate: SliverChildBuilderDelegate(
                (context, i) {
                  final cat = parents[i];
                  return CategoryVisualCard(
                    category: cat,
                    lang: lang,
                    onTap: () => onOpen(cat),
                  );
                },
                childCount: parents.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Explorer (parent or sub with children) ──────────────────────────────────

class _CategoryExplorer extends ConsumerStatefulWidget {
  final Category category;
  final int depth;
  final VoidCallback onBack;
  final Future<void> Function() onRefresh;
  final VoidCallback onSearch;
  final ValueChanged<Category> onOpenChild;
  final VoidCallback onResetToRoot;

  const _CategoryExplorer({
    super.key,
    required this.category,
    required this.depth,
    required this.onBack,
    required this.onRefresh,
    required this.onSearch,
    required this.onOpenChild,
    required this.onResetToRoot,
  });

  @override
  ConsumerState<_CategoryExplorer> createState() => _CategoryExplorerState();
}

class _CategoryExplorerState extends ConsumerState<_CategoryExplorer> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        0,
        duration: const Duration(milliseconds: 220),
        curve: CategoriesTheme.curve,
      );
    });
  }

  @override
  void didUpdateWidget(covariant _CategoryExplorer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.category.id != widget.category.id) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!_scroll.hasClients) return;
        _scroll.animateTo(
          0,
          duration: const Duration(milliseconds: 220),
          curve: CategoriesTheme.curve,
        );
      });
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _openProducts({Category? sub, Category? tertiary}) {
    final lang = ref.read(languageCodeProvider);
    final title = (tertiary ?? sub ?? widget.category).localizedName(lang);
    final q = StringBuffer('/products?title=${Uri.encodeComponent(title)}');

    if (tertiary != null) {
      q.write('&subcategoryId=${sub!.id}&tertiaryCategoryId=${tertiary.id}');
    } else if (sub != null) {
      q.write('&subcategoryId=${sub.id}');
    } else {
      q.write('&categoryId=${widget.category.id}');
    }
    context.push(q.toString());
  }

  List<Category> get _children => widget.category.children;

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;
    final top = MediaQuery.paddingOf(context).top;
    final brandsAsync = ref.watch(categoryBrandsProvider(widget.category.id));
    final children = _children;

    return RefreshIndicator(
      color: AppColors.primary,
      edgeOffset: top + 56,
      onRefresh: widget.onRefresh,
      child: CustomScrollView(
        controller: _scroll,
        physics: HomeScrollPerf.physics,
        cacheExtent: HomeScrollPerf.verticalCacheExtent,
        slivers: [
          SliverAppBar(
            pinned: true,
            elevation: 0,
            scrolledUnderElevation: 0,
            backgroundColor: CategoriesTheme.canvas,
            surfaceTintColor: Colors.transparent,
            leading: IconButton(
              onPressed: widget.onBack,
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
            ),
            title: Text(
              widget.category.localizedName(lang),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: CategoriesTheme.titleColor,
              ),
            ),
            actions: [
              IconButton(
                onPressed: widget.onSearch,
                icon: const Icon(Icons.search_rounded, size: 22),
              ),
              if (widget.depth > 1)
                IconButton(
                  onPressed: widget.onResetToRoot,
                  tooltip: s.categoriesHeader,
                  icon: const Icon(Icons.grid_view_rounded, size: 21),
                ),
            ],
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(CategoriesTheme.pad, 8, CategoriesTheme.pad, 12),
              child: _SearchBarHint(
                onTap: widget.onSearch,
                hint: s.categoriesSearchPlaceholder,
              ),
            ),
          ),
          if (_children.isNotEmpty) ...[
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(CategoriesTheme.pad, 0, CategoriesTheme.pad, 0),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, row) {
                    final leftIndex = row * 2;
                    final rightIndex = leftIndex + 1;
                    final left = children[leftIndex];
                    final right = rightIndex < children.length ? children[rightIndex] : null;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: CategoriesTheme.gap),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: SubcategoryGridCell(
                              subcategory: left,
                              lang: lang,
                              onOpenSub: () => _openProducts(sub: left),
                              onOpenTertiary: (t) => _openProducts(sub: left, tertiary: t),
                            ),
                          ),
                          const SizedBox(width: CategoriesTheme.gap),
                          Expanded(
                            child: right == null
                                ? const SizedBox.shrink()
                                : SubcategoryGridCell(
                                    subcategory: right,
                                    lang: lang,
                                    onOpenSub: () => _openProducts(sub: right),
                                    onOpenTertiary: (t) => _openProducts(sub: right, tertiary: t),
                                  ),
                          ),
                        ],
                      ),
                    );
                  },
                  childCount: (children.length + 1) ~/ 2,
                ),
              ),
            ),
          ] else
            SliverFillRemaining(
              hasScrollBody: false,
              child: _NoSubsEmpty(onBrowse: () => _openProducts()),
            ),
          _brandsSliver(brandsAsync, widget.category.id),
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
          padding: const EdgeInsets.only(top: 12),
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
            padding: const EdgeInsets.only(top: 12),
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

// ─── Shared widgets ────────────────────────────────────────────────────────────

class _CategoriesHeader extends ConsumerWidget {
  final VoidCallback onSearch;

  const _CategoriesHeader({required this.onSearch});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SearchBarHint(onTap: onSearch, hint: s.categoriesSearchPlaceholder),
        const SizedBox(height: 14),
        Row(
          children: [
            CategoryFilterChip(
              label: s.categoriesHeader,
              selected: true,
              onTap: () {},
            ),
          ],
        ),
      ],
    );
  }
}

class _SearchBarHint extends StatelessWidget {
  final VoidCallback onTap;
  final String hint;

  const _SearchBarHint({required this.onTap, required this.hint});

  @override
  Widget build(BuildContext context) {
    return CategoriesFramedSurface(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
        child: Row(
          children: [
            Icon(Icons.search, size: 20, color: AppColors.textMuted.withValues(alpha: 0.7)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                hint,
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.textMuted.withValues(alpha: 0.85),
                  fontWeight: FontWeight.w400,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? trailing;
  final VoidCallback? onTrailingTap;

  const _SectionTitle({
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTrailingTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: CategoriesTheme.pad),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, letterSpacing: -0.2),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: AppTypography.caption.copyWith(fontSize: 11.5),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null)
            TextButton(
              onPressed: onTrailingTap,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                trailing!,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary),
              ),
            ),
        ],
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
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
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
    final top = MediaQuery.paddingOf(context).top;
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(16, top + 16, 16, 0),
            child: const ShimmerBox(height: 28, width: 140, radius: 8),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          sliver: SliverGrid(
            gridDelegate: CategoriesTheme.gridDelegate,
            delegate: SliverChildBuilderDelegate(
              (_, __) => LayoutBuilder(
                builder: (context, constraints) => ShimmerBox(
                  width: constraints.maxWidth,
                  height: constraints.maxHeight,
                  radius: CategoriesTheme.cardRadius,
                ),
              ),
              childCount: 8,
            ),
          ),
        ),
      ],
    );
  }
}

class _CategoriesNavTransition extends StatelessWidget {
  final Animation<double> animation;
  final bool forward;
  final Widget child;

  const _CategoriesNavTransition({
    required this.animation,
    required this.forward,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final isRtl = Directionality.of(context) == TextDirection.rtl;
    final dx = forward ? (isRtl ? -1.0 : 1.0) : (isRtl ? 1.0 : -1.0);
    final curved = CurvedAnimation(
      parent: animation,
      curve: CategoriesTheme.curveIn,
      reverseCurve: CategoriesTheme.curveOut,
    );
    return SlideTransition(
      position: Tween<Offset>(
        begin: Offset(dx * 0.11, 0.012),
        end: Offset.zero,
      ).animate(curved),
      child: FadeTransition(
        opacity: Tween<double>(begin: 0.88, end: 1).animate(curved),
        child: child,
      ),
    );
  }
}
