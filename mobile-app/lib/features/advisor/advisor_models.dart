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
  /// «ليش رشحته؟»: ما طابق طلبها وما لم يطابق.
  final List<AdvisorWhy> why;
  /// نسبة الشبه بالمنتج المرجعي (بدائل/مشابه).
  final int? similarity;
  /// كم توفّر مقارنةً بالمرجع.
  final int saving;

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
    this.why = const [],
    this.similarity,
    this.saving = 0,
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
        why: asList(j['why']).map((e) => AdvisorWhy(ok: e['ok'] == true, text: asString(e['text']))).where((w) => w.text.isNotEmpty).toList(),
        similarity: j['similarity'] == null ? null : asInt(j['similarity']),
        saving: asInt(j['saving']),
      );
}

class AdvisorWhy {
  final bool ok;
  final String text;
  const AdvisorWhy({required this.ok, required this.text});
}

/// بطاقة معرفة: جواب سؤال عن مكوّن أو موضوع.
class AdvisorKnowledge {
  final String title;
  final String kind;
  final String? intro;
  final List<AdvisorKnowledgeSection> sections;
  final String? verdictTone;
  final String? verdictText;

  const AdvisorKnowledge({
    required this.title,
    required this.kind,
    this.intro,
    required this.sections,
    this.verdictTone,
    this.verdictText,
  });

  factory AdvisorKnowledge.fromJson(Map<String, dynamic> j) {
    final v = asMap(j['verdict']);
    return AdvisorKnowledge(
      title: asString(j['title']),
      kind: asString(j['kind'], 'info'),
      intro: j['intro']?.toString(),
      sections: asList(j['sections'])
          .map((e) => AdvisorKnowledgeSection(
                label: asString(e['label']),
                icon: asString(e['icon']),
                bullets: asStringList(e['bullets']).where((b) => b.trim().isNotEmpty).toList(),
              ))
          .where((x) => x.bullets.isNotEmpty)
          .toList(),
      verdictTone: v.isEmpty ? null : asString(v['tone']),
      verdictText: v.isEmpty ? null : asString(v['text']),
    );
  }
}

class AdvisorKnowledgeSection {
  final String label;
  final String icon;
  final List<String> bullets;
  const AdvisorKnowledgeSection({required this.label, required this.icon, required this.bullets});
}

class AdvisorCompareRow {
  final String label;
  final List<String> values;
  final int? best;
  const AdvisorCompareRow({required this.label, required this.values, this.best});
}

class AdvisorCompare {
  final List<AdvisorProduct> products;
  final List<AdvisorCompareRow> rows;
  final int winner;
  final String verdict;
  const AdvisorCompare({required this.products, required this.rows, required this.winner, required this.verdict});

  factory AdvisorCompare.fromJson(Map<String, dynamic> j) => AdvisorCompare(
        products: asList(j['products']).map(AdvisorProduct.fromJson).toList(),
        rows: asList(j['rows'])
            .map((r) => AdvisorCompareRow(
                  label: asString(r['label']),
                  values: asStringList(r['values']),
                  best: r['best'] == null ? null : asInt(r['best']),
                ))
            .toList(),
        winner: asInt(j['winner']),
        verdict: asString(j['verdict']),
      );
}

class AdvisorFitPoint {
  /// true = يناسب، false = انتبهي، null = معلومة.
  final bool? ok;
  final String text;
  const AdvisorFitPoint({required this.ok, required this.text});
}

class AdvisorFit {
  final AdvisorProduct product;
  final String tone;
  final String headline;
  final List<AdvisorFitPoint> points;
  const AdvisorFit({required this.product, required this.tone, required this.headline, required this.points});

  factory AdvisorFit.fromJson(Map<String, dynamic> j) => AdvisorFit(
        product: AdvisorProduct.fromJson(asMap(j['product'])),
        tone: asString(j['tone'], 'ok'),
        headline: asString(j['headline']),
        points: asList(j['points'])
            .map((p) => AdvisorFitPoint(ok: p['ok'] is bool ? p['ok'] as bool : null, text: asString(p['text'])))
            .toList(),
      );
}

class AdvisorRoutineStep {
  final String step;
  final String label;
  final String emoji;
  final String when;
  final AdvisorProduct product;
  /// عندها هذا المنتج من مشترياتها — لا يُضاف للسلة.
  final bool owned;
  const AdvisorRoutineStep({
    required this.step,
    required this.label,
    required this.emoji,
    required this.when,
    required this.product,
    this.owned = false,
  });

