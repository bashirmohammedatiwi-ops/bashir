import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_fonts.dart';
import '../../../core/widgets/app_search_scan_bar.dart';
import '../../../core/widgets/listing_toolbar.dart';
import '../../worlds/world_theme.dart';
import 'listing_theme.dart';

/// رأس صفحة المنتجات — بحث + باركود + فلاتر.
class ListingPageHeader extends ConsumerWidget {
  final String title;
  final String sortLabel;
  final String filterLabel;
  final VoidCallback onSort;
  final VoidCallback onFilter;
  final bool hasFilter;
  final String? subtitle;

  const ListingPageHeader({
    super.key,
    required this.title,
    required this.sortLabel,
    required this.filterLabel,
    required this.onSort,
    required this.onFilter,
    this.hasFilter = false,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;

    return ColoredBox(
      color: ListingTheme.headerBg(context),
      child: SafeArea(
        bottom: false,
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                t.accentLight.withValues(alpha: 0.45),
                ListingTheme.headerBg(context),
              ],
            ),
            border: Border(
              bottom: BorderSide(color: t.hairline.withValues(alpha: 0.7)),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 6, ListingTheme.padH, 0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    _HeaderIconButton(
                      icon: Directionality.of(context) == TextDirection.rtl
                          ? Icons.arrow_forward_ios_rounded
                          : Icons.arrow_back_ios_new_rounded,
                      onTap: () => context.pop(),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            width: 4,
                            height: 22,
                            decoration: BoxDecoration(
                              gradient: t.primaryGradient,
                              borderRadius: BorderRadius.circular(99),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  title,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: appFont(
                                    fontSize: 19,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.4,
                                    height: 1.2,
                                    color: t.ink,
                                  ),
                                ),
                                if (subtitle != null && subtitle!.isNotEmpty) ...[
                                  const SizedBox(height: 3),
                                  Text(
                                    subtitle!,
                                    style: ListingTheme.sectionHint(context).copyWith(fontSize: 12),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(ListingTheme.padH, 12, ListingTheme.padH, 10),
                child: AppSearchScanBar(
                  hint: s.searchHintHome,
                  scanLabel: s.scan,
                  fillColor: t.surface,
                  borderColor: t.accentSoft,
                  onSearchTap: () => context.push('/search'),
                  onScanTap: () => context.push('/scan'),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(ListingTheme.padH, 0, ListingTheme.padH, 14),
                child: ListingToolbar(
                  sortLabel: sortLabel,
                  filterLabel: filterLabel,
                  onSort: onSort,
                  onFilter: onFilter,
                  hasFilter: hasFilter,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _HeaderIconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Material(
      color: t.surface,
      elevation: 0,
      shadowColor: t.accentDark.withValues(alpha: 0.08),
      shape: CircleBorder(
        side: BorderSide(color: t.hairline.withValues(alpha: 0.8)),
      ),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 40,
          height: 40,
          child: Icon(icon, size: 17, color: t.inkSoft),
        ),
      ),
    );
  }
}
