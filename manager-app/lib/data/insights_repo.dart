import '../core/format.dart';
import 'repo.dart';

int _i(dynamic v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;
int? _in(dynamic v) => v == null ? null : (v is num ? v.toInt() : int.tryParse('$v'));
String? _s(dynamic v) => v?.toString();
List<Map<String, dynamic>> _l(dynamic v) => v is List ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList() : const [];

class CountSummary {
  CountSummary.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      name = '${j['name']}',
      note = _s(j['note']),
      open = j['status'] == 'OPEN',
      createdAt = parseDate(j['createdAt']),
      closedAt = parseDate(j['closedAt']),
      lines = _i(j['lines']),
      units = _i(j['units']);
  final String id, name;
  final String? note;
  final bool open;
  final DateTime? createdAt, closedAt;
  final int lines, units;
}

class CountLine {
  CountLine.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      barcode = '${j['barcode']}',
      name = _s(j['name']),
      productId = _s(j['productId']),
      counted = _i(j['counted']),
      expected = _in(j['expected']),
      source = _s(j['source']),
      diff = _in(j['diff']),
      thumb = _s(j['thumb']);
  final String id, barcode;
  final String? name, productId, source, thumb;
  int counted;
  final int? expected, diff;
}

class CountDetail {
  CountDetail.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      name = '${j['name']}',
      open = j['status'] == 'OPEN',
      createdAt = parseDate(j['createdAt']),
      lines = _l(j['lines']).map(CountLine.fromJson).toList(),
      summary = Map<String, dynamic>.from(j['summary'] as Map? ?? const {});
  final String id, name;
  final bool open;
  final DateTime? createdAt;
  final List<CountLine> lines;
  final Map<String, dynamic> summary;
  int s(String k) => _i(summary[k]);
}

class Staff {
  Staff.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      name = _s(j['name']) ?? _s(j['email']) ?? '—',
      email = _s(j['email']),
      phone = _s(j['phone']),
      role = '${j['role']}',
      isActive = j['isActive'] != false,
      lastLoginAt = parseDate(j['lastLoginAt']),
      actions7d = _i(j['actions7d']),
      lastActionAt = parseDate(j['lastActionAt']);
  final String id, name, role;
  final String? email, phone;
  final bool isActive;
  final DateTime? lastLoginAt, lastActionAt;
  final int actions7d;
  String get roleLabel => switch (role) {
    'SUPER_ADMIN' => 'مدير عام',
    'ADMIN' => 'مدير',
    _ => 'موظف',
  };
}

/// الجرد، طلب الزبائن، التقارير، الموظفون، البنرات.
extension InsightsRepo on Repo {
  Future<List<CountSummary>> counts() => api.get('/control/counts', map: (b) => _l(b).map(CountSummary.fromJson).toList());
  Future<CountDetail> createCount(String name, {String? note}) =>
      api.post('/control/counts', data: {'name': name, 'note': ?note}, map: (b) => CountDetail.fromJson(Map<String, dynamic>.from(b)));
  Future<CountDetail> count(String id) => api.get('/control/counts/$id', map: (b) => CountDetail.fromJson(Map<String, dynamic>.from(b)));
  Future<({CountLine line, Map<String, dynamic> summary})> countScan(String id, String code, {int qty = 1}) => api.post(
    '/control/counts/$id/scan',
    data: {'barcode': code, 'qty': qty},
    map: (b) {
      final j = b as Map;
      return (line: CountLine.fromJson(Map<String, dynamic>.from(j['line'])), summary: Map<String, dynamic>.from(j['summary']));
    },
  );
  Future<CountDetail> setCountLine(String id, String lineId, int counted) => api.patch(
    '/control/counts/$id/lines/$lineId',
    data: {'counted': counted},
    map: (b) => CountDetail.fromJson(Map<String, dynamic>.from(b)),
  );
  Future<CountDetail> deleteCountLine(String id, String lineId) =>
      api.delete('/control/counts/$id/lines/$lineId', map: (b) => CountDetail.fromJson(Map<String, dynamic>.from(b)));
  Future<CountDetail> closeCount(String id, {bool reopen = false}) =>
      api.post('/control/counts/$id/close', data: {'reopen': reopen}, map: (b) => CountDetail.fromJson(Map<String, dynamic>.from(b)));
  Future<void> deleteCount(String id) => api.delete('/control/counts/$id');

  Future<Map<String, dynamic>> demand() => api.get('/control/demand', map: (b) => Map<String, dynamic>.from(b));
  Future<Map<String, dynamic>> report(int days) =>
      api.get('/control/reports', query: {'days': days}, map: (b) => Map<String, dynamic>.from(b));

  Future<List<Staff>> staff() => api.get('/control/staff', map: (b) => _l(b).map(Staff.fromJson).toList());
  Future<List<Map<String, dynamic>>> staffActivity(String id) => api.get('/control/staff/$id/activity', map: (b) => _l(b));
  Future<List<Staff>> setStaffActive(String id, bool active) =>
      api.patch('/control/staff/$id/active', data: {'isActive': active}, map: (b) => _l(b).map(Staff.fromJson).toList());

  Future<List<Map<String, dynamic>>> banners() => api.get('/control/banners', map: (b) => _l(b));
  Future<void> patchBanner(Map<String, dynamic> banner, Map<String, dynamic> patch) =>
      api.patch('/banners/${banner['id']}', data: {'title': banner['title'], ...patch});
}
