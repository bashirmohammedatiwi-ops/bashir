import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/motion/app_motion.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/navigation/product_nav.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/ds_strings.dart';
import '../../core/widgets/quick_shade_sheet.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/beauty.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../beauty/beauty_providers.dart';
import '../cart/cart_provider.dart';
import '../shell/nav_tabs.dart';
import '../worlds/world_theme.dart';
import 'compare_provider.dart';
import 'compare_strings.dart';

/// يفتح صفحة المقارنة عبر مسارها في الراوتر (/compare) — صفحة حقيقية في المكدس، فالانتقال لتبويب
/// (السلة، إشعار، رابط) يزيلها كغيرها بدل أن تبقى معلّقة فوق الرئيسية. لا تُفتح مرتين فوق بعضها.
void openCompareWith(GoRouter router) {
  if (router.state.uri.path == '/compare') return;
  router.push('/compare');
}

void openCompare(BuildContext context) {
  AppHaptics.select();
  openCompareWith(GoRouter.of(context));
}

/// التفاصيل الطازجة لقائمة المقارنة (السعر والمخزون والدرجات والمكوّنات) — المفتاح
/// معرّفاتها مفصولة بفواصل، فإزالة منتج تجلب الباقي من جديد.
final _compareFreshProvider = FutureProvider.autoDispose.family<List<Product>, String>(
  (ref, key) => ref.read(apiServiceProvider).getProductsByIds(key.split(','), forceRefresh: true),
);

/// أقل عرض لعمود المنتج — بعده يُمرَّر الجدول أفقياً (أعمدة 2.2 تقريباً ظاهرة).
const double _minColWidth = 148;
const double _colGap = 8;
const double _hPad = 16;

/// ارتفاع صورة الرأس وهو ممدود — تنطوي عند التمرير فيبقى الاسم والزر.
const double _headerImage = 88;

class CompareScreen extends ConsumerStatefulWidget {
  const CompareScreen({super.key});

  @override
  ConsumerState<CompareScreen> createState() => _CompareScreenState();
}

class _CompareScreenState extends ConsumerState<CompareScreen> {
  final _scroll = _LinkedScrollGroup();

  /// معرّفات وصلت تفاصيلها الكاملة في هذه الزيارة — قبلها لقطات خفيفة فقط.
  final _fresh = <String>{};

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  /// يفتح تبويباً في الـ shell — الانتقال للرئيسية يزيل صفحة المقارنة (مسار في الراوتر).
  void _leaveToTab(int tab) => openMainTab(context, ProviderScope.containerOf(context, listen: false), tab);

  void _clearAll(AppStrings s) {
    final previous = ref.read(compareProvider).items;
    AppHaptics.warn();
    ref.read(compareProvider.notifier).clear();
    AppSnackbar.action(
      context,
      message: s.compareCleared,
      actionLabel: s.compareUndo,
      onAction: () => ref.read(compareProvider.notifier).restore(previous),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final t = context.worldTheme;
    final state = ref.watch(compareProvider);
    final ids = state.ids;
    final key = ids.join(',');

    AsyncValue<List<Product>>? fresh;
    if (state.canCompare) {
      fresh = ref.watch(_compareFreshProvider(key));
      ref.listen<AsyncValue<List<Product>>>(_compareFreshProvider(key), (_, next) {
        final list = next.valueOrNull;
        if (list == null || !mounted) return;
        final dropped = ref.read(compareProvider.notifier).applyFresh(ids, list);
        setState(() => _fresh.addAll(list.map((p) => p.id)));
        if (dropped > 0) AppSnackbar.show(context, s.compareDropped(dropped));
      });
    }

    final Widget body;
    if (!state.canCompare) {
      body = EmptyState(
        icon: Icons.compare_arrows_rounded,
        title: s.compareEmptyTitle,
        subtitle: state.count == 1 ? '${s.compareEmptyBody}\n\n${s.compareNeedOneMore}' : s.compareEmptyBody,
        action: FilledButton.icon(
          onPressed: () => _leaveToTab(NavTabs.categories),
          style: FilledButton.styleFrom(minimumSize: const Size(0, kMinTapTarget)),
          icon: const Icon(Icons.grid_view_rounded, size: 18),
          label: Text(s.compareBrowse),
        ),
      );
    } else {
      final complete = ids.every(_fresh.contains);
      body = _CompareTable(
        products: state.items,
        scroll: _scroll,
        complete: complete,
        loading: !complete && (fresh?.isLoading ?? false),
        failed: !complete && (fresh?.hasError ?? false) && !(fresh?.isLoading ?? false),
        onRetry: () => ref.invalidate(_compareFreshProvider(key)),
        onViewCart: () => _leaveToTab(NavTabs.cart),
      );
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: (context.worldTheme.isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark)
          .copyWith(statusBarColor: Colors.transparent),
      child: Scaffold(
        backgroundColor: t.canvas,
        appBar: AppBar(
          backgroundColor: t.canvas,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: 0,
          leadingWidth: 60,
          leading: const Center(child: AppBackButton()),
          centerTitle: true,
          title: Text(s.compareTitle, style: AppText.title3.copyWith(color: t.ink)),
          actions: [
            if (state.items.isNotEmpty)
              Padding(
                padding: const EdgeInsetsDirectional.only(end: 8),
                child: TextButton(
                  onPressed: () => _clearAll(s),
                  style: TextButton.styleFrom(
                    minimumSize: const Size(kMinTapTarget, kMinTapTarget),
                    foregroundColor: t.inkSoft,
                  ),
                  child: Text(s.compareClearAll, style: AppText.label.copyWith(color: t.inkSoft)),
                ),
              ),
          ],
        ),
        body: body,
      ),
    );
  }
}

// ─── الجدول ─────────────────────────────────────────────────────────────────

class _CompareTable extends ConsumerWidget {
  final List<Product> products;
  final _LinkedScrollGroup scroll;

