import 'package:flutter/material.dart';

import '../../../core/widgets/app_network_image.dart';
import '../home_link.dart';
import '../widgets/home_section_shell.dart';
import '../../../data/models/home_section.dart';

class ImageTilesSection extends StatelessWidget {
  final HomeSection section;
  const ImageTilesSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final items = section.items;
    if (items.isEmpty) return const SizedBox.shrink();

    final cols = section.layout == 'grid3' ? 3 : 2;

    return HomeSectionShell(
      section: section,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
        child: GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: cols,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: cols == 3 ? 0.72 : 0.85,
          ),
          itemCount: items.length,
          itemBuilder: (context, i) {
            final raw = items[i];
            if (raw is! Map) return const SizedBox.shrink();
            final m = Map<String, dynamic>.from(raw);
            final title = m['title']?.toString() ?? '';
            final subtitle = m['subtitle']?.toString() ?? '';
            final imageUrl = m['imageUrl']?.toString() ?? '';
            final link = m['link']?.toString();
            final linkType = m['linkType']?.toString();
            final linkValue = m['linkValue']?.toString();

            return Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: () => openSectionLink(
                  context,
                  linkType: linkType,
                  linkValue: linkValue,
                  legacyLink: link,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: AppNetworkImage(
                        url: imageUrl,
                        fit: BoxFit.cover,
                        radius: BorderRadius.zero,
                      ),
                    ),
                    if (title.isNotEmpty || subtitle.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (title.isNotEmpty)
                              Text(
                                title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
                              ),
                            if (subtitle.isNotEmpty)
                              Text(
                                subtitle,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(fontSize: 9, color: Colors.grey.shade600),
                              ),
                          ],
                        ),
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
