import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/providers/catalog_providers.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/category_icon.dart';
import '../../../core/widgets/luxe.dart';
import '../../../data/models/category_model.dart';
import '../utils/category_visuals.dart';
import '../widgets/category_browse_card.dart';

enum _BrowseTab { shop, offers }

/// صفحة تصفّح الفئات — شبكة بطاقات أفقية نظيفة (أسلوب retail عالمي).
class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  _BrowseTab _tab = _BrowseTab.shop;
  CategoryModel? _drillParent;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF3F3F3),
      body: SafeArea(
        child: categoriesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => _ErrorState(
            onRetry: () => ref.invalidate(categoriesProvider),
          ),
          data: (categories) {
            if (categories.isEmpty) {
              return _EmptyState();
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _BrowseHeader(onSearch: () => context.push('/search')),
                _TabBar(
                  tab: _tab,
                  onChanged: (t) => setState(() {
                    _tab = t;
                    _drillParent = null;
                  }),
                ),
                if (_drillParent != null)
                  _Breadcrumb(
                    parent: _drillParent!,
                    onBack: () => setState(() => _drillParent = null),
                  ),
                Expanded(
                  child: _tab == _BrowseTab.offers
                      ? _OffersPane(onSearch: () => context.push('/search'))
                      : _drillParent == null
                          ? _CategoryGrid(
                              categories: categories,
                              onCategoryTap: _onParentTap,
                              onRefresh: () async {
                                ref.invalidate(categoriesProvider);
                                await ref.read(categoriesProvider.future);
                              },
                            )
                          : _SubcategoryGrid(
                              parent: _drillParent!,
                              onSubTap: _onSubTap,
                              onBrowseAll: () => _openProducts(
                                categoryId: _drillParent!.id,
                                title: _drillParent!.name,
                              ),
                            ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  void _onParentTap(CategoryModel cat) {
    if (cat.subcategories.isNotEmpty) {
      setState(() => _drillParent = cat);
      return;
    }
    _openProducts(categoryId: cat.id, title: cat.name);
  }

  void _onSubTap(SubcategoryModel sub) {
    _openProducts(
      categoryId: sub.categoryId,
      subcategoryId: sub.id,
      title: sub.name,
    );
  }

  void _openProducts({
    required String categoryId,
    String? subcategoryId,
    required String title,
  }) {
    final q = StringBuffer('/products?categoryId=$categoryId')
      ..write('&title=${Uri.encodeComponent(title)}');
    if (subcategoryId != null) {
      q.write('&subcategoryId=$subcategoryId');
    }
    context.push(q.toString());
  }
}

class _BrowseHeader extends StatelessWidget {
  const _BrowseHeader({required this.onSearch});
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.lg,
        AppSizes.md,
        AppSizes.lg,
        AppSizes.sm,
      ),
      child: PressedScale(
        onTap: onSearch,
        scale: 0.99,
        child: Container(
          height: 48,
          padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppSizes.pillRadius),
            border: Border.all(color: AppColors.dividerLight),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.search_rounded,
                size: 22,
                color: AppColors.textMuted,
              ),
              const SizedBox(width: AppSizes.sm),
              Expanded(
                child: Text(
                  AppStrings.searchHint,
                  style: AppTextStyles.body(
                    color: AppColors.textMuted,
                    size: 14,
                  ),
                ),
              ),
              Icon(
                Icons.mic_none_rounded,
                size: 22,
                color: AppColors.textMuted.withValues(alpha: 0.7),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TabBar extends StatelessWidget {
  const _TabBar({required this.tab, required this.onChanged});
  final _BrowseTab tab;
  final ValueChanged<_BrowseTab> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg),
      child: Row(
        children: [
          _TabChip(
            label: 'تصفّح',
            selected: tab == _BrowseTab.shop,
            onTap: () => onChanged(_BrowseTab.shop),
          ),
          const SizedBox(width: AppSizes.xl),
          _TabChip(
            label: 'العروض',
            selected: tab == _BrowseTab.offers,
            onTap: () => onChanged(_BrowseTab.offers),
          ),
        ],
      ),
    );
  }
}

class _TabChip extends StatelessWidget {
  const _TabChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: AppTextStyles.title(size: 15).copyWith(
              fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
              color: selected ? AppColors.textPrimary : AppColors.textMuted,
            ),
          ),
          const SizedBox(height: AppSizes.sm),
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            height: 2.5,
            width: selected ? 36 : 0,
            decoration: BoxDecoration(
              color: AppColors.textPrimary,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ],
      ),
    );
  }
}