  /// كل الأعمدة وصلت تفاصيلها الكاملة — قبلها الصفوف هياكل تحميل.
  final bool complete;
  final bool loading;
  final bool failed;
  final VoidCallback onRetry;
  final VoidCallback onViewCart;

  const _CompareTable({
    required this.products,
    required this.scroll,
    required this.complete,
    required this.loading,
    required this.failed,
    required this.onRetry,
    required this.onViewCart,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final lang = ref.watch(languageCodeProvider);
    final mySkin = ref.watch(skinProfileProvider.select((p) => p?.skinType));
    final n = products.length;

    final available = MediaQuery.sizeOf(context).width - _hPad * 2;
    final fitWidth = (available - _colGap * (n - 1)) / n;
    final colW = fitWidth >= _minColWidth ? fitWidth : _minColWidth;
    final overflows = fitWidth < _minColWidth;

    // ارتفاع اسم المنتج (سطران) بمقياس الخط الحالي — يحدد ارتفاع الرأس الثابت.
    final nameLine = MediaQuery.textScalerOf(context).scale(AppText.label.fontSize!) * AppText.label.height!;
    final minExtent = 8 + kMinTapTarget + nameLine * 2 + 2 + 6 + kMinTapTarget + 10;

    final rows = complete || failed ? _buildRows(products, s, lang, mySkin) : const <_RowSpec>[];

    return CustomScrollView(
      slivers: [
        SliverPersistentHeader(
          pinned: true,
          delegate: _HeaderDelegate(
            products: products,
            scroll: scroll,
            colW: colW,
            minHeight: minExtent,
            maxHeight: minExtent + _headerImage,
            canvas: t.canvas,
            hairline: t.hairline,
            onViewCart: onViewCart,
          ),
        ),
        if (overflows)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(_hPad, 10, _hPad, 0),
              child: Row(
                children: [
                  Icon(Icons.swipe_rounded, size: 16, color: t.inkMuted),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(s.compareScrollHint, style: AppText.caption.copyWith(color: t.inkMuted)),
                  ),
                ],
              ),
            ),
          ),
        if (failed)
          SliverToBoxAdapter(child: _RetryPill(onRetry: onRetry)),
        if (!complete && !failed)
          SliverList.builder(
            itemCount: 6,
            itemBuilder: (_, __) => _SkeletonRow(scroll: scroll, count: n, colW: colW),
          )
        else
          SliverList.builder(
            itemCount: rows.length,
            itemBuilder: (_, i) => _RowView(row: rows[i], scroll: scroll, colW: colW),
          ),
        SliverToBoxAdapter(child: SizedBox(height: 24 + MediaQuery.paddingOf(context).bottom)),
      ],
    );
  }
}

/// صف واحد: عنوانه بعرض الشاشة (لا يُمرَّر)، وقيمه تحته بالتمرير الأفقي المشترك.
class _RowSpec {
  final String label;
  final List<Widget> cells;

  /// العمود الأفضل في هذا الصف (أقل سعر، أعلى تقييم…) — null حين لا فرق.
  final int? best;

  const _RowSpec(this.label, this.cells, {this.best});
}

