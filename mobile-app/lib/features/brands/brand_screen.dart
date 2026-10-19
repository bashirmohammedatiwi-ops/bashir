import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/brand.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_providers.dart';
import '../products/product_listing_screen.dart';
import '../products/widgets/listing_theme.dart';
import '../worlds/world_theme.dart';
import 'brand_avatar.dart';

extension _BrandScreenStrings on AppStrings {
  String get brandAuthentic => isAr ? 'أصلي 100٪' : '100% authentic';
  String get brandAuthenticHint =>
      isAr ? 'كل منتجات البراند أصلية ومضمونة' : 'Every product from this brand is genuine and guaranteed';
  String get brandShelfOffers => isAr ? 'العروض' : 'Offers';
  String get brandShelvesLabel => isAr ? 'تصفّح منتجات البراند' : 'Browse this brand';
}

/// رفوف البراند السريعة فوق الشبكة — كل واحد فلتر خادم على نفس القائمة.
enum _BrandShelf { all, bestSellers, newArrivals, offers }

/// تفاصيل البراند من الخادم (id أو slug) — تبقى 5 دقائق، والخطأ لا يبقى.
final _brandDetailProvider = FutureProvider.autoDispose.family<Brand, String>((ref, idOrSlug) {
  return keepAliveFor(
    ref,
    const Duration(minutes: 5),
    () => ref.read(apiServiceProvider).getBrandBySlug(idOrSlug),
  );
});

/// عدد منتجات البراند الظاهرة فعلاً في المتجر (`total` لصفحة بمنتج واحد).
final _brandProductCountProvider = FutureProvider.autoDispose.family<int, String>((ref, brandId) {
  return keepAliveFor(ref, const Duration(minutes: 2), () async {
    final page = await ref.read(apiServiceProvider).getProducts(brandId: brandId, limit: 1);
    return page.total;
  });
});

/// صفحة البراند: رأس بشعاره على لونه مع الاسم اللاتيني والعربي وعدد المنتجات وطمأنة
/// الأصالة، ثم رفوف سريعة (الكل / الأكثر مبيعاً / وصل حديثاً / العروض)، ثم الشبكة.
///
/// [idOrSlug] معرّف البراند أو slug (روابط /brand/:slug). [categoryId] أو [subcategoryId]
/// يقيّدان البراند بقسم حين يُفتح من داخله: منتجاته في القسم أولاً ثم الباقي.
class BrandScreen extends ConsumerStatefulWidget {
  final String idOrSlug;
  final String? categoryId;
  final String? subcategoryId;

  const BrandScreen(this.idOrSlug, {super.key, this.categoryId, this.subcategoryId});

  @override
  ConsumerState<BrandScreen> createState() => _BrandScreenState();
}

class _BrandScreenState extends ConsumerState<BrandScreen> {
  _BrandShelf _shelf = _BrandShelf.all;

  /// البراند من دليل البراندات المحمّل — يرسم الرأس فوراً قبل ردّ الخادم.
  Brand? _seed() {
    final key = widget.idOrSlug;
    for (final b in ref.watch(brandsProvider).valueOrNull ?? const <Brand>[]) {
      if (b.id == key || b.slug == key) return b;
    }
    return null;
  }

  Future<void> _refresh(Brand brand) async {
    final api = ref.read(apiServiceProvider);
    try {
      await Future.wait([
        api.getProducts(brandId: brand.id, limit: 1, forceRefresh: true),
        api.getBrandBySlug(widget.idOrSlug),
      ]);
    } catch (_) {
      // تبقى قيم الرأس الحالية؛ القائمة نفسها تعرض خطأها إن وُجد.
    }
    if (!mounted) return;
    ref.invalidate(_brandProductCountProvider(brand.id));
    ref.invalidate(_brandDetailProvider(widget.idOrSlug));
  }

  void _selectShelf(_BrandShelf shelf) {
    if (shelf == _shelf) return;
    setState(() => _shelf = shelf);
  }

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final detail = ref.watch(_brandDetailProvider(widget.idOrSlug));
    final brand = detail.valueOrNull ?? _seed();

    if (brand == null) {
      return Scaffold(
        backgroundColor: t.canvas,
        body: detail.hasError
            ? _BrandErrorBody(
                error: detail.error!,
                onRetry: () => ref.invalidate(_brandDetailProvider(widget.idOrSlug)),
              )
            : const _BrandLoadingBody(),
      );
    }

    final s = ref.watch(stringsProvider);
    final count = ref.watch(_brandProductCountProvider(brand.id)).valueOrNull ??
        (brand.productCount > 0 ? brand.productCount : null);

    return Scaffold(
      backgroundColor: t.canvas,
      body: ProductListingBody(
        title: brand.label,
        brandId: brand.id,
        categoryId: widget.subcategoryId == null ? widget.categoryId : null,
        subcategoryId: widget.subcategoryId,
        isBestSeller: _shelf == _BrandShelf.bestSellers,
        isNew: _shelf == _BrandShelf.newArrivals,
        isPromo: _shelf == _BrandShelf.offers,
        onRefresh: () => _refresh(brand),
        leadingSlivers: [
          _BrandHeroAppBar(brand: brand, count: count),
          SliverToBoxAdapter(
            child: _BrandShelves(
              selected: _shelf,
              strings: s,
              onSelect: _selectShelf,
            ),
          ),
        ],
      ),
    );
  }
}

