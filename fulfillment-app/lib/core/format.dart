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
  if (d.inDays == 1) return 'أمس';
  if (d.inDays == 2) return 'قبل يومين';
  if (d.inDays < 7) return 'قبل ${d.inDays} أيام';
  return DateFormat('d/M/yyyy').format(t.toLocal());
}

/// «18/10/2026 14:05» بالتوقيت المحلي.
String dateTimeFmt(DateTime? t) => t == null ? '—' : DateFormat('d/M/yyyy HH:mm').format(t.toLocal());

/// رقم صحيح مما يكتبه المستخدم — يقبل الأرقام العربية والفواصل.
int? parseIntLoose(String? raw) => int.tryParse(normalizeCode(raw ?? '').replaceAll(RegExp(r'[^0-9-]'), ''));

/// العدد مع المعدود بقواعد العربية: 1 يوم، يومان، 3 أيام، 11 يوماً.
String arCount(int n, {required String one, required String two, required String few, required String many}) {
  if (n == 1) return one;
  if (n == 2) return two;
  final r = n % 100;
  if (r >= 3 && r <= 10) return '${numFmt(n)} $few';
  return '${numFmt(n)} $many';
}

String daysLabel(int n) => arCount(n, one: 'يوم واحد', two: 'يومان', few: 'أيام', many: 'يوماً');

/// «3 أمور تحتاج انتباهك» بصيغة صحيحة لكل عدد.
String issuesLabel(int n) => switch (n) {
  1 => 'أمر واحد يحتاج انتباهك',
  2 => 'أمران يحتاجان انتباهك',
  _ when n % 100 >= 3 && n % 100 <= 10 => '$n أمور تحتاج انتباهك',
  _ => '$n أمراً يحتاج انتباهك',
};

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
