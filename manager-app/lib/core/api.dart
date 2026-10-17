import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'config.dart';

/// خطأ مفهوم للمستخدم (رسالة السيرفر بالعربي إن وجدت).
class ApiError implements Exception {
  ApiError(this.message, {this.status});
  final String message;
  final int? status;
  bool get isNetwork => status == null;
  @override
  String toString() => message;
}

class TokenStore {
  static const _a = 'mgr_access';
  static const _r = 'mgr_refresh';
  final _storage = const FlutterSecureStorage();
  String? _access;

  Future<String?> get access async => _access ??= await _storage.read(key: _a);
  Future<String?> get refresh => _storage.read(key: _r);

  Future<void> save(String access, String refresh) async {
    _access = access;
    await _storage.write(key: _a, value: access);
    await _storage.write(key: _r, value: refresh);
  }

  Future<void> clear() async {
    _access = null;
    await _storage.delete(key: _a);
    await _storage.delete(key: _r);
  }
}

/// عميل HTTP واحد للتطبيق: يرفق التوكن، يجدده قبل انتهائه، ويعيد المحاولة مرة عند 401.
class Api {
  Api() {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBase,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 60),
        sendTimeout: const Duration(seconds: 120),
        headers: {'Accept': 'application/json'},
      ),
    );
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (options.extra['auth'] != false) {
            var token = await tokens.access;
            if (token != null && _expiringSoon(token)) {
              await _refresh();
              token = await tokens.access;
            }
            if (token != null) options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (e, handler) async {
          final req = e.requestOptions;
          if (e.response?.statusCode == 401 && req.extra['auth'] != false && req.extra['retried'] != true) {
            if (await _refresh()) {
              req.extra['retried'] = true;
              req.headers['Authorization'] = 'Bearer ${await tokens.access}';
              try {
                return handler.resolve(await dio.fetch(req));
              } on DioException catch (e2) {
                return handler.next(e2);
              }
            }
            _sessionExpired.add(null);
          }
          handler.next(e);
        },
      ),
    );
  }

  late final Dio dio;
  final tokens = TokenStore();
  final _sessionExpired = StreamController<void>.broadcast();
  Stream<void> get sessionExpired => _sessionExpired.stream;
  Completer<bool>? _inflight;

  bool _expiringSoon(String jwt) {
    try {
      final parts = jwt.split('.');
      final payload = jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(parts[1])))) as Map;
      final exp = (payload['exp'] as num).toInt();
      return DateTime.fromMillisecondsSinceEpoch(exp * 1000).isBefore(DateTime.now().add(const Duration(seconds: 60)));
    } catch (_) {
      return false;
    }
  }

  /// تجديد واحد في نفس الوقت — طلبات متوازية بعد المسح لا تُبطل بعضها.
  Future<bool> _refresh() async {
    if (_inflight != null) return _inflight!.future;
    final done = Completer<bool>();
    _inflight = done;
    try {
      final r = await tokens.refresh;
      if (r == null || r.isEmpty) {
        done.complete(false);
      } else {
        final res = await dio.post(
          '/auth/refresh',
          data: {'refreshToken': r},
          options: Options(extra: {'auth': false}),
        );
        final d = unwrap(res.data) as Map;
        await tokens.save(d['accessToken'] as String, d['refreshToken'] as String);
        done.complete(true);
      }
    } catch (_) {
      done.complete(false);
    } finally {
      _inflight = null;
    }
    return done.future;
  }

  static dynamic unwrap(dynamic body) {
    if (body is Map && body.containsKey('data') && !body.containsKey('meta')) return body['data'];
    return body;
  }

  Future<T> _run<T>(Future<Response> Function() call, [T Function(dynamic)? map]) async {
    try {
      final res = await call();
      final body = unwrap(res.data);
      return map != null ? map(body) : body as T;
    } on DioException catch (e) {
      throw toError(e);
    }
  }

  static ApiError toError(Object e) {
    if (e is ApiError) return e;
    if (e is DioException) {
      final data = e.response?.data;
      String? msg;
      if (data is Map) {
        final err = data['error'];
        final m = err is Map ? err['message'] : data['message'];
        msg = m is List ? m.join('\n') : m?.toString();
      }
      if (e.response == null) {
        return ApiError('تعذر الاتصال بالسيرفر — تحقق من الإنترنت');
      }
      final status = e.response?.statusCode;
      if (status == 401) msg ??= 'انتهت الجلسة — سجّل الدخول مجدداً';
      // رسائل السيرفر العربية تُعرض كما هي؛ الإنجليزية الافتراضية نترجمها.
      final arabic = msg != null && RegExp(r'[\u0600-\u06FF]').hasMatch(msg);
      if (status == 403 && !arabic) msg = 'لا تملك صلاحية لهذا الإجراء — اطلبه من المدير';
      if (status == 404 && !arabic) msg = 'غير موجود — ربما حُذف';
      if (status == 413) msg = 'الملف كبير جداً';
      if (status == 429) msg = 'طلبات كثيرة — انتظر لحظة وحاول مجدداً';
      if (status != null && status >= 500 && !arabic) msg = 'خطأ في السيرفر — حاول بعد قليل';
      if (status == 400 && msg != null && !arabic) msg = 'بيانات غير مقبولة: $msg';
      return ApiError(msg ?? 'خطأ من السيرفر ($status)', status: status);
    }
    return ApiError(e.toString());
  }

  Future<T> get<T>(String path, {Map<String, dynamic>? query, T Function(dynamic)? map}) =>
      _run(() => dio.get(path, queryParameters: query), map);
  Future<T> post<T>(String path, {Object? data, T Function(dynamic)? map, Options? options}) =>
      _run(() => dio.post(path, data: data, options: options), map);
  Future<T> patch<T>(String path, {Object? data, T Function(dynamic)? map}) => _run(() => dio.patch(path, data: data), map);
  Future<T> put<T>(String path, {Object? data, T Function(dynamic)? map}) => _run(() => dio.put(path, data: data), map);
  // جسم فارغ {} دائماً: Fastify يرفض DELETE بنوع JSON وجسم فارغ.
  Future<T> delete<T>(String path, {T Function(dynamic)? map}) => _run(() => dio.delete(path, data: const <String, dynamic>{}), map);

  /// قائمة مرقّمة كما هي ({data, meta}).
  Future<Map<String, dynamic>> page(String path, Map<String, dynamic> query) async {
    try {
      final res = await dio.get(path, queryParameters: query);
      return Map<String, dynamic>.from(res.data as Map);
    } on DioException catch (e) {
      throw toError(e);
    }
  }
}
