import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/locale_provider.dart';
import '../../../core/perf/device_perf.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_fonts.dart';
import '../../../data/models/home_section.dart';
import '../../worlds/world_theme.dart';
import '../home_link.dart';
import '../widgets/home_animations.dart';
import '../widgets/home_marquee.dart';
import '../widgets/home_theme.dart';

class PromoStripSection extends ConsumerWidget {
  final HomeSection section;

  const PromoStripSection({super.key, required this.section});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final strip = section.promoStrip;
    if (strip == null || !strip.hasContent) return const SizedBox.shrink();

    final variant = strip.variant ?? 'strip';
    if (variant == 'news') return _NewsTicker(strip: strip, lang: lang);
    if (variant == 'ticker') return _SlimTicker(strip: strip, lang: lang);
    // عبارة تحريرية + شرائح — تُظهر العبارة التي كانت تختفي خلف شريط متحرك.
    if (strip.textForLang(lang).trim().isNotEmpty) {
      return _EditorialBand(strip: strip, lang: lang);
    }
    return _PromoCard(strip: strip, lang: lang);
  }
}

List<String> _lines(PromoStrip strip, String lang) {
  final localized = strip.linesForLang(lang);
  if (localized.isNotEmpty) return localized;
  final text = strip.textForLang(lang).trim();
  if (text.isNotEmpty) return [text];
  return const [];
}

String _combined(PromoStrip strip, String lang) {
  final lines = _lines(strip, lang);
  if (lines.isEmpty) return '';
  return lines.join(strip.separator ?? '   •   ');
}

Color _textColor(PromoStrip strip) =>
    parseHexColor(strip.textColor) ?? HomeTheme.ink;

