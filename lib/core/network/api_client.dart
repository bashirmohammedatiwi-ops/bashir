import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

/// Secure-storage backed token store.
class AuthTokens {
  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';
  final FlutterSecureStorage _storage;

  AuthTokens(this._storage);

  Future<String?> readAccess() => _storage.read(key: _accessKey);
  Future<String?> readRefresh() => _storage.read(key: _refreshKey);

  Future<void> save({required String access, required String refresh}) async {
    await _storage.write(key: _accessKey, value: access);
    await _storage.write(key: _refreshKey, value: refresh);
  }

  Future<void> clear() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }
}

final secureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => const FlutterSecureStorage(),
);

final authTokensProvider = Provider<AuthTokens>(
  (ref) => AuthTokens(ref.read(secureStorageProvider)),
);

/// Configured Dio client with auth interceptor and refresh-on-401.
final apiClientProvider = Provider<Dio>((ref) {
  final tokens = ref.read(authTokensProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.networkTimeout,
      receiveTimeout: AppConfig.networkTimeout,
      sendTimeout: AppConfig.networkTimeout,
      headers: const {'Accept': 'application/json'},
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await tokens.readAccess();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (err, handler) async {
        if (err.response?.statusCode == 401) {
          final refresh = await tokens.readRefresh();
          if (refresh != null && refresh.isNotEmpty) {
            try {
              final resp = await dio.post(
                '/auth/refresh',
                data: {'refreshToken': refresh},
                options: Options(headers: {'Authorization': null}),
              );
              final data = (resp.data['data'] ?? resp.data) as Map<String, dynamic>;
              await tokens.save(
                access: data['accessToken'] as String,
                refresh: data['refreshToken'] as String,
              );
              final clone = await dio.fetch(err.requestOptions);
              return handler.resolve(clone);
            } catch (_) {
              await tokens.clear();
            }
          }
        }
        handler.next(err);
      },
    ),
  );

  return dio;
});
