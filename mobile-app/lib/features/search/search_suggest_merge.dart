import 'smart_query.dart';

/// مسار قائمة منتجات قسم (رئيسي/فرعي/دقيق) بعنوانه.
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

/// مسار قائمة منتجات براند بعنوانه.
String brandLocation(String id, String title) => '/products?brandId=$id&title=${Uri.encodeComponent(title)}';

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
