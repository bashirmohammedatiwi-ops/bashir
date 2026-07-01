import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/section_header.dart';
import '../../../data/models/home_section.dart';

class BrandHomeSection extends StatelessWidget {
  final HomeSection section;
  const BrandHomeSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    if (section.brands.isEmpty) return const SizedBox.shrink();
    final isCards = section.layout == 'cards';

    return ColoredBox(
      color: Colors.white,
      child: Column(
        children: [
          if (section.title != null && section.title!.isNotEmpty)
            SectionHeader(
              title: section.title!,
              actionLabel: 'الكل',
              style: SectionHeaderStyle.niceOne,
              onAction: () => context.push('/brands'),
            ),
          SizedBox(
            height: isCards ? 120 : 80,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              itemCount: section.brands.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) {
                final b = section.brands[i];
                return GestureDetector(
                  onTap: () => context.push('/products?brandId=${b.id}&title=${Uri.encodeComponent(b.name)}'),
                  child: Container(
                    width: 100,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isCards ? const Color(0xFFE8F4FC) : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFEEEEEE)),
                    ),
                    alignment: Alignment.center,
                    child: b.logoUrl.isNotEmpty
                        ? AppNetworkImage(url: b.logoUrl, fit: BoxFit.contain)
                        : Text(b.name,
                            maxLines: 2,
                            textAlign: TextAlign.center,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
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
