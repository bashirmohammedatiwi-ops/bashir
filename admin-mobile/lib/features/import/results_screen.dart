import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../models/catalog.dart';
import '../../repositories/catalog_repository.dart';

class ResultsScreen extends ConsumerStatefulWidget {
  const ResultsScreen({super.key, required this.barcode});

  final String barcode;

  @override
  ConsumerState<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends ConsumerState<ResultsScreen> {
  List<CatalogImportOption> _options = [];
  bool _loading = true;
  String? _error;
  int _storeDone = 0;

  @override
  void initState() {
    super.initState();
    _search();
  }

  Future<void> _search() async {
    setState(() {
      _loading = true;
      _error = null;
      _options = [];
      _storeDone = 0;
    });
    try {
      final repo = ref.read(catalogRepositoryProvider);
      final results = await repo.searchByBarcode(
        widget.barcode,
        onPartial: (partial) {
          if (mounted) {
            setState(() {
              _options = partial;
              _storeDone = (_storeDone + 1).clamp(0, AppConfig.catalogStores.length);
            });
          }
        },
      );
      if (mounted) setState(() => _options = results);
    } catch (e) {
      if (mounted) setState(() => _error = 'فشل البحث — تحقق من الاتصال');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openOption(CatalogImportOption opt) {
    final params = [
      'barcode=${Uri.encodeComponent(widget.barcode)}',
      'shades=${opt.shadeCount}',
      if (opt.storeLabel.isNotEmpty) 'label=${Uri.encodeComponent(opt.storeLabel)}',
    ].join('&');
    context.push('/import/${Uri.encodeComponent(opt.store)}/${Uri.encodeComponent(opt.sourceId)}?$params');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          children: [
            const Text('نتائج البحث', style: TextStyle(fontSize: 16)),
            Text(widget.barcode, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal), textDirection: TextDirection.ltr),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loading ? null : _search),
        ],
      ),
      body: _loading && _options.isEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  const Text('جاري البحث في المتاجر...'),
                  const SizedBox(height: 8),
                  Text('${AppConfig.catalogStores.length} متجر', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                ],
              ),
            )
          : _error != null
              ? Center(
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
                )
              : _options.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.search_off, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          const Text('لم يُعثر على منتج بهذا الباركود'),
                          const SizedBox(height: 16),
                          OutlinedButton.icon(
                            onPressed: () => context.pop(),
                            icon: const Icon(Icons.qr_code_scanner),
                            label: const Text('مسح مرة أخرى'),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _search,
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          if (_loading)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: LinearProgressIndicator(
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          Text('${_options.length} نتيجة', style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 12),
                          ..._options.map((opt) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: _ResultTile(option: opt, onTap: () => _openOption(opt)),
                              )),
                        ],
                      ),
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
                      ? CachedNetworkImage(imageUrl: option.thumb!, fit: BoxFit.cover, errorWidget: (_, e, s) => _placeholder())
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
                          _chip('${option.price} د.ع', Colors.green.shade50, textColor: Colors.green.shade800),
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
