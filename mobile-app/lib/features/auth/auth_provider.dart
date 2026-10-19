import 'dart:async';
import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/api_client.dart';
import '../../core/push/push_service.dart';
import '../../core/utils/json.dart';
import '../../data/models/user.dart';
import '../../data/services/api_service.dart';
import '../advisor/advisor_profile.dart';

enum AuthStatus { unknown, authenticated, guest }

class AuthState {
  final AuthStatus status;
  final AppUser? user;
  const AuthState(this.status, [this.user]);

  bool get isAuthenticated => status == AuthStatus.authenticated && user != null;
}

/// يزداد كلما أنهى الخادم جلسة كانت ظاهرة للزبونة — الهيكل يعرض عندها
/// «انتهت الجلسة» مع زر الدخول.
final sessionExpiredProvider = StateProvider<int>((_) => 0);

class AuthNotifier extends StateNotifier<AuthState> {
  final Ref _ref;
  late final TokenStore _tokens = _ref.read(tokenStoreProvider);
  late final AppLifecycleListener _lifecycle;

  /// يزداد مع كل دخول/خروج — نتيجة تحقق متأخرة من جلسة سابقة تُهمَل.
  int _epoch = 0;

  /// تحقق مؤجَّل (انقطاع شبكة/خادم) يُعاد عند عودة التطبيق للواجهة.
  bool _pendingCheck = false;
  bool _checking = false;

  static const _userKey = 'auth_user_v1';

  /// مفتاح ملف «ديما» الجمالي (advisor_profile.dart) — يُحذف من التخزين قبل
  /// clear() كي لا يعيده التحميل المتأخر للمزوّد (إن أُنشئ لتوّه) بعد حذف الحساب.
  static const _advisorProfileKey = 'advisor_profile_v1';

  /// أقصى انتظار لـ /auth/me قبل أن نُخرج الواجهة من شاشة الافتتاح.
  static const _meTimeout = Duration(seconds: 6);

  AuthNotifier(this._ref) : super(const AuthState(AuthStatus.unknown)) {
    _tokens.sessionExpired.addListener(_onSessionExpired);
    _lifecycle = AppLifecycleListener(onResume: _onResume);
    _bootstrap();
  }

  ApiService get _api => _ref.read(apiServiceProvider);
  SharedPreferences get _prefs => _ref.read(sharedPreferencesProvider);

  @override
  void dispose() {
    _lifecycle.dispose();
    _tokens.sessionExpired.removeListener(_onSessionExpired);
    super.dispose();
  }

  /// يفتح التطبيق فوراً بالحساب المحفوظ ويتحقق من الخادم في الخلفية؛ لا تخرج
  /// الحالة من `unknown` إلا إلى حساب أو زائرة مهما حدث (لا تعلق شاشة الافتتاح).
  Future<void> _bootstrap() async {
    final epoch = _epoch;
    try {
      final hasSession = await _tokens.hasSession;
      if (!mounted || epoch != _epoch) return;
      if (!hasSession) {
        _pendingCheck = false;
        state = const AuthState(AuthStatus.guest);
        unawaited(_clearCachedUser());
        return;
      }

      final cached = state.user ?? _readCachedUser();
      if (cached != null) {
        if (!state.isAuthenticated) state = AuthState(AuthStatus.authenticated, cached);
        unawaited(_checkSession());
        return;
      }
      await _checkSession();
    } catch (e) {
      debugPrint('[Auth] bootstrap failed: $e');
      if (mounted && state.status == AuthStatus.unknown) {
        _pendingCheck = true;
        state = const AuthState(AuthStatus.guest);
      }
    }
  }

  /// يسأل الخادم عن الحساب: يحدّث البيانات، أو ينهي الجلسة إن رفضها الخادم
  /// (401/403)، أو يؤجّل المحاولة لعودة التطبيق إن تعذّر الاتصال — ولا يمسح
  /// التوكنات أبداً بسبب الشبكة.
  Future<void> _checkSession() async {
    if (_checking) return;
    _checking = true;
    final epoch = _epoch;
    // مهلة لينة: بعد 6 ثوانٍ تدخل الزبونة كزائرة دون مسح جلستها، ويكمل الطلب —
    // إن ردّ الخادم بعدها عاد الحساب تلقائياً.
    final softTimeout = Timer(_meTimeout, () {
      if (mounted && epoch == _epoch && state.status == AuthStatus.unknown) {
        _pendingCheck = true;
        state = const AuthState(AuthStatus.guest);
      }
    });
    try {
      final user = await _api.getMe();
      if (!mounted || epoch != _epoch) return;
      _setUser(user);
    } on ApiException catch (e) {
      if (!mounted || epoch != _epoch) return;
      if (e.status == 401 || e.status == 403) {
        await _endSession(notify: state.isAuthenticated);
      } else {
        _deferCheck();
      }
    } catch (_) {
      if (mounted && epoch == _epoch) _deferCheck();
    } finally {
      softTimeout.cancel();
      _checking = false;
    }
  }

