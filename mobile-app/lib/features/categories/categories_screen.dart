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
import '../home/widgets/home_scroll_perf.dart';
import 'widgets/category_brands_strip.dart';

const double _kRailWidth = 86;
const double _kRailItemHeight = 90;

/// ألوان الصفحة — لوحة هادئة موحّدة.
abstract final class _CatPalette {
  static const canvas = Color(0xFFF9F7F8);
  static const railBg = Color(0xFFFFFFFF);
  static const panelBg = Color(0xFFFFFFFF);
  static const tileBg = Color(0xFFF5F2F3);
  static const tileActive = Color(0xFFFFF5F8);
  static const imageWash = Color(0xFFFFF8FA);
}

/// إعدادات أداء التمرير والانتقال.
abstract final class _CatPerf {
  static const switchDuration = Duration(milliseconds: 180);
  static const railAnimDuration = Duration(milliseconds: 160);
  static const railCacheExtent = 240.0;
  static const bodyCacheExtent = 520.0;

  static ScrollPhysics get scrollPhysics => HomeScrollPerf.physics;
}

/// صفحة الأقسام — شريط جانبي أنيق + محتوى بسيط ومرتّب.
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

/// تخطيط مستقل — تغيير القسم لا يعيد بناء شجرة البيانات الكاملة.
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
                    decoration: const BoxDecoration(
                      color: _CatPalette.panelBg,
                      borderRadius: BorderRadius.horizontal(left: Radius.circular(24)),
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

// ─── Top bar ──────────────────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  final VoidCallback onSearch;

  const _TopBar({required this.onSearch});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 6, AppSpacing.lg, 12),
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
                  'تصفّحي حسب القسم والبراند',
                  style: AppTypography.caption.copyWith(fontSize: 12),
                ),
              ],
            ),
          ),
          _IconCircle(icon: Icons.search_rounded, onTap: onSearch),
        ],
      ),
    );
  }
}

class _IconCircle extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _IconCircle({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      shape: const CircleBorder(side: BorderSide(color: AppColors.hairline)),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 40,
          height: 40,
          child: Icon(icon, size: 20, color: AppColors.textPrimary),
        ),
      ),
    );
  }
}

