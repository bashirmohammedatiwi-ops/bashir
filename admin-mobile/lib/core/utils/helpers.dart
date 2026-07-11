String normalizeBarcode(String raw) {
  final digits = raw.replaceAll(RegExp(r'\D'), '');
  return digits;
}

bool isMiswagInternalId(String value) {
  final d = value.replaceAll(RegExp(r'\D'), '');
  return RegExp(r'^17\d{8}$').hasMatch(d);
}

bool isEanBarcode(String value) {
  final d = value.replaceAll(RegExp(r'\D'), '');
  return RegExp(r'^\d{8,14}$').hasMatch(d) && !isMiswagInternalId(d);
}

List<String> barcodeLookupCandidates(String raw) {
  final primary = normalizeBarcode(raw);
  if (primary.isEmpty) return [];
  final out = <String>[primary];
  if (primary.length == 13 && primary.startsWith('0')) {
    out.add(primary.substring(1));
  } else if (primary.length == 12) {
    out.add('0$primary');
  }
  return out.toSet().toList();
}

String stripHtml(String html) {
  return html.replaceAll(RegExp(r'<[^>]+>'), ' ').replaceAll(RegExp(r'\s+'), ' ').trim();
}

String slugify(String text, [String fallback = 'item']) {
  var s = text.toLowerCase().trim();
  s = s.replaceAll(RegExp(r'[^\w\s\u0600-\u06FF-]'), '');
  s = s.replaceAll(RegExp(r'[\s_]+'), '-');
  s = s.replaceAll(RegExp(r'-+'), '-').replaceAll(RegExp(r'^-|-$'), '');
  return s.isEmpty ? '$fallback-${DateTime.now().millisecondsSinceEpoch}' : s;
}
