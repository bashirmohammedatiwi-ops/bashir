import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_fonts.dart';
import '../../core/theme/app_text.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/banner.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/models/home_feed.dart';
import '../../data/models/product.dart';
import '../../data/models/store_world.dart';
import '../categories/widgets/category_line_art.dart';
import '../home/home_link.dart';
import '../home/home_section_renderer.dart';
import '../home/widgets/home_product_row.dart';
import 'world_strings.dart';
import 'world_theme.dart';
import 'worlds_provider.dart';

/// سحب للتحديث في شاشة العالم: تفاصيله (الأقسام والألوان) وواجهته (الأسعار والمخزون).
/// الخطأ لا يُرمى — الحالة الظاهرة تعرضه هي، والمؤشر يتوقف.
Future<void> refreshWorld(WidgetRef ref, String slug) async {
  ref.invalidate(worldDetailProvider(slug));
  ref.invalidate(worldFeedProvider(slug));
  try {
    await Future.wait([
      ref.read(worldDetailProvider(slug).future),
      ref.read(worldFeedProvider(slug).future),
    ]);
  } catch (_) {}
}

/// ارتفاع شريط البنرات — محجوز أثناء التحميل حتى لا تقفز الصفحة حين يصل.
const double _bannerHeight = 132;

/// رئيسية العالم: الفهرس فوراً من بيانات العالم، ثم البنرات والأقسام المخصّصة
/// والمنتجات والبراندات حين تصل واجهته.
class WorldExplore extends ConsumerWidget {
  final StoreWorld world;

  /// يفتح القسم: بلا فروع → منتجاته، وغيره → الفهرس عنده. null → الفهرس كله.
  final void Function(Category? category) onOpenSections;

  const WorldExplore({super.key, required this.world, required this.onOpenSections});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;
    final feedAsync = ref.watch(worldFeedProvider(world.slug));
    final data = feedAsync.valueOrNull;
    final loading = data == null && !feedAsync.hasError;
    final failed = data == null && feedAsync.hasError;

    final customSections =
        data?.sections.where((section) => section.type != 'HERO_BANNER').toList() ?? const [];
    final products = data == null ? const <Product>[] : _mixed(data);
    final name = world.localizedName(lang);

    String shelfLink(String flag, String shelf) =>
        '/products?$flag=1&world=${Uri.encodeComponent(world.slug)}'
        '&title=${Uri.encodeComponent(s.worldShelfTitle(shelf, name))}';

