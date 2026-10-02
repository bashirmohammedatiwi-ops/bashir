import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/product_card_actions.dart';
import '../../data/models/banner.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/models/product.dart';
import '../../data/models/store_world.dart';
import '../categories/widgets/category_line_art.dart';
import '../home/home_link.dart';
import '../home/home_section_renderer.dart';
import 'worlds_provider.dart';

/// رئيسية العالم: بنرات، أقسام، منتجات، وبراندات خاصة به.
class WorldTabChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color accent;
  final Color ink;
  final VoidCallback onTap;

  const WorldTabChip({
    super.key,
    required this.label,
    required this.selected,
    required this.accent,
    required this.ink,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? accent : Colors.white,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Center(
            child: Text(label, style: TextStyle(fontWeight: FontWeight.w800, color: selected ? Colors.white : ink)),
          ),
        ),
      ),
    );
  }
}

class WorldExplore extends ConsumerWidget {
  final StoreWorld world;
  final void Function(String? categoryId) onOpenSections;

  const WorldExplore({super.key, required this.world, required this.onOpenSections});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final feed = ref.watch(worldFeedProvider(world.slug));
    return feed.when(
      loading: () => Center(child: CircularProgressIndicator(color: world.accent)),
      error: (_, __) => _CategoryFallback(world: world, lang: lang, onOpenSections: onOpenSections),
      data: (data) {
        final customSections = data.sections.where((section) => section.type != 'HERO_BANNER').toList();
        final products = <Product>[
          ...data.bestSellers,
          ...data.newArrivals.where((p) => data.bestSellers.every((b) => b.id != p.id)),
          ...data.promoProducts.where(
            (p) => data.bestSellers.every((b) => b.id != p.id) && data.newArrivals.every((b) => b.id != p.id),
          ),
        ];
        return ListView(
          padding: const EdgeInsets.only(bottom: 16),
          children: [
            if (data.banners.isNotEmpty) ...[
              const SizedBox(height: 12),
              _BannerStrip(banners: data.banners, accent: world.accent, lang: lang),
            ],
            if (world.categories.isNotEmpty) ...[
              _EditorialTitle(title: lang == 'en' ? 'Index' : 'الفهرس', ink: world.ink, accent: world.accent),
              _FeaturedSection(
                category: world.categories.first,
                lang: lang,
                accent: world.accent,
                ink: world.ink,
                onTap: () => onOpenSections(world.categories.first.id),
              ),
              for (var i = 1; i < world.categories.length; i++)
                _IndexLine(
                  category: world.categories[i],
                  index: i + 1,
                  lang: lang,
                  ink: world.ink,
                  accent: world.accent,
                  onTap: () => onOpenSections(world.categories[i].id),
                ),
            ],
            if (customSections.isNotEmpty)
              for (final section in customSections)
                HomeSectionWidget(key: ValueKey(section.id), section: section),
            if (customSections.isEmpty && data.bestSellers.isNotEmpty) ...[
              _EditorialTitle(title: lang == 'en' ? 'Best sellers' : 'الأكثر مبيعاً', ink: world.ink, accent: world.accent),
              _WorldProductStrip(products: data.bestSellers.take(12).toList(), lang: lang, accent: world.accent, ink: world.ink),
            ],
            if (customSections.isEmpty && data.newArrivals.isNotEmpty) ...[
              _EditorialTitle(title: lang == 'en' ? 'Just in' : 'وصل حديثاً', ink: world.ink, accent: world.accent),
              _WorldProductStrip(products: data.newArrivals.take(12).toList(), lang: lang, accent: world.accent, ink: world.ink),
            ],
            if (customSections.isEmpty && data.bestSellers.isEmpty && data.newArrivals.isEmpty && products.isNotEmpty) ...[
              _EditorialTitle(title: lang == 'en' ? 'From this world' : 'من هذا العالم', ink: world.ink, accent: world.accent),
              _WorldProductStrip(products: products.take(12).toList(), lang: lang, accent: world.accent, ink: world.ink),
            ],
            if (customSections.isEmpty && data.brands.isNotEmpty) ...[
              _EditorialTitle(title: lang == 'en' ? 'Brands' : 'البراندات', ink: world.ink, accent: world.accent),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final brand in data.brands)
                      _BrandName(
                        brand: brand,
                        lang: lang,
                        accent: world.accent,
                        ink: world.ink,
                      ),
                  ],
                ),
              ),
            ],
            if (data.banners.isEmpty && products.isEmpty && world.categories.isEmpty)
              Padding(
                padding: const EdgeInsets.all(28),
                child: Text(
                  lang == 'en' ? 'Link sections to this world from the admin' : 'اربطي أقسام هذا العالم من لوحة التحكم',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontWeight: FontWeight.w800, color: world.ink),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _BannerStrip extends StatefulWidget {
  final List<AppBanner> banners;
  final Color accent;
  final String lang;

  const _BannerStrip({required this.banners, required this.accent, required this.lang});

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
    if (banners.length == 1) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: _BannerCard(banner: banners.first, accent: widget.accent, lang: widget.lang, height: 132),
      );
    }
    return Column(
      children: [
        SizedBox(
          height: 118,
          child: PageView.builder(
            controller: _page,
            itemCount: banners.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (_, i) {
              final banner = banners[i];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: _BannerCard(banner: banner, accent: widget.accent, lang: widget.lang, height: 118),
              );
            },
          ),
        ),
        if (banners.length > 1) ...[
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 0; i < banners.length; i++)
                AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  width: i == _index ? 14 : 5,
                  height: 5,
                  decoration: BoxDecoration(
                    color: i == _index ? widget.accent : widget.accent.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
            ],
          ),
        ],
      ],
    );
  }
}

