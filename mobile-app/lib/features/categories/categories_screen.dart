import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/states.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../catalog/catalog_providers.dart';
import '../worlds/worlds_home_band.dart';
import '../worlds/worlds_provider.dart';
import '../home/widgets/home_scroll_perf.dart';
import '../worlds/world_theme.dart';
import 'widgets/category_brands_strip.dart';
import 'widgets/category_line_art.dart';

/// صفحة الأقسام — قائمة رئيسية ثابتة ومحتوى فرعي واضح لكل عالم.
class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  String? _selectedParentId;
  final _expandedSubs = <String>{};

  Future<void> _onRefresh() async {
    HapticFeedback.mediumImpact();
    try {
      await refreshCategories(ref);
    } catch (_) {
      ref.invalidate(categoriesProvider);
    }
    if (_selectedParentId != null) {
      ref.invalidate(categoryBrandsProvider(_selectedParentId!));
    }
    final slug = ref.read(selectedWorldSlugProvider);
    if (slug != null) ref.invalidate(worldDetailProvider(slug));
  }

  void _selectParent(String id) {
    if (_selectedParentId == id) return;
    HapticFeedback.selectionClick();
    setState(() {
      _selectedParentId = id;
      _expandedSubs.clear();
    });
  }

  void _toggleSub(String id) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_expandedSubs.contains(id)) {
        _expandedSubs.clear();
      } else {
        _expandedSubs
          ..clear()
          ..add(id);
      }
    });
  }

  void _openProducts({
    required String title,
    String? categoryId,
    String? subcategoryId,
    String? tertiaryCategoryId,
  }) {
    HapticFeedback.lightImpact();
    final q = StringBuffer('/products?title=${Uri.encodeComponent(title)}');
    if (tertiaryCategoryId != null && subcategoryId != null) {
      q.write('&subcategoryId=$subcategoryId&tertiaryCategoryId=$tertiaryCategoryId');
    } else if (subcategoryId != null) {
      q.write('&subcategoryId=$subcategoryId');
    } else if (categoryId != null) {
      q.write('&categoryId=$categoryId');
    }
    context.push(q.toString());
  }

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(categoriesProvider);
    final s = ref.s;
    final lang = ref.watch(languageCodeProvider);
    final top = MediaQuery.paddingOf(context).top;
    final worlds = ref.watch(worldsProvider).valueOrNull;
    final selectedSlug = ref.watch(selectedWorldSlugProvider);
    final worldSlug = resolveWorldSlug(selected: selectedSlug, worlds: worlds);
    if (worlds != null && worldSlug != null && worldSlug != selectedSlug) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        if (ref.read(selectedWorldSlugProvider) != worldSlug) {
          ref.read(selectedWorldSlugProvider.notifier).state = worldSlug;
        }
      });
    }
    final world = worldSlug == null ? null : ref.watch(worldDetailProvider(worldSlug)).valueOrNull;
    final theme = ref.watch(activeWorldThemeProvider);
    ref.listen<String?>(selectedWorldSlugProvider, (previous, next) {
      if (previous != next && mounted) {
        setState(() {
          _selectedParentId = null;
          _expandedSubs.clear();
        });
      }
    });

    return Scaffold(
      backgroundColor: theme.canvas,
      body: cats.when(
        loading: () => const _CategoriesLoading(),
        error: (e, _) => SafeArea(
          child: ErrorView(
            message: friendlyError(e),
            onRetry: () => refreshCategories(ref),
          ),
        ),
        data: (list) {
          final worldCategories = world?.categories ?? const <Category>[];
          final parents = worldCategories.isNotEmpty
              ? worldCategories
              : list.where((c) => c.parentId == null).toList(growable: false);
          if (parents.isEmpty) {
            return SafeArea(
              child: EmptyState(icon: Icons.grid_view_rounded, title: s.noCategories),
            );
          }

          final selectedId = _selectedParentId ?? parents.first.id;
          if (_selectedParentId == null) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted && _selectedParentId == null) {
                setState(() => _selectedParentId = parents.first.id);
              }
            });
          }

          final selected = parents.cast<Category?>().firstWhere(
                (c) => c!.id == selectedId,
                orElse: () => parents.first,
              )!;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: EdgeInsets.fromLTRB(16, top + 10, 16, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (worldSlug == null) ...[
                      Text(
                        s.categoriesHeader,
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.6,
                          height: 1.05,
                          color: theme.ink,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        s.categoriesBrowseHint,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: theme.inkSoft,
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    const WorldCategoryGallery(outerPadding: 0, aspectRatio: 2.85),
                    const SizedBox(height: 14),
                    const WorldSwitchBar(outerPadding: 0, showTitle: false, compactFixed: true),
                  ],
                ),
              ),
              Expanded(
                  child: world == null
                      ? Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _ParentRail(
                        parents: parents,
                        selectedId: selected.id,
                        lang: lang,
                        onSelect: _selectParent,
                      ),
                      Expanded(
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 280),
                          switchInCurve: Curves.easeOutCubic,
                          switchOutCurve: Curves.easeInCubic,
                          child: _ParentDetailPane(
                          key: ValueKey(selected.id),
                          parent: selected,
                          lang: lang,
                          expandedSubs: _expandedSubs,
                          onRefresh: _onRefresh,
                          onToggleSub: _toggleSub,
                          onOpenAll: () => selected.listingKind == 'subcategory'
                              ? _openProducts(
                                  title: selected.localizedName(lang),
                                  subcategoryId: selected.id,
                                )
                              : _openProducts(
                                  title: selected.localizedName(lang),
                                  categoryId: selected.id,
                                ),
                          onOpenSub: (sub) => _openProducts(
                            title: sub.localizedName(lang),
                            subcategoryId: sub.id,
                          ),
                          onOpenTertiary: (sub, tert) => _openProducts(
                            title: tert.localizedName(lang),
                            subcategoryId: sub.id,
                            tertiaryCategoryId: tert.id,
                          ),
                        ),
                        ),
                      ),
                    ],
                  )
                      : AnimatedSwitcher(
                          duration: const Duration(milliseconds: 320),
                          switchInCurve: Curves.easeOutCubic,
                          switchOutCurve: Curves.easeInCubic,
                          child: KeyedSubtree(
                          key: ValueKey(world.slug),
                          child: _WorldSplit(
                          accent: world.accent,
                          parents: parents,
                          selected: selected,
                          lang: lang,
                          expandedSubs: _expandedSubs,
                          onSelect: _selectParent,
                          onToggleSub: _toggleSub,
                          onOpenAll: () => selected.listingKind == 'subcategory'
                              ? _openProducts(
                                  title: selected.localizedName(lang),
                                  subcategoryId: selected.id,
                                )
                              : _openProducts(
                                  title: selected.localizedName(lang),
                                  categoryId: selected.id,
                                ),
                          onOpenSub: (sub) => _openProducts(
                            title: sub.localizedName(lang),
                            subcategoryId: sub.id,
                          ),
                          onOpenTertiary: (sub, tert) => _openProducts(
                            title: tert.localizedName(lang),
                            subcategoryId: sub.id,
                            tertiaryCategoryId: tert.id,
                          ),
                        ),
                        ),
                        ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _WorldSplit extends ConsumerWidget {
  final Color accent;
  final List<Category> parents;
  final Category selected;
  final String lang;
  final Set<String> expandedSubs;
  final ValueChanged<String> onSelect;
  final ValueChanged<String> onToggleSub;
  final VoidCallback onOpenAll;
  final ValueChanged<Category> onOpenSub;
  final void Function(Category sub, Category tertiary) onOpenTertiary;

  const _WorldSplit({
    required this.accent,
    required this.parents,
    required this.selected,
    required this.lang,
    required this.expandedSubs,
    required this.onSelect,
    required this.onToggleSub,
    required this.onOpenAll,
    required this.onOpenSub,
    required this.onOpenTertiary,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final brands = (selected.listingKind == 'subcategory'
            ? ref.watch(subcategoryBrandsProvider(selected.id))
            : ref.watch(categoryBrandsProvider(selected.id)))
        .valueOrNull ??
        const <Brand>[];
    final children = selected.children;
    final back = Directionality.of(context) == TextDirection.rtl
        ? Icons.arrow_back_rounded
        : Icons.arrow_forward_rounded;
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
      child: Material(
        color: t.surface,
        elevation: 0,
        shadowColor: t.ink.withValues(alpha: 0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: t.hairline),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 112,
            child: ListView.builder(
              padding: const EdgeInsets.only(top: 6, bottom: 12),
              itemCount: parents.length,
              itemBuilder: (_, i) {
                final cat = parents[i];
                final on = cat.id == selected.id;
                return InkWell(
                  onTap: () => onSelect(cat.id),
                  child: Container(
                    padding: const EdgeInsetsDirectional.fromSTEB(12, 15, 10, 15),
                    decoration: BoxDecoration(
                      color: on ? accent.withValues(alpha: 0.08) : Colors.transparent,
                      border: BorderDirectional(
                        start: BorderSide(color: on ? accent : Colors.transparent, width: 3),
                      ),
                    ),
                    child: Text(
                      cat.localizedName(lang),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.start,
                      style: TextStyle(
                        fontSize: 13.5,
                        height: 1.25,
                        fontWeight: on ? FontWeight.w800 : FontWeight.w600,
                        color: on ? accent : t.inkSoft,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          VerticalDivider(width: 1, thickness: 1, color: t.divider),
          Expanded(
            child: ListView(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
                children: [
                  InkWell(
                    onTap: onOpenAll,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              lang == 'en' ? 'View all products' : 'عرض جميع المنتجات',
                              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: t.ink),
                            ),
                          ),
                          Icon(back, size: 18, color: t.inkMuted),
                        ],
                      ),
                    ),
                  ),
                  const Divider(height: 1),
                  for (final child in children) ...[
                    InkWell(
                      onTap: () {
                        if (child.children.isNotEmpty) {
                          onToggleSub(child.id);
                        } else {
                          onOpenSub(child);
                        }
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                child.localizedName(lang),
                                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: t.ink),
                              ),
                            ),
                            Icon(
                              child.children.isEmpty
                                  ? back
                                  : (expandedSubs.contains(child.id) ? Icons.expand_less_rounded : Icons.expand_more_rounded),
                              size: 18,
                              color: t.inkMuted,
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (expandedSubs.contains(child.id))
                      for (final tert in child.children)
                        InkWell(
                          onTap: () => onOpenTertiary(child, tert),
                          child: Padding(
                            padding: const EdgeInsetsDirectional.only(start: 26, bottom: 8),
                            child: Text(tert.localizedName(lang), style: const TextStyle(fontWeight: FontWeight.w600)),
                          ),
                        ),
                    const Divider(height: 1),
                  ],
                  if (brands.isNotEmpty) ...[
                    const SizedBox(height: 18),
                    DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: t.hairline),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(8, 14, 8, 14),
                        child: Column(
                          children: [
                    Text(
                      lang == 'en' ? 'Top brands' : 'أشهر الماركات',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: t.ink),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      alignment: WrapAlignment.center,
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        for (final brand in brands)
                          InkWell(
                            onTap: () => context.push(
                              '/products?brandId=${brand.id}&title=${Uri.encodeComponent(brand.localizedName(lang))}',
                            ),
                            child: Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: t.surface,
                                border: Border.all(color: t.hairline),
                              ),
                              clipBehavior: Clip.antiAlias,
                              alignment: Alignment.center,
                              child: brand.logoUrl.isEmpty
                                  ? Text(
                                      brand.localizedName(lang).isEmpty ? '•' : brand.localizedName(lang).substring(0, 1),
                                      style: TextStyle(fontWeight: FontWeight.w800, color: accent),
                                    )
                                  : AppNetworkImage(url: brand.logoUrl, fit: BoxFit.contain, backgroundColor: t.surface),
                            ),
                          ),
                      ],
                    ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
          ),
        ],
        ),
      ),
    );
  }
}

