import '../../core/utils/json.dart';

/// زر اقتراح سريع — يُرسل كرسالة أو كفعل مضبوط (`set:skinType=oily`…).
class AdvisorChip {
  final String label;
  final String value;
  final String? emoji;
  const AdvisorChip({required this.label, required this.value, this.emoji});

  bool get isAction => RegExp(r'^(set|add|unset|act|quiz|skip):').hasMatch(value);

  factory AdvisorChip.fromJson(Map<String, dynamic> j) => AdvisorChip(
        label: asString(j['label']),
        value: asString(j['value']),
        emoji: j['emoji']?.toString(),
      );
}

/// منتج رشحته المستشارة مع سبب الترشيح ونسبة الملاءمة.
class AdvisorProduct {
  final String id;
  final String slug;
  final String name;
  final String brand;
  final int price;
  final int originalPrice;
  final int discountPercent;
  final String image;
  final double rating;
  final int reviewCount;
  final bool inStock;
  final int shadeCount;
  final List<String> reasons;
  final int match;

  const AdvisorProduct({
    required this.id,
    required this.slug,
    required this.name,
    required this.brand,
    required this.price,
    required this.originalPrice,
    required this.discountPercent,
    required this.image,
    required this.rating,
    required this.reviewCount,
    required this.inStock,
    required this.shadeCount,
    required this.reasons,
    required this.match,
  });

  String get route => slug.isNotEmpty ? slug : id;
  bool get hasDiscount => discountPercent > 0 && originalPrice > price;

  factory AdvisorProduct.fromJson(Map<String, dynamic> j) => AdvisorProduct(
        id: asString(j['id']),
        slug: asString(j['slug']),
        name: asString(j['name']),
        brand: asString(j['brand']),
        price: asInt(j['price']),
        originalPrice: asInt(j['originalPrice']),
        discountPercent: asInt(j['discountPercent']),
        image: asString(j['image']),
        rating: asDouble(j['rating']),
        reviewCount: asInt(j['reviewCount']),
        inStock: j['inStock'] != false,
        shadeCount: asInt(j['shadeCount']),
        reasons: asStringList(j['reasons']).where((e) => e.trim().isNotEmpty).toList(),
        match: asInt(j['match'], 80),
      );
}

class AdvisorRoutineStep {
  final String step;
  final String label;
  final String emoji;
  final String when;
  final AdvisorProduct product;
  const AdvisorRoutineStep({required this.step, required this.label, required this.emoji, required this.when, required this.product});

  factory AdvisorRoutineStep.fromJson(Map<String, dynamic> j) => AdvisorRoutineStep(
        step: asString(j['step']),
        label: asString(j['label']),
        emoji: asString(j['emoji']),
        when: asString(j['when'], 'both'),
        product: AdvisorProduct.fromJson(asMap(j['product'])),
      );
}

class AdvisorRoutine {
  final String title;
  final List<AdvisorRoutineStep> steps;
  final int total;
  const AdvisorRoutine({required this.title, required this.steps, required this.total});

  factory AdvisorRoutine.fromJson(Map<String, dynamic> j) => AdvisorRoutine(
        title: asString(j['title']),
        steps: asList(j['steps']).map((e) => AdvisorRoutineStep.fromJson(asMap(e))).toList(),
        total: asInt(j['total']),
      );
}

class AdvisorQuiz {
  final String id;
  final String title;
  final String question;
  final int step;
  final int total;
  final List<AdvisorChip> options;
  final bool multi;
  const AdvisorQuiz({
    required this.id,
    required this.title,
    required this.question,
    required this.step,
    required this.total,
    required this.options,
    required this.multi,
  });

  factory AdvisorQuiz.fromJson(Map<String, dynamic> j) => AdvisorQuiz(
        id: asString(j['id']),
        title: asString(j['title']),
        question: asString(j['question']),
        step: asInt(j['step'], 1),
        total: asInt(j['total'], 1),
        options: asList(j['options']).map((e) => AdvisorChip.fromJson(asMap(e))).toList(),
        multi: j['multi'] == true,
      );
}

class AdvisorGroup {
  final String title;
  final List<AdvisorProduct> products;
  const AdvisorGroup({required this.title, required this.products});
}

/// ما فهمته المستشارة — شريحة قابلة للإزالة.
class AdvisorUnderstood {
  final String key;
  final String label;
  const AdvisorUnderstood({required this.key, required this.label});
}

class AdvisorReply {
  final List<String> messages;
  final List<AdvisorChip> chips;
  final List<AdvisorProduct> products;
  final List<AdvisorGroup> groups;
  final AdvisorRoutine? routine;
  final AdvisorQuiz? quiz;
  final List<AdvisorUnderstood> understood;
  final Map<String, dynamic>? state;
  final List<String> prompts;

  const AdvisorReply({
    this.messages = const [],
    this.chips = const [],
    this.products = const [],
    this.groups = const [],
    this.routine,
    this.quiz,
    this.understood = const [],
    this.state,
    this.prompts = const [],
  });

  factory AdvisorReply.fromJson(Map<String, dynamic> j) => AdvisorReply(
        messages: asStringList(j['messages']).where((e) => e.trim().isNotEmpty).toList(),
        chips: asList(j['chips']).map((e) => AdvisorChip.fromJson(asMap(e))).toList(),
        products: asList(j['products']).map((e) => AdvisorProduct.fromJson(asMap(e))).toList(),
        groups: asList(j['groups'])
            .map((g) => AdvisorGroup(
                  title: asString(asMap(g)['title']),
                  products: asList(asMap(g)['products']).map((e) => AdvisorProduct.fromJson(asMap(e))).toList(),
                ))
            .where((g) => g.products.isNotEmpty)
            .toList(),
        routine: j['routine'] is Map ? AdvisorRoutine.fromJson(asMap(j['routine'])) : null,
        quiz: j['quiz'] is Map ? AdvisorQuiz.fromJson(asMap(j['quiz'])) : null,
        understood: asList(j['understood'])
            .map((e) => AdvisorUnderstood(key: asString(asMap(e)['key']), label: asString(asMap(e)['label'])))
            .toList(),
        state: j['state'] is Map ? asMap(j['state']) : null,
        prompts: asStringList(j['prompts']).where((e) => e.trim().isNotEmpty).toList(),
      );
}

/// عنصر في محادثة الشاشة.
sealed class AdvisorEntry {
  const AdvisorEntry();
}

class UserEntry extends AdvisorEntry {
  final String text;
  const UserEntry(this.text);
}

class BotEntry extends AdvisorEntry {
  final AdvisorReply reply;
  const BotEntry(this.reply);
}