/// رأس البراند القابل للطي: الشعار في دائرة بيضاء على لون البراند (أو تدرّج العالم)،
/// ويبقى عند الطي شريطاً باسم البراند مع الرجوع والبحث.
class _BrandHeroAppBar extends ConsumerWidget {
  final Brand brand;
  final int? count;

  const _BrandHeroAppBar({required this.brand, required this.count});

  static const _logoSize = 84.0;

  /// لون البراند من لوحة التحكم إن كان صالحاً.
  static Color? _brandColor(Brand brand) {
    final hex = brand.bgColorHex?.replaceFirst('#', '').trim();
    if (hex == null || hex.length < 6) return null;
    final v = int.tryParse(hex.substring(0, 6), radix: 16);
    return v == null ? null : Color(0xFF000000 | v);
  }

  /// الاسم العربي المرافق للاسم اللاتيني — لا يُكرَّر إن كان هو نفسه.
  static String? _arabicAlias(Brand brand) {
    final saved = brand.nameAr?.trim();
    final ar = (saved != null && saved.isNotEmpty) ? saved : splitBrandName(brand.name).ar?.trim();
    if (ar == null || ar.isEmpty || ar == brand.label.trim()) return null;
    return ar;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);

    final solid = _brandColor(brand);
    final Decoration background = solid != null ? BoxDecoration(color: solid) : BoxDecoration(gradient: t.signatureGradient);
    // لون الكتابة حسب الخلفية: الحبر على الفاتح، والأبيض على الداكن.
    final tone = solid ?? Color.lerp(t.signatureGradient.colors.first, t.signatureGradient.colors.last, 0.5)!;
    final onDark = contrastRatio(Colors.white, tone) >= contrastRatio(t.ink, tone);
    final fg = onDark ? Colors.white : t.ink;
    final fgSoft = fg.withValues(alpha: 0.82);

    final topInset = MediaQuery.paddingOf(context).top;
    // الرأس يتسع لتكبير الخط حتى 1.25 دون أن يقصّ الاسم أو الشارات.
    final scale = MediaQuery.textScalerOf(context).clamp(maxScaleFactor: 1.25).scale(1);
    final alias = _arabicAlias(brand);
    final expandedHeight = topInset + kToolbarHeight + _logoSize + (alias != null ? 136 : 112) * scale;
    final collapsedHeight = topInset + kToolbarHeight;

