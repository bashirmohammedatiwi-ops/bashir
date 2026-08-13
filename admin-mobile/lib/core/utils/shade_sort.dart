/// Sort makeup shades by shade number, then name, then barcode.
int? shadeSortNumber({required String code, required String name}) {
  final c = code.trim();
  if (RegExp(r'^\d{1,3}$').hasMatch(c)) {
    return int.tryParse(c);
  }
  final alphaNum = RegExp(r'^([A-Za-z]?)(\d{1,3})$').firstMatch(c);
  if (alphaNum != null) {
    final n = int.tryParse(alphaNum.group(2)!);
    if (n != null && n >= 1 && n <= 999) return n;
  }

  final nums = RegExp(r'\b(\d{1,3})\b').allMatches(name.trim());
  if (nums.isNotEmpty) {
    final n = int.tryParse(nums.last.group(1)!);
    if (n != null && n >= 1 && n <= 999) return n;
  }
  return null;
}

int compareShadeOrder({
  required String codeA,
  required String nameA,
  required String barcodeA,
  required String codeB,
  required String nameB,
  required String barcodeB,
}) {
  final na = shadeSortNumber(code: codeA, name: nameA);
  final nb = shadeSortNumber(code: codeB, name: nameB);
  if (na != null && nb != null && na != nb) return na.compareTo(nb);
  if (na != null && nb == null) return -1;
  if (na == null && nb != null) return 1;

  final nameCmp = nameA.trim().toLowerCase().compareTo(nameB.trim().toLowerCase());
  if (nameCmp != 0) return nameCmp;

  final barcodeCmp = barcodeA.compareTo(barcodeB);
  if (barcodeCmp != 0) return barcodeCmp;

  return codeA.trim().toLowerCase().compareTo(codeB.trim().toLowerCase());
}

List<T> sortShades<T>(
  Iterable<T> items, {
  required String Function(T item) codeOf,
  required String Function(T item) nameOf,
  required String Function(T item) barcodeOf,
}) {
  final list = items.toList();
  list.sort(
    (a, b) => compareShadeOrder(
      codeA: codeOf(a),
      nameA: nameOf(a),
      barcodeA: barcodeOf(a),
      codeB: codeOf(b),
      nameB: nameOf(b),
      barcodeB: barcodeOf(b),
    ),
  );
  return list;
}