// ─── Side rail ────────────────────────────────────────────────────────────────

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
            splashColor: AppColors.primary.withValues(alpha: 0.06),
            highlightColor: AppColors.primary.withValues(alpha: 0.03),
            child: AnimatedContainer(
              duration: _CatPerf.railAnimDuration,
              curve: Curves.easeOutCubic,
              decoration: BoxDecoration(
                color: active ? _CatPalette.tileActive : Colors.transparent,
                borderRadius: BorderRadius.circular(16),
                border: active
                    ? Border.all(color: AppColors.primarySoft, width: 0.8)
                    : null,
              ),
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
              child: Column(
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
                        width: 46,
                        height: 46,
                        child: _CatImage(
                          category: category,
                          fallbackSize: 17,
                          size: 46,
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
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Content body ─────────────────────────────────────────────────────────────

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
    if (oldWidget.parent.id != widget.parent.id) {
      _selectedSubId = null;
    }
  }

  void _openAll(BuildContext context) {
    context.push(
      '/products?categoryId=${widget.parent.id}&title=${Uri.encodeComponent(widget.parent.name)}',
    );
  }

  void _onSubTap(Category sub) {
    HapticFeedback.selectionClick();
    setState(() => _selectedSubId = sub.id);
  }

  @override
  Widget build(BuildContext context) {
    final subs = widget.parent.children;
    final detailed = subs.where((c) => c.children.isNotEmpty).toList(growable: false);
    final brandsAsync = _selectedSubId != null
        ? ref.watch(subcategoryBrandsProvider(_selectedSubId!))
        : ref.watch(categoryBrandsProvider(widget.parent.id));

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async {
        ref.invalidate(categoryBrandsProvider(widget.parent.id));
        if (_selectedSubId != null) {
          ref.invalidate(subcategoryBrandsProvider(_selectedSubId!));
        }
        await widget.onRefresh();
      },
      child: CustomScrollView(
        key: PageStorageKey<String>('cat_scroll_${widget.parent.id}'),
        physics: _CatPerf.scrollPhysics,
        cacheExtent: _CatPerf.bodyCacheExtent,
        slivers: [
          SliverToBoxAdapter(
            child: _BrowseAllBar(
              parent: widget.parent,
              subCount: subs.length,
              onTap: () => _openAll(context),
            ),
          ),
          if (subs.isEmpty) ...[
            SliverFillRemaining(
              hasScrollBody: false,
              child: _NoSubsEmpty(onBrowse: () => _openAll(context)),
            ),
            SliverToBoxAdapter(
              child: brandsAsync.when(
                loading: () => const Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _SectionLabel(title: 'البراندات'),
                    CategoryBrandsStripLoading(),
                  ],
                ),
                error: (_, __) => const SizedBox.shrink(),
                data: (brands) {
                  if (brands.isEmpty) return const SizedBox.shrink();
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const _SectionLabel(title: 'براندات القسم'),
                      CategoryBrandsStrip(
                        brands: brands,
                        categoryId: widget.parent.id,
                      ),
                    ],
                  );
                },
              ),
            ),
          ] else ...[
            const SliverToBoxAdapter(child: _SectionLabel(title: 'الأقسام الفرعية')),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 108,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  physics: _CatPerf.scrollPhysics,
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
                  itemCount: subs.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (_, i) => _SubCircleChip(
                    category: subs[i],
                    selected: _selectedSubId == subs[i].id,
                    onTap: () => _onSubTap(subs[i]),
                    onOpen: () {
                      HapticFeedback.selectionClick();
                      context.push(
                        '/products?subcategoryId=${subs[i].id}&title=${Uri.encodeComponent(subs[i].name)}',
                      );
                    },
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: brandsAsync.when(
                loading: () => const Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _SectionLabel(title: 'البراندات'),
                    CategoryBrandsStripLoading(),
                  ],
                ),
                error: (_, __) => const SizedBox.shrink(),
                data: (brands) {
                  if (brands.isEmpty) return const SizedBox.shrink();
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _SectionLabel(
                        title: _selectedSubId != null ? 'براندات القسم الفرعي' : 'براندات القسم',
                        trailing: brands.length > 6 ? 'تمرير ←' : null,
                      ),
                      CategoryBrandsStrip(
                        brands: brands,
                        categoryId: _selectedSubId == null ? widget.parent.id : null,
                        subcategoryId: _selectedSubId,
                      ),
                    ],
                  );
                },
              ),
            ),
            if (detailed.isNotEmpty) ...[
              const SliverToBoxAdapter(child: _SectionLabel(title: 'تفاصيل أكثر')),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
                sliver: SliverList.separated(
                  itemCount: detailed.length,
                  itemBuilder: (_, i) => _DetailBlock(
                    key: ValueKey(detailed[i].id),
                    category: detailed[i],
                  ),
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                ),
              ),
            ],
          ],
          const SliverToBoxAdapter(child: SizedBox(height: 120)),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String title;
  final String? trailing;

  const _SectionLabel({required this.title, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 6),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: AppTypography.caption.copyWith(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
                letterSpacing: -0.1,
              ),
            ),
          ),
          if (trailing != null)
            Text(
              trailing!,
              style: AppTypography.caption.copyWith(
                fontSize: 11,
                color: AppColors.textMuted,
              ),
            ),
        ],
      ),
    );
  }
}

class _BrowseAllBar extends StatelessWidget {
  final Category parent;
  final int subCount;
  final VoidCallback onTap;