    return SliverAppBar(
      pinned: true,
      stretch: !reduceMotion,
      expandedHeight: expandedHeight - topInset,
      automaticallyImplyLeading: false,
      backgroundColor: solid ?? t.signatureGradient.colors.last,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      systemOverlayStyle: (onDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark)
          .copyWith(statusBarColor: Colors.transparent),
      leadingWidth: 60,
      leading: const Padding(
        padding: EdgeInsetsDirectional.only(start: 8),
        child: Center(child: AppBackButton()),
      ),
      actions: [
        AppIconButton(
          icon: Icons.search_rounded,
          tooltip: s.searchHint,
          onTap: () => context.push('/search'),
        ),
        const SizedBox(width: 10),
      ],
      flexibleSpace: LayoutBuilder(
        builder: (context, c) {
          final range = expandedHeight - collapsedHeight;
          final progress = range <= 0 ? 0.0 : ((c.maxHeight - collapsedHeight) / range).clamp(0.0, 1.0);
          final heroOpacity = Curves.easeIn.transform(progress);
          final titleOpacity = (1 - progress * 3).clamp(0.0, 1.0);
          return Stack(
            fit: StackFit.expand,
            children: [
              DecoratedBox(decoration: background),
              // المحتوى ملتصق بالأسفل ويختفي تدريجياً مع الطي.
              PositionedDirectional(
                start: 0,
                end: 0,
                bottom: 0,
                top: collapsedHeight,
                child: ClipRect(
                  child: OverflowBox(
                    alignment: Alignment.bottomCenter,
                    minHeight: 0,
                    maxHeight: double.infinity,
                    child: Opacity(
                      opacity: heroOpacity,
                      child: _BrandHeroContent(
                        brand: brand,
                        alias: alias,
                        count: count,
                        fg: fg,
                        fgSoft: fgSoft,
                        strings: s,
                        reduceMotion: reduceMotion,
                      ),
                    ),
                  ),
                ),
              ),
              // اسم البراند في الشريط المطوي.
              PositionedDirectional(
                top: topInset,
                start: 64,
                end: 64,
                height: kToolbarHeight,
                child: IgnorePointer(
                  child: ExcludeSemantics(
                    excluding: titleOpacity == 0,
                    child: Opacity(
                      opacity: titleOpacity,
                      child: Center(
                        child: Text(
                          brand.label,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.title2.copyWith(color: fg),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _BrandHeroContent extends StatelessWidget {
  final Brand brand;
  final String? alias;
  final int? count;
  final Color fg;
  final Color fgSoft;
  final AppStrings strings;
  final bool reduceMotion;

  const _BrandHeroContent({
    required this.brand,
    required this.alias,
    required this.count,
    required this.fg,
    required this.fgSoft,
    required this.strings,
    required this.reduceMotion,
  });

  @override
  Widget build(BuildContext context) {
    final s = strings;
    return Padding(
      padding: const EdgeInsets.fromLTRB(ListingTheme.padH, 0, ListingTheme.padH, 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 18, offset: const Offset(0, 6)),
              ],
            ),
            child: BrandAvatar(brand: brand, size: _BrandHeroAppBar._logoSize),
          ),
          const SizedBox(height: 12),
          Semantics(
            header: true,
            label: alias == null ? brand.label : '${brand.label}${s.isAr ? '،' : ','} $alias',
            excludeSemantics: true,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  brand.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: AppText.display.copyWith(color: fg, height: 1.2),
                ),
                if (alias != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      alias!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      textDirection: TextDirection.rtl,
                      style: AppText.title3.copyWith(color: fgSoft, fontWeight: FontWeight.w500),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 6,
            children: [
              AnimatedSwitcher(
                duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 220),
                child: count == null
                    ? const SizedBox(key: ValueKey('none'), height: 30)
                    : _HeroPill(
                        key: ValueKey(count),
                        icon: Icons.inventory_2_outlined,
                        label: s.productsN(count!),
                      ),
              ),
              Tooltip(
                message: s.brandAuthenticHint,
                child: _HeroPill(icon: Icons.verified_rounded, label: s.brandAuthentic, emphasized: true),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// شارة بيضاء صغيرة في الرأس — مقروءة فوق أي لون براند.
class _HeroPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool emphasized;

  const _HeroPill({super.key, required this.icon, required this.label, this.emphasized = false});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Container(
      constraints: const BoxConstraints(minHeight: 30),
      padding: const EdgeInsetsDirectional.fromSTEB(10, 5, 12, 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.94),
        borderRadius: BorderRadius.circular(AppCorners.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: emphasized ? t.accentDark : t.inkSoft),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.label.copyWith(color: emphasized ? t.accentDark : t.ink),
            ),
          ),
        ],
      ),
    );
  }
}

/// صف الرفوف السريعة: الكل / الأكثر مبيعاً / وصل حديثاً / العروض.
class _BrandShelves extends StatelessWidget {
  final _BrandShelf selected;
  final AppStrings strings;
  final ValueChanged<_BrandShelf> onSelect;

  const _BrandShelves({required this.selected, required this.strings, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final s = strings;
    final shelves = <(_BrandShelf, String, IconData)>[
      (_BrandShelf.all, s.all, Icons.apps_rounded),
      (_BrandShelf.bestSellers, s.sortPopular, Icons.local_fire_department_rounded),
      (_BrandShelf.newArrivals, s.newArrivals, Icons.auto_awesome_rounded),
      (_BrandShelf.offers, s.brandShelfOffers, Icons.local_offer_outlined),
    ];
    return Semantics(
      container: true,
      label: s.brandShelvesLabel,
      child: Padding(
        padding: const EdgeInsets.only(top: 12),
        child: MediaQuery.withClampedTextScaling(
          maxScaleFactor: 1.25,
          child: SizedBox(
            height: kMinTapTarget,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: ListingTheme.padH),
              itemCount: shelves.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final (shelf, label, icon) = shelves[i];
                return AppChoiceChip(
                  label: label,
                  icon: icon,
                  selected: selected == shelf,
                  onTap: () => onSelect(shelf),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

/// قبل معرفة البراند (رابط مباشر والدليل غير محمّل): رأس بلون العالم وهيكل الشبكة.
class _BrandLoadingBody extends ConsumerWidget {
  const _BrandLoadingBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final s = ref.watch(stringsProvider);
    return Semantics(
      label: s.loading,
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: EdgeInsets.zero,
        children: [
          DecoratedBox(
            decoration: BoxDecoration(gradient: t.signatureGradient),
            child: SafeArea(
              bottom: false,
              child: SizedBox(
                height: 220,
                child: Stack(
                  children: [
                    const PositionedDirectional(top: 6, start: 8, child: AppBackButton()),
                    Center(
                      child: Container(
                        width: _BrandHeroAppBar._logoSize,
                        height: _BrandHeroAppBar._logoSize,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.85),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const ProductGridSkeleton(
            count: 6,
            listing: true,
            padding: EdgeInsets.fromLTRB(ListingTheme.padH, 16, ListingTheme.padH, 32),
          ),
        ],
      ),
    );
  }
}

/// تعذّر جلب البراند ولا نسخة محفوظة له: رجوع واضح مع إعادة المحاولة.
class _BrandErrorBody extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;

  const _BrandErrorBody({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Padding(
            padding: EdgeInsetsDirectional.fromSTEB(8, 6, 8, 0),
            child: Align(alignment: AlignmentDirectional.centerStart, child: AppBackButton()),
          ),
          Expanded(child: ErrorView.from(error, onRetry: onRetry)),
        ],
      ),
    );
  }
}
