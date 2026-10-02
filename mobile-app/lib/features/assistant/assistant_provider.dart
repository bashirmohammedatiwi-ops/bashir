import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/locale_provider.dart';
import '../../data/services/api_service.dart';
import 'assistant_models.dart';

final assistantBusyProvider = StateProvider<bool>((ref) => false);

final assistantProvider = StateNotifierProvider<AssistantNotifier, List<AssistantChatMessage>>((ref) {
  return AssistantNotifier(ref);
});

class AssistantNotifier extends StateNotifier<List<AssistantChatMessage>> {
  AssistantNotifier(this._ref) : super(const []);

  final Ref _ref;
  var _seq = 0;
  bool _busy = false;

  String _id() => '${DateTime.now().microsecondsSinceEpoch}_${_seq++}';

  bool get isBusy => _busy;

  void reset() {
    if (_busy) return;
    state = const [];
  }

  Future<void> send(String raw) async {
    final message = raw.trim();
    if (message.isEmpty || _busy) return;
    final trimmed = message.length > 400 ? message.substring(0, 400) : message;

    _busy = true;
    _ref.read(assistantBusyProvider.notifier).state = true;
    final userId = _id();
    final pendingId = _id();
    final lang = _ref.read(languageCodeProvider);
    final prior = state;

    state = [
      ...prior,
      AssistantChatMessage(id: userId, isUser: true, text: trimmed),
      AssistantChatMessage(id: pendingId, isUser: false, text: '', isLoading: true),
    ];

    try {
      final history = prior
          .where((m) => !m.isLoading && m.text.isNotEmpty)
          .map((m) => {
                'role': m.isUser ? 'user' : 'assistant',
                'content': m.text.length > 160 ? m.text.substring(0, 160) : m.text,
              })
          .toList();
      final recent = history.length > 4 ? history.sublist(history.length - 4) : history;

      final raw = await _ref.read(apiServiceProvider).assistantChat(
            message: trimmed,
            lang: lang,
            history: recent,
          );
      final response = AssistantChatResponse.fromJson(raw);

      state = state.map((m) {
        if (m.id != pendingId) return m;
        return AssistantChatMessage(
          id: pendingId,
          isUser: false,
          text: response.reply,
          products: response.products,
          suggestions: response.suggestions,
          turnId: response.turnId,
          steps: response.steps,
        );
      }).toList();
    } catch (e) {
      final isAr = lang == 'ar';
      state = state.map((m) {
        if (m.id != pendingId) return m;
        return AssistantChatMessage(
          id: pendingId,
          isUser: false,
          text: isAr
              ? 'تعذّر الاتصال بالمساعد. حاولي مرة أخرى بعد قليل.'
              : 'Could not reach the assistant. Please try again.',
          isError: true,
        );
      }).toList();
    } finally {
      _busy = false;
      _ref.read(assistantBusyProvider.notifier).state = false;
    }
  }

  Future<void> rate(String messageId, int rating, {String? note}) async {
    final target = state.where((m) => m.id == messageId).firstOrNull;
    final turnId = target?.turnId;
    if (target == null || turnId == null) return;
    final before = target.rating;
    state = [for (final m in state) m.id == messageId ? m.copyWith(rating: rating) : m];
    try {
      await _ref.read(apiServiceProvider).assistantFeedback(turnId, rating, note: note);
    } catch (_) {
      state = [
        for (final m in state)
          m.id == messageId
              ? AssistantChatMessage(
                  id: m.id,
                  isUser: m.isUser,
                  text: m.text,
                  products: m.products,
                  suggestions: m.suggestions,
                  turnId: m.turnId,
                  rating: before,
                  steps: m.steps,
                )
              : m,
      ];
    }
  }

  void productOpened(String? turnId, String productId) {
    if (turnId == null) return;
    _ref.read(apiServiceProvider).assistantTap(turnId, productId);
  }

  void productCarted(String? turnId, String productId) {
    if (turnId == null) return;
    _ref.read(apiServiceProvider).assistantCart(turnId, productId);
  }
}
