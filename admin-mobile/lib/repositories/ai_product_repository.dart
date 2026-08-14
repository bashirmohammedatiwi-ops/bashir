import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/api_client.dart';
import '../core/utils/ai_model_prefs.dart';
import '../core/utils/api_error.dart';
import '../core/utils/json.dart';
import '../models/ai_autofill.dart';

class AiProductRepository {
  AiProductRepository(this._dio);

  final Dio _dio;

  Future<BarcodeCheckResult> checkBarcode(String barcode) async {
    try {
      final resp = await _dio.get(
        '/products/barcode-check',
        queryParameters: {'barcode': barcode.trim()},
      );
      return BarcodeCheckResult.fromJson(asMap(resp.data['data'] ?? resp.data));
    } on DioException catch (e) {
      throw Exception(extractApiError(e, 'فشل فحص الباركود'));
    }
  }

  Future<List<AiModelOption>> listModels() async {
    try {
      final resp = await _dio.get('/ai-product/models');
      final data = asMap(resp.data['data'] ?? resp.data);
      final raw = data['models'] as List? ?? [];
      final models = raw
          .map((e) => AiModelOption.fromApi(Map<String, dynamic>.from(e as Map)))
          .where((m) => m.id.isNotEmpty)
          .toList();
      return models.isEmpty ? AiModelOption.all : models;
    } on DioException {
      return AiModelOption.all;
    }
  }

  Future<AiAutofillResult> autofill({
    required String barcode,
    String? hint,
    String? model,
    bool force = false,
  }) async {
    try {
      final resp = await _dio.post(
        '/ai-product/autofill',
        data: {
          'barcode': barcode.trim(),
          if (hint != null && hint.trim().isNotEmpty) 'hint': hint.trim(),
          if (model != null && model.trim().isNotEmpty) 'model': model.trim(),
          if (force) 'force': true,
        },
        options: Options(receiveTimeout: const Duration(seconds: 120)),
      );
      return AiAutofillResult.fromJson(asMap(resp.data['data'] ?? resp.data));
    } on DioException catch (e) {
      throw Exception(extractApiError(e, 'فشل التعبئة الذكية'));
    }
  }

  /** مراجعة منتج موجود — نفس نتيجة autofill مع force + ملاحظات جودة */
  Future<AiAutofillResult> reviewExisting({
    required String barcode,
    String? hint,
    String? model,
  }) async {
    try {
      final resp = await _dio.post(
        '/ai-product/review-existing',
        data: {
          'barcode': barcode.trim(),
          if (hint != null && hint.trim().isNotEmpty) 'hint': hint.trim(),
          if (model != null && model.trim().isNotEmpty) 'model': model.trim(),
        },
        options: Options(receiveTimeout: const Duration(seconds: 120)),
      );
      return AiAutofillResult.fromJson(asMap(resp.data['data'] ?? resp.data));
    } on DioException catch (e) {
      throw Exception(extractApiError(e, 'فشل مراجعة المنتج'));
    }
  }

  Future<List<AiAutofillImage>> searchImages(
    String barcode, {
    String? nameHint,
    String mode = 'barcode',
    String? query,
  }) async {
    try {
      final resp = await _dio.post(
        '/ai-product/images',
        data: {
          'barcode': barcode.trim(),
          'mode': mode,
          if (nameHint != null && nameHint.trim().isNotEmpty) 'nameHint': nameHint.trim(),
          if (query != null && query.trim().isNotEmpty) 'query': query.trim(),
        },
        options: Options(receiveTimeout: const Duration(seconds: 90)),
      );
      final data = asMap(resp.data['data'] ?? resp.data);
      return (data['images'] as List? ?? [])
          .map((e) => AiAutofillImage.fromJson(Map<String, dynamic>.from(e as Map)))
          .where((i) => i.url.isNotEmpty)
          .toList();
    } on DioException catch (e) {
      throw Exception(extractApiError(e, 'فشل جلب الصور'));
    }
  }
}

final aiProductRepositoryProvider = Provider<AiProductRepository>((ref) {
  return AiProductRepository(ref.watch(dioProvider));
});
