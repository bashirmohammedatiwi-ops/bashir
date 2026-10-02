/// نماذج المساعد الذكي — رسائل وبطاقات منتجات وطلبات وردود مهيكلة.
int _asInt(Object? value) =>
    value is num ? value.round() : int.tryParse('${value ?? ''}') ?? 0;

class AssistantProductCard {
  final String id;
  final String slug;
  final String name;
  final String brandName;
  final String? imageUrl;
  final int price;
  final int oldPrice;
  final int discountPercent;
  final int stock;
  final bool inStock;
  final String? shadeName;
  final String deepLink;

  const AssistantProductCard({
    required this.id,
    required this.slug,
    required this.name,
    required this.brandName,
    required this.price,
    required this.oldPrice,
    required this.discountPercent,
    required this.stock,
    required this.inStock,
    required this.deepLink,
    this.imageUrl,
    this.shadeName,
  });

  factory AssistantProductCard.fromJson(Map<String, dynamic> json) {
    return AssistantProductCard(
      id: '${json['id'] ?? ''}',
      slug: '${json['slug'] ?? ''}',
      name: '${json['name'] ?? ''}',
      brandName: '${json['brandName'] ?? ''}',
      imageUrl: json['imageUrl']?.toString(),
      price: _asInt(json['price']),
      oldPrice: _asInt(json['oldPrice']),
      discountPercent: _asInt(json['discountPercent']),
      stock: _asInt(json['stock']),
      inStock: json['inStock'] == true,
      shadeName: json['shadeName']?.toString(),
      deepLink: '${json['deepLink'] ?? ''}',
    );
  }
}

/// بطاقة طلب داخل المحادثة — تعرض الحالة والمجموع وتفتح تفاصيل الطلب.
class AssistantOrderCard {
  final String id;
  final String orderNumber;
  final String status;
  final int total;
  final int itemCount;
  final String createdAt;
  final String deepLink;

  const AssistantOrderCard({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.total,
    required this.itemCount,
    required this.createdAt,
    required this.deepLink,
  });

  factory AssistantOrderCard.fromJson(Map<String, dynamic> json) {
    return AssistantOrderCard(
      id: '${json['id'] ?? ''}',
      orderNumber: '${json['orderNumber'] ?? ''}',
      status: '${json['status'] ?? ''}',
      total: _asInt(json['total']),
      itemCount: _asInt(json['itemCount']),
      createdAt: '${json['createdAt'] ?? ''}',
      deepLink: '${json['deepLink'] ?? ''}',
    );
  }

  static const statusLabels = <String, String>{
    'PENDING': 'بانتظار التأكيد',
    'CONFIRMED': 'مؤكد',
    'PROCESSING': 'قيد التجهيز',
    'SHIPPED': 'بالطريق',
    'DELIVERED': 'تم التوصيل',
    'CANCELLED': 'ملغي',
    'REFUNDED': 'مسترجع',
  };

  String get statusLabel {
    const labels = statusLabels;
    return labels[status] ?? status;
  }

  bool get isOpen => status == 'PENDING' || status == 'CONFIRMED' || status == 'PROCESSING' || status == 'SHIPPED';
}

class AssistantQuickReply {
  final String label;
  final String action;
  const AssistantQuickReply({required this.label, required this.action});

  factory AssistantQuickReply.fromJson(Map<String, dynamic> json) =>
      AssistantQuickReply(label: '${json['label'] ?? ''}', action: '${json['action'] ?? ''}');
}

class AssistantCartAction {
  final String productId;
  final String? shadeId;
  final String? shadeName;
  final int quantity;
  final String actionId;

  const AssistantCartAction({
    required this.productId,
    required this.quantity,
    required this.actionId,
    this.shadeId,
    this.shadeName,
  });

  factory AssistantCartAction.fromJson(Map<String, dynamic> json) =>
      AssistantCartAction(
        productId: '${json['productId'] ?? ''}',
        shadeId: json['shadeId']?.toString(),
        shadeName: json['shadeName']?.toString(),
        quantity: _asInt(json['quantity']) == 0
            ? 1
            : _asInt(json['quantity']),
        actionId: '${json['actionId'] ?? ''}',
      );
}

/// ملخص محادثة في سجل المحادثات.
class AssistantConversationSummary {
  final String id;
  final String title;
  final String? lastIntent;
  final int messageCount;
  final DateTime lastMessageAt;

  const AssistantConversationSummary({
    required this.id,
    required this.title,
    required this.messageCount,
    required this.lastMessageAt,
    this.lastIntent,
  });

  factory AssistantConversationSummary.fromJson(Map<String, dynamic> json) {
    return AssistantConversationSummary(
      id: '${json['id'] ?? ''}',
      title: '${json['title'] ?? ''}',
      lastIntent: json['lastIntent']?.toString(),
      messageCount: _asInt(json['messageCount']),
      lastMessageAt: DateTime.tryParse('${json['lastMessageAt'] ?? ''}') ??
          DateTime.fromMillisecondsSinceEpoch(0),
    );
  }
}

