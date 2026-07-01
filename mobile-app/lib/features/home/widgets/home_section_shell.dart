import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/section_header.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';

/// غلاف موحّد لأقسام الرئيسية — عنوان، عنوان فرعي، خلفية.
class HomeSectionShell extends StatelessWidget {
  final HomeSection section;
  final bool compactTop;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Widget child;

  const HomeSectionShell({
    super.key,
    required this.section,
    required this.child,
    this.compactTop = false,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final bg = parseHexColor(section.backgroundColor) ?? Colors.white;
    final hasTitle = section.title != null && section.title!.isNotEmpty;

    return ColoredBox(
      color: bg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (hasTitle)
            SectionHeader(
              title: section.title!,
              actionLabel: actionLabel,
              onAction: onAction,
              style: SectionHeaderStyle.niceOne,
              compact: compactTop,
            ),
          if (section.subtitle != null && section.subtitle!.isNotEmpty)
            Padding(
              padding: EdgeInsets.fromLTRB(16, hasTitle ? 0 : (compactTop ? 4 : 12), 16, 8),
              child: Text(
                section.subtitle!,
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 12.5,
                  height: 1.3,
                ),
              ),
            ),
          child,
        ],
      ),
    );
  }
}
