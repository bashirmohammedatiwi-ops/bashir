import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/scroll_perf.dart';
import '../../../data/models/category.dart';

/// شريط أفقي بدوائر للأقسام الفرعية أو الثانوية أعلى قائمة المنتجات.
class CategoryChildrenStrip extends StatelessWidget {
  final List<Category> children;
  final String? selectedChildId;
  final String allLabel;
  final void Function(Category? child) onSelect;

  const CategoryChildrenStrip({
    super.key,
    required this.children,
    required this.onSelect,
    this.selectedChildId,
    this.allLabel = 'الكل',
  });

  static const _circleSize = 58.0;
  static const _stripHeight = 102.0;

  @override
  Widget build(BuildContext context) {
    if (children.isEmpty) return const SizedBox.shrink();

    return Container(
      color: const Color(0xFFF9F7F8),
      padding: const EdgeInsets.only(bottom: 6),
      child: SizedBox(
        height: _stripHeight,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          physics: AppScrollPerf.physics,
          cacheExtent: AppScrollPerf.horizontalCacheExtent,
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 2),
          itemCount: children.length + 1,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (_, index) {
            if (index == 0) {
              return _CircleChip(
                label: allLabel,
                active: selectedChildId == null,
                icon: Icons.apps_rounded,
                onTap: () {
                  HapticFeedback.selectionClick();
                  onSelect(null);
                },
              );
            }
            final child = children[index - 1];
            return _CircleChip(
              label: child.name,
              imageUrl: child.imageUrl,
              fallback: child.icon ?? child.name.characters.first,
              active: selectedChildId == child.id,
              onTap: () {
                HapticFeedback.selectionClick();
                onSelect(child);
              },
            );
          },
        ),
      ),
    );
  }
}

class _CircleChip extends StatelessWidget {
  final String label;
  final String? imageUrl;
  final String? fallback;
  final IconData? icon;
  final bool active;
  final VoidCallback onTap;

  const _CircleChip({
    required this.label,
    required this.active,
    required this.onTap,
    this.imageUrl,
    this.fallback,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 68,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: CategoryChildrenStrip._circleSize,
              height: CategoryChildrenStrip._circleSize,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: active ? AppColors.primaryLight : AppColors.scaffold,
                border: Border.all(
                  color: active ? AppColors.primary : AppColors.border,
                  width: active ? 2 : 1,
                ),
                boxShadow: active
                    ? [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.14),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: ClipOval(
                child: _buildInner(),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10.5,
                height: 1.15,
                fontWeight: active ? FontWeight.w800 : FontWeight.w500,
                color: active ? AppColors.primaryDark : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInner() {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return AppNetworkImage(
        url: imageUrl!,
        width: CategoryChildrenStrip._circleSize,
        height: CategoryChildrenStrip._circleSize,
        fit: BoxFit.cover,
      );
    }
    if (icon != null) {
      return Icon(
        icon,
        size: 24,
        color: active ? AppColors.primary : AppColors.textMuted,
      );
    }
    return ColoredBox(
      color: AppColors.primarySoft,
      child: Center(
        child: Text(
          fallback ?? '•',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.primaryDark.withValues(alpha: 0.85),
          ),
        ),
      ),
    );
  }
}

void navigateListingChild({
  required BuildContext context,
  String? categoryId,
  String? subcategoryId,
  required Category? child,
  required String parentTitle,
}) {
  if (child == null) {
    if (categoryId != null) {
      context.replace(
        '/products?categoryId=$categoryId&title=${Uri.encodeComponent(parentTitle)}',
      );
      return;
    }
    if (subcategoryId != null) {
      context.replace(
        '/products?subcategoryId=$subcategoryId&title=${Uri.encodeComponent(parentTitle)}',
      );
    }
    return;
  }

  if (categoryId != null) {
    context.replace(
      '/products?subcategoryId=${child.id}&title=${Uri.encodeComponent(child.name)}',
    );
    return;
  }

  if (subcategoryId != null) {
    context.replace(
      '/products?subcategoryId=$subcategoryId&tertiaryCategoryId=${child.id}&title=${Uri.encodeComponent(child.name)}',
    );
  }
}
