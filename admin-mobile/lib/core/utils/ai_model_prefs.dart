import 'package:shared_preferences/shared_preferences.dart';

/// Client-facing AI model choices. Add-app uses Cursor Composer for bilingual names only.
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

  static const composerLow = AiModelOption(
    id: 'composer-2.5-low',
    labelAr: 'Composer 2.5 Low',
    descriptionAr: 'تأكيد الاسم بالعربي والإنجليزي فقط — الأرخص',
    costTier: 'lowest',
  );

  static const composerFast = AiModelOption(
    id: 'composer-2.5-fast',
    labelAr: 'Composer 2.5 Fast',
    descriptionAr: 'نفس تأكيد الاسم — أسرع بتكلفة أعلى',
    costTier: 'medium',
  );

  static const all = [composerLow, composerFast];

  static AiModelOption byId(String? id) {
    final key = (id ?? '').trim().toLowerCase().replaceAll('_', '-');
    if (key == composerFast.id ||
        key == 'composer-fast' ||
        key == 'gpt-5.6-luna-medium' ||
        key == 'luna-medium' ||
        key == 'luna-med') {
      return composerFast;
    }
    for (final m in all) {
      if (m.id == key) return m;
    }
    return composerLow;
  }
}

class AiModelPrefs {
  static const _key = 'ai_autofill_model_v2';

  static Future<String> getSelectedId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_key) ?? AiModelOption.composerLow.id;
  }

  static Future<void> setSelectedId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, AiModelOption.byId(id).id);
  }
}
