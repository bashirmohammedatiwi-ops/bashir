import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/models/search_suggestions.dart';
import 'smart_query.dart';

enum SuggestKind { category, brand }

/// اقتراح قسم أو براند جاهز للعرض — مدمج من المطابقة المحلية واقتراحات الخادم.
class SuggestEntry {
  final SuggestKind kind;
  final String id;
  final String title;

  /// مسار القسم (رئيسي › فرعي) أو null.
  final String? subtitle;
  final String imageUrl;

  /// مسار go_router الجاهز للفتح.
  final String location;
  final int score;
  final bool fromServer;

  const SuggestEntry({
    required this.kind,
    required this.id,
    required this.title,
    required this.location,
    this.subtitle,
    this.imageUrl = '',
    this.score = 0,
    this.fromServer = false,
  });

  String get key => '${kind.name}:$id';

  SuggestEntry copyWith({int? score, bool? fromServer}) => SuggestEntry(
    kind: kind,
    id: id,
    title: title,
    location: location,
    subtitle: subtitle,
    imageUrl: imageUrl,
    score: score ?? this.score,
    fromServer: fromServer ?? this.fromServer,
  );
}

class MergedSuggestions {
  final List<SuggestEntry> categories;
  final List<SuggestEntry> brands;

  const MergedSuggestions({this.categories = const [], this.brands = const []});

  bool get isEmpty => categories.isEmpty && brands.isEmpty;
}

String categoryLocation({
  required String title,
  String? categoryId,
  String? subcategoryId,
  String? tertiaryCategoryId,
}) {
  final b = StringBuffer('/products?');
  if (tertiaryCategoryId != null && subcategoryId != null) {
    b.write('subcategoryId=$subcategoryId&tertiaryCategoryId=$tertiaryCategoryId');
  } else if (subcategoryId != null) {
    b.write('subcategoryId=$subcategoryId');
  } else {
    b.write('categoryId=$categoryId');
  }
  b.write('&title=${Uri.encodeComponent(title)}');
  return b.toString();
}

String brandLocation(String id, String title) => '/products?brandId=$id&title=${Uri.encodeComponent(title)}';

String searchListingLocation(String q) => '/products?search=${Uri.encodeComponent(q)}&title=${Uri.encodeComponent(q)}';

/// مطابقة محلية فورية على شجرة الأقسام (3 مستويات) والبراندات المخزّنة.
MergedSuggestions localSuggestEntries(String q, List<Category> roots, List<Brand> brands, String lang) {
  if (normalizeQuery(q).length < 2) return const MergedSuggestions();
  final cats = <SuggestEntry>[];

  void add(Category node, String? path, String location, int levelBoost) {
    final fields = [node.name, node.nameAr, node.nameEn, node.slug];
    if (!textMatchesQuery(q, fields)) return;
    cats.add(
      SuggestEntry(
        kind: SuggestKind.category,
        id: node.id,
        title: node.localizedName(lang),
        subtitle: path,
        imageUrl: node.imageUrl,
        location: location,
        score: matchScore(q, fields) + levelBoost,
      ),
    );
  }

  for (final root in roots.where((c) => c.parentId == null)) {
    final rootName = root.localizedName(lang);
    add(root, null, categoryLocation(title: rootName, categoryId: root.id), 6);
    for (final sub in root.children) {
      final subName = sub.localizedName(lang);
      add(sub, rootName, categoryLocation(title: subName, subcategoryId: sub.id), 3);
      for (final ter in sub.children) {
        final terName = ter.localizedName(lang);
        add(
          ter,
          '$rootName › $subName',
          categoryLocation(title: terName, subcategoryId: sub.id, tertiaryCategoryId: ter.id),
          0,
        );
      }
    }
  }

  final brandHits = <SuggestEntry>[];
  for (final brand in brands) {
    final fields = [brand.name, brand.nameAr, brand.nameEn, brand.slug];
    if (!textMatchesQuery(q, fields)) continue;
    final title = brand.localizedName(lang);
    brandHits.add(
      SuggestEntry(
        kind: SuggestKind.brand,
        id: brand.id,
        title: title,
        imageUrl: brand.logoUrl,
        location: brandLocation(brand.id, title),
        score: matchScore(q, fields),
      ),
    );
  }

  return MergedSuggestions(categories: cats, brands: brandHits);
}

