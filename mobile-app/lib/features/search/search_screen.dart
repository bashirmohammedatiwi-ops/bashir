import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_motion.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../catalog/recently_viewed_provider.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  static const _recentKey = 'recent_searches_v1';
  final _controller = TextEditingController();
  Timer? _debounce;
  List<Product> _results = [];
  bool _loading = false;
  bool _searched = false;
  String? _error;
  List<String> _recent = [];

  @override
  void initState() {
    super.initState();
    _loadRecent();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final q = GoRouterState.of(context).uri.queryParameters['q']?.trim();
      if (q != null && q.isNotEmpty) {
        _controller.text = q;
        _search(q);
      }
    });
  }

  Future<void> _loadRecent() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_recentKey);
    if (raw == null || !mounted) return;
    try {
      setState(() => _recent = (jsonDecode(raw) as List).map((e) => '$e').take(6).toList());
    } catch (_) {}
  }

  Future<void> _rememberSearch(String q) async {
    final prefs = await SharedPreferences.getInstance();
    final next = [q, ..._recent.where((r) => r != q)].take(6).toList();
    setState(() => _recent = next);
    await prefs.setString(_recentKey, jsonEncode(next));
  }

  Future<void> _clearRecent() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() => _recent = []);
    await prefs.remove(_recentKey);
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
        _searched = false;
      });
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 450), () => _search(q));
  }

  Future<void> _search(String q) async {
    setState(() {
      _loading = true;
      _searched = true;
      _error = null;
    });
    _rememberSearch(q);
    try {
      final result = await ref.read(apiServiceProvider).getProducts(search: q, limit: 30);
      if (!mounted) return;
      setState(() => _results = result.items);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  static const _trendingAr = [
    'عطر نسائي',
    'روتين بشرة',
    'شامبو',
    'كريم شمس',
    'ماسكارا',
    'أحمر شفاه',
  ];
  static const _trendingEn = [
    'perfume',
    'skincare',
    'shampoo',
    'sunscreen',
    'mascara',
    'lipstick',
  ];

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    return Scaffold(
      backgroundColor: AppColors.scaffold,
      appBar: AppBar(
        titleSpacing: 0,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              context.push('/scan');
            },
            icon: const Icon(Icons.barcode_reader),
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
            decoration: InputDecoration(
              hintText: s.searchHint,
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: _controller.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () {
                        _controller.clear();
                        _onChanged('');
                        setState(() {});
                      },
                    )
                  : null,
              filled: true,
              fillColor: AppColors.scaffold,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppRadius.pill),
                borderSide: BorderSide.none,
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
      body: AnimatedSwitcher(
        duration: AppMotion.fadeThrough,
        child: KeyedSubtree(
          key: ValueKey('search-body-${_loading ? 'loading' : _error != null ? 'error' : !_searched ? 'idle${ref.watch(recentlyViewedProvider).length}' : _results.isEmpty ? 'empty' : 'results-${_results.length}'}'),
          child: _buildBody(),
        ),
      ),
    );
  }

  Widget _buildBody() {
    final s = ref.s;
    if (_loading) return const ProductGridSkeleton(count: 6);
    if (_error != null) return ErrorView(message: _error!, onRetry: () => _search(_controller.text.trim()));
    if (!_searched) {
      final recent = ref.watch(recentlyViewedProvider);
      if (recent.isEmpty) {
        return EmptyState(
          icon: Icons.search_rounded,
          title: s.searchInStore,
          subtitle: s.searchInStoreHint,
        );
      }
      return ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          if (_recent.isNotEmpty) ...[
            Row(
              children: [
                const Icon(Icons.history_rounded, size: 15, color: AppColors.textMuted),
                const SizedBox(width: 6),
                Expanded(child: Text(s.recentSearches, style: AppTypography.sectionTitle.copyWith(fontSize: 15))),
                TextButton(
                  onPressed: _clearRecent,
                  child: Text(s.clear),
                ),
              ],
            ),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final q in _recent)
                  InputChip(
                    label: Text(q, style: const TextStyle(fontSize: 12.5)),
                    backgroundColor: AppColors.primaryLight,
                    side: BorderSide.none,
                    visualDensity: VisualDensity.compact,
                    onPressed: () {
                      HapticFeedback.selectionClick();
                      _controller.text = q;
                      _search(q);
                    },
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          _TrendingChips(
            labels: s.isAr ? _trendingAr : _trendingEn,
            sectionTitle: s.trendingSearches,
            onPick: (label) {
              HapticFeedback.selectionClick();
              _controller.text = label;
              _search(label);
            },
          ),
          const SizedBox(height: AppSpacing.md),
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
          ProductGrid(products: recent),
        ],
      );
    }
    if (_results.isEmpty) {
      return EmptyState(
        icon: Icons.search_off_rounded,
        title: s.noSearchResults,
        subtitle: s.noSearchResultsHint,
        actionLabel: s.scan,
        onAction: () => context.push('/scan'),
      );
    }
    return ProductGrid(products: _results);
  }
}


class _TrendingChips extends StatelessWidget {
  final List<String> labels;
  final String sectionTitle;
  final ValueChanged<String> onPick;

  const _TrendingChips({required this.labels, required this.sectionTitle, required this.onPick});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.trending_up_rounded, size: 16, color: AppColors.primary),
            const SizedBox(width: 6),
            Text(sectionTitle, style: AppTypography.sectionTitle.copyWith(fontSize: 16)),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final label in labels)
              ActionChip(
                label: Text(label, style: const TextStyle(fontSize: 12.5)),
                backgroundColor: AppColors.surface,
                side: const BorderSide(color: AppColors.border),
                onPressed: () => onPick(label),
              ),
          ],
        ),
      ],
    );
  }
}
