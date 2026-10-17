import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/format.dart';
import 'repo.dart';

int _i(dynamic v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;
int? _in(dynamic v) => v == null ? null : (v is num ? v.toInt() : int.tryParse('$v'));
String? _s(dynamic v) => v?.toString();
List<Map<String, dynamic>> _l(dynamic v) => v is List ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList() : const [];

class Customer {
  Customer.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      name = _s(j['name']) ?? 'بدون اسم',
      phone = _s(j['phone']),
      email = _s(j['email']),
      isActive = j['isActive'] != false,
      points = _i(j['loyaltyPoints']),
      orders = _i(j['orders']),
      spent = _i(j['spent']),
      createdAt = parseDate(j['createdAt']),
      lastOrderAt = parseDate(j['lastOrderAt']);
  final String id, name;
  final String? phone, email;
  final bool isActive;
  final int points, orders, spent;
  final DateTime? createdAt, lastOrderAt;
}

class CustomerDetail extends Customer {
  CustomerDetail.fromJson(super.j)
    : averageOrder = _i(j['averageOrder']),
      cancelled = _i(j['cancelled']),
      reviewsCount = _i(j['reviewsCount']),
      wishlistCount = _i(j['wishlistCount']),
      lastLoginAt = parseDate(j['lastLoginAt']),
      addresses = _l(j['addresses']),
      recentOrders = _l(j['recentOrders']),
      loyalty = _l(j['loyalty']),
      super.fromJson();
  final int averageOrder, cancelled, reviewsCount, wishlistCount;
  final DateTime? lastLoginAt;
  final List<Map<String, dynamic>> addresses, recentOrders, loyalty;
}

class ReviewItem {
  ReviewItem.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      userName = _s(j['userName']) ?? '',
      rating = (j['rating'] as num?)?.toDouble() ?? 0,
      comment = _s(j['comment']) ?? '',
      approved = j['approved'] == true,
      createdAt = parseDate(j['createdAt']),
      productId = _s((j['product'] as Map?)?['id']),
      productName = _s((j['product'] as Map?)?['name']);
  final String id, userName, comment;
  final double rating;
  bool approved;
  final DateTime? createdAt;
  final String? productId, productName;
}

class Coupon {
  Coupon.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      code = '${j['code']}',
      type = '${j['type']}',
      value = _i(j['value']),
      title = _s(j['title']),
      subtitle = _s(j['subtitle']),
      minOrder = _i(j['minOrder']),
      maxDiscount = _in(j['maxDiscount']),
      maxRedemptions = _in(j['maxRedemptions']),
      perUserLimit = _in(j['perUserLimit']),
      redeemedCount = _i(j['redeemedCount']),
      startsAt = parseDate(j['startsAt']),
      endsAt = parseDate(j['endsAt']),
      isActive = j['isActive'] == true,
      showOnHome = j['showOnHome'] == true,
      theme = _s(j['theme']) ?? 'rose',
      live = j['live'] == true,
      ordersCount = _i((j['stats'] as Map?)?['orders']),
      discountGiven = _i((j['stats'] as Map?)?['discountGiven']),
      sales = _i((j['stats'] as Map?)?['sales']);
  final String id, code, type, theme;
  final int value, minOrder, redeemedCount, ordersCount, discountGiven, sales;
  final int? maxDiscount, maxRedemptions, perUserLimit;
  final String? title, subtitle;
  final DateTime? startsAt, endsAt;
  bool isActive;
  final bool showOnHome, live;

  String get valueLabel => switch (type) {
    'PERCENT' => '$value%',
    'AMOUNT' => money(value),
    'FREE_SHIPPING' => 'توصيل مجاني',
    'FIRST_ORDER' => '$value% لأول طلب',
    _ => '$value',
  };
}

class ShipZone {
  ShipZone.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      governorate = '${j['governorate']}',
      fee = _i(j['standardFee']),
      isActive = j['isActive'] != false,
      areas = _l(j['areas']);
  final String id, governorate;
  final int fee;
  bool isActive;
  final List<Map<String, dynamic>> areas;
}

class HealthItem {
  HealthItem.fromJson(Map<String, dynamic> j)
    : key = '${j['key']}',
      label = '${j['label']}',
      count = _i(j['count']),
      severity = '${j['severity']}',
      target = '${j['target']}';
  final String key, label, severity, target;
  final int count;
}

class StoreHealth {
  StoreHealth.fromJson(Map<String, dynamic> j)
    : items = _l(j['items']).map(HealthItem.fromJson).toList(),
      posLastRunAt = parseDate((j['pos'] as Map?)?['lastRunAt']),
      posLastOk = (j['pos'] as Map?)?['lastRunOk'] as bool?,
      posError = _s((j['pos'] as Map?)?['lastError']),
      posFailedDay = _i((j['pos'] as Map?)?['failedLastDay']),
      posSyncedAt = parseDate((j['pos'] as Map?)?['lastSyncedAt']);
  final List<HealthItem> items;
  final DateTime? posLastRunAt, posSyncedAt;
  final bool? posLastOk;
  final String? posError;
  final int posFailedDay;
  int get issues => items.where((i) => i.count > 0 && i.severity != 'low').length;
}

/// الإدارة الكاملة: زبونات، تقييمات، كوبونات، إشعارات، إعدادات، شحن، براندات، أقسام، الكاشير.
extension AdminRepo on Repo {
  Future<({List<Customer> items, int total, bool hasNext})> customers({String? q, String sort = 'recent', int page = 1}) async {
    final res = await api.page('/control/customers', {
      if (q != null && q.trim().isNotEmpty) 'q': q.trim(),
      'sort': sort,
      'page': page,
      'limit': 30,
    });
    final meta = res['meta'] as Map;
    return (items: _l(res['data']).map(Customer.fromJson).toList(), total: _i(meta['total']), hasNext: meta['hasNext'] == true);
  }

  Future<CustomerDetail> customer(String id) =>
      api.get('/control/customers/$id', map: (b) => CustomerDetail.fromJson(Map<String, dynamic>.from(b)));
  Future<CustomerDetail> setCustomerActive(String id, bool active) => api.patch(
    '/control/customers/$id/active',
    data: {'isActive': active},
    map: (b) => CustomerDetail.fromJson(Map<String, dynamic>.from(b)),
  );
  Future<CustomerDetail> adjustPoints(String id, int points, String reason) => api.post(
    '/control/customers/$id/points',
    data: {'points': points, 'reason': reason},
    map: (b) => CustomerDetail.fromJson(Map<String, dynamic>.from(b)),
  );

  Future<StoreHealth> health() => api.get('/control/health', map: (b) => StoreHealth.fromJson(Map<String, dynamic>.from(b)));

  // ---------------- reviews
  Future<({List<ReviewItem> items, int total, bool hasNext})> reviews({bool? approved, int page = 1}) async {
    final res = await api.page('/reviews', {'approved': ?approved?.toString(), 'page': page, 'limit': 30});
    final meta = res['meta'] as Map;
    return (items: _l(res['data']).map(ReviewItem.fromJson).toList(), total: _i(meta['total']), hasNext: meta['hasNext'] == true);
  }

  Future<void> setReviewApproved(String id, bool approved) => api.patch('/reviews/$id', data: {'approved': approved});
  Future<void> deleteReview(String id) => api.delete('/reviews/$id');

  // ---------------- coupons
  Future<List<Coupon>> coupons() => api.get('/coupons', map: (b) => _l(b).map(Coupon.fromJson).toList());
  Future<void> saveCoupon(String? id, Map<String, dynamic> body) =>
      id == null ? api.post('/coupons', data: body) : api.patch('/coupons/$id', data: body);
  Future<bool> deleteCoupon(String id) => api.delete('/coupons/$id', map: (b) => (b as Map)['archived'] == true);

  // ---------------- notifications
  Future<List<Map<String, dynamic>>> sentNotifications() =>
      api.get('/notifications', query: {'admin': '1', 'broadcast': '1', 'limit': 40}, map: (b) => _l(b is Map ? b['data'] : b));
  Future<Map<String, dynamic>> notificationStats() => api.get('/notifications/stats', map: (b) => Map<String, dynamic>.from(b));
  Future<void> sendNotification(Map<String, dynamic> body) => api.post('/notifications/send', data: body);

  // ---------------- settings
  Future<Map<String, dynamic>> settings() => api.get('/settings', map: (b) => Map<String, dynamic>.from(b));
  Future<Map<String, dynamic>> saveSettings(Map<String, dynamic> patch) =>
      api.patch('/settings', data: patch, map: (b) => Map<String, dynamic>.from(b));

  // ---------------- shipping
  Future<List<ShipZone>> zones() => api.get('/shipping/zones/all', map: (b) => _l(b).map(ShipZone.fromJson).toList());
  Future<void> saveZone(ShipZone z, {int? fee, bool? active}) => api.patch(
    '/shipping/zones/${z.id}',
    data: {'governorate': z.governorate, 'standardFee': fee ?? z.fee, 'isActive': active ?? z.isActive},
  );
  Future<void> saveArea(String id, Map<String, dynamic> patch) => api.patch('/shipping/areas/$id', data: patch);

  // ---------------- brands & categories
  Future<List<Map<String, dynamic>>> brandsAdmin() => api.get('/brands', query: {'all': 1}, map: (b) => _l(b));
  Future<void> patchBrand(String id, Map<String, dynamic> patch) => api.patch('/brands/$id', data: patch);
  Future<void> patchCategory(String id, Map<String, dynamic> patch) => api.patch('/categories/$id', data: patch);

  // ---------------- POS
  Future<Map<String, dynamic>> posOverview() => api.get('/sync/inventory/overview', map: (b) => Map<String, dynamic>.from(b));
  Future<List<Map<String, dynamic>>> posRuns() async => _l((await api.page('/sync/inventory/runs', {'limit': 20}))['data']);
}

final healthProvider = FutureProvider.autoDispose<StoreHealth>((ref) => ref.watch(repoProvider).health());
