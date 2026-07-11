import '../../models/brand.dart';
import '../../models/catalog.dart';

const _brandAliases = <String, String>{
  'سكالا': 'skala',
  'سكاله': 'skala',
  'skala': 'skala',
  'مايبيلين': 'maybelline',
  'ميبيلين': 'maybelline',
  'maybelline': 'maybelline',
  'لوريال': 'loreal',
  'لورéal': 'loreal',
  'loreal': 'loreal',
  'غولدن روز': 'golden rose',
  'جولدن روز': 'golden rose',
  'golden rose': 'golden rose',
};

String _normalizeBrandKey(String name) {
  var key = name
      .toLowerCase()
      .replaceAll(RegExp(r'[\u064B-\u065F\u0670]'), '')
      .replaceAll(RegExp(r"[''`´]"), '')
      .replaceAll(RegExp(r'[.&]'), ' ')
      .replaceAll(RegExp(r'\b(the|and|co|company|ltd|inc|llc|gmbh|paris|london|uae|ae)\b'), ' ')
      .replaceAll(RegExp(r'[^\w\s\u0600-\u06FF]'), ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
  if (key.isEmpty) return '';
  return _brandAliases[key] ?? key;
}

int _scoreBrandMatch(List<String> hints, List<String> candidates) {
  var best = 0;
  for (final hint in hints) {
    final h = _normalizeBrandKey(hint);
    if (h.isEmpty) continue;
    for (final raw in candidates) {
      final c = _normalizeBrandKey(raw);
      if (c.isEmpty) continue;
      if (h == c) {
        best = best > 100 ? best : 100;
      } else if (h.contains(c) || c.contains(h)) {
        best = best > 82 ? best : 82;
      } else {
        final hWords = h.split(' ').where((w) => w.length > 1).toList();
        final cWords = c.split(' ').where((w) => w.length > 1).toList();
        final overlap = hWords.where((w) => cWords.any((cw) => cw == w || cw.contains(w) || w.contains(cw))).length;
        if (overlap >= 2) {
          best = best > 88 ? best : 88;
        } else if (overlap == 1) {
          best = best > 70 ? best : 70;
        }
      }
    }
  }
  return best;
}

({String ar, String en}) extractBrandHints(CatalogImportProduct product) {
  var ar = product.brandAr.trim();
  var en = product.brandEn.trim();

  if (ar.isEmpty && en.isEmpty) {
    final nameParts = product.nameAr.trim().split(RegExp(r'\s+'));
    if (nameParts.isNotEmpty && nameParts.first.length >= 2) {
      ar = nameParts.first;
    }
    final enParts = product.nameEn.trim().split(RegExp(r'\s+'));
    if (enParts.isNotEmpty && enParts.first.length >= 2) {
      en = enParts.first;
    }
  }

  return (ar: ar, en: en);
}

String? matchBrandIdLocal(List<BrandEntity> brands, {String brandAr = '', String brandEn = ''}) {
  final hints = [brandAr, brandEn].map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
  if (hints.isEmpty) return null;

  String? bestId;
  var bestScore = 0;
  for (final b in brands) {
    final names = [b.name, b.slug, b.nameAr, b.nameEn].whereType<String>().where((n) => n.isNotEmpty).toList();
    final score = _scoreBrandMatch(hints, names);
    if (score >= 70 && score > bestScore) {
      bestScore = score;
      bestId = b.id;
    }
  }
  return bestId;
}

Future<String?> ensureBrandId(
  List<BrandEntity> brands,
  Future<String?> Function({String? brandAr, String? brandEn, bool createIfMissing}) resolveBrand,
  CatalogImportProduct product,
) async {
  final hints = extractBrandHints(product);
  final local = matchBrandIdLocal(brands, brandAr: hints.ar, brandEn: hints.en);
  if (local != null) return local;

  if (hints.ar.isEmpty && hints.en.isEmpty) return null;

  return resolveBrand(brandAr: hints.ar, brandEn: hints.en, createIfMissing: true);
}
