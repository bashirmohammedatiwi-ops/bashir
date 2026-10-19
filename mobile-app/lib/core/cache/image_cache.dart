import 'dart:async';
import 'dart:collection';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:path_provider/path_provider.dart';

import '../../data/models/media.dart';
import '../perf/device_perf.dart';
import '../utils/media_url.dart';

/// مدير كاش الصور على القرص.
///
/// ملفات /media بأسماء من بصمة المحتوى ويرسلها السيرفر `immutable` لسنة، وكل رابط من
/// التطبيق يحمل `?v=<updatedAt>`: صورة استُبدلت تأتي برابط جديد، فلا داعي لحذف الكاش
/// يومياً (مدة 12 ساعة كانت تعيد تنزيل كل الصور كل يوم). 45 يوماً لما لم يُفتح منذ مدة.
class AppImageCacheManager extends CacheManager with ImageCacheManager {
  static const _key = 'alhayaaImages_v4';

  /// مفاتيح كاش قديمة — تُحذف ملفاتها مرة بعد الإقلاع (v3 كان فيه نسخ PNG مكرّرة).
  static const _oldKeys = ['alhayaaImages_v3', 'alhayaaImages_v2', 'alhayaaImages_v1', 'alhayaaImages'];

  static final AppImageCacheManager instance = AppImageCacheManager._();

  AppImageCacheManager._()
      : super(
          Config(
            _key,
            stalePeriod: const Duration(days: 45),
            maxNrOfCacheObjects: DevicePerf.pick(low: 1200, mid: 2000, high: 2500),
            fileService: kIsWeb ? HttpFileService() : _ImageFileService(),
          ),
        ) {
    // تنظيف مجلدات النسخ القديمة بعد استقرار التشغيل (لا يعمل داخل الاختبارات).
    if (!kIsWeb && !Platform.environment.containsKey('FLUTTER_TEST')) Timer(const Duration(seconds: 30), _purgeOldCaches);
  }

  static Future<void> _purgeOldCaches() async {
    try {
      final tmp = await getTemporaryDirectory();
      final support = await getApplicationSupportDirectory();
      for (final key in _oldKeys) {
        final dir = Directory('${tmp.path}/$key');
        if (await dir.exists()) await dir.delete(recursive: true);
        for (final suffix in const ['.db', '.db-journal', '.db-wal', '.db-shm', '.json']) {
          final f = File('${support.path}/$key$suffix');
          if (await f.exists()) await f.delete();
        }
      }
    } catch (_) {
      // تنظيف اختياري — لا يهم إن فشل.
    }
  }
}

/// تنزيل الصور بمهلات: بدونها اتصال عالق على شبكة ضعيفة يبقى «يحمّل» إلى الأبد
/// ويحجز مكاناً من التنزيلات المتزامنة.
class _ImageFileService extends FileService {
  final HttpClient _client = HttpClient()
    ..connectionTimeout = const Duration(seconds: 8)
    ..idleTimeout = const Duration(seconds: 15);

  @override
  Future<FileServiceResponse> get(String url, {Map<String, String>? headers}) async {
    final request = await _client.getUrl(Uri.parse(url));
    headers?.forEach(request.headers.set);
    final response = await request.close();
    return _ImageFileResponse(response);
  }
}

/// مثل HttpGetResponse في المكتبة، لكن فوق HttpClient من dart:io مباشرة.
class _ImageFileResponse implements FileServiceResponse {
  _ImageFileResponse(this._response);

  final HttpClientResponse _response;
  final DateTime _receivedTime = DateTime.now();

  /// انقطاع البيانات وسط التنزيل أكثر من هذا = فشل (تعيد الويدجت المحاولة لاحقاً).
  static const _stallTimeout = Duration(seconds: 20);

  /// الترويسة قد تتكرر (nginx يرسل cache-control مرتين) — نجمع القيم كما تفعل http.
  String? _header(String name) {
    final values = _response.headers[name];
    if (values == null || values.isEmpty) return null;
    return values.join(',');
  }

  @override
  Stream<List<int>> get content => _response.timeout(
        _stallTimeout,
        onTimeout: (sink) {
          sink.addError(TimeoutException('image download stalled', _stallTimeout));
          sink.close();
        },
      );

  @override
  int? get contentLength => _response.contentLength >= 0 ? _response.contentLength : null;

  @override
  int get statusCode => _response.statusCode;

  @override
  DateTime get validTill {
    var age = const Duration(days: 7);
    final control = _header(HttpHeaders.cacheControlHeader);
    if (control != null) {
      for (final raw in control.split(',')) {
        final setting = raw.trim().toLowerCase();
        if (setting == 'no-cache') age = Duration.zero;
        if (setting.startsWith('max-age=')) {
          final seconds = int.tryParse(setting.substring(8)) ?? 0;
          if (seconds > 0) age = Duration(seconds: seconds);
        }
      }
    }
    return _receivedTime.add(age);
  }

  @override
  String? get eTag => _header(HttpHeaders.etagHeader);

  @override
  String get fileExtension {
    final type = _header(HttpHeaders.contentTypeHeader);
    if (type == null) return '';
    final sub = type.split(';').first.split('/').last.trim().toLowerCase();
    return switch (sub) {
      'jpeg' || 'jpg' || 'pjpeg' => '.jpg',
      'svg+xml' => '.svg',
      '' => '',
      _ when RegExp(r'^[a-z0-9]{2,5}$').hasMatch(sub) => '.$sub',
      _ => '',
    };
  }
}

