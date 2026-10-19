import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/navigation/product_nav.dart';
import '../../core/theme/app_fonts.dart';
import '../../core/theme/app_text.dart';
import '../../core/utils/responsive.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/product_card_actions.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/price_view.dart';
import '../../data/models/category.dart';
import '../../data/models/product.dart';
import '../../data/models/store_world.dart';
import '../cart/cart_provider.dart';
import '../categories/widgets/category_line_art.dart';
import '../search/smart_query.dart';
import 'world_explore.dart';
import 'world_strings.dart';
import 'world_theme.dart';
import 'worlds_provider.dart';

/// عالم واحد بهويته: الأقسام الفرعية تظهر كالأقسام الرئيسية.
class WorldScreen extends ConsumerStatefulWidget {
  final String slug;
  const WorldScreen({super.key, required this.slug});

  @override
  ConsumerState<WorldScreen> createState() => _WorldScreenState();
}

class _WorldScreenState extends ConsumerState<WorldScreen> {
  String? _selectedId;

  /// نص الحقل كما يُكتب — يصفّي الأقسام فوراً.
  String _query = '';

  /// نص البحث عن المنتجات — يتأخر 300ms عن الكتابة حتى لا يُرسل طلب مع كل حرف.
  String _productQuery = '';
  Timer? _debounce;
  int _tab = 0;
  final _search = TextEditingController();

  /// مفتاح لكل قسم في الفهرس — للتمرير إليه عند فتحه من الاستكشاف.
  final _entryKeys = <String, GlobalKey>{};

