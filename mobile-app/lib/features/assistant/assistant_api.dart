import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import 'models/assistant_models.dart';

typedef StreamEvent = ({String event, Map<String, dynamic> data});

/// عنصر سلة يُرسل مع كل رسالة كسياق للمساعد.
class AssistantCartItem {
  final String productId;
  final String? shadeId;
  final int quantity;

  const AssistantCartItem({
    required this.productId,
    required this.quantity,
    this.shadeId,
  });

  Map<String, dynamic> toJson() => {
        'productId': productId,
        if (shadeId != null) 'shadeId': shadeId,
        'quantity': quantity,
      };
}

/// عميل المساعد: يجرّب SSE أولاً ويتراجع تلقائياً للنقطة العادية.
class AssistantApi {
  final Dio _dio;
  AssistantApi(this._dio);

  Future<AssistantMessage> chat({
    required String message,
    String? conversationId,
    String? guestKey,
    String? screenProductId,
    List<AssistantCartItem> cart = const [],
  }) async {
    final r = await _dio.post(
      '/assistant/chat',
      data: {
        'message': message,
        if (conversationId != null) 'conversationId': conversationId,
        if (guestKey != null) 'guestKey': guestKey,
        if (screenProductId != null)
          'screen': {'productId': screenProductId},
        if (cart.isNotEmpty) 'cart': [for (final item in cart) item.toJson()],
      },
    );
    final data = _unwrap(r.data);
    return AssistantMessage.fromResponse(
      Map<String, dynamic>.from(data as Map),
      key: 'a_${DateTime.now().microsecondsSinceEpoch}',
    );
  }

  /// يبث دلتا النص ثم يعيد الرد النهائي المهيكل.
  /// يعيد null إذا فشل البث (فيستدعي المتصل النقطة العادية).
  Future<AssistantMessage?> chatStream({
    required String message,
    String? conversationId,
    String? guestKey,
    String? screenProductId,
    List<AssistantCartItem> cart = const [],
    required void Function(String delta) onDelta,
    void Function(String label)? onStatus,
  }) async {
    final Response<ResponseBody> resp;
    try {
      resp = await _dio.post<ResponseBody>(
        '/assistant/chat/stream',
        data: {
          'message': message,
          if (conversationId != null) 'conversationId': conversationId,
          if (guestKey != null) 'guestKey': guestKey,
          if (screenProductId != null)
            'screen': {'productId': screenProductId},
          if (cart.isNotEmpty) 'cart': [for (final item in cart) item.toJson()],
        },
        options: Options(
          responseType: ResponseType.stream,
          headers: {'Accept': 'text/event-stream', 'Accept-Encoding': 'identity'},
        ),
      );
    } on DioException {
      return null;
    }

    if (resp.statusCode != 200 || resp.data == null) return null;

    final completer = Completer<AssistantMessage?>();
    AssistantMessage? finalMessage;
    final buffer = StringBuffer();

    late final StreamSubscription<List<int>> sub;
    sub = resp.data!.stream.listen(
      (chunk) {
        buffer.write(utf8.decode(chunk, allowMalformed: true));
        final events = _parseSse(buffer.toString());
        for (final event in events) {
          switch (event.event) {
            case 'delta':
              onDelta('${event.data['text'] ?? ''}');
              break;
            case 'status':
              onStatus?.call('${event.data['label'] ?? ''}');
              break;
            case 'final':
              finalMessage = AssistantMessage.fromResponse(
                event.data,
                key: 'a_${DateTime.now().microsecondsSinceEpoch}',
              );
              break;
            case 'error':
              if (!completer.isCompleted) completer.complete(null);
              break;
          }
        }
        if (finalMessage != null && !completer.isCompleted) {
          completer.complete(finalMessage);
        }
      },
      onDone: () {
        if (!completer.isCompleted) completer.complete(finalMessage);
      },
      onError: (Object _) {
        if (!completer.isCompleted) completer.complete(null);
      },
      cancelOnError: true,
    );

    final result = await completer.future;
    await sub.cancel();
    // الاستجابة نجحت لكن البث انقطع قبل الرد النهائي — يعيد null للمتراجع للنقطة العادية.
    return result;
  }

