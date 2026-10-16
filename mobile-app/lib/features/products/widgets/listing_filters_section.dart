import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/brand.dart';
import '../../../data/models/category.dart';
import '../../home/widgets/home_animations.dart';
import '../../worlds/world_theme.dart';
import '../listing_navigation.dart';
import 'listing_theme.dart';

/// رأس صفحة القسم فوق شبكة المنتجات:
/// 1. شريط الأقسام الفرعية — بطاقات مربعة بصورة القسم (كما في الرئيسية)، المختار بحلقة متدرّجة.
/// 2. شريط البراندات — بطاقات شعار أنيقة مع عدد المنتجات، والمختار بإطار وعلامة.
/// كلاهما يتمرّر أفقياً بحواف متلاشية، ويقفز تلقائياً إلى العنصر المختار.
class ListingFiltersSection extends ConsumerWidget {
  final List<Category> childCategories;
  final String? activeChildId;
  final String? categoryId;
  final String? subcategoryId;
  final String? tertiaryCategoryId;
  final String parentTitle;
  final bool showTertiaryLabel;
  final String? effectiveSubId;
  final AsyncValue<List<Brand>>? brandsAsync;
  final String? selectedBrandId;
  final String listingTitle;

  const ListingFiltersSection({
    super.key,
    required this.childCategories,
    required this.activeChildId,
    required this.categoryId,
    required this.subcategoryId,
    required this.tertiaryCategoryId,
    required this.parentTitle,
    required this.showTertiaryLabel,
    required this.effectiveSubId,
    required this.brandsAsync,
    required this.selectedBrandId,
    required this.listingTitle,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageCodeProvider);
    final t = context.worldTheme;
    final brands = (brandsAsync?.valueOrNull ?? const <Brand>[]).take(30).toList();
    final showChildren = childCategories.isNotEmpty;
    final showBrands = brands.isNotEmpty;
    if (!showChildren && !showBrands) return const SizedBox(height: 6);

    void openChild(Category? c) => navigateListingChild(
          context: context,
          categoryId: categoryId,
          subcategoryId: effectiveSubId ?? subcategoryId,
          tertiaryCategoryId: tertiaryCategoryId,
          child: c,
          parentTitle: parentTitle,
        );

    void openBrand(String? id) => navigateListingBrand(
          context: context,
          categoryId: effectiveSubId == null ? categoryId : null,
          subcategoryId: effectiveSubId,
          tertiaryCategoryId: tertiaryCategoryId,
          brandId: id,
          title: listingTitle,
        );

    final allCount = childCategories.fold<int>(0, (sum, c) => sum + c.displayCount);

    return Padding(
      padding: const EdgeInsets.only(top: 6, bottom: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (showChildren)
            _FadedRail(
              height: _SubTile.height,
              itemCount: childCategories.length + 1,
              activeIndex: activeChildId == null
                  ? 0
                  : childCategories.indexWhere((c) => c.id == activeChildId) + 1,
              separator: 10,
              itemBuilder: (context, i) {
                if (i == 0) {
                  return _SubTile.all(
                    label: s.all,
                    count: allCount,
                    selected: activeChildId == null,
                    onTap: () => openChild(null),
                  );
                }
                final c = childCategories[i - 1];
                return _SubTile(
                  label: c.localizedName(lang),
                  imageUrl: c.imageUrl,
                  fallback: c.icon,
                  index: i - 1,
                  selected: activeChildId == c.id,
                  onTap: () => openChild(c),
                );
              },
            ),
          if (showBrands) ...[
            SizedBox(height: showChildren ? 14 : 4),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: ListingTheme.padH),
              child: Row(
                children: [
                  Container(
                    width: 3,
                    height: 14,
                    decoration: BoxDecoration(
                      gradient: t.signatureGradient,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(s.navBrands, style: ListingTheme.sectionTitle(context)),
                  const SizedBox(width: 6),
                  Text(formatNumber(brands.length), style: ListingTheme.sectionHint(context)),
                  const Spacer(),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: selectedBrandId == null
                        ? const SizedBox.shrink()
                        : GestureDetector(
                            key: const ValueKey('clear'),
                            behavior: HitTestBehavior.opaque,
                            onTap: () {
                              HapticFeedback.selectionClick();
                              openBrand(null);
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.close_rounded, size: 15, color: t.accentDark),
                                  const SizedBox(width: 3),
                                  Text(
                                    s.clear,
                                    style: AppText.caption.copyWith(
                                      color: t.accentDark,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            _FadedRail(
              height: _BrandChip.height,
              itemCount: brands.length,
              activeIndex: selectedBrandId == null ? -1 : brands.indexWhere((b) => b.id == selectedBrandId),
              separator: 8,
              itemBuilder: (context, i) {
                final b = brands[i];
                final selected = selectedBrandId == b.id;
                return _BrandChip(
                  brand: b,
                  name: b.localizedName(lang),
                  countLabel: b.productCount > 0 ? '${formatNumber(b.productCount)} ${s.isAr ? 'منتج' : 'items'}' : null,
                  selected: selected,
                  onTap: () => openBrand(selected ? null : b.id),
                );
              },
            ),
          ],
          const SizedBox(height: 6),
        ],
      ),
    );
  }
}

/// شريط أفقي بحواف متلاشية، يمرّر العنصر المختار إلى المنتصف عند الظهور.
class _FadedRail extends StatefulWidget {
  final double height;
  final int itemCount;
  final int activeIndex;
  final double separator;
  final IndexedWidgetBuilder itemBuilder;

  const _FadedRail({
    required this.height,
    required this.itemCount,
    required this.activeIndex,
    required this.separator,
    required this.itemBuilder,
  });

  @override
  State<_FadedRail> createState() => _FadedRailState();
}

class _FadedRailState extends State<_FadedRail> {
  final _activeKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _revealActive(animate: false);
  }

  @override
  void didUpdateWidget(covariant _FadedRail old) {
    super.didUpdateWidget(old);
    if (old.activeIndex != widget.activeIndex) _revealActive(animate: true);
  }

  void _revealActive({required bool animate}) {
    if (widget.activeIndex <= 0) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ctx = _activeKey.currentContext;
      if (ctx == null || !mounted) return;
      Scrollable.ensureVisible(
        ctx,
        alignment: 0.5,
        duration: animate ? const Duration(milliseconds: 380) : Duration.zero,
        curve: Curves.easeOutCubic,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final rtl = Directionality.of(context) == TextDirection.rtl;
    return SizedBox(
      height: widget.height,
      child: ShaderMask(
        blendMode: BlendMode.dstIn,
        shaderCallback: (rect) => LinearGradient(
          begin: rtl ? Alignment.centerRight : Alignment.centerLeft,
          end: rtl ? Alignment.centerLeft : Alignment.centerRight,
          colors: const [Colors.white, Colors.white, Colors.transparent],
          stops: const [0, 0.93, 1],
        ).createShader(rect),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: ListingTheme.padH),
          clipBehavior: Clip.none,
          itemCount: widget.itemCount,
          separatorBuilder: (_, __) => SizedBox(width: widget.separator),
          itemBuilder: (context, i) => KeyedSubtree(
            key: i == widget.activeIndex ? _activeKey : null,
            child: widget.itemBuilder(context, i),
          ),
        ),
      ),
    );
  }
}

/// بطاقة قسم فرعي: مربع بتدرّج ناعم وصورة القسم، واسمه تحته.
class _SubTile extends StatelessWidget {
  static const height = 102.0;
  static const _box = 66.0;
  static const _width = 76.0;

  final String label;
  final String? imageUrl;
  final String? fallback;
  final int index;
  final bool selected;
  final bool isAll;
  final int count;
  final VoidCallback onTap;

  const _SubTile({
    required this.label,
    required this.imageUrl,
    required this.fallback,
    required this.index,
    required this.selected,
    required this.onTap,
  })  : isAll = false,
        count = 0;

  const _SubTile.all({required this.label, required this.count, required this.selected, required this.onTap})
      : isAll = true,
        imageUrl = null,
        fallback = null,
        index = 0;

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final washes = [t.accentLight, t.accentSoft, t.canvasWarm, Color.lerp(t.accentLight, t.surface, 0.45)!];
    final wash = washes[index % washes.length];

    final Widget face;
    if (isAll) {
      face = DecoratedBox(
        decoration: BoxDecoration(gradient: t.signatureGradient),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.grid_view_rounded, color: Colors.white, size: 22),
            if (count > 0) ...[
              const SizedBox(height: 3),
              Text(
                formatNumber(count),
                style: AppText.micro.copyWith(
                  color: Colors.white.withValues(alpha: 0.9),
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ],
        ),
      );
    } else {
      face = DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color.lerp(wash, Colors.white, 0.6)!, wash],
          ),
        ),
        child: imageUrl != null && imageUrl!.isNotEmpty
            ? Padding(
                padding: const EdgeInsets.all(7),
                child: AppNetworkImage(url: imageUrl!, fit: BoxFit.contain, backgroundColor: Colors.transparent),
              )
            : Center(
                child: Text(
                  fallback ?? label.characters.first,
                  style: AppText.title3.copyWith(color: t.inkSoft),
                ),
              ),
      );
    }

    return Semantics(
      button: true,
      selected: selected,
      label: label,
      child: HomeTapScale(
        onTap: () {
          if (selected) return;
          HapticFeedback.selectionClick();
          onTap();
        },
        child: SizedBox(
          width: _width,
          child: Column(
            children: [
              // الحلقة المتدرّجة حول المختار — تظهر وتختفي بنعومة.
              AnimatedContainer(
                duration: const Duration(milliseconds: 260),
                curve: Curves.easeOutCubic,
                width: _box + 6,
                height: _box + 6,
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(23),
                  gradient: selected ? t.signatureGradient : null,
                  boxShadow: selected
                      ? [
                          BoxShadow(
                            color: t.accent.withValues(alpha: 0.28),
                            blurRadius: 14,
                            offset: const Offset(0, 6),
                          ),
                        ]
                      : null,
                ),
                child: Container(
                  padding: EdgeInsets.all(selected ? 2 : 0),
                  decoration: BoxDecoration(
                    color: t.canvas,
                    borderRadius: BorderRadius.circular(21),
                  ),
                  child: Container(
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(selected ? 19 : 21),
                      border: selected ? null : Border.all(color: Colors.white, width: 1.2),
                      boxShadow: selected
                          ? null
                          : [
                              BoxShadow(
                                color: t.accentDark.withValues(alpha: 0.06),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                    ),
                    child: face,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: AppText.caption.copyWith(
                  fontSize: 11.5,
                  height: 1.2,
                  color: selected ? t.accentDark : t.inkSoft,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                ),
              ),
              const SizedBox(height: 3),
              AnimatedContainer(
                duration: const Duration(milliseconds: 260),
                width: selected ? 14 : 0,
                height: 3,
                decoration: BoxDecoration(
                  gradient: t.signatureGradient,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// بطاقة براند: شعار في مربع أبيض + الاسم وعدد المنتجات.
class _BrandChip extends StatelessWidget {
  static const height = 52.0;

  final Brand brand;
  final String name;
  final String? countLabel;
  final bool selected;
  final VoidCallback onTap;

  const _BrandChip({
    required this.brand,
    required this.name,
    required this.countLabel,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Semantics(
      button: true,
      selected: selected,
      label: name,
      child: HomeTapScale(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsetsDirectional.fromSTEB(5, 5, 12, 5),
          decoration: BoxDecoration(
            color: selected ? t.accentLight : t.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: selected ? t.accent : t.hairline, width: selected ? 1.5 : 1),
            boxShadow: [
              BoxShadow(
                color: t.accentDark.withValues(alpha: selected ? 0.12 : 0.04),
                blurRadius: selected ? 12 : 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 40,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: t.divider),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: brand.logoUrl.isNotEmpty
                      ? AppNetworkImage(url: brand.logoUrl, fit: BoxFit.contain, backgroundColor: Colors.white)
                      : Center(
                          child: Text(
                            (brand.initial ?? name).characters.first.toUpperCase(),
                            style: AppText.title3.copyWith(color: t.accent),
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 9),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 130),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.label.copyWith(
                        fontSize: 13,
                        height: 1.15,
                        color: selected ? t.accentDark : t.ink,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    if (countLabel != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        countLabel!,
                        maxLines: 1,
                        style: AppText.micro.copyWith(color: t.inkMuted, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ],
                ),
              ),
              AnimatedSize(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOutCubic,
                child: selected
                    ? Padding(
                        padding: const EdgeInsetsDirectional.only(start: 8),
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(gradient: t.signatureGradient, shape: BoxShape.circle),
                          child: const Icon(Icons.check_rounded, size: 13, color: Colors.white),
                        ),
                      )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
