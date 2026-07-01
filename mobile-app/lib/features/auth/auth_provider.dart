import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../data/models/user.dart';
import '../../data/services/api_service.dart';

enum AuthStatus { unknown, authenticated, guest }

class AuthState {
  final AuthStatus status;
  final AppUser? user;
  const AuthState(this.status, [this.user]);

  bool get isAuthenticated => status == AuthStatus.authenticated && user != null;
}

class AuthNotifier extends StateNotifier<AuthState> {
  final Ref _ref;
  AuthNotifier(this._ref) : super(const AuthState(AuthStatus.unknown)) {
    _bootstrap();
  }

  ApiService get _api => _ref.read(apiServiceProvider);
  TokenStore get _tokens => _ref.read(tokenStoreProvider);

  Future<void> _bootstrap() async {
    if (await _tokens.hasSession) {
      try {
        final user = await _api.getMe();
        state = AuthState(AuthStatus.authenticated, user);
        return;
      } catch (_) {
        await _tokens.clear();
      }
    }
    state = const AuthState(AuthStatus.guest);
  }

  Future<void> login(String email, String password) async {
    final data = await _api.login(email, password);
    await _tokens.save(
      access: data['accessToken'] as String,
      refresh: data['refreshToken'] as String,
    );
    final user = await _api.getMe();
    state = AuthState(AuthStatus.authenticated, user);
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final data = await _api.register(
        name: name, email: email, password: password, phone: phone);
    await _tokens.save(
      access: data['accessToken'] as String,
      refresh: data['refreshToken'] as String,
    );
    final user = await _api.getMe();
    state = AuthState(AuthStatus.authenticated, user);
  }

  Future<void> refreshUser() async {
    if (!state.isAuthenticated) return;
    try {
      state = AuthState(AuthStatus.authenticated, await _api.getMe());
    } catch (_) {}
  }

  Future<void> logout() async {
    final refresh = await _tokens.refresh;
    if (refresh != null) await _api.logout(refresh);
    await _tokens.clear();
    state = const AuthState(AuthStatus.guest);
  }
}

final authProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier(ref));
