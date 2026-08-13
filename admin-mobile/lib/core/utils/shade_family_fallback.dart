import '../../models/ai_autofill.dart';
import 'shade_sort.dart';

/// Local fallback when shade-family API is slow or unavailable — never block the wizard.
ShadeFamilyResult buildLocalShadeFamilyFallback({
  required List<String> barcodes,
  String? hint,
  Map<String, String> existsNames = const {},
}) {
  final unique = <String>[];
  final seen = <String>{};
  for (final raw in barcodes) {
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    final bc = digits.length >= 6 ? digits : raw.trim();
    if (bc.length < 6 || seen.contains(bc)) continue;
    seen.add(bc);
    unique.add(bc);
  }

  final hintText = (hint ?? '').trim();
  var draftShades = <ShadeFamilyShade>[];
  for (var i = 0; i < unique.length; i++) {
    final bc = unique[i];
    final known = existsNames[bc]?.trim();
    final code = '${i + 1}'.padLeft(2, '0');
    final label = (known != null && known.isNotEmpty) ? known : 'تدرج ${i + 1}';
    draftShades.add(
      ShadeFamilyShade(
        barcode: bc,
        code: code,
        name: label,
        nameEn: label,
        nameAr: label,
        colorHex: '#CCCCCC',
        position: i,
      ),
    );
  }

  draftShades = sortShades(
    draftShades,
    codeOf: (s) => s.code,
    nameOf: (s) => s.name,
    barcodeOf: (s) => s.barcode,
  )
      .asMap()
      .entries
      .map(
        (e) => ShadeFamilyShade(
          barcode: e.value.barcode,
          code: e.value.code,
          name: e.value.name,
          nameEn: e.value.nameEn,
          nameAr: e.value.nameAr,
          colorHex: e.value.colorHex,
          position: e.key,
        ),
      )
      .toList();

  return ShadeFamilyResult(
    barcodes: unique,
    brandAr: '',
    brandEn: '',
    nameAr: hintText,
    nameEn: hintText,
    descriptionAr: hintText.isNotEmpty ? 'منتج مكياج متوفر بعدة تدرجات.' : '',
    descriptionEn: hintText.isNotEmpty ? 'Makeup product available in multiple shades.' : '',
    category: const AiAutofillCategory(),
    confidence: 30,
    needsReview: true,
    shades: draftShades,
    images: const [],
    namesVerified: false,
    namingSource: 'local-fallback',
  );
}