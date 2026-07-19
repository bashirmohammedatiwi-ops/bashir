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

const double _kRailWidth = 98;
const double _kRailItemHeight = 104;

/// صفحة الأقسام — شريط جانبي + محتوى منظّم بترتيب واضح.
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

  void _revealRailItem(int index) {
    if (!_railScroll.hasClients) return;
    final viewport = _railScroll.position.viewportDimension;
    final target = (index * _kRailItemHeight) - (viewport - _kRailItemHeight) / 2;
    _railScroll.animateTo(
      target.clamp(0.0, _railScroll.position.maxScrollExtent),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: AppColors.scaffold,
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

          return SafeArea(
            bottom: false,
            child: Column(
              children: [
                _TopBar(onSearch: () => context.push('/search')),
                Expanded(
                  child: Row(
                    textDirection: TextDirection.rtl,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _CategoryRail(
                        controller: _railScroll,
                        parents: parents,
                        selected: safeIndex,
                        onTap: _selectParent,
                      ),
                      Expanded(
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: const Color(0xFFFCFAFB),
                            borderRadius: const BorderRadius.horizontal(left: Radius.circular(20)),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.ink.withValues(alpha: 0.04),
                                blurRadius: 12,
                                offset: const Offset(-2, 0),
                              ),
                            ],
                          ),
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 280),
                            switchInCurve: Curves.easeOutCubic,
                            transitionBuilder: (child, anim) => FadeTransition(
                              opacity: anim,
                              child: SlideTransition(
                                position: Tween<Offset>(
                                  begin: const Offset(0.02, 0),
                                  end: Offset.zero,
                                ).animate(anim),
                                child: child,
                              ),
                            ),
                            child: _CategoryBody(
                              key: ValueKey(selected.id),
                              parent: selected,
                              onRefresh: _onRefresh,
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
        },
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
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 6, AppSpacing.lg, 6),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('الأقسام', style: AppTypography.sectionTitle.copyWith(fontSize: 21)),
                Text(
                  'اختاري من القائمة',
                  style: AppTypography.caption.copyWith(fontSize: 11),
                ),
              ],
            ),
          ),
          _IconBtn(icon: Icons.search_rounded, onTap: onSearch),
        ],
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _IconBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.hairline),
          ),
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
    return Container(
      width: _kRailWidth,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(left: BorderSide(color: AppColors.divider, width: 0.6)),
      ),
      child: ListView.builder(
        controller: controller,
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
        itemCount: parents.length,
        itemExtent: _kRailItemHeight,
        itemBuilder: (_, i) => _RailTile(
          category: parents[i],
          active: i == selected,
          onTap: () => onTap(i),
        ),
      ),
    );
  }
}

class _RailTile extends StatelessWidget {
  final Category category;
  final bool active;
  final VoidCallback onTap;

