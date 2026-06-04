import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../providers/chat_provider.dart';
import '../widgets/chat_bubble_widget.dart';
class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _send([String? text]) {
    final msg = text ?? _controller.text;
    if (msg.trim().isEmpty) return;
    ref.read(chatProvider.notifier).send(msg);
    _controller.clear();
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatProvider);

    ref.listen(chatProvider, (_, __) => _scrollToBottom());

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Stack(
              children: [
                const CircleAvatar(
                  backgroundColor: AppColors.primary,
                  child: Text('💜', style: TextStyle(fontSize: 20)),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: AppColors.chatOnline,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            Text(AppStrings.chatTitle),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: messages.isEmpty
                ? Center(
                    child: Text(
                      AppStrings.chatEmpty,
                      style: AppTextStyles.body(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ).animate().fadeIn(),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      return ChatBubbleWidget(message: messages[index]);
                    },
                  ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: AppStrings.quickReplies.map((q) {
                return Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: ActionChip(
                    label: Text(q, style: AppTextStyles.caption(size: 11)),
                    onPressed: () => _send(q),
                  ),
                );
              }).toList(),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              boxShadow: [AppColors.cardShadow],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: AppStrings.typeMessage,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: AppColors.accent,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                    ),
                    onSubmitted: (_) => _send(),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _send(),
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: const BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.send, color: Colors.white, size: 20),
                  ),
                ).animate().rotate(duration: 300.ms),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
