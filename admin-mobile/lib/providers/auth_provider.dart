import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/auth.dart';
import '../repositories/auth_repository.dart';

class AuthState {
  const AuthState({this.user, this.loading = false, this.error});

  final AdminUser? user;
  final bool loading;
  final String? error;

  bool get isAuthenticated => user != null && user!.isStaff;

  AuthState copyWith({AdminUser? user, bool? loading, String? error, bool clearError = false}) {
    return AuthState(
      user: user ?? this.user,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._repo) : super(const AuthState(loading: true)) {
    _bootstrap();
  }

  final AuthRepository _repo;

  Future<void> _bootstrap() async {
    try {
      if (!await _repo.hasSession()) {
        state = const AuthState(loading: false);
        return;
      }
      final user = await _repo.me();
      if (!user.isStaff) {
        await _repo.logout();
        state = const AuthState(loading: false, error: 'هذا الحساب ليس حساب موظف');
        return;
      }
      state = AuthState(user: user, loading: false);
    } catch (_) {
      await _repo.logout();
      state = const AuthState(loading: false);
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final user = await _repo.login(email, password);
      if (!user.isStaff) {
        await _repo.logout();
        state = const AuthState(loading: false, error: 'صلاحيات غير كافية — حساب الموظفين فقط');
        return;
      }
      state = AuthState(user: user, loading: false);
    } catch (e) {
      state = AuthState(loading: false, error: _message(e, 'فشل تسجيل الدخول'));
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState(loading: false);
  }

  String _message(Object e, String fallback) {
    if (e.toString().contains('401')) return 'البريد أو كلمة المرور غير صحيحة';
    return fallback;
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});
