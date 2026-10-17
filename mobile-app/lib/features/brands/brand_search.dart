import '../../data/models/brand.dart';
import '../search/smart_query.dart';

/// بحث البراندات: أغلب أسمائها لاتينية فقط، والزبونة تكتب بالعربي («لوريال»، «فيشي»)
/// أو بلا علامات («loreal» لـ L'Oréal). نطابق بثلاث طبقات:
/// 1) النص المطوي (بلا تشكيل ولا علامات ولا مسافات)، 2) «هيكل النطق» المشترك
/// بين العربي واللاتيني (الحروف الساكنة)، 3) خطأ إملائي بحرف واحد.

const _latinFold = {
  'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'ā': 'a',
  'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ē': 'e',
  'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ñ': 'n',
  'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
  'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ý': 'y', 'ÿ': 'y',
  'ß': 'ss', 'œ': 'oe', 'æ': 'ae', 'ı': 'i', 'ş': 's', 'ğ': 'g',
};

/// حروف لاتينية بلا علامات + توحيد العربي (أ/إ/آ، ة، ى…).
String foldText(String raw) {
  final lower = raw.toLowerCase();
  final b = StringBuffer();
  for (final ch in lower.split('')) {
    b.write(_latinFold[ch] ?? ch);
  }
  return normalizeQuery(b.toString());
}

/// بلا مسافات: «l oreal» = «loreal»، «arm hammer» = «armhammer».
String compactText(String raw) => foldText(raw).replaceAll(' ', '');

/// هيكل النطق: الحروف الساكنة بصنف موحّد بين العربي واللاتيني، بلا حروف علة ولا تكرار.
/// «لوريال» و«L'Oréal» → lrl، «فيشي» و«Vichy» → fs، «غارنييه» و«Garnier» → krn…
String phoneticKey(String raw) {
  final s = foldText(raw).replaceAll(' ', '');
  final out = StringBuffer();
  String? last;
  void put(String c) {
    if (c != last) out.write(c);
    last = c;
  }

  for (var i = 0; i < s.length; i++) {
    final c = s[i];
    final next = i + 1 < s.length ? s[i + 1] : '';
    switch (c) {
      // لاتيني
      case 'p' when next == 'h':
        put('f');
        i++;
      case 'b' || 'p':
        put('b');
      case 'c':
        if (next == 'h') {
          put('s');
          i++;
        } else if (next == 'k') {
          put('k');
          i++;
        } else {
          put('eiy'.contains(next) && next.isNotEmpty ? 's' : 'k');
        }
      case 's':
        if (next == 'h') i++;
        put('s');
      case 't':
        if (next == 'h') i++;
        put('t');
      case 'g':
        if (next == 'h') i++;
        put('k');
      case 'k':
        if (next == 'h') i++;
        put('k');
      case 'q' || 'j':
        put('k');
      case 'x':
        put('k');
        put('s');
      case 'z':
        put('s');
      case 'v' || 'f':
        put('f');
      case 'd' || 'l' || 'm' || 'n' || 'r':
        put(c);
      case 'a' || 'e' || 'i' || 'o' || 'u' || 'y' || 'w' || 'h':
        last = null; // حرف علة يفصل الساكنين المتشابهين («anna» تبقى n)
      // عربي
      case 'ب' || 'پ':
        put('b');
      case 'ت' || 'ط':
        put('t');
      case 'د' || 'ض':
        put('d');
      case 'ث' || 'ذ' || 'ز' || 'س' || 'ش' || 'ص' || 'ظ' || 'چ':
        put('s');
      case 'ج' || 'غ' || 'ق' || 'ك' || 'خ' || 'گ':
        put('k');
      case 'ف' || 'ڤ':
        put('f');
      case 'ل':
        put('l');
      case 'م':
        put('m');
      case 'ن':
        put('n');
      case 'ر':
        put('r');
      case 'ا' || 'و' || 'ي' || 'ه' || 'ح' || 'ع' || 'ء':
        last = null;
      default:
        if (RegExp(r'[0-9]').hasMatch(c)) put(c);
    }
  }
  return out.toString();
}

/// نطق أدق للترتيب: حروف العلة (a / i / u) وتمييز g/j/k — «غارنييه» أقرب لـ Garnier من Jourin.
String fineKey(String raw) {
  final s = foldText(raw).replaceAll(' ', '');
  final out = StringBuffer();
  String? last;
  void put(String c) {
    if (c != last) out.write(c);
    last = c;
  }

  for (var i = 0; i < s.length; i++) {
    final c = s[i];
    final next = i + 1 < s.length ? s[i + 1] : '';
    if (c == 'p' && next == 'h') {
      put('f');
      i++;
      continue;
    }
    if ((c == 'c' || c == 's') && next == 'h') {
      put('s');
      i++;
      continue;
    }
    final m = switch (c) {
      'a' || 'ا' => 'a',
      'e' || 'i' || 'y' || 'ي' => 'i',
      'o' || 'u' || 'w' || 'و' => 'u',
      'b' || 'p' || 'ب' => 'b',
      'c' => 'eiy'.contains(next) && next.isNotEmpty ? 's' : 'k',
      'k' || 'q' || 'ك' || 'ق' || 'خ' => 'k',
      'g' || 'غ' || 'گ' => 'g',
      'j' || 'ج' => 'j',
      's' || 'z' || 'س' || 'ز' || 'ش' || 'ص' || 'ث' || 'ذ' || 'ظ' => 's',
      'x' => 'ks',
      't' || 'ت' || 'ط' => 't',
      'd' || 'د' || 'ض' => 'd',
      'f' || 'v' || 'ف' || 'ڤ' => 'f',
      'l' || 'ل' => 'l',
      'm' || 'م' => 'm',
      'n' || 'ن' => 'n',
      'r' || 'ر' => 'r',
      _ => '',
    };
    for (final ch in m.split('')) {
      if (ch.isNotEmpty) put(ch);
    }
  }
  return out.toString();
}