/// أفضل قيمة بين الأعمدة — فقط حين تختلف القيم ولقيمتين على الأقل.
int? _bestOf(List<num?> values, {required bool lowest}) {
  final known = [
    for (var i = 0; i < values.length; i++)
      if (values[i] != null) (v: values[i]!, i: i),
  ];
  if (known.length < 2 || known.map((e) => e.v).toSet().length < 2) return null;
  known.sort((a, b) => lowest ? a.v.compareTo(b.v) : b.v.compareTo(a.v));
  // تعادل على القمة: لا «أفضل» واحد.
  if (known[0].v == known[1].v) return null;
  return known.first.i;
}

/// سعر العمود بحسب الدرجات — نفس ما يحاسب عليه السيرفر: أرخص درجة متوفرة
/// (أو أرخص درجة إن نفدت كلها)، و«من» حين تختلف أسعار الدرجات.
({int price, int original, bool from}) _priceOf(Product p) {
  final shades = p.displayableShades;
  if (shades.isEmpty) {
    return (price: p.price, original: p.hasDiscount ? p.originalPrice : 0, from: false);
  }
  final inStock = shades.where((x) => x.inStock).toList();
  final pool = inStock.isNotEmpty ? inStock : shades;
  var cheapest = pool.first;
  for (final x in pool) {
    if (p.unitFor(x) < p.unitFor(cheapest)) cheapest = x;
  }
  final prices = {for (final x in pool) p.unitFor(x)};
  final unit = p.unitFor(cheapest);
  final orig = p.origFor(cheapest);
  return (price: unit, original: orig > unit ? orig : 0, from: prices.length > 1);
}

/// الحجم من الاسم («30 مل»، «50ml»، «100 غ»، «1 لتر») — بالمل أو الغرام للمقارنة.
({double amount, bool ml, String label})? _sizeOf(Product p, bool ar) {
  final n = ' ${p.nameAr ?? ''} ${p.name} ${p.nameEn ?? ''} '.toLowerCase();
  final m = RegExp(r'(\d+(?:[.,]\d+)?)\s*(مل|ملل|ml|غم|غرام|جم|gm|g|لتر|l)(?![a-z؀-ۿ])').firstMatch(n);
  if (m == null) return null;
  final value = double.tryParse(m.group(1)!.replaceAll(',', '.'));
  if (value == null || value <= 0) return null;
  final unit = m.group(2)!;
  final litre = unit == 'لتر' || unit == 'l';
  final ml = litre || RegExp(r'^(مل|ملل|ml)$').hasMatch(unit);
  final shown = m.group(1)!.replaceAll(',', '.');
  final label = litre ? '$shown ${ar ? 'لتر' : 'L'}' : '$shown ${ml ? (ar ? 'مل' : 'ml') : (ar ? 'غ' : 'g')}';
  return (amount: litre ? value * 1000 : value, ml: ml, label: label);
}

/// مكوّنات فعّالة معروفة — تُلتقط من قائمة المكوّنات والوصف بالعربي والإنجليزي.
const _actives = <({String ar, String en, String pattern})>[
  (ar: 'هيالورونيك', en: 'Hyaluronic acid', pattern: r'hyaluron|هيالورون|هيالورونيك'),
  (ar: 'نياسيناميد', en: 'Niacinamide', pattern: r'niacinamide|نياسيناميد|نياسيناميد'),
  (ar: 'ريتينول', en: 'Retinol', pattern: r'retinol|retinal\b|ريتينول|رتينول'),
  (ar: 'فيتامين C', en: 'Vitamin C', pattern: r'vitamin\s*c\b|ascorb|فيتامين\s*(c|سي)'),
  (ar: 'فيتامين E', en: 'Vitamin E', pattern: r'vitamin\s*e\b|tocopher|فيتامين\s*(e|إي|اي)'),
  (ar: 'ساليسيليك', en: 'Salicylic acid', pattern: r'salicylic|\bbha\b|ساليسيليك|سالسليك'),
  (ar: 'جليكوليك', en: 'Glycolic acid', pattern: r'glycolic|\baha\b|جليكوليك|غليكوليك|جلايكوليك'),
  (ar: 'سيراميد', en: 'Ceramides', pattern: r'ceramide|سيراميد'),
  (ar: 'ببتيدات', en: 'Peptides', pattern: r'peptide|ببتيد'),
  (ar: 'كولاجين', en: 'Collagen', pattern: r'collagen|كولاجين|كولاجن'),
  (ar: 'سنتيلا', en: 'Centella', pattern: r'centella|\bcica\b|سنتيلا|سيكا'),
  (ar: 'أربوتين', en: 'Arbutin', pattern: r'arbutin|أربوتين|اربوتين'),
  (ar: 'سكوالين', en: 'Squalane', pattern: r'squalane|سكوالين|سكوالان'),
  (ar: 'بانثينول', en: 'Panthenol', pattern: r'panthenol|بانثينول'),
  (ar: 'زنك', en: 'Zinc', pattern: r'\bzinc\b|زنك'),
  (ar: 'كافيين', en: 'Caffeine', pattern: r'caffeine|كافيين'),
  (ar: 'زبدة الشيا', en: 'Shea butter', pattern: r'\bshea\b|الشيا|شيا'),
  (ar: 'زيت الأرغان', en: 'Argan oil', pattern: r'argan|أرغان|ارغان'),
  (ar: 'الألوفيرا', en: 'Aloe vera', pattern: r'\baloe\b|ألوفيرا|الوفيرا|الصبار'),
  (ar: 'شجرة الشاي', en: 'Tea tree', pattern: r'tea\s*tree|شجرة الشاي'),
  (ar: 'خلاصة الحلزون', en: 'Snail mucin', pattern: r'snail|الحلزون'),
];

