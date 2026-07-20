import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import 'home_theme.dart';

bool homeSectionShowsTitle(HomeSection section) => section.showTitle;

/// غلاف موحّد — عنوان + بطاقة بيضاء للمحتوى.
class HomeSectionShell extends StatelessWidget {
  final HomeSection section;
  final bool compactTop;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Widget? headerTrailing;
  final bool? showTitle;
  final bool elevated;
  final bool wrapCard;
  final String? overline;
  final Widget child;

  const HomeSectionShell({
    super.key,
    required this.section,
    required this.child,
    this.compactTop = false,
    this.actionLabel,
    this.onAction,
    this.headerTrailing,
    this.showTitle,
    this.elevated = false,
    this.wrapCard = false,
    this.overline,
  });

  bool get _showTitle => showTitle ?? homeSectionShowsTitle(section);

  @override
  Widget build(BuildContext context) {
    final cmsBg = parseHexColor(section.backgroundColor);

    Widget body = child;
    if (wrapCard && !elevated) {
      body = Padding(
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        child: DecoratedBox(
          decoration: HomeTheme.cardDecoration(),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(HomeTheme.cardRadius),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: child,
            ),
          ),
        ),
      );
    }

    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_showTitle && (section.title?.isNotEmpty ?? false))
          HomeEditorialHeader(
            title: section.title!,
            subtitle: section.subtitle,
            headerImageUrl: section.headerImageUrl,
            actionLabel: actionLabel,
            onAction: onAction,
            trailing: headerTrailing,
            compact: compactTop,
            overline: overline,
          )
        else if ((actionLabel != null && onAction != null) || headerTrailing != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(HomeTheme.paddingH, 4, HomeTheme.paddingH, 8),
            child: Row(
              children: [
                if (headerTrailing != null) ...[headerTrailing!, const Spacer()],
                if (actionLabel != null && onAction != null)
                  GestureDetector(
                    onTap: onAction,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(actionLabel!, style: HomeTheme.viewAll),
                        const Icon(Icons.arrow_back_ios_new_rounded, size: 10, color: AppColors.primary),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        body,
      ],
    );

    if (elevated) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: cmsBg ?? Colors.white,
            borderRadius: BorderRadius.circular(HomeTheme.cardRadius),
            boxShadow: HomeTheme.softLift,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(HomeTheme.cardRadius),
            child: content,
          ),
        ),
      );
    }

    if (cmsBg != null) {
      return ColoredBox(color: cmsBg, child: content);
    }

    return content;
  }
}
