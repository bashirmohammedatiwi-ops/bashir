import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';

class CategoryTilesSection extends StatelessWidget {
  final HomeSection section;
  const CategoryTilesSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    if (section.categories.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (section.title != null && section.title!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Text(section.title!, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          ),
        SizedBox(
          height: 130,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
            itemCount: section.categories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) {
              final c = section.categories[i];
              return GestureDetector(
                onTap: () => context.push(
                    '/products?categoryId=${c.id}&title=${Uri.encodeComponent(c.name)}'),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: SizedBox(
                    width: 110,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        if (c.imageUrl.isNotEmpty)
                          AppNetworkImage(url: c.imageUrl, fit: BoxFit.cover)
                        else
                          Container(color: const Color(0xFFE8F4FC)),
                        Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Colors.black.withValues(alpha: 0.1), Colors.black.withValues(alpha: 0.45)],
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(10),
                          child: Align(
                            alignment: Alignment.topRight,
                            child: Text(c.name,
                                style: const TextStyle(
                                    color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class MakeupCategoriesSection extends StatelessWidget {
  final HomeSection section;
  const MakeupCategoriesSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    if (section.categories.isEmpty) return const SizedBox.shrink();
    final accent = parseHexColor(section.backgroundColor) ?? AppColors.primaryLight;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (section.title != null && section.title!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Text(section.title!, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          ),
        SizedBox(
          height: 148,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
            itemCount: section.categories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) {
              final c = section.categories[i];
              return GestureDetector(
                onTap: () => context.push(
                    '/products?categoryId=${c.id}&title=${Uri.encodeComponent(c.name)}'),
                child: Container(
                  width: 108,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFEFEFEF)),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    children: [
                      Expanded(
                        child: Container(
                          width: double.infinity,
                          color: accent,
                          child: c.imageUrl.isNotEmpty
                              ? AppNetworkImage(url: c.imageUrl, fit: BoxFit.contain)
                              : const Icon(Icons.brush_outlined, color: AppColors.primary, size: 36),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
                        child: Text(c.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