/// يضبط حدود كاش Flutter للصور في الذاكرة حسب قدرة الجهاز (لا مقاس الشاشة).
///
/// الصور تُفكّ بحجم عرضها الفعلي. يُستدعى قبل معرفة مستوى الجهاز (التخزين يُهيّأ قبل
/// DevicePerf.init)، فنعيد الضبط بعد أول إطار — حين صار المستوى معروفاً.
void configureImageCache() {
  _applyImageCacheLimits();
  WidgetsBinding.instance.addPostFrameCallback((_) => _applyImageCacheLimits());
}

void _applyImageCacheLimits() {
  final cache = PaintingBinding.instance.imageCache;
  cache.maximumSize = DevicePerf.pick(low: 320, mid: 500);
  cache.maximumSizeBytes = DevicePerf.pick(low: 48, mid: 80, high: 120) << 20;
}

/// يحسب عرض الكاش المناسب حسب حجم العرض على الشاشة.
int cachePixelWidth(BuildContext context, double? layoutWidth) {
  final dpr = MediaQuery.devicePixelRatioOf(context);
  if (layoutWidth != null && layoutWidth.isFinite && layoutWidth > 0) {
    return _bucket((layoutWidth * dpr).round()).clamp(64, 1600);
  }
  final screenW = MediaQuery.sizeOf(context).width;
  return (screenW * dpr * 0.48).round().clamp(200, 1000);
}

/// تقريب لأعلى إلى خطوة ثابتة: عروض متقاربة (بطاقة 156 في صف و158 في شبكة) أو صندوق
/// يتغيّر عرضه أثناء حركة تشترك في نسخة مفكوكة واحدة بدل فكّ جديد لكل بكسل.
int _bucket(int px) {
  final step = px < 256 ? 32 : 64;
  return (px + step - 1) ~/ step * step;
}

/// الرابط الذي ستنزّله الويدجت فعلاً لصورة بعرض منطقي [layoutWidth] — نفس اختيار
/// المقاس في AppNetworkImage، حتى يسخّن الكاش الملف نفسه الذي سيُعرض.
String displayedImageUrl(BuildContext context, String url, double layoutWidth) {
  final resolved = resolveMediaUrl(url);
  if (resolved.isEmpty) return resolved;
  return mediaVariantFor(resolved, cachePixelWidth(context, layoutWidth));
}

/// تسخين كاش القرص لصورة واحدة: تنزيل الملف فقط، بلا فكّ.
///
/// الفكّ يحدث عند العرض بحجم الويدجت الفعلي — فكّ مسبق بحجم مخمَّن كان نسخة ثانية
/// في الذاكرة لا يقرؤها أحد. مع [layoutWidth] يُسخَّن المقاس الذي سيُعرض.
Future<void> precacheAppImage(
  BuildContext context,
  String url, {
  double? layoutWidth,
}) =>
    _warm(layoutWidth == null ? resolveMediaUrl(url) : displayedImageUrl(context, url, layoutWidth));

/// تسخين كاش القرص لأغلفة منتجات القائمة — بطابور محدود لا يزاحم الصور الظاهرة.
///
/// [layoutWidth]: عرض الصورة المنطقي التقريبي — يحدّد المقاس (thumb/small/…) المسخَّن.
void precacheProductCovers(
  BuildContext context,
  Iterable<String> urls, {
  int limit = 24,
  double layoutWidth = 180,
}) {
  warmImageDiskCache(
    urls.where((u) => u.isNotEmpty).take(limit).map((u) => displayedImageUrl(context, u, layoutWidth)),
  );
}

/// أقصى عدد تنزيلات تسخين متزامنة — الباقي ينتظر دوره.
const _maxWarmInFlight = 4;

final _warmQueue = Queue<String>();
final _warmPending = <String, Completer<void>>{};
var _warmInFlight = 0;

/// يفرّغ ما لم يبدأ تنزيله من طابور التسخين (التنزيلات الجارية تكتمل) — يُستدعى قبل
/// دفعة جديدة حتى لا تنتظر صور الشاشة الحالية خلف روابط شاشة سابقة.
void clearWarmQueue() {
  for (final url in _warmQueue) {
    _warmPending.remove(url)?.complete();
  }
  _warmQueue.clear();
}

/// يضيف روابط لطابور تسخين كاش القرص (بلا تكرار) — 4 تنزيلات على الأكثر في آن واحد.
///
/// يكتمل حين تنتهي روابط هذه الدفعة (نجاحاً أو فشلاً أو إزالةً من الطابور).
Future<void> warmImageDiskCache(Iterable<String> urls) {
  final waits = <Future<void>>[];
  for (final raw in urls) {
    final url = resolveMediaUrl(raw);
    if (url.isEmpty) continue;
    final pending = _warmPending[url];
    if (pending != null) {
      waits.add(pending.future);
      continue;
    }
    final completer = Completer<void>();
    _warmPending[url] = completer;
    _warmQueue.add(url);
    waits.add(completer.future);
  }
  _pumpWarmQueue();
  return waits.isEmpty ? Future.value() : Future.wait(waits).then((_) {});
}

void _pumpWarmQueue() {
  while (_warmInFlight < _maxWarmInFlight && _warmQueue.isNotEmpty) {
    final url = _warmQueue.removeFirst();
    _warmInFlight++;
    _warm(url).whenComplete(() {
      _warmInFlight--;
      final done = _warmPending.remove(url);
      if (done != null && !done.isCompleted) done.complete();
      _pumpWarmQueue();
    });
  }
}

/// ملف موجود حديث يعود من القرص فوراً؛ الأخطاء (لا إنترنت، 404) تُتجاهل —
/// الويدجت نفسها تعيد المحاولة وتعرض البديل عند الحاجة.
Future<void> _warm(String url) async {
  if (url.isEmpty) return;
  try {
    await AppImageCacheManager.instance.getSingleFile(url);
  } catch (_) {}
}
