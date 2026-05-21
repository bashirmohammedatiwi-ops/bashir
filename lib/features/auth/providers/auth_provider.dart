import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers/prefs_provider.dart';
import '../../../data/models/user_model.dart';
import '../../../data/remote/app_remote_data_source.dart';

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  AuthNotifier(this._ref) : super(const AsyncValue.loading()) {
    _bootstrap();
  }

  final Ref _ref;

  Future<void> _bootstrap() async {
    try {
      final tokens = _ref.read(authTokensProvider);
      final access = await tokens.readAccess();
      if (access == null || access.isEmpty) {
        state = const AsyncValue.data(null);
        return;
      }
      final user = await _ref.read(appRemoteDataSourceProvider).me();
      state = AsyncValue.data(user);
      await _ref.read(prefsProvider).setLoggedIn(true);
    } catch (_) {
      await tokensClear();
      state = const AsyncValue.data(null);
    }
  }

  Future<void> tokensClear() async {
    await _ref.read(authTokensProvider).clear();
    await _ref.read(prefsProvider).setLoggedIn(false);
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final remote = _ref.read(appRemoteDataSourceProvider);
      final tokens = await remote.login(email.trim(), password);
      await _ref.read(authTokensProvider).save(
            access: tokens['accessToken'] as String,
            refresh: tokens['refreshToken'] as String,
          );
      final user = await remote.me();
      await _ref.read(prefsProvider).setLoggedIn(true);
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    state = const AsyncValue.loading();
    try {
      final remote = _ref.read(appRemoteDataSourceProvider);
      final tokens = await remote.register(
        name: name,
        email: email.trim(),
        phone: phone.trim(),
        password: password,
      );
      await _ref.read(authTokensProvider).save(
            access: tokens['accessToken'] as String,
            refresh: tokens['refreshToken'] as String,
          );
      final user = await remote.me();
      await _ref.read(prefsProvider).setLoggedIn(true);
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> logout() async {
    await tokensClear();
    state = const AsyncValue.data(null);
  }

  Future<bool> isOnboardingDone() async {
    return _ref.read(prefsProvider).onboardingDone;
  }

  Future<void> completeOnboarding() async {
    await _ref.read(prefsProvider).setOnboardingDone(true);
  }

  Future<void> refreshProfile() async {
    final user = await _ref.read(appRemoteDataSourceProvider).me();
    state = AsyncValue.data(user);
  }
}

final authProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthNotifier(ref);
});

final isLoggedInProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).valueOrNull != null;
});
