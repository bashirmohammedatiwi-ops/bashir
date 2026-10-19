import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../cache/api_cache.dart';
import '../config/app_config.dart';

/// مخزن آمن لتوكنات الدخول.
class TokenStore {
  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';
  final FlutterSecureStorage _storage;
  String? _accessCache;

  /// يزداد كلما رفض الخادم تجديد الجلسة فمُسحت التوكنات — يستمع له AuthNotifier
  /// ليعود زائراً (بلا اعتماد دائري بين dioProvider و authProvider).
  final ValueNotifier<int> sessionExpired = ValueNotifier(0);

  TokenStore(this._storage);

  Future<String?> get access async => _accessCache ??= await _safeRead(_accessKey);
  Future<String?> get refresh => _safeRead(_refreshKey);

  Future<void> save({required String access, required String refresh}) async {
    _accessCache = access;
    await _storage.write(key: _accessKey, value: access);
    await _storage.write(key: _refreshKey, value: refresh);
  }

  Future<void> clear() async {
    _accessCache = null;
    try {
      await _storage.delete(key: _accessKey);
      await _storage.delete(key: _refreshKey);
    } catch (e) {
      debugPrint('[TokenStore] delete failed, wiping storage: $e');
      try {
        await _storage.deleteAll();
      } catch (_) {}
    }
  }

  Future<bool> get hasSession async => (await refresh)?.isNotEmpty ?? false;

  /// قراءة لا ترمي أبداً: إن تعطّل مخزن المفاتيح (تحديث نظام، استعادة نسخة احتياطية)
  /// نمسحه ونكمل كزائرة بدل أن تعلق شاشة الافتتاح للأبد.
  Future<String?> _safeRead(String key) async {
    try {
      return await _storage.read(key: key);
    } catch (e) {
      debugPrint('[TokenStore] read failed, resetting: $e');
      await clear();
      return null;
    }
  }
}

final secureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true, resetOnError: true),
  ),
);

final tokenStoreProvider = Provider<TokenStore>(
  (ref) => TokenStore(ref.read(secureStorageProvider)),
);

/// يُعيَّن من main() بعد تهيئة SharedPreferences.
final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw StateError('SharedPreferences not initialized — call initAppStorage() in main()');
});

final apiCacheProvider = Provider<ApiCache>(
  (ref) => ApiCache(ref.read(sharedPreferencesProvider)),
);

const _defaultHeaders = {
  'Accept': 'application/json',
  'Accept-Encoding': 'gzip',
  // السيرفر يرسل للتطبيق بطاقات خفيفة (صورة غلاف webp، بلا أوصاف) — انظر
  // backend MobilePayloadInterceptor.
  'X-Client': 'deema-app',
};

/// مسارات يعني فيها 401 «بيانات خاطئة» لا «انتهت الجلسة» — لا تجديد ولا إعادة عليها.
const _noRefreshPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/change-password',
];

/// Dio بلا معترضات: للتجديد وإعادة الطلب وطلبات الخروج — لا يدخل في حلقة 401
/// ولا ينتظر نفسه داخل onError.
Dio _bareDio({Duration? timeout}) => Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: timeout ?? AppConfig.connectTimeout,
        receiveTimeout: timeout ?? AppConfig.receiveTimeout,
        sendTimeout: timeout ?? AppConfig.sendTimeout,
        headers: _defaultHeaders,
        responseType: ResponseType.json,
      ),
    );

/// يستخرج زوج التوكنات من ردّ الخادم (`{data: {...}}` أو الجسم مباشرة).
({String access, String refresh})? _tokenPair(dynamic body) {
  final data = body is Map && body['data'] is Map ? body['data'] : body;
  if (data is! Map) return null;
  final access = data['accessToken']?.toString() ?? '';
  final refresh = data['refreshToken']?.toString() ?? '';
  if (access.isEmpty || refresh.isEmpty) return null;
  return (access: access, refresh: refresh);
}

/// نتيجة محاولة تجديد الجلسة: توكن وصول جديد، أو خطأ عابر (شبكة/خادم) لم يمسّ الجلسة.
typedef _RefreshResult = ({String? access, DioException? transient});

/// يجدّد الجلسة بتوكن التجديد المحفوظ. لا يمسح التوكنات إلا إن رفضها الخادم نفسه
/// (401/403)؛ انقطاع الشبكة أو 5xx أو 429 يُبقي الجلسة كما هي.
Future<_RefreshResult> _refreshSession(TokenStore tokens, Dio bare) async {
  final refresh = await tokens.refresh;
  if (refresh == null || refresh.isEmpty) return (access: null, transient: null);
  try {
    final resp = await bare.post('/auth/refresh', data: {'refreshToken': refresh});
    final pair = _tokenPair(resp.data);
    if (pair == null) return (access: null, transient: null);
    await tokens.save(access: pair.access, refresh: pair.refresh);
    return (access: pair.access, transient: null);
  } on DioException catch (e) {
    final code = e.response?.statusCode;
    if (code == 401 || code == 403) {
      // لا نمسح جلسة أحدث حُفظت أثناء الطلب (دخول جديد مثلاً).
      if (await tokens.refresh == refresh) {
        await tokens.clear();
        tokens.sessionExpired.value++;
      }
      return (access: null, transient: null);
    }
    return (access: null, transient: e);
  } catch (_) {
    return (access: null, transient: null);
  }
}

/// Dio مُهيّأ مع إرفاق التوكن وتجديده تلقائياً عند 401.
final dioProvider = Provider<Dio>((ref) {
  final tokens = ref.read(tokenStoreProvider);
  final bare = _bareDio();
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      sendTimeout: AppConfig.sendTimeout,
      headers: _defaultHeaders,
      responseType: ResponseType.json,
      persistentConnection: true,
    ),
  );

  // تجديد واحد في كل لحظة: طلبات 401 المتزامنة تنتظر النتيجة نفسها، لأن الخادم
  // يدوّر توكن التجديد فيفشل أي تجديد ثانٍ بالتوكن القديم.
  Future<_RefreshResult>? refreshing;

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      if (options.extra['auth'] != false) {
        final token = await tokens.access;
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
      }
      handler.next(options);
    },
    onResponse: (response, handler) async {
      // تغيير كلمة المرور يُنهي كل الجلسات ويعيد جلسة جديدة لهذا الجهاز — نحفظها
      // هنا كي لا تُطرد الزبونة بعد انتهاء توكن الوصول، أياً كانت الشاشة المستدعية.
      if (response.requestOptions.uri.path.endsWith('/auth/change-password')) {
        final pair = _tokenPair(response.data);
        if (pair != null) {
          try {
            await tokens.save(access: pair.access, refresh: pair.refresh);
          } catch (e) {
            debugPrint('[dio] saving rotated tokens failed: $e');
          }
        }
      }
      handler.next(response);
    },
    onError: (err, handler) async {
      final req = err.requestOptions;
      final path = req.uri.path;
      if (err.response?.statusCode != 401 ||
          _noRefreshPaths.any(path.endsWith) ||
          req.extra['retried'] == true ||
          req.extra['auth'] == false) {
        return handler.next(err);
      }

      // إن تغيّر التوكن أثناء تحليق الطلب (جدّده طلب آخر) نعيد به مباشرة بلا تجديد.
      final sent = req.headers['Authorization']?.toString();
      final current = await tokens.access;
      String? access;
      if (current != null && current.isNotEmpty && sent != 'Bearer $current') {
        access = current;
      } else {
        final pending = refreshing ??=
            _refreshSession(tokens, bare).whenComplete(() => refreshing = null);
        final result = await pending;
        access = result.access;
        final transient = result.transient;
        if (access == null && transient != null) {
          // تعذّر التجديد لسبب عابر: نُظهر سببه الحقيقي (لا اتصال / الخادم مشغول)
          // بدل 401 الأصلي الذي يُفهم «كلمة المرور خاطئة» أو «انتهت الجلسة».
          return handler.next(DioException(
            requestOptions: req,
            response: transient.response,
            type: transient.type,
            error: transient.error,
            message: transient.message,
          ));
        }
      }
      if (access == null) return handler.next(err);

      // إعادة الطلب عبر Dio المجرّد مرة واحدة فقط — وفشلها لا يمسّ التوكنات أبداً.
      try {
        final data = req.data;
        final retry = req.copyWith(
          headers: {...req.headers, 'Authorization': 'Bearer $access'},
          extra: {...req.extra, 'retried': true},
          data: data is FormData ? data.clone() : null,
        );
        return handler.resolve(await bare.fetch(retry));
      } on DioException catch (e) {
        return handler.next(e);
      }
    },
  ));

  return dio;
});

/// يُبطل الجلسة ويفصل الجهاز عن الحساب على الخادم بعد أن خرجت الزبونة محلياً.
/// لا تنتظره الواجهة: Dio مستقل بتوكن صريح (المخزن صار فارغاً)، مهلة 5 ثوانٍ لكل
/// طلب، وكل الأخطاء مُبتلعة. إن انتهى توكن الوصول نجدّد مرة واحدة ثم نُبطل الجديدة.
Future<void> revokeSessionInBackground({
  String? refresh,
  String? access,
  String? pushToken,
}) async {
  final hasRefresh = refresh != null && refresh.isNotEmpty;
  final hasPush = pushToken != null && pushToken.isNotEmpty;
  if (!hasRefresh && !hasPush) return;

  const timeout = Duration(seconds: 5);
  final dio = _bareDio(timeout: timeout);

  /// نفس طلبَي ApiService.unregisterDevice و ApiService.logout. يعيد true إن رُفض
  /// توكن الوصول (401).
  Future<bool> revokeWith(String? bearer, String? refreshToken) async {
    final options = Options(headers: {
      if (bearer != null && bearer.isNotEmpty) 'Authorization': 'Bearer $bearer',
    });
    var unauthorized = false;
    Future<void> send(Future<Response<dynamic>> Function() call) async {
      try {
        await call().timeout(timeout);
      } on DioException catch (e) {
        if (e.response?.statusCode == 401) unauthorized = true;
      } catch (_) {}
    }

    await Future.wait([
      if (hasPush)
        send(() => dio.delete(
              '/notifications/devices',
              data: {'token': pushToken},
              options: options,
            )),
      if (refreshToken != null && refreshToken.isNotEmpty)
        send(() => dio.post(
              '/auth/logout',
              data: {'refreshToken': refreshToken},
              options: options,
            )),
    ]);
    return unauthorized;
  }

  try {
    final expired = await revokeWith(access, refresh);
    if (!expired || !hasRefresh) return;
    final resp = await dio
        .post('/auth/refresh', data: {'refreshToken': refresh})
        .timeout(timeout);
    final pair = _tokenPair(resp.data);
    if (pair != null) await revokeWith(pair.access, pair.refresh);
  } catch (_) {
    // الجلسة انتهت أصلاً (401) أو لا اتصال — لا شيء آخر يمكن فعله.
  } finally {
    dio.close();
  }
}
