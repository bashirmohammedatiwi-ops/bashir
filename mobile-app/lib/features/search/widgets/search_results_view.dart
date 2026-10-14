import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/product_grid.dart';
import '../../../core/widgets/scroll_perf.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../core/widgets/states.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/product.dart';
import '../../worlds/world_theme.dart';
import '../search_strings.dart';
import '../search_suggest_merge.dart';
import 'search_suggestions_panel.dart' show SearchRoundThumb;

/// عرض النتائج: عنوان + عدد + فلترة وترتيب + شبكة ProductCard مع تحميل تدريجي.
class SearchResultsView extends StatelessWidget {
  final AppStrings s;
  final String query;
  final List<Product> items;
  final int total;
  final bool loading;
  final bool loadingMore;
  final bool hasNext;
  final String? error;
  final String? moreError;
  final List<String> synonyms;
  final List<SuggestEntry> related;
  final String? correction;
  final VoidCallback onRetry;
  final VoidCallback onLoadMore;
  final VoidCallback onFilter;
  final ValueChanged<String> onTerm;
  final ValueChanged<SuggestEntry> onEntry;
  final VoidCallback onBrowseCategories;

  const SearchResultsView({
    super.key,
    required this.s,
    required this.query,
    required this.items,
    required this.total,
    required this.loading,
    required this.loadingMore,
    required this.hasNext,
    required this.synonyms,
    required this.related,
    required this.onRetry,
    required this.onLoadMore,
    required this.onFilter,
    required this.onTerm,
    required this.onEntry,
    required this.onBrowseCategories,
    this.error,
    this.moreError,
    this.correction,
  });

  @override
  Widget build(BuildContext context) {
    if (error != null && items.isEmpty) {
      return ErrorView(message: error!, onRetry: onRetry);
    }
    if (!loading && items.isEmpty) {
      return SearchEmptyView(
        s: s,
        query: query,
        correction: correction,
        synonyms: synonyms,
        related: related,
        onTerm: onTerm,
        onEntry: onEntry,
        onBrowseCategories: onBrowseCategories,
      );
    }

    final t = context.worldTheme;
    final showSkeleton = loading && items.isEmpty;
    return NotificationListener<ScrollNotification>(
      onNotification: (n) {
        if (n.metrics.axis == Axis.vertical &&
            n.metrics.extentAfter < 700 &&
            hasNext &&
            !loadingMore &&
            moreError == null) {
          onLoadMore();
        }
        return false;
      },
      child: CustomScrollView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        physics: AppScrollPerf.physics,
        cacheExtent: AppScrollPerf.gridCacheExtent,
        slivers: [
          SliverToBoxAdapter(
            child: _ResultsHeader(
              title: s.searchResultsFor(query),
              count: showSkeleton ? null : s.searchResultsCount(total),
              filterLabel: s.searchFilterSort,
              onFilter: showSkeleton ? null : onFilter,
            ),
          ),
          if (synonyms.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 8),
                child: Text(
                  '${s.alsoMatches}: ${synonyms.join(' · ')}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.caption.copyWith(color: t.accentDark, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          if (related.isNotEmpty)
            SliverToBoxAdapter(
              child: _RelatedStrip(entries: related, onTap: onEntry),
            ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
            sliver: SliverGrid(
              gridDelegate: ProductGrid.delegateFor(context, listing: true),
              delegate: SliverChildBuilderDelegate(
                (context, i) {
                  if (showSkeleton || i >= items.length) {
                    return const ShimmerBox(height: double.infinity, radius: ProductCard.radius);
                  }
                  final p = items[i];
                  return RepaintBoundary(
                    child: ProductCard(
                      key: ValueKey(p.id),
                      product: p,
                      showRating: true,
                      showPromoBadge: true,
                      style: ProductCardStyle.listing,
                    ),
                  );
                },
                childCount: showSkeleton ? 6 : items.length + (loadingMore ? 2 : 0),
                addAutomaticKeepAlives: false,
                addRepaintBoundaries: false,
              ),
            ),
          ),
          if (!showSkeleton)
            SliverToBoxAdapter(
              child: _Footer(
                s: s,
                hasNext: hasNext,
                loadingMore: loadingMore,
                failed: moreError != null,
                onLoadMore: onLoadMore,
              ),
            ),
        ],
      ),
    );
  }
}

class _ResultsHeader extends StatelessWidget {
  final String title;
  final String? count;
  final String filterLabel;
  final VoidCallback? onFilter;

