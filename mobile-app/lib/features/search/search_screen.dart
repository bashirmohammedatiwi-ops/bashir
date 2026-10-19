import 'dart:async';

import 'package:flutter/foundation.dart' show ValueListenable;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/navigation/deep_link_redirect.dart';
import '../../core/navigation/product_nav.dart';
import '../../core/utils/barcode_util.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/models/search_instant.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/recently_viewed_provider.dart';
import '../categories/category_browse.dart';
import '../home/home_category_filter.dart';
import '../shell/main_shell.dart' show homeScrollToTopProvider;
import '../shell/nav_tabs.dart';
import '../worlds/world_theme.dart';
import '../worlds/worlds_provider.dart';
import 'qr_scan_screen.dart' show scannedProductLocation;
import 'recent_searches_provider.dart';
import 'search_strings.dart';
import 'search_suggest_merge.dart' show brandLocation, categoryLocation;
import 'search_v2_controllers.dart';
import 'smart_query.dart';
import 'widgets/search_idle_view.dart';
import 'widgets/search_instant_panel.dart';
import 'widgets/search_results_page.dart';

/// البحث — محرك جديد في الذاكرة على الخادم (أجزاء من الثانية) وواجهة لا تُعاد بناؤها
/// مع كل حرف: الحقل ثابت، وما تحته فقط يتحدث حين تصل النتائج.
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

