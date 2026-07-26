import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/category.dart';
import 'categories_theme.dart';
import 'category_line_art.dart';
import 'category_visual_card.dart';

/// بطاقة قسم فرعي — صورة كبيرة + شريط ثانوي أسفل الصورة (بدون تغطية).
class SubcategoryGridCell extends StatelessWidget {
  final Category subcategory;
  final String lang;
  final VoidCallback onOpenSub;
  final void Function(Category tertiary) onOpenTertiary;

  const SubcategoryGridCell({
    super.key,
    required this.subcategory,
    required this.lang,
    required this.onOpenSub,
    required this.onOpenTertiary,
  });

  bool get _hasTertiary => subcategory.children.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    return CategoryVisualCard(
      category: subcategory,
      lang: lang,
      aspectRatio: CategoriesTheme.subCardAspectRatio,
      onTap: onOpenSub,
      footer: _SubcategoryFooterSlot(
        hasTertiary: _hasTertiary,
        count: subcategory.children.length,
        lang: lang,
        onTapTertiary: () => _openTertiarySheet(context),
      ),
    );
  }

  void _openTertiarySheet(BuildContext context) {
    HapticFeedback.lightImpact();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _TertiaryPickerSheet(
        subcategory: subcategory,
        lang: lang,
        onOpenSub: onOpenSub,
        onOpenTertiary: onOpenTertiary,
      ),
    );
  }
}

class _SubcategoryFooterSlot extends StatelessWidget {
  final bool hasTertiary;
  final int count;
  final String lang;
  final VoidCallback onTapTertiary;

  const _SubcategoryFooterSlot({
    required this.hasTertiary,
    required this.count,
    required this.lang,
    required this.onTapTertiary,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: CategoriesTheme.subFooterHeight,
      child: DecoratedBox(
        decoration: const BoxDecoration(
          color: Color(0xFFFAFAFA),
          border: Border(
            top: BorderSide(color: CategoriesTheme.cardBorderColor),
          ),
        ),
        child: hasTertiary
            ? Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    onTapTertiary();
                  },
                  child: _TertiaryFooterContent(count: count, lang: lang),
                ),
              )
            : const _TertiaryFooterPlaceholder(),
      ),
    );
  }
}

class _TertiaryFooterPlaceholder extends StatelessWidget {
  const _TertiaryFooterPlaceholder();

  @override
  Widget build(BuildContext context) {
    return const SizedBox.expand();
  }
}

class _TertiaryFooterContent extends StatelessWidget {
  final int count;
  final String lang;

  const _TertiaryFooterContent({
    required this.count,
    required this.lang,
  });

  @override
  Widget build(BuildContext context) {
    final s = AppStrings(lang);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              s.tertiaryCategory,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w600,
                color: AppColors.textMuted.withValues(alpha: 0.95),
              ),
            ),
          ),
          _TertiaryChevronChip(count: count),
        ],
      ),
    );
  }
}

/// سهم أنيق بعدد الأقسام الثانوية — خارج منطقة الصورة.
class _TertiaryChevronChip extends StatelessWidget {
  final int count;

  const _TertiaryChevronChip({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.14)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$count',
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
              height: 1,
            ),
          ),
          const SizedBox(width: 1),
          Icon(
            Icons.keyboard_arrow_down_rounded,
            size: 17,
            color: AppColors.primary.withValues(alpha: 0.85),
          ),
        ],
      ),
    );
  }
}

class _TertiaryPickerSheet extends StatelessWidget {
  final Category subcategory;
  final String lang;
  final VoidCallback onOpenSub;
  final void Function(Category tertiary) onOpenTertiary;

  const _TertiaryPickerSheet({
    required this.subcategory,
    required this.lang,
    required this.onOpenSub,
    required this.onOpenTertiary,
  });

