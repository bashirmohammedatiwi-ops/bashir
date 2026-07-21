import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/home_animations.dart';
import '../widgets/home_marquee.dart';
import '../widgets/home_theme.dart';

class PromoStripSection extends StatelessWidget {
  final HomeSection section;

  const PromoStripSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final strip = section.promoStrip;
    if (strip == null || !strip.hasContent) return const SizedBox.shrink();

    final variant = strip.variant ?? 'strip';
    if (variant == 'news') return _NewsTicker(strip: strip);
    if (variant == 'ticker') return _SlimTicker(strip: strip);
    return _PromoCard(strip: strip);
  }
}

List<String> _lines(PromoStrip strip) {
  if (strip.items.isNotEmpty) return strip.items.where((s) => s.trim().isNotEmpty).toList();
  if (strip.text.trim().isNotEmpty) return [strip.text.trim()];
  return const [];
}

String _combined(PromoStrip strip) {
  final lines = _lines(strip);
  if (lines.isEmpty) return '';
  return lines.join(strip.separator ?? '   •   ');
}

Color _textColor(PromoStrip strip) =>
    parseHexColor(strip.textColor) ?? HomeTheme.ink;

Color _bg(PromoStrip strip) {
  final custom = parseHexColor(strip.backgroundColor);
  if (custom == null) return HomeTheme.sageLight.withValues(alpha: 0.65);
  return Color.lerp(custom, Colors.white, 0.78)!;
}

void _openLink(BuildContext context, PromoStrip strip) {
  if (!strip.hasLink) return;
  openSectionLink(
    context,
    linkType: strip.linkType,
    linkValue: strip.linkValue,
    legacyLink: strip.link,
  );
}

/// بطاقة ترويج — نص ثابت أو متحرك.
class _PromoCard extends StatelessWidget {
  final PromoStrip strip;

  const _PromoCard({required this.strip});

  @override
  Widget build(BuildContext context) {
    final text = _combined(strip);
    if (text.isEmpty) return const SizedBox.shrink();

    final bg = _bg(strip);
    final fg = _textColor(strip);
    final icon = strip.icon?.trim();
    final style = HomeTheme.body(size: 13, color: fg, weight: FontWeight.w600);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
      child: HomeTapScale(
        onTap: strip.hasLink ? () => _openLink(context, strip) : null,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: HomeTheme.sectionSurface(tint: bg),
          child: Row(
            children: [
              if (strip.showIcon) ...[
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: HomeTheme.sageLight,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: icon != null && icon.isNotEmpty
                      ? Text(icon, style: const TextStyle(fontSize: 17))
                      : Icon(Icons.local_offer_outlined, size: 17, color: fg),
                ),
                const SizedBox(width: 10),
              ],
              Expanded(
                child: strip.marquee
                    ? HomeMarquee(
                        text: text,
                        style: style,
                        speed: strip.marqueeSpeed,
                        gap: strip.separator ?? '   •   ',
                      )
                    : Text(
                        text,
                        style: style,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
              ),
              if (strip.hasLink)
                Icon(Icons.arrow_back_ios_new_rounded, size: 12, color: fg.withValues(alpha: 0.7)),
            ],
          ),
        ),
      ),
    );
  }
}

/// شريط نحيف — نشرة متحركة بعرض كامل.
class _SlimTicker extends StatelessWidget {
  final PromoStrip strip;

  const _SlimTicker({required this.strip});

  @override
  Widget build(BuildContext context) {
    final text = _combined(strip);
    if (text.isEmpty) return const SizedBox.shrink();

    final bg = _bg(strip);
    final fg = _textColor(strip);
    final icon = strip.icon?.trim();

    return HomeTapScale(
      onTap: strip.hasLink ? () => _openLink(context, strip) : null,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: fg.withValues(alpha: 0.08)),
        ),
        child: Row(
          children: [
            if (strip.showIcon && icon != null && icon.isNotEmpty) ...[
              Text(icon, style: const TextStyle(fontSize: 15)),
              const SizedBox(width: 8),
            ],
            Expanded(
              child: strip.marquee
                  ? HomeMarquee(
                      text: text,
                      style: HomeTheme.body(size: 12, color: fg, weight: FontWeight.w700),
                      speed: strip.marqueeSpeed,
                      gap: strip.separator ?? '   •   ',
                    )
                  : Text(
                      text,
                      style: HomeTheme.body(size: 12, color: fg, weight: FontWeight.w700),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

/// نشرة إخبارية — شارة + نص متحرك.
class _NewsTicker extends StatelessWidget {
  final PromoStrip strip;

  const _NewsTicker({required this.strip});

  @override
  Widget build(BuildContext context) {
    final text = _combined(strip);
    if (text.isEmpty) return const SizedBox.shrink();

    final bg = _bg(strip);
    final fg = _textColor(strip);
    final label = (strip.label ?? 'عاجل').trim();

    return HomeTapScale(
      onTap: strip.hasLink ? () => _openLink(context, strip) : null,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: fg.withValues(alpha: 0.06)),
          boxShadow: HomeTheme.softShadow,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                color: AppColors.primary.withValues(alpha: 0.12),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    PulseBadge(
                      child: Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          color: AppColors.sale,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      label,
                      style: HomeTheme.body(
                        size: 11,
                        color: AppColors.primary,
                        weight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  child: strip.marquee
                      ? HomeMarquee(
                          text: text,
                          style: HomeTheme.body(size: 12.5, color: fg, weight: FontWeight.w600),
                          speed: strip.marqueeSpeed,
                          gap: strip.separator ?? '   •   ',
                        )
                      : Text(
                          text,
                          style: HomeTheme.body(size: 12.5, color: fg, weight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                ),
              ),
              if (strip.hasLink)
                Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: Icon(Icons.chevron_left_rounded, size: 18, color: fg.withValues(alpha: 0.5)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