class _Breadcrumb extends StatelessWidget {
  const _Breadcrumb({required this.parent, required this.onBack});
  final CategoryModel parent;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.lg,
        AppSizes.md,
        AppSizes.lg,
        0,
      ),
      child: Row(
        children: [
          PressedScale(
            onTap: onBack,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 16,
                  color: AppColors.textPrimary,
                ),
                const SizedBox(width: AppSizes.xs),
                Text(
                  'كل الفئات',
                  style: AppTextStyles.body(
                    size: 13,
                    color: AppColors.textPrimary,
                  ).copyWith(fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          const Spacer(),
          Text(
            parent.name,
            style: AppTextStyles.caption(
              color: AppColors.textMuted,
              size: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryGrid extends StatelessWidget {
  const _CategoryGrid({
    required this.categories,
    required this.onCategoryTap,
    required this.onRefresh,
  });

  final List<CategoryModel> categories;
  final ValueChanged<CategoryModel> onCategoryTap;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: onRefresh,
      child: GridView.builder(
        padding: const EdgeInsets.fromLTRB(
          AppSizes.lg,
          AppSizes.lg,
          AppSizes.lg,
          100,
        ),
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: AppSizes.md,
          crossAxisSpacing: AppSizes.md,
          childAspectRatio: 1.85,
        ),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final cat = categories[index];
          final visual = CategoryVisuals.resolve(
            CategoryVisualInput(name: cat.name, index: index),
          );
          final imageUrl = CategoryIcon.isNetworkUrl(cat.icon) ? cat.icon : null;

          return CategoryBrowseCard(
            title: cat.name,
            visual: visual,
            imageUrl: imageUrl,
            subtitle: cat.subcategories.isNotEmpty
                ? '${cat.subcategories.length} قسم'
                : null,
            onTap: () => onCategoryTap(cat),
          );
        },
      ),
    );
  }
}

class _SubcategoryGrid extends StatelessWidget {
  const _SubcategoryGrid({
    required this.parent,
    required this.onSubTap,
    required this.onBrowseAll,
  });

  final CategoryModel parent;
  final ValueChanged<SubcategoryModel> onSubTap;
  final VoidCallback onBrowseAll;

  @override
  Widget build(BuildContext context) {
    final subs = parent.subcategories;

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.lg,
        AppSizes.lg,
        AppSizes.lg,
        100,
      ),
      physics: const BouncingScrollPhysics(),
      children: [
        CategoryBrowseCard(
          title: 'كل ${parent.name}',
          visual: CategoryVisuals.resolve(
            CategoryVisualInput(name: parent.name, index: 0),
          ),
          imageUrl: CategoryIcon.isNetworkUrl(parent.icon) ? parent.icon : null,
          subtitle: 'عرض جميع المنتجات',
          onTap: onBrowseAll,
        ),
        const SizedBox(height: AppSizes.lg),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: AppSizes.md,
            crossAxisSpacing: AppSizes.md,
            childAspectRatio: 1.85,
          ),
          itemCount: subs.length,
          itemBuilder: (context, index) {
            final sub = subs[index];
            final visual = CategoryVisuals.resolve(
              CategoryVisualInput(name: sub.name, index: index + 1),
            );
            return CategoryBrowseCard(
              title: sub.name,
              visual: visual,
              subtitle: sub.productCount > 0
                  ? '${sub.productCount} منتج'
                  : null,
              onTap: () => onSubTap(sub),
            );
          },
        ),
      ],
    );
  }
}

class _OffersPane extends StatelessWidget {
  const _OffersPane({required this.onSearch});
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSizes.lg),
      children: [
        CategoryBrowseCard(
          title: 'عروض اليوم',
          visual: const CategoryVisual(
            icon: Icons.local_offer_outlined,
            color: Color(0xFFE53935),
          ),
          subtitle: 'تخفيضات مختارة',
          onTap: () => context.push(
            '/products?title=${Uri.encodeComponent('العروض')}',
          ),
        ),
        const SizedBox(height: AppSizes.md),
        CategoryBrowseCard(
          title: 'باقات التوفير',
          visual: const CategoryVisual(
            icon: Icons.inventory_2_outlined,
            color: Color(0xFF8E24AA),
          ),
          subtitle: 'مجموعات بسعر خاص',
          onTap: () => context.go('/home'),
        ),
        const SizedBox(height: AppSizes.xxl),
        Center(
          child: TextButton(
            onPressed: onSearch,
            child: Text(
              'ابحثي عن منتج معيّن',
              style: AppTextStyles.body(color: AppColors.primary),
            ),
          ),
        ),
      ],
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSizes.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 48),
            const SizedBox(height: AppSizes.lg),
            Text('تعذر تحميل الفئات', style: AppTextStyles.title()),
            const SizedBox(height: AppSizes.md),
            FilledButton(
              onPressed: onRetry,
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text('لا توجد فئات بعد', style: AppTextStyles.body()),
    );
  }
}
