enum MessageSender { user, support }

enum MessageStatus { sending, sent, read }

class ChatMessageModel {
  const ChatMessageModel({
    required this.id,
    required this.text,
    required this.sender,
    required this.timestamp,
    this.status = MessageStatus.sent,
  });

  final String id;
  final String text;
  final MessageSender sender;
  final DateTime timestamp;
  final MessageStatus status;

  ChatMessageModel copyWith({MessageStatus? status}) => ChatMessageModel(
        id: id,
        text: text,
        sender: sender,
        timestamp: timestamp,
        status: status ?? this.status,
      );
}
