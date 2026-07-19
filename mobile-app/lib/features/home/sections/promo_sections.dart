import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/home_animations.dart';
import '../widgets/home_surface_card.dart';

class PromoStripSection extends StatelessWidget {
  final HomeSection section;
  const PromoStripSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final strip = section.promoStrip;
    if (strip == null || strip.text.isEmpty) return const SizedBox.shrink();
    final bg = parseHexColor(strip.backgroundColor) ?? AppColors.primaryLight;
    final useMarquee = strip.marquee;
    final icon = strip.icon?.trim();

    return HomeShimmerBorder(
      borderRadius: BorderRadius.circular(AppRadius.xl),
      child: HomeSurfaceCard(
        margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 4),
        showShadow: false,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.xl - 1),
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
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                child: Row(
                  children: [
                    PulseBadge(
                      child: Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: icon != null && icon.isNotEmpty
                            ? Text(icon, style: const TextStyle(fontSize: 20))
                            : const Icon(Icons.local_offer_rounded, color: Colors.white, size: 20),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: useMarquee
                          ? SizedBox(
                              height: 20,
                              child: MarqueeText(
                                text: strip.text,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13.5,
                                  height: 1.35,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            )
                          : Text(
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
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.chevron_left, color: AppColors.primary, size: 18),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
