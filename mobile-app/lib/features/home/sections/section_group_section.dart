import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../data/models/home_section.dart';
import '../../worlds/world_theme.dart';
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
    final t = context.worldTheme;

    final bg = parseHexColor(section.backgroundColor) ?? t.accentLight;
    final border = parseHexColor(section.borderColor);
    final padTop = section.paddingTop ?? 20;
    final padBottom = section.paddingBottom ?? 20;
    final titleColor = parseHexColor(section.titleColor);

    return Container(
        decoration: BoxDecoration(
          color: bg,
          border: border != null ? Border.all(color: border.withValues(alpha: 0.28), width: 1) : null,
        ),
        clipBehavior: Clip.antiAlias,
        padding: EdgeInsets.only(top: padTop, bottom: padBottom),
        child: Stack(
          children: [
            if ((section.pattern ?? 'none') != 'none')
              Positioned.fill(
                child: IgnorePointer(
                  child: CustomPaint(painter: _GroupPatternPainter(section.pattern!, bg)),
                ),
              ),
            Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (section.showTitle && (title?.isNotEmpty ?? false)) ...[
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title!,
                      style: HomeTheme.sectionTitle().copyWith(
                        color: titleColor ?? t.ink,
                        fontSize: 18,
                      ),
                    ),
                    if (subtitle?.isNotEmpty ?? false) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle!,
                        style: HomeTheme.body(size: 12).copyWith(
                          color: (titleColor ?? t.ink).withValues(alpha: 0.65),
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
                padding: EdgeInsets.only(top: e.key == 0 ? 0 : 10),
                child: HomeSectionWidget(
                  section: child,
                  isFirstAfterHero: compactTop && e.key == 0,
                  nestedInGroup: true,
                ),
              );
            }),
          ],
            ),
          ],
        ),
    );
  }
}

class _GroupPatternPainter extends CustomPainter {
  final String pattern;
  final Color base;

  const _GroupPatternPainter(this.pattern, this.base);

  @override
  void paint(Canvas canvas, Size size) {
    final ink = base.computeLuminance() > 0.6 ? AppColors.ink : Colors.white;
    final paint = Paint()
      ..color = ink.withValues(alpha: 0.10)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final fill = Paint()
      ..color = ink.withValues(alpha: 0.08)
      ..style = PaintingStyle.fill;
    switch (pattern) {
      case 'dots':
        for (var y = 10.0; y < size.height; y += 16) {
          for (var x = 10.0; x < size.width; x += 16) {
            canvas.drawCircle(Offset(x, y), 1.6, fill);
          }
        }
      case 'lines':
        for (var i = -size.height; i < size.width; i += 14) {
          canvas.drawLine(Offset(i, 0), Offset(i + size.height, size.height), paint);
        }
      case 'diamonds':
        for (var y = 8.0; y < size.height; y += 22) {
          for (var x = 8.0; x < size.width; x += 22) {
            final path = Path()
              ..moveTo(x, y - 5)
              ..lineTo(x + 5, y)
              ..lineTo(x, y + 5)
              ..lineTo(x - 5, y)
              ..close();
            canvas.drawPath(path, paint);
          }
        }
      case 'waves':
        for (var y = 12.0; y < size.height; y += 18) {
          final path = Path()..moveTo(0, y);
          for (var x = 0.0; x <= size.width; x += 12) {
            path.quadraticBezierTo(x + 6, y + ((x ~/ 12).isEven ? -5 : 5), x + 12, y);
          }
          canvas.drawPath(path, paint);
        }
      case 'rings':
        for (var y = 16.0; y < size.height; y += 28) {
          for (var x = 16.0; x < size.width; x += 28) {
            canvas.drawCircle(Offset(x, y), 6, paint);
          }
        }
      case 'petals':
        for (var y = 14.0; y < size.height; y += 26) {
          for (var x = 14.0; x < size.width; x += 26) {
            canvas.drawCircle(Offset(x, y), 2.2, fill);
            canvas.drawCircle(Offset(x + 5, y), 1.4, fill);
            canvas.drawCircle(Offset(x - 5, y), 1.4, fill);
            canvas.drawCircle(Offset(x, y - 5), 1.4, fill);
          }
        }
      case 'grid':
        for (var x = 0.0; x < size.width; x += 18) {
          canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
        }
        for (var y = 0.0; y < size.height; y += 18) {
          canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
        }
      default:
        break;
    }
  }

  @override
  bool shouldRepaint(covariant _GroupPatternPainter oldDelegate) =>
      oldDelegate.pattern != pattern || oldDelegate.base != base;
}