class _BannerCard extends StatelessWidget {
  final AppBanner banner;
  final Color accent;
  final String lang;
  final double height;

  const _BannerCard({
    required this.banner,
    required this.accent,
    required this.lang,
    required this.height,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => openBannerLink(context, banner),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: SizedBox(
          height: height,
          width: double.infinity,
          child: banner.hasImage
              ? AppNetworkImage(url: banner.imageUrl, fit: BoxFit.cover, backgroundColor: Colors.white)
              : ColoredBox(
                  color: accent,
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        banner.titleForLang(lang) ?? '',
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16),
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
  final Color ink;
  final Color accent;

  const _EditorialTitle({required this.title, required this.ink, required this.accent});

  @override
  Widget build(BuildContext context) {
    final line = accent.withValues(alpha: 0.28);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 12),
      child: Row(
        children: [
          Expanded(child: Container(height: 1, color: line)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              title,
              style: TextStyle(fontSize: 12, letterSpacing: 0.8, fontWeight: FontWeight.w800, color: ink),
            ),
          ),
          Expanded(child: Container(height: 1, color: line)),
        ],
      ),
    );
  }
}

class _FeaturedSection extends StatelessWidget {
  final Category category;
  final String lang;
  final Color accent;
  final Color ink;
  final VoidCallback onTap;

  const _FeaturedSection({
    required this.category,
    required this.lang,
    required this.accent,
    required this.ink,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final count = category.children.length;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 4),
      child: Material(
        color: Colors.white,
        shape: RoundedRectangleBorder(side: BorderSide(color: accent.withValues(alpha: 0.28))),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: SizedBox(
            height: 92,
            child: Row(
              children: [
                SizedBox(
                  width: 92,
                  height: 92,
                  child: ColoredBox(color: AppColors.blush, child: CategoryLineArt(category: category, size: 92)),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('01', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: accent)),
                        const Spacer(),
                        Text(
                          category.localizedName(lang),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 16, height: 1.15, fontWeight: FontWeight.w800, color: ink),
                        ),
                        if (count > 0)
                          Text(
                            lang == 'en' ? '$count sections' : '$count أقسام',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: ink.withValues(alpha: 0.5)),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _IndexLine extends StatelessWidget {
  final Category category;
  final int index;
  final String lang;
  final Color ink;
  final Color accent;
  final VoidCallback onTap;

  const _IndexLine({
    required this.category,
    required this.index,
    required this.lang,
    required this.ink,
    required this.accent,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final mark = index.toString().padLeft(2, '0');
    final count = category.children.length;
    return InkWell(
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
                child: Text(mark, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: accent)),
              ),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(border: Border.all(color: accent.withValues(alpha: 0.2))),
                clipBehavior: Clip.antiAlias,
                child: ColoredBox(color: Colors.white, child: CategoryLineArt(category: category, size: 36)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  category.localizedName(lang),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: ink),
                ),
              ),
              if (count > 0)
                Padding(
                  padding: const EdgeInsetsDirectional.only(end: 6),
                  child: Text('$count', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: ink.withValues(alpha: 0.4))),
                ),
              Icon(
                Directionality.of(context) == TextDirection.rtl ? Icons.arrow_back_rounded : Icons.arrow_forward_rounded,
                size: 16,
                color: accent.withValues(alpha: 0.7),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WorldProductStrip extends StatelessWidget {
  final List<Product> products;
  final String lang;
  final Color accent;
  final Color ink;

  const _WorldProductStrip({
    required this.products,
    required this.lang,
    required this.accent,
    required this.ink,
  });

  @override
  Widget build(BuildContext context) {
    final lead = products.first;
    final rest = products.skip(1).toList();
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: _LeadProduct(product: lead, lang: lang, accent: accent, ink: ink),
        ),
        if (rest.isNotEmpty) ...[
          const SizedBox(height: 14),
          SizedBox(
            height: 206,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: rest.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, i) => _WorldProductTile(product: rest[i], lang: lang, accent: accent, ink: ink),
            ),
          ),
        ],
      ],
    );
  }
}

