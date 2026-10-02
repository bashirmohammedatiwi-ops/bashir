import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/barcode_util.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/recently_viewed_provider.dart';
import '../home/home_category_filter.dart';
import '../worlds/world_theme.dart';
import 'recent_searches_provider.dart';
import 'smart_query.dart';
import 'widgets/search_product_tile.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  Timer? _debounce;
  List<Product> _results = [];
  int _total = 0;
  bool _loading = false;
  bool _searched = false;
  String? _error;
  String _activeQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final q = GoRouterState.of(context).uri.queryParameters['q']?.trim();
      if (q != null && q.isNotEmpty) {
        _controller.text = q;
        _search(q);
      }
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    final q = value.trim();
    if (q.isEmpty) {
      setState(() {
        _results = [];
        _total = 0;
        _searched = false;
        _activeQuery = '';
        _error = null;
      });
      return;
    }
    if (q.length < 2) {
      setState(() {
        _searched = false;
        _results = [];
        _total = 0;
      });
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 320), () => _search(q));
  }

  Future<void> _search(String q) async {
    if (q.trim().length < 2) return;
    setState(() {
      _loading = true;
      _searched = true;
      _error = null;
      _activeQuery = q.trim();
    });
    try {
      if (isBarcodeSearchQuery(q)) {
        final hit = await ref.read(apiServiceProvider).lookupProductByBarcode(q);
        if (!mounted) return;
        if (hit != null) {
          HapticFeedback.mediumImpact();
          context.push('/product/${hit.productSlug}');
          return;
        }
      }

      final result = await ref.read(apiServiceProvider).searchProducts(q, limit: 48);
      if (!mounted || _controller.text.trim() != q.trim()) return;
      setState(() {
        _results = result.items;
        _total = result.total > 0 ? result.total : result.items.length;
      });
      if (q.length >= 2) {
        ref.read(recentSearchesProvider.notifier).add(q);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<_SuggestItem> _localSuggestions(String q, String lang) {
    if (normalizeQuery(q).length < 2) return const [];
    final scored = <_SuggestItem>[];
    final cats = ref.read(categoriesProvider).valueOrNull ?? const <Category>[];
    final brands = ref.read(brandsProvider).valueOrNull ?? const <Brand>[];

    void addCategory(Category node, String path, String route) {
      final fields = [node.name, node.nameAr, node.nameEn, node.slug];
      if (!textMatchesQuery(q, fields)) return;
      final title = node.localizedName(lang);
      scored.add(_SuggestItem.category(title, path, matchScore(q, fields), () {
        context.push(route);
      }));
    }

    for (final main in storefrontParentCategories(cats)) {
      final mainName = main.localizedName(lang);
      addCategory(main, mainName, '/products?categoryId=${main.id}&title=${Uri.encodeComponent(mainName)}');
      for (final sub in main.children) {
        final subName = sub.localizedName(lang);
        addCategory(
          sub,
          '$mainName › $subName',
          '/products?subcategoryId=${sub.id}&title=${Uri.encodeComponent(subName)}',
        );
      }
    }

    for (final brand in brands) {
      final fields = [brand.name, brand.nameAr, brand.nameEn, brand.slug];
      if (!textMatchesQuery(q, fields)) continue;
      final title = brand.localizedName(lang);
      scored.add(_SuggestItem.brand(title, matchScore(q, fields), () {
        context.push('/products?brandId=${brand.id}&title=${Uri.encodeComponent(title)}');
      }));
    }

    scored.sort((a, b) => b.score.compareTo(a.score));
    return scored.take(6).toList();
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final t = context.worldTheme;
    return Scaffold(
      backgroundColor: t.canvas,
      appBar: AppBar(
        titleSpacing: 0,
        elevation: 0,
        backgroundColor: t.surface,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              context.push('/scan');
            },
            icon: Icon(Icons.barcode_reader, color: t.ink),
            tooltip: s.scan,
          ),
          const SizedBox(width: 4),
        ],
        title: Padding(
          padding: const EdgeInsets.only(left: AppSpacing.md),
          child: TextField(
            controller: _controller,
            autofocus: true,
            textInputAction: TextInputAction.search,
            style: TextStyle(color: t.ink, fontWeight: FontWeight.w500),
            decoration: InputDecoration(
              hintText: s.searchHint,
              prefixIcon: Icon(Icons.search_rounded, color: t.accent),
              suffixIcon: _controller.text.isNotEmpty
                  ? IconButton(
                      icon: Icon(Icons.close_rounded, color: t.inkMuted),
                      onPressed: () {
                        _controller.clear();
                        _onChanged('');
                        setState(() {});
                      },
                    )
                  : null,
              filled: true,
              fillColor: t.accentLight,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppRadius.pill),
                borderSide: BorderSide(color: t.hairline.withValues(alpha: 0.8)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppRadius.pill),
                borderSide: BorderSide(color: t.hairline.withValues(alpha: 0.8)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppRadius.pill),
                borderSide: BorderSide(color: t.accent, width: 1.5),
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
            ),
            onChanged: (v) {
              setState(() {});
              _onChanged(v);
            },
            onSubmitted: (v) => _search(v.trim()),
          ),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageCodeProvider);
    final q = _controller.text.trim();
    final suggestions = q.length >= 2 ? _localSuggestions(q, lang) : const <_SuggestItem>[];

    if (!_searched || q.length < 2) {
      return _buildIdleState(s, lang, suggestions, q);
    }

    if (_loading) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Text(s.searchProductsSection, style: AppTypography.sectionTitle.copyWith(fontSize: 15)),
          ),
          const Expanded(child: _SearchResultsSkeleton()),
        ],
      );
    }

    if (_error != null) {
      return ErrorView(message: _error!, onRetry: () => _search(_controller.text.trim()));
    }

    final hints = synonymHints(_activeQuery);
    return CustomScrollView(
      slivers: [
        if (hints.isNotEmpty)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: Text(
                '${s.alsoMatches}: ${hints.join(' · ')}',
                style: AppTypography.caption.copyWith(
                  color: context.worldTheme.accent,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    s.searchProductsSection,
                    style: AppTypography.sectionTitle.copyWith(fontSize: 16),
                  ),
                ),
                if (_results.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: context.worldTheme.accentLight,
                      borderRadius: BorderRadius.circular(99),
                    ),
                    child: Text(
                      s.searchProductsFound(_total),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: context.worldTheme.accentDark,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        if (_results.isEmpty)
          SliverFillRemaining(
            hasScrollBody: false,
            child: EmptyState(icon: Icons.search_off_rounded, title: s.noSearchResults),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            sliver: SliverList.separated(
              itemCount: _results.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => SearchProductTile(product: _results[i], lang: lang),
            ),
          ),
        if (suggestions.isNotEmpty) ...[
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(s.searchBrowseAlso, style: AppTypography.sectionTitle.copyWith(fontSize: 14)),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, i) => _SuggestionTile(item: suggestions[i]),
                childCount: suggestions.length,
              ),
            ),
          ),
        ] else
          const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
      ],
    );
  }

  Widget _buildIdleState(AppStrings s, String lang, List<_SuggestItem> suggestions, String q) {
    final recentProducts = ref.watch(recentlyViewedProvider);
    final recentQueries = ref.watch(recentSearchesProvider);
    final cats = ref.watch(categoriesProvider).valueOrNull ?? const <Category>[];
    final ideas = storefrontParentCategories(cats).take(8).toList();
    final t = context.worldTheme;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.md),
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: t.accentLight.withValues(alpha: 0.55),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: t.accentSoft),
          ),
          child: Row(
            children: [
              Icon(Icons.auto_awesome_rounded, color: t.accent, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  s.searchInStoreHint,
                  style: TextStyle(fontSize: 12.5, height: 1.35, fontWeight: FontWeight.w600, color: t.inkSoft),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (q.length == 1)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              lang == 'ar' ? 'اكتبي حرفين على الأقل…' : 'Type at least 2 characters…',
              style: TextStyle(color: t.inkMuted, fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
        if (suggestions.isNotEmpty) ...[
          Text(s.searchBrowseAlso, style: AppTypography.sectionTitle.copyWith(fontSize: 15)),
          const SizedBox(height: 8),
          ...suggestions.map((item) => _SuggestionTile(item: item)),
          const SizedBox(height: 16),
        ],
        if (recentQueries.isNotEmpty) ...[
          Row(
            children: [
              Expanded(child: Text(s.recentSearches, style: AppTypography.sectionTitle.copyWith(fontSize: 15))),
              TextButton(onPressed: () => ref.read(recentSearchesProvider.notifier).clear(), child: Text(s.clear)),
            ],
          ),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: recentQueries.map((query) {
              return InputChip(
                label: Text(query, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                onPressed: () {
                  _controller.text = query;
                  _controller.selection = TextSelection.collapsed(offset: query.length);
                  _search(query);
                },
                onDeleted: () => ref.read(recentSearchesProvider.notifier).remove(query),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
        ],
        if (ideas.isNotEmpty) ...[
          Text(s.quickIdeas, style: AppTypography.sectionTitle.copyWith(fontSize: 15)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: ideas.map((cat) {
              final title = cat.localizedName(lang);
              return ActionChip(
                avatar: Icon(Icons.grid_view_rounded, size: 16, color: t.accent),
                label: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                onPressed: () => context.push('/products?categoryId=${cat.id}&title=${Uri.encodeComponent(title)}'),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
        ],
        if (recentProducts.isEmpty && recentQueries.isEmpty && ideas.isEmpty)
          EmptyState(
            icon: Icons.search_rounded,
            title: s.searchInStore,
            subtitle: s.searchInStoreHint,
          )
        else if (recentProducts.isNotEmpty) ...[
          Row(
            children: [
              Expanded(child: Text(s.recentlyViewed, style: AppTypography.sectionTitle.copyWith(fontSize: 16))),
              TextButton(
                onPressed: () => ref.read(recentlyViewedProvider.notifier).clear(),
                child: Text(s.clear),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          ProductGrid(products: recentProducts),
        ],
      ],
    );
  }
}

class _SearchResultsSkeleton extends StatelessWidget {
  const _SearchResultsSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 8,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, __) => const ShimmerBox(height: 78, radius: 16),
    );
  }
}

class _SuggestItem {
  final String title;
  final String? subtitle;
  final bool isBrand;
  final int score;
  final VoidCallback onTap;

  const _SuggestItem._(this.title, this.subtitle, this.isBrand, this.score, this.onTap);

  factory _SuggestItem.category(String title, String path, int score, VoidCallback onTap) =>
      _SuggestItem._(title, path, false, score, onTap);

  factory _SuggestItem.brand(String title, int score, VoidCallback onTap) =>
      _SuggestItem._(title, null, true, score, onTap);
}

class _SuggestionTile extends StatelessWidget {
  final _SuggestItem item;

  const _SuggestionTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return ListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              t.accent.withValues(alpha: 0.14),
              t.accentSoft,
            ],
          ),
          shape: BoxShape.circle,
          border: Border.all(color: t.accentSoft),
        ),
        child: Icon(
          item.isBrand ? Icons.storefront_outlined : Icons.grid_view_rounded,
          size: 18,
          color: t.accentDark,
        ),
      ),
      title: Text(item.title, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: t.ink)),
      subtitle: item.subtitle == null
          ? null
          : Text(item.subtitle!, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.caption),
      trailing: Icon(Icons.chevron_right_rounded, size: 18, color: t.inkMuted),
      onTap: () {
        HapticFeedback.selectionClick();
        item.onTap();
      },
    );
  }
}
