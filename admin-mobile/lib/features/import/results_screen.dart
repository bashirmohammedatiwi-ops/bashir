import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/catalog.dart';
import '../../providers/catalog_stores_provider.dart';
import '../../repositories/catalog_repository.dart';

class ResultsScreen extends ConsumerStatefulWidget {
  const ResultsScreen({super.key, required this.barcode});

  final String barcode;

  @override
  ConsumerState<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends ConsumerState<ResultsScreen> {
  List<CatalogImportOption> _options = [];
  List<StoreSearchStat> _stats = [];
  final Set<String> _storeFilter = {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _search();
  }

  List<String> _storeIds(List<CatalogStore> stores) {
    if (_storeFilter.isEmpty) return stores.map((s) => s.id).toList();
    return _storeFilter.toList();
  }

  Future<void> _search() async {
    setState(() {
      _loading = true;
      _error = null;
      _options = [];
      _stats = [];
    });
    try {
      final stores = await ref.read(catalogRepositoryProvider).fetchCatalogStores();
      final storeIds = _storeIds(stores);
      final result = await ref.read(catalogRepositoryProvider).searchByBarcodeDetailed(
            widget.barcode,
            stores: storeIds,
            onPartial: (partial) {
              if (mounted) {
                setState(() {
                  _options = partial.options;
                  _stats = _mergeStats(partial.stats, stores);
                });
              }
            },
          );
      if (mounted) {
        setState(() {
          _options = result.options;
          _stats = _mergeStats(result.stats, stores);
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = 'فشل البحث — تحقق من الاتصال');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<StoreSearchStat> _mergeStats(List<StoreSearchStat> stats, List<CatalogStore> stores) {
    final labelById = {for (final s in stores) s.id: s.label};
    return stats
        .map((s) => StoreSearchStat(
              storeId: s.storeId,
              storeLabel: labelById[s.storeId] ?? s.storeLabel,
              count: s.count,
              error: s.error,
              done: s.done,
            ))
        .toList();
  }

  void _openOption(CatalogImportOption opt) {
    final params = [
      'barcode=${Uri.encodeComponent(widget.barcode)}',
      'shades=${opt.shadeCount}',
      if (opt.storeLabel.isNotEmpty) 'label=${Uri.encodeComponent(opt.storeLabel)}',
    ].join('&');
    context.push('/import/${Uri.encodeComponent(opt.store)}/${Uri.encodeComponent(opt.sourceId)}?$params');
  }

  void _toggleStoreFilter(String id) {
    setState(() {
      if (_storeFilter.contains(id)) {
        _storeFilter.remove(id);
      } else {
        _storeFilter.add(id);
      }
    });
    _search();
  }

  @override
  Widget build(BuildContext context) {
    final storesAsync = ref.watch(catalogStoresProvider);
    final doneCount = _stats.where((s) => s.done).length;
    final totalStores = storesAsync.maybeWhen(data: (s) => _storeFilter.isEmpty ? s.length : _storeFilter.length, orElse: () => 0);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          children: [
            const Text('نتائج البحث', style: TextStyle(fontSize: 16)),
            Text(widget.barcode, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal), textDirection: TextDirection.ltr),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.text_fields),
            tooltip: 'بحث بالاسم',
            onPressed: () => context.push('/search?q=${Uri.encodeComponent(widget.barcode)}'),
          ),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loading ? null : _search),
        ],
      ),
      body: Column(
        children: [
          storesAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (stores) => SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                children: [
                  FilterChip(
                    label: const Text('الكل'),
                    selected: _storeFilter.isEmpty,
                    onSelected: (_) {
                      setState(() => _storeFilter.clear());
                      _search();
                    },
                  ),
                  const SizedBox(width: 6),
                  for (final s in stores)
                    Padding(
                      padding: const EdgeInsets.only(left: 6),
                      child: FilterChip(
                        label: Text(s.label, style: const TextStyle(fontSize: 12)),
                        selected: _storeFilter.contains(s.id),
                        onSelected: (_) => _toggleStoreFilter(s.id),
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (_stats.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Wrap(
                spacing: 6,
                runSpacing: 4,
                children: _stats.map((s) {
                  final color = s.error != null
                      ? Colors.red.shade100
                      : (s.count > 0 ? Colors.green.shade100 : Colors.grey.shade200);
                  final text = s.error != null
                      ? '${s.storeLabel}: خطأ'
                      : '${s.storeLabel}: ${s.count}';
                  return Chip(
                    label: Text(text, style: const TextStyle(fontSize: 11)),
                    backgroundColor: color,
                    visualDensity: VisualDensity.compact,
                    padding: EdgeInsets.zero,
                  );
                }).toList(),
              ),
            ),
          Expanded(child: _buildResults(doneCount, totalStores)),
        ],
      ),
    );
  }

  Widget _buildResults(int doneCount, int totalStores) {
    if (_loading && _options.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            const Text('جاري البحث في المتاجر...'),
            const SizedBox(height: 8),
            if (totalStores > 0)
              Text('$doneCount / $totalStores', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
          ],
        ),
      );
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.wifi_off, size: 48, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            Text(_error!),
            const SizedBox(height: 16),
            FilledButton(onPressed: _search, child: const Text('إعادة المحاولة')),
          ],
        ),
      );
    }
    if (_options.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            const Text('لم يُعثر على منتج بهذا الباركود'),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () => context.push('/search'),
              icon: const Icon(Icons.text_fields),
              label: const Text('بحث بالاسم'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => context.pop(),
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('مسح مرة أخرى'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _search,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: LinearProgressIndicator(),
            ),
          Text('${_options.length} نتيجة', style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          ..._options.map((opt) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _ResultTile(option: opt, onTap: () => _openOption(opt)),
              )),
        ],
      ),
    );
  }
}

class _ResultTile extends StatelessWidget {
  const _ResultTile({required this.option, required this.onTap});

  final CatalogImportOption option;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 72,
                  height: 72,
                  child: option.thumb != null && option.thumb!.isNotEmpty
                      ? CachedNetworkImage(imageUrl: option.thumb!, fit: BoxFit.cover, errorWidget: (_, __, ___) => _placeholder())
                      : _placeholder(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(option.nameAr, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
                    if (option.brandAr != null && option.brandAr!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(option.brandAr!, style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
                      ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        _chip(option.storeLabel, Theme.of(context).colorScheme.primaryContainer),
                        if (option.price != null && option.price!.isNotEmpty)
                          _chip(option.price!, Colors.green.shade50, textColor: Colors.green.shade800),
                        if (option.shadeCount > 0)
                          _chip('${option.shadeCount} تدرج', Colors.purple.shade50, textColor: Colors.purple.shade800),
                        if (option.shadeName != null && option.shadeName!.isNotEmpty)
                          _chip(option.shadeName!, Colors.orange.shade50, textColor: Colors.orange.shade900),
                      ],
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_left, color: Theme.of(context).colorScheme.primary),
            ],
          ),
        ),
      ),
    );
  }

  Widget _chip(String text, Color bg, {Color? textColor}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      child: Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textColor)),
    );
  }

  Widget _placeholder() => Container(color: Colors.grey.shade200, child: const Icon(Icons.image, color: Colors.grey));
}
