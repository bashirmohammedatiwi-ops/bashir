import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/providers/prefs_provider.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/product_card.dart';
import '../../../data/models/product_model.dart';
import '../../products/providers/filter_provider.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  List<String> _recent = [];
  String _query = '';

  @override
  void initState() {
    super.initState();
    _loadRecent();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      FocusScope.of(context).requestFocus(FocusNode());
    });
  }

  Future<void> _loadRecent() async {
    final prefs = ref.read(prefsProvider);
    setState(() => _recent = prefs.recentSearches);
  }

  Future<void> _saveSearch(String q) async {
    if (q.isEmpty) return;
    final prefs = ref.read(prefsProvider);
    final updated = [q, ..._recent.where((r) => r != q)].take(10).toList();
    await prefs.setRecentSearches(updated);
    setState(() => _recent = updated);
    ref.read(filterProvider.notifier).update(FilterState(searchQuery: q));
    setState(() => _query = q);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<List<ProductModel>> resultsAsync = _query.isEmpty
        ? const AsyncValue.data([])
        : ref.watch(filteredProductsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('البحث')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
            child: Container(
              height: 46,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: TextField(
                controller: _controller,
                autofocus: true,
                textInputAction: TextInputAction.search,
                onSubmitted: _saveSearch,
                onChanged: (v) {
                  ref.read(filterProvider.notifier).update(FilterState(searchQuery: v));
                  setState(() => _query = v);
                },
                decoration: InputDecoration(
                  hintText: AppStrings.searchHint,
                  hintStyle: AppTextStyles.caption(
                    color: AppColors.textMuted,
                    size: 12.5,
                  ),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  prefixIcon: const Icon(
                    Icons.search_rounded,
                    size: 19,
                    color: AppColors.textMuted,
                  ),
                  suffixIcon: _query.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.close_rounded, size: 18),
                          onPressed: () {
                            _controller.clear();
                            ref.read(filterProvider.notifier).update(
                                  const FilterState(searchQuery: ''),
                                );
                            setState(() => _query = '');
                          },
                        )
                      : null,
                ),
              ),
            ),
          ),
          Expanded(
            child: resultsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Center(child: Text('تعذر البحث')),
              data: (results) {
                final products = results;
                if (_query.isEmpty) {
                  return _SearchDiscovery(
                    recent: _recent,
                    onClearRecent: () async {
                      final prefs = ref.read(prefsProvider);
                      await prefs.setRecentSearches([]);
                      setState(() => _recent = []);
                    },
                    onPickRecent: (q) {
                      _controller.text = q;
                      _saveSearch(q);
                    },
                  );
                }
                if (products.isEmpty) {
                  return const EmptyState(
                    lottieAsset: 'assets/lottie/empty_search.json',
                    title: 'جربي كلمة أخرى',
                  );
                }
                return CustomScrollView(
                  slivers: [
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                        child: Row(
                          children: [
                            Text(
                              'النتائج',
                              style: AppTextStyles.title(size: 14).copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '(${products.length})',
                              style: AppTextStyles.caption(
                                color: AppColors.gold,
                                size: 11.5,
                              ).copyWith(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
                      sliver: SliverGrid(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.62,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 6,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            return ProductCard(
                              product: products[index],
                              index: index,
                            );
                          },
                          childCount: products.length,
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _SearchDiscovery extends StatelessWidget {
  const _SearchDiscovery({
    required this.recent,
    required this.onClearRecent,
    required this.onPickRecent,
  });

  final List<String> recent;
  final VoidCallback onClearRecent;
  final ValueChanged<String> onPickRecent;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
      children: [
        if (recent.isNotEmpty) ...[
          Row(
            children: [
              Text(
                'عمليات البحث الأخيرة',
                style: AppTextStyles.title(size: 14).copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Spacer(),
              TextButton(onPressed: onClearRecent, child: const Text('مسح')),
            ],
          ),
          ...recent.map(
            (r) => ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: const Icon(
                Icons.history_rounded,
                size: 18,
                color: AppColors.textMuted,
              ),
              title: Text(r, style: AppTextStyles.body(size: 13)),
              onTap: () => onPickRecent(r),
            ),
          ),
          const SizedBox(height: 12),
        ],
        Text(
          'الأكثر بحثاً',
          style: AppTextStyles.title(size: 14).copyWith(
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: AppStrings.popularSearches.map((chip) {
            return ActionChip(
              label: Text(chip),
              onPressed: () => onPickRecent(chip),
            );
          }).toList(),
        ),
      ],
    );
  }
}
