import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/utils/barcode_util.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/recently_viewed_provider.dart';
import '../categories/category_browse.dart';
import '../home/home_category_filter.dart';
import '../shell/nav_tabs.dart';
import '../worlds/world_theme.dart';
import '../worlds/worlds_provider.dart';
import 'recent_searches_provider.dart';
import 'search_strings.dart';
import 'search_suggest_merge.dart' show categoryLocation;
import 'search_v2_controllers.dart';
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
    _instant = InstantSearchController(api);
    _results = SearchResultsV2Controller(api);
    _controller.addListener(_onText);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final q = _initialQuery;
      if (q != null) _runTerm(q);
    });
  }

  /// فُتح البحث بكلمة جاهزة (رابط/حملة): نعرض النتائج بلا لوحة مفاتيح.
  String? _initialQuery;
  bool _readRoute = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_readRoute) return;
    _readRoute = true;
    final q = GoRouterState.of(context).uri.queryParameters['q']?.trim();
    _initialQuery = q != null && q.isNotEmpty ? q : null;
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

    // باركود: مطابقة مباشرة تفتح المنتج فوراً.
    if (isBarcodeSearchQuery(q)) {
      _barcodeBusy.value = true;
      try {
        final hit = await ref.read(apiServiceProvider).lookupProductByBarcode(q);
        if (!mounted) return;
        if (hit != null) {
          HapticFeedback.mediumImpact();
          _barcodeBusy.value = false;
          context.push('/product/${hit.productSlug}');
          return;
        }
      } catch (_) {}
      if (!mounted) return;
      _barcodeBusy.value = false;
    }

    final search = _results.search(q);
    _mode.value = _Mode.results;
    await search;
    if (!mounted || _results.query != q) return;
    if (_results.items.isNotEmpty) ref.read(recentSearchesProvider.notifier).add(q);
  }

  // ---- تنقّل ----

  void _rememberQuery() {
    final q = _controller.text.trim();
    if (q.length >= 2) ref.read(recentSearchesProvider.notifier).add(q);
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
    final subs = index.all.where((e) => e.level != CategoryLevel.root).toList()
      ..sort((a, b) => b.category.displayCount.compareTo(a.category.displayCount));
    final seen = <String>{};
    final out = <SearchTrend>[];
    for (final e in subs) {
      final label = e.category.localizedName(lang);
      if (!seen.add(label)) continue;
      out.add(SearchTrend(label: label, location: e.target(lang).location));
      if (out.length == 8) break;
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
    final t = context.worldTheme;
    return Scaffold(
      backgroundColor: t.canvas,
      body: Column(
        children: [
          _SearchBar(
            controller: _controller,
            focus: _focus,
            autofocus: _initialQuery == null,
            hint: s.searchFieldHint,
            busy: Listenable.merge([_instant, _barcodeBusy]),
            isBusy: () => _instant.loading || _barcodeBusy.value,
            onSubmitted: _submit,
            onClear: _onClear,
            onScan: () {
              HapticFeedback.lightImpact();
              context.push('/scan');
            },
          ),
          Expanded(
            child: ValueListenableBuilder<_Mode>(
              valueListenable: _mode,
              builder: (context, mode, _) => AnimatedSwitcher(
                duration: const Duration(milliseconds: 160),
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
            query: _instant.query,
            data: _instant.data,
            loading: _instant.loading,
            onSearch: _runTerm,
            onFill: _fill,
            onProduct: (p) => _go(p.route),
            onBrand: (b) => _go(b.slug.isNotEmpty ? '/brand/${b.slug}' : '/products?brandId=${b.id}&title=${Uri.encodeComponent(b.name)}'),
            onCategory: (c) => _go('/category/${c.slug}'),
          ),
        );
      case _Mode.results:
        return ListenableBuilder(
          listenable: _results,
          builder: (context, _) => SearchResultsPage(results: _results, onSearch: _runTerm),
        );
      case _Mode.idle:
        return Consumer(builder: (context, ref, _) {
          final lang = ref.watch(languageCodeProvider);
          final cats = ref.watch(categoriesProvider).valueOrNull ?? const <Category>[];
          final brands = ref.watch(brandsProvider).valueOrNull ?? const <Brand>[];
          return SearchIdleView(
            s: s,
            lang: lang,
            typingTooShort: _controller.text.trim().length == 1,
            recentQueries: ref.watch(recentSearchesProvider),
            categories: storefrontParentCategories(cats).take(10).toList(),
            recentProducts: ref.watch(recentlyViewedProvider),
            onRecentTap: _runTerm,
            onRecentRemove: (v) => ref.read(recentSearchesProvider.notifier).remove(v),
            onClearRecent: () => ref.read(recentSearchesProvider.notifier).clear(),
            onCategoryTap: _openCategory,
            onClearRecentProducts: () => ref.read(recentlyViewedProvider.notifier).clear(),
            worlds: ref.watch(worldsProvider).valueOrNull ?? const [],
            trends: _trends(cats, lang),
            brands: _topBrands(brands),
            onWorldTap: (slug) {
              HapticFeedback.selectionClick();
              context.push('/world/$slug');
            },
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
              final name = b.localizedName(lang);
              context.push('/products?brandId=${b.id}&title=${Uri.encodeComponent(name)}');
            },
          );
        });
    }
  }
}

/// شريط البحث: يُبنى مرة واحدة؛ فقط أيقونة التحميل وزر المسح يتحدثان.
class _SearchBar extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focus;
  final bool autofocus;
  final String hint;
  final Listenable busy;
  final bool Function() isBusy;
  final ValueChanged<String> onSubmitted;
  final VoidCallback onClear;
  final VoidCallback onScan;

  const _SearchBar({
    required this.controller,
    required this.focus,
    required this.autofocus,
    required this.hint,
    required this.busy,
    required this.isBusy,
    required this.onSubmitted,
    required this.onClear,
    required this.onScan,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
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
                      hintText: hint,
                      hintStyle: AppText.bodySmall.copyWith(color: t.inkMuted, fontSize: 14),
                      filled: true,
                      fillColor: Color.alphaBlend(t.ink.withValues(alpha: 0.045), t.surface),
                      contentPadding: const EdgeInsets.symmetric(vertical: 15),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: t.accent.withValues(alpha: 0.5))),
                      prefixIcon: Padding(
                        padding: const EdgeInsetsDirectional.only(start: 14, end: 8),
                        child: ListenableBuilder(
                          listenable: busy,
                          builder: (_, __) => isBusy()
                              ? SizedBox(width: 20, height: 20, child: Padding(padding: const EdgeInsets.all(2), child: CircularProgressIndicator(strokeWidth: 2, color: t.accent)))
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
                                tooltip: 'مسح',
                              ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Semantics(
                  button: true,
                  label: 'مسح الباركود',
                  child: GestureDetector(
                    onTap: onScan,
                    child: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: t.surface,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [BoxShadow(color: t.ink.withValues(alpha: 0.08), blurRadius: 12, offset: const Offset(0, 4))],
                      ),
                      child: Icon(Icons.qr_code_scanner_rounded, color: t.accentDark, size: 23),
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
