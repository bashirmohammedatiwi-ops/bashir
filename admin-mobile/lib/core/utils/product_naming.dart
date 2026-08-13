/// Iraqi catalog naming: Arabic title starts with the brand as-is.
/// English brands stay English; Arabic brands stay Arabic.
class ProductNaming {
  static final _arabic = RegExp(r'[\u0600-\u06FF]');
  static final _latin = RegExp(r'[A-Za-z]');

  static bool isLatinBrand(String value) {
    final s = value.trim();
    if (s.isEmpty || _arabic.hasMatch(s)) return false;
    return _latin.hasMatch(s);
  }

  static bool hasArabicScript(String value) => _arabic.hasMatch(value);

  /// Brand written at the start of [nameAr].
  static String arabicTitleBrand({required String brandAr, required String brandEn}) {
    final en = brandEn.replaceAll(RegExp(r'\s+'), ' ').trim();
    final ar = brandAr.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (isLatinBrand(en)) return en;
    if (hasArabicScript(ar)) return ar;
    if (isLatinBrand(ar)) return ar;
    return en.isNotEmpty ? en : ar;
  }

  static String englishTitleBrand({required String brandEn, required String brandAr}) {
    final en = brandEn.replaceAll(RegExp(r'\s+'), ' ').trim();
    final ar = brandAr.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (isLatinBrand(en)) return en;
    if (isLatinBrand(ar)) return ar;
    return en.isNotEmpty ? en : ar;
  }

  static String productCore(String name, List<String> brands) {
    var s = name.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (s.isEmpty) return '';

    final dash = RegExp(r'^(.+?)\s*[-–—]\s*(.+)$').firstMatch(s);
    if (dash != null) {
      final left = dash.group(1)!.trim();
      final right = dash.group(2)!.trim();
      if (_isOnlyBrand(left, brands)) s = right;
    }

    s = _stripLeadingBrands(s, brands);
    return s.replaceFirst(RegExp(r'^[-–—\s]+'), '').trim();
  }

  static String applyArabicTitle({
    required String current,
    required String brandAr,
    required String brandEn,
    String? englishName,
  }) {
    final prefix = arabicTitleBrand(brandAr: brandAr, brandEn: brandEn);
    if (prefix.isEmpty) return arabicizeProductCore(current.replaceAll(RegExp(r'\s+'), ' ').trim());
    final core = productCore(current.isNotEmpty ? current : (englishName ?? ''), [prefix, brandEn, brandAr]);
    final arabicCore = arabicizeProductCore(core, fallback: englishName);
    if (arabicCore.isEmpty) return '$prefix -';
    return '$prefix - $arabicCore';
  }

  /// Type in Arabic + official line in English + size. Brand is applied separately.
  static String arabicizeProductCore(String core, {String? fallback}) {
    var s = core.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (s.isEmpty && (fallback ?? '').trim().isNotEmpty) {
      s = fallback!.replaceAll(RegExp(r'\s+'), ' ').trim();
      final dash = RegExp(r'^(.+?)\s*[-–—]\s*(.+)$').firstMatch(s);
      if (dash != null) s = dash.group(2)!.trim();
    }
    if (s.isEmpty) return '';

    final sizes = <String>[];
    s = s.replaceAllMapped(RegExp(r'(\d+(?:[.,]\d+)?)\s*(ml|مل|g|غ|gm|gr|grams?|oz)\b', caseSensitive: false), (m) {
      final n = m.group(1)!.replaceAll(',', '.');
      final u = m.group(2)!.toLowerCase();
      final unit = (u == 'ml' || u == 'مل') ? 'مل' : (u == 'oz' ? 'أونصة' : 'غ');
      sizes.add('$n $unit');
      return ' ';
    });
    s = s.replaceAll(RegExp(r'\s+'), ' ').trim();

    const phrases = <(String, String)>[
      (r'cleansing\s+mousse|mousse\s+nettoyante', 'موس تنظيف'),
      (r'cleansing\s+foam', 'رغوة تنظيف'),
      (r'cleansing\s+milk', 'حليب تنظيف'),
      (r'cleansing\s+gel', 'جل تنظيف'),
      (r'makeup\s+remover', 'مزيل مكياج'),
      (r'micellar\s+water', 'ماء ميسيلار'),
      (r'facial\s+cleanser|\bcleanser\b|\bcleansing\b', 'منظف'),
      (r'liquid\s+lipstick|lip\s+fluid', 'أحمر شفاه سائل'),
      (r'lip\s+gloss', 'جلوس شفاه'),
      (r'\blipstick\b|\brouge\b', 'أحمر شفاه'),
      (r'lip\s+liner|lipliner', 'قلم شفاه'),
      (r'\bconcealer\b', 'كونسيلر'),
      (r'\bfoundation\b', 'فاونديشن'),
      (r'\bmascara\b', 'ماسكارا'),
      (r'eye\s*shadow', 'ظل عيون'),
      (r'\beyeliner\b|\bkohl\b', 'ايلاينر'),
      (r'brow\s+gel', 'جل حواجب'),
      (r'brow\s+pencil|eyebrow', 'قلم حواجب'),
      (r'\bblush(er)?\b', 'بلاشر'),
      (r'\bhighlighter\b', 'هايلايتر'),
      (r'\bbronzer\b', 'برونزر'),
      (r'\bprimer\b', 'برايمر'),
      (r'\bpowder\b', 'بودرة'),
      (r'\bserum\b', 'سيروم'),
      (r'moisturi[sz]er', 'مرطب'),
      (r'sun\s*screen|\bspf\b', 'واقي شمس'),
      (r'\bshampoo\b', 'شامبو'),
      (r'\bconditioner\b', 'بلسم'),
      (r'shower\s+gel', 'جل استحمام'),
      (r'body\s+lotion', 'لوشن جسم'),
      (r'\btoner\b', 'تونر'),
      (r'\bmask\b|\bmasque\b', 'ماسك'),
      (r'\bmousse\b', 'موس'),
      (r'\bfoam\b', 'رغوة'),
      (r'\bcream\b', 'كريم'),
      (r'\blotion\b', 'لوشن'),
      (r'\bgel\b', 'جل'),
      (r'\boil\b', 'زيت'),
      (r'\bspray\b', 'بخاخ'),
      (r'\bsoap\b', 'صابون'),
    ];

    final types = <String>[];
    for (final pair in phrases) {
      final re = RegExp(pair.$1, caseSensitive: false);
      if (!re.hasMatch(s)) continue;
      if (!types.contains(pair.$2)) types.add(pair.$2);
      s = s.replaceAll(re, ' ');
    }
    s = s.replaceAll(RegExp(r'\s+'), ' ').trim();
    for (final t in types) {
      s = s.replaceAll(RegExp(RegExp.escape(t), caseSensitive: false), ' ').trim();
    }
    s = s.replaceAll(RegExp(r'\s+'), ' ').trim();

    final parts = <String>[
      if (types.isNotEmpty) types.first,
      if (s.isNotEmpty) s,
      ...sizes,
    ];
    var out = parts.join(' ').replaceAll(RegExp(r'\s+'), ' ').trim();
    out = _dedupeArabicPhrases(out);
    return out;
  }

