import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api.dart';
import 'models.dart';

final apiProvider = Provider<Api>((ref) => Api());
final repoProvider = Provider<Repo>((ref) => Repo(ref.watch(apiProvider)));

class Me {
  Me(this.id, this.name, this.email, this.role);
  final String id;
  final String name;
  final String? email;
  final String role;
  bool get isStaff => const {'SUPER_ADMIN', 'ADMIN', 'STAFF'}.contains(role);
}

/// كل نداءات السيرفر لتطبيق تجهيز الطلبات في مكان واحد.
class Repo {
  Repo(this.api);
  final Api api;

  // ---------------- auth
  Future<Me> login(String login, String password) async {
    final isEmail = login.contains('@');
    final d = await api.post<Map>(
      '/auth/login',
      data: {isEmail ? 'email' : 'phone': login.trim(), 'password': password},
      options: Options(extra: {'auth': false}),
      map: (b) => b as Map,
    );
    await api.tokens.save('${d['accessToken']}', '${d['refreshToken']}');
    final m = await me();
    if (!m.isStaff) {
      await api.tokens.clear();
      throw ApiError('هذا الحساب لا يملك صلاحية تجهيز الطلبات');
    }
    return m;
  }

  Future<Me> me() => api.get(
    '/auth/me',
    map: (b) {
      final j = b as Map;
      return Me('${j['id']}', '${j['name'] ?? j['email'] ?? 'موظف'}', j['email']?.toString(), '${j['role']}');
    },
  );

  Future<void> logout() async {
    try {
      final r = await api.tokens.refresh;
      await api.post('/auth/logout', data: {'refreshToken': r});
    } catch (_) {}
    await api.tokens.clear();
  }

  // ---------------- orders
  Future<({List<OrderSummary> items, int total, bool hasNext, Map<String, int> counts})> orders({
    String? status,
    String? q,
    int page = 1,
  }) async {
    final res = await api.page('/control/orders', {
      'status': ?status,
      if (q != null && q.trim().isNotEmpty) 'q': q.trim(),
      'page': page,
      'limit': 30,
    });
    final meta = res['meta'] as Map;
    return (
      items: (res['data'] as List).map((e) => OrderSummary.fromJson(Map<String, dynamic>.from(e))).toList(),
      total: (meta['total'] as num).toInt(),
      hasNext: meta['hasNext'] == true,
      counts: (res['counts'] as Map? ?? const {}).map((k, v) => MapEntry('$k', (v as num).toInt())),
    );
  }

  Future<OrderDetail> order(String id) => api.get('/control/orders/$id', map: (b) => OrderDetail.fromJson(Map<String, dynamic>.from(b)));

  Future<OrderDetail> setOrderStatus(String id, String status) =>
      api.patch('/control/orders/$id/status', data: {'status': status}, map: (b) => OrderDetail.fromJson(Map<String, dynamic>.from(b)));

  Future<({int pending, String? latestId, String? latestNumber, DateTime? latestAt})> pulse() => api.get(
    '/control/orders/pulse',
    map: (b) {
      final j = b as Map;
      final l = j['latest'] as Map?;
      return (
        pending: (j['pending'] as num).toInt(),
        latestId: l?['id']?.toString(),
        latestNumber: l?['orderNumber']?.toString(),
        latestAt: DateTime.tryParse('${l?['createdAt']}'),
      );
    },
  );
}
