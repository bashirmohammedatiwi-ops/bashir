import 'package:flutter/material.dart';
import 'ui/section_title.dart';

enum SectionHeaderStyle { standard, niceOne }

/// غلاف للتوافق — كل عناوين الأقسام تمر الآن عبر [AppSectionTitle].
class SectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final SectionHeaderStyle style;
  final bool compact;
  final Widget? trailing;
  const SectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
    this.style = SectionHeaderStyle.standard,
    this.compact = false,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return AppSectionTitle(
      title: title,
      actionLabel: actionLabel,
      onAction: onAction,
      trailing: trailing,
      padding: EdgeInsetsDirectional.fromSTEB(16, compact ? 8 : 18, 16, 10),
    );
  }
}
