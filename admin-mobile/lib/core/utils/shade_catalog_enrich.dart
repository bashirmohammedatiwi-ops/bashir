import '../../models/ai_autofill.dart';
import '../../repositories/catalog_repository.dart';

bool isGenericShadeName(String name) {
  final t = name.trim();
  if (t.isEmpty) return true;
  if (RegExp(r'^تدرج\s*\d+$').hasMatch(t)) return true;
  if (RegExp(r'^shade\s*\d+$', caseSensitive: false).hasMatch(t)) return true;
  if (RegExp(r'^shade\s*\d{3,}$', caseSensitive: false).hasMatch(t)) return true;
  return false;
}

class ShadeCatalogHit {
  const ShadeCatalogHit({this.shadeName, this.image});

  final String? shadeName;
  final AiAutofillImage? image;
}

/// Looks up shade name + thumbnail from catalog stores for one barcode.
Future<ShadeCatalogHit?> lookupShadeInCatalog(
  CatalogRepository catalog,
  String barcode, {
  List<String>? stores,
}) async {
  final storeIds = stores ??
      const [
        'faces',
        'miswag',
        'miraaya',
        'beautyway',
        'niceone',
      ];
  try {
    final hits = await catalog.searchByBarcode(barcode, stores: storeIds);
    if (hits.isEmpty) return null;
    final best = hits.first;
    final shadeName = best.shadeName?.trim();
    final thumb = best.thumb?.trim();
    AiAutofillImage? image;
    if (thumb != null && thumb.startsWith('http')) {
      final label = shadeName?.isNotEmpty == true
          ? '${best.storeLabel} · ${best.nameEn ?? best.nameAr} · $shadeName'
          : '${best.storeLabel} · ${best.nameEn ?? best.nameAr}';
      image = AiAutofillImage(
        url: thumb,
        thumbUrl: thumb,
        title: label,
        source: best.store,
      );
    }
    return ShadeCatalogHit(
      shadeName: shadeName?.isNotEmpty == true ? shadeName : null,
      image: image,
    );
  } catch (_) {
    return null;
  }
}

/// Batch catalog lookup — 4 barcodes at a time.
Future<Map<String, ShadeCatalogHit>> enrichShadesFromCatalog({
  required CatalogRepository catalog,
  required List<String> barcodes,
  List<String>? stores,
}) async {
  final out = <String, ShadeCatalogHit>{};
  for (var i = 0; i < barcodes.length; i += 4) {
    final batch = barcodes.sublist(i, (i + 4 < barcodes.length) ? i + 4 : barcodes.length);
    final part = await Future.wait(
      batch.map((bc) async => MapEntry(bc, await lookupShadeInCatalog(catalog, bc, stores: stores))),
    );
    for (final e in part) {
      if (e.value != null) out[e.key] = e.value!;
    }
  }
  return out;
}
