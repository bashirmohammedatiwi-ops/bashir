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

final secureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  ),
);

final tokenStoreProvider = Provider<TokenStore>(
  (ref) => TokenStore(ref.read(secureStorageProvider)),
);

final dioProvider = Provider<Dio>((ref) {
  final tokens = ref.read(tokenStoreProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: const {'Accept': 'application/json'},
      responseType: ResponseType.json,
    ),
  );

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
    onError: (err, handler) async {
      final isRefresh = err.requestOptions.path.contains('/auth/refresh');
      if (err.response?.statusCode == 401 && !isRefresh) {
        final refresh = await tokens.refresh;
        if (refresh != null && refresh.isNotEmpty) {
          try {
            final resp = await dio.post(
              '/auth/refresh',
              data: {'refreshToken': refresh},
              options: Options(extra: {'auth': false}),
            );
            final data = (resp.data['data'] ?? resp.data) as Map<String, dynamic>;
            await tokens.save(
              access: data['accessToken'] as String,
              refresh: data['refreshToken'] as String,
            );
            final retried = await dio.fetch(
              err.requestOptions..headers['Authorization'] = 'Bearer ${data['accessToken']}',
            );
            return handler.resolve(retried);
          } catch (_) {
            await tokens.clear();
          }
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
