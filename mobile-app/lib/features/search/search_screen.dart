import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/utils/barcode_util.dart';
import '../../core/utils/friendly_error.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/models/search_suggestions.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/recently_viewed_provider.dart';
import '../home/home_category_filter.dart';
import '../worlds/world_theme.dart';
import 'recent_searches_provider.dart';
import 'search_controllers.dart';
import 'search_strings.dart';
import 'search_suggest_merge.dart';
import 'smart_query.dart';
import 'widgets/search_idle_view.dart';
import 'widgets/search_results_view.dart';
import 'widgets/search_suggestions_panel.dart';
import 'widgets/search_top_bar.dart';
import '../worlds/worlds_provider.dart';
import '../categories/category_browse.dart';
import '../shell/nav_tabs.dart';

/// حجم صفحة النتائج — صفحات صغيرة تظهر أسرع ثم «المزيد» تلقائياً.
const _pageSize = 24;

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  final _focus = FocusNode();
  late final SuggestController _suggest;
  late final SearchResultsController _results;

  bool _barcodeBusy = false;

  /// تصحيح مقترح لاستعلام بلا نتائج (من نفس واجهة الاقتراحات).
  String? _emptyCorrection;
  String _emptyCorrectionFor = '';

  @override
  void initState() {
    super.initState();
    final api = ref.read(apiServiceProvider);
    _suggest = SuggestController(
      fetch: (q, token) => api.suggestProducts(
        q,
        lang: ref.read(languageCodeProvider),
        cancelToken: token,
      ),
    );
    _results = SearchResultsController(
      fetch: (q, page) =>
          api.getProducts(search: q, page: page, limit: _pageSize),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final q = GoRouterState.of(context).uri.queryParameters['q']?.trim();
      if (q != null && q.isNotEmpty) _runTerm(q);
    });
  }

  @override
  void dispose() {
    _suggest.dispose();
    _results.dispose();
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  String get _lang => ref.read(languageCodeProvider);

  // ---- إدخال ----

  void _onChanged(String value) {
    final q = value.trim();
    if (_results.hasSearched && q != _results.query) _results.reset();
    _suggest.update(q, scope: _lang);
    setState(() {});
  }

  void _onClear() {
    _controller.clear();
    _results.reset();
    _suggest.update('', scope: _lang);
    _focus.requestFocus();
    setState(() {});
  }

  /// يضع النص في الحقل ثم يبحث (سابق/مرادف/تصحيح).
  void _runTerm(String term) {
    final q = term.trim();
    _controller.value = TextEditingValue(
      text: q,
      selection: TextSelection.collapsed(offset: q.length),
    );
    _suggest.update(q, scope: _lang);
    _submit(q);
  }

  Future<void> _submit(String raw) async {
    final q = raw.trim();
    if (q.length < 2) return;
    _focus.unfocus();

    // اختصار الباركود: مطابقة مباشرة تفتح المنتج فوراً.
    if (isBarcodeSearchQuery(q)) {
      setState(() => _barcodeBusy = true);
      try {
        final hit = await ref
            .read(apiServiceProvider)
            .lookupProductByBarcode(q);
        if (!mounted) return;
        if (hit != null) {
          HapticFeedback.mediumImpact();
          setState(() => _barcodeBusy = false);
          context.push('/product/${hit.productSlug}');
          return;
        }
      } catch (_) {
        // نكمل بالبحث النصي العادي.
      }
      if (!mounted) return;
      setState(() => _barcodeBusy = false);
    }

    setState(() {
      _emptyCorrection = null;
      _emptyCorrectionFor = '';
    });
    await _results.search(q);
    if (!mounted || _results.query != q) return;
    if (_results.items.isNotEmpty) {
      ref.read(recentSearchesProvider.notifier).add(q);
    } else if (_results.error == null) {
      final sug = await _suggest.ensure(q, scope: _lang);
      if (!mounted || _results.query != q) return;
      setState(() {
        _emptyCorrectionFor = q;
        _emptyCorrection = shouldOfferCorrection(q, sug?.corrected)
            ? sug!.corrected
            : null;
      });
    }
  }

  // ---- تنقّل ----

  void _rememberQuery() {
    final q = _controller.text.trim();
    if (q.length >= 2) ref.read(recentSearchesProvider.notifier).add(q);
  }

  void _openEntry(SuggestEntry e) {
    _rememberQuery();
    _focus.unfocus();
    context.push(e.location);
  }

  void _openProduct(SuggestProduct p) {
    _rememberQuery();
    _focus.unfocus();
    context.push(p.route);
  }

  void _openCategory(Category c) {
    final title = c.localizedName(_lang);
    context.push(categoryLocation(title: title, categoryId: c.id));
  }

  void _browseCategories() {
    openCategoriesTab(context, ProviderScope.containerOf(context));
  }

  /// "الأكثر طلباً": الأقسام الفرعية والدقيقة الأغنى بالمنتجات.
  List<Category>? _trendsFor;
  String? _trendsLang;
  List<SearchTrend> _trendsCache = const [];

  List<SearchTrend> _trends(List<Category> cats, String lang) {
    if (cats.isEmpty) return const [];
    // يُحسب مرة لكل تحديث للأقسام — لا مع كل حرف يُكتب.
    if (identical(cats, _trendsFor) && lang == _trendsLang) return _trendsCache;
    _trendsFor = cats;
    _trendsLang = lang;
    _trendsCache = _computeTrends(cats, lang);
    return _trendsCache;
  }

  List<SearchTrend> _computeTrends(List<Category> cats, String lang) {
    final roots = cats
        .where((c) => c.parentId == null || c.parentId!.isEmpty)
        .toList();
    final index = CategoryIndex.build(roots);
    final subs = index.all.where((e) => e.level != CategoryLevel.root).toList()
      ..sort(
        (a, b) => b.category.displayCount.compareTo(a.category.displayCount),
      );
    final seen = <String>{};
    final out = <SearchTrend>[];
    for (final e in subs) {
      final label = e.category.localizedName(lang);
      if (!seen.add(label)) continue;
      out.add(SearchTrend(label: label, location: e.target(lang).location));
      if (out.length == 8) break;
    }
    return out;
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
          ListenableBuilder(
            listenable: Listenable.merge([_suggest, _results]),
            builder: (context, _) => SearchTopBar(
              controller: _controller,
              focusNode: _focus,
              hint: s.searchFieldHint,
              clearTooltip: s.searchClearField,
              scanTooltip: s.searchScanBarcode,
              busy: _barcodeBusy || _suggest.loading,
              hints: [
                s.searchFieldHint,
                for (final tr in _trends(
                  ref.watch(categoriesProvider).valueOrNull ?? const [],
                  ref.watch(languageCodeProvider),
                ).take(5))
                  s.isAr ? 'ابحثي عن ${tr.label}…' : 'Search ${tr.label}…',
              ],
              onChanged: _onChanged,
              onSubmitted: _submit,
              onClear: _onClear,
              onScan: () {
                HapticFeedback.lightImpact();
                context.push('/scan');
              },
            ),
          ),
          Expanded(
            child: ListenableBuilder(
              listenable: Listenable.merge([_suggest, _results]),
              builder: (context, _) => AnimatedSwitcher(
                duration: const Duration(milliseconds: 180),
                child: KeyedSubtree(
                  key: ValueKey(_modeKey()),
                  child: _buildBody(s),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _modeKey() {
    final q = _controller.text.trim();
    if (q.length < 2) return 'idle';
    if (_results.hasSearched && _results.query == q) return 'results';
    return 'suggest';
  }

  Widget _buildBody(AppStrings s) {
    final lang = ref.watch(languageCodeProvider);
    final q = _controller.text.trim();
    final cats =
        ref.watch(categoriesProvider).valueOrNull ?? const <Category>[];
    final brands = ref.watch(brandsProvider).valueOrNull ?? const <Brand>[];

    switch (_modeKey()) {
      case 'idle':
        return SearchIdleView(
          s: s,
          lang: lang,
          typingTooShort: q.length == 1,
          recentQueries: ref.watch(recentSearchesProvider),
          categories: storefrontParentCategories(cats).take(10).toList(),
          recentProducts: ref.watch(recentlyViewedProvider),
          onRecentTap: _runTerm,
          onRecentRemove: (v) =>
              ref.read(recentSearchesProvider.notifier).remove(v),
          onClearRecent: () =>
              ref.read(recentSearchesProvider.notifier).clear(),
          onCategoryTap: _openCategory,
          onClearRecentProducts: () =>
              ref.read(recentlyViewedProvider.notifier).clear(),
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
            openMainTab(
              context,
              ProviderScope.containerOf(context),
              NavTabs.brands,
            );
          },
          onBrandTap: (b) {
            _focus.unfocus();
            final name = b.localizedName(lang);
            context.push(
              '/products?brandId=${b.id}&title=${Uri.encodeComponent(name)}',
            );
          },
        );
      case 'results':
        final rq = _results.query;
        final fresh = _suggest.dataQuery == rq ? _suggest.data : null;
        final merged = mergeSuggestions(
          local: localSuggestEntries(rq, cats, brands, lang),
          remote: fresh,
          roots: cats,
          brands: brands,
          lang: lang,
        );
        final related = [
          ...merged.categories,
          ...merged.brands,
        ].take(6).toList();
        final err = _results.error;
        return SearchResultsView(
          s: s,
          query: rq,
          items: _results.items,
          total: _results.total,
          loading: _results.loading,
          loadingMore: _results.loadingMore,
          hasNext: _results.hasNext,
          error: err == null ? null : friendlyError(err, lang: lang),
          moreError: _results.moreError == null
              ? null
              : friendlyError(_results.moreError, lang: lang),
          synonyms: synonymHints(rq),
          related: related,
          correction: _emptyCorrectionFor == rq ? _emptyCorrection : null,
          onRetry: () => _submit(rq),
          onLoadMore: _results.loadMore,
          onFilter: () => context.push(searchListingLocation(rq)),
          onTerm: _runTerm,
          onEntry: _openEntry,
          onBrowseCategories: _browseCategories,
        );
      default:
        final data = _suggest.data;
        final dq = _suggest.dataQuery;
        final fresh = dq == q ? data : null;
        // منتجات الطلب السابق تبقى ظاهرة أثناء متابعة الكتابة — بلا وميض.
        final related = dq.isNotEmpty && (q.startsWith(dq) || dq.startsWith(q));
        return SearchSuggestionsPanel(
          s: s,
          query: q,
          merged: mergeSuggestions(
            local: localSuggestEntries(q, cats, brands, lang),
            remote: fresh,
            roots: cats,
            brands: brands,
            lang: lang,
          ),
          products:
              fresh?.products ??
              (related ? data?.products ?? const [] : const []),
          correction: shouldOfferCorrection(q, fresh?.corrected)
              ? fresh!.corrected
              : null,
          loading: _suggest.loading,
          failed: _suggest.failed,
          onSeeAll: () => _submit(q),
          onCorrection: _runTerm,
          onEntry: _openEntry,
          onProduct: _openProduct,
        );
    }
  }
}
