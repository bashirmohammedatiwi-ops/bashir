import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../../core/utils/media_url.dart';
import '../cart/cart_provider.dart';
import 'assistant_api.dart';
import 'models/assistant_models.dart';

const _kConversationId = 'assistant_conversation_id';

/// مفتاح ضيف دائم للجهاز — يحفظ هوية المحادثات بدون حساب.
final assistantGuestKeyProvider = FutureProvider<String>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  final existing = prefs.getString('assistant_guest_key');
  if (existing != null && existing.length >= 8) return existing;
  final key = _randomKey();
  await prefs.setString('assistant_guest_key', key);
  return key;
});

String _randomKey() {
  final rand = Random.secure();
  return List.generate(24, (_) => rand.nextInt(16).toRadixString(16)).join();
}

/// معرّف المحادثة الحالي (يُحفظ لاستكمال نفس المحادثة لاحقاً).
final assistantConversationIdProvider =
    StateProvider<String?>((ref) => null);

/// سجل المحادثات — يتطلب تسجيل دخول، يعرض فارغاً للزوار.
final assistantHistoryProvider =
    FutureProvider.autoDispose<List<AssistantConversationSummary>>((ref) async {
  return ref.read(assistantApiProvider).getConversations();
});

/// ترحيب شخصي عند فتح الشاشة (ذاكرة + عروض) — أفضل-جهد.
final assistantWelcomeProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final guestKey = await ref.read(assistantGuestKeyProvider.future);
  return ref.read(assistantApiProvider).getWelcome(guestKey: guestKey);
});

class AssistantUiState {
  final List<AssistantMessage> messages;
  final bool sending;
  final String? error;
  /// عدد العناصر التي أضيفت للسلة آخر مرة (لإظهار تأكيد SnackBar).
  final int cartAddedCount;
  final int cartAddedStamp;

  const AssistantUiState({
    this.messages = const [],
    this.sending = false,
    this.error,
    this.cartAddedCount = 0,
    this.cartAddedStamp = 0,
  });

  AssistantUiState copyWith({
    List<AssistantMessage>? messages,
    bool? sending,
    String? error,
    bool clearError = false,
    int? cartAddedCount,
    int? cartAddedStamp,
  }) {
    return AssistantUiState(
      messages: messages ?? this.messages,
      sending: sending ?? this.sending,
      error: clearError ? null : (error ?? this.error),
      cartAddedCount: cartAddedCount ?? this.cartAddedCount,
      cartAddedStamp: cartAddedStamp ?? this.cartAddedStamp,
    );
  }
}

class AssistantNotifier extends StateNotifier<AssistantUiState> {
  AssistantNotifier(this.ref) : super(const AssistantUiState());

  final Ref ref;

  bool _restored = false;

  Future<void> send(String rawMessage, {String? screenProductId}) async {
    final message = rawMessage.trim();
    if (message.isEmpty || state.sending) return;

    final userMessage = AssistantMessage(
      key: 'u_${DateTime.now().microsecondsSinceEpoch}',
      role: AssistantRole.user,
      text: message,
    );
    const streamingBubble = AssistantMessage(
      key: 'streaming',
      role: AssistantRole.assistant,
      text: '',
      isStreaming: true,
    );

    state = state.copyWith(
      messages: [...state.messages, userMessage, streamingBubble],
      sending: true,
      clearError: true,
    );

    AssistantMessage reply;
    try {
      final api = ref.read(assistantApiProvider);
      final guestKey = await ref.read(assistantGuestKeyProvider.future);
      final conversationId = ref.read(assistantConversationIdProvider);
      final screen = screenProductId;
      final cart = _cartSummary();

      reply = await api.chatStream(
            message: message,
            conversationId: conversationId,
            guestKey: guestKey,
            screenProductId: screen,
            cart: cart,
            onDelta: _appendToStreaming,
            onStatus: _updateStatusLabel,
          ) ??
          await api.chat(
            message: message,
            conversationId: conversationId,
            guestKey: guestKey,
            screenProductId: screen,
            cart: cart,
          );

      state = state.copyWith(
        messages: [
          ...state.messages.where((m) => m.key != 'streaming'),
          reply,
        ],
        sending: false,
      );
      if (reply.conversationId != null && reply.conversationId!.isNotEmpty) {
        await _persistConversationId(reply.conversationId!);
      }
      await _executeActions(reply);
    } on ApiException catch (e) {
      _fail(e.message.isNotEmpty ? e.message : null, input: message);
    } catch (_) {
      _fail(null, input: message);
    }
  }

  void _fail(String? apiMessage, {required String input}) {
    state = state.copyWith(
      messages: [
        ...state.messages.where((m) => m.key != 'streaming'),
        AssistantMessage(
          key: 'e_${DateTime.now().microsecondsSinceEpoch}',
          role: AssistantRole.assistant,
          text: apiMessage ?? 'تعذر الاتصال بالمساعد — تحقق من الإنترنت وحاول ثانية.',
          failedInput: input,
        ),
      ],
      sending: false,
      error: apiMessage ?? 'network',
    );
  }

  /// إعادة إرسال رسالة مستخدم فشلت سابقاً.
  Future<void> retryFailed(AssistantMessage failed) async {
    if (failed.failedInput == null) return;
    state = state.copyWith(
      messages: state.messages.where((m) => m.key != failed.key).toList(),
    );
    await send(failed.failedInput!);
  }

