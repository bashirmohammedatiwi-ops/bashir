import 'package:flutter/material.dart';

import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import 'home_theme.dart';

bool homeSectionShowsTitle(HomeSection section) => section.showTitle;

/// غلاف موحّد للأقسام — بسيط، أنيق، بدون تعقيد.
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
    if (wrapCard) {
      body = Padding(
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        child: DecoratedBox(
          decoration: HomeTheme.sectionSurface(),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(HomeTheme.cardRadius),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 10),
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
          HomeSectionHeader(
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
            padding: const EdgeInsets.fromLTRB(HomeTheme.paddingH, 2, HomeTheme.paddingH, 8),
            child: Row(
              children: [
                if (headerTrailing != null) ...[headerTrailing!, const Spacer()],
                if (actionLabel != null && onAction != null)
                  _ViewAllLink(label: actionLabel!, onTap: onAction!),
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
          decoration: HomeTheme.sectionSurface(tint: cmsBg ?? HomeTheme.surface),
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

/// عنوان قسم — خط وردي + نص واضح.
class HomeSectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? headerImageUrl;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Widget? trailing;
  final bool compact;
  final String? overline;

  const HomeSectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.headerImageUrl,
    this.actionLabel,
    this.onAction,
    this.trailing,
    this.compact = false,
    this.overline,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        HomeTheme.paddingH,
        compact ? 2 : 6,
        HomeTheme.paddingH,
        10,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 3,
            height: compact ? 28 : 34,
            margin: const EdgeInsets.only(left: 10, top: 2),
            decoration: BoxDecoration(
              color: HomeTheme.accent,
              borderRadius: BorderRadius.circular(99),
            ),
          ),
          if (headerImageUrl != null && headerImageUrl!.isNotEmpty) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: AppNetworkImage(
                url: headerImageUrl!,
                width: 36,
                height: 36,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (overline != null && overline!.isNotEmpty) ...[
                  Text(overline!, style: HomeTheme.overline),
                  const SizedBox(height: 2),
                ],
                Text(title, style: HomeTheme.sectionTitle(size: compact ? 16 : 17)),
                if (subtitle != null && subtitle!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!, style: HomeTheme.body(size: 12)),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
          if (actionLabel != null && onAction != null)
            _ViewAllLink(label: actionLabel!, onTap: onAction!),
        ],
      ),
    );
  }
}

class _ViewAllLink extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _ViewAllLink({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label, style: HomeTheme.viewAll),
            Icon(Icons.chevron_left_rounded, size: 16, color: HomeTheme.accent),
          ],
        ),
      ),
    );
  }
}
