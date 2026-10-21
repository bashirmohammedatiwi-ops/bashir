import 'dart:convert';

import 'package:dio/dio.dart';

import '../data/models.dart';
import 'api.dart';

/// نتيجة البحث بالصورة (مثل «البحث بالصورة» في المتصفح) — بلا ذكاء اصطناعي.
class ReverseImageResult {
  ReverseImageResult({
    required this.imageUrl,
    required this.tags,
    required this.sameImage,
    required this.sites,
    required this.similar,
    this.ocr = '',
    this.barcode,
  });

  /// رابط عام للصورة المرفوعة — يُفتح به Google Lens.
  final String imageUrl;

  /// كلمات تصف ما في الصورة (اسم المنتج غالباً).
  final List<String> tags;

  /// نفس الصورة بأحجام أكبر.
  final List<WebImage> sameImage;

  /// مواقع ومتاجر فيها هذه الصورة (بصورتها الأصلية بدقة عالية).
  final List<WebImage> sites;

  /// صور مشابهة.
  final List<WebImage> similar;

  /// نص مقروء من الصورة.
  final String ocr;

  /// باركود ظاهر في الصورة.
  final String? barcode;

  /// أفضل جملة بحث: أول وسم بحروف لاتينية أو عربية (بعض الوسوم روسية).
  String? get bestQuery {
    for (final t in tags) {
      if (!RegExp(r'[Ѐ-ӿ]').hasMatch(t)) return t;
    }
    return tags.isEmpty ? null : tags.first;
  }

  List<WebImage> get allImages {
    final seen = <String>{};
    return [...sameImage, ...sites, ...similar].where((w) => seen.add(w.url)).toList();
  }

  String get googleLensUrl => 'https://lens.google.com/uploadbyurl?url=${Uri.encodeComponent(imageUrl)}';
}