Color _bg(PromoStrip strip) {
  final custom = parseHexColor(strip.backgroundColor);
  if (custom == null) return HomeTheme.roseWash;
  return Color.lerp(custom, Colors.white, 0.85)!;
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
  final String lang;

  const _PromoCard({required this.strip, required this.lang});

  @override
  Widget build(BuildContext context) {
    final text = _combined(strip, lang);
    if (text.isEmpty) return const SizedBox.shrink();

    final bg = _bg(strip);
    final fg = _textColor(strip);
    final t = context.worldTheme;
    final icon = strip.icon?.trim();
    final style = HomeTheme.body(size: 13, color: fg, weight: FontWeight.w600);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
      child: HomeTapScale(
        onTap: strip.hasLink ? () => _openLink(context, strip) : null,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(HomeTheme.cardRadius),
            border: Border.all(color: t.divider),
          ),
          child: Row(
            children: [
              if (strip.showIcon) ...[
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: t.accentLight,
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
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 12,
                  color: fg.withValues(alpha: 0.7),
                ),
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
  final String lang;

  const _SlimTicker({required this.strip, required this.lang});

  @override
  Widget build(BuildContext context) {
    final text = _combined(strip, lang);
    if (text.isEmpty) return const SizedBox.shrink();

    final bg = _bg(strip);
    final fg = _textColor(strip);
    final t = context.worldTheme;
    final icon = strip.icon?.trim();

    return HomeTapScale(
      onTap: strip.hasLink ? () => _openLink(context, strip) : null,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: t.hairline.withValues(alpha: 0.35)),
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
                      style: HomeTheme.body(
                        size: 12,
                        color: fg,
                        weight: FontWeight.w700,
                      ),
                      speed: strip.marqueeSpeed,
                      gap: strip.separator ?? '   •   ',
                    )
                  : Text(
                      text,
                      style: HomeTheme.body(
                        size: 12,
                        color: fg,
                        weight: FontWeight.w700,
                      ),
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
  final String lang;

  const _NewsTicker({required this.strip, required this.lang});

  @override
  Widget build(BuildContext context) {
    final text = _combined(strip, lang);
    if (text.isEmpty) return const SizedBox.shrink();

    final bg = _bg(strip);
    final fg = _textColor(strip);
    final t = context.worldTheme;
    final label = strip.labelForLang(lang).trim();

    return HomeTapScale(
      onTap: strip.hasLink ? () => _openLink(context, strip) : null,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: fg.withValues(alpha: 0.06)),
          boxShadow: t.cardShadow,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 10,
                ),
                color: t.accent.withValues(alpha: 0.12),
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
                        color: t.accent,
                        weight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 10,
                  ),
                  child: strip.marquee
                      ? HomeMarquee(
                          text: text,
                          style: HomeTheme.body(
                            size: 12.5,
                            color: fg,
                            weight: FontWeight.w600,
                          ),
                          speed: strip.marqueeSpeed,
                          gap: strip.separator ?? '   •   ',
                        )
                      : Text(
                          text,
                          style: HomeTheme.body(
                            size: 12.5,
                            color: fg,
                            weight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                ),
              ),
              if (strip.hasLink)
                Padding(
                  padding: const EdgeInsetsDirectional.only(end: 4),
                  child: Icon(
                    Icons.chevron_right_rounded,
                    size: 18,
                    color: fg.withValues(alpha: 0.5),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// فاصل تحريري أنيق: زخرفة + عبارة بخط العلامة + شرائح الأقسام.
class _EditorialBand extends StatelessWidget {
  final PromoStrip strip;
  final String lang;

  const _EditorialBand({required this.strip, required this.lang});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final phrase = strip.textForLang(lang).trim();
    final items = strip.linesForLang(lang);
    final customBg = parseHexColor(strip.backgroundColor);
    final customFg = parseHexColor(strip.textColor);
    // نص فاتح يعني أن الإدارة اختارت خلفية ملوّنة قوية — نحترمها كما هي.
    final boldBand =
        customBg != null &&
        customFg != null &&
        customFg.computeLuminance() > 0.6;
    // لون الإدارة كما هو من لوحة التحكم.
    final bg = boldBand ? customBg : t.accentLight;
    final fg = boldBand ? customFg : t.ink;
    final soft = fg.withValues(alpha: 0.55);

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: HomeTheme.paddingH,
        vertical: 6,
      ),
      child: HomeTapScale(
        onTap: strip.hasLink ? () => _openLink(context, strip) : null,
        child: Container(
          width: double.infinity,
          clipBehavior: Clip.antiAlias,
          foregroundDecoration: boldBand
              ? BoxDecoration(
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.14),
                  ),
                )
              : null,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            boxShadow: boldBand
                ? [
                    // الأجهزة البسيطة: ظل أقصر بكثير (كلفة التمويه تتناسب مع نصف قطره).
                    BoxShadow(
                      color: bg.withValues(
                        alpha: DevicePerf.pick(low: 0.22, mid: 0.28),
                      ),
                      blurRadius: DevicePerf.pick(low: 6.0, mid: 22.0),
                      offset: Offset(0, DevicePerf.pick(low: 4.0, mid: 10.0)),
                    ),
                  ]
                : null,
            gradient: boldBand
                ? LinearGradient(
                    begin: AlignmentDirectional.topStart,
                    end: AlignmentDirectional.bottomEnd,
                    colors: [
                      Color.lerp(bg, Colors.white, 0.08)!,
                      bg,
                      Color.lerp(bg, Colors.black, 0.28)!,
                    ],
                  )
                : LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [t.accentLight, t.surface],
                  ),
            border: boldBand ? null : Border.all(color: t.accentSoft),
          ),
          child: Stack(
            children: [
              if (boldBand) ...[
                // توهّجات ناعمة — عمق بدل لون مسطّح.
                PositionedDirectional(
                  top: -60,
                  end: -40,
                  child: _Glow(
                    size: 170,
                    color: Colors.white.withValues(alpha: 0.16),
                  ),
                ),
                PositionedDirectional(
                  bottom: -70,
                  start: -30,
                  child: _Glow(
                    size: 150,
                    color: Colors.white.withValues(alpha: 0.08),
                  ),
                ),
              ],
              Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(width: 28, height: 1, color: soft),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Icon(
                            Icons.auto_awesome,
                            size: 14,
                            color: soft,
                          ),
                        ),
                        Container(width: 28, height: 1, color: soft),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      phrase,
                      textAlign: TextAlign.center,
                      style: brandTitleStyle(lang: lang, size: 21, color: fg),
                    ),
                    if (items.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Wrap(
                        alignment: WrapAlignment.center,
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final item in items)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 7,
                              ),
                              decoration: BoxDecoration(
                                color: boldBand
                                    ? Colors.white.withValues(alpha: 0.16)
                                    : t.surface,
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(
                                  color: boldBand ? Colors.white30 : t.hairline,
                                ),
                              ),
                              child: Text(
                                item,
                                style: HomeTheme.body(
                                  size: 12.5,
                                  color: fg,
                                  weight: FontWeight.w700,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Glow extends StatelessWidget {
  final double size;
  final Color color;
  const _Glow({required this.size, required this.color});

  @override
  Widget build(BuildContext context) => IgnorePointer(
    child: Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(colors: [color, color.withValues(alpha: 0)]),
      ),
    ),
  );
}
