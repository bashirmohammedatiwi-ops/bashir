import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/locale_provider.dart';
import '../network/api_exception.dart';

/// رسالة خطأ بلغتين — تُختار حسب لغة الواجهة.
typedef _Msg = ({String ar, String en});

const _Msg _unexpected = (ar: 'حدث خطأ غير متوقع', en: 'An unexpected error occurred');
const _Msg _generic = (ar: 'حدث خطأ. حاولي مجدداً.', en: 'Something went wrong. Please try again.');
const _Msg _phoneTaken = (
  ar: 'هذا الرقم مسجّل مسبقاً — سجّلي الدخول به',
  en: 'This phone is already registered — sign in instead',
);
const _Msg _emailTaken = (
  ar: 'هذا البريد الإلكتروني مسجّل مسبقاً. سجّلي الدخول أو استخدمي بريداً آخر.',
  en: 'This email is already registered. Sign in or use another email.',
);
const _Msg _accountExists = (
  ar: 'هذا الحساب موجود مسبقاً. سجّلي الدخول به.',
  en: 'This account already exists. Sign in instead.',
);
const _Msg _accountDisabled = (
  ar: 'تم تعطيل هذا الحساب. تواصلي مع الدعم.',
  en: 'This account is disabled. Contact support.',
);
const _Msg _wrongCurrentPassword = (ar: 'كلمة المرور الحالية غير صحيحة', en: 'Current password is incorrect');
const _Msg _wrongCredentials = (
  ar: 'رقم الهاتف أو كلمة المرور غير صحيحة.',
  en: 'Incorrect phone number or password.',
);
const _Msg _sessionExpired = (ar: 'انتهت الجلسة — سجّلي الدخول مجدداً', en: 'Session expired — please sign in');
const _Msg _forbidden = (ar: 'غير مسموح بهذا الإجراء', en: "You're not allowed to do this");
const _Msg _invalidEmail = (ar: 'أدخلي بريداً إلكترونياً صحيحاً.', en: 'Enter a valid email address.');
const _Msg _shortPassword = (
  ar: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
  en: 'Password must be at least 6 characters.',
);
const _Msg _invalidName = (
  ar: 'أدخلي اسماً صحيحاً (حرفان على الأقل).',
  en: 'Enter a valid name (at least 2 characters).',
);
const _Msg _invalidPhone = (
  ar: 'رقم الهاتف غير صالح أو مستخدم مسبقاً.',
  en: 'Invalid phone number or already in use.',
);
const _Msg _checkInput = (ar: 'تحققي من البيانات المدخلة.', en: 'Please check the details you entered.');
const _Msg _offline = (
  ar: 'تعذّر الاتصال بالخادم. تحققي من الإنترنت وحاولي مجدداً.',
  en: 'Could not connect. Check your internet and try again.',
);
const _Msg _notFound = (ar: 'المحتوى غير متوفر حالياً.', en: 'Content is not available right now.');
const _Msg _productGone = (
  ar: 'أحد المنتجات لم يعد متوفراً — حدّثي السلة.',
  en: 'An item in your bag is no longer available — please update your bag.',
);
const _Msg _tooMany = (
  ar: 'محاولات كثيرة. انتظري قليلاً ثم حاولي مجدداً.',
  en: 'Too many attempts. Wait and try again.',
);
const _Msg _serverBusy = (ar: 'الخادم مشغول مؤقتاً. حاولي بعد قليل.', en: 'Server is busy. Try again shortly.');
const _Msg _minOrderNotMet = (
  ar: 'لم يبلغ طلبكِ الحد الأدنى لهذا الكوبون.',
  en: "Your order hasn't reached this coupon's minimum yet.",
);
const _Msg _firstOrderOnly = (ar: 'هذا الكوبون لأول طلب فقط.', en: 'This coupon is for your first order only.');
const _Msg _invalidCoupon = (ar: 'كود الخصم غير صالح أو منتهي.', en: 'Invalid or expired coupon.');
const _Msg _emptyOrder = (ar: 'سلتكِ فارغة — أضيفي منتجات أولاً.', en: 'Your bag is empty — add items first.');

/// كل الرسائل الثابتة: نص سبق عرضه (ثم تغيّرت اللغة، أو مُرّر مرة ثانية) يُترجم كما هو.
const List<_Msg> _known = [
  _unexpected, _generic, _phoneTaken, _emailTaken, _accountExists, _accountDisabled,
  _wrongCurrentPassword, _wrongCredentials, _sessionExpired, _forbidden, _invalidEmail,
  _shortPassword, _invalidName, _invalidPhone, _checkInput, _offline, _notFound, _productGone,
  _tooMany, _serverBusy, _minOrderNotMet, _firstOrderOnly, _invalidCoupon, _emptyOrder,
];