    return RefreshIndicator(
      color: world.accent,
      onRefresh: () => refreshWorld(ref, world.slug),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 16),
        children: [
          if (loading)
            const Padding(
              padding: EdgeInsetsDirectional.fromSTEB(16, 12, 16, 0),
              child: ShimmerBox(height: _bannerHeight, radius: AppCorners.md),
            )
          else if (data != null && data.banners.isNotEmpty) ...[
            const SizedBox(height: 12),
            _BannerStrip(banners: data.banners, world: world, lang: lang),
          ],
          // الفهرس من بيانات العالم نفسها — لا ينتظر الواجهة ولا يختفي إن فشلت.
          if (world.categories.isNotEmpty) ...[
            _EditorialTitle(title: s.worldIndexTitle, lang: lang, ink: world.ink, accent: world.accent),
            _FeaturedSection(
              category: world.categories.first,
              lang: lang,
              world: world,
              onTap: () => onOpenSections(world.categories.first),
            ),
            for (var i = 1; i < world.categories.length; i++)
              _IndexLine(
                category: world.categories[i],
                index: i + 1,
                lang: lang,
                world: world,
                onTap: () => onOpenSections(world.categories[i]),
              ),
          ],
          if (loading) const _FeedSkeleton(),
          if (failed)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: ErrorView.from(
                feedAsync.error,
                onRetry: () => ref.invalidate(worldFeedProvider(world.slug)),
              ),
            ),
          if (data != null) ...[
            for (final section in customSections)
              HomeSectionWidget(key: ValueKey(section.id), section: section),
            if (customSections.isEmpty && data.bestSellers.isNotEmpty) ...[
              _EditorialTitle(title: s.worldBestSellers, lang: lang, ink: world.ink, accent: world.accent),
              HomeProductRow(
                products: data.bestSellers.take(12).toList(),
                showPromoBadge: true,
                viewAllLabel: s.viewAll,
                onViewAll: () => context.push(shelfLink('isBestSeller', s.worldBestSellersTitle)),
              ),
            ],
            if (customSections.isEmpty && data.newArrivals.isNotEmpty) ...[
              _EditorialTitle(title: s.worldJustIn, lang: lang, ink: world.ink, accent: world.accent),
              HomeProductRow(
                products: data.newArrivals.take(12).toList(),
                showPromoBadge: true,
                viewAllLabel: s.viewAll,
                onViewAll: () => context.push(shelfLink('isNew', s.worldJustInTitle)),
              ),
            ],
            if (customSections.isEmpty && data.bestSellers.isEmpty && data.newArrivals.isEmpty && products.isNotEmpty) ...[
              _EditorialTitle(title: s.worldFromThisWorld, lang: lang, ink: world.ink, accent: world.accent),
              HomeProductRow(
                products: products.take(12).toList(),
                showPromoBadge: true,
                viewAllLabel: s.viewAll,
                onViewAll: () => context.push(
                  '/products?world=${Uri.encodeComponent(world.slug)}&title=${Uri.encodeComponent(name)}',
                ),
              ),
            ],
            if (customSections.isEmpty && data.brands.isNotEmpty) ...[
              _EditorialTitle(title: s.worldBrands, lang: lang, ink: world.ink, accent: world.accent),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final brand in data.brands) _BrandName(brand: brand, lang: lang, world: world),
                  ],
                ),
              ),
            ],
            if (data.banners.isEmpty && products.isEmpty && customSections.isEmpty && world.categories.isEmpty)
              Padding(
                padding: const EdgeInsets.all(28),
                child: Text(
                  s.worldComingSoon,
                  textAlign: TextAlign.center,
                  style: AppText.title3.copyWith(color: world.ink),
                ),
              ),
          ],
        ],
      ),
    );
  }

  /// الأكثر مبيعاً ثم الجديد ثم العروض بلا تكرار — لرفّ «من هذا العالم».
  static List<Product> _mixed(HomeFeed data) {
    final seen = <String>{};
    return [
      for (final p in [...data.bestSellers, ...data.newArrivals, ...data.promoProducts])
        if (seen.add(p.id)) p,
    ];
  }
}

/// مكان رفّ المنتجات أثناء وصول الواجهة — بنفس ارتفاعه.
class _FeedSkeleton extends StatelessWidget {
  const _FeedSkeleton();

  @override
  Widget build(BuildContext context) {
    final width = Responsive.productCardWidth(context);
    final height = Responsive.productCardHeight(context);
    return ExcludeSemantics(
      child: Padding(
        padding: const EdgeInsets.only(top: 22),
        child: SizedBox(
          height: height + 4,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const NeverScrollableScrollPhysics(),
            padding: EdgeInsets.symmetric(horizontal: Responsive.horizontalPadding(context)),
            itemCount: 3,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, __) => ShimmerBox(width: width, height: height, radius: AppCorners.md),
          ),
        ),
      ),
    );
  }
}

class _BannerStrip extends StatefulWidget {
  final List<AppBanner> banners;
  final StoreWorld world;
  final String lang;

  const _BannerStrip({required this.banners, required this.world, required this.lang});

  @override
  State<_BannerStrip> createState() => _BannerStripState();
}

class _BannerStripState extends State<_BannerStrip> {
  final _page = PageController(viewportFraction: 0.78);
  int _index = 0;