  @override
  Widget build(BuildContext context) {
    final s = AppStrings(lang);
    final items = subcategory.children;
    final bottom = MediaQuery.paddingOf(context).bottom;

    return DraggableScrollableSheet(
      initialChildSize: 0.52,
      minChildSize: 0.32,
      maxChildSize: 0.88,
      expand: false,
      builder: (context, scrollController) {
        return DecoratedBox(
          decoration: const BoxDecoration(
            color: CategoriesTheme.canvas,
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            boxShadow: [
              BoxShadow(
                color: Color(0x22000000),
                blurRadius: 24,
                offset: Offset(0, -4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 10),
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD8D8D8),
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: ColoredBox(
                        color: CategoriesTheme.imageBg,
                        child: SizedBox(
                          width: 44,
                          height: 44,
                          child: CategoryLineArt(category: subcategory, size: 44),
                        ),
                      ),
                    ),
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
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            s.browseTertiarySections,
                            style: AppTypography.caption.copyWith(fontSize: 11.5),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: _ViewAllProductsButton(
                  label: s.allSectionProducts,
                  onTap: () {
                    Navigator.pop(context);
                    onOpenSub();
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: Text(
                  s.selectTertiarySection,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.15,
                  ),
                ),
              ),
              Expanded(
                child: ListView.separated(
                  controller: scrollController,
                  padding: EdgeInsets.fromLTRB(16, 0, 16, bottom + 16),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    final item = items[i];
                    return _TertiarySheetTile(
                      item: item,
                      lang: lang,
                      onTap: () {
                        Navigator.pop(context);
                        onOpenTertiary(item);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ViewAllProductsButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _ViewAllProductsButton({
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: CategoriesTheme.imageBg,
      borderRadius: BorderRadius.circular(CategoriesTheme.cardRadius),
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        borderRadius: BorderRadius.circular(CategoriesTheme.cardRadius),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
          child: Row(
            children: [
              Icon(
                Icons.grid_view_rounded,
                size: 18,
                color: AppColors.primary.withValues(alpha: 0.9),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ),
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 13,
                color: AppColors.primary.withValues(alpha: 0.7),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TertiarySheetTile extends StatelessWidget {
  final Category item;
  final String lang;
  final VoidCallback onTap;

  const _TertiarySheetTile({
    required this.item,
    required this.lang,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return CategoriesFramedSurface(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      withGlow: false,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(5),
              child: ColoredBox(
                color: CategoriesTheme.imageBg,
                child: SizedBox(
                  width: 40,
                  height: 40,
                  child: CategoryLineArt(category: item, size: 40),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                item.localizedName(lang),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  height: 1.25,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              size: 20,
              color: AppColors.textMuted.withValues(alpha: 0.65),
            ),
          ],
        ),
      ),
    );
  }
}

/// مقدمة أنيقة لصفحة الأقسام الفرعية.
class SubcategoryExplorerHeader extends StatelessWidget {
  final Category category;
  final String lang;
  final int subCount;
  final VoidCallback onViewAll;
  final bool hasTertiarySections;

  const SubcategoryExplorerHeader({
    super.key,
    required this.category,
    required this.lang,
    required this.subCount,
    required this.onViewAll,
    this.hasTertiarySections = false,
  });

  @override
  Widget build(BuildContext context) {
    final s = AppStrings(lang);

    return Padding(
      padding: const EdgeInsets.fromLTRB(CategoriesTheme.pad, 4, CategoriesTheme.pad, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: ColoredBox(
                  color: CategoriesTheme.imageBg,
                  child: SizedBox(
                    width: 72,
                    height: 72,
                    child: CategoryLineArt(
                      category: category,
                      size: 72,
                      expand: true,
                      alignCorner: true,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      category.localizedName(lang),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      s.subcategoryCount(subCount),
                      style: AppTypography.caption.copyWith(fontSize: 12.5),
                    ),
                    const SizedBox(height: 10),
                    _ExplorerActionChip(
                      label: s.allSectionProducts,
                      onTap: onViewAll,
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (hasTertiarySections) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: const Color(0xFFF8F8F8),
                borderRadius: BorderRadius.circular(CategoriesTheme.cardRadius),
                border: Border.all(color: CategoriesTheme.cardBorderColor),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline_rounded,
                    size: 15,
                    color: AppColors.textMuted.withValues(alpha: 0.8),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      s.tertiarySectionsHint,
                      style: AppTypography.caption.copyWith(
                        fontSize: 11.5,
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Text(
                  s.subcategories,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.2,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}

class _ExplorerActionChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _ExplorerActionChip({
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.primary.withValues(alpha: 0.07),
      borderRadius: BorderRadius.circular(99),
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        borderRadius: BorderRadius.circular(99),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 4),
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 11,
                color: AppColors.primary.withValues(alpha: 0.75),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
