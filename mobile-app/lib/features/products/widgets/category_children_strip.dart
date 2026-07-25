import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/scroll_perf.dart';
import '../../../data/models/category.dart';

/// شريط أفقي بدوائر للأقسام الفرعية أو الثانوية أعلى قائمة المنتجات.
class CategoryChildrenStrip extends ConsumerWidget {
  final List<Category> children;
  final String? selectedChildId;
  final String? allLabel;
  final bool embedded;
  final void Function(Category? child) onSelect;

  const CategoryChildrenStrip({
    super.key,
    required this.children,
    required this.onSelect,
    this.selectedChildId,
    this.allLabel,
    this.embedded = false,
  });

  static const _circleSize = 56.0;
  static const _stripHeight = 100.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (children.isEmpty) return const SizedBox.shrink();

    final lang = ref.watch(languageCodeProvider);
    final all = allLabel ?? ref.s.all;

    final strip = SizedBox(
      height: _stripHeight,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: AppScrollPerf.physics,
        cacheExtent: AppScrollPerf.horizontalCacheExtent,
        padding: EdgeInsets.fromLTRB(embedded ? 12 : 14, embedded ? 4 : 10, embedded ? 12 : 14, embedded ? 8 : 2),
          itemCount: children.length + 1,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (_, index) {
            if (index == 0) {
              return _CircleChip(
                label: all,
                active: selectedChildId == null,
                icon: Icons.apps_rounded,
                onTap: () {
                  HapticFeedback.selectionClick();
                  onSelect(null);
                },
              );
            }
            final child = children[index - 1];
            final childName = child.localizedName(lang);
            return _CircleChip(
              label: childName,
              imageUrl: child.imageUrl,
              fallback: child.icon ?? childName.characters.first,
              active: selectedChildId == child.id,
              onTap: () {
                HapticFeedback.selectionClick();
                onSelect(child);
              },
            );
          },
        ),
    );

    if (embedded) return strip;

    return Container(
      color: const Color(0xFFF9F7F8),
      padding: const EdgeInsets.only(bottom: 6),
      child: strip,
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