/// رسائل السيرفر العربية المعروفة → ترجمتها الإنجليزية. نصها العربي مكتوب للزبونة أصلاً فيُعرض كما هو.
final List<(RegExp, String Function(Match))> _arabicToEnglish = [
  (RegExp(r'^نفدت الكمية: (.+)$'), (m) => 'Out of stock: ${m[1]}'),
  (RegExp(r'^اختاري اللون لـ«(.+)»$'), (m) => 'Choose a shade for “${m[1]}”'),
  (RegExp(r'^اللون المختار لـ«(.+?)» لم يعد متوفراً'),
      (m) => 'The shade you picked for “${m[1]}” is no longer available — remove it from your bag.'),
  (RegExp(r'^اللون «(.+?)» غير متوفر'), (m) => 'The shade “${m[1]}” is unavailable right now — remove it from your bag.'),
  (RegExp(r'^«(.+?)» غير متوفر'), (m) => '“${m[1]}” is unavailable right now — remove it from your bag.'),
  (RegExp(r'انتهت صلاحية الكوبون'), (_) => 'This coupon has expired.'),
  (RegExp(r'نفد استخدام هذا الكوبون'), (_) => 'This coupon has been fully used.'),
  (RegExp(r'استخدمتِ هذا الكوبون'), (_) => "You've already used this coupon."),
  (RegExp(r'رصيد نقاط الولاء غير كاف'), (_) => "You don't have enough loyalty points."),
  (RegExp(r'عنوان التوصيل غير موجود'), (_) => 'This delivery address no longer exists — choose another one.'),
  (RegExp(r'أكملي اسم المستلمة'), (_) => "Complete the recipient's name, phone number and governorate."),
  (RegExp(r'استلام من الفرع غير متاح'), (_) => "Branch pickup isn't available right now."),
  (RegExp(r'الدفع (?:بالبطاقة|الإلكتروني) غير متاح'), (_) => "Card payment isn't available right now."),
  (RegExp(r'طريقة الدفع غير مدعومة'), (_) => "This payment method isn't supported."),
  (RegExp(r'ليس بالدفع الإلكتروني'), (_) => "This order isn't paid by card."),
  (RegExp(r'^الطلب ملغى'), (_) => 'This order was cancelled.'),
  (RegExp(r'لا يوجد مبلغ للدفع'), (_) => 'There is nothing left to pay on this order.'),
  (RegExp(r'لا يمكن إلغاء الطلب'), (_) => "This order can't be cancelled once it's being prepared — contact us."),
  (RegExp(r'الباقة غير متوفرة'), (_) => "This bundle isn't available right now."),
  (RegExp(r'كلمة مرور جديدة مختلفة'), (_) => 'Choose a new password that differs from the current one.'),
  (RegExp(r'لا يمكن تغيير كلمة المرور'), (_) => "This account's password can't be changed here."),
  (RegExp(r'الحساب غير موجود أو محذوف'), (_) => 'This account no longer exists.'),
  (RegExp(r'لا يمكن حذف هذا النوع من الحسابات'), (_) => "This type of account can't be deleted from the app."),
  (RegExp(r'التسجيل قصير'), (_) => 'The recording is too short — hold the mic a little longer.'),
  (RegExp(r'ماكو تسجيل|أرسل ملف صوت'), (_) => "We didn't receive a recording — please try again."),
  (RegExp(r'البيانات المدخلة'), (_) => _checkInput.en),
];

/// أي حرف عربي — لمعرفة لغة النص الخام القادم من السيرفر.
final _arabicLetters = RegExp(r'[؀-ۿ]');

/// نص تقني لا يُعرض للزبونة: استثناءات Dart/Dio («FormatException»، «RangeError (index)»،
/// «Error: …») وأخطاء التحويل («type 'Null' is not a subtype…»).
final _technical = RegExp(
  r"exception|\berror:|[a-z]error\b|is not a subtype|null check|bad state|instance of '|stack ?trace|\btype '",
  caseSensitive: false,
);

/// بادئة `Exception: ` التي يضيفها Dart لـ`Exception('…')` — الرسالة بعدها قد تكون مفهومة.
final _exceptionPrefix = RegExp(r'^(?:Api)?Exception:\s*');

