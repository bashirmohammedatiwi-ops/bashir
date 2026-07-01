import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_section.dart';
import '../widgets/home_section_shell.dart';

class BrandHomeSection extends StatelessWidget {
  final HomeSection section;
  final bool compactTop;
  const BrandHomeSection({super.key, required this.section, this.compactTop = false});

  @override
  Widget build(BuildContext context) {
    if (section.brands.isEmpty) return const SizedBox.shrink();
    final isCards = section.layout == 'cards';

    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      actionLabel: 'الكل',
      onAction: () => context.push('/brands'),
      child: SizedBox(
        height: isCards ? 128 : 88,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
          itemCount: section.brands.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (_, i) {
            final b = section.brands[i];
            return GestureDetector(
              onTap: () =>
                  context.push('/products?brandId=${b.id}&title=${Uri.encodeComponent(b.name)}'),
              child: Container(
                width: isCards ? 108 : 96,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: isCards
                      ? const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFFE8F4FC), Color(0xFFF3E5F5)],
                        )
                      : null,
                  color: isCards ? null : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFEEEEEE)),
                  boxShadow: isCards
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Expanded(
                      child: b.logoUrl.isNotEmpty
                          ? AppNetworkImage(url: b.logoUrl, fit: BoxFit.contain)
                          : Center(
                              child: Text(b.name,
                                  maxLines: 2,
                                  textAlign: TextAlign.center,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11)),
                            ),
                    ),
                    if (isCards)
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('خصومات',
                            style: TextStyle(
                                color: AppColors.primary, fontSize: 9, fontWeight: FontWeight.w800)),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
