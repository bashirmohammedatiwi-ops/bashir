import 'package:shared_preferences/shared_preferences.dart';

/// Client-facing AI model choices (mapped on server to OpenAI API models).
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

  static const lunaLow = AiModelOption(
    id: 'gpt-5.6-luna-low',
    labelAr: '5.6 Luna Low',
    descriptionAr: 'الأرخص والأسرع — إضافة يومية',
    costTier: 'lowest',
  );

  static const lunaMedium = AiModelOption(
    id: 'gpt-5.6-luna-medium',
    labelAr: '5.6 Luna Medium',
    descriptionAr: 'جودة أعلى للتسمية والوصف',
    costTier: 'medium',
  );

  static const all = [lunaLow, lunaMedium];

  static AiModelOption byId(String? id) {
    for (final m in all) {
      if (m.id == id) return m;
    }
    return lunaLow;
  }
}

class AiModelPrefs {
  static const _key = 'ai_autofill_model_v1';

  static Future<String> getSelectedId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_key) ?? AiModelOption.lunaLow.id;
  }

  static Future<void> setSelectedId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, id);
  }
}