  @override
  void initState() {
    super.initState();
    // الشاشة وما يُفتح منها (القوائم، صفحة المنتج، أزرار السلة) يُلوَّن بالعالم النشط:
    // نجعل هذا العالم هو النشط. لا يُعدَّل مزوّد أثناء البناء، فبعد أول إطار.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final selected = ref.read(selectedWorldSlugProvider.notifier);
      if (selected.state != widget.slug) selected.state = widget.slug;
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  /// رجوع آمن: رابط مباشر قد يفتح العالم كأول صفحة فلا يوجد ما نرجع إليه.
  void _leave() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/');
    }
  }

  void _onQuery(String v) {
    setState(() => _query = v);
    _debounce?.cancel();
    final next = v.trim();
    if (next.length < 2) {
      // لا طلب لأقل من حرفين — نُفرغ فوراً بلا انتظار.
      if (_productQuery.isNotEmpty) setState(() => _productQuery = '');
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted && _productQuery != next) setState(() => _productQuery = next);
    });
  }

  void _resetSearch() {
    _debounce?.cancel();
    _query = '';
    _productQuery = '';
    _search.clear();
    FocusManager.instance.primaryFocus?.unfocus();
  }

  void _openProducts(Category node, {Category? parent}) {
    HapticFeedback.lightImpact();
    final lang = ref.read(languageCodeProvider);
    final title = node.localizedName(lang);
    final q = StringBuffer('/products?title=${Uri.encodeComponent(title)}');
    if (parent != null) {
      q.write('&subcategoryId=${parent.id}&tertiaryCategoryId=${node.id}');
    } else if (node.listingKind == 'category') {
      q.write('&categoryId=${node.id}');
    } else if (node.listingKind == 'tertiary') {
      q.write('&tertiaryCategoryId=${node.id}');
    } else {
      q.write('&subcategoryId=${node.id}');
    }
    context.push(q.toString());
  }

  /// من الاستكشاف: القسم بلا فروع يفتح منتجاته مباشرة، وغيره يُفتح في الفهرس
  /// ويُمرَّر إليه حتى لا يبقى خارج الشاشة.
  void _openSections(Category? cat) {
    if (cat != null && cat.children.isEmpty) {
      _openProducts(cat);
      return;
    }
    setState(() {
      _tab = 1;
      if (cat != null) _selectedId = cat.id;
    });
    if (cat == null) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final target = _entryKeys[cat.id]?.currentContext;
      if (!mounted || target == null) return;
      Scrollable.ensureVisible(
        target,
        duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        alignment: 0.08,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final worldAsync = ref.watch(worldDetailProvider(widget.slug));
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;
    // يُقرأ هنا فوق الـ Scaffold: داخله تُحذف مساحة لوحة المفاتيح من MediaQuery.
    final keyboardUp = MediaQuery.viewInsetsOf(context).bottom > 0;
    // تبقى الشاشة معروضة أثناء التحديث أو إن فشل تحديث بعد تحميل ناجح.
    final world = worldAsync.valueOrNull;
    if (world == null) {
      final listWorld = ref.watch(worldsProvider).valueOrNull?.where((w) => w.slug == widget.slug).firstOrNull;
      return Scaffold(
        backgroundColor: listWorld?.canvas,
        appBar: AppBar(
          leading: BackButton(onPressed: _leave),
          elevation: 0,
          scrolledUnderElevation: 0,
          backgroundColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          foregroundColor: listWorld?.ink,
        ),
        body: worldAsync.hasError
            ? ErrorView.from(worldAsync.error, onRetry: () => ref.invalidate(worldDetailProvider(widget.slug)))
            : Center(child: CircularProgressIndicator(color: listWorld?.accent)),
      );
    }

    final palette = WorldThemePalette.fromWorld(world);
    final showSearch = _query.trim().length >= 2 || _tab == 2;
    final Widget body;
    if (showSearch) {
      body = _WorldSearchBody(
        world: world,
        lang: lang,
        controller: _search,
        query: _query.trim(),
        productQuery: _productQuery,
        onQuery: _onQuery,
        onClear: () {
          _search.clear();
          _onQuery('');
        },
        onOpenSection: (cat, parent) => _openProducts(cat, parent: parent),
      );
    } else if (_tab == 0) {
      body = WorldExplore(world: world, onOpenSections: _openSections);
    } else if (world.categories.isEmpty) {
      body = RefreshIndicator(
        color: world.accent,
        onRefresh: () => refreshWorld(ref, world.slug),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(28),
          children: [
            Text(
              s.worldNoSections,
              textAlign: TextAlign.center,
              style: AppText.title3.copyWith(color: world.ink),
            ),
          ],
        ),
      );
    } else {
      body = _SectionsPane(
        world: world,
        parents: world.categories,
        selectedId: _selectedId,
        lang: lang,
        entryKey: (id) => _entryKeys.putIfAbsent(id, GlobalKey.new),
        onRefresh: () => refreshWorld(ref, world.slug),
        onSelect: (id) => setState(() => _selectedId = id),
        onOpen: _openProducts,
        onOpenChild: (child, parent) => _openProducts(child, parent: parent),
      );
    }

    return PopScope(
      // الرجوع من تبويب داخلي أو بحث مكتوب يعود للاستكشاف أولاً، لا يغلق العالم.
      canPop: _tab == 0 && _query.isEmpty,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        setState(() {
          _tab = 0;
          _resetSearch();
        });
      },
      child: Scaffold(
        backgroundColor: world.canvas,
        body: Column(
          children: [
            _WorldHeader(world: world, palette: palette, lang: lang, onBack: _leave),
            Expanded(child: body),
            // لوحة المفاتيح ظاهرة: الشريط يختفي ليترك المساحة لنتائج البحث.
            if (!keyboardUp)
              _WorldBottomBar(
                index: showSearch ? 2 : _tab,
                world: world,
                onSelect: (i) {
                  HapticFeedback.selectionClick();
                  if (i == 3) {
                    openHomeTab(context, ProviderScope.containerOf(context, listen: false));
                    return;
                  }
                  setState(() {
                    _tab = i;
                    if (i != 2) _resetSearch();
                  });
                },
              ),
          ],
        ),
      ),
    );
  }
}

/// قسم مطابق في البحث — مع أبيه إن كان فرعاً داخل قسم.
typedef _SectionMatch = ({Category category, Category? parent});

