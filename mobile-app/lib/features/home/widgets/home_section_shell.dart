import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/locale_provider.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/home_section.dart';
import '../../worlds/world_theme.dart';
import '../home_link.dart';
import 'home_theme.dart';

bool homeSectionShowsTitle(HomeSection section) => section.showTitle;

/// غلاف موحّد للأقسام — بسيط، أنيق، بدون تعقيد.
class HomeSectionShell extends ConsumerWidget {
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
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final title = section.titleForLang(lang);
    final subtitle = section.subtitleForLang(lang);
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
        if (_showTitle && (title?.isNotEmpty ?? false))
          HomeSectionHeader(
            title: title!,
            subtitle: subtitle,
            headerImageUrl: section.headerImageUrl,
            actionLabel: actionLabel,
            onAction: onAction,
            trailing: headerTrailing,
            compact: compactTop,
            overline: overline,
          )
        else if ((actionLabel != null && onAction != null) ||
            headerTrailing != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(
              HomeTheme.paddingH,
              2,
              HomeTheme.paddingH,
              8,
            ),
            child: Row(
              children: [
                if (headerTrailing != null) headerTrailing!,
                const Spacer(),
                if (actionLabel != null && onAction != null)
                  HomeViewAllLink(label: actionLabel!, onTap: onAction!),
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
          decoration: HomeTheme.sectionSurface(
            tint: cmsBg ?? HomeTheme.surface,
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
    final t = context.worldTheme;
    final hasSub = subtitle != null && subtitle!.isNotEmpty;
    final hasOverline = overline != null && overline!.isNotEmpty;
    return Padding(
      padding: EdgeInsetsDirectional.fromSTEB(
        HomeTheme.paddingH,
        compact ? 4 : 8,
        HomeTheme.paddingH,
        12,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // الخط اللوني بطول محتوى العنوان بالضبط — لا يتجاوزه ولا ينزاح.
          Container(
            width: 4,
            height: (hasSub || hasOverline) ? 36 : 20,
            margin: const EdgeInsetsDirectional.only(end: 10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [t.accent, t.accent.withValues(alpha: 0.35)],
              ),
              borderRadius: BorderRadius.circular(4),
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
              mainAxisSize: MainAxisSize.min,
              children: [
                if (hasOverline)
                  Text(
                    overline!,
                    style: AppText.micro.copyWith(
                      color: t.inkMuted,
                      letterSpacing: 0.4,
                    ),
                  ),
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.title2.copyWith(color: t.ink),
                ),
                if (hasSub)
                  Text(
                    subtitle!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.caption.copyWith(color: t.inkSoft),
                  ),
              ],
            ),
          ),
          if (trailing != null) trailing!,
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(width: 8),
            ViewAllButton(label: actionLabel!, onTap: onAction!),
          ],
        ],
      ),
    );
  }
}
