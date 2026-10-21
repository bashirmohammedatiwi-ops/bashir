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
  bool get isAdmin => role == 'SUPER_ADMIN' || role == 'ADMIN';
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

  /// المجموعة المختارة، أو أول مجموعة موجودة، أو مجموعة «عام» تُنشأ تلقائياً — الحفظ لا يتعطل أبداً.
  Future<String> ensureGroup(String? selected) async {
    if (selected != null) return selected;
    final list = await groups();
    if (list.isNotEmpty) return list.first.id;
    return (await createGroup('عام', color: 'violet')).id;
  }

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

/// ملحقات المرحلة الثانية: الطلبات، المبيعات، إنشاء المنتجات، التدرجات، نواقص الكاشير، صور الويب.
extension RepoMore on Repo {
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
      counts: (res['counts'] as Map).map((k, v) => MapEntry('$k', (v as num).toInt())),
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

  Future<SalesSummary> sales() => api.get('/control/sales', map: (b) => SalesSummary.fromJson(Map<String, dynamic>.from(b)));

  // ---------------- catalog
  Future<List<CategoryNode>> categories() =>
      api.get('/control/categories', map: (b) => (b as List).map((e) => CategoryNode.fromJson(Map<String, dynamic>.from(e))).toList());

  Future<({List<PosItem> items, int total, int units, bool hasNext})> posMissing({
    String? q,
    bool unsavedOnly = false,
    int page = 1,
  }) async {
    final res = await api.page('/control/pos-missing', {
      if (q != null && q.trim().isNotEmpty) 'q': q.trim(),
      if (unsavedOnly) 'saved': 'unsaved',
      'page': page,
      'limit': 40,
    });
    final meta = res['meta'] as Map;
    return (
      items: (res['data'] as List).map((e) => PosItem.fromJson(Map<String, dynamic>.from(e))).toList(),
      total: (meta['total'] as num).toInt(),
      units: (meta['units'] as num).toInt(),
      hasNext: meta['hasNext'] == true,
    );
  }

  Future<({ProductDetail product, int failedImages})> createProduct(Map<String, dynamic> body) => api.post(
    '/control/products',
    data: body,
    map: (b) {
      final j = b as Map;
      return (
        product: ProductDetail.fromJson(Map<String, dynamic>.from(j['product'])),
        failedImages: (j['failedImages'] as num?)?.toInt() ?? 0,
      );
    },
  );

  Future<ProductDetail> addShade(String productId, Map<String, dynamic> body) =>
      api.post('/control/products/$productId/shades', data: body, map: (b) => ProductDetail.fromJson(Map<String, dynamic>.from(b)));

  Future<ProductDetail> deleteShade(String shadeId) =>
      api.delete('/control/shades/$shadeId', map: (b) => ProductDetail.fromJson(Map<String, dynamic>.from(b)));

  Future<int> bulkProducts(List<String> ids, bool active) =>
      api.post('/control/products/bulk', data: {'ids': ids, 'isActive': active}, map: (b) => ((b as Map)['updated'] as num).toInt());

  // ---------------- web images & AI
  /// صور الويب مثل Google Images — [page] يبدأ من 0 ويستمر بلا حد.
  Future<({List<WebImage> items, bool hasMore})> webImageSearch(String q, {int page = 0}) => api.get(
    '/control/web-images',
    query: {'q': q, 'page': page},
    map: (b) {
      final j = b as Map;
      return (
        items: (j['items'] as List? ?? const []).map((e) => WebImage.from(Map<String, dynamic>.from(e))).toList(),
        hasMore: j['hasMore'] == true,
      );
    },
  );


  /// صور المنتج من الويب/المتاجر بالباركود أو بالاسم (بلا ذكاء اصطناعي).
  Future<List<WebImage>> webImages({String? barcode, String? name, bool byName = false}) {
    final code = (barcode ?? '').replaceAll(RegExp(r'[^0-9A-Za-z\-]'), '');
    return api.post(
      '/ai-product/images',
      data: {
        'barcode': code.length >= 6 ? code : '000000',
        'mode': byName ? 'name' : 'barcode',
        if (name != null && name.trim().isNotEmpty) 'nameHint': name.trim(),
        if (byName && name != null) 'query': name.trim(),
      },
      options: Options(receiveTimeout: const Duration(seconds: 60)),
      map: (b) => ((b as Map)['images'] as List? ?? const []).map((e) => WebImage.from(Map<String, dynamic>.from(e))).toList(),
    );
  }

  /// تعبئة ذكية: الأسماء والوصف والبراند والقسم والصور من الباركود.
  Future<Autofill> autofill(String barcode, {String? hint}) => api.post(
    '/ai-product/autofill',
    data: {'barcode': barcode, if (hint != null && hint.trim().isNotEmpty) 'hint': hint.trim()},
    options: Options(receiveTimeout: const Duration(seconds: 180)),
    map: (b) => Autofill.fromJson(Map<String, dynamic>.from(b)),
  );

  Future<String> uploadFromUrl(String url, {String purpose = 'PRODUCT'}) => api.post(
    '/media/upload-from-url',
    data: {'url': url, 'purpose': purpose},
    options: Options(receiveTimeout: const Duration(seconds: 120)),
    map: (b) => '${(b as Map)['id']}',
  );
}