final _activeRegexps = [for (final a in _actives) RegExp(a.pattern, caseSensitive: false)];

/// المكوّنات الأساسية للمنتج (حتى 5) — مفاتيحها فهارس [_actives].
List<int> _activesOf(Product p) {
  final text = [
    p.ingredients,
    p.description,
    p.descriptionAr ?? '',
    p.descriptionEn ?? '',
  ].join(' ').replaceAll(RegExp(r'<[^>]+>'), ' ');
  if (text.trim().isEmpty) return const [];
  final out = <int>[];
  for (var i = 0; i < _activeRegexps.length && out.length < 5; i++) {
    if (_activeRegexps[i].hasMatch(text)) out.add(i);
  }
  return out;
}

String _plain(String raw, int max) {
  final t = raw.replaceAll(RegExp(r'<[^>]+>'), ' ').replaceAll(RegExp(r'\s+'), ' ').trim();
  return t.length > max ? '${t.substring(0, max)}…' : t;
}

List<_RowSpec> _buildRows(List<Product> products, AppStrings s, String lang, SkinType? mySkin) {
  final ar = s.isAr;
  final rows = <_RowSpec>[];

  // السعر — أرخص سعر هو الأفضل.
  final prices = products.map(_priceOf).toList();
  rows.add(_RowSpec(
    s.compareRowPrice,
    [for (final p in prices) _PriceCell(price: p.price, original: p.original, from: p.from)],
    best: _bestOf([for (final p in prices) p.price], lowest: true),
  ));

  // التقييم — لمن عنده تقييمات فقط.
  if (products.any((p) => p.reviewCount > 0)) {
    rows.add(_RowSpec(
      s.compareRowRating,
      [for (final p in products) p.reviewCount > 0 ? _RatingCell(rating: p.rating, count: p.reviewCount) : const _Dash()],
      best: _bestOf([for (final p in products) p.reviewCount > 0 ? p.rating : null], lowest: false),
    ));
  }

  // البراند.
  if (products.any((p) => p.brandNameFor(lang).isNotEmpty)) {
    rows.add(_RowSpec(s.compareRowBrand, [
      for (final p in products) p.brandNameFor(lang).isNotEmpty ? _TextCell(p.brandNameFor(lang)) : const _Dash(),
    ]));
  }

  // الحجم، ثم السعر لكل وحدة حين تتفق الوحدات.
  final sizes = [for (final p in products) _sizeOf(p, ar)];
  if (sizes.any((x) => x != null)) {
    rows.add(_RowSpec(s.compareRowSize, [for (final x in sizes) x != null ? _TextCell(x.label) : const _Dash()]));
    if (sizes.every((x) => x != null) && sizes.every((x) => x!.ml == sizes.first!.ml)) {
      final perUnit = [for (var i = 0; i < products.length; i++) prices[i].price / sizes[i]!.amount];
      final unit = sizes.first!.ml ? (ar ? 'مل' : 'ml') : (ar ? 'غ' : 'g');
      rows.add(_RowSpec(
        s.compareRowPerUnit(unit),
        [for (final v in perUnit) _TextCell(formatPrice(v.round(), lang: lang))],
        best: _bestOf([for (final v in perUnit) v.round()], lowest: true),
      ));
    }
  }

  // الألوان.
  if (products.any((p) => p.displayableShades.length > 1 || p.shadeCount > 1)) {
    rows.add(_RowSpec(s.compareRowShades, [
      for (final p in products)
        () {
          final n = p.displayableShades.isNotEmpty ? p.displayableShades.length : p.shadeCount;
          return n > 1 ? _TextCell(s.compareShadeCount(n)) : const _Dash();
        }(),
    ]));
  }

  // نوع البشرة — المشترك بين كل المنتجات يُبرز، ونوع بشرتها (من الاختبار) بعلامة.
  final skins = [
    for (final p in products)
      [for (final raw in p.skinTypes) if (raw.trim().isNotEmpty) raw.trim().toLowerCase()],
  ];
  if (skins.any((x) => x.isNotEmpty)) {
    final shared = skins.every((x) => x.isNotEmpty) ? skins.skip(1).fold(skins.first.toSet(), (a, b) => a.intersection(b.toSet())) : <String>{};
    String label(String key) {
      final type = skinTypeFromKey(key);
      return type == null ? key : (ar ? type.labelAr : type.labelEn);
    }

    rows.add(_RowSpec(s.compareRowSkin, [
      for (final list in skins)
        list.isEmpty
            ? const _Dash()
            : _ChipsCell([
                for (final k in list)
                  (
                    label: label(k),
                    shared: shared.contains(k),
                    mine: mySkin != null && mySkin.key == k,
                  ),
              ]),
    ]));
  }

  // المكوّنات الأساسية — المشترك يُبرز؛ بلا مكوّن معروف نعرض بداية القائمة.
  final actives = [for (final p in products) _activesOf(p)];
  if (actives.any((x) => x.isNotEmpty) || products.any((p) => p.ingredients.trim().isNotEmpty)) {
    final shared = actives.every((x) => x.isNotEmpty)
        ? actives.skip(1).fold(actives.first.toSet(), (a, b) => a.intersection(b.toSet()))
        : <int>{};
    rows.add(_RowSpec(s.compareRowIngredients, [
      for (var i = 0; i < products.length; i++)
        if (actives[i].isNotEmpty)
          _ChipsCell([
            for (final a in actives[i]) (label: ar ? _actives[a].ar : _actives[a].en, shared: shared.contains(a), mine: false),
          ])
        else if (products[i].ingredients.trim().isNotEmpty)
          _TextCell(_plain(products[i].ingredients, 110), muted: true)
        else
          const _Dash(),
    ]));
  }

  // التوفّر — الدرجات المتوفرة من الكل، أو «بقيت قطعتان».
  rows.add(_RowSpec(s.compareRowStock, [for (final p in products) _StockCell(product: p)]));
  return rows;
}

