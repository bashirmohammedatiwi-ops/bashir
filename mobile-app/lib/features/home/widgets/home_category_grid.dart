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

/// شبكة أقسام العالم: أربعة أعمدة كاملة بلا تمرير جانبي ولا بلاطات مقصوصة على
/// الحافة — حتى صفّين (8 بلاطات). ما زاد عنها تجمعه بلاطة «الكل +N» الأخيرة.
class _WorldCategoryLayout extends StatelessWidget {
  final List<Category> categories;
  final Color? wash;
  const _WorldCategoryLayout({required this.categories, this.wash});

  static const _cols = 4;
  static const _maxTiles = 8;
  static const _gap = 10.0;
  static const _runGap = 14.0;

  @override
  Widget build(BuildContext context) {
    final n = categories.length;
    final overflow = n > _maxTiles;
    // البلاطة الأخيرة تصير «الكل» حين يزيد العدد عن صفّين.
    final shown = overflow ? _maxTiles - 1 : n;
    final total = overflow ? _maxTiles : n;
    // مساحة سطرين للاسم («العناية بالبشرة» لا تُقصّ) تكبر مع حجم خط النظام.
    final label = MediaQuery.textScalerOf(context).scale(30) + 5;
    return LayoutBuilder(
      builder: (context, c) {
        final tileW = (c.maxWidth - 32 - _gap * (_cols - 1)) / _cols;
        final tileH = tileW + label;
        final rows = (total / _cols).ceil();
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: [
              for (var r = 0; r < rows; r++) ...[
                if (r > 0) const SizedBox(height: _runGap),
                SizedBox(
                  height: tileH,
                  child: Row(
                    children: [
                      for (var col = 0; col < _cols; col++) ...[
                        if (col > 0) const SizedBox(width: _gap),
                        Expanded(
                          child: Builder(builder: (context) {
                            final i = r * _cols + col;
                            if (i >= total) return const SizedBox.shrink();
                            if (overflow && i == shown) {
                              return _AllCategoriesTile(more: n - shown, wash: wash);
                            }
                            return _CategorySquareTile(
                              category: categories[i],
                              index: i,
                              wash: wash,
                              worldSections: true,
                              // الصورة داخل حشوة 8 من كل جانب.
                              imageSize: tileW - 16,
                            );
                          }),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

/// بلاطة «الكل» — بنفس شكل بلاطات الأقسام، تفتح تبويب الأقسام.
class _AllCategoriesTile extends ConsumerWidget {
  final int more;
  final Color? wash;
  const _AllCategoriesTile({required this.more, this.wash});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final s = ref.s;
    final accent = wash ?? t.accentLight;
    return Semantics(
      button: true,
      label: s.viewAll,
      excludeSemantics: true,
      child: HomeTapScale(
        onTap: () => openCategoriesTab(
          context,
          ProviderScope.containerOf(context, listen: false),
        ),
        child: Column(
          children: [
            Expanded(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color.lerp(accent, Colors.white, 0.6)!, accent],
                  ),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.white, width: 1.2),
                ),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: t.accent,
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Icon(Icons.grid_view_rounded, size: 17, color: t.onAccent),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '+$more',
                        textDirection: TextDirection.ltr,
                        style: AppText.caption.copyWith(
                          fontWeight: FontWeight.w800,
                          color: t.accentDark,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 5),
            Text(
              s.all,
              maxLines: 2,
              textAlign: TextAlign.center,
              style: HomeTheme.circleLabel.copyWith(
                fontWeight: FontWeight.w700,
                height: 1.1,
                color: t.ink,
              ),
            ),
          ],
        ),
      ),
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

  /// مقاس صورة البلاطة في شبكة العالم — تُفكّ بحجمها الفعلي لا بعرض الشاشة.
  final double? imageSize;

  const _CategorySquareTile({
    required this.category,
    required this.index,
    this.wash,
    this.worldSections = false,
    this.imageSize,
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
    // بديل الصورة: أيقونة القسم أو أول حرف من اسمه (والاسم قد يصل فارغاً).
    final glyph = category.icon ??
        (displayName.isEmpty ? '' : displayName.characters.first);

    return HomeTapScale(
      onTap: () {
        if (worldSections && (category.listingKind == 'subcategory' || category.listingKind == 'tertiary')) {
          final title = Uri.encodeComponent(displayName);
          final param = category.listingKind == 'tertiary' ? 'tertiaryCategoryId' : 'subcategoryId';
          context.push('/products?$param=${category.id}&title=$title');
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
                                  width: imageSize,
                                  height: imageSize,
                                  fit: BoxFit.contain,
                                  backgroundColor: Colors.transparent,
                                ),
                              )
                            : Center(
                                child: Text(
                                  glyph,
                                  style: AppText.title3.copyWith(
                                    fontSize: 16,
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
                  maxLines: 2,
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.ellipsis,
                  style: HomeTheme.circleLabel.copyWith(
                    fontWeight: FontWeight.w700,
                    height: 1.1,
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
                                      glyph,
                                      style: AppText.title3.copyWith(
                                        fontSize: 18,
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
