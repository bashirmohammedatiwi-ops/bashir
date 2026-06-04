import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';

/// جميع endpoints العملاء — متوافقة مع [backend] ولوحة التحكم.
class StoreApi {
  StoreApi(this._dio);
  final Dio _dio;

  dynamic _unwrap(dynamic data) {
    if (data is Map && data.containsKey('data')) return data['data'];
    return data;
  }

  List<Map<String, dynamic>> _list(dynamic data) {
    final raw = _unwrap(data);
    if (raw is List) return raw.cast<Map<String, dynamic>>();
    return [];
  }

  Map<String, dynamic> _map(dynamic data) {
    final raw = _unwrap(data);
    if (raw is Map<String, dynamic>) return raw;
    if (raw is Map) return Map<String, dynamic>.from(raw);
    return {};
  }

  Future<bool> health() async {
    try {
      await _dio.get('/health');
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>> home() async {
    final resp = await _dio.get('/home');
    return _map(resp.data);
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final resp = await _dio.post('/auth/login', data: {'email': email, 'password': password});
    return _map(resp.data);
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String name,
    required String password,
    String? phone,
  }) async {
    final resp = await _dio.post('/auth/register', data: {
      'email': email,
      'name': name,
      'password': password,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
    });
    return _map(resp.data);
  }

  Future<Map<String, dynamic>> me() async {
    final resp = await _dio.get('/auth/me');
    return _map(resp.data);
  }

  Future<void> logout({String? refreshToken}) async {
    await _dio.post('/auth/logout', data: {
      if (refreshToken != null) 'refreshToken': refreshToken,
    });
  }

  Future<Map<String, dynamic>> updateMe(Map<String, dynamic> body) async {
    final resp = await _dio.patch('/auth/me', data: body);
    return _map(resp.data);
  }

  Future<List<Map<String, dynamic>>> products(Map<String, dynamic> params) async {
    final resp = await _dio.get('/products', queryParameters: {'lite': 1, ...params});
    return _list(resp.data);
  }

  Future<Map<String, dynamic>> product(String idOrSlug) async {
    final resp = await _dio.get('/products/$idOrSlug');
    return _map(resp.data);
  }

  Future<List<Map<String, dynamic>>> categories() async {
    final resp = await _dio.get('/categories');
    return _list(resp.data);
  }

  Future<List<Map<String, dynamic>>> brands({bool featured = false}) async {
    final resp = await _dio.get('/brands', queryParameters: featured ? {'featured': 1} : null);
    return _list(resp.data);
  }

  Future<Map<String, dynamic>> brand(String slug) async {
    final resp = await _dio.get('/brands/$slug');
    return _map(resp.data);
  }

  Future<List<Map<String, dynamic>>> packages({String? kind}) async {
    final resp = await _dio.get('/packages', queryParameters: {
      'lite': 1,
      if (kind != null) 'kind': kind,
    });
    return _list(resp.data);
  }

  Future<Map<String, dynamic>> packageBySlug(String slug) async {
    final resp = await _dio.get('/packages/slug/$slug');
    return _map(resp.data);
  }

  Future<Map<String, dynamic>> packageById(String id) async {
    final resp = await _dio.get('/packages/$id');
    return _map(resp.data);
  }

  Future<List<Map<String, dynamic>>> skinConcerns() async {
    final resp = await _dio.get('/skin-concerns');
    return _list(resp.data);
  }

  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> body) async {
    final resp = await _dio.post('/orders', data: body);
    return _map(resp.data);
  }

  Future<List<Map<String, dynamic>>> orders({int page = 1, String? status}) async {
    final resp = await _dio.get('/orders', queryParameters: {
      'lite': 1,
      'page': page,
      'limit': 20,
      if (status != null) 'status': status,
    });
    return _list(resp.data);
  }

  Future<Map<String, dynamic>> order(String id) async {
    final resp = await _dio.get('/orders/$id');
    return _map(resp.data);
  }

  Future<Map<String, dynamic>> cancelOrder(String id) async {
    final resp = await _dio.patch('/orders/$id/cancel');
    return _map(resp.data);
  }

  Future<List<Map<String, dynamic>>> addresses() async {
    final resp = await _dio.get('/addresses');
    return _list(resp.data);
  }

  Future<Map<String, dynamic>> createAddress(Map<String, dynamic> body) async {
    final resp = await _dio.post('/addresses', data: body);
    return _map(resp.data);
  }

  Future<List<Map<String, dynamic>>> shippingZones() async {
    final resp = await _dio.get('/shipping/zones');
    return _list(resp.data);
  }

  Future<Map<String, dynamic>> shippingQuote({
    required String governorate,
    String? area,
    required int subtotal,
    String deliveryOption = 'STANDARD',
  }) async {
    final resp = await _dio.get('/shipping/quote', queryParameters: {
      'governorate': governorate,
      if (area != null && area.isNotEmpty) 'area': area,
      'subtotal': subtotal,
      'deliveryOption': deliveryOption,
    });
    return _map(resp.data);
  }

  Future<Map<String, dynamic>?> validateCoupon(String code) async {
    final resp = await _dio.get('/coupons/validate/$code');
    final data = _unwrap(resp.data);
    if (data == null) return null;
    return _map(data);
  }

  Future<Map<String, dynamic>> loyalty() async {
    final resp = await _dio.get('/loyalty');
    return _map(resp.data);
  }

  Future<List<Map<String, dynamic>>> wishlist() async {
    final resp = await _dio.get('/wishlist');
    return _list(resp.data);
  }

  Future<void> toggleWishlist(String productId) async {
    await _dio.post('/wishlist/$productId/toggle');
  }

  Future<List<Map<String, dynamic>>> productReviews(String productId) async {
    final resp = await _dio.get('/reviews/product/$productId', queryParameters: {'page': 1, 'limit': 20});
    return _list(resp.data);
  }

  Future<void> createReview({
    required String productId,
    required int rating,
    String? comment,
  }) async {
    await _dio.post('/reviews', data: {
      'productId': productId,
      'rating': rating,
      if (comment != null && comment.isNotEmpty) 'comment': comment,
    });
  }

  Future<List<Map<String, dynamic>>> notifications({int page = 1}) async {
    final resp = await _dio.get('/notifications', queryParameters: {'page': page, 'limit': 20});
    return _list(resp.data);
  }
}

final storeApiProvider = Provider<StoreApi>((ref) => StoreApi(ref.read(apiClientProvider)));
