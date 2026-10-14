import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../worlds/world_theme.dart';
import 'listing_theme.dart';

/// حالة الفلاتر السريعة المعروضة في شريط الرأس.
class ListingQuickFilters {
  final String sortLabel;
  final bool sortActive;
  final String? priceLabel;
  final bool inStock;
  final bool onSale;
  final bool showOnSale;
  final String? ratingLabel;
  final int activeCount;
  final int? total;

  const ListingQuickFilters({
    required this.sortLabel,
    required this.sortActive,
    required this.priceLabel,
    required this.inStock,
    required this.onSale,
    required this.showOnSale,
    required this.ratingLabel,
    required this.activeCount,
    required this.total,
  });
}

/// رأس صفحة المنتجات — مدمج ليترك المساحة للمنتجات:
/// رجوع + عنوان ومسار + بحث/مسح، ثم شريط فلاتر سريع وعدد النتائج.
class ListingPageHeader extends ConsumerWidget {
  final String title;
  final String? subtitle;
  final ListingQuickFilters filters;
  final VoidCallback onSort;
  final VoidCallback onPrice;
  final VoidCallback onToggleInStock;
  final VoidCallback onToggleSale;
  final VoidCallback onRating;
  final VoidCallback onAllFilters;
  final VoidCallback onClearAll;

  const ListingPageHeader({
    super.key,
    required this.title,
    required this.filters,
    required this.onSort,
    required this.onPrice,
    required this.onToggleInStock,
    required this.onToggleSale,
    required this.onRating,
    required this.onAllFilters,
    required this.onClearAll,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final f = filters;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent),
      child: Material(
        color: ListingTheme.headerBg(context),
        elevation: 0,
        child: DecoratedBox(
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: t.hairline.withValues(alpha: 0.7))),
          ),
          child: SafeArea(
            bottom: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(6, 4, 8, 0),
                  child: Row(
                    children: [
                      const AppBackButton(),
                      const SizedBox(width: 2),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.title2.copyWith(color: t.ink, height: 1.2),
                            ),
                            if (subtitle != null && subtitle!.isNotEmpty)
                              Text(
                                subtitle!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppText.caption.copyWith(color: t.inkMuted),
                              ),
                          ],
                        ),
                      ),
                      AppIconButton(
                        icon: Icons.search_rounded,
                        tooltip: s.searchHint,
                        onTap: () => context.push('/search'),
                      ),
                      AppIconButton(
                        icon: Icons.qr_code_scanner_rounded,
                        tooltip: s.scan,
                        onTap: () => context.push('/scan'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                SizedBox(
                  height: 36,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: ListingTheme.padH),
                    children: [
                      AppChoiceChip(
                        label: s.filter,
                        icon: Icons.tune_rounded,
                        selected: f.activeCount > 0,
                        count: f.activeCount,
                        onTap: onAllFilters,
                      ),
                      const SizedBox(width: 8),
                      AppChoiceChip(
                        label: f.sortLabel,
                        icon: Icons.swap_vert_rounded,
                        selected: f.sortActive,
                        showChevron: true,
                        onTap: onSort,
                      ),
                      const SizedBox(width: 8),
                      AppChoiceChip(
                        label: f.priceLabel ?? s.lfPrice,
                        selected: f.priceLabel != null,
                        showChevron: true,
                        onTap: onPrice,
                      ),
                      const SizedBox(width: 8),
                      AppChoiceChip(
                        label: s.lfInStock,
                        icon: f.inStock ? Icons.check_rounded : null,
                        selected: f.inStock,
                        onTap: onToggleInStock,
                      ),
                      if (f.showOnSale) ...[
                        const SizedBox(width: 8),
                        AppChoiceChip(
                          label: s.lfOffers,
                          icon: f.onSale ? Icons.check_rounded : Icons.local_offer_outlined,
                          selected: f.onSale,
                          onTap: onToggleSale,
                        ),
                      ],
                      const SizedBox(width: 8),
                      AppChoiceChip(
                        label: f.ratingLabel ?? s.lfRating,
                        icon: Icons.star_rounded,
                        selected: f.ratingLabel != null,
                        showChevron: true,
                        onTap: onRating,
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(ListingTheme.padH + 2, 8, ListingTheme.padH - 4, 6),
                  child: SizedBox(
                    height: 24,
                    child: Row(
                      children: [
                        Expanded(
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 200),
                            layoutBuilder: (current, previous) => Stack(
                              alignment: AlignmentDirectional.centerStart,
                              children: [...previous, if (current != null) current],
                            ),
                            child: Text(
                              f.total == null ? '' : s.lfResults(_fmt(f.total!)),
                              key: ValueKey(f.total),
                              style: AppText.caption.copyWith(color: t.inkSoft, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                        if (f.activeCount > 0)
                          TextButton(
                            onPressed: onClearAll,
                            style: TextButton.styleFrom(
                              minimumSize: const Size(44, 24),
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              foregroundColor: t.accentDark,
                            ),
                            child: Text(s.lfClearAll, style: AppText.label.copyWith(fontSize: 12)),
                          ),
                      ],
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

  static String _fmt(int n) {
    final str = n.toString();
    final b = StringBuffer();
    for (var i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) b.write(',');
      b.write(str[i]);
    }
    return b.toString();
  }
}
