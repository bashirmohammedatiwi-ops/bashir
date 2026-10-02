/// مطابقة ثنائية اللغة: العربي والإنجليزي يعملان معاً مهما كانت لغة التطبيق.
String normalizeQuery(String raw) {
  return raw
      .toLowerCase()
      .replaceAll(RegExp(r'[\u064B-\u0652\u0670\u0640]'), '')
      .replaceAll(RegExp(r'[أإآٱ]'), 'ا')
      .replaceAll('ؤ', 'و')
      .replaceAll('ئ', 'ي')
      .replaceAll('ى', 'ي')
      .replaceAll('ة', 'ه')
      .replaceAll(RegExp(r'[^\p{L}\p{N}\s]+', unicode: true), ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
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

List<String> expandTerm(String raw) {
  final normalized = normalizeQuery(raw);
  final out = <String>{if (normalized.isNotEmpty) normalized};
  for (final group in _groups) {
    final norms = group.map(normalizeQuery).toList();
    if (norms.contains(normalized)) out.addAll(norms);
    for (final token in normalized.split(' ')) {
      if (token.length >= 2 && norms.contains(token)) out.addAll(norms);
    }
  }
  return out.where((e) => e.length >= 2).toList();
}

bool textMatchesQuery(String query, List<String?> fields) {
  final tokens = normalizeQuery(query).split(' ').where((t) => t.length >= 2).toList();
  if (tokens.isEmpty) return false;
  final hay = normalizeQuery(fields.whereType<String>().join(' '));
  if (hay.isEmpty) return false;
  for (final token in tokens) {
    final terms = expandTerm(token);
    if (!terms.any(hay.contains)) return false;
  }
  return true;
}

int matchScore(String query, List<String?> fields) {
  final tokens = normalizeQuery(query).split(' ').where((t) => t.length >= 2).toList();
  if (tokens.isEmpty) return 0;
  var score = 0;
  for (final token in tokens) {
    final terms = expandTerm(token);
    var best = 0;
    for (final field in fields) {
      final value = normalizeQuery(field ?? '');
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

/// مرادفات مختلفة عن ما كتبته المستخدمة، لسطر «يطابق أيضاً».
List<String> synonymHints(String query) {
  final tokens = normalizeQuery(query).split(' ').where((t) => t.length >= 2);
  final extras = <String>[];
  for (final token in tokens) {
    for (final term in expandTerm(token)) {
      if (term != token && !extras.contains(term)) extras.add(term);
    }
  }
  return extras.take(5).toList();
}
