import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_section.dart';
import '../widgets/home_animations.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';

class BrandHomeSection extends StatelessWidget {
  final HomeSection section;
  final bool compactTop;
  const BrandHomeSection({
    super.key,
    required this.section,
    this.compactTop = false,
  });

  @override
  Widget build(BuildContext context) {
    if (section.brands.isEmpty) return const SizedBox.shrink();

    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      actionLabel: 'عرض الكل',
      onAction: () => context.push('/brands'),
      child: SizedBox(
        height: 72,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
          itemCount: section.brands.length,
          separatorBuilder: (_, __) => const SizedBox(width: HomeTheme.itemGap),
          itemBuilder: (_, i) {
            final b = section.brands[i];
            return HomeStaggerItem(
              index: i,
              child: HomeTapScale(
                onTap: () => context.push(
                  '/products?brandId=${b.id}&title=${Uri.encodeComponent(b.name)}',
                ),
                child: Container(
                  width: 112,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: HomeTheme.sectionSurface(),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 32,
                        height: 32,
                        child: b.logoUrl.isNotEmpty
                            ? AppNetworkImage(url: b.logoUrl, fit: BoxFit.contain)
                            : Center(
                                child: Text(
                                  b.name.characters.first,
                                  style: HomeTheme.sectionTitle(size: 16),
                                ),
                              ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          b.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: HomeTheme.chipLabel.copyWith(fontSize: 10),
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
    );
  }
}
