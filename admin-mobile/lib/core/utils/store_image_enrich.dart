import '../../models/ai_autofill.dart';
import '../../repositories/catalog_repository.dart';

/// Merges catalog-hub store thumbnails into AI image search results (higher quality retail photos).
Future<List<AiAutofillImage>> enrichImagesFromStores({
  required CatalogRepository catalog,
  required String barcode,
  String? nameHint,
  required List<AiAutofillImage> base,
  List<String>? stores,
}) async {
  final seen = <String>{};
  for (final img in base) {
    final k = img.url.trim().toLowerCase();
    if (k.isNotEmpty) seen.add(k);
  }

  final out = <AiAutofillImage>[...base];

  void push(String url, String title, String source) {
    final trimmed = url.trim();
    if (!trimmed.startsWith('http')) return;
    final key = trimmed.toLowerCase();
    if (seen.contains(key)) return;
    seen.add(key);
    out.insert(
      0,
      AiAutofillImage(
        url: trimmed,
        thumbUrl: trimmed,
        title: title.trim().isNotEmpty ? title.trim() : source,
        source: source,
      ),
    );
  }

  final storeIds = stores ??
      const [
        'faces',
        'miswag',
        'miraaya',
        'beautyway',
        'niceone',
        'najdalatheyah',
        'alkhabeer',
      ];

  try {
    final hits = await catalog.searchByBarcode(barcode, stores: storeIds);
    for (final opt in hits.take(18)) {
      final label = opt.shadeName?.trim().isNotEmpty == true
          ? '${opt.storeLabel} · ${opt.nameEn ?? opt.nameAr} · ${opt.shadeName}'
          : '${opt.storeLabel} · ${opt.nameEn ?? opt.nameAr}';
      if (opt.thumb != null && opt.thumb!.trim().isNotEmpty) {
        push(opt.thumb!.trim(), label, opt.store);
      }
    }
  } catch (_) {}

  final hint = (nameHint ?? '').trim();
  final queries = <String>{};
  if (hint.length >= 2) queries.add(hint);
  if (hint.length >= 4) {
    final parts = hint.split(RegExp(r'\s+-\s+|\s+\|\s+'));
    for (final p in parts) {
      final t = p.trim();
      if (t.length >= 4) queries.add(t);
    }
  }

  for (final q in queries) {
    try {
      final textHits = await catalog.searchByText(q, stores: storeIds);
      for (final opt in textHits.take(10)) {
        final label = '${opt.storeLabel} · ${opt.nameEn ?? opt.nameAr}';
        if (opt.thumb != null && opt.thumb!.trim().isNotEmpty) {
          push(opt.thumb!.trim(), label, opt.store);
        }
      }
    } catch (_) {}
  }

  return out;
}
