import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/search_suggestions.dart';
import '../../worlds/world_theme.dart';
import '../search_strings.dart';
import '../search_suggest_merge.dart';
import 'search_product_tile.dart' show HighlightedText;

/// لوحة الاقتراحات الحية أثناء الكتابة.
class SearchSuggestionsPanel extends StatelessWidget {
  final AppStrings s;
  final String query;
  final MergedSuggestions merged;
  final List<SuggestProduct> products;
  final String? correction;
  final bool loading;
  final bool failed;
  final VoidCallback onSeeAll;
  final ValueChanged<String> onCorrection;
  final ValueChanged<SuggestEntry> onEntry;
  final ValueChanged<SuggestProduct> onProduct;

  const SearchSuggestionsPanel({
    super.key,
    required this.s,
    required this.query,
    required this.merged,
    required this.products,
    required this.onSeeAll,
    required this.onCorrection,
    required this.onEntry,
    required this.onProduct,
    this.correction,
    this.loading = false,
    this.failed = false,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return ListView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: const EdgeInsets.only(bottom: 32),
      children: [
        if (correction != null)
          _DidYouMean(
            label: s.searchDidYouMean,
            mark: s.searchQuestionMark,
            term: correction!,
            onTap: () => onCorrection(correction!),
          ),
        _SeeAllRow(label: s.searchSeeAllFor(query), onTap: onSeeAll),
        if (merged.categories.isNotEmpty) ...[
          _PanelLabel(s.searchSuggestCategories),
          for (final e in merged.categories)
            _CategoryRow(entry: e, query: query, onTap: () => onEntry(e)),
        ],
        if (merged.brands.isNotEmpty) ...[
          _PanelLabel(s.searchSuggestBrands),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final b in merged.brands)
                  _BrandChip(entry: b, onTap: () => onEntry(b)),
              ],
            ),
          ),
        ],
        if (products.isNotEmpty) ...[
          _PanelLabel(s.searchSuggestProducts),
          for (final p in products)
            _ProductRow(product: p, query: query, onTap: () => onProduct(p)),
        ] else if (loading) ...[
          _PanelLabel(s.searchSuggestProducts),
          for (var i = 0; i < 3; i++) const _ProductRowSkeleton(),
        ],
        if (failed && products.isEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
            child: Row(
              children: [
                Icon(Icons.cloud_off_rounded, size: 18, color: t.inkMuted),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    s.searchSuggestOffline,
                    style: AppText.caption.copyWith(color: t.inkMuted),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _PanelLabel extends StatelessWidget {
  final String text;
  const _PanelLabel(this.text);

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 20, 16, 8),
      child: Row(
        children: [
          Container(
            width: 3,
            height: 14,
            decoration: BoxDecoration(
              color: t.accent,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: AppText.label.copyWith(
              color: t.inkSoft,
              fontWeight: FontWeight.w800,
              fontSize: 12.5,
            ),
          ),
        ],
      ),
    );
  }
}

/// «هل تقصدين …؟» — يعيد البحث بالكلمة المصحّحة.
class _DidYouMean extends StatelessWidget {
  final String label;
  final String mark;
  final String term;
  final VoidCallback onTap;

  const _DidYouMean({
    required this.label,
    required this.mark,
    required this.term,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Material(
        color: t.accentLight,
        borderRadius: BorderRadius.circular(AppCorners.md),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppCorners.md),
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: Container(
            constraints: const BoxConstraints(minHeight: kMinTapTarget + 4),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppCorners.md),
              border: Border.all(color: t.accentSoft),
            ),
            child: Row(
              children: [
                Icon(Icons.auto_fix_high_rounded, size: 18, color: t.accent),
                const SizedBox(width: 10),
                Expanded(
                  child: Text.rich(
                    TextSpan(
                      style: AppText.bodySmall.copyWith(color: t.inkSoft),
                      children: [
                        TextSpan(text: '$label '),
                        TextSpan(
                          text: '«$term»',
                          style: AppText.label.copyWith(
                            color: t.accentDark,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        TextSpan(text: mark),
                      ],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: t.accentDark,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SeeAllRow extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _SeeAllRow({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            gradient: LinearGradient(
              begin: AlignmentDirectional.centerStart.resolve(
                Directionality.of(context),
              ),
              end: AlignmentDirectional.centerEnd.resolve(
                Directionality.of(context),
              ),
              colors: [t.accentLight, t.surface],
            ),
            border: Border.all(color: t.accentSoft),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color.lerp(t.accent, Colors.white, 0.15)!,
                      t.accentDark,
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: t.accent.withValues(alpha: 0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.search_rounded,
                  size: 20,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.title3.copyWith(color: t.ink, fontSize: 14.5),
                ),
              ),
              Icon(Icons.arrow_forward_rounded, size: 20, color: t.accentDark),
              const SizedBox(width: 6),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryRow extends StatelessWidget {
  final SuggestEntry entry;
  final String query;
  final VoidCallback onTap;

  const _CategoryRow({
    required this.entry,
    required this.query,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 52),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(
            children: [
              SearchRoundThumb(
                url: entry.imageUrl,
                icon: Icons.grid_view_rounded,
                size: 40,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    HighlightedText(
                      text: entry.title,
                      query: query,
                      maxLinesGuard: 1,
                      base: AppText.label.copyWith(color: t.ink, fontSize: 14),
                    ),
                    if (entry.subtitle != null && entry.subtitle!.isNotEmpty)
                      Text(
                        entry.subtitle!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.caption.copyWith(color: t.inkMuted),
                      ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, size: 20, color: t.inkMuted),
            ],
          ),
        ),
      ),
    );
  }
}

class _BrandChip extends StatelessWidget {
  final SuggestEntry entry;
  final VoidCallback onTap;
  const _BrandChip({required this.entry, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Semantics(
      button: true,
      label: entry.title,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: Container(
          height: kMinTapTarget,
          padding: const EdgeInsetsDirectional.fromSTEB(5, 5, 14, 5),
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: BorderRadius.circular(AppCorners.pill),
            border: Border.all(color: t.hairline),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SearchRoundThumb(
                url: entry.imageUrl,
                label: entry.title,
                size: 32,
                contain: true,
              ),
              const SizedBox(width: 8),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 160),
                child: Text(
                  entry.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.label.copyWith(color: t.ink),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  final SuggestProduct product;
  final String query;
  final VoidCallback onTap;

  const _ProductRow({
    required this.product,
    required this.query,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final old = product.oldPrice;
    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        child: Row(
          children: [
            Container(
              width: 64,
              height: 64,
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: t.accentDark.withValues(alpha: 0.07),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: AppNetworkImage(
                url: product.imageUrl ?? '',
                fit: BoxFit.contain,
                width: 52,
                height: 52,
                radius: BorderRadius.circular(AppCorners.xs),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (product.brandName != null)
                    Text(
                      product.brandName!.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.micro.copyWith(
                        color: t.inkMuted,
                        letterSpacing: 0.5,
                        fontSize: 10.5,
                      ),
                    ),
                  const SizedBox(height: 2),
                  HighlightedText(
                    text: product.name,
                    query: query,
                    maxLinesGuard: 2,
                    base: AppText.bodySmall.copyWith(
                      color: t.ink,
                      height: 1.35,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        formatPrice(product.price),
                        style: AppText.label.copyWith(
                          color: old != null ? AppColors.sale : t.ink,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      if (old != null) ...[
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            formatPrice(old),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppText.caption.copyWith(
                              fontSize: 11,
                              color: t.inkMuted,
                              decoration: TextDecoration.lineThrough,
                              decorationColor: t.inkMuted,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        DiscountBadge(percent: product.discountPercent),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductRowSkeleton extends StatelessWidget {
  const _ProductRowSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 7),
      child: Row(
        children: [
          ShimmerBox(width: 58, height: 58, radius: AppCorners.sm),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerBox(width: 60, height: 9, radius: 5),
                SizedBox(height: 7),
                ShimmerBox(width: 190, height: 11, radius: 6),
                SizedBox(height: 7),
                ShimmerBox(width: 80, height: 11, radius: 6),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// صورة دائرية صغيرة مع بديل أيقونة/حرف أول.
class SearchRoundThumb extends StatelessWidget {
  final String url;
  final IconData? icon;
  final String? label;
  final double size;
  final bool contain;

  const SearchRoundThumb({
    super.key,
    required this.url,
    this.icon,
    this.label,
    this.size = 40,
    this.contain = false,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final fallback = Center(
      child: label != null && label!.trim().isNotEmpty
          ? Text(
              label!.trim().characters.first.toUpperCase(),
              style: AppText.label.copyWith(
                color: t.accentDark,
                fontSize: size * 0.4,
              ),
            )
          : Icon(
              icon ?? Icons.search_rounded,
              size: size * 0.48,
              color: t.accentDark,
            ),
    );
    return Container(
      width: size,
      height: size,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: url.isEmpty ? t.accentLight : Colors.white,
        shape: BoxShape.circle,
        border: Border.all(
          color: url.isEmpty ? t.accentSoft : t.hairline.withValues(alpha: 0.8),
        ),
      ),
      child: url.isEmpty
          ? fallback
          : Padding(
              padding: EdgeInsets.all(contain ? size * 0.12 : 0),
              child: AppNetworkImage(
                url: url,
                width: size,
                height: size,
                fit: contain ? BoxFit.contain : BoxFit.cover,
              ),
            ),
    );
  }
}