class _WorldSearchBody extends ConsumerStatefulWidget {
  final StoreWorld world;
  final String lang;
  final TextEditingController controller;
  final String query;
  final String productQuery;
  final ValueChanged<String> onQuery;
  final VoidCallback onClear;
  final void Function(Category category, Category? parent) onOpenSection;

  const _WorldSearchBody({
    required this.world,
    required this.lang,
    required this.controller,
    required this.query,
    required this.productQuery,
    required this.onQuery,
    required this.onClear,
    required this.onOpenSection,
  });

  @override
  ConsumerState<_WorldSearchBody> createState() => _WorldSearchBodyState();
}

class _WorldSearchBodyState extends ConsumerState<_WorldSearchBody> {
  /// آخر نتائج وصلت — تبقى ظاهرة أثناء طلب الكلمة التالية بدل وميض مؤشر الانتظار.
  List<Product>? _lastResults;

  /// مطابقة الأقسام مخزّنة بحسب الكلمة والعالم — البناء يتكرر (نتائج المنتجات،
  /// المؤشر) دون أن تتغير الكلمة، فلا نعيد المطابقة إلا عند تغيّرها.
  (String, StoreWorld, List<_SectionMatch>)? _sectionsMemo;

  List<_SectionMatch> _matchSections() {
    final q = widget.query;
    if (q.isEmpty) return const [];
    final memo = _sectionsMemo;
    if (memo != null && memo.$1 == q && identical(memo.$2, widget.world)) return memo.$3;
    final prepared = PreparedQuery(q);
    final out = <_SectionMatch>[];
    for (final c in widget.world.categories) {
      if (prepared.matches([c.name, c.nameAr, c.nameEn, c.slug])) {
        out.add((category: c, parent: null));
      }
      for (final child in c.children) {
        if (prepared.matches([child.name, child.nameAr, child.nameEn, child.slug])) {
          out.add((category: child, parent: c));
        }
      }
    }
    final result = out.take(8).toList();
    _sectionsMemo = (q, widget.world, result);
    return result;
  }

  void _searchEverywhere() {
    final q = Uri.encodeComponent(widget.query);
    context.push('/products?search=$q&title=$q');
  }