class _LeadProduct extends StatelessWidget {
  final Product product;
  final String lang;
  final Color accent;
  final Color ink;

  const _LeadProduct({
    required this.product,
    required this.lang,
    required this.accent,
    required this.ink,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(side: BorderSide(color: accent.withValues(alpha: 0.28))),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/product/${product.slug.isNotEmpty ? product.slug : product.id}'),
        child: SizedBox(
          height: 108,
          child: Row(
            children: [
              SizedBox(
                width: 108,
                height: 108,
                child: AppNetworkImage(url: product.coverUrl, fit: BoxFit.contain, backgroundColor: Colors.white),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 10, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.localizedName(lang),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 14, height: 1.25, fontWeight: FontWeight.w800, color: ink),
                      ),
                      const Spacer(),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              formatPrice(product.price),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: ink),
                            ),
                          ),
                          ProductCardCartControl(product: product, compact: true, style: ProductCardCartStyle.homeBadge),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WorldProductTile extends StatelessWidget {
  final Product product;
  final String lang;
  final Color accent;
  final Color ink;

  const _WorldProductTile({
    required this.product,
    required this.lang,
    required this.accent,
    required this.ink,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 124,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () => context.push('/product/${product.slug.isNotEmpty ? product.slug : product.id}'),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: accent, width: 2)),
              ),
              child: SizedBox(
                width: 124,
                height: 124,
                child: AppNetworkImage(url: product.coverUrl, fit: BoxFit.contain, backgroundColor: Colors.white),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            product.localizedName(lang),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12, height: 1.25, fontWeight: FontWeight.w700, color: ink),
          ),
          const Spacer(),
          Row(
            children: [
              Expanded(
                child: Text(
                  formatPrice(product.price),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: ink),
                ),
              ),
              ProductCardCartControl(product: product, compact: true, style: ProductCardCartStyle.homeBadge),
            ],
          ),
        ],
      ),
    );
  }
}

class _BrandName extends StatelessWidget {
  final Brand brand;
  final String lang;
  final Color accent;
  final Color ink;

  const _BrandName({
    required this.brand,
    required this.lang,
    required this.accent,
    required this.ink,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        context.push('/products?brandId=${brand.id}&title=${Uri.encodeComponent(brand.localizedName(lang))}');
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          border: Border.all(color: accent.withValues(alpha: 0.28)),
        ),
        child: Text(
          brand.localizedName(lang),
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: ink),
        ),
      ),
    );
  }
}

class _CategoryFallback extends StatelessWidget {
  final StoreWorld world;
  final String lang;
  final void Function(String? categoryId) onOpenSections;

  const _CategoryFallback({required this.world, required this.lang, required this.onOpenSections});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: TextButton(
        onPressed: () => onOpenSections(null),
        child: Text(lang == 'en' ? 'Browse sections' : 'تصفّح الأقسام', style: TextStyle(color: world.accent, fontWeight: FontWeight.w800)),
      ),
    );
  }
}
