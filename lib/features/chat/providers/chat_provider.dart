import 'dart:math';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/chat_message_model.dart';

const _supportReplies = [
  'مرحباً بكِ في متجر الحياة! 💜 كيف يمكنني مساعدتك؟',
  'شكراً لتواصلك معنا! سأساعدك في أقرب وقت ممكن 😊',
  'يسعدنا خدمتك! هل لديك استفسار عن منتج أو طلب؟',
  'تم استلام رسالتك ✅ فريقنا سيرد عليك خلال دقائق',
  'للاستفسار عن طلبك، يرجى إرسال رقم الطلب 📦',
];

class ChatNotifier extends StateNotifier<ChatState> {
  ChatNotifier() : super(const ChatState());

  final _random = Random();

  void sendMessage(String text) {
    if (text.trim().isEmpty) return;
    final userMsg = ChatMessageModel(
      id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
      text: text.trim(),
      sender: MessageSender.user,
      timestamp: DateTime.now(),
      status: MessageStatus.sent,
    );
    state = state.copyWith(
      messages: [...state.messages, userMsg],
      isTyping: false,
    );
    _simulateReply();
  }

  void _simulateReply() {
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      state = state.copyWith(isTyping: true);
    });
    Future.delayed(const Duration(milliseconds: 3500), () {
      if (!mounted) return;
      final reply = _supportReplies[_random.nextInt(_supportReplies.length)];
      final supportMsg = ChatMessageModel(
        id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
        text: reply,
        sender: MessageSender.support,
        timestamp: DateTime.now(),
      );
      state = state.copyWith(
        messages: [...state.messages, supportMsg],
        isTyping: false,
      );
    });
  }
}

class ChatState {
  const ChatState({this.messages = const [], this.isTyping = false});

  final List<ChatMessageModel> messages;
  final bool isTyping;

  ChatState copyWith({
    List<ChatMessageModel>? messages,
    bool? isTyping,
  }) =>
      ChatState(
        messages: messages ?? this.messages,
        isTyping: isTyping ?? this.isTyping,
      );
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier();
});
