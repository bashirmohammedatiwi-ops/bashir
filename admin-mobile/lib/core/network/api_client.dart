import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/app_config.dart';

class TokenStore {
  static const _accessKey = 'admin_access_token';
  static const _refreshKey = 'admin_refresh_token';
  final FlutterSecureStorage _storage;
  String? _accessCache;

  TokenStore(this._storage);

  Future<String?> get access async => _accessCache ??= await _storage.read(key: _accessKey);
  Future<String?> get refresh => _storage.read(key: _refreshKey);

  Future<void> save({required String access, required String refresh}) async {
    _accessCache = access;
    await _storage.write(key: _accessKey, value: access);
    await _storage.write(key: _refreshKey, value: refresh);
  }

  Future<void> clear() async {
    _accessCache = null;
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }

  Future<bool> get hasSession async => (await refresh)?.isNotEmpty ?? false;
}

/// One refresh at a time — parallel 401s after scanning must not revoke each other.
class TokenRefreshGate {
  TokenRefreshGate(this._tokens);

  final TokenStore _tokens;
  late final Dio dio;
  Completer<bool>? _inflight;

  bool _isAuthFree(RequestOptions options) {
    if (options.extra['auth'] == false) return true;
    final path = options.path;
    return path.contains('/auth/login') ||
        path.contains('/auth/register') ||
        path.contains('/auth/refresh');
  }

  bool isExpiringSoon(String token, {Duration skew = const Duration(seconds: 90)}) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return true;
      final map = jsonDecode(
        utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
      ) as Map<String, dynamic>;
      final exp = map['exp'];
      if (exp is! num) return true;
      return DateTime.fromMillisecondsSinceEpoch(exp.toInt() * 1000)
          .isBefore(DateTime.now().add(skew));
    } catch (_) {
      return true;
    }
  }

  Future<bool> ensureFresh(RequestOptions options) async {
    if (_isAuthFree(options)) return true;
    final access = await _tokens.access;
    if (access != null && access.isNotEmpty && !isExpiringSoon(access)) {
      options.headers['Authorization'] = 'Bearer $access';
      return true;
    }
    final ok = await refresh();
    final next = await _tokens.access;
    if (ok && next != null && next.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $next';
      return true;
    }
    return access != null && access.isNotEmpty;
  }

  Future<bool> refresh() async {
    final existing = _inflight;
    if (existing != null) return existing.future;
    final done = Completer<bool>();
    _inflight = done;
    try {
      final refreshTok = await _tokens.refresh;
      if (refreshTok == null || refreshTok.isEmpty) {
        done.complete(false);
        return false;
      }
      final resp = await dio.post<dynamic>(
        '/auth/refresh',
        data: {'refreshToken': refreshTok},
        options: Options(
          extra: {'auth': false},
          receiveTimeout: const Duration(seconds: 20),
        ),
      );
      final data = (resp.data['data'] ?? resp.data) as Map;
      final access = data['accessToken']?.toString() ?? '';
      final nextRefresh = data['refreshToken']?.toString() ?? '';
      if (access.isEmpty || nextRefresh.isEmpty) {
        done.complete(false);
        return false;
      }
      await _tokens.save(access: access, refresh: nextRefresh);
      done.complete(true);
      return true;
    } catch (_) {
      done.complete(false);
      return false;
    } finally {
      if (identical(_inflight, done)) _inflight = null;
    }
  }
}

final secureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  ),
);

final tokenStoreProvider = Provider<TokenStore>(
  (ref) => TokenStore(ref.read(secureStorageProvider)),
);

/// Incremented when refresh fails so the UI can send the user back to login.
final sessionLostProvider = StateProvider<int>((ref) => 0);

final dioProvider = Provider<Dio>((ref) {
  final tokens = ref.read(tokenStoreProvider);
  final gate = TokenRefreshGate(tokens);
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: const {'Accept': 'application/json'},
      responseType: ResponseType.json,
    ),
  );
  gate.dio = dio;

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      try {
        await gate.ensureFresh(options);
      } catch (_) {}
      handler.next(options);
    },
    onError: (err, handler) async {
      final isRefresh = err.requestOptions.path.contains('/auth/refresh');
      if (err.response?.statusCode == 401 && !isRefresh && err.requestOptions.extra['auth'] != false) {
        final ok = await gate.refresh();
        if (ok) {
          final access = await tokens.access;
          if (access != null && access.isNotEmpty) {
            try {
              err.requestOptions.headers['Authorization'] = 'Bearer $access';
              final retried = await dio.fetch<dynamic>(err.requestOptions);
              return handler.resolve(retried);
            } catch (retryErr) {
              if (retryErr is DioException) return handler.next(retryErr);
            }
          }
        } else {
          await tokens.clear();
          ref.read(sessionLostProvider.notifier).state++;
        }
      }
      handler.next(err);
    },
  ));

  return dio;
});

final catalogDioProvider = Provider<Dio>((ref) {
  return Dio(
    BaseOptions(
      baseUrl: AppConfig.catalogHubUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.catalogTimeout,
      headers: const {'Accept': 'application/json'},
      responseType: ResponseType.json,
    ),
  );
});
