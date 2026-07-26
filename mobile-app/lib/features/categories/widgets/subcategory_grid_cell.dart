import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/category.dart';
import 'categories_theme.dart';
import 'category_line_art.dart';
import 'category_visual_card.dart';

/// خلية قسم فرعي: بطاقة تفتح المنتجات + سهم لإظهار الأقسام الثانوية.
class SubcategoryGridCell extends StatefulWidget {
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

  @override
  State<SubcategoryGridCell> createState() => _SubcategoryGridCellState();
}

class _SubcategoryGridCellState extends State<SubcategoryGridCell> {
  bool _expanded = false;

  @override
  void didUpdateWidget(covariant SubcategoryGridCell oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.subcategory.id != widget.subcategory.id) {
      _expanded = false;
    }
  }

  bool get _hasTertiary => widget.subcategory.children.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CategoryVisualCard(
          category: widget.subcategory,
          lang: widget.lang,
          onTap: widget.onOpenSub,
        ),
        if (_hasTertiary) ...[
          const SizedBox(height: 6),
          _ExpandButton(
            expanded: _expanded,
            count: widget.subcategory.children.length,
            onTap: () {
              HapticFeedback.selectionClick();
              setState(() => _expanded = !_expanded);
            },
          ),
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 220),
            crossFadeState:
                _expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
            firstChild: const SizedBox.shrink(),
            secondChild: _TertiaryList(
              subcategory: widget.subcategory,
              lang: widget.lang,
              onOpen: widget.onOpenTertiary,
            ),
          ),
        ],
      ],
    );
  }
}

class _ExpandButton extends StatelessWidget {
  final bool expanded;
  final int count;
  final VoidCallback onTap;

  const _ExpandButton({
    required this.expanded,
    required this.count,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return CategoriesFramedSurface(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedRotation(
              turns: expanded ? 0.5 : 0,
              duration: const Duration(milliseconds: 220),
              curve: CategoriesTheme.curve,
              child: Icon(
                Icons.keyboard_arrow_down_rounded,
                size: 20,
                color: AppColors.textMuted.withValues(alpha: 0.9),
              ),
            ),
            if (!expanded && count > 0) ...[
              const SizedBox(width: 2),
              Text(
                '$count',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMuted.withValues(alpha: 0.85),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _TertiaryList extends StatelessWidget {
  final Category subcategory;
  final String lang;
  final void Function(Category tertiary) onOpen;

  const _TertiaryList({
    required this.subcategory,
    required this.lang,
    required this.onOpen,
  });

  @override
  Widget build(BuildContext context) {
    final items = subcategory.children;
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) const SizedBox(height: 6),
            _TertiaryRow(
              item: items[i],
              lang: lang,
              onTap: () => onOpen(items[i]),
            ),
          ],
        ],
      ),
    );
  }
}

class _TertiaryRow extends StatelessWidget {
  final Category item;
  final String lang;
  final VoidCallback onTap;

  const _TertiaryRow({
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
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        child: Row(
          children: [
            SizedBox(
              width: 32,
              height: 32,
              child: CategoryLineArt(category: item, size: 32),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                item.localizedName(lang),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  height: 1.2,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              size: 18,
              color: AppColors.textMuted.withValues(alpha: 0.7),
            ),
          ],
        ),
      ),
    );
  }
}