/// البحث بالصورة يتم من الهاتف مباشرة (اتصال عادي مثل المتصفح) — خوادم البيانات تُطلب منها كابتشا.
class ReverseImageSearch {
  static const _base = 'https://yandex.com/images/search';
  static const _ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  static final _dio = Dio(
    BaseOptions(
      headers: {'User-Agent': _ua, 'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'},
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 40),
      sendTimeout: const Duration(seconds: 40),
      responseType: ResponseType.plain,
      validateStatus: (s) => s != null && s < 500,
    ),
  );

  static Future<ReverseImageResult> search(List<int> jpeg) async {
    try {
      // ١) رفع الصورة
      final req = Uri.encodeComponent(
        jsonEncode({
          'blocks': [
            {'block': 'b-page_type_search-by-image__link'},
          ],
        }),
      );
      final up = await _dio.post<String>(
        '$_base?rpt=imageview&format=json&request=$req',
        data: FormData.fromMap({
          'upfile': MultipartFile.fromBytes(jpeg, filename: 'photo.jpg', contentType: DioMediaType('image', 'jpeg')),
        }),
      );
      final upJson = jsonDecode(up.data ?? '{}') as Map<String, dynamic>;
      if (upJson['type'] == 'captcha') throw ApiError('خدمة البحث بالصورة مشغولة الآن — جرّب بعد قليل أو افتح في Google Lens');
      final params = (((upJson['blocks'] as List?)?.firstOrNull as Map?)?['params'] as Map?) ?? const {};
      final cbirId = params['cbirId']?.toString();
      final imageUrl = params['originalImageUrl']?.toString();
      if (cbirId == null || imageUrl == null) throw ApiError('تعذّر رفع الصورة للبحث');

      // ٢) صفحة النتائج
      final res = await _dio.get<String>(_base, queryParameters: {'rpt': 'imageview', 'cbir_id': cbirId, 'url': imageUrl});
      final html = res.data ?? '';
      if (RegExp('showcaptcha|"type":"captcha"').hasMatch(html)) {
        throw ApiError('خدمة البحث بالصورة طلبت تحققاً — افتح في Google Lens');
      }
      return parse(html, imageUrl);
    } on DioException catch (e) {
      throw e.response == null ? ApiError('تعذّر الاتصال بخدمة البحث بالصورة — تحقق من الإنترنت') : ApiError('تعذّر البحث بالصورة الآن');
    }
  }

  /// يقرأ حالة الصفحة (JSON داخل data-state) — دالة نقية قابلة للاختبار.
  static ReverseImageResult parse(String html, String imageUrl) {
    Map<String, dynamic>? st;
    for (final m in RegExp(r'data-state="([^"]+)"').allMatches(html)) {
      final raw = _unescape(m.group(1)!);
      if (!raw.contains('cbirSites') && !raw.contains('cbirSimilar')) continue;
      try {
        final j = jsonDecode(raw) as Map<String, dynamic>;
        if (j['initialState'] is Map) {
          st = Map<String, dynamic>.from(j['initialState'] as Map);
          break;
        }
      } catch (_) {}
    }
    if (st == null) throw ApiError('لم نجد نتائج لهذه الصورة — صوّر المنتج من الأمام وبإضاءة جيدة');

    String abs(String? u) => u == null || u.isEmpty ? '' : (u.startsWith('//') ? 'https:$u' : u);
    String host(String u) {
      try {
        return Uri.parse(u).host.replaceFirst('www.', '');
      } catch (_) {
        return '';
      }
    }

    int? n(dynamic v) => v is num ? v.toInt() : int.tryParse('$v');

    final tags = <String>[
      for (final t in (st['cbirTags']?['tags'] as List? ?? const []))
        if (t is Map && '${t['text'] ?? ''}'.trim().isNotEmpty) '${t['text']}'.trim(),
    ];

    // نفس الصورة بأحجام أخرى — الأكبر أولاً
    final sizes = <WebImage>[];
    final groups = st['cbirOtherSizes']?['items'];
    if (groups is Map) {
      for (final g in ['large_dups', 'medium_dups', 'small_dups']) {
        for (final it in (groups[g] as List? ?? const [])) {
          if (it is! Map) continue;
          final u = abs(it['url']?.toString());
          if (!u.startsWith('http')) continue;
          final size = '${it['text'] ?? ''}'.split('×');
          sizes.add(WebImage(u, u, null, host(u), width: n(size.firstOrNull), height: n(size.length > 1 ? size[1] : null)));
        }
      }
    }

    final sites = <WebImage>[];
    for (final s in (st['cbirSites']?['sites'] as List? ?? const [])) {
      if (s is! Map) continue;
      final orig = s['originalImage'] as Map?;
      final u = abs(orig?['url']?.toString());
      if (!u.startsWith('http')) continue;
      sites.add(
        WebImage(
          u,
          abs((s['thumb'] as Map?)?['url']?.toString()).isEmpty ? u : abs((s['thumb'] as Map?)?['url']?.toString()),
          '${s['title'] ?? ''}',
          '${s['domain'] ?? host('${s['url']}')}',
          link: s['url']?.toString(),
          width: n(orig?['width']),
          height: n(orig?['height']),
        ),
      );
    }

    final similar = <WebImage>[];
    for (final t in (st['cbirSimilar']?['thumbs'] as List? ?? const [])) {
      if (t is! Map) continue;
      final thumb = abs(t['imageUrl']?.toString());
      final link = '${t['linkUrl'] ?? ''}';
      final q = Uri.tryParse(link.startsWith('/') ? 'https://yandex.com$link' : link)?.queryParameters ?? const {};
      final orig = q['img_url'] ?? thumb;
      if (!orig.startsWith('http')) continue;
      similar.add(WebImage(orig, thumb.isEmpty ? orig : thumb, '${t['title'] ?? ''}', host(orig)));
    }

    final ocr = '${st['cbirOcr']?['plainText'] ?? ''}'.trim();
    String? barcode;
    final codes = jsonEncode(st['cbirBarcode'] ?? const {});
    final bm = RegExp(r'(?<!\d)(\d{8,14})(?!\d)').firstMatch(codes);
    if (bm != null) barcode = bm.group(1);

    return ReverseImageResult(imageUrl: imageUrl, tags: tags, sameImage: sizes, sites: sites, similar: similar, ocr: ocr, barcode: barcode);
  }

  static String _unescape(String s) =>
      s.replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
}
