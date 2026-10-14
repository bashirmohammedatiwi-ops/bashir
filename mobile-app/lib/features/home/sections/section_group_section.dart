import 'package:flutter/material.dart';

import '../../../core/widgets/ui/section_title.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../data/models/home_section.dart';
import '../../worlds/world_theme.dart';
import '../home_link.dart';
import '../home_section_renderer.dart';

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

    // شريط بعرض الشاشة بخلفية المجموعة ونقشها من مصمّم العوالم،
    // والمحتوى داخله بحشوة جانبية حتى يحيط به النقش من كل الجهات.
    final bg = parseHexColor(section.backgroundColor) ?? t.accentLight;
    final border = parseHexColor(section.borderColor);
    final padTop = section.paddingTop ?? 24;
    final padBottom = section.paddingBottom ?? 24;
    final innerH = section.framePaddingH ?? 12;
    final mq = MediaQuery.of(context);
    final innerW = mq.size.width - innerH * 2;
    final hasPattern = (section.pattern ?? 'none') != 'none';

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        border: border != null
            ? Border.symmetric(horizontal: BorderSide(color: border))
            : null,
      ),
      child: Stack(
        children: [
          if (hasPattern)
            Positioned.fill(
              child: IgnorePointer(
                child: CustomPaint(
                  painter: _GroupPatternPainter(section.pattern!, bg),
                ),
              ),
            ),
          Padding(
            padding: EdgeInsets.fromLTRB(innerH, padTop, innerH, padBottom),
            // العناصر الداخلية تقيس عرضها من داخل الشريط لا من الشاشة.
            child: MediaQuery(
              data: mq.copyWith(size: Size(innerW, mq.size.height)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // "مجموعة" اسم افتراضي من لوحة التحكم — لا نعرضه كعنوان.
                  if (section.showTitle &&
                      (title?.isNotEmpty ?? false) &&
                      title!.trim() != 'مجموعة' &&
                      title.trim().toLowerCase() != 'group')
                    AppSectionTitle(
                      title: title,
                      subtitle: subtitle,
                      padding: const EdgeInsetsDirectional.fromSTEB(
                        16,
                        0,
                        16,
                        12,
                      ),
                    ),
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
            ),
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
    // لون النقش درجة أعمق من خلفية المجموعة نفسها — واضح ومتناغم بدل رمادي باهت.
    final light = base.computeLuminance() > 0.6;
    final ink = light ? Color.lerp(base, AppColors.ink, 0.5)! : Colors.white;
    final paint = Paint()
      ..color = ink.withValues(alpha: light ? 0.28 : 0.14)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final fill = Paint()
      ..color = ink.withValues(alpha: light ? 0.3 : 0.12)
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
          canvas.drawLine(
            Offset(i, 0),
            Offset(i + size.height, size.height),
            paint,
          );
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
            path.quadraticBezierTo(
              x + 6,
              y + ((x ~/ 12).isEven ? -5 : 5),
              x + 12,
              y,
            );
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
