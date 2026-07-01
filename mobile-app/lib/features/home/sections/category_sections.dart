import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/category.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/home_section_shell.dart';

class CategoryTilesSection extends StatelessWidget {
  final HomeSection section;
  const CategoryTilesSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    if (section.categories.isEmpty) return const SizedBox.shrink();
    return HomeSectionShell(
      section: section,
      actionLabel: 'الكل',
      onAction: () => context.push('/categories'),
      child: SizedBox(
        height: 136,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
          itemCount: section.categories.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (_, i) => _CategoryTile(category: section.categories[i]),
        ),
      ),
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

    return HomeSectionShell(
      section: section,
      child: SizedBox(
        height: 152,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
          itemCount: section.categories.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (_, i) => _MakeupCard(category: section.categories[i], accent: accent),
        ),
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  final Category category;
  const _CategoryTile({required this.category});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(
          '/products?categoryId=${category.id}&title=${Uri.encodeComponent(category.name)}'),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: SizedBox(
          width: 112,
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (category.imageUrl.isNotEmpty)
                AppNetworkImage(url: category.imageUrl, width: 112, fit: BoxFit.cover)
              else
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFFFCE4EC), Color(0xFFE8F4FC)],
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    category.icon ?? category.name.characters.first,
                    style: const TextStyle(fontSize: 28),
                  ),
                ),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.black.withValues(alpha: 0.05), Colors.black.withValues(alpha: 0.5)],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(10),
                child: Align(
                  alignment: Alignment.topRight,
                  child: Text(category.name,
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MakeupCard extends StatelessWidget {
  final Category category;
  final Color accent;
  const _MakeupCard({required this.category, required this.accent});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(
          '/products?categoryId=${category.id}&title=${Uri.encodeComponent(category.name)}'),
      child: Container(
        width: 108,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFEFEFEF)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            Expanded(
              child: Container(
                width: double.infinity,
                color: accent,
                child: category.imageUrl.isNotEmpty
                    ? AppNetworkImage(url: category.imageUrl, width: 108, fit: BoxFit.contain)
                    : const Icon(Icons.brush_outlined, color: AppColors.primary, size: 36),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
              child: Text(category.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
            ),
          ],
        ),
      ),
    );
  }
}
