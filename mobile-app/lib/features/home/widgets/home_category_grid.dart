import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/camera_corner_frame.dart';
import '../../../data/models/category.dart';
import '../../worlds/world_theme.dart';
import '../home_link.dart';
import 'home_animations.dart';
import 'home_brands_cta.dart';
import 'home_section_shell.dart';
import 'home_theme.dart';

/// فئات الهيرو — تمرير أفقي على خلفية بيضاء.
class HomeHeroCategoryStrip extends ConsumerWidget {
  final List<Category> categories;
  final Color? wash;
  final Color? accent;
  final bool worldSections;

  const HomeHeroCategoryStrip({
    super.key,
    required this.categories,
    this.wash,
    this.accent,
    this.worldSections = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (categories.isEmpty) return const SizedBox.shrink();
    final s = ref.s;
    final t = ref.watch(activeWorldThemeProvider);
    final chipAccent = accent ?? t.accent;

    final container = ProviderScope.containerOf(context, listen: false);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        worldSections
            ? Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: Row(
                  children: [
                    Text(
                      s.shopByCategory,
                      style: HomeTheme.sectionTitle(size: 18, color: t.ink),
                    ),
                    const Spacer(),
                    Material(
                      color: t.accentLight,
                      borderRadius: BorderRadius.circular(999),
                      child: InkWell(
                        onTap: () => openCategoriesTab(context, container),
                        borderRadius: BorderRadius.circular(999),
                        child: Padding(
                          padding: const EdgeInsetsDirectional.fromSTEB(10, 4, 4, 4),
                          child: Row(
                            children: [
                              Text(s.all, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
                              const SizedBox(width: 6),
                              Container(
                                width: 22,
                                height: 22,
                                decoration: BoxDecoration(color: t.surface, shape: BoxShape.circle),
                                child: Icon(
                                  Directionality.of(context) == TextDirection.rtl
                                      ? Icons.chevron_left_rounded
                                      : Icons.chevron_right_rounded,
                                  size: 16,
                                  color: chipAccent,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              )
            : HomeSectionHeader(
                title: s.shopByCategory,
                compact: true,
                actionLabel: s.all,
                onAction: () => openCategoriesTab(context, container),
              ),
        worldSections
            ? SizedBox(
                height: 176,
                child: GridView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 6,
                    childAspectRatio: 1.08,
                  ),
                  itemCount: categories.length,
                  itemBuilder: (_, i) => _CategorySquareTile(
                    category: categories[i],
                    index: i,
                    wash: wash,
                    worldSections: true,
                  ),
                ),
              )
            : SizedBox(
                height: 108,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
                  itemCount: categories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (_, i) => _CategorySquareTile(category: categories[i], index: i),
                ),
              ),
        if (!worldSections) const HomeBrandsCta(),
      ],
    );
  }
}

class HomeCategoryGrid extends ConsumerWidget {
  final List<Category> categories;
  final String? title;
  final bool showTitle;
  final bool showViewAll;
  final VoidCallback? onViewAll;

  const HomeCategoryGrid({
    super.key,
    required this.categories,
    this.title,
    this.showTitle = true,
    this.showViewAll = true,
    this.onViewAll,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (categories.isEmpty) return const SizedBox.shrink();
    final s = ref.s;
    final container = ProviderScope.containerOf(context, listen: false);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (showTitle && title != null && title!.isNotEmpty)
          HomeSectionHeader(
            title: title!,
            actionLabel: showViewAll ? s.viewAll : null,
            onAction: showViewAll
                ? (onViewAll ?? () => openCategoriesTab(context, container))
                : null,
            compact: true,
          ),
        SizedBox(
          height: 108,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
            itemCount: categories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) => _CategorySquareTile(category: categories[i], index: i),
          ),
        ),
      ],
    );
  }
}

class _CategorySquareTile extends ConsumerWidget {
  final Category category;
  final int index;
  final Color? wash;
  final bool worldSections;

  const _CategorySquareTile({
    required this.category,
    required this.index,
    this.wash,
    this.worldSections = false,
  });

  static const _size = 72.0;

  static List<Color> _tilePalette(WorldThemePalette t) => [
        t.accentLight,
        t.accentSoft,
        t.canvasWarm,
        Color.lerp(t.accentLight, t.surface, 0.45)!,
      ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final t = context.worldTheme;
    final accent = wash ?? _tilePalette(t)[index % 4];
    final displayName = category.localizedName(lang);

    return HomeTapScale(
      onTap: () {
        if (worldSections && category.listingKind == 'subcategory') {
          final title = Uri.encodeComponent(displayName);
          context.push('/products?subcategoryId=${category.id}&title=$title');
          return;
        }
        openCategoryLink(context, category);
      },
      child: worldSections
          ? Column(
              children: [
                Expanded(
                    child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: accent,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: t.hairline.withValues(alpha: 0.55)),
                    ),
                    child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: ColoredBox(
                      color: accent,
                      child: category.imageUrl.isNotEmpty
                          ? Padding(
                              padding: const EdgeInsets.all(8),
                              child: AppNetworkImage(
                                url: category.imageUrl,
                                fit: BoxFit.contain,
                                backgroundColor: accent,
                              ),
                            )
                          : Center(
                              child: Text(
                                category.icon ?? displayName.characters.first,
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: t.inkSoft),
                              ),
                            ),
                    ),
                    ),
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  displayName,
                  maxLines: 1,
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.ellipsis,
                  style: HomeTheme.circleLabel.copyWith(fontWeight: FontWeight.w700, color: t.ink),
                ),
              ],
            )
          : SizedBox(
        width: _size,
        child: Column(
          children: [
            SizedBox(
              width: _size,
              height: _size,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(worldSections ? 14 : 16),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    ColoredBox(
                      color: accent,
                      child: category.imageUrl.isNotEmpty
                          ? Padding(
                              padding: EdgeInsets.all(worldSections ? 6 : 0),
                              child: AppNetworkImage(
                                url: category.imageUrl,
                                width: _size,
                                height: _size,
                                fit: worldSections ? BoxFit.contain : BoxFit.cover,
                              ),
                            )
                          : Center(
                              child: Text(
                                category.icon ?? displayName.characters.first,
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: t.inkSoft.withValues(alpha: 0.85),
                                ),
                              ),
                            ),
                    ),
                    if (!worldSections) const CameraCornerFrame(inset: 6, arm: 10, opacity: 0.72),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              displayName,
              maxLines: 1,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: HomeTheme.circleLabel.copyWith(
                fontSize: 11,
                height: 1.15,
                fontWeight: FontWeight.w700,
                color: t.ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