  @override
  void dispose() {
    _page.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final banners = widget.banners;
    final accent = widget.world.accent;
    if (banners.length == 1) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: _BannerCard(banner: banners.first, world: widget.world, lang: widget.lang, height: _bannerHeight),
      );
    }
    final motion = MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 260);
    return Column(
      children: [
        SizedBox(
          height: 122,
          child: PageView.builder(
            controller: _page,
            itemCount: banners.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (_, i) {
              final active = i == _index;
              return AnimatedScale(
                duration: motion,
                curve: Curves.easeOutCubic,
                scale: active ? 1.0 : 0.94,
                child: AnimatedOpacity(
                  duration: motion,
                  opacity: active ? 1.0 : 0.55,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: _BannerCard(banner: banners[i], world: widget.world, lang: widget.lang, height: 122),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            for (var i = 0; i < banners.length; i++)
              AnimatedContainer(
                duration: motion,
                curve: Curves.easeOutCubic,
                margin: const EdgeInsets.symmetric(horizontal: 2.5),
                width: i == _index ? 16 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: i == _index ? accent : accent.withValues(alpha: 0.22),
                  borderRadius: BorderRadius.circular(AppCorners.pill),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _BannerCard extends StatelessWidget {
  final AppBanner banner;
  final StoreWorld world;
  final String lang;
  final double height;

  const _BannerCard({
    required this.banner,
    required this.world,
    required this.lang,
    required this.height,
  });

  @override
  Widget build(BuildContext context) {
    final title = banner.titleForLang(lang) ?? '';
    // التعبئة ولون النص من لوحة العالم — تباين مقروء حتى مع الألوان الفاتحة كالذهبي.
    final palette = WorldThemePalette.fromWorld(world);
    return Semantics(
      button: true,
      label: title.isEmpty ? null : title,
      child: Material(
        color: world.surface,
        borderRadius: BorderRadius.circular(AppCorners.md),
        clipBehavior: Clip.antiAlias,
        elevation: 1.5,
        shadowColor: world.accent.withValues(alpha: 0.20),
        child: InkWell(
          onTap: () => openBannerLink(context, banner),
          child: SizedBox(
            height: height,
            width: double.infinity,
            child: banner.hasImage
                ? AppNetworkImage(url: banner.imageUrl, fit: BoxFit.cover, backgroundColor: Colors.white)
                : DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: AlignmentDirectional.topStart,
                        end: AlignmentDirectional.bottomEnd,
                        colors: [palette.buttonFill, Color.lerp(palette.buttonFill, Colors.black, 0.12)!],
                      ),
                    ),
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          title,
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.title3.copyWith(fontSize: 16, fontWeight: FontWeight.w800, color: palette.onAccent),
                        ),
                      ),
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

class _EditorialTitle extends StatelessWidget {
  final String title;
  final String lang;
  final Color ink;
  final Color accent;

  const _EditorialTitle({required this.title, required this.lang, required this.ink, required this.accent});

  @override
  Widget build(BuildContext context) {
    final line = accent.withValues(alpha: 0.28);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 12),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 1,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: AlignmentDirectional.centerStart,
                  end: AlignmentDirectional.centerEnd,
                  colors: [Colors.transparent, line],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Semantics(
              header: true,
              child: Text(
                title,
                style: AppText.caption.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: tracking(lang, 0.8),
                  color: ink,
                ),
              ),
            ),
          ),
          Expanded(
            child: Container(
              height: 1,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: AlignmentDirectional.centerStart,
                  end: AlignmentDirectional.centerEnd,
                  colors: [line, Colors.transparent],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeaturedSection extends ConsumerWidget {
  final Category category;
  final String lang;
  final StoreWorld world;
  final VoidCallback onTap;

  const _FeaturedSection({
    required this.category,
    required this.lang,
    required this.world,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final accent = world.accent;
    final ink = world.ink;
    final count = category.children.length;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 4),
      child: Material(
        color: world.surface,
        elevation: 1.5,
        shadowColor: accent.withValues(alpha: 0.18),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppCorners.md),
          side: BorderSide(color: accent.withValues(alpha: 0.28)),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: ConstrainedBox(
            // يتمدد مع تكبير الخط بدل أن يقصّ الاسم والعدد.
            constraints: const BoxConstraints(minHeight: 92),
            child: Row(
              children: [
                SizedBox(
                  width: 92,
                  height: 92,
                  child: ColoredBox(
                    color: Color.alphaBlend(accent.withValues(alpha: 0.07), world.surface),
                    child: CategoryLineArt(category: category, size: 92),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsetsDirectional.fromSTEB(12, 10, 12, 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('01', style: AppText.caption.copyWith(fontWeight: FontWeight.w800, color: accent)),
                        const SizedBox(height: 6),
                        Text(
                          category.localizedName(lang),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.title3.copyWith(
                            fontSize: 16,
                            height: 1.2,
                            letterSpacing: tracking(lang, -0.2),
                            fontWeight: FontWeight.w800,
                            color: ink,
                          ),
                        ),
                        if (count > 0)
                          Text(
                            s.sectionCount(count),
                            style: AppText.micro.copyWith(fontWeight: FontWeight.w600, color: ink.withValues(alpha: 0.55)),
                          ),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsetsDirectional.only(end: 12),
                  child: Icon(Icons.chevron_right_rounded, size: 20, color: accent.withValues(alpha: 0.6)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _IndexLine extends ConsumerWidget {
  final Category category;
  final int index;
  final String lang;
  final StoreWorld world;
  final VoidCallback onTap;

  const _IndexLine({
    required this.category,
    required this.index,
    required this.lang,
    required this.world,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final accent = world.accent;
    final mark = index.toString().padLeft(2, '0');
    final count = category.children.length;
    return Semantics(
      button: true,
      label: category.localizedName(lang),
      hint: count > 0 ? s.sectionCount(count) : null,
      excludeSemantics: true,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: accent.withValues(alpha: 0.16))),
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 28,
                  child: Text(mark, style: AppText.caption.copyWith(fontWeight: FontWeight.w800, color: accent)),
                ),
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppCorners.xs),
                    border: Border.all(color: accent.withValues(alpha: 0.2)),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: ColoredBox(color: world.surface, child: CategoryLineArt(category: category, size: 36)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    category.localizedName(lang),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.label.copyWith(fontSize: 14, color: world.ink),
                  ),
                ),
                if (count > 0)
                  Padding(
                    padding: const EdgeInsetsDirectional.only(end: 6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(AppCorners.pill),
                      ),
                      child: Text(
                        '$count',
                        style: AppText.micro.copyWith(color: accent.withValues(alpha: 0.9)),
                      ),
                    ),
                  ),
                Icon(Icons.arrow_forward_rounded, size: 16, color: accent.withValues(alpha: 0.7)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BrandName extends StatelessWidget {
  final Brand brand;
  final String lang;
  final StoreWorld world;

  const _BrandName({required this.brand, required this.lang, required this.world});

  @override
  Widget build(BuildContext context) {
    final name = brand.localizedName(lang);
    final shape = StadiumBorder(side: BorderSide(color: world.accent.withValues(alpha: 0.28)));
    return Material(
      color: world.surface,
      shape: shape,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        customBorder: shape,
        onTap: () {
          HapticFeedback.selectionClick();
          context.push('/brand/${Uri.encodeComponent(brand.slug.isNotEmpty ? brand.slug : brand.id)}');
        },
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: kMinTapTarget),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Center(
              widthFactor: 1,
              child: Text(name, style: AppText.label.copyWith(fontSize: 12.5, color: world.ink)),
            ),
          ),
        ),
      ),
    );
  }
}