  const _ResultsHeader({required this.title, required this.count, required this.filterLabel, this.onFilter});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 12, 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.title2.copyWith(color: t.ink),
                ),
                const SizedBox(height: 2),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: count == null
                      ? const ShimmerBox(key: ValueKey('c'), width: 70, height: 10, radius: 5)
                      : Text(
                          count!,
                          key: ValueKey(count),
                          style: AppText.caption.copyWith(color: t.inkMuted, fontWeight: FontWeight.w600),
                        ),
                ),
              ],
            ),
          ),
          if (onFilter != null)
            Semantics(
              button: true,
              child: InkWell(
                borderRadius: BorderRadius.circular(AppCorners.pill),
                onTap: () {
                  HapticFeedback.selectionClick();
                  onFilter!();
                },
                child: Container(
                  height: 40,
                  padding: const EdgeInsetsDirectional.fromSTEB(12, 0, 14, 0),
                  decoration: BoxDecoration(
                    color: t.accentLight,
                    borderRadius: BorderRadius.circular(AppCorners.pill),
                    border: Border.all(color: t.accentSoft),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.tune_rounded, size: 17, color: t.accentDark),
                      const SizedBox(width: 6),
                      Text(filterLabel, style: AppText.label.copyWith(color: t.accentDark)),
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

class _RelatedStrip extends StatelessWidget {
  final List<SuggestEntry> entries;
  final ValueChanged<SuggestEntry> onTap;
  const _RelatedStrip({required this.entries, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        itemCount: entries.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) => SearchEntryChip(entry: entries[i], onTap: () => onTap(entries[i])),
      ),
    );
  }
}

/// شريحة قسم/براند صغيرة بصورة دائرية.
class SearchEntryChip extends StatelessWidget {
  final SuggestEntry entry;
  final VoidCallback onTap;
  const SearchEntryChip({super.key, required this.entry, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final isBrand = entry.kind == SuggestKind.brand;
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
          height: 44,
          padding: const EdgeInsetsDirectional.fromSTEB(4, 4, 14, 4),
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
                icon: Icons.grid_view_rounded,
                label: isBrand ? entry.title : null,
                size: 34,
                contain: isBrand,
              ),
              const SizedBox(width: 8),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 170),
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

class _Footer extends StatelessWidget {
  final AppStrings s;
  final bool hasNext;
  final bool loadingMore;
  final bool failed;
  final VoidCallback onLoadMore;

  const _Footer({
    required this.s,
    required this.hasNext,
    required this.loadingMore,
    required this.failed,
    required this.onLoadMore,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final Widget child;
    if (loadingMore) {
      child = SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: t.accent));
    } else if (hasNext || failed) {
      child = OutlinedButton.icon(
        onPressed: () {
          HapticFeedback.selectionClick();
          onLoadMore();
        },
        icon: Icon(failed ? Icons.refresh_rounded : Icons.expand_more_rounded, size: 18),
        label: Text(failed ? s.retry : s.searchLoadMore),
        style: OutlinedButton.styleFrom(
          foregroundColor: t.accentDark,
          side: BorderSide(color: t.accentSoft),
          minimumSize: const Size(140, kMinTapTarget),
          shape: const StadiumBorder(),
          textStyle: AppText.label,
        ),
      );
    } else {
      child = Row(
        children: [
          Expanded(child: Divider(color: t.divider, endIndent: 12)),
          Text(s.searchEndOfResults, style: AppText.caption.copyWith(color: t.inkMuted)),
          Expanded(child: Divider(color: t.divider, indent: 12)),
        ],
      );
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 36),
      child: Center(child: child),
    );
  }
}

/// حالة «لا نتائج» مفيدة: تصحيح + مرادفات + أقسام مقترحة + تصفّح الأقسام.
class SearchEmptyView extends StatelessWidget {
  final AppStrings s;
  final String query;
  final String? correction;
  final List<String> synonyms;
  final List<SuggestEntry> related;
  final ValueChanged<String> onTerm;
  final ValueChanged<SuggestEntry> onEntry;
  final VoidCallback onBrowseCategories;

  const SearchEmptyView({
    super.key,
    required this.s,
    required this.query,
    required this.synonyms,
    required this.related,
    required this.onTerm,
    required this.onEntry,
    required this.onBrowseCategories,
    this.correction,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final terms = <String>[if (correction != null) correction!, ...synonyms.where((e) => e != correction)];
    return ListView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: const EdgeInsets.fromLTRB(24, 36, 24, 32),
      children: [
        Center(
          child: Container(
            width: 84,
            height: 84,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: AlignmentDirectional.topStart,
                end: AlignmentDirectional.bottomEnd,
                colors: [t.accentLight, t.accentSoft],
              ),
            ),
            child: Icon(Icons.search_off_rounded, size: 38, color: t.accentDark),
          ),
        ),
        const SizedBox(height: 18),
        Text(
          s.searchNoResultsTitle(query),
          textAlign: TextAlign.center,
          style: AppText.title2.copyWith(color: t.ink),
        ),
        const SizedBox(height: 6),
        Text(
          s.searchNoResultsBody,
          textAlign: TextAlign.center,
          style: AppText.bodySmall.copyWith(color: t.inkSoft),
        ),
        if (terms.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text(
            s.searchTryAlso,
            textAlign: TextAlign.center,
            style: AppText.micro.copyWith(color: t.inkMuted),
          ),
          const SizedBox(height: 10),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final (i, term) in terms.indexed)
                AppChoiceChip(
                  label: term,
                  selected: i == 0 && correction != null,
                  icon: i == 0 && correction != null ? Icons.auto_fix_high_rounded : Icons.search_rounded,
                  onTap: () => onTerm(term),
                ),
            ],
          ),
        ],
        if (related.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text(
            s.searchBrowseAlso,
            textAlign: TextAlign.center,
            style: AppText.micro.copyWith(color: t.inkMuted),
          ),
          const SizedBox(height: 10),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 8,
            children: [for (final e in related) SearchEntryChip(entry: e, onTap: () => onEntry(e))],
          ),
        ],
        const SizedBox(height: 28),
        Center(
          child: FilledButton.icon(
            onPressed: () {
              HapticFeedback.selectionClick();
              onBrowseCategories();
            },
            icon: const Icon(Icons.grid_view_rounded, size: 18),
            label: Text(s.searchBrowseCategories),
            style: FilledButton.styleFrom(
              backgroundColor: t.accent,
              foregroundColor: t.surface,
              minimumSize: const Size(200, kMinTapTarget + 4),
              shape: const StadiumBorder(),
              textStyle: AppText.label.copyWith(fontSize: 14),
            ),
          ),
        ),
      ],
    );
  }
}
