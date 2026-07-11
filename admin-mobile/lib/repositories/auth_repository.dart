import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/utils/json.dart';
import '../../models/auth.dart';

class AuthRepository {
  AuthRepository(this._dio, this._tokens);

  final Dio _dio;
  final TokenStore _tokens;

  Future<AdminUser> login(String email, String password) async {
    final resp = await _dio.post(
      '/auth/login',
      data: {'email': email.trim(), 'password': password},
      options: Options(extra: {'auth': false}),
    );
    final data = asMap(resp.data['data'] ?? resp.data);
    await _tokens.save(
      access: asString(data['accessToken']),
      refresh: asString(data['refreshToken']),
    );
    return me();
  }

  Future<AdminUser> me() async {
    final resp = await _dio.get('/auth/me');
    final data = asMap(resp.data['data'] ?? resp.data);
    return AdminUser.fromJson(data);
  }

  Future<void> logout() => _tokens.clear();

  Future<bool> hasSession() => _tokens.hasSession;
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.read(dioProvider), ref.read(tokenStoreProvider));
});
