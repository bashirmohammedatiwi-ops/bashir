import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_motion.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/luxe.dart';
import '../../../data/models/category_model.dart';
import '../../home/providers/home_provider.dart';

/// صفحة الفئات Premium:
/// - شريط جانبي بأسلوب editorial.
/// - منطقة محتوى تعرض بطاقة hero للفئة + grid لأقسامها الفرعية.
class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  int _selected = 0;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: categoriesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => Center(
            child: TextButton(
              onPressed: () => ref.invalidate(categoriesProvider),
              child: const Text('إعادة المحاولة'),
            ),
          ),
          data: (categories) {
            if (categories.isEmpty) {
              return const Center(child: Text('لا توجد فئات'));
            }
            final safeIndex = _selected.clamp(0, categories.length - 1);
            final selected = categories[safeIndex];

            return Column(
              children: [
                _TopBar(
                  count: categories.length,
                  onSearch: () => context.push('/search'),
                ),
                Expanded(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: AnimatedSwitcher(
                          duration: AppMotion.medium,
                          switchInCurve: AppMotion.precise,
                          transitionBuilder: (child, anim) {
                            return FadeTransition(
                              opacity: anim,
                              child: SlideTransition(
                                position: Tween<Offset>(
                                  begin: const Offset(-0.05, 0),
                                  end: Offset.zero,
                                ).animate(anim),
                                child: child,
                              ),
                            );
                          },
                          child: _CategoryPanel(
                            key: ValueKey(selected.id),
                            category: selected,
                            index: safeIndex,
                            onBrowseAll: () => context.push(
                              '/products?categoryId=${selected.id}'
                              '&title=${Uri.encodeComponent(selected.name)}',
                            ),
                            onSubTap: (s) => context.push(
                              '/products?subcategoryId=${s.id}'
                              '&categoryId=${selected.id}'
                              '&title=${Uri.encodeComponent(s.name)}',
                            ),
                          ),
                        ),
                      ),
                      _SideRail(
                        categories: categories,
                        selected: safeIndex,
                        onSelect: (i) => setState(() => _selected = i),
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

class _TopBar extends StatelessWidget {
  const _TopBar({required this.count, required this.onSearch});
  final int count;
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.xl,
        AppSizes.lg,
        AppSizes.xl,
        AppSizes.md,
      ),
      child: Row(
        children: [
          Luxe.surfaceIconButton(
            icon: Icons.search_rounded,
            onTap: onSearch,
          ),
          const Spacer(),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'الفئات',
                style: AppTextStyles.editorial(
                  size: 26,
                  weight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Text(
                    'تشكيلة تناسب جمالكِ',
                    style: AppTextStyles.caption(
                      color: AppColors.textMuted,
                      size: 11,
                    ).copyWith(letterSpacing: 0.5),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    width: 4,
                    height: 4,
                    decoration: const BoxDecoration(
                      color: AppColors.gold,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '$count فئة',
                    style: AppTextStyles.caption(
                      color: AppColors.gold,
                      size: 11,
                    ).copyWith(fontWeight: FontWeight.w800),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SideRail extends StatelessWidget {
  const _SideRail({
    required this.categories,
    required this.selected,
    required this.onSelect,
  });

  final List<CategoryModel> categories;
  final int selected;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 80,
      child: ListView.builder(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(4, 0, 10, 24),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          return _RailItem(
            category: categories[index],
            isSelected: index == selected,
            onTap: () => onSelect(index),
          );
        },
      ),
    );
  }
}

class _RailItem extends StatelessWidget {
  const _RailItem({
    required this.category,
    required this.isSelected,
    required this.onTap,
  });

  final CategoryModel category;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return PressedScale(
      onTap: onTap,
      scale: 0.94,
      child: AnimatedContainer(
        duration: AppMotion.fast,
        curve: AppMotion.standard,
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.surface : Colors.transparent,
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          border: isSelected ? Border.all(color: AppColors.divider) : null,
          boxShadow: isSelected ? const [AppColors.softShadow] : null,
        ),
        child: Column(
          children: [
            Stack(
              alignment: AlignmentDirectional.centerEnd,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? const LinearGradient(
                            colors: [
                              AppColors.canvas,
                              AppColors.goldSoft,
                            ],
                          )
                        : null,
                    color: isSelected ? null : AppColors.canvas,
                    shape: BoxShape.circle,
                    border: isSelected
                        ? Border.all(
                            color: AppColors.gold.withValues(alpha: 0.4),
                          )
                        : null,
                  ),
                  child: Center(
                    child: Text(
                      category.icon,
                      style: const TextStyle(fontSize: 20),
                    ),
                  ),
                ),
                if (isSelected)
                  PositionedDirectional(
                    end: -6,
                    child: Container(
                      width: 3,
                      height: 24,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              category.name,
              style: AppTextStyles.caption(
                color: isSelected
                    ? AppColors.textPrimary
                    : AppColors.textMuted,
                size: 10,
              ).copyWith(
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryPanel extends StatelessWidget {
  const _CategoryPanel({
    super.key,
    required this.category,
    required this.index,
    required this.onBrowseAll,
    required this.onSubTap,
  });

  final CategoryModel category;
  final int index;
  final VoidCallback onBrowseAll;
  final ValueChanged<SubcategoryModel> onSubTap;

  @override
  Widget build(BuildContext context) {
    final tint = AppColors.productTints[index % AppColors.productTints.length];
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 6, 24),
      physics: const BouncingScrollPhysics(),
      children: [
        _HeroCard(
          category: category,
          tint: tint,
          onBrowseAll: onBrowseAll,
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Text(
              'الأقسام',
              style: AppTextStyles.title(size: 14).copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              '(${category.subcategories.length})',
              style: AppTextStyles.caption(
                color: AppColors.gold,
                size: 11,
              ).copyWith(fontWeight: FontWeight.w800),
            ),
          ],
        ),
        const SizedBox(height: 10),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 1.4,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: category.subcategories.length,
          itemBuilder: (context, i) {
            final sub = category.subcategories[i];
            final t = AppColors.productTints[(index + i + 1) % AppColors.productTints.length];
            return _SubcategoryCard(
              index: i,
              sub: sub,
              tint: t,
              onTap: () => onSubTap(sub),
            );
          },
        ),
      ],
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.category,
    required this.tint,
    required this.onBrowseAll,
  });

  final CategoryModel category;
  final Color tint;
  final VoidCallback onBrowseAll;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [tint, Color.lerp(tint, Colors.white, 0.5)!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppSizes.cardRadiusLg),
        border: Border.all(color: AppColors.divider),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned(
            right: -40,
            bottom: -40,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.gold.withValues(alpha: 0.3),
                ),
              ),
            ),
          ),
          Positioned(
            right: 20,
            top: 20,
            child: Text(
              category.icon,
              style: const TextStyle(fontSize: 60),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Luxe.editorialBadge(
                  label: 'تشكيلة فاخرة',
                  color: AppColors.primaryDark,
                  backgroundColor: AppColors.surface.withValues(alpha: 0.8),
                ),
                const SizedBox(height: 12),
                Text(
                  category.name,
                  style: AppTextStyles.editorial(
                    size: 24,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${category.subcategories.length} قسم',
                  style: AppTextStyles.caption(
                    color: AppColors.textSecondary,
                    size: 11,
                  ),
                ),
                const SizedBox(height: 12),
                Luxe.primaryButton(
                  label: 'عرض كل المنتجات',
                  icon: Icons.arrow_back_rounded,
                  height: 38,
                  onTap: onBrowseAll,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SubcategoryCard extends StatelessWidget {
  const _SubcategoryCard({
    required this.index,
    required this.sub,
    required this.tint,
    required this.onTap,
  });

  final int index;
  final SubcategoryModel sub;
  final Color tint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return PressedScale(
      onTap: onTap,
      scale: 0.96,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 10, 10, 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          border: Border.all(color: AppColors.divider),
          boxShadow: const [AppColors.softShadow],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: tint,
                    shape: BoxShape.circle,
                  ),
                ),
                const Spacer(),
                Text(
                  (index + 1).toString().padLeft(2, '0'),
                  style: AppTextStyles.serif(
                    color: AppColors.gold,
                    size: 16,
                    weight: FontWeight.w400,
                    style: FontStyle.italic,
                  ),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  sub.name,
                  style: AppTextStyles.title(size: 12.5).copyWith(
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      '${sub.productCount} منتج',
                      style: AppTextStyles.caption(
                        color: AppColors.textMuted,
                        size: 10,
                      ),
                    ),
                    const Spacer(),
                    const Icon(
                      Icons.arrow_back_rounded,
                      size: 14,
                      color: AppColors.primaryDark,
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