// ─── Parent rail ─────────────────────────────────────────────────────────────

class _ParentRail extends StatelessWidget {
  final List<Category> parents;
  final String selectedId;
  final String lang;
  final ValueChanged<String> onSelect;

  const _ParentRail({
    required this.parents,
    required this.selectedId,
    required this.lang,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return SizedBox(
      width: 108,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: t.canvasWarm,
          border: BorderDirectional(
            end: BorderSide(color: t.hairline.withValues(alpha: 0.6)),
          ),
        ),
        child: ListView.builder(
          padding: EdgeInsets.only(bottom: Responsive.shellBottomReserve(context)),
          itemCount: parents.length,
          itemBuilder: (context, i) {
            final cat = parents[i];
            return _ParentRailTile(
              category: cat,
              lang: lang,
              selected: cat.id == selectedId,
              onTap: () => onSelect(cat.id),
            );
          },
        ),
      ),
    );
  }
}

class _ParentRailTile extends StatelessWidget {
  final Category category;
  final String lang;
  final bool selected;
  final VoidCallback onTap;

  const _ParentRailTile({
    required this.category,
    required this.lang,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final accent = Theme.of(context).colorScheme.primary;
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 3, 8, 3),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOutCubic,
        decoration: BoxDecoration(
          color: selected ? t.surface : Colors.transparent,
          borderRadius: BorderRadius.circular(18),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: accent.withValues(alpha: 0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(18),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(18),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(6, 8, 6, 8),
              child: Column(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 240),
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: selected ? accent : Colors.transparent,
                        width: 1.6,
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(13),
                      child: ColoredBox(
                        color: t.surface,
                        child: SizedBox(
                          width: 52,
                          height: 52,
                          child: CategoryLineArt(category: category, size: 52),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    category.localizedName(lang),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11.5,
                      height: 1.15,
                      fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                      color: selected ? accent : t.inkSoft,
                    ),
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

// ─── Detail pane ─────────────────────────────────────────────────────────────

class _ParentDetailPane extends ConsumerWidget {
  final Category parent;
  final String lang;
  final Set<String> expandedSubs;
  final Future<void> Function() onRefresh;
  final ValueChanged<String> onToggleSub;
  final VoidCallback onOpenAll;
  final ValueChanged<Category> onOpenSub;
  final void Function(Category sub, Category tertiary) onOpenTertiary;

  const _ParentDetailPane({
    super.key,
    required this.parent,
    required this.lang,
    required this.expandedSubs,
    required this.onRefresh,
    required this.onToggleSub,
    required this.onOpenAll,
    required this.onOpenSub,
    required this.onOpenTertiary,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final theme = ref.watch(activeWorldThemeProvider);
    final brandsAsync = ref.watch(categoryBrandsProvider(parent.id));
    final children = parent.children;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.surface,
        borderRadius: const BorderRadiusDirectional.only(topStart: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: theme.ink.withValues(alpha: 0.06),
            blurRadius: 18,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: RefreshIndicator(
      color: theme.accent,
      onRefresh: onRefresh,
      child: CustomScrollView(
        physics: HomeScrollPerf.physics,
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 16, 14, 4),
              child: Container(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(22),
                  gradient: LinearGradient(
                    begin: AlignmentDirectional.topStart,
                    end: AlignmentDirectional.bottomEnd,
                    colors: [
                      theme.accentLight,
                      theme.canvasWarm,
                      theme.surface,
                    ],
                  ),
                  border: Border.all(color: theme.accentSoft),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        _SquareCategoryPhoto(category: parent, size: 72, radius: 18),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                parent.localizedName(lang),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.4,
                                  height: 1.15,
                                  color: theme.ink,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                children.isEmpty
                                    ? s.browseAllProductsDirect
                                    : s.subcategoryCount(children.length),
                                style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                  color: theme.inkSoft,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Material(
                      color: Colors.transparent,
                      borderRadius: BorderRadius.circular(14),
                      child: InkWell(
                        onTap: onOpenAll,
                        borderRadius: BorderRadius.circular(14),
                        child: Ink(
                          decoration: BoxDecoration(
                            gradient: theme.signatureGradient,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 11),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.grid_view_rounded, size: 16, color: Colors.white),
                              const SizedBox(width: 8),
                              Text(
                                s.viewAllProducts,
                                style: const TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          brandsAsync.when(
            loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
            error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
            data: (brands) {
              if (brands.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
              return SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(top: 4, bottom: 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(14, 8, 14, 0),
                        child: Row(
                          children: [
                            Container(
                              width: 18,
                              height: 2,
                              decoration: BoxDecoration(
                                color: theme.accent,
                                borderRadius: BorderRadius.circular(99),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                s.sectionBrands,
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w800,
                                  color: theme.ink,
                                ),
                              ),
                            ),
                            Text(
                              s.brandCountLabel(brands.length),
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                                color: theme.inkMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 6),
                      CategoryBrandsStrip(
                        brands: brands,
                        categoryId: parent.id,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          if (children.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(s.noSubcategories, style: const TextStyle(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: onOpenAll,
                        style: FilledButton.styleFrom(backgroundColor: theme.accent),
                        child: Text(s.viewProducts),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
                child: Row(
                  children: [
                    Container(
                      width: 18,
                      height: 2,
                      decoration: BoxDecoration(
                        color: theme.accent,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      s.subcategories,
                      style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: theme.ink),
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              sliver: SliverList.separated(
                itemCount: children.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, i) {
                  final sub = children[i];
                  final expanded = expandedSubs.contains(sub.id);
                  final hasTertiary = sub.children.isNotEmpty;
                  return _SubcategoryRow(
                    subcategory: sub,
                    lang: lang,
                    expanded: expanded,
                    hasTertiary: hasTertiary,
                    onOpenProducts: () => onOpenSub(sub),
                    onToggleExpand: hasTertiary ? () => onToggleSub(sub.id) : null,
                    onOpenTertiary: (t) => onOpenTertiary(sub, t),
                  );
                },
              ),
            ),
          ],
          SliverToBoxAdapter(child: SizedBox(height: Responsive.shellBottomReserve(context))),
        ],
      ),
    ),
    );
  }
}

class _SubcategoryRow extends StatelessWidget {
  final Category subcategory;
  final String lang;
  final bool expanded;
  final bool hasTertiary;
  final VoidCallback onOpenProducts;
  final VoidCallback? onToggleExpand;
  final ValueChanged<Category> onOpenTertiary;

  const _SubcategoryRow({
    required this.subcategory,
    required this.lang,
    required this.expanded,
    required this.hasTertiary,
    required this.onOpenProducts,
    required this.onToggleExpand,
    required this.onOpenTertiary,
  });

  @override
  Widget build(BuildContext context) {
    final s = AppStrings(lang);
    final t = context.worldTheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: expanded ? t.accent.withValues(alpha: 0.45) : t.hairline,
          width: expanded ? 1.4 : 1,
        ),
        boxShadow: t.cardShadow,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: onOpenProducts,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(10, 10, 6, 10),
                    child: Row(
                      children: [
                        _SquareCategoryPhoto(category: subcategory, size: 72, radius: 16),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                subcategory.localizedName(lang),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w800,
                                  height: 1.25,
                                ),
                              ),
                              if (hasTertiary) ...[
                                const SizedBox(height: 3),
                                Text(
                                  s.tertiaryCountLabel(subcategory.children.length),
                                  style: AppTypography.caption.copyWith(
                                    fontSize: 11.5,
                                    color: t.accent,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              if (hasTertiary)
                Padding(
                  padding: const EdgeInsetsDirectional.only(end: 6),
                  child: _TertiaryArrowButton(
                    expanded: expanded,
                    tooltip: s.browseTertiarySections,
                    onTap: onToggleExpand ?? onOpenProducts,
                  ),
                ),
            ],
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 320),
            curve: Curves.easeOutCubic,
            alignment: Alignment.topCenter,
            child: !expanded || !hasTertiary
                ? const SizedBox(width: double.infinity)
                : Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: t.accentLight,
                border: Border(top: BorderSide(color: t.accentSoft)),
              ),
              padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8, right: 2, left: 2),
                    child: Text(
                      s.browseTertiarySections,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: t.accent,
                      ),
                    ),
                  ),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      const gap = 8.0;
                      final tileWidth = (constraints.maxWidth - gap * 2) / 3;
                      return Wrap(
                        spacing: gap,
                        runSpacing: gap,
                        children: [
                          for (final item in subcategory.children)
                            SizedBox(
                              width: tileWidth,
                              child: _TertiaryTile(
                                item: item,
                                lang: lang,
                                onTap: () => onOpenTertiary(item),
                              ),
                            ),
                        ],
                      );
                    },
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

class _SquareCategoryPhoto extends StatelessWidget {
  final Category category;
  final double size;
  final double radius;

  const _SquareCategoryPhoto({
    required this.category,
    required this.size,
    required this.radius,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final photo = ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: t.surface,
          border: Border.all(color: t.hairline),
          borderRadius: BorderRadius.circular(radius),
        ),
        child: size.isFinite
            ? SizedBox(
                width: size,
                height: size,
                child: CategoryLineArt(category: category, size: size),
              )
            : AspectRatio(
                aspectRatio: 1,
                child: CategoryLineArt(category: category, expand: true),
              ),
      ),
    );
    return photo;
  }
}

class _TertiaryArrowButton extends StatelessWidget {
  final bool expanded;
  final String tooltip;
  final VoidCallback onTap;

  const _TertiaryArrowButton({
    required this.expanded,
    required this.tooltip,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.transparent,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 240),
            curve: Curves.easeOutCubic,
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: expanded ? t.accent : t.surface,
              border: Border.all(
                color: expanded ? t.accent : t.accentSoft,
                width: 1.4,
              ),
            ),
            child: AnimatedRotation(
              turns: expanded ? 0.5 : 0,
              duration: const Duration(milliseconds: 280),
              curve: Curves.easeOutCubic,
              child: Icon(
                Icons.keyboard_arrow_down_rounded,
                size: 30,
                color: expanded ? Colors.white : t.accent,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TertiaryTile extends StatelessWidget {
  final Category item;
  final String lang;
  final VoidCallback onTap;

  const _TertiaryTile({
    required this.item,
    required this.lang,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Material(
      color: t.surface,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(6, 6, 6, 8),
          child: Column(
            children: [
              _SquareCategoryPhoto(category: item, size: double.infinity, radius: 12),
              const SizedBox(height: 6),
              Text(
                item.localizedName(lang),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11.5,
                  height: 1.2,
                  fontWeight: FontWeight.w800,
                  color: t.ink,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoriesLoading extends StatelessWidget {
  const _CategoriesLoading();

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final top = MediaQuery.paddingOf(context).top;
    return Padding(
      padding: EdgeInsets.fromLTRB(12, top + 12, 12, 12),
      child: Row(
        children: [
          Container(
            width: 92,
            decoration: BoxDecoration(
              color: t.accentLight,
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              children: List.generate(
                6,
                (_) => Container(
                  height: 64,
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: t.accentLight,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
