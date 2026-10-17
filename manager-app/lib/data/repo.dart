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

/// كل نداءات السيرفر في مكان واحد.
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
      throw ApiError('هذا الحساب لا يملك صلاحية الإدارة');
    }
    return m;
  }

  Future<Me> me() => api.get(
    '/auth/me',
    map: (b) {
      final j = b as Map;
      return Me('${j['id']}', '${j['name'] ?? j['email'] ?? 'مدير'}', j['email']?.toString(), '${j['role']}');
    },
  );

  Future<void> logout() async {
    try {
      final r = await api.tokens.refresh;
      await api.post('/auth/logout', data: {'refreshToken': r});
    } catch (_) {}
    await api.tokens.clear();
  }

  // ---------------- control
  Future<Stats> stats() => api.get('/control/stats', map: (b) => Stats.fromJson(Map<String, dynamic>.from(b)));

  Future<List<NamedRef>> brands() => api.get('/control/brands', map: (b) => (b as List).map((e) => NamedRef.from(e)!).toList());

  Future<List<ActivityItem>> activity({int limit = 20}) => api.get(
    '/control/activity',
    query: {'limit': limit},
    map: (b) => (b as List).map((e) => ActivityItem.fromJson(Map<String, dynamic>.from(e))).toList(),
  );

  Future<PageResult<ProductSummary>> search({
    String q = '',
    String status = 'all',
    String? filter,
    String? brandId,
    int page = 1,
    int limit = 30,
  }) async {
    final res = await api.page('/control/search', {
      if (q.trim().isNotEmpty) 'q': q.trim(),
      'status': status,
      'filter': ?filter,
      'brandId': ?brandId,
      'page': page,
      'limit': limit,
    });
    final items = (res['data'] as List).map((e) => ProductSummary.fromJson(Map<String, dynamic>.from(e))).toList();
    final meta = res['meta'] as Map;
    return PageResult(items, (meta['total'] as num).toInt(), meta['hasNext'] == true);
  }

  Future<LookupResult> lookup(String code) =>
      api.get('/control/lookup', query: {'code': code}, map: (b) => LookupResult.fromJson(Map<String, dynamic>.from(b)));

  ProductDetail _detail(dynamic b) => ProductDetail.fromJson(Map<String, dynamic>.from(b));

  Future<ProductDetail> product(String id) => api.get('/control/products/$id', map: _detail);

  Future<ProductDetail> patchProduct(String id, Map<String, dynamic> patch) =>
      api.patch('/control/products/$id', data: patch, map: _detail);

  Future<ProductDetail> patchShade(String id, Map<String, dynamic> patch) => api.patch('/control/shades/$id', data: patch, map: _detail);

  Future<ProductDetail> bulkShades(String productId, bool active, {List<String>? ids}) =>
      api.post('/control/products/$productId/shades/bulk', data: {'isActive': active, 'ids': ?ids}, map: _detail);

  // ---------------- images
  /// رفع صورة من الهاتف — يرجع معرّف Media.
  Future<String> upload(String path, {String purpose = 'PRODUCT', void Function(double)? onProgress}) async {
    try {
      final form = FormData.fromMap({'purpose': purpose, 'file': await MultipartFile.fromFile(path, filename: path.split('/').last)});
      final res = await api.dio.post('/media/upload', data: form, onSendProgress: (s, t) => t > 0 ? onProgress?.call(s / t) : null);
      return '${(Api.unwrap(res.data) as Map)['id']}';
    } on DioException catch (e) {
      throw Api.toError(e);
    }
  }

  /// رفع صورة من بايتات (الويب).
  Future<String> uploadBytes(List<int> bytes, String filename, {String purpose = 'PRODUCT'}) async {
    try {
      final form = FormData.fromMap({'purpose': purpose, 'file': MultipartFile.fromBytes(bytes, filename: filename)});
      final res = await api.dio.post('/media/upload', data: form);
      return '${(Api.unwrap(res.data) as Map)['id']}';
    } on DioException catch (e) {
      throw Api.toError(e);
    }
  }

  Future<ProductDetail> addImages(String productId, List<String> mediaIds, {bool asCover = false}) =>
      api.post('/control/products/$productId/images', data: {'mediaIds': mediaIds, 'at': asCover ? 'start' : 'end'}, map: _detail);

  Future<ProductDetail> setImages(String productId, List<String> mediaIds) =>
      api.put('/control/products/$productId/images', data: {'mediaIds': mediaIds}, map: _detail);

  Future<ProductDetail> removeImage(String productId, String mediaId) =>
      api.delete('/control/products/$productId/images/$mediaId', map: _detail);

  Future<ProductDetail> replaceImage(String productId, String from, String to) =>
      api.post('/control/products/$productId/images/replace', data: {'from': from, 'to': to}, map: _detail);

  /// قص/تدوير/إطار على السيرفر. يرجع (المعرّف الجديد، القديم، المنتج بعد التعديل).
  Future<({String mediaId, String previous, bool unchanged, ProductDetail? product})> editImage(
    String mediaId,
    Map<String, dynamic> body,
  ) => api.post(
    '/control/media/$mediaId/edit',
    data: body,
    map: (b) {
      final j = b as Map;
      return (
        mediaId: '${j['mediaId']}',
        previous: '${j['previousMediaId']}',
        unchanged: j['unchanged'] == true,
        product: j['product'] is Map ? _detail(j['product']) : null,
      );
    },
  );

  Future<({int changed, int unchanged, int failed, List<Map> swaps, ProductDetail product})> frameAll(
    String productId, {
    required String mode,
    double? padding,
    bool includeShades = false,
  }) => api.post(
    '/control/products/$productId/images/frame',
    data: {'mode': mode, 'padding': ?padding, 'includeShades': includeShades},
    map: (b) {
      final j = b as Map;
      return (
        changed: (j['changed'] as num).toInt(),
        unchanged: (j['unchanged'] as num).toInt(),
        failed: (j['failed'] as num).toInt(),
        swaps: (j['swaps'] as List).cast<Map>(),
        product: _detail(j['product']),
      );
    },
  );

  // ---------------- drafts
  Future<List<DraftGroup>> groups({bool archived = false}) => api.get(
    '/control/draft-groups',
    query: {if (archived) 'archived': '1'},
    map: (b) => (b as List).map((e) => DraftGroup.fromJson(Map<String, dynamic>.from(e))).toList(),
  );

  Future<DraftGroup> createGroup(String name, {String? color, String? note}) => api.post(
    '/control/draft-groups',
    data: {'name': name, 'color': ?color, if (note != null && note.isNotEmpty) 'note': note},
    map: (b) => DraftGroup.fromJson(Map<String, dynamic>.from(b)),
  );

  Future<void> updateGroup(String id, Map<String, dynamic> patch) => api.patch('/control/draft-groups/$id', data: patch);
  Future<void> deleteGroup(String id) => api.delete('/control/draft-groups/$id');

  Future<PageResult<Draft>> drafts({String? groupId, String status = 'all', String? q, int page = 1, int limit = 60}) async {
    final res = await api.page('/control/drafts', {
      'groupId': ?groupId,
      'status': status,
      if (q != null && q.trim().isNotEmpty) 'q': q.trim(),
      'page': page,
      'limit': limit,
    });
    final items = (res['data'] as List).map((e) => Draft.fromJson(Map<String, dynamic>.from(e))).toList();
    final meta = res['meta'] as Map;
    return PageResult(items, (meta['total'] as num).toInt(), meta['hasNext'] == true);
  }

  Future<Draft> saveDraft({
    required String groupId,
    required String barcode,
    String? name,
    String? note,
    int? quantity,
    List<String> imageIds = const [],
  }) => api.post(
    '/control/drafts',
    data: {
      'groupId': groupId,
      'barcode': barcode,
      if (name != null && name.trim().isNotEmpty) 'name': name.trim(),
      if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
      'quantity': ?quantity,
      'imageIds': imageIds,
    },
    map: (b) => Draft.fromJson(Map<String, dynamic>.from(b)),
  );

  Future<Draft> updateDraft(String id, Map<String, dynamic> patch) =>
      api.patch('/control/drafts/$id', data: patch, map: (b) => Draft.fromJson(Map<String, dynamic>.from(b)));

  Future<void> deleteDrafts(List<String> ids) => api.post('/control/drafts/delete', data: {'ids': ids});
  Future<void> moveDrafts(List<String> ids, String groupId) => api.post('/control/drafts/move', data: {'ids': ids, 'groupId': groupId});
}