enum _Mode { idle, instant, results }

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  final _focus = FocusNode();
  late final InstantSearchController _instant;
  late final SearchResultsV2Controller _results;
  final _mode = ValueNotifier(_Mode.idle);
  final _barcodeBusy = ValueNotifier(false);

  @override
  void initState() {
    super.initState();
    final api = ref.read(apiServiceProvider);
    _instant = InstantSearchController(api, lang: () => _lang);
    _results = SearchResultsV2Controller(api, lang: () => _lang);
    _controller.addListener(_onText);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final q = _initialQuery;
      if (q != null) _runTerm(q);
    });
  }

  /// فُتح البحث بكلمة جاهزة (رابط/حملة/ماسح): نعرض النتائج بلا لوحة مفاتيح.
  String? _initialQuery;

  /// جاء من الماسح بعد بحث فاشل بالباركود — لا نعيد البحث به مرة ثانية.
  bool _skipBarcodeOnce = false;

  /// قسم كان يُعرض في تلميح شريط البحث بالرئيسية — نثبّته أول الاقتراحات.
  String? _pinnedHint;
  bool _readRoute = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_readRoute) return;
    _readRoute = true;
    final params = GoRouterState.of(context).uri.queryParameters;
    final q = params['q']?.trim();
    _initialQuery = q != null && q.isNotEmpty ? q : null;
    _skipBarcodeOnce = _initialQuery != null && params['scanned'] == '1';
    final hint = params['hint']?.trim();
    _pinnedHint = hint != null && hint.isNotEmpty ? hint : null;
  }

  @override
  void dispose() {
    _controller.removeListener(_onText);
    _instant.dispose();
    _results.dispose();
    _controller.dispose();
    _focus.dispose();
    _mode.dispose();
    _barcodeBusy.dispose();
    super.dispose();
  }

  String get _lang => ref.read(languageCodeProvider);

  // ---- إدخال ----

  void _onText() {
    final raw = _controller.text;
    final q = raw.trim();
    if (_results.active && q != _results.query) _results.reset();
    _instant.update(raw);
    _mode.value = q.length < 2 ? _Mode.idle : (_results.active && _results.query == q ? _Mode.results : _Mode.instant);
  }

  void _setText(String text) {
    _controller.value = TextEditingValue(text: text, selection: TextSelection.collapsed(offset: text.length));
  }

  void _onClear() {
    _setText('');
    _results.reset();
    _focus.requestFocus();
  }

  /// يملأ الحقل ويبحث (إكمال، سابق، تصحيح).
  void _runTerm(String term) {
    final q = term.trim();
    _setText(q);
    _submit(q);
  }

  /// يملأ الحقل دون بحث — لتكملي الكتابة.
  void _fill(String term) {
    _setText('${term.trim()} ');
    _focus.requestFocus();
  }

  Future<void> _submit(String raw) async {
    final q = raw.trim();
    if (q.length < 2) return;
    _focus.unfocus();

    // «بحث» مجدداً على النتائج نفسها: لا نمسح الفلاتر ولا نعيد التحميل.
    if (_results.active && _results.query == q) {
      _mode.value = _Mode.results;
      if (_results.error == null) return;
      // بعد خطأ: نعيد بالفلاتر نفسها.
      await _showResults(q, _results.filters);
      return;
    }

    // باركود: مطابقة مباشرة تفتح المنتج فوراً (بالدرجة الملتقطة إن وُجدت).
    final skipBarcode = _skipBarcodeOnce;
    _skipBarcodeOnce = false;
    if (!skipBarcode && isBarcodeSearchQuery(q)) {
      _barcodeBusy.value = true;
      try {
        final hit = await ref.read(apiServiceProvider).lookupProductByBarcode(q);
        if (!mounted) return;
        if (hit != null) {
          HapticFeedback.mediumImpact();
          _barcodeBusy.value = false;
          context.push(scannedProductLocation(hit));
          return;
        }
      } catch (_) {}
      if (!mounted) return;
      _barcodeBusy.value = false;
    }

    await _showResults(q);
  }

  /// يبحث ويعرض النتائج، ويحفظ الكلمة في السجل إن وجدت شيئاً.
  Future<void> _showResults(String q, [SearchFilters? filters]) async {
    final search = _results.search(q, filters: filters);
    _mode.value = _Mode.results;
    await search;
    if (!mounted || _results.query != q) return;
    if (_results.items.isNotEmpty) ref.read(recentSearchesProvider.notifier).add(q);
  }

  /// شريحة براند/قسم في الاقتراحات: تضيّق نتائج الكلمة المكتوبة بدل فتح الكتالوج كاملاً.
  Future<void> _searchWithFilter(SearchFilters f) async {
    final q = _controller.text.trim();
    if (q.length < 2) return;
    _focus.unfocus();
    await _showResults(q, f);
  }

  void _onInstantBrand(SearchFacet b) {
    final typed = normalizeQuery(_controller.text);
    final top = _instant.data?.completions.firstOrNull;
    // كتبت اسم البراند نفسه: صفحته أنفع من نتائج مفلترة.
    if (typed == normalizeQuery(b.name) || top?.type == 'brand') {
      _go(b.slug.isNotEmpty ? '/brand/${b.slug}' : brandLocation(b.id, b.name));
      return;
    }
    _searchWithFilter(SearchFilters(brandIds: {b.id}));
  }

  Future<void> _scan() async {
    HapticFeedback.lightImpact();
    _focus.unfocus();
    final code = await context.push<String>('/scan?pick=1');
    if (code == null || !mounted) return;
    final link = resolveScannedLink(code);
    // رابط المتجر داخل الرمز يُفتح مباشرة («ديما» بالعربي فقط).
    if (link != null && !(link.startsWith('/advisor') && _lang != 'ar')) {
      if (openTabPath(context, link)) return;
      context.push(link);
      return;
    }
    final n = normalizeBarcode(code);
    // _submit يبحث بالباركود مرة واحدة، ثم بحثاً نصياً إن لم يجده.
    _runTerm(n.isNotEmpty ? n : code);
  }

  // ---- تنقّل ----

  /// يحفظ ما كُتب في السجل عند فتح اقتراح — الإكمال الذي يبدأ بما كُتب، لا نصف كلمة.
  void _rememberQuery() {
    final typed = _controller.text;
    final q = normalizeQuery(typed);
    if (q.length < 2) return;
    final completions = _instant.data?.completions ?? const <SearchCompletion>[];
    String? keep;
    for (final c in completions) {
      if (normalizeQuery(c.text).startsWith(q)) {
        keep = c.text;
        break;
      }
    }
    // بلا إكمال مطابق: نحفظ فقط كلمة مكتملة (تنتهي بمسافة).
    keep ??= typed.endsWith(' ') ? typed.trim() : null;
    if (keep != null) ref.read(recentSearchesProvider.notifier).add(keep);
  }

  /// مسح سجل البحث مع «تراجع».
  void _clearRecentSearches() {
    final prev = ref.read(recentSearchesProvider);
    if (prev.isEmpty) return;
    final notifier = ref.read(recentSearchesProvider.notifier);
    notifier.clear();
    final s = ref.read(stringsProvider);
    AppSnackbar.action(context, message: s.searchRecentCleared, actionLabel: s.undo, onAction: () => notifier.restore(prev));
  }

  /// مسح «شاهدتِها مؤخراً» مع «تراجع» يعيدها كما كانت.
  void _clearRecentlyViewed() {
    final prev = ref.read(recentlyViewedProvider);
    if (prev.isEmpty) return;
    final notifier = ref.read(recentlyViewedProvider.notifier);
    notifier.clear();
    final s = ref.read(stringsProvider);
    AppSnackbar.action(
      context,
      message: s.searchRecentlyViewedCleared,
      actionLabel: s.undo,
      onAction: () => notifier.restore(prev),
    );
  }

  void _go(String location) {
    _rememberQuery();
    _focus.unfocus();
    context.push(location);
  }

  void _openCategory(Category c) {
    final title = c.localizedName(_lang);
    context.push(categoryLocation(title: title, categoryId: c.id));
  }

  /// العالم يُفتح كرئيسية التطبيق بلونه — لا نسخة ثانية بألوان العالم المختار سابقاً.
  void _openWorld(String slug) {
    HapticFeedback.selectionClick();
    _focus.unfocus();
    final container = ProviderScope.containerOf(context, listen: false);
    container.read(selectedWorldSlugProvider.notifier).state = slug;
    container.read(homeScrollToTopProvider.notifier).state++;
    openHomeTab(context, container);
  }

  /// «الأكثر طلباً»: الأقسام الفرعية والدقيقة الأغنى بالمنتجات (تُحسب مرة لكل تحديث للأقسام).
  List<Category>? _trendsFor;
  String? _trendsLang;
  List<SearchTrend> _trendsCache = const [];

  List<SearchTrend> _trends(List<Category> cats, String lang) {
    if (cats.isEmpty) return const [];
    if (identical(cats, _trendsFor) && lang == _trendsLang) return _trendsCache;
    _trendsFor = cats;
    _trendsLang = lang;
    final roots = cats.where((c) => c.parentId == null || c.parentId!.isEmpty).toList();
    final index = CategoryIndex.build(roots);
    final out = <SearchTrend>[];
    final seen = <String>{};
    // القسم الذي كان في تلميح الرئيسية يتصدّر.
    final pinned = _pinnedHint == null ? '' : normalizeQuery(_pinnedHint!);
    if (pinned.isNotEmpty) {
      for (final e in index.all) {
        final c = e.category;
        final names = [c.localizedName(lang), c.name, c.nameAr ?? '', c.nameEn ?? ''];
        if (!names.any((n) => n.isNotEmpty && normalizeQuery(n) == pinned)) continue;
        final label = c.localizedName(lang);
        seen.add(label);
        out.add(SearchTrend(label: label, location: e.target(lang).location));
        break;
      }
    }
    final subs = index.all.where((e) => e.level != CategoryLevel.root).toList()
      ..sort((a, b) => b.category.displayCount.compareTo(a.category.displayCount));
    for (final e in subs) {
      if (out.length == 8) break;
      final label = e.category.localizedName(lang);
      if (!seen.add(label)) continue;
      out.add(SearchTrend(label: label, location: e.target(lang).location));
    }
    return _trendsCache = out;
  }

  /// البراندات المميّزة أولاً ثم الأكثر منتجات.
  List<Brand> _topBrands(List<Brand> brands) {
    final list = brands.where((b) => b.productCount > 0).toList()
      ..sort((a, b) {
        if (a.isFeatured != b.isFeatured) return a.isFeatured ? -1 : 1;
        return b.productCount.compareTo(a.productCount);
      });
    return list.take(30).toList();
  }

  // ---- بناء ----

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageCodeProvider);
    final t = context.worldTheme;
    final cats = ref.watch(categoriesProvider).valueOrNull ?? const <Category>[];
    // تلميحات متبدّلة في الحقل الفارغ: «ابحثي عن سيروم…».
    final hints = [s.searchFieldHint, for (final tr in _trends(cats, lang).take(5)) s.searchHintFor(tr.label)];
    return Scaffold(
      backgroundColor: t.canvas,
      body: Column(
        children: [
          _SearchBar(
            s: s,
            controller: _controller,
            focus: _focus,
            autofocus: _initialQuery == null,
            hints: hints,
            busy: _barcodeBusy,
            onSubmitted: _submit,
            onClear: _onClear,
            onScan: _scan,
          ),
          Expanded(
            child: ValueListenableBuilder<_Mode>(
              valueListenable: _mode,
              builder: (context, mode, _) => AnimatedSwitcher(
                duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 160),
                child: KeyedSubtree(key: ValueKey(mode), child: _body(mode, s)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _body(_Mode mode, AppStrings s) {
    switch (mode) {
      case _Mode.instant:
        return ListenableBuilder(
          listenable: _instant,
          builder: (context, _) => SearchInstantPanel(
            s: s,
            query: _instant.query,
            data: _instant.data,
            loading: _instant.loading,
            failed: _instant.failed,
            onRetry: _instant.retry,
            onSearch: _runTerm,
            onFill: _fill,
            onProduct: (p) {
              // الصفحة تظهر فوراً ببيانات الاقتراح؛ «مختصرة» فلا تُضاف للسلة قبل التفاصيل.
              ProductSeeds.put(p.toSeed(), lite: true);
              _go(p.route);
            },
            onBrand: _onInstantBrand,
            onCategory: (c) => _searchWithFilter(SearchFilters(categoryId: c.id)),
          ),
        );
      case _Mode.results:
        return ListenableBuilder(
          listenable: _results,
          builder: (context, _) => SearchResultsPage(s: s, results: _results, onSearch: _runTerm),
        );
      case _Mode.idle:
        return Consumer(builder: (context, ref, _) {
          final lang = ref.watch(languageCodeProvider);
          final cats = ref.watch(categoriesProvider).valueOrNull ?? const <Category>[];
          final brands = ref.watch(brandsProvider).valueOrNull ?? const <Brand>[];
          return SearchIdleView(
            s: s,
            lang: lang,
            query: _controller,
            recentQueries: ref.watch(recentSearchesProvider),
            categories: storefrontParentCategories(cats).take(10).toList(),
            recentProducts: ref.watch(recentlyViewedProvider),
            onRecentTap: _runTerm,
            onRecentRemove: (v) => ref.read(recentSearchesProvider.notifier).remove(v),
            onClearRecent: _clearRecentSearches,
            onCategoryTap: _openCategory,
            onClearRecentProducts: _clearRecentlyViewed,
            worlds: ref.watch(worldsProvider).valueOrNull ?? const [],
            trends: _trends(cats, lang),
            brands: _topBrands(brands),
            onWorldTap: _openWorld,
            onLocation: (loc) {
              _focus.unfocus();
              context.push(loc);
            },
            onAllBrands: () {
              _focus.unfocus();
              openMainTab(context, ProviderScope.containerOf(context), NavTabs.brands);
            },
            onBrandTap: (b) {
              _focus.unfocus();
              context.push(brandLocation(b.id, b.localizedName(lang)));
            },
          );
        });
    }
  }
}

/// شريط البحث: يُبنى مرة واحدة؛ فقط أيقونة التحميل وزر المسح يتحدثان.
class _SearchBar extends StatelessWidget {
  final AppStrings s;
  final TextEditingController controller;
  final FocusNode focus;
  final bool autofocus;
  final List<String> hints;

  /// بحث بالباركود جارٍ — المؤشر في الحقل لهذا فقط (الاقتراحات لها شريطها الرفيع).
  final ValueListenable<bool> busy;
  final ValueChanged<String> onSubmitted;
  final VoidCallback onClear;
  final VoidCallback onScan;

  const _SearchBar({
    required this.s,
    required this.controller,
    required this.focus,
    required this.autofocus,
    required this.hints,
    required this.busy,
    required this.onSubmitted,
    required this.onClear,
    required this.onScan,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final hintStyle = AppText.bodySmall.copyWith(color: t.inkMuted, fontSize: 14);
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent),
      child: Material(
        color: t.surface,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(6, 6, 12, 10),
            child: Row(
              children: [
                const AppBackButton(outlined: false),
                Expanded(
                  child: TextField(
                    controller: controller,
                    focusNode: focus,
                    autofocus: autofocus,
                    textInputAction: TextInputAction.search,
                    autocorrect: false,
                    enableSuggestions: false,
                    cursorColor: t.accent,
                    style: AppText.body.copyWith(color: t.ink, fontWeight: FontWeight.w600, height: 1.3),
                    onSubmitted: onSubmitted,
                    decoration: InputDecoration(
                      isDense: true,
                      hint: _RotatingHint(hints: hints, style: hintStyle),
                      filled: true,
                      fillColor: Color.alphaBlend(t.ink.withValues(alpha: 0.045), t.surface),
                      contentPadding: const EdgeInsets.symmetric(vertical: 15),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppCorners.lg), borderSide: BorderSide.none),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppCorners.lg), borderSide: BorderSide.none),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(AppCorners.lg),
                        borderSide: BorderSide(color: t.accent.withValues(alpha: 0.5)),
                      ),
                      prefixIcon: Padding(
                        padding: const EdgeInsetsDirectional.only(start: 14, end: 8),
                        child: ValueListenableBuilder<bool>(
                          valueListenable: busy,
                          builder: (_, isBusy, __) => isBusy
                              ? SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: Padding(padding: const EdgeInsets.all(2), child: CircularProgressIndicator(strokeWidth: 2, color: t.accent)),
                                )
                              : Icon(Icons.search_rounded, color: t.inkMuted, size: 22),
                        ),
                      ),
                      prefixIconConstraints: const BoxConstraints(minWidth: 44, minHeight: 24),
                      suffixIcon: ValueListenableBuilder<TextEditingValue>(
                        valueListenable: controller,
                        builder: (_, v, __) => v.text.isEmpty
                            ? const SizedBox.shrink()
                            : IconButton(
                                onPressed: onClear,
                                icon: Icon(Icons.cancel_rounded, color: t.inkMuted, size: 20),
                                tooltip: s.searchClearField,
                              ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // بنفس تعبئة حقل البحث — بلا ظل يُقص عند حافة الشريط، وبتموّج عند الضغط.
                Material(
                  color: Color.alphaBlend(t.accent.withValues(alpha: 0.08), t.surface),
                  borderRadius: BorderRadius.circular(AppCorners.md),
                  child: InkWell(
                    onTap: onScan,
                    borderRadius: BorderRadius.circular(AppCorners.md),
                    child: Tooltip(
                      message: s.searchScanBarcode,
                      child: SizedBox(
                        width: 48,
                        height: 48,
                        child: Icon(Icons.qr_code_scanner_rounded, color: t.accentDark, size: 23),
                      ),
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

/// تلميح يتبدّل كل بضع ثوانٍ بانزلاق ناعم للأعلى — ثابت مع «تقليل الحركة».
class _RotatingHint extends StatefulWidget {
  final List<String> hints;
  final TextStyle style;
  const _RotatingHint({required this.hints, required this.style});

  @override
  State<_RotatingHint> createState() => _RotatingHintState();
}

class _RotatingHintState extends State<_RotatingHint> {
  Timer? _timer;
  int _i = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(milliseconds: 3200), (_) {
      if (!mounted || widget.hints.length < 2 || MediaQuery.disableAnimationsOf(context)) return;
      setState(() => _i = (_i + 1) % widget.hints.length);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hints = widget.hints;
    final text = hints.isEmpty ? '' : hints[_i % hints.length];
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    return ClipRect(
      child: AnimatedSwitcher(
        duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 420),
        layoutBuilder: (current, previous) => Stack(
          alignment: AlignmentDirectional.centerStart,
          children: [...previous, if (current != null) current],
        ),
        transitionBuilder: (child, a) => FadeTransition(
          opacity: a,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: Offset(0, child.key == ValueKey(text) ? 0.6 : -0.6),
              end: Offset.zero,
            ).animate(a),
            child: child,
          ),
        ),
        child: Text(text, key: ValueKey(text), maxLines: 1, overflow: TextOverflow.ellipsis, style: widget.style),
      ),
    );
  }
}