  void _deferCheck() {
    _pendingCheck = true;
    if (state.status == AuthStatus.unknown) state = const AuthState(AuthStatus.guest);
  }

  void _onResume() {
    if (_pendingCheck && !_checking) unawaited(_bootstrap());
  }

  /// المعترض مسح التوكنات لأن الخادم رفض تجديد الجلسة.
  void _onSessionExpired() {
    if (!mounted) return;
    _epoch++;
    _pendingCheck = false;
    unawaited(_clearCachedUser());
    if (state.status == AuthStatus.guest) return;
    final wasSignedIn = state.isAuthenticated;
    state = const AuthState(AuthStatus.guest);
    if (wasSignedIn) _ref.read(sessionExpiredProvider.notifier).state++;
  }

  /// جلسة رفضها الخادم أثناء التحقق: نمسح كل شيء ونعود زائرة.
  Future<void> _endSession({required bool notify}) async {
    _epoch++;
    _pendingCheck = false;
    await _tokens.clear();
    await _clearCachedUser();
    if (!mounted) return;
    state = const AuthState(AuthStatus.guest);
    if (notify) _ref.read(sessionExpiredProvider.notifier).state++;
  }

  void _setUser(AppUser user) {
    _pendingCheck = false;
    state = AuthState(AuthStatus.authenticated, user);
    unawaited(_cacheUser(user));
  }

  AppUser? _readCachedUser() {
    try {
      final raw = _prefs.getString(_userKey);
      if (raw == null || raw.isEmpty) return null;
      final user = AppUser.fromJson(asMap(jsonDecode(raw)));
      return user.id.isEmpty ? null : user;
    } catch (_) {
      return null;
    }
  }

  Future<void> _cacheUser(AppUser user) async {
    try {
      await _prefs.setString(_userKey, jsonEncode(user.toJson()));
    } catch (_) {}
  }

  Future<void> _clearCachedUser() async {
    try {
      await _prefs.remove(_userKey);
    } catch (_) {}
  }

  Future<void> login(String phone, String password) async {
    // قبل الطلب: تحقق متأخر من جلسة سابقة (401 مثلاً) لا يمسح التوكنات الجديدة.
    _epoch++;
    final data = await _api.login(phone, password);
    await _tokens.save(
      access: data['accessToken'] as String,
      refresh: data['refreshToken'] as String,
    );
    await _loadSignedInUser();
  }

  Future<void> register({
    required String name,
    required String phone,
    required String password,
    String? email,
  }) async {
    _epoch++;
    final data = await _api.register(
        name: name, phone: phone, password: password, email: email);
    await _tokens.save(
      access: data['accessToken'] as String,
      refresh: data['refreshToken'] as String,
    );
    await _loadSignedInUser();
  }

  Future<void> _loadSignedInUser() async {
    try {
      final user = await _api.getMe();
      if (mounted) _setUser(user);
    } catch (_) {
      // الدخول نجح والتوكنات حُفظت — نكمل التحقق عند عودة التطبيق للواجهة.
      _pendingCheck = true;
      rethrow;
    }
  }

  Future<void> refreshUser() async {
    if (!state.isAuthenticated) return;
    final epoch = _epoch;
    try {
      final user = await _api.getMe();
      if (!mounted || epoch != _epoch || !state.isAuthenticated) return;
      _setUser(user);
    } catch (_) {}
  }

  /// خروج فوري: الحالة تصبح زائرة مباشرة، وإبطال الجلسة وفصل الجهاز على الخادم
  /// يجريان في الخلفية بالتوكنات التي التُقطت قبل المسح.
  Future<void> logout() async {
    final refresh = await _tokens.refresh;
    final access = await _tokens.access;
    final pushToken = PushService.currentToken;
    _epoch++;
    _pendingCheck = false;
    await _tokens.clear();
    await _clearCachedUser();
    if (mounted) state = const AuthState(AuthStatus.guest);
    unawaited(revokeSessionInBackground(
      refresh: refresh,
      access: access,
      pushToken: pushToken,
    ));
  }

  Future<void> deleteAccount() async {
    await _api.deleteAccount();
    _epoch++;
    _pendingCheck = false;
    await _tokens.clear();
    await _clearCachedUser();
    // الحساب حُذف: لا يبقى على الجهاز شيء من ملفها الجمالي لدى «ديما».
    try {
      await _prefs.remove(_advisorProfileKey);
    } catch (_) {}
    _ref.read(advisorProfileProvider.notifier).clear();
    if (mounted) state = const AuthState(AuthStatus.guest);
  }
}

final authProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier(ref));