  factory AdvisorRoutineStep.fromJson(Map<String, dynamic> j) => AdvisorRoutineStep(
        step: asString(j['step']),
        label: asString(j['label']),
        emoji: asString(j['emoji']),
        when: asString(j['when'], 'both'),
        product: AdvisorProduct.fromJson(asMap(j['product'])),
        owned: j['owned'] == true,
      );
}

/// اقتراح شخصي من مشترياتها: «قارب يخلص؟» (refill) أو «أكملي روتينكِ» (next).
class AdvisorPersonal {
  final String kind;
  final String title;
  final String note;
  final List<AdvisorProduct> products;
  const AdvisorPersonal({required this.kind, required this.title, required this.note, required this.products});

  bool get isRefill => kind == 'refill';

  factory AdvisorPersonal.fromJson(Map<String, dynamic> j) => AdvisorPersonal(
        kind: asString(j['kind'], 'refill'),
        title: asString(j['title']),
        note: asString(j['note']),
        products: asList(j['products']).map((e) => AdvisorProduct.fromJson(asMap(e))).toList(),
      );
}

class AdvisorRoutine {
  final String title;
  final List<AdvisorRoutineStep> steps;
  final int total;
  final String emoji;
  /// براند الخط المتناسق (إن كانت أغلب الخطوات منه).
  final String? brand;
  /// الروتين كما وصل — لحفظه في «روتيناتي» وإعادة عرضه لاحقاً.
  final Map<String, dynamic> raw;
  const AdvisorRoutine({
    required this.title,
    required this.steps,
    required this.total,
    this.emoji = '🧖‍♀️',
    this.brand,
    this.raw = const {},
  });

  /// لوك مكياج (قطع) لا روتين عناية (خطوات صباح/مساء).
  bool get isLook => steps.isNotEmpty && steps.every((s) => s.when == 'any');

  factory AdvisorRoutine.fromJson(Map<String, dynamic> j) => AdvisorRoutine(
        title: asString(j['title']),
        steps: asList(j['steps']).map((e) => AdvisorRoutineStep.fromJson(asMap(e))).toList(),
        total: asInt(j['total']),
        emoji: asString(j['emoji'], '🧖‍♀️'),
        brand: (j['brand']?.toString().isNotEmpty ?? false) ? j['brand'].toString() : null,
        raw: j,
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
  final AdvisorKnowledge? knowledge;
  final AdvisorCompare? compare;
  final AdvisorFit? fit;
  /// المنتج المرجعي (نتحدث عنه، أو بدائل له).
  final AdvisorProduct? anchor;
  /// ما تعلّمته عنها في هذا الرد.
  final Map<String, dynamic>? profileUpdate;
  /// اقتراحات من مشترياتها (للمسجلات).
  final List<AdvisorPersonal> personal;
  /// الرد كما وصل — لحفظ المحادثة على الجهاز.
  final Map<String, dynamic> raw;

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
    this.knowledge,
    this.compare,
    this.fit,
    this.anchor,
    this.profileUpdate,
    this.personal = const [],
    this.raw = const {},
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
        knowledge: j['knowledge'] is Map ? AdvisorKnowledge.fromJson(asMap(j['knowledge'])) : null,
        compare: j['compare'] is Map ? AdvisorCompare.fromJson(asMap(j['compare'])) : null,
        fit: j['fit'] is Map ? AdvisorFit.fromJson(asMap(j['fit'])) : null,
        anchor: j['anchor'] is Map ? AdvisorProduct.fromJson(asMap(j['anchor'])) : null,
        profileUpdate: j['profileUpdate'] is Map ? asMap(j['profileUpdate']) : null,
        personal: asList(j['personal'])
            .map((e) => AdvisorPersonal.fromJson(asMap(e)))
            .where((x) => x.products.isNotEmpty)
            .toList(),
        raw: j,
      );

  /// بصمة الطلب للتعلّم (المجال|النوع) — بلا أي بيانات شخصية.
  String get signature {
    final need = asMap(asMap(state)['need']);
    final kinds = asStringList(need['kinds']);
    return [asString(need['area']), if (kinds.isNotEmpty) kinds.first].where((e) => e.isNotEmpty).join('|');
  }
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
  /// معرّف ثابت (يُحفظ مع المحادثة) — تُربط به حالة «قيّمتِ» و«أضفتِ» فلا تضيع بالتمرير أو الاستعادة.
  final int id;
  /// رد الترحيب الافتتاحي — وحده يُعرض بواجهة الترحيب.
  final bool welcome;
  const BotEntry(this.reply, {this.id = 0, this.welcome = false});
}
