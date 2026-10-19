// تعابير ثابتة تُبنى مرة واحدة (كانت تُنشأ في كل استدعاء — أي مع كل حرف يُكتب).
final _diacritics = RegExp(r'[ً-ْٰـ]');
final _alefs = RegExp(r'[أإآٱ]');
final _nonWord = RegExp(r'[^\p{L}\p{N}\s]+', unicode: true);
final _spaces = RegExp(r'\s+');

/// مطابقة ثنائية اللغة: العربي والإنجليزي يعملان معاً مهما كانت لغة التطبيق.
String normalizeQuery(String raw) {
  if (raw.isEmpty) return '';
  return raw
      .toLowerCase()
      .replaceAll(_diacritics, '')
      .replaceAll(_alefs, 'ا')
      .replaceAll('ؤ', 'و')
      .replaceAll('ئ', 'ي')
      .replaceAll('ى', 'ي')
      .replaceAll('ة', 'ه')
      .replaceAll(_nonWord, ' ')
      .replaceAll(_spaces, ' ')
      .trim();
}

final _charNorm = <int, String>{};

/// تطبيع حرف واحد (وحدة UTF-16) — مخزّن مؤقتاً: نفس نتيجة `normalizeQuery(ch)`
/// بدون تعابير منتظمة لكل حرف (لإبراز التطابق داخل الأسماء).
String normalizeChar(String text, int i) {
  final unit = text.codeUnitAt(i);
  return _charNorm[unit] ??= normalizeQuery(text[i]);
}

const _groups = <List<String>>[
  ['lipstick', 'lip stick', 'روج', 'احمر شفاه', 'احمر الشفاه'],
  ['lip gloss', 'gloss', 'ملمع', 'ملمع شفاه'],
  ['mascara', 'ماسكارا', 'مسكارا'],
  ['eyeliner', 'kajal', 'كحل', 'كحله'],
  ['eyeshadow', 'eye shadow', 'ايشادو', 'ظلال'],
  ['foundation', 'فاونديشن', 'كريم اساس'],
  ['concealer', 'كونسيلر'],
  ['blush', 'بلاشر', 'خدود'],
  ['highlighter', 'هايلايتر'],
  ['powder', 'بودره', 'بودرة'],
  ['primer', 'برايمر'],
  ['shampoo', 'شامبو'],
  ['conditioner', 'بلسم'],
  ['serum', 'سيروم'],
  ['sunscreen', 'spf', 'واقي شمس', 'واقي'],
  ['cream', 'كريم'],
  ['lotion', 'لوشن'],
  ['moisturizer', 'مرطب', 'ترطيب'],
  ['perfume', 'fragrance', 'عطر', 'عطور'],
  ['oud', 'عود'],
  ['musk', 'مسك'],
  ['nail', 'nails', 'اظافر', 'طلاء'],
  ['lens', 'lenses', 'عدسات', 'عدسه'],
  ['gift', 'gifts', 'هدايا', 'هديه'],
  ['makeup', 'make up', 'مكياج'],
  ['skincare', 'skin care', 'عناية', 'عنايه'],
  ['hair', 'شعر'],
  ['body', 'جسم'],
  ['eye', 'eyes', 'عيون', 'عين'],
  ['lip', 'lips', 'شفاه', 'شفايف'],
  ['mask', 'ماسك'],
  ['cleanser', 'غسول'],
  ['oil', 'زيت'],
  ['brush', 'فرشاه', 'فرشاة'],
  ['toner', 'تونر'],
  ['vitamin c', 'vit c', 'فيتامين سي'],
  ['retinol', 'ريتينول'],
  ['hyaluronic', 'هيالورون'],
];

/// المجموعات مطبّعة مرة واحدة (كانت تُطبَّع ~115 كلمة في كل استدعاء).
final List<(List<String>, Set<String>)> _normGroups = [
  for (final g in _groups)
    (() {
      final norms = g.map(normalizeQuery).toList(growable: false);
      return (norms, norms.toSet());
    })(),
];

final _expandCache = <String, List<String>>{};

/// توسيع كلمة مطبّعة مسبقاً بمرادفاتها (مخزّن مؤقتاً — النتيجة ثابتة لكل كلمة).
List<String> _expandNormalized(String normalized) {
  final hit = _expandCache[normalized];
  if (hit != null) return hit;
  final out = <String>{if (normalized.isNotEmpty) normalized};
  final tokens = normalized.split(' ');
  for (final (norms, set) in _normGroups) {
    if (set.contains(normalized)) out.addAll(norms);
    for (final token in tokens) {
      if (token.length >= 2 && set.contains(token)) out.addAll(norms);
    }
  }
  final result = List<String>.unmodifiable(out.where((e) => e.length >= 2));
  if (_expandCache.length > 512) _expandCache.clear();
  return _expandCache[normalized] = result;
}

List<String> expandTerm(String raw) => _expandNormalized(normalizeQuery(raw));

List<String> _tokens(String normalizedQuery) =>
    normalizedQuery.split(' ').where((t) => t.length >= 2).toList(growable: false);

/// استعلام مُجهّز مرة واحدة (تطبيع + مرادفات لكل كلمة) — يُعاد استعماله على
/// كل العناصر بدل تطبيع الاستعلام من جديد لكل عنصر.
class PreparedQuery {
  /// مرادفات كل كلمة من كلمات الاستعلام (كلمة واحدة على الأقل بحرفين).
  final List<List<String>> termsPerToken;

  PreparedQuery._(this.termsPerToken);

  factory PreparedQuery(String query) =>
      PreparedQuery._([for (final t in _tokens(normalizeQuery(query))) _expandNormalized(t)]);

  bool get isEmpty => termsPerToken.isEmpty;

  /// مثل [textMatchesQuery].
  bool matches(List<String?> fields) {
    if (termsPerToken.isEmpty) return false;
    final hay = normalizeQuery(fields.whereType<String>().join(' '));
    if (hay.isEmpty) return false;
    for (final terms in termsPerToken) {
      if (!terms.any(hay.contains)) return false;
    }
    return true;
  }

  /// مثل [matchScore] لكن على حقول مطبّعة مسبقاً بـ [normalizeQuery].
  int scoreNormalized(List<String> normalizedFields) {
    var score = 0;
    for (final terms in termsPerToken) {
      var best = 0;
      for (final value in normalizedFields) {
        if (value.isEmpty) continue;
        for (final term in terms) {
          if (value == term) {
            best = 100;
          } else if (value.startsWith(term) && best < 70) {
            best = 70;
          } else if (value.contains(term) && best < 40) {
            best = 40;
          }
        }
      }
      score += best;
    }
    return score;
  }
}

bool textMatchesQuery(String query, List<String?> fields) => PreparedQuery(query).matches(fields);

int matchScore(String query, List<String?> fields) {
  final q = PreparedQuery(query);
  if (q.isEmpty) return 0;
  return q.scoreNormalized([for (final f in fields) normalizeQuery(f ?? '')]);
}

/// مرادفات مختلفة عن ما كتبته المستخدمة، لسطر «يطابق أيضاً».
List<String> synonymHints(String query) {
  final tokens = _tokens(normalizeQuery(query));
  final extras = <String>[];
  for (final token in tokens) {
    for (final term in _expandNormalized(token)) {
      if (term != token && !extras.contains(term)) extras.add(term);
    }
  }
  return extras.take(5).toList();
}
