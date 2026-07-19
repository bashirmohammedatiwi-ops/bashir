import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/card_sizes.dart';
import '../../../core/widgets/app_network_image.dart';

/// دائرة + صورة + عنوان — مشترك بين CIRCLE_TILES و SKIN_CONCERNS و CATEGORY_GRID.
class CircleTile extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? imageUrl;
  final String? icon;
  final String? cardSize;
  final double width;
  final VoidCallback onTap;

  const CircleTile({
    super.key,
    required this.title,
    required this.onTap,
    this.subtitle,
    this.imageUrl,
    this.icon,
    this.cardSize,
    this.width = 80,
  });

  @override
  Widget build(BuildContext context) {
    final spec = cardSizeSpec(cardSize);
    final diameter = (spec.width > 0 ? spec.width : 62.0).clamp(52.0, 88.0);

    return SizedBox(
      width: width,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: diameter,
              height: diameter,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primaryLight, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: _CircleContent(imageUrl: imageUrl, icon: icon),
            ),
            const SizedBox(height: 6),
            Text(
              title,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                height: 1.15,
                color: AppColors.textPrimary,
              ),
            ),
            if (subtitle != null && subtitle!.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                subtitle!,
                maxLines: 1,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 9,
                  color: AppColors.textSecondary.withValues(alpha: 0.85),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _CircleContent extends StatelessWidget {
  final String? imageUrl;
  final String? icon;

  const _CircleContent({this.imageUrl, this.icon});

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return AppNetworkImage(url: imageUrl!, fit: BoxFit.cover);
    }
    final emoji = icon?.trim();
    if (emoji != null && emoji.isNotEmpty) {
      return Center(child: Text(emoji, style: const TextStyle(fontSize: 26, height: 1)));
    }
    return const Icon(Icons.spa_outlined, color: Color(0xFF888888), size: 26);
  }
}
