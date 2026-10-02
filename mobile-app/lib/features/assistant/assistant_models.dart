import '../../data/models/product.dart';

/// خطوة المنتج بروتين فضه، مثل «1 · تنظيف».
class AssistantStep {
  final int index;
  final String label;
  const AssistantStep(this.index, this.label);
}

class AssistantChatMessage {
  final String id;
  final bool isUser;
  final String text;
  final List<Product> products;
  final List<String> suggestions;
  final bool isLoading;
  final bool isError;
  final String? turnId;
  final int? rating;
  final Map<String, AssistantStep> steps;

  const AssistantChatMessage({
    required this.id,
    required this.isUser,
    required this.text,
    this.products = const [],
    this.suggestions = const [],
    this.isLoading = false,
    this.isError = false,
    this.turnId,
    this.rating,
    this.steps = const {},
  });

  bool get isRoutine => products.length > 1 && steps.length == products.length;

  AssistantChatMessage copyWith({
    String? text,
    List<Product>? products,
    List<String>? suggestions,
    bool? isLoading,
    bool? isError,
    int? rating,
  }) {
    return AssistantChatMessage(
      id: id,
      isUser: isUser,
      text: text ?? this.text,
      products: products ?? this.products,
      suggestions: suggestions ?? this.suggestions,
      isLoading: isLoading ?? this.isLoading,
      isError: isError ?? this.isError,
      turnId: turnId,
      rating: rating ?? this.rating,
      steps: steps,
    );
  }
}

class AssistantChatResponse {
  final String reply;
  final List<Product> products;
  final List<String> suggestions;
  final String? turnId;
  final Map<String, AssistantStep> steps;

  const AssistantChatResponse({
    required this.reply,
    this.products = const [],
    this.suggestions = const [],
    this.turnId,
    this.steps = const {},
  });

  factory AssistantChatResponse.fromJson(Map<String, dynamic> json) {
    final productsRaw = json['products'] is List ? (json['products'] as List).whereType<Map>().toList() : const <Map>[];
    final turn = json['turnId']?.toString();
    final steps = <String, AssistantStep>{};
    for (final raw in productsRaw) {
      final step = raw['assistantStep'];
      final id = raw['id']?.toString();
      if (id == null || step is! Map) continue;
      final label = step['label']?.toString() ?? '';
      final index = int.tryParse(step['index']?.toString() ?? '') ?? 0;
      if (label.isNotEmpty && index > 0) steps[id] = AssistantStep(index, label);
    }
    return AssistantChatResponse(
      turnId: turn == null || turn.isEmpty ? null : turn,
      reply: (json['reply'] ?? '').toString(),
      products: productsRaw.map((e) => Product.fromJson(Map<String, dynamic>.from(e))).toList(),
      suggestions: (json['suggestions'] is List)
          ? (json['suggestions'] as List).map((e) => e.toString()).where((s) => s.isNotEmpty).toList()
          : const [],
      steps: steps,
    );
  }
}