  void _appendToStreaming(String delta) {
    final messages = [...state.messages];
    final index = messages.indexWhere((m) => m.key == 'streaming');
    if (index < 0) return;
    messages[index] = messages[index].copyWith(text: messages[index].text + delta);
    state = state.copyWith(messages: messages);
  }

  void _updateStatusLabel(String label) {
    if (label.isEmpty) return;
    final messages = [...state.messages];
    final index = messages.indexWhere((m) => m.key == 'streaming');
    if (index < 0) return;
    messages[index] = messages[index].copyWith(statusLabel: label);
    state = state.copyWith(messages: messages);
  }

  /// لقطة السلة الحالية كسياق يرسل مع الرسالة.
  List<AssistantCartItem> _cartSummary() {
    return ref
        .read(cartProvider)
        .items
        .take(30)
        .map((i) => AssistantCartItem(
              productId: i.productId,
              shadeId: i.shadeId,
              quantity: i.quantity,
            ))
        .toList();
  }

  /// ينفذ إجراءات السلة التي جهزها المساعد — السلة client-side في هذا التطبيق.
  Future<void> _executeActions(AssistantMessage message) async {
    var added = 0;
    for (final action in message.actions) {
      if (action.productId.isEmpty) continue;
      try {
        final api = ref.read(apiServiceProvider);
        final product = await api.getProduct(action.productId, forceRefresh: true);
        ProductShade? shade;
        if (action.shadeId != null) {
          for (final s in product.displayableShades) {
            if (s.id == action.shadeId) {
              shade = s;
              break;
            }
          }
        }
        if (shade == null && product.hasMultipleDisplayableShades) {
          // البطاقة تحمل اسم الدرجة المختارة — نطابقها بالاسم.
          final shadeName = action.shadeName;
          if (shadeName != null) {
            for (final s in product.displayableShades) {
              if (s.name == shadeName) {
                shade = s;
                break;
              }
            }
          }
        }
        final cart = ref.read(cartProvider.notifier);
        if (cart.add(product, quantity: action.quantity, shade: shade)) {
          added += 1;
        }
      } catch (_) {
        // فشل التنفيذ الصامت — المستخدم يرى البطاقة ويضيف يدوياً.
      }
    }
    if (added > 0) _notifyCartAdded(added);
  }

  /// إضافة يدوية من زر البطاقة داخل الشات — يعيد true عند النجاح.
  Future<bool> addToCart(AssistantProductCard card) async {
    if (!card.inStock || card.id.isEmpty) return false;
    try {
      final api = ref.read(apiServiceProvider);
      final product = await api.getProduct(card.id, forceRefresh: true);
      ProductShade? shade;
      if (card.shadeName != null) {
        for (final s in product.displayableShades) {
          if (s.name == card.shadeName) {
            shade = s;
            break;
          }
        }
      }
      final ok = ref.read(cartProvider.notifier).add(product, shade: shade);
      if (ok) _notifyCartAdded(1);
      return ok;
    } catch (_) {
      return false;
    }
  }

  void _notifyCartAdded(int count) {
    state = state.copyWith(cartAddedCount: count, cartAddedStamp: state.cartAddedStamp + 1);
  }

  /// يستعيد آخر محادثة محفوظة بعد إعادة تشغيل التطبيق (مرة واحدة).
  Future<void> restoreLastConversation() async {
    if (_restored || state.messages.isNotEmpty) return;
    _restored = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      final id = prefs.getString(_kConversationId);
      if (id == null || id.isEmpty) return;
      await loadConversation(id);
    } catch (_) {
      // الاستعادة أفضل-جهد — نبدأ محادثة جديدة عند الفشل.
    }
  }

  /// يحمل محادثة من السجل للشاشة الحالية.
  Future<void> loadConversation(String conversationId) async {
    final api = ref.read(assistantApiProvider);
    final guestKey = await ref.read(assistantGuestKeyProvider.future);
    final archived = await api.getConversationMessages(
      conversationId: conversationId,
      guestKey: guestKey,
    );
    final messages = <AssistantMessage>[];
    for (final m in archived.take(60)) {
      messages.add(AssistantMessage.fromArchived(
        m,
        key: 'h_${messages.length}_$conversationId',
      ));
    }
    ref.read(assistantConversationIdProvider.notifier).state = conversationId;
    await _persistConversationId(conversationId);
    state = state.copyWith(messages: messages, clearError: true);
  }

  Future<void> _persistConversationId(String id) async {
    ref.read(assistantConversationIdProvider.notifier).state = id;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kConversationId, id);
  }

  Future<void> sendFeedback(String? messageId, int value) async {
    if (messageId == null || messageId.isEmpty) return;
    final guestKey = await ref.read(assistantGuestKeyProvider.future);
    await ref.read(assistantApiProvider).sendFeedback(
          messageId: messageId,
          value: value,
          guestKey: guestKey,
        );
  }

  Future<void> clearConversation() async {
    ref.read(assistantConversationIdProvider.notifier).state = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kConversationId);
    state = const AssistantUiState();
  }

  /// يحوّل quick reply إلى رسالة مستخدم فعلية.
  Future<void> sendQuickReply(String action) => send(action);
}

final assistantProvider =
    StateNotifierProvider<AssistantNotifier, AssistantUiState>(
  (ref) => AssistantNotifier(ref),
);

/// يحوّل رابط الصورة النسبي إلى رابط كامل.
String assistantImageUrl(String? raw) => resolveMediaUrl(raw);
