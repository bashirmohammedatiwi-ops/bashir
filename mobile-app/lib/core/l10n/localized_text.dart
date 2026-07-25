/// اختيار النص المناسب حسب اللغة مع fallback ذكي.
String localizedText({
  required String languageCode,
  String? ar,
  String? en,
  String? fallback,
}) {
  final base = fallback?.trim() ?? '';
  final arVal = ar?.trim();
  final enVal = en?.trim();

  if (languageCode == 'en') {
    if (enVal != null && enVal.isNotEmpty) return enVal;
    if (arVal != null && arVal.isNotEmpty) return arVal;
    return base;
  }

  if (arVal != null && arVal.isNotEmpty) return arVal;
  if (enVal != null && enVal.isNotEmpty) return enVal;
  return base;
}
