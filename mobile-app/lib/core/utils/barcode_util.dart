/// تنظيف الباركود — ASCII فقط، بدون تشكيل أو رموز RTL.
String normalizeBarcode(String? raw) {
  if (raw == null) return '';
  final bidiAndTashkeel = RegExp(
    r'[\u064B-\u065F\u0670\u06D6-\u06ED\u200E\u200F\u202A-\u202E\uFEFF]',
  );
  return raw
      .replaceAll('\u00A0', ' ')
      .replaceAll(bidiAndTashkeel, '')
      .replaceAll(RegExp(r'[^\x21-\x7E]'), '')
      .trim();
}

bool isLikelyBarcode(String code) {
  if (code.length < 2) return false;
  return RegExp(r'^[A-Za-z0-9][A-Za-z0-9_\-./+]*$').hasMatch(code);
}

void _addEanVariants(Set<String> candidates, String value) {
  final digits = value.replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return;

  candidates.add(digits);
  if (digits.length == 13 && digits.startsWith('0')) {
    candidates.add(digits.substring(1));
  } else if (digits.length == 12) {
    candidates.add('0$digits');
  }
}

List<String> barcodeLookupCandidates(String? raw) {
  final normalized = normalizeBarcode(raw);
  if (normalized.isEmpty) return const [];

  final candidates = <String>{normalized};
  if (isLikelyBarcode(normalized)) {
    candidates.add(normalized.toUpperCase());
  }
  _addEanVariants(candidates, normalized);
  return candidates.toList(growable: false);
}
