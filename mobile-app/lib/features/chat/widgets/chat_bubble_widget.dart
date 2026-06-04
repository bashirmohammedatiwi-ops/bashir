import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../data/models/chat_message_model.dart';

class ChatBubbleWidget extends StatelessWidget {
  const ChatBubbleWidget({super.key, required this.message});

  final ChatMessageModel message;

  @override
  Widget build(BuildContext context) {
    final isUser = message.sender == MessageSender.user;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 16),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        child: Column(
          crossAxisAlignment:
              isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (!isUser)
              Padding(
                padding: const EdgeInsets.only(bottom: 4, right: 8),
                child: Text(
                  AppStrings.chatSupportName,
                  style: AppTextStyles.caption(color: AppColors.primary),
                ),
              ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: isUser ? AppColors.primaryGradient : null,
                color: isUser ? null : AppColors.surface,
                borderRadius: BorderRadius.only(
                  topRight: Radius.circular(isUser ? 4 : 18),
                  topLeft: Radius.circular(isUser ? 18 : 4),
                  bottomRight: const Radius.circular(18),
                  bottomLeft: const Radius.circular(18),
                ),
                boxShadow: isUser
                    ? null
                    : [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8)],
              ),
              child: Text(
                message.text,
                style: AppTextStyles.body(
                  color: isUser ? Colors.white : AppColors.textPrimary,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    DateFormatter.chatTime(message.timestamp),
                    style: AppTextStyles.caption(size: 10),
                  ),
                  if (isUser) ...[
                    const SizedBox(width: 4),
                    Icon(
                      message.status == MessageStatus.read
                          ? Icons.done_all
                          : Icons.done,
                      size: 14,
                      color: AppColors.primary,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(duration: 300.ms)
        .slideX(
          begin: isUser ? 0.3 : -0.3,
          end: 0,
          curve: Curves.easeOutBack,
        );
  }
}