/// رسالة مؤرشفة تُبنى من نقطة نهاية الرسائل عند استعادة محادثة.
class ArchivedAssistantMessage {
  final String role;
  final String content;
  final Map<String, dynamic> payload;

  const ArchivedAssistantMessage({
    required this.role,
    required this.content,
    required this.payload,
  });

  factory ArchivedAssistantMessage.fromJson(Map<String, dynamic> json) {
    return ArchivedAssistantMessage(
      role: '${json['role'] ?? ''}',
      content: '${json['content'] ?? ''}',
      payload:
          json['payload'] is Map ? Map<String, dynamic>.from(json['payload']) : {},
    );
  }

  bool get isUser => role == 'USER';
}

enum AssistantRole { user, assistant }

/// رسالة واحدة في محادثة المساعد.
class AssistantMessage {
  final String key;
  final AssistantRole role;
  final String text;
  final List<AssistantProductCard> products;
  final List<AssistantOrderCard> orders;
  final List<AssistantQuickReply> quickReplies;
  final List<AssistantCartAction> actions;
  final String? messageId;
  final String? conversationId;
  final bool isStreaming;
  /// مؤشر حالة أثناء انتظار الرد ("أدور بالكتالوج…").
  final String? statusLabel;
  /// نص المستخدم لرسالة فشلت — يستخدم لإعادة المحاولة.
  final String? failedInput;

  const AssistantMessage({
    required this.key,
    required this.role,
    required this.text,
    this.products = const [],
    this.orders = const [],
    this.quickReplies = const [],
    this.actions = const [],
    this.messageId,
    this.conversationId,
    this.isStreaming = false,
    this.statusLabel,
    this.failedInput,
  });

  bool get isFailed => failedInput != null;

  AssistantMessage copyWith({
    String? text,
    List<AssistantProductCard>? products,
    List<AssistantOrderCard>? orders,
    List<AssistantQuickReply>? quickReplies,
    List<AssistantCartAction>? actions,
    String? messageId,
    String? conversationId,
    bool? isStreaming,
    String? statusLabel,
    bool clearStatusLabel = false,
  }) {
    return AssistantMessage(
      key: key,
      role: role,
      text: text ?? this.text,
      products: products ?? this.products,
      orders: orders ?? this.orders,
      quickReplies: quickReplies ?? this.quickReplies,
      actions: actions ?? this.actions,
      messageId: messageId ?? this.messageId,
      conversationId: conversationId ?? this.conversationId,
      isStreaming: isStreaming ?? this.isStreaming,
      statusLabel: clearStatusLabel ? null : (statusLabel ?? this.statusLabel),
      failedInput: failedInput,
    );
  }

  factory AssistantMessage.fromResponse(
    Map<String, dynamic> json, {
    required String key,
  }) {
    final products = (json['products'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((p) => AssistantProductCard.fromJson(Map<String, dynamic>.from(p)))
        .toList();
    final orders = (json['orders'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((o) => AssistantOrderCard.fromJson(Map<String, dynamic>.from(o)))
        .toList();
    final quickReplies = (json['quickReplies'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((q) => AssistantQuickReply.fromJson(Map<String, dynamic>.from(q)))
        .toList();
    final actions = (json['actions'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((a) => AssistantCartAction.fromJson(Map<String, dynamic>.from(a)))
        .toList();
    final metadata = json['metadata'] as Map<String, dynamic>? ?? {};
    return AssistantMessage(
      conversationId: metadata['conversationId']?.toString(),
      key: key,
      role: AssistantRole.assistant,
      text: '${json['message'] ?? ''}',
      products: products,
      orders: orders,
      quickReplies: quickReplies,
      actions: actions,
      messageId: metadata['messageId']?.toString(),
    );
  }

  /// يبني رسالة مساعد من رسالة مؤرشفة (استعادة سجل محادثة).
  factory AssistantMessage.fromArchived(ArchivedAssistantMessage archived, {required String key}) {
    if (archived.isUser) {
      return AssistantMessage(key: key, role: AssistantRole.user, text: archived.content);
    }
    if (archived.payload.isEmpty) {
      return AssistantMessage(key: key, role: AssistantRole.assistant, text: archived.content);
    }
    final merged = <String, dynamic>{...archived.payload}
      ..putIfAbsent('message', () => archived.content);
    final metadata = merged['metadata'] is Map
        ? Map<String, dynamic>.from(merged['metadata'] as Map)
        : <String, dynamic>{};
    metadata.putIfAbsent('messageId', () => '');
    merged['metadata'] = metadata;
    final message = AssistantMessage.fromResponse(merged, key: key);
    return message.messageId != null && message.messageId!.isEmpty
        ? AssistantMessage(key: key, role: AssistantRole.assistant, text: archived.content)
        : message;
  }
}
