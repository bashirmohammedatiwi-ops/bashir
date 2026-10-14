import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/camera_corner_frame.dart';
import '../../../core/widgets/ui/ui.dart';
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

    final container = ProviderScope.containerOf(context, listen: false);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        worldSections
            ? AppSectionTitle(
                title: s.shopByCategory,
                actionLabel: s.viewAll,
                onAction: () => openCategoriesTab(context, container),
                padding: const EdgeInsetsDirectional.fromSTEB(16, 6, 16, 12),
              )
            : HomeSectionHeader(
                title: s.shopByCategory,
                compact: true,
                actionLabel: s.all,
                onAction: () => openCategoriesTab(context, container),
              ),
        worldSections
            ? _WorldCategoryLayout(categories: categories, wash: wash)
            : SizedBox(
                height: 108,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: HomeTheme.paddingH,
                  ),
                  itemCount: categories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (_, i) =>
                      _CategorySquareTile(category: categories[i], index: i),
                ),
              ),
        if (!worldSections) const HomeBrandsCta(),
      ],
    );
  }
}

/// شبكة أقسام العالم — حجم البلاطة ثابت في كل العوالم مهما اختلف العدد:
/// أربع بلاطات ظاهرة ولمحة من التالية، صف واحد حتى 6 أقسام وصفّان لما فوقها.
class _WorldCategoryLayout extends StatelessWidget {
  final List<Category> categories;
  final Color? wash;
  const _WorldCategoryLayout({required this.categories, this.wash});

  static const _gap = 10.0;
  static const _runGap = 12.0;
  static const _label = 24.0;

  @override
  Widget build(BuildContext context) {
    final n = categories.length;
    return LayoutBuilder(
      builder: (context, c) {
        final tileW = (c.maxWidth - 16 - _gap * 4) / 4.3;
        final tileH = tileW + _label;
        // حتى 6 أقسام صف واحد متحرك، وأكثر صفّان — لا فراغات في أي عالم.
        final rows = n <= 6 ? 1 : 2;
        return SizedBox(
          height: rows * tileH + (rows - 1) * _runGap,
          child: GridView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            physics: const BouncingScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: rows,
              mainAxisSpacing: _gap,
              crossAxisSpacing: _runGap,
              childAspectRatio: tileH / tileW,
            ),
            itemCount: n,
            itemBuilder: (_, i) => _CategorySquareTile(
              category: categories[i],
              index: i,
              wash: wash,
              worldSections: true,
            ),
          ),
        );
      },
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
            itemBuilder: (_, i) =>
                _CategorySquareTile(category: categories[i], index: i),
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
                    // تدرّج ناعم: أفتح في الأعلى كأن ضوءاً يسقط على المنتج.
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Color.lerp(accent, Colors.white, 0.6)!,
                          accent,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: Colors.white, width: 1.2),
                      boxShadow: [
                        BoxShadow(
                          color: t.accentDark.withValues(alpha: 0.06),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: ColoredBox(
                        color: Colors.transparent,
                        child: category.imageUrl.isNotEmpty
                            ? Padding(
                                padding: const EdgeInsets.all(8),
                                child: AppNetworkImage(
                                  url: category.imageUrl,
                                  fit: BoxFit.contain,
                                  backgroundColor: Colors.transparent,
                                ),
                              )
                            : Center(
                                child: Text(
                                  category.icon ?? displayName.characters.first,
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: t.inkSoft,
                                  ),
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
                  style: HomeTheme.circleLabel.copyWith(
                    fontWeight: FontWeight.w700,
                    color: t.ink,
                  ),
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
                      borderRadius: BorderRadius.circular(
                        worldSections ? 14 : 16,
                      ),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          ColoredBox(
                            color: accent,
                            child: category.imageUrl.isNotEmpty
                                ? Padding(
                                    padding: EdgeInsets.all(
                                      worldSections ? 6 : 0,
                                    ),
                                    child: AppNetworkImage(
                                      url: category.imageUrl,
                                      width: _size,
                                      height: _size,
                                      fit: worldSections
                                          ? BoxFit.contain
                                          : BoxFit.cover,
                                    ),
                                  )
                                : Center(
                                    child: Text(
                                      category.icon ??
                                          displayName.characters.first,
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w700,
                                        color: t.inkSoft.withValues(
                                          alpha: 0.85,
                                        ),
                                      ),
                                    ),
                                  ),
                          ),
                          if (!worldSections)
                            const CameraCornerFrame(
                              inset: 6,
                              arm: 10,
                              opacity: 0.72,
                            ),
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
