import 'package:intl/intl.dart';

final _num = NumberFormat('#,##0', 'en');

/// 12500 → «12,500 د.ع»
String money(num? v) => v == null ? '—' : '${_num.format(v)} د.ع';
String numFmt(num? v) => v == null ? '—' : _num.format(v);

String timeAgo(DateTime? t) {
  if (t == null) return '';
  final d = DateTime.now().difference(t.toLocal());
  if (d.inSeconds < 60) return 'الآن';
  if (d.inMinutes < 60) return 'قبل ${d.inMinutes} د';
  if (d.inHours < 24) return 'قبل ${d.inHours} س';
  if (d.inDays < 7) return 'قبل ${d.inDays} يوم';
  return DateFormat('d/M/yyyy').format(t.toLocal());
}

DateTime? parseDate(dynamic v) => v == null ? null : DateTime.tryParse(v.toString());

/// تطبيع الباركود المكتوب أو المقروء: أرقام عربية → إنجليزية، بلا مسافات أو رموز اتجاه.
String normalizeCode(String raw) {
  const ar = '٠١٢٣٤٥٦٧٨٩';
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  final b = StringBuffer();
  for (final ch in raw.runes) {
    final c = String.fromCharCode(ch);
    final i = ar.indexOf(c);
    final j = fa.indexOf(c);
    if (i >= 0) {
      b.write(i);
    } else if (j >= 0) {
      b.write(j);
    } else if (ch > 0x20 && ch < 0x7f) {
      b.write(c);
    }
  }
  return b.toString().trim();
}

/// يبدو كباركود (أرقام/حروف لاتينية بلا مسافات، 4 خانات فأكثر)؟
bool looksLikeBarcode(String raw) {
  final s = raw.trim();
  if (s.length < 4 || s.contains(' ')) return false;
  final n = normalizeCode(s);
  if (n.length != s.length) return false;
  final digits = n.replaceAll(RegExp(r'\D'), '');
  return digits.length >= 6 || RegExp(r'^[A-Za-z0-9_\-./+]+$').hasMatch(n) && digits.length >= 4;
}
