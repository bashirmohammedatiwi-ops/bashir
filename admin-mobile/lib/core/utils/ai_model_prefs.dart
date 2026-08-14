import 'package:shared_preferences/shared_preferences.dart';

/// Client-facing AI model choices for single-product naming.
class AiModelOption {
  const AiModelOption({
    required this.id,
    required this.labelAr,
    required this.descriptionAr,
    required this.costTier,
  });

  final String id;
  final String labelAr;
  final String descriptionAr;
  final String costTier;

  static const terra = AiModelOption(
    id: 'gpt-5.6-terra',
    labelAr: 'GPT-5.6 Terra',
    descriptionAr: 'موصى به — أفضل توازن جودة وسرعة',
    costTier: 'high',
  );

  static const sol = AiModelOption(
    id: 'gpt-5.6-sol',
    labelAr: 'GPT-5.6 Sol',
    descriptionAr: 'أقوى استدلال — أبطأ وأغلى',
    costTier: 'highest',
  );

  static const luna = AiModelOption(
    id: 'gpt-5.6-luna-low',
    labelAr: 'GPT-5.6 Luna',
    descriptionAr: 'أسرع ضمن عائلة 5.6',
    costTier: 'medium',
  );

  static const composerLow = AiModelOption(
    id: 'composer-2.5-low',
    labelAr: 'Composer 2.5 Low',
    descriptionAr: 'تأكيد اسم رخيص وسريع',
    costTier: 'lowest',
  );

  static const composerFast = AiModelOption(
    id: 'composer-2.5-fast',
    labelAr: 'Composer 2.5 Fast',
    descriptionAr: 'Composer أسرع بتكلفة أعلى',
    costTier: 'medium',
  );

  /// Built-in fallback when `/ai-product/models` is unreachable.
  static const all = [terra, sol, luna, composerLow, composerFast];

  static AiModelOption byId(String? id, {List<AiModelOption>? catalog}) {
    final key = (id ?? '').trim().toLowerCase().replaceAll('_', '-');
    final list = catalog ?? all;
    final aliases = <String, String>{
      'terra': terra.id,
      'tera': terra.id,
      'gpt-5.6-tera': terra.id,
      'sol': sol.id,
      'luna': luna.id,
      'luna-low': luna.id,
      'luna-medium': luna.id,
      'luna-med': luna.id,
      'composer-low': composerLow.id,
      'composer-fast': composerFast.id,
      'composer-2.5': composerLow.id,
    };
    final resolved = aliases[key] ?? key;
    for (final m in list) {
      if (m.id == resolved) return m;
    }
    for (final m in all) {
      if (m.id == resolved) return m;
    }
    return list.isNotEmpty ? list.first : terra;
  }

  factory AiModelOption.fromApi(Map<String, dynamic> json) {
    return AiModelOption(
      id: (json['id'] ?? '').toString(),
      labelAr: (json['labelAr'] ?? json['labelEn'] ?? json['id'] ?? '').toString(),
      descriptionAr: (json['descriptionAr'] ?? '').toString(),
      costTier: (json['costTier'] ?? 'medium').toString(),
    );
  }
}

class AiModelPrefs {
  static const _key = 'ai_autofill_model_v3';

  static Future<String> getSelectedId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_key) ?? AiModelOption.terra.id;
  }

  static Future<void> setSelectedId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, AiModelOption.byId(id).id);
  }
}