  @override
  Widget build(BuildContext context) {
    final world = widget.world;
    final lang = widget.lang;
    final s = ref.s;
    final query = widget.query;
    final productQuery = widget.productQuery;
    final key = (slug: world.slug, query: productQuery);
    final products = ref.watch(worldProductSearchProvider(key));
    if (productQuery.isEmpty) {
      _lastResults = null;
    } else if (products.hasValue) {
      _lastResults = products.value;
    }
    final items = products.valueOrNull ?? _lastResults;
    // الكتابة لم تستقر بعد، أو الطلب جارٍ.
    final pending = query.length >= 2 && (query != productQuery || products.isLoading);
    final sections = _matchSections();
    final muted = world.ink.withValues(alpha: 0.55);
    final fieldBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppCorners.pill),
      borderSide: BorderSide(color: world.accent.withValues(alpha: 0.16)),
    );

    return ListView(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 16),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      children: [
        TextField(
          controller: widget.controller,
          autofocus: true,
          textInputAction: TextInputAction.search,
          onChanged: widget.onQuery,
          style: AppText.label.copyWith(fontSize: 14, color: world.ink),
          decoration: InputDecoration(
            isDense: true,
            hintText: s.worldSearchHint,
            hintStyle: AppText.bodySmall.copyWith(color: world.ink.withValues(alpha: 0.42)),
            filled: true,
            fillColor: world.surface,
            prefixIcon: Icon(Icons.search_rounded, size: 20, color: world.accent),
            suffixIcon: widget.controller.text.isEmpty
                ? null
                : IconButton(
                    tooltip: s.worldClearSearch,
                    icon: Icon(Icons.close_rounded, size: 18, color: world.ink.withValues(alpha: 0.5)),
                    onPressed: widget.onClear,
                  ),
            border: fieldBorder,
            enabledBorder: fieldBorder,
            focusedBorder: fieldBorder.copyWith(borderSide: BorderSide(color: world.accent, width: 1.2)),
            contentPadding: const EdgeInsets.symmetric(vertical: 12),
          ),
        ),
        const SizedBox(height: 14),
        if (query.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 28),
            child: Text(
              s.worldSearchIntro,
              textAlign: TextAlign.center,
              style: AppText.bodySmall.copyWith(color: muted),
            ),
          ),
        if (sections.isNotEmpty) ...[
          _SearchHeading(text: s.worldSearchSections, ink: world.ink),
          for (final match in sections)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Material(
                color: world.surface,
                borderRadius: BorderRadius.circular(AppCorners.md),
                child: InkWell(
                  onTap: () => widget.onOpenSection(match.category, match.parent),
                  borderRadius: BorderRadius.circular(AppCorners.md),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: world.surface,
                            border: Border.all(color: world.accent.withValues(alpha: 0.28)),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: CategoryLineArt(category: match.category, size: 40),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                match.category.localizedName(lang),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppText.label.copyWith(fontSize: 14, color: world.ink),
                              ),
                              if (match.parent != null)
                                Text(
                                  match.parent!.localizedName(lang),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppText.caption.copyWith(color: muted),
                                ),
                            ],
                          ),
                        ),
                        Icon(Icons.chevron_right_rounded, size: 18, color: world.accent.withValues(alpha: 0.6)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          const SizedBox(height: 6),
        ],
        if (query.isNotEmpty && query.length < 2)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(s.worldSearchMinLetters, style: AppText.bodySmall.copyWith(color: muted)),
          )
        else if (query.length >= 2) ...[
          _SearchHeading(text: s.worldSearchProducts, ink: world.ink),
          // شريط رفيع بدل مؤشر يحلّ محل النتائج — السابقة تبقى ظاهرة تحته.
          SizedBox(
            height: 2,
            child: pending && items != null
                ? LinearProgressIndicator(
                    minHeight: 2,
                    color: world.accent,
                    backgroundColor: world.accent.withValues(alpha: 0.12),
                  )
                : null,
          ),
          const SizedBox(height: 8),
          if (products.hasError && !products.isLoading && query == productQuery)
            ErrorView.from(
              products.error,
              onRetry: () => ref.invalidate(worldProductSearchProvider(key)),
            )
          else if (items == null)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator(color: world.accent)),
            )
          else if (items.isEmpty && !pending)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(s.worldNoProducts, style: AppText.bodySmall.copyWith(color: muted)),
            )
          else
            for (final product in items) _ProductResultRow(product: product, world: world, lang: lang),
          if (!pending || items != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Center(
                child: TextButton.icon(
                  onPressed: _searchEverywhere,
                  style: TextButton.styleFrom(
                    foregroundColor: world.accent,
                    minimumSize: const Size(0, kMinTapTarget),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                  ),
                  icon: const Icon(Icons.travel_explore_rounded, size: 18),
                  label: Text(s.worldSearchEverywhere, style: AppText.label.copyWith(color: world.accent)),
                ),
              ),
            ),
        ],
      ],
    );
  }
}

class _SearchHeading extends StatelessWidget {
  final String text;
  final Color ink;

  const _SearchHeading({required this.text, required this.ink});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: AppText.label.copyWith(color: ink)),
    );
  }
}

/// صف نتيجة: صورة مصغّرة، الاسم والبراند، السعر (والقديم عند الخصم) وإضافة سريعة.
class _ProductResultRow extends StatelessWidget {
  final Product product;
  final StoreWorld world;
  final String lang;

