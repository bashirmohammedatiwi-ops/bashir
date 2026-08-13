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
  }) {
    final prefix = arabicTitleBrand(brandAr: brandAr, brandEn: brandEn);
    if (prefix.isEmpty) return current.replaceAll(RegExp(r'\s+'), ' ').trim();
    final core = productCore(current, [prefix, brandEn, brandAr]);
    if (core.isEmpty) return '$prefix -';
    return '$prefix - $core';
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
