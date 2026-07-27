import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../home_section_renderer.dart';
import '../widgets/home_theme.dart';

/// إطار ملون يضم مجموعة أقسام — يظهر في التطبيق كبطاقة مميزة.
class SectionGroupSection extends ConsumerWidget {
  final HomeSection section;
  final bool compactTop;

  const SectionGroupSection({
    super.key,
    required this.section,
    this.compactTop = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (section.children.isEmpty) return const SizedBox.shrink();

    final lang = ref.watch(languageCodeProvider);
    final title = section.titleForLang(lang);
    final subtitle = section.subtitleForLang(lang);

    final bg = parseHexColor(section.backgroundColor) ?? HomeTheme.pearl;
    final border = parseHexColor(section.borderColor);
    final radius = section.borderRadius ?? 24;
    final padH = section.framePaddingH ?? 12;
    final padTop = section.paddingTop ?? 20;
    final padBottom = section.paddingBottom ?? 20;
    final titleColor = parseHexColor(section.titleColor);

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
      child: Container(
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(radius),
          border: border != null ? Border.all(color: border.withValues(alpha: 0.35), width: 1) : null,
          boxShadow: section.frameShadow ? HomeTheme.whisperLift : null,
        ),
        padding: EdgeInsets.fromLTRB(padH, padTop, padH, padBottom),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (section.showTitle && (title?.isNotEmpty ?? false)) ...[
              Padding(
                padding: const EdgeInsets.only(bottom: 12, right: 4, left: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title!,
                      style: HomeTheme.sectionTitle().copyWith(
                        color: titleColor ?? HomeTheme.ink,
                        fontSize: 18,
                      ),
                    ),
                    if (subtitle?.isNotEmpty ?? false) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle!,
                        style: HomeTheme.body(size: 12).copyWith(
                          color: (titleColor ?? HomeTheme.ink).withValues(alpha: 0.65),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
            ...section.children.asMap().entries.map((e) {
              final child = e.value;
              return Padding(
                padding: EdgeInsets.only(top: e.key == 0 ? 0 : 8),
                child: HomeSectionWidget(
                  section: child,
                  isFirstAfterHero: compactTop && e.key == 0,
                  nestedInGroup: true,
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