  const _BrowseAllBar({required this.parent, required this.subCount, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Material(
        color: _CatPalette.tileBg,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: SizedBox(
                    width: 52,
                    height: 52,
                    child: parent.imageUrl.isNotEmpty
                        ? AppNetworkImage(
                            url: parent.imageUrl,
                            width: 52,
                            height: 52,
                            fit: BoxFit.cover,
                          )
                        : ColoredBox(
                            color: _CatPalette.imageWash,
                            child: Center(
                              child: Text(
                                parent.icon ?? parent.name.characters.first,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary,
                                ),
                              ),
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        parent.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.2,
                        ),
                      ),
                      if (subCount > 0) ...[
                        const SizedBox(height: 2),
                        Text(
                          '$subCount قسم فرعي',
                          style: AppTypography.caption.copyWith(fontSize: 11),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(AppRadius.pill),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'الكل',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(width: 2),
                      Icon(Icons.arrow_back_ios_new_rounded, size: 10, color: Colors.white),
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

class _SubCircleChip extends StatelessWidget {
  final Category category;
  final bool selected;
  final VoidCallback onTap;
  final VoidCallback onOpen;

  const _SubCircleChip({
    required this.category,
    required this.selected,
    required this.onTap,
    required this.onOpen,
  });

  static const _size = 58.0;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 72,
      child: Column(
        children: [
          GestureDetector(
            onTap: onTap,
            onLongPress: onOpen,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: _size,
              height: _size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? AppColors.primaryLight : AppColors.surface,
                border: Border.all(
                  color: selected ? AppColors.primary : AppColors.hairline,
                  width: selected ? 2 : 1,
                ),
                boxShadow: selected
                    ? [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: ClipOval(
                child: _CatImage(category: category, fallbackSize: 18, size: _size),
              ),
            ),
          ),
          const SizedBox(height: 6),
          GestureDetector(
            onTap: onOpen,
            child: Text(
              category.name,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                height: 1.15,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                color: selected ? AppColors.primaryDark : AppColors.textSecondary,
              ),
            ),
          ),
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

    return RepaintBoundary(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            onTap: () => context.push(
              '/products?subcategoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
            ),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      width: 30,
                      height: 30,
                      child: _CatImage(category: category, fallbackSize: 13, size: 30),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      category.name,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                    ),
                  ),
                  Text(
                    'الكل',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary.withValues(alpha: 0.85),
                    ),
                  ),
                  Icon(
                    Icons.chevron_left_rounded,
                    size: 15,
                    color: AppColors.primary.withValues(alpha: 0.85),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 82,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: _CatPerf.scrollPhysics,
              cacheExtent: HomeScrollPerf.horizontalCacheExtent,
              addAutomaticKeepAlives: false,
              addRepaintBoundaries: true,
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) => _DetailChip(
                key: ValueKey(items[i].id),
                category: items[i],
                subcategoryId: category.id,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailChip extends StatelessWidget {
  final Category category;
  final String subcategoryId;

  const _DetailChip({super.key, required this.category, required this.subcategoryId});

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Material(
        color: _CatPalette.tileBg,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            context.push(
              '/products?subcategoryId=$subcategoryId&tertiaryCategoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
            );
          },
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: SizedBox(
                    width: 30,
                    height: 30,
                    child: _CatImage(category: category, fallbackSize: 12, size: 30),
                  ),
                ),
                const SizedBox(width: 8),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 88),
                  child: Text(
                    category.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
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

// ─── Shared widgets ───────────────────────────────────────────────────────────

class _CatImage extends StatelessWidget {
  final Category category;
  final double fallbackSize;
  final double? size;

  const _CatImage({
    required this.category,
    required this.fallbackSize,
    this.size,
  });

  @override
  Widget build(BuildContext context) {
    if (category.imageUrl.isNotEmpty) {
      return AppNetworkImage(
        url: category.imageUrl,
        width: size,
        height: size,
        fit: BoxFit.cover,
      );
    }
    return ColoredBox(
      color: _CatPalette.imageWash,
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
            Icon(
              Icons.category_outlined,
              size: 40,
              color: AppColors.textMuted.withValues(alpha: 0.45),
            ),
            const SizedBox(height: 12),
            const Text(
              'لا أقسام فرعية',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
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

// ─── Loading ──────────────────────────────────────────────────────────────────

class _CategoriesLoading extends StatelessWidget {
  const _CategoriesLoading();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(AppSpacing.lg, 6, AppSpacing.lg, 12),
            child: Row(
              children: [
                Expanded(child: ShimmerBox(height: 24, width: 80, radius: 8)),
                ShimmerBox(height: 40, width: 40, radius: 999),
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
                        child: ShimmerBox(height: 72, radius: 16),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: DecoratedBox(
                    decoration: const BoxDecoration(
                      color: _CatPalette.panelBg,
                      borderRadius: BorderRadius.horizontal(left: Radius.circular(24)),
                    ),
                    child: ListView(
                      physics: _CatPerf.scrollPhysics,
                      padding: const EdgeInsets.all(16),
                      children: const [
                        ShimmerBox(height: 80, radius: 18),
                        SizedBox(height: 22),
                        ShimmerBox(height: 12, width: 90, radius: 6),
                        SizedBox(height: 14),
                        Row(
                          children: [
                            Expanded(child: ShimmerBox(height: 96, radius: 16)),
                            SizedBox(width: 12),
                            Expanded(child: ShimmerBox(height: 96, radius: 16)),
                            SizedBox(width: 12),
                            Expanded(child: ShimmerBox(height: 96, radius: 16)),
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