  const _ProductResultRow({required this.product, required this.world, required this.lang});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: world.surface,
        borderRadius: BorderRadius.circular(AppCorners.md),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppCorners.md),
          onTap: () => openProduct(context, product),
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(10, 8, 6, 8),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppCorners.sm),
                  child: SizedBox(
                    width: 44,
                    height: 44,
                    child: AppNetworkImage(
                      url: product.coverUrl,
                      width: 44,
                      height: 44,
                      fit: BoxFit.contain,
                      backgroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.localizedName(lang),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.label.copyWith(color: world.ink),
                      ),
                      if (product.brandLabel.isNotEmpty)
                        Text(
                          product.brandLabel,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.caption.copyWith(color: world.ink.withValues(alpha: 0.5)),
                        ),
                      const SizedBox(height: 2),
                      PriceView.compact(
                        price: product.price,
                        oldPrice: product.hasDiscount ? product.originalPrice : null,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),
                ProductCardCartControl(product: product, compact: true),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _WorldHeader extends ConsumerWidget {
  final StoreWorld world;
  final WorldThemePalette palette;
  final String lang;
  final VoidCallback onBack;

  const _WorldHeader({
    required this.world,
    required this.palette,
    required this.lang,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final top = MediaQuery.paddingOf(context).top;
    final tagline = world.localizedTagline(lang);
    final cartCount = ref.watch(cartProvider.select((c) => c.count));
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: (palette.isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark)
          .copyWith(statusBarColor: Colors.transparent),
      child: ColoredBox(
        color: world.canvas,
        child: Column(
          children: [
            Padding(
              padding: EdgeInsetsDirectional.fromSTEB(4, top + 2, 4, 0),
              child: Row(
                children: [
                  IconButton(
                    onPressed: onBack,
                    tooltip: MaterialLocalizations.of(context).backButtonTooltip,
                    icon: Icon(Icons.arrow_back_rounded, color: world.ink, size: 22),
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: s.navCart,
                    onPressed: () => openCartTab(context, ProviderScope.containerOf(context, listen: false)),
                    icon: Badge(
                      isLabelVisible: cartCount > 0,
                      label: Text(cartCount > 99 ? '99+' : '$cartCount'),
                      backgroundColor: palette.buttonFill,
                      textColor: palette.onAccent,
                      child: Icon(Icons.shopping_bag_outlined, color: world.ink, size: 23),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(20, 0, 20, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    s.worldEyebrow,
                    style: AppText.micro.copyWith(
                      fontWeight: FontWeight.w800,
                      letterSpacing: tracking(lang, 1.6),
                      color: world.accent,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    world.localizedName(lang),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.display.copyWith(
                      height: 1.15,
                      letterSpacing: tracking(lang, -0.4),
                      fontWeight: FontWeight.w800,
                      color: world.ink,
                    ),
                  ),
                  if (tagline.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      tagline,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.bodySmall.copyWith(height: 1.3, fontWeight: FontWeight.w600, color: world.ink.withValues(alpha: 0.6)),
                    ),
                  ],
                ],
              ),
            ),
            // خط توقيع متدرّج بدل الشريط الصلب — ألطف على العين.
            Container(
              height: 3,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: AlignmentDirectional.centerStart,
                  end: AlignmentDirectional.centerEnd,
                  colors: [
                    world.accent,
                    Color.lerp(world.accent, world.canvas, 0.55)!,
                    Colors.transparent,
                  ],
                  stops: const [0, 0.62, 1],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionsPane extends ConsumerWidget {
  final StoreWorld world;
  final List<Category> parents;
  final String? selectedId;
  final String lang;
  final GlobalKey Function(String id) entryKey;
  final Future<void> Function() onRefresh;
  final ValueChanged<String?> onSelect;
  final void Function(Category node, {Category? parent}) onOpen;
  final void Function(Category child, Category parent) onOpenChild;

  const _SectionsPane({
    required this.world,
    required this.parents,
    required this.selectedId,
    required this.lang,
    required this.entryKey,
    required this.onRefresh,
    required this.onSelect,
    required this.onOpen,
    required this.onOpenChild,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    // عمود داخل تمرير (لا ListView كسول): كل الأقسام مبنية، فيصل التمرير إلى
    // أي قسم يُفتح من الاستكشاف حتى لو كان خارج الشاشة.
    // حدّ رسم حول العمود وحول كل قسم: التمرير يحرّك الطبقة المرسومة دون إعادة
    // رسم الرسوم والظلال، وفتح قسم لا يعيد رسم الأقسام الأخرى.
    return RefreshIndicator(
      color: world.accent,
      onRefresh: onRefresh,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsetsDirectional.fromSTEB(20, 18, 20, 20),
        child: RepaintBoundary(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                s.worldIndexEyebrow,
                style: AppText.micro.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: tracking(lang, 1.4),
                  color: world.accent,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                s.worldChooseSection,
                style: AppText.title1.copyWith(height: 1.15, fontWeight: FontWeight.w800, color: world.ink),
              ),
              const SizedBox(height: 8),
              for (var i = 0; i < parents.length; i++)
                RepaintBoundary(
                  key: entryKey(parents[i].id),
                  child: _IndexEntry(
                    world: world,
                    category: parents[i],
                    index: i + 1,
                    lang: lang,
                    open: parents[i].id == selectedId,
                    onTap: () {
                      final cat = parents[i];
                      if (cat.children.isEmpty) {
                        onOpen(cat);
                      } else if (cat.id == selectedId) {
                        onSelect(null);
                      } else {
                        onSelect(cat.id);
                      }
                    },
                    onOpen: () => onOpen(parents[i]),
                    onOpenChild: (child) => onOpenChild(child, parents[i]),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _IndexEntry extends ConsumerWidget {
  final StoreWorld world;
  final Category category;
  final int index;
  final String lang;
  final bool open;
  final VoidCallback onTap;
  final VoidCallback onOpen;
  final ValueChanged<Category> onOpenChild;

  const _IndexEntry({
    required this.world,
    required this.category,
    required this.index,
    required this.lang,
    required this.open,
    required this.onTap,
    required this.onOpen,
    required this.onOpenChild,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final children = category.children;
    final mark = index.toString().padLeft(2, '0');
    final still = MediaQuery.disableAnimationsOf(context);
    final motion = still ? Duration.zero : const Duration(milliseconds: 220);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Semantics(
          button: true,
          expanded: children.isEmpty ? null : open,
          label: category.localizedName(lang),
          hint: children.isEmpty ? null : s.worldInsideCount(children.length),
          excludeSemantics: true,
          child: InkWell(
            onTap: onTap,
            child: AnimatedContainer(
              duration: motion,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: world.accent.withValues(alpha: open ? 0.45 : 0.16))),
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 34,
                    child: AnimatedDefaultTextStyle(
                      duration: motion,
                      style: AppText.title3.copyWith(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: open ? world.accent : world.accent.withValues(alpha: 0.65),
                      ),
                      child: Text(mark),
                    ),
                  ),
                  AnimatedContainer(
                    duration: motion,
                    curve: Curves.easeOutCubic,
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppCorners.sm),
                      border: Border.all(
                        color: open ? world.accent.withValues(alpha: 0.55) : world.accent.withValues(alpha: 0.22),
                        width: open ? 1.4 : 1,
                      ),
                      color: open ? Color.alphaBlend(world.accent.withValues(alpha: 0.06), world.surface) : world.surface,
                      boxShadow: open
                          ? [BoxShadow(color: world.accent.withValues(alpha: 0.14), blurRadius: 10, offset: const Offset(0, 3))]
                          : null,
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: CategoryLineArt(category: category, size: 44),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          category.localizedName(lang),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.title3.copyWith(
                            fontSize: 16,
                            letterSpacing: tracking(lang, -0.2),
                            fontWeight: open ? FontWeight.w800 : FontWeight.w700,
                            color: world.ink,
                          ),
                        ),
                        if (children.isNotEmpty)
                          Text(
                            s.worldInsideCount(children.length),
                            style: AppText.micro.copyWith(fontWeight: FontWeight.w600, color: world.ink.withValues(alpha: 0.5)),
                          ),
                      ],
                    ),
                  ),
                  AnimatedContainer(
                    duration: motion,
                    curve: Curves.easeOutCubic,
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: open ? world.accent.withValues(alpha: 0.10) : Colors.transparent,
                    ),
                    child: Icon(
                      children.isEmpty ? Icons.arrow_forward_rounded : (open ? Icons.remove_rounded : Icons.add_rounded),
                      size: 18,
                      color: world.accent,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        // الفروع تنفتح وتنطوي بسلاسة مع حدود الصف بدل الظهور المفاجئ.
        AnimatedSize(
          duration: motion,
          curve: Curves.easeOutCubic,
          alignment: AlignmentDirectional.topCenter,
          child: open && children.isNotEmpty
              ? ColoredBox(
                  color: Color.alphaBlend(world.accent.withValues(alpha: 0.05), world.surface),
                  child: Padding(
                    padding: const EdgeInsetsDirectional.fromSTEB(16, 6, 16, 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Align(
                          alignment: AlignmentDirectional.centerStart,
                          child: TextButton(
                            onPressed: onOpen,
                            style: TextButton.styleFrom(
                              foregroundColor: world.accent,
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              minimumSize: const Size(0, kMinTapTarget),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(s.worldAllProducts, style: AppText.label.copyWith(fontWeight: FontWeight.w800, color: world.accent)),
                                const SizedBox(width: 2),
                                Icon(Icons.chevron_right_rounded, size: 17, color: world.accent),
                              ],
                            ),
                          ),
                        ),
                        for (final child in children)
                          InkWell(
                            onTap: () => onOpenChild(child),
                            borderRadius: BorderRadius.circular(AppCorners.sm),
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(minHeight: kMinTapTarget),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 4),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 30,
                                      height: 30,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: Color.alphaBlend(world.accent.withValues(alpha: 0.07), world.surface),
                                        border: Border.all(color: world.accent.withValues(alpha: 0.22)),
                                      ),
                                      clipBehavior: Clip.antiAlias,
                                      child: CategoryLineArt(category: child, size: 30),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        child.localizedName(lang),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: AppText.label.copyWith(fontSize: 14, color: world.ink),
                                      ),
                                    ),
                                    Icon(Icons.chevron_right_rounded, size: 16, color: world.accent.withValues(alpha: 0.55)),
                                  ],
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                )
              : const SizedBox(width: double.infinity),
        ),
      ],
    );
  }
}

class _WorldBottomBar extends ConsumerWidget {
  final int index;
  final StoreWorld world;
  final ValueChanged<int> onSelect;

  const _WorldBottomBar({
    required this.index,
    required this.world,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final accent = world.accent;
    final ink = world.ink;
    final labels = [s.worldTabExplore, s.worldTabSections, s.worldTabSearch, s.worldTabStore];
    const icons = [
      Icons.explore_rounded,
      Icons.grid_view_rounded,
      Icons.search_rounded,
      Icons.storefront_rounded,
    ];
    final motion = MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 220);
    final inset = Responsive.systemBottomInset(context);
    return Padding(
      padding: EdgeInsetsDirectional.fromSTEB(16, 6, 16, inset > 0 ? inset : 10),
      child: Material(
        color: world.surface,
        elevation: 8,
        shadowColor: accent.withValues(alpha: 0.28),
        borderRadius: BorderRadius.circular(AppCorners.lg),
        clipBehavior: Clip.antiAlias,
        child: SizedBox(
          height: 58,
          child: Row(
            children: [
              for (var i = 0; i < labels.length; i++)
                Expanded(
                  child: Semantics(
                    button: true,
                    selected: index == i,
                    label: labels[i],
                    child: ExcludeSemantics(
                      child: InkWell(
                        onTap: () => onSelect(i),
                        borderRadius: BorderRadius.circular(AppCorners.lg),
                        child: Center(
                          child: AnimatedContainer(
                            duration: motion,
                            curve: Curves.easeOutCubic,
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: index == i ? accent.withValues(alpha: 0.12) : Colors.transparent,
                              borderRadius: BorderRadius.circular(AppCorners.sm),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(icons[i], size: 18, color: index == i ? accent : ink.withValues(alpha: 0.5)),
                                const SizedBox(height: 1),
                                Text(
                                  labels[i],
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppText.micro.copyWith(
                                    fontSize: 10,
                                    color: index == i ? accent : ink.withValues(alpha: 0.5),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
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