  Future<bool> sendFeedback({
    required String messageId,
    required int value,
    String? guestKey,
  }) async {
    try {
      final r = await _dio.post(
        '/assistant/messages/$messageId/feedback',
        data: {'value': value},
        queryParameters: guestKey != null ? {'guestKey': guestKey} : null,
      );
      final data = _unwrap(r.data);
      return data is Map && data['saved'] == true;
    } on DioException {
      return false;
    }
  }

  /// ترحيب شخصي (بدون LLM) — يُبنى من الذاكرة والعروض الحالية.
  Future<Map<String, dynamic>> getWelcome({String? guestKey}) async {
    try {
      final r = await _dio.get(
        '/assistant/welcome',
        queryParameters: guestKey != null ? {'guestKey': guestKey} : null,
      );
      final data = _unwrap(r.data);
      if (data is Map) return Map<String, dynamic>.from(data);
    } on DioException {
      // الترحيب أفضل-جهد — الفشل يعرض الحالة الفارغة الافتراضية.
    }
    return {};
  }

  /// سجل محادثات المستخدم (يتطلب تسجيل دخول — يرمي خطأ للزوار).
  Future<List<AssistantConversationSummary>> getConversations() async {
    final r = await _dio.get('/assistant/conversations');
    final data = _unwrap(r.data);
    final items = data is Map ? data['items'] as List<dynamic>? : null;
    return (items ?? [])
        .whereType<Map>()
        .map((c) =>
            AssistantConversationSummary.fromJson(Map<String, dynamic>.from(c)))
        .toList();
  }

  /// رسالات محادثة بالمعرف — للزوار يمرر مفتاح الضيف.
  Future<List<ArchivedAssistantMessage>> getConversationMessages({
    required String conversationId,
    String? guestKey,
  }) async {
    final r = await _dio.get(
      '/assistant/conversations/$conversationId/messages',
      queryParameters: guestKey != null ? {'guestKey': guestKey} : null,
    );
    final data = _unwrap(r.data);
    final items = data is Map ? data['items'] as List<dynamic>? : null;
    return (items ?? [])
        .whereType<Map>()
        .map((m) =>
            ArchivedAssistantMessage.fromJson(Map<String, dynamic>.from(m)))
        .toList();
  }

  /// مسح الذاكرة طويلة المدى للمستخدم/الزائر.
  Future<bool> clearMemory({String? guestKey}) async {
    try {
      await _dio.post(
        '/assistant/memory/clear',
        queryParameters: guestKey != null ? {'guestKey': guestKey} : null,
      );
      return true;
    } on DioException {
      return false;
    }
  }

  dynamic _unwrap(dynamic body) {
    if (body is Map && body.containsKey('data')) return body['data'];
    return body;
  }

  /// يفك كتل SSE: أسطر event/data مفصولة بسطر فارغ.
  static List<StreamEvent> _parseSse(String raw) {
    final events = <StreamEvent>[];
    for (final block in raw.split('\n\n')) {
      String? eventName;
      final dataLines = <String>[];
      for (final line in block.split('\n')) {
        if (line.startsWith('event:')) {
          eventName = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.add(line.substring(5).trim());
        }
      }
      if (eventName == null || dataLines.isEmpty) continue;
      try {
        final decoded = jsonDecode(dataLines.join('\n'));
        if (decoded is Map) {
          events.add((event: eventName, data: Map<String, dynamic>.from(decoded)));
        }
      } catch (_) {
        // كتلة ناقصة — ستكتمل مع الدفعة القادمة.
      }
    }
    return events;
  }
}

final assistantApiProvider = Provider<AssistantApi>(
  (ref) => AssistantApi(ref.read(dioProvider)),
);
