import 'dart:math';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/chat_message_model.dart';

class ChatNotifier extends StateNotifier<List<ChatMessageModel>> {
  ChatNotifier() : super(const []);

  final _random = Random();
  int _seq = 0;

  static const _replies = [
    'مرحباً! كيف يمكنني مساعدتكِ اليوم؟',
    'سأتحقق من طلبكِ وأعود إليكِ قريباً.',
    'يمكنكِ متابعة حالة الطلب من قسم «طلباتي» بعد تسجيل الدخول.',
    'للاستفسار عن منتج معيّن، أرسلي اسم المنتج أو رابطه.',
    'فريق الدعم متاح عبر واتساب أيضاً من الصفحة الرئيسية.',
  ];

  void send(String text) {
    if (text.trim().isEmpty) return;
    final now = DateTime.now();
    state = [
      ...state,
      ChatMessageModel(
        id: 'u_${_seq++}',
        text: text.trim(),
        sender: MessageSender.user,
        timestamp: now,
        status: MessageStatus.sent,
      ),
    ];
    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      state = [
        ...state,
        ChatMessageModel(
          id: 's_${_seq++}',
          text: _replies[_random.nextInt(_replies.length)],
          sender: MessageSender.support,
          timestamp: DateTime.now(),
        ),
      ];
    });
  }
}

final chatProvider =
    StateNotifierProvider<ChatNotifier, List<ChatMessageModel>>((ref) {
  return ChatNotifier();
});
