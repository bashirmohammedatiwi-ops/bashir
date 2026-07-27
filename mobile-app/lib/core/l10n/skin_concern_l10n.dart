/// ترجمات ثابتة لمشاكل البشرة — fallback عند غياب/ضعف nameEn من الـ API.
abstract final class SkinConcernL10n {
  static const _namesEn = <String, String>{
    'acne': 'Acne',
    'pigmentation': 'Dark Spots',
    'dryness': 'Dryness',
    'sensitivity': 'Sensitivity',
  };

  static const _descriptionsEn = <String, String>{
    'acne': 'Products for acne care and prevention',
    'pigmentation': 'Even skin tone and brighten dark spots',
    'dryness': 'Deep hydration for dry skin',
    'sensitivity': 'Gentle products for sensitive skin',
  };

  static const _namesByAr = <String, String>{
    'حب شباب': 'Acne',
    'حب الشباب': 'Acne',
    'تصبغات': 'Dark Spots',
    'جفاف': 'Dryness',
    'حساسية': 'Sensitivity',
  };

  static const _descriptionsByAr = <String, String>{
    'منتجات لعلاج ومنع حب الشباب': 'Products for acne care and prevention',
    'توحيد لون البشرة وتفتيح التصبغات': 'Even skin tone and brighten dark spots',
    'ترطيب عميق للبشرة الجافة': 'Deep hydration for dry skin',
    'منتجات لطيفة للبشرة الحساسة': 'Gentle products for sensitive skin',
  };

  static String? nameEn(String slug) => _namesEn[slug.trim().toLowerCase()];

  static String? descriptionEn(String slug) => _descriptionsEn[slug.trim().toLowerCase()];

  static String? nameEnFromAr(String? ar) {
    final key = ar?.trim();
    if (key == null || key.isEmpty) return null;
    return _namesByAr[key];
  }

  static String? descriptionEnFromAr(String? ar) {
    final key = ar?.trim();
    if (key == null || key.isEmpty) return null;
    return _descriptionsByAr[key];
  }
}
