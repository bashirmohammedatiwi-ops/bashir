import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/prefs_provider.dart';
import '../../../data/mock/mock_user.dart';
import '../../../data/models/user_model.dart';

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  AuthNotifier(this._ref) : super(const AsyncValue.loading()) {
    final prefs = _ref.read(prefsProvider);
    state = AsyncValue.data(
      prefs.isLoggedIn ? MockUser.defaultUser : null,
    );
  }

  final Ref _ref;

  Future<void> login(String phone, String password) async {
    final prefs = _ref.read(prefsProvider);
    await prefs.setLoggedIn(true);
    state = AsyncValue.data(MockUser.defaultUser);
  }

  Future<void> register(String name, String phone, String password) async {
    await login(phone, password);
  }

  Future<void> logout() async {
    final prefs = _ref.read(prefsProvider);
    await prefs.setLoggedIn(false);
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