// ─── الرأس الثابت ─────────────────────────────────────────────────────────

class _HeaderDelegate extends SliverPersistentHeaderDelegate {
  final List<Product> products;
  final _LinkedScrollGroup scroll;
  final double colW;
  final double minHeight;
  final double maxHeight;
  final Color canvas;
  final Color hairline;
  final VoidCallback onViewCart;

  _HeaderDelegate({
    required this.products,
    required this.scroll,
    required this.colW,
    required this.minHeight,
    required this.maxHeight,
    required this.canvas,
    required this.hairline,
    required this.onViewCart,
  });

  @override
  double get minExtent => minHeight;

  @override
  double get maxExtent => maxHeight;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final imageH = (_headerImage - shrinkOffset).clamp(0.0, _headerImage);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: canvas,
        border: Border(
          bottom: BorderSide(color: overlapsContent || shrinkOffset > 0 ? hairline : Colors.transparent, width: 0.6),
        ),
      ),
      child: ClipRect(
        child: _LinkedHScroll(
          group: scroll,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (var i = 0; i < products.length; i++)
                Padding(
                  padding: EdgeInsetsDirectional.only(end: i == products.length - 1 ? 0 : _colGap),
                  child: SizedBox(
                    width: colW,
                    child: _HeaderColumn(product: products[i], imageHeight: imageH, onViewCart: onViewCart),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(_HeaderDelegate old) =>
      old.products != products ||
      old.colW != colW ||
      old.minHeight != minHeight ||
      old.canvas != canvas ||
      old.hairline != hairline;
}

/// رأس عمود المنتج: الصورة (تنطوي)، البراند وزر الإزالة، الاسم، وزر السلة.
class _HeaderColumn extends ConsumerWidget {
  final Product product;
  final double imageHeight;
  final VoidCallback onViewCart;

  const _HeaderColumn({required this.product, required this.imageHeight, required this.onViewCart});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final lang = ref.watch(languageCodeProvider);
    final name = product.localizedName(lang);
    final nameLine = MediaQuery.textScalerOf(context).scale(AppText.label.fontSize!) * AppText.label.height!;

    void open() {
      AppHaptics.select();
      openProduct(context, product);
    }

    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (imageHeight > 0)
            SizedBox(
              height: imageHeight,
              child: Opacity(
                opacity: (imageHeight / _headerImage).clamp(0.0, 1.0),
                child: Semantics(
                  button: true,
                  label: name,
                  excludeSemantics: true,
                  child: GestureDetector(
                    onTap: open,
                    child: Container(
                      decoration: BoxDecoration(
                        color: ProductCoverImage.wellColor,
                        borderRadius: BorderRadius.circular(AppCorners.md),
                        border: Border.all(color: t.hairline.withValues(alpha: 0.7)),
                      ),
                      clipBehavior: Clip.antiAlias,
                      padding: const EdgeInsets.all(8),
                      child: ProductCoverImage(url: product.coverUrl, fit: BoxFit.contain),
                    ),
                  ),
                ),
              ),
            ),
          SizedBox(
            height: kMinTapTarget,
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    product.brandLabel.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.micro.copyWith(color: t.accentDark),
                  ),
                ),
                Semantics(
                  button: true,
                  label: s.compareRemoveItem(name),
                  excludeSemantics: true,
                  child: InkResponse(
                    onTap: () {
                      AppHaptics.select();
                      ref.read(compareProvider.notifier).remove(product.id);
                    },
                    radius: 22,
                    child: SizedBox.square(
                      dimension: kMinTapTarget,
                      child: Center(
                        child: Container(
                          width: 26,
                          height: 26,
                          decoration: BoxDecoration(
                            color: t.surface,
                            shape: BoxShape.circle,
                            border: Border.all(color: t.hairline),
                          ),
                          child: Icon(Icons.close_rounded, size: 15, color: t.inkSoft),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            height: nameLine * 2 + 2,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              excludeFromSemantics: true,
              onTap: open,
              child: Text(
                name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppText.label.copyWith(color: t.ink),
              ),
            ),
          ),
          const SizedBox(height: 6),
          _AddButton(product: product, onViewCart: onViewCart),
        ],
      ),
    );
  }
}

/// زر السلة لكل عمود: إضافة مباشرة، أو اختيار اللون لما له درجات، أو «نفد».
class _AddButton extends ConsumerWidget {
  final Product product;
  final VoidCallback onViewCart;

  const _AddButton({required this.product, required this.onViewCart});

  /// يحتاج اختيار درجة — يشمل لقطة تعرف عدد الدرجات بلا الدرجات نفسها.
  bool get _needsShade =>
      product.hasMultipleDisplayableShades || (product.shadeCount > 1 && product.displayableShades.isEmpty);

  void _add(BuildContext context, WidgetRef ref) {
    final s = ref.read(stringsProvider);
    if (_needsShade) {
      AppHaptics.select();
      if (product.hasMultipleDisplayableShades) {
        showQuickShadeSheet(context, ref, product);
      } else {
        openProduct(context, product);
      }
      return;
    }
    final added = ref.read(cartProvider.notifier).addCounted(product, shade: product.soleDisplayableShade);
    if (added <= 0) {
      AppHaptics.warn();
      AppSnackbar.show(context, s.maxStockReached);
      return;
    }
    AppHaptics.add();
    AppSnackbar.cartAdded(
      context,
      title: s.addedToCart,
      productName: product.localizedName(s.lang),
      viewCartLabel: s.viewCart,
      onViewCart: onViewCart,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final soldOut = !product.inStock;
    final label = soldOut ? s.compareSoldOut : (_needsShade ? s.compareChooseShade : s.compareAddToBag);
    return SizedBox(
      height: kMinTapTarget,
      child: FilledButton(
        onPressed: soldOut ? null : () => _add(context, ref),
        style: FilledButton.styleFrom(
          minimumSize: const Size(0, kMinTapTarget),
          padding: const EdgeInsets.symmetric(horizontal: 10),
          shape: const StadiumBorder(),
        ),
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                soldOut
                    ? Icons.remove_shopping_cart_outlined
                    : (_needsShade ? Icons.palette_outlined : Icons.shopping_bag_outlined),
                size: 16,
              ),
              const SizedBox(width: 6),
              Text(label, style: AppText.label),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── الصفوف ───────────────────────────────────────────────────────────────

class _RowView extends StatelessWidget {
  final _RowSpec row;
  final _LinkedScrollGroup scroll;
  final double colW;

  const _RowView({required this.row, required this.scroll, required this.colW});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Semantics(
      container: true,
      label: row.label,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(_hPad, 16, _hPad, 6),
            child: Text(row.label, style: AppText.micro.copyWith(color: t.inkMuted)),
          ),
          _LinkedHScroll(
            group: scroll,
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  for (var i = 0; i < row.cells.length; i++)
                    Padding(
                      padding: EdgeInsetsDirectional.only(end: i == row.cells.length - 1 ? 0 : _colGap),
                      child: _CellFrame(width: colW, best: row.best == i, child: row.cells[i]),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// إطار الخلية — الأفضل في صفه بخلفية خضراء خفيفة وعلامة «الأفضل».
class _CellFrame extends ConsumerWidget {
  final double width;
  final bool best;
  final Widget child;

  const _CellFrame({required this.width, required this.best, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    return Container(
      width: width,
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      decoration: BoxDecoration(
        color: best ? AppColors.success.withValues(alpha: 0.08) : t.surface,
        borderRadius: BorderRadius.circular(AppCorners.sm),
        border: Border.all(
          color: best ? AppColors.success.withValues(alpha: 0.35) : t.hairline.withValues(alpha: 0.6),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          child,
          if (best) ...[
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.check_circle_rounded, size: 13, color: AppColors.success),
                const SizedBox(width: 4),
                Text(ref.s.compareBest, style: AppText.micro.copyWith(color: AppColors.success)),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _Dash extends StatelessWidget {
  const _Dash();

  @override
  Widget build(BuildContext context) =>
      Text('—', style: AppText.bodySmall.copyWith(color: context.worldTheme.inkMuted));
}

class _TextCell extends StatelessWidget {
  final String text;
  final bool muted;
  const _TextCell(this.text, {this.muted = false});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Text(
      text,
      style: (muted ? AppText.caption : AppText.bodySmall).copyWith(
        color: muted ? t.inkSoft : t.ink,
        fontWeight: muted ? FontWeight.w500 : FontWeight.w600,
      ),
    );
  }
}

class _PriceCell extends ConsumerWidget {
  final int price;
  final int original;
  final bool from;
  const _PriceCell({required this.price, required this.original, required this.from});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final shown = formatPrice(price, lang: s.lang);
    final discounted = original > price;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          from ? s.comparePriceFrom(shown) : shown,
          style: AppText.price.copyWith(color: discounted ? AppColors.sale : t.ink),
        ),
        if (discounted) ...[
          const SizedBox(height: 3),
          Text(
            formatPrice(original, lang: s.lang),
            style: AppText.caption.copyWith(color: t.inkMuted, decoration: TextDecoration.lineThrough),
          ),
        ],
      ],
    );
  }
}

class _RatingCell extends StatelessWidget {
  final double rating;
  final int count;
  const _RatingCell({required this.rating, required this.count});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.star_rounded, size: 16, color: AppColors.star),
        const SizedBox(width: 3),
        Text(rating.toStringAsFixed(1), style: AppText.label.copyWith(color: t.ink)),
        const SizedBox(width: 4),
        Flexible(
          child: Text('(${formatNumber(count)})', style: AppText.caption.copyWith(color: t.inkMuted)),
        ),
      ],
    );
  }
}

/// شرائح القيم (أنواع البشرة، المكوّنات) — المشترك بين كل المنتجات بلون العالم،
/// وما يناسب بشرتها بعلامة صح.
class _ChipsCell extends ConsumerWidget {
  final List<({String label, bool shared, bool mine})> chips;
  const _ChipsCell(this.chips);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return Wrap(
      spacing: 5,
      runSpacing: 5,
      children: [
        for (final c in chips)
          Semantics(
            label: [
              c.label,
              if (c.shared) s.compareShared,
              if (c.mine) s.compareFitsYou,
            ].join(s.isAr ? '، ' : ', '),
            excludeSemantics: true,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: c.shared ? t.accentLight : t.canvasWarm,
                borderRadius: BorderRadius.circular(AppCorners.pill),
                border: Border.all(color: c.shared ? t.accentSoft : t.hairline.withValues(alpha: 0.7)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (c.mine) ...[
                    const Icon(Icons.check_rounded, size: 13, color: AppColors.success),
                    const SizedBox(width: 3),
                  ],
                  Flexible(
                    child: Text(
                      c.label,
                      style: AppText.micro.copyWith(color: c.shared ? t.accentDark : t.inkSoft),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _StockCell extends ConsumerWidget {
  final Product product;
  const _StockCell({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final shades = product.displayableShades;
    final String text;
    final bool ok;
    if (shades.length > 1) {
      final inStock = shades.where((x) => x.inStock).length;
      ok = inStock > 0;
      text = ok ? s.dsShadesInStock(inStock, shades.length) : s.compareSoldOut;
    } else {
      final stock = shades.length == 1 ? shades.first.stock : product.stock;
      ok = stock > 0;
      text = !ok ? s.compareSoldOut : (stock <= 5 ? s.lowStock(stock) : s.compareInStock);
    }
    final color = ok ? AppColors.success : AppColors.sale;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(ok ? Icons.check_circle_outline_rounded : Icons.block_rounded, size: 15, color: color),
        const SizedBox(width: 5),
        Flexible(child: Text(text, style: AppText.label.copyWith(color: color))),
      ],
    );
  }
}

class _SkeletonRow extends StatelessWidget {
  final _LinkedScrollGroup scroll;
  final int count;
  final double colW;
  const _SkeletonRow({required this.scroll, required this.count, required this.colW});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsetsDirectional.fromSTEB(_hPad, 18, _hPad, 8),
          child: ShimmerBox(width: 64, height: 10),
        ),
        _LinkedHScroll(
          group: scroll,
          child: Row(
            children: [
              for (var i = 0; i < count; i++)
                Padding(
                  padding: EdgeInsetsDirectional.only(end: i == count - 1 ? 0 : _colGap),
                  child: ShimmerBox(width: colW, height: 44, radius: AppCorners.sm),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

/// تعذّر جلب التفاصيل: ما عندنا ظاهر، مع إعادة المحاولة.
class _RetryPill extends ConsumerWidget {
  final VoidCallback onRetry;
  const _RetryPill({required this.onRetry});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(_hPad, 12, _hPad, 0),
      child: Align(
        alignment: AlignmentDirectional.centerStart,
        child: Material(
          color: AppColors.warning.withValues(alpha: 0.1),
          shape: StadiumBorder(side: BorderSide(color: AppColors.warning.withValues(alpha: 0.3))),
          child: InkWell(
            customBorder: const StadiumBorder(),
            onTap: () {
              AppHaptics.select();
              onRetry();
            },
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: kMinTapTarget),
              child: Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(12, 6, 14, 6),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.cloud_off_rounded, size: 16, color: AppColors.warning),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text.rich(
                        TextSpan(children: [
                          TextSpan(text: '${s.compareLoadFailed} · '),
                          TextSpan(text: s.retryAction, style: AppText.caption.copyWith(color: t.accentDark)),
                        ]),
                        style: AppText.caption.copyWith(color: t.inkSoft, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── التمرير الأفقي المشترك ────────────────────────────────────────────────

/// يربط كل صفوف الجدول (والرأس) بتمرير أفقي واحد: تحريك أي صف يحرّك الباقي،
/// وصف جديد يُبنى أثناء التمرير يبدأ من الموضع نفسه.
class _LinkedScrollGroup {
  final _controllers = <ScrollController>[];
  double _offset = 0;
  bool _syncing = false;

  ScrollController attach() {
    final c = ScrollController(initialScrollOffset: _offset);
    c.addListener(() => _sync(c));
    _controllers.add(c);
    return c;
  }

  void detach(ScrollController c) {
    if (_controllers.remove(c)) c.dispose();
  }

  void _sync(ScrollController source) {
    if (_syncing || !source.hasClients) return;
    _syncing = true;
    _offset = source.offset;
    for (final c in _controllers) {
      if (identical(c, source) || !c.hasClients) continue;
      final pos = c.position;
      final target = _offset.clamp(pos.minScrollExtent, pos.maxScrollExtent);
      if (pos.pixels != target) c.jumpTo(target);
    }
    _syncing = false;
  }

  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    _controllers.clear();
  }
}

class _LinkedHScroll extends StatefulWidget {
  final _LinkedScrollGroup group;
  final Widget child;
  const _LinkedHScroll({required this.group, required this.child});

  @override
  State<_LinkedHScroll> createState() => _LinkedHScrollState();
}

class _LinkedHScrollState extends State<_LinkedHScroll> {
  late final ScrollController _c = widget.group.attach();

  @override
  void dispose() {
    widget.group.detach(_c);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
        controller: _c,
        scrollDirection: Axis.horizontal,
        // نفس الفيزياء لكل الصفوف: الارتداد كان يُخرج الصفوف عن بعضها عند الحافة.
        physics: const ClampingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: _hPad),
        child: widget.child,
      );
}
