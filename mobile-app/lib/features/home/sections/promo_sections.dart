import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/home_surface_card.dart';

class PromoStripSection extends StatelessWidget {
  final HomeSection section;
  const PromoStripSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final strip = section.promoStrip;
    if (strip == null || strip.text.isEmpty) return const SizedBox.shrink();
    final bg = parseHexColor(strip.backgroundColor) ?? AppColors.primaryLight;

    return HomeSurfaceCard(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      showShadow: true,
      child: Material(
        color: bg,
        child: InkWell(
          onTap: strip.link != null && strip.link!.isNotEmpty || strip.hasLink
              ? () => openSectionLink(
                    context,
                    linkType: strip.linkType,
                    linkValue: strip.linkValue,
                    legacyLink: strip.link,
                  )
              : null,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(Icons.local_offer_rounded, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    strip.text,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      height: 1.35,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                if (strip.link != null && strip.link!.isNotEmpty || strip.hasLink)
                  const Icon(Icons.chevron_left, color: AppColors.primary, size: 22),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