/// رسائل خطأ مفهومة للمستخدم بدل نصوص تقنية — بلغة الواجهة.
/// [lang] اختياري: إن لم يُمرَّر تُستخدم اللغة الحالية من [AppLocale].
String friendlyError(Object? error, {String? lang}) {
  final isAr = (lang ?? AppLocale.current) == 'ar';
  if (error is ApiException) {
    return _friendlyApiError(error.message, error.status, isAr);
  }

  final raw = (error?.toString() ?? '').trim().replaceFirst(_exceptionPrefix, '');
  if (raw.isEmpty) return _pick(_unexpected, isAr);
  return _friendlyApiError(raw, _statusFromText(raw), isAr);
}

/// اختصار للواجهات: `ref.friendly(e)` بلغة الواجهة الحالية.
extension FriendlyErrorRef on WidgetRef {
  String friendly(Object? e) => friendlyError(e, lang: read(languageCodeProvider));
}

String _pick(_Msg m, bool isAr) => isAr ? m.ar : m.en;

/// رمز HTTP من نص تقني فقط («status code of 404»، «HTTP 500») — لا من أرقام عادية كـ«عطر 500ml».
int? _statusFromText(String raw) {
  final m = RegExp(r'(?:status(?:\s*code)?|http)\D{0,12}\b([45]\d\d)\b', caseSensitive: false).firstMatch(raw);
  return m != null ? int.tryParse(m.group(1)!) : null;
}

bool _isNetworkError(String trimmed, String lower) =>
    lower.contains('socketexception') ||
    lower.contains('handshakeexception') ||
    lower.contains('timeoutexception') ||
    lower.contains('connection timeout') ||
    lower.contains('connection error') ||
    lower.contains('connection refused') ||
    lower.contains('failed host lookup') ||
    lower.contains('network is unreachable') ||
    trimmed.contains('تحققي من اتصالك') ||
    trimmed.contains('تعذّر الاتصال') ||
    trimmed.contains('تعذر الاتصال');

/// ترجمة رسالة عربية معروفة من السيرفر، أو null إن لم تكن منها.
String? _arabicServerEnglish(String trimmed) {
  for (final (pattern, en) in _arabicToEnglish) {
    final match = pattern.firstMatch(trimmed);
    if (match != null) return en(match);
  }
  return null;
}