  const _RailTile({required this.category, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Stack(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              decoration: BoxDecoration(
                color: active ? AppColors.primaryLight.withValues(alpha: 0.7) : Colors.transparent,
                borderRadius: BorderRadius.circular(14),
                border: active ? Border.all(color: AppColors.primary.withValues(alpha: 0.12)) : null,
              ),
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    width: active ? 50 : 44,
                    height: active ? 50 : 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      border: Border.all(
                        color: active ? AppColors.primary : AppColors.hairline,
                        width: active ? 2 : 1,
                      ),
                      boxShadow: active
                          ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.15), blurRadius: 10)]
                          : null,
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: _CatImage(category: category, fallbackSize: 18),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    category.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10,
                      height: 1.2,
                      fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                      color: active ? AppColors.primary : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            PositionedDirectional(
              start: 0,
              top: 0,
              bottom: 0,
              child: Center(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  width: 3,
                  height: active ? 28 : 0,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Content body ─────────────────────────────────────────────────────────────

class _CategoryBody extends StatelessWidget {
  final Category parent;
  final Future<void> Function() onRefresh;

  const _CategoryBody({super.key, required this.parent, required this.onRefresh});

  void _openAll(BuildContext context) {
    context.push('/products?categoryId=${parent.id}&title=${Uri.encodeComponent(parent.name)}');
  }

  @override
  Widget build(BuildContext context) {
    final subs = parent.children;
    final detailed = subs.where((c) => c.children.isNotEmpty).toList();

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: onRefresh,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          SliverToBoxAdapter(
            child: _BrowseAllBar(
              parent: parent,
              subCount: subs.length,
              onTap: () => _openAll(context),
            ),
          ),
          if (subs.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _NoSubsEmpty(onBrowse: () => _openAll(context)),
            )
          else ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
                child: Text(
                  'الأقسام الفرعية',
                  style: AppTypography.overline.copyWith(
                    fontSize: 11,
                    color: AppColors.textMuted,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 8,
                  childAspectRatio: 0.76,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, i) => _SubCard(category: subs[i]),
                  childCount: subs.length,
                ),
              ),
            ),
            if (detailed.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
                  child: Text(
                    'تفاصيل أكثر',
                    style: AppTypography.overline.copyWith(
                      fontSize: 11,
                      color: AppColors.textMuted,
                      letterSpacing: 0.2,
                    ),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(14, 0, 14, 0),
                sliver: SliverList.separated(
                  itemCount: detailed.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (_, i) => _DetailBlock(category: detailed[i]),
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

/// شريط علوي: اسم القسم + زر تصفّح الكل.
class _BrowseAllBar extends StatelessWidget {
  final Category parent;
  final int subCount;
  final VoidCallback onTap;

  const _BrowseAllBar({required this.parent, required this.subCount, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          width: double.infinity,
          margin: const EdgeInsets.fromLTRB(12, 10, 12, 0),
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppColors.hairline, width: 0.6),
            boxShadow: AppColors.cardShadow,
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: parent.imageUrl.isNotEmpty
                      ? AppNetworkImage(url: parent.imageUrl, fit: BoxFit.cover)
                      : ColoredBox(
                          color: AppColors.primaryLight,
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
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                    ),
                    if (subCount > 0)
                      Text(
                        '$subCount قسم فرعي',
                        style: AppTypography.caption.copyWith(fontSize: 11),
                      ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'الكل',
                      style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800),
                    ),
                    SizedBox(width: 2),
                    Icon(Icons.arrow_back_ios_new_rounded, size: 11, color: Colors.white),
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

/// بطاقة قسم فرعي — شبكة 3 أعمدة.
class _SubCard extends StatefulWidget {
  final Category category;

  const _SubCard({required this.category});

  @override
  State<_SubCard> createState() => _SubCardState();
}

class _SubCardState extends State<_SubCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final hasMore = widget.category.children.isNotEmpty;

    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: () {
        HapticFeedback.selectionClick();
        context.push(
          '/products?subcategoryId=${widget.category.id}&title=${Uri.encodeComponent(widget.category.name)}',
        );
      },
      child: AnimatedScale(
        scale: _pressed ? 0.96 : 1,
        duration: const Duration(milliseconds: 100),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.hairline, width: 0.6),
            boxShadow: AppColors.cardShadow,
          ),
          child: Column(
            children: [
              Expanded(
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                      child: _CatImage(category: widget.category, fallbackSize: 22),
                    ),
                    if (hasMore)
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.88),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '+${widget.category.children.length}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(6, 7, 6, 9),
                child: Text(
                  widget.category.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 10.5,
                    height: 1.2,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
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

/// كتلة أقسام تفصيلية — عنوان + شرائح أفقية.
class _DetailBlock extends StatelessWidget {
  final Category category;

  const _DetailBlock({required this.category});

  @override
  Widget build(BuildContext context) {
    final items = category.children;

    return Container(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.hairline, width: 0.6),
        boxShadow: AppColors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            onTap: () => context.push(
              '/products?subcategoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
            ),
            borderRadius: BorderRadius.circular(10),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      width: 32,
                      height: 32,
                      child: _CatImage(category: category, fallbackSize: 14),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      category.name,
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800),
                    ),
                  ),
                  const Text(
                    'الكل',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary),
                  ),
                  const Icon(Icons.chevron_left_rounded, size: 16, color: AppColors.primary),
                ],
              ),
            ),
          ),
          SizedBox(
            height: 74,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) => _DetailChip(category: items[i]),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailChip extends StatelessWidget {
  final Category category;

  const _DetailChip({required this.category});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          context.push(
            '/products?tertiaryCategoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: const Color(0xFFFAF8F9),
            border: Border.all(color: AppColors.hairline, width: 0.6),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(
                  width: 32,
                  height: 32,
                  child: _CatImage(category: category, fallbackSize: 14),
                ),
              ),
              const SizedBox(width: 8),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 100),
                child: Text(
                  category.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700),
                ),
              ),
            ],
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

  const _CatImage({required this.category, required this.fallbackSize});

  @override
  Widget build(BuildContext context) {
    if (category.imageUrl.isNotEmpty) {
      return AppNetworkImage(url: category.imageUrl, fit: BoxFit.cover);
    }
    return ColoredBox(
      color: AppColors.primaryLight,
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
            Icon(Icons.category_outlined, size: 44, color: AppColors.textMuted.withValues(alpha: 0.5)),
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
            padding: EdgeInsets.fromLTRB(AppSpacing.lg, 6, AppSpacing.lg, 8),
            child: ShimmerBox(height: 26, width: 90, radius: 8),
          ),
          Expanded(
            child: Row(
              textDirection: TextDirection.rtl,
              children: [
                Container(
                  width: _kRailWidth,
                  color: AppColors.surface,
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    children: List.generate(
                      5,
                      (_) => const Padding(
                        padding: EdgeInsets.only(bottom: 12),
                        child: ShimmerBox(height: 80, radius: 14),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: DecoratedBox(
                    decoration: const BoxDecoration(
                      color: Color(0xFFFCFAFB),
                      borderRadius: BorderRadius.horizontal(left: Radius.circular(20)),
                    ),
                    child: ListView(
                      padding: const EdgeInsets.all(14),
                      children: const [
                        ShimmerBox(height: 72, radius: 0),
                        SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(child: ShimmerBox(height: 110, radius: 14)),
                            SizedBox(width: 8),
                            Expanded(child: ShimmerBox(height: 110, radius: 14)),
                            SizedBox(width: 8),
                            Expanded(child: ShimmerBox(height: 110, radius: 14)),
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
