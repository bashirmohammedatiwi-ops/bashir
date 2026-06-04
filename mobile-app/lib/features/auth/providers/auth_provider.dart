import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers/prefs_provider.dart';
import '../../../data/models/user_model.dart';
import '../../../data/remote/store_api.dart';
import '../../../data/remote/user_remote_mapper.dart';

class GuestModeNotifier extends StateNotifier<bool> {
  GuestModeNotifier(this._ref) : super(_ref.read(prefsProvider).isGuest);

  final Ref _ref;

  Future<void> setGuest(bool value) async {
    await _ref.read(prefsProvider).setGuest(value);
    state = value;
  }
}

final guestModeProvider =
    StateNotifierProvider<GuestModeNotifier, bool>((ref) {
  return GuestModeNotifier(ref);
});

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  AuthNotifier(this._ref) : super(const AsyncValue.loading()) {
    _restore();
  }

  final Ref _ref;

  Future<void> _restore() async {
    final prefs = _ref.read(prefsProvider);
    if (prefs.isGuest) {
      _ref.read(guestModeProvider.notifier).state = true;
      state = const AsyncValue.data(null);
      return;
    }
    try {
      final tokens = _ref.read(authTokensProvider);
      final access = await tokens.readAccess();
      if (access == null || access.isEmpty) {
        state = const AsyncValue.data(null);
        return;
      }
      final me = await _ref.read(storeApiProvider).me();
      state = AsyncValue.data(UserRemoteMapper.fromMe(me));
      await prefs.setLoggedIn(true);
      await _ref.read(guestModeProvider.notifier).setGuest(false);
    } catch (_) {
      await _ref.read(authTokensProvider).clear();
      state = const AsyncValue.data(null);
      await prefs.setLoggedIn(false);
    }
  }

  Future<void> _clearGuestMode() async {
    await _ref.read(guestModeProvider.notifier).setGuest(false);
  }

  Future<void> continueAsGuest() async {
    await _ref.read(authTokensProvider).clear();
    final prefs = _ref.read(prefsProvider);
    await prefs.setLoggedIn(false);
    await _ref.read(guestModeProvider.notifier).setGuest(true);
    state = const AsyncValue.data(null);
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    await _clearGuestMode();
    try {
      final api = _ref.read(storeApiProvider);
      final tokens = await api.login(email.trim(), password);
      await _ref.read(authTokensProvider).save(
            access: tokens['accessToken'] as String,
            refresh: tokens['refreshToken'] as String,
          );
      final me = await api.me();
      await _ref.read(prefsProvider).setLoggedIn(true);
      state = AsyncValue.data(UserRemoteMapper.fromMe(me));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> register(
    String name,
    String email,
    String password, {
    String? phone,
  }) async {
    await _clearGuestMode();
    state = const AsyncValue.loading();
    try {
      final api = _ref.read(storeApiProvider);
      await api.register(
        email: email.trim(),
        name: name,
        password: password,
        phone: phone,
      );
      await login(email, password);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      final refresh = await _ref.read(authTokensProvider).readRefresh();
      await _ref.read(storeApiProvider).logout(refreshToken: refresh);
    } catch (_) {}
    await _ref.read(authTokensProvider).clear();
    final prefs = _ref.read(prefsProvider);
    await prefs.setLoggedIn(false);
    await _ref.read(guestModeProvider.notifier).setGuest(false);
    state = const AsyncValue.data(null);
  }

  Future<void> exitGuestMode() async {
    await _ref.read(guestModeProvider.notifier).setGuest(false);
    state = const AsyncValue.data(null);
  }

  Future<bool> isOnboardingDone() async {
    return _ref.read(prefsProvider).onboardingDone;
  }

  Future<void> completeOnboarding() async {
    await _ref.read(prefsProvider).setOnboardingDone(true);
  }
}

final authProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthNotifier(ref);
});

final isLoggedInProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).valueOrNull != null;
});

final isGuestProvider = Provider<bool>((ref) {
  return ref.watch(guestModeProvider);
});

final canBrowseProvider = Provider<bool>((ref) {
  return ref.watch(isLoggedInProvider) || ref.watch(isGuestProvider);
});
