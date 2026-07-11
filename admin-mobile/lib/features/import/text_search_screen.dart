import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/catalog.dart';
import '../../providers/catalog_stores_provider.dart';
import '../../repositories/catalog_repository.dart';

class TextSearchScreen extends ConsumerStatefulWidget {
  const TextSearchScreen({super.key, this.initialQuery = ''});

  final String initialQuery;

  @override
  ConsumerState<TextSearchScreen> createState() => _TextSearchScreenState();
}

class _TextSearchScreenState extends ConsumerState<TextSearchScreen> {
  late final TextEditingController _controller;
  final Set<String> _activeStores = {};
  List<CatalogImportOption> _options = [];
  bool _loading = false;
  String? _error;
  bool _searched = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialQuery);
    if (widget.initialQuery.trim().isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _search());
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final q = _controller.text.trim();
    if (q.length < 2) {
      setState(() => _error = 'أدخل حرفين على الأقل');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
      _options = [];
      _searched = true;
    });

    try {
      final stores = _activeStores.isEmpty ? null : _activeStores.toList();
      final results = await ref.read(catalogRepositoryProvider).searchByText(
            q,
            stores: stores,
            onPartial: (partial) {
              if (mounted) setState(() => _options = partial);
            },
          );
      if (mounted) setState(() => _options = results);
    } catch (_) {
      if (mounted) setState(() => _error = 'فشل البحث — تحقق من الاتصال');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openOption(CatalogImportOption opt) {
    final params = [
      if (opt.barcode != null && opt.barcode!.isNotEmpty) 'barcode=${Uri.encodeComponent(opt.barcode!)}',
      'shades=${opt.shadeCount}',
      if (opt.storeLabel.isNotEmpty) 'label=${Uri.encodeComponent(opt.storeLabel)}',
    ].join('&');
    final q = params.isNotEmpty ? '?$params' : '';
    context.push('/import/${Uri.encodeComponent(opt.store)}/${Uri.encodeComponent(opt.sourceId)}$q');
  }

  void _toggleStore(String id) {
    setState(() {
      if (_activeStores.contains(id)) {
        _activeStores.remove(id);
      } else {
        _activeStores.add(id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final storesAsync = ref.watch(catalogStoresProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('بحث بالاسم')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (_) => _search(),
                    decoration: InputDecoration(
                      hintText: 'اسم المنتج، البراند، أو الباركود',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _controller.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _controller.clear();
                                setState(() {
                                  _options = [];
                                  _searched = false;
                                  _error = null;
                                });
                              },
                            )
                          : null,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(onPressed: _loading ? null : _search, child: const Text('بحث')),
              ],
            ),
          ),
          storesAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (stores) => SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  FilterChip(
                    label: const Text('الكل'),
                    selected: _activeStores.isEmpty,
                    onSelected: (_) => setState(() => _activeStores.clear()),
                  ),
                  const SizedBox(width: 6),
                  for (final s in stores)
                    Padding(
                      padding: const EdgeInsets.only(left: 6),
                      child: FilterChip(
                        label: Text(s.label, style: const TextStyle(fontSize: 12)),
                        selected: _activeStores.contains(s.id),
                        onSelected: (_) => _toggleStore(s.id),
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading && _options.isEmpty) {
      return const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        CircularProgressIndicator(),
        SizedBox(height: 16),
        Text('جاري البحث في المتاجر...'),
      ]));
    }
    if (!_searched) {
      return Center(
        child: Text('ابحث عن منتج بالاسم أو الباركود', style: TextStyle(color: Colors.grey.shade600)),
      );
    }
    if (_options.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off, size: 56, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            const Text('لا توجد نتائج'),
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
          for (final opt in _options)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _SearchResultTile(option: opt, onTap: () => _openOption(opt)),
            ),
        ],
      ),
    );
  }
}

class _SearchResultTile extends StatelessWidget {
  const _SearchResultTile({required this.option, required this.onTap});

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
                    if (option.nameEn != null && option.nameEn!.isNotEmpty)
                      Text(option.nameEn!, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        _chip(option.storeLabel, Theme.of(context).colorScheme.primaryContainer),
                        if (option.barcode != null && option.barcode!.isNotEmpty)
                          _chip(option.barcode!, Colors.blue.shade50, textColor: Colors.blue.shade900),
                        if (option.shadeCount > 0)
                          _chip('${option.shadeCount} تدرج', Colors.purple.shade50, textColor: Colors.purple.shade800),
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
