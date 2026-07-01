import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/category.dart';

/// شريط مشاكل البشرة — قابل للترتيب من لوحة التحكم.
class SkinConcernsStrip extends StatelessWidget {
  final List<Category> concerns;
  final String? title;
  final String? subtitle;
  const SkinConcernsStrip({
    super.key,
    required this.concerns,
    this.title,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    if (concerns.isEmpty) return const SizedBox.shrink();
    final heading = title ?? 'تسوّق حسب مشكلتك';

    return ColoredBox(
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(heading, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                if (subtitle != null && subtitle!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(subtitle!,
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12.5)),
                  ),
              ],
            ),
          ),
          SizedBox(
            height: 46,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              itemCount: concerns.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final c = concerns[i];
                return Material(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(22),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(22),
                    onTap: () => context.push(
                      '/products?concernSlug=${c.slug}&title=${Uri.encodeComponent(c.name)}',
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (c.icon != null && c.icon!.isNotEmpty) ...[
                            Text(c.icon!, style: const TextStyle(fontSize: 14)),
                            const SizedBox(width: 6),
                          ],
                          Text(c.name,
                              style: const TextStyle(
                                  color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