  /// Removes repeated Arabic product-type phrases like "أحمر شفاه سائل أحمر شفاه سائل".
  static String _dedupeArabicPhrases(String text) {
    var s = text.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (s.isEmpty) return s;
    const knownTypes = [
      'أحمر شفاه سائل',
      'أحمر شفاه',
      'جلوس شفاه',
      'قلم شفاه',
      'موس تنظيف',
      'رغوة تنظيف',
      'جل استحمام',
      'لوشن جسم',
      'واقي شمس',
      'ظل عيون',
      'قلم حواجب',
      'جل حواجب',
      'فاونديشن',
      'كونسيلر',
      'ماسكارا',
      'ايلاينر',
      'بلاشر',
      'هايلايتر',
      'برونزر',
      'برايمر',
      'بودرة',
      'سيروم',
      'مرطب',
      'شامبو',
      'بلسم',
      'تونر',
      'ماسك',
      'منظف',
    ];
    for (final phrase in knownTypes) {
      final escaped = RegExp.escape(phrase);
      s = s.replaceAll(RegExp('($escaped)(\\s+\\1)+'), r'$1');
    }
    return s.replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  static String applyEnglishTitle({
    required String current,
    required String brandEn,
    required String brandAr,
  }) {
    final prefix = englishTitleBrand(brandEn: brandEn, brandAr: brandAr);
    if (prefix.isEmpty) return current.replaceAll(RegExp(r'\s+'), ' ').trim();
    final core = productCore(current, [prefix, brandEn, brandAr]);
    if (core.isEmpty) return '$prefix -';
    return '$prefix - $core';
  }

  static bool _isOnlyBrand(String left, List<String> brands) {
    var rest = _norm(left);
    if (rest.isEmpty) return true;
    final aliases = _aliases(brands);
    for (var i = 0; i < 8; i++) {
      var hit = false;
      for (final alias in aliases) {
        final a = _norm(alias);
        if (a.isEmpty) continue;
        if (rest == a) return true;
        if (rest.startsWith('$a ')) {
          rest = rest.substring(a.length).trim();
          hit = true;
          break;
        }
      }
      if (!hit) break;
    }
    return rest.isEmpty;
  }

  static String _stripLeadingBrands(String text, List<String> brands) {
    var s = text.replaceAll(RegExp(r'\s+'), ' ').trim();
    final aliases = _aliases(brands);
    for (var i = 0; i < 12; i++) {
      var changed = false;
      final words = s.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
      for (final alias in aliases) {
        final aliasWords = alias.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
        if (words.length < aliasWords.length) continue;
        final head = words.take(aliasWords.length).join(' ');
        if (_norm(head) == _norm(alias)) {
          s = words.skip(aliasWords.length).join(' ').replaceFirst(RegExp(r'^[-–—:\s]+'), '').trim();
          changed = true;
          break;
        }
      }
      if (!changed) break;
    }
    return s;
  }

  static List<String> _aliases(List<String> brands) {
    final out = <String>{};
    for (final raw in brands) {
      final b = raw.replaceAll(RegExp(r'\s+'), ' ').trim();
      if (b.isEmpty) continue;
      out.add(b);
      final first = b.split(RegExp(r'\s+')).first;
      if (first.length >= 3) out.add(first);
    }
    final sorted = out.toList()..sort((a, b) => b.length.compareTo(a.length));
    return sorted;
  }

  static String _norm(String s) => s
      .toLowerCase()
      .replaceAll(RegExp(r'[^0-9a-z\u0600-\u06FF]+'), ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}