int _lev(String a, String b, [int max = 2]) {
  if ((a.length - b.length).abs() > max) return max + 1;
  var prev = List<int>.generate(b.length + 1, (i) => i);
  for (var i = 1; i <= a.length; i++) {
    final cur = List<int>.filled(b.length + 1, 0)..[0] = i;
    var best = cur[0];
    for (var j = 1; j <= b.length; j++) {
      final cost = a[i - 1] == b[j - 1] ? 0 : 1;
      cur[j] = [prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost].reduce((x, y) => x < y ? x : y);
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

class _Entry {
  final Brand brand;
  final String compact;
  final List<String> words;
  final String key;
  final List<String> wordKeys;
  final List<String> fines;
  _Entry(this.brand, this.compact, this.words, this.key, this.wordKeys, this.fines);
}

/// فهرس البحث — يُبنى مرة لكل قائمة براندات.
class BrandSearchIndex {
  final List<_Entry> _entries;

  BrandSearchIndex(List<Brand> brands)
      : _entries = [
          for (final b in brands)
            () {
              final names = <String>{
                b.name,
                if (b.nameAr != null) b.nameAr!,
                if (b.nameEn != null) b.nameEn!,
                b.slug.replaceAll('-', ' '),
              }.join(' ');
              final words = foldText(names).split(' ').where((w) => w.isNotEmpty).toSet().toList();
              return _Entry(
                b,
                compactText(b.name),
                words,
                phoneticKey(b.label),
                words.map(phoneticKey).where((k) => k.isNotEmpty).toSet().toList(),
                {fineKey(b.label), ...words.map(fineKey)}.where((k) => k.isNotEmpty).toList(),
              );
            }(),
        ];

  /// أقرب مسافة بين نطق الاستعلام الدقيق وبداية اسم/كلمة البراند.
  int _fineGap(_Entry e, String qf) {
    if (qf.isEmpty) return 9;
    var best = 9;
    for (final f in e.fines) {
      final cut = f.length > qf.length ? f.substring(0, qf.length) : f;
      final d = _lev(qf, cut, 4);
      if (d < best) best = d;
    }
    return best;
  }

  int _score(_Entry e, String q, String qc, List<String> qTokens, String qk, String qf) {
    if (qc.isEmpty) return 0;
    // 1) النص نفسه.
    if (e.compact == qc || e.words.contains(qc)) return 1000;
    if (e.compact.startsWith(qc)) return 900;
    if (e.words.any((w) => w.startsWith(qc))) return 820;
    if (qTokens.length > 1 && qTokens.every((t) => e.words.any((w) => w.startsWith(t)))) return 800;
    // 2) النطق: عربي ↔ لاتيني («ديور» = Dior، «دوف» = Dove).
    // الأقرب نطقاً (مع حروف العلة) أعلى داخل هذه الفئة.
    if (qk.length >= 2) {
      final tokenKeys = qTokens.map(phoneticKey).where((k) => k.isNotEmpty).toList();
      final hit = e.key.startsWith(qk) ||
          e.wordKeys.any((w) => w.startsWith(qk)) ||
          (tokenKeys.isNotEmpty && tokenKeys.every((t) => e.wordKeys.any((w) => w.startsWith(t))));
      if (hit) return 620 - 15 * _fineGap(e, qf).clamp(0, 6);
    }
    // جزء من وسط الاسم أضعف من مطابقة النطق.
    if (qc.length >= 3 && e.compact.contains(qc)) return 450;
    if (qk.length >= 3 && e.key.contains(qk)) return 300;
    // 3) خطأ إملائي بحرف (للكلمات الأطول).
    if (qc.length >= 5) {
      for (final w in [e.compact, ...e.words]) {
        if (w.length >= qc.length - 1 && _lev(qc, w.length > qc.length ? w.substring(0, qc.length) : w, 1) <= 1) return 260;
      }
    }
    // خطأ بالنطق للعربي فقط (تهجئة الأسماء الأجنبية بالعربي تختلف كثيراً).
    if (qk.length >= 4 && RegExp(r'[\u0600-\u06FF]').hasMatch(q)) {
      for (final w in [e.key, ...e.wordKeys]) {
        if (w.length >= qk.length && _lev(qk, w.substring(0, qk.length), 1) <= 1) return 160;
      }
    }
    return 0;
  }

  /// النتائج مرتبة: الأقرب أولاً ثم الأكثر منتجات.
  List<Brand> search(String raw) {
    final q = foldText(raw);
    final qc = q.replaceAll(' ', '');
    if (qc.isEmpty) return const [];
    final tokens = q.split(' ').where((t) => t.isNotEmpty).toList();
    final qk = phoneticKey(raw);
    final qf = fineKey(raw);
    // حرف واحد: البراندات التي يبدأ اسمها به — والحرف العربي يطابق نطق أول حرف لاتيني.
    if (qc.length == 1) {
      final arabic = RegExp(r'[\u0600-\u06FF]').hasMatch(qc);
      int rank(_Entry e) {
        if (e.compact.startsWith(qc)) return 3;
        if (e.words.any((w) => w.startsWith(qc))) return 2;
        if (arabic && qk.isNotEmpty && e.key.startsWith(qk) && e.fines.any((f) => f.startsWith(qf))) return 1;
        return 0;
      }
      final hits = [for (final e in _entries) if (rank(e) > 0) e]
        ..sort((a, b) {
          final c = rank(b).compareTo(rank(a));
          return c != 0 ? c : b.brand.productCount.compareTo(a.brand.productCount);
        });
      return hits.map((e) => e.brand).toList();
    }
    final scored = <(_Entry, int)>[];
    for (final e in _entries) {
      final s = _score(e, q, qc, tokens, qk, qf);
      if (s > 0) scored.add((e, s));
    }
    // وجود مطابقة قوية يُسقط الذيل الضعيف (أجزاء من أسماء بعيدة، أخطاء إملائية).
    if (scored.isNotEmpty) {
      final best = scored.map((e) => e.$2).reduce((a, b) => a > b ? a : b);
      if (best >= 560) {
        // لا يتجاوز حد مطابقة النطق: كل «لوريال …» تبقى حين يطابق أحدها نصاً.
        final floor = (best - 45).clamp(450, 560);
        scored.removeWhere((e) => e.$2 < floor);
      }
    }
    // تعادل: الأقرب نطقاً، ثم الأكثر منتجات.
    scored.sort((a, b) {
      final c = b.$2.compareTo(a.$2);
      if (c != 0) return c;
      final g = _fineGap(a.$1, qf).compareTo(_fineGap(b.$1, qf));
      return g != 0 ? g : b.$1.brand.productCount.compareTo(a.$1.brand.productCount);
    });
    return scored.map((e) => e.$1.brand).toList();
  }

  /// لا نتائج: أقرب 3 أسماء بالنطق (لسطر «هل تقصدين…؟»).
  List<Brand> suggest(String raw) {
    final qk = phoneticKey(raw);
    if (qk.length < 2) return const [];
    final ranked = <(Brand, int)>[];
    for (final e in _entries) {
      var best = 9;
      for (final w in [e.key, ...e.wordKeys]) {
        final cut = w.length > qk.length ? w.substring(0, qk.length) : w;
        final d = _lev(qk, cut, 2);
        if (d < best) best = d;
      }
      if (best <= 2) ranked.add((e.brand, best));
    }
    ranked.sort((a, b) {
      final c = a.$2.compareTo(b.$2);
      return c != 0 ? c : b.$1.productCount.compareTo(a.$1.productCount);
    });
    return ranked.take(3).map((e) => e.$1).toList();
  }
}

/// «جولدن روز - قلم كحل» تحت شعار GOLDEN ROSE → «قلم كحل»: البراند مكتوب فوق الاسم في البطاقة.
/// تهجئات المتجر تختلف (غولدن / جولدن / قولدن)، فالمقارنة بهيكل النطق لا بالنص.
String stripBrandPrefix(String name, String? brandName) {
  final b = brandName?.trim() ?? '';
  if (b.isEmpty) return name;
  final parts = splitBrandName(b);
  final keys = {phoneticKey(b), if (parts.ar != null) phoneticKey(parts.ar!), if (parts.en != null) phoneticKey(parts.en!)}
    ..removeWhere((k) => k.length < 2);
  final m = RegExp(r'^(.{2,32}?)\s+[-–—]\s+(.{4,})$').firstMatch(name.trim());
  if (m == null) {
    // بلا شرطة («كولدن روز لونغ ستاي…»): أول كلمة/كلمتين/ثلاث تطابق البراند نطقاً تماماً.
    final words = name.trim().split(RegExp(r'\s+'));
    for (var n = 1; n <= 3 && n <= words.length - 2; n++) {
      final k = phoneticKey(words.take(n).join(' '));
      if (k.length >= 3 && keys.contains(k)) return words.skip(n).join(' ');
    }
    return name;
  }
  final pk = phoneticKey(m.group(1)!);
  if (pk.length < 2) return name;
  // البادئة هي البراند نفسه أو جزء منه — لا أطول (فـ«فارماسيريس T» تبقى، T خط منتجات).
  final same = keys.any((k) => k == pk || (pk.length >= 3 && k.startsWith(pk)));
  return same ? m.group(2)!.trim() : name;
}