String _friendlyApiError(String message, int? status, bool isAr) {
  final trimmed = message.trim();
  final lower = trimmed.toLowerCase();
  if (trimmed.isEmpty) return _pick(_generic, isAr);

  // ── رسالة ودّية سبق عرضها (تغيّرت اللغة، أو مُرّرت مرة ثانية): بلغة الواجهة كما هي ──
  for (final m in _known) {
    if (m.ar == trimmed || m.en == trimmed) return _pick(m, isAr);
  }

  if (_isNetworkError(trimmed, lower)) return _pick(_offline, isAr);

  // ── رسائل الطلب الإنجليزية من السيرفر (قبل فحص الحقول: اسم المنتج قد يحوي «name» أو «phone») ──
  final outOfStock = RegExp(r'^out of stock:\s*(.+)$', caseSensitive: false).firstMatch(trimmed);
  if (outOfStock != null) {
    final name = outOfStock.group(1)!.trim();
    return isAr ? 'نفدت الكمية: $name' : 'Out of stock: $name';
  }
  final shade = RegExp(r'^(?:shade required:\s*(.+)|choose a shade for “(.+)”)$', caseSensitive: false)
      .firstMatch(trimmed);
  if (shade != null) {
    final name = (shade.group(1) ?? shade.group(2)!).trim();
    return isAr ? 'اختاري اللون لـ«$name»' : 'Choose a shade for “$name”';
  }
  if (lower.contains('minimum order not met')) return _pick(_minOrderNotMet, isAr);
  if (lower.contains('first order only')) return _pick(_firstOrderOnly, isAr);
  if (lower.startsWith('invalid coupon')) return _pick(_invalidCoupon, isAr);
  if (lower == 'empty order') return _pick(_emptyOrder, isAr);
  if (RegExp(r'^product\b.*\bnot found$').hasMatch(lower)) return _pick(_productGone, isAr);

  // ── حساب مسجّل مسبقاً: الهاتف أولاً (نموذج التسجيل بلا بريد)، ثم البريد، ثم أي تعارض آخر ──
  final phoneWords = lower.contains('phone') || trimmed.contains('هاتف');
  final emailWords = lower.contains('email') || lower.contains('e-mail') || trimmed.contains('بريد');
  final conflict = status == 409 || _hasConflictWording(trimmed, lower);
  if (conflict && phoneWords) return _pick(_phoneTaken, isAr);
  if (conflict && emailWords) return _pick(_emailTaken, isAr);
  if (status == 409) return _pick(_accountExists, isAr);

  // ── الحساب والجلسة: المحتوى قبل الرمز (السيرفر يرسل 401 للحساب المعطّل أيضاً) ──
  final disabledWords = trimmed.contains('تعطيل') ||
      trimmed.contains('معطّل') ||
      trimmed.contains('معطل') ||
      lower.contains('disabled') ||
      lower.contains('deactivated');
  final accountContext = status == 401 || status == 403 || trimmed.contains('حساب') || lower.contains('account');
  if (disabledWords && accountContext) return _pick(_accountDisabled, isAr);

  // السيرفر يرسل 400 مع code: WRONG_CURRENT_PASSWORD ونصاً عربياً — يكفي النص.
  if (lower.contains('wrong_current_password') ||
      lower.contains('current password') ||
      trimmed.contains('كلمة المرور الحالية')) {
    return _pick(_wrongCurrentPassword, isAr);
  }

  final credentialWords = trimmed.contains('كلمة المرور') || lower.contains('password') || lower.contains('credentials');
  if ((status == 401 && credentialWords) || lower.contains('invalid credentials')) {
    return _pick(_wrongCredentials, isAr);
  }
  if (status == 401 ||
      lower.contains('session expired') ||
      lower.contains('unauthenticated') ||
      lower == 'unauthorized' ||
      trimmed.contains('انتهت الجلسة')) {
    return _pick(_sessionExpired, isAr);
  }

  if (status == 403) return _pick(_forbidden, isAr);

  // ── رسالة عربية معروفة من السيرفر: أدقّ من التخمين بالرمز («الدفع الإلكتروني غير متاح» تأتي 503) ──
  final knownArabic = _arabicServerEnglish(trimmed);
  if (knownArabic != null) return isAr ? trimmed : knownArabic;

  if (status == 400 || status == 422) {
    if (emailWords) return _pick(_invalidEmail, isAr);
    if (credentialWords &&
        RegExp(r'أحرف|حروف|مطلوبة|characters|at least|longer|shorter|required').hasMatch(lower)) {
      return _pick(_shortPassword, isAr);
    }
    if (lower.contains('name') || trimmed.contains('الاسم')) return _pick(_invalidName, isAr);
    if (phoneWords) return _pick(_invalidPhone, isAr);
  }

  if (status == 404 || lower.contains('not found')) return _pick(_notFound, isAr);

  if (status == 429 || lower.contains('too many')) return _pick(_tooMany, isAr);

  if (status != null && status >= 500) return _pick(_serverBusy, isAr);

  // ── النص الخام: يُعرض فقط إن كان بلغة الواجهة وغير تقني، وإلا رسالة عامة بلغتها ──
  if (_technical.hasMatch(trimmed)) return _pick(_generic, isAr);
  final arabicText = _arabicLetters.hasMatch(trimmed);
  if (isAr) return arabicText ? trimmed : _generic.ar;
  return arabicText ? _generic.en : trimmed;
}

bool _hasConflictWording(String trimmed, String lower) =>
    lower.contains('already registered') ||
    lower.contains('already exists') ||
    lower.contains('already in use') ||
    lower.contains('email already') ||
    trimmed.contains('مسجّل مسبقاً') ||
    trimmed.contains('مسجل مسبقاً') ||
    trimmed.contains('مستخدم في حساب آخر');

/// تعارض على رقم الهاتف (409) — لعرض «سجّلي الدخول» بدل خطأ عام.
bool isPhoneAlreadyRegisteredError(Object? error) {
  if (error is! ApiException) return false;
  final lower = error.message.toLowerCase();
  final conflict = error.status == 409 || _hasConflictWording(error.message, lower);
  return conflict && (lower.contains('phone') || error.message.contains('هاتف'));
}

/// تعارض على البريد — يتطلب ذكر البريد صراحةً، فرقم هاتف مكرر لا يُعدّ «بريداً مسجّلاً».
bool isEmailAlreadyRegisteredError(Object? error) {
  if (error is! ApiException) return false;
  final lower = error.message.toLowerCase();
  final conflict = error.status == 409 || _hasConflictWording(error.message, lower);
  final emailWords = lower.contains('email') || lower.contains('e-mail') || error.message.contains('بريد');
  return conflict && emailWords;
}
