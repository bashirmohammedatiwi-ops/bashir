import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/listing_toolbar.dart';

/// رأس صفحة المنتجات — عنوان + عداد + شريط ترتيب/تصفية.
class ListingPageHeader extends StatelessWidget {
  final String title;
  final int? productCount;
  final bool hasMore;
  final String sortLabel;
  final VoidCallback onSort;
  final VoidCallback onFilter;
  final bool hasFilter;

  const ListingPageHeader({
    super.key,
    required this.title,
    this.productCount,
    this.hasMore = false,
    required this.sortLabel,
    required this.onSort,
    required this.onFilter,
    this.hasFilter = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 4, 16, 0),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => context.pop(),
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                    color: AppColors.textPrimary,
                    tooltip: 'رجوع',
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                            letterSpacing: -0.3,
                            height: 1.2,
                          ),
                        ),
                        if (productCount != null && productCount! > 0) ...[
                          const SizedBox(height: 3),
                          Text(
                            hasMore ? '$productCount+ منتج' : '$productCount منتج',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.grid_view_rounded,
                      size: 20,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
            ListingToolbar(
              sortLabel: sortLabel,
              onSort: onSort,
              onFilter: onFilter,
              hasFilter: hasFilter,
            ),
            const Divider(height: 1, thickness: 0.5, color: AppColors.divider),
          ],
        ),
      ),
    );
  }
}