/// دمج المحلي مع الخادم: إزالة التكرار بالمعرّف ثم بالاسم المطبّع،
/// وإثراء عناصر الخادم بالصورة/الاسم المحلي حين تتوفر في الكاش.
MergedSuggestions mergeSuggestions({
  required MergedSuggestions local,
  SearchSuggestions? remote,
  List<Category> roots = const [],
  List<Brand> brands = const [],
  String lang = 'ar',
  int maxCategories = 4,
  int maxBrands = 4,
}) {
  final rootsById = {for (final c in roots) c.id: c};
  final brandsById = {for (final b in brands) b.id: b};

  final serverCats = <SuggestEntry>[];
  for (final (i, c) in (remote?.categories ?? const <SuggestRef>[]).indexed) {
    final known = rootsById[c.id];
    final title = known?.localizedName(lang) ?? c.name;
    serverCats.add(
      SuggestEntry(
        kind: SuggestKind.category,
        id: c.id,
        title: title,
        imageUrl: known?.imageUrl ?? '',
        location: categoryLocation(title: title, categoryId: c.id),
        score: 60 - i,
        fromServer: true,
      ),
    );
  }
  final serverBrands = <SuggestEntry>[];
  for (final (i, b) in (remote?.brands ?? const <SuggestRef>[]).indexed) {
    final known = brandsById[b.id];
    final title = known?.localizedName(lang) ?? b.name;
    serverBrands.add(
      SuggestEntry(
        kind: SuggestKind.brand,
        id: b.id,
        title: title,
        imageUrl: known?.logoUrl ?? '',
        location: brandLocation(b.id, title),
        score: 60 - i,
        fromServer: true,
      ),
    );
  }

  return MergedSuggestions(
    categories: dedupeEntries([...local.categories, ...serverCats], maxCategories),
    brands: dedupeEntries([...local.brands, ...serverBrands], maxBrands),
  );
}

/// يحافظ على أعلى درجة لكل عنصر؛ عنصر يطابقه المحلي والخادم معاً يحصل على دفعة.
List<SuggestEntry> dedupeEntries(List<SuggestEntry> items, int max) {
  final byKey = <String, SuggestEntry>{};
  final keyByTitle = <String, String>{};
  for (final e in items) {
    final titleKey = '${e.kind.name}:${normalizeQuery(e.title)}';
    final existingKey = byKey.containsKey(e.key) ? e.key : keyByTitle[titleKey];
    if (existingKey == null) {
      byKey[e.key] = e;
      keyByTitle[titleKey] = e.key;
      continue;
    }
    final prev = byKey[existingKey]!;
    final confirmed = prev.fromServer != e.fromServer;
    final best = e.score > prev.score ? e : prev;
    // نحتفظ بالعنصر المحلي إن وُجد (صورة + مسار أدق) مع رفع درجته.
    final keep = !prev.fromServer ? prev : (!e.fromServer ? e : best);
    byKey[existingKey] = keep.copyWith(
      score: best.score + (confirmed ? 15 : 0),
      fromServer: prev.fromServer && e.fromServer,
    );
  }
  final out = byKey.values.toList()..sort((a, b) => b.score.compareTo(a.score));
  return out.take(max).toList(growable: false);
}

/// هل يستحق التصحيح الإملائي الظهور؟ فقط إن اختلف عمّا كُتب **وكان قريباً منه فعلاً**.
/// (تصحيح الخادم أحياناً بعيد تماماً — "maskara" ← "PHYTO Color" — فلا نعرضه.)
bool shouldOfferCorrection(String query, String? corrected) {
  if (corrected == null) return false;
  final a = normalizeQuery(query);
  final b = normalizeQuery(corrected);
  if (b.isEmpty || a == b) return false;
  var best = _dice(a, b);
  for (final word in b.split(' ')) {
    final d = _dice(a, word);
    if (d > best) best = d;
  }
  return best >= 0.45;
}

/// تشابه Dice على أزواج الحروف (0..1).
double _dice(String a, String b) {
  if (a.length < 2 || b.length < 2) return a == b ? 1 : 0;
  final pa = <String>[for (var i = 0; i < a.length - 1; i++) a.substring(i, i + 2)];
  final pb = <String>[for (var i = 0; i < b.length - 1; i++) b.substring(i, i + 2)];
  final pool = List<String>.of(pb);
  var hits = 0;
  for (final x in pa) {
    if (pool.remove(x)) hits++;
  }
  return 2 * hits / (pa.length + pb.length);
}
