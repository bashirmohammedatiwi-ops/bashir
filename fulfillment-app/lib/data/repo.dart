import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api.dart';
import 'models.dart';
import 'order_flow.dart';
import 'pick_models.dart';

export 'order_flow.dart';
export 'pick_models.dart';

final apiProvider = Provider<Api>((ref) => Api());
final repoProvider = Provider<Repo>((ref) => Repo(ref.watch(apiProvider)));

class Me {
  Me(this.id, this.name, this.email, this.role);
  final String id;
  final String name;
  final String? email;
  final String role;
  bool get isStaff => const {'SUPER_ADMIN', 'ADMIN', 'STAFF'}.contains(role);
  bool get isManager => role == 'ADMIN' || role == 'SUPER_ADMIN';
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
    String? stage,
    String? q,
    int page = 1,
  }) async {
    final res = await api.page('/control/orders', {
      'status': ?status,
      'stage': ?stage,
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

  Future<OrderDetail> setOrderStatus(String id, String status, {String? reason}) => api.patch(
    '/control/orders/$id/status',
    data: {'status': status, if (reason != null && reason.trim().isNotEmpty) 'reason': reason.trim()},
    map: (b) => OrderDetail.fromJson(Map<String, dynamic>.from(b)),
  );

  /// شحنة هاي إكسبريس (null = لم تُنشأ بعد).
  Future<ShipmentInfo?> shipment(String id) => api.get('/control/orders/$id/shipment', map: ShipmentInfo.tryParse);

  // ---------------- picking (التجهيز بالمسح — محفوظ في السيرفر)

  /// فتح الطلب من QR قائمة التجهيز: يرجع معرّف الطلب.
  Future<String> orderIdByCode(String code) =>
      api.get('/control/orders/by-code/${Uri.encodeComponent(code.trim())}', map: (b) => '${(b as Map)['id']}');

  PickView _pick(dynamic b) => PickView.fromJson(Map<String, dynamic>.from(b as Map));

  Future<PickView> pickView(String id) => api.get('/control/orders/$id/pick', map: _pick);

  Future<PickView> pickStart(String id, {bool takeover = false}) =>
      api.post('/control/orders/$id/pick/start', data: {if (takeover) 'takeover': true}, map: _pick);

  Future<ScanOutcome> pickScan(String id, {required String barcode, int qty = 1, required String clientScanId, String? device}) => api.post(
    '/control/orders/$id/pick/scan',
    data: {'barcode': barcode, 'qty': qty, 'clientScanId': clientScanId, 'device': ?device},
    map: (b) => ScanOutcome.fromJson(Map<String, dynamic>.from(b as Map)),
  );

  Future<PickView> pickExtra(
    String id, {
    required String barcode,
    required String charge,
    int qty = 1,
    String? reason,
    String? substituteForLineId,
    String? clientScanId,
  }) => api.post(
    '/control/orders/$id/pick/extra',
    data: {
      'barcode': barcode,
      'charge': charge,
      'qty': qty,
      'reason': ?reason,
      'substituteForLineId': ?substituteForLineId,
      'clientScanId': ?clientScanId,
    },
    map: _pick,
  );

  Future<PickView> pickLine(String id, String lineId, Map<String, dynamic> patch) =>
      api.patch('/control/orders/$id/pick/lines/$lineId', data: patch, map: _pick);

  Future<PickView> pickFinish(String id, {required int parcelCount, required Map<String, String> reasons}) => api.post(
    '/control/orders/$id/pick/finish',
    data: {
      'parcelCount': parcelCount,
      'reasons': [for (final e in reasons.entries) {'lineId': e.key, 'reason': e.value}],
    },
    map: _pick,
  );

  Future<PickView> pickReopen(String id, String reason) =>
      api.post('/control/orders/$id/pick/reopen', data: {'reason': reason}, map: _pick);

  Future<List<TimelineEntry>> timeline(String id) => api.get(
    '/control/orders/$id/timeline',
    map: (b) => (b as List).whereType<Map>().map((e) => TimelineEntry.fromJson(Map<String, dynamic>.from(e))).toList(),
  );

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
