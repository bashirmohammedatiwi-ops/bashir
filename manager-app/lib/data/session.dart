import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'models.dart';
import 'repo.dart';

enum AuthState { loading, signedOut, signedIn }

class Session {
  const Session(this.state, [this.me]);
  final AuthState state;
  final Me? me;
}

class SessionNotifier extends StateNotifier<Session> {
  SessionNotifier(this.ref) : super(const Session(AuthState.loading)) {
    _sub = ref.read(apiProvider).sessionExpired.listen((_) => state = const Session(AuthState.signedOut));
    _restore();
  }
  final Ref ref;
  StreamSubscription? _sub;

  Future<void> _restore() async {
    final api = ref.read(apiProvider);
    if ((await api.tokens.refresh) == null) {
      state = const Session(AuthState.signedOut);
      return;
    }
    try {
      final me = await ref.read(repoProvider).me();
      state = me.isStaff ? Session(AuthState.signedIn, me) : const Session(AuthState.signedOut);
    } catch (e) {
      // بلا إنترنت: نبقى داخل التطبيق بالجلسة المحفوظة
      final err = e.toString();
      state = err.contains('تعذر الاتصال') ? const Session(AuthState.signedIn) : const Session(AuthState.signedOut);
    }
  }

  Future<void> login(String login, String password) async {
    final me = await ref.read(repoProvider).login(login, password);
    state = Session(AuthState.signedIn, me);
  }

  Future<void> logout() async {
    await ref.read(repoProvider).logout();
    state = const Session(AuthState.signedOut);
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}

final sessionProvider = StateNotifierProvider<SessionNotifier, Session>((ref) => SessionNotifier(ref));

final statsProvider = FutureProvider.autoDispose<Stats>((ref) => ref.watch(repoProvider).stats());
final groupsProvider = FutureProvider.autoDispose<List<DraftGroup>>((ref) => ref.watch(repoProvider).groups());
final activityProvider = FutureProvider.autoDispose<List<ActivityItem>>((ref) => ref.watch(repoProvider).activity());
final brandsProvider = FutureProvider<List<NamedRef>>((ref) => ref.watch(repoProvider).brands());

/// يزداد بعد أي تعديل — الشاشات المفتوحة (البحث، الرئيسية) تعيد التحميل.
final dataVersionProvider = StateProvider<int>((ref) => 0);

/// يزداد بعد تغيير حالة طلب أو وصول طلب جديد — قائمة الطلبات تعيد التحميل.
final ordersVersionProvider = StateProvider<int>((ref) => 0);

/// عدد الطلبات الجديدة (PENDING) — شارة تبويب الطلبات.
final pendingOrdersProvider = StateProvider<int>((ref) => 0);
