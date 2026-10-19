import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../data/models/coupon.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../catalog/catalog_providers.dart';
import '../worlds/worlds_provider.dart';
import 'cart_packages_provider.dart';
import 'cart_provider.dart';

/// سبب إزالة الكود المطبّق تلقائياً (انتهى، لأول طلب فقط…) — يُعرض بجانب حقل الكود.
/// يُمسح عند تطبيق كود جديد أو إزالته يدوياً.
final appliedCouponRejectProvider = StateProvider<String?>((ref) => null);

/// كوبون مطبّق يُشارَك بين الرئيسية والسلة وصفحة الدفع.
///
/// يُحفظ على الجهاز مع السلة، ويُعاد التحقق منه مع السيرفر عند فتح التطبيق، وعند
/// تسجيل الدخول أو تبديل الحساب (شروط مثل «أول طلب» تخص الزبونة)، وعند العودة
/// للتطبيق، وقبل الدفع ([AppliedCouponNotifier.revalidate]). يُزال عند الخروج من الحساب.
/// يبقى مفعّلاً حتى لو كانت السلة دون الحد الأدنى — والخصم يُحسب حين تبلغه.
class AppliedCouponNotifier extends StateNotifier<Coupon?> {
  AppliedCouponNotifier(this._ref) : super(null) {
    _restore();
    _lifecycle = AppLifecycleListener(onResume: () => unawaited(revalidate()));
  }

  final Ref _ref;
  late final AppLifecycleListener _lifecycle;

  static const _key = 'applied_coupon_v1';

  /// العودة للتطبيق متكررة (نوافذ النظام، تطبيق الدفع…): تحقق واحد كل 30 ثانية يكفي.
  static const _recheckEvery = Duration(seconds: 30);

  DateTime? _checkedAt;
  Future<bool>? _checking;

  /// كود محفوظ بلا نسخة كاملة — يُعرض بعد أول تحقق.
  String? _pendingCode;

  /// حالة الدخول لم تتضح بعد عند فتح التطبيق: التحقق ينتظرها (وإلا تحققنا كزائرة).
  bool _awaitingAuth = false;

  @override
  void dispose() {
    _lifecycle.dispose();
    super.dispose();
  }

  SharedPreferences? get _prefs {
    try {
      return _ref.read(sharedPreferencesProvider);
    } catch (_) {
      return null;
    }
  }

  void _restore() {
    final raw = _prefs?.getString(_key);
    if (raw == null) return;
    try {
      final json = Map<String, dynamic>.from(jsonDecode(raw) as Map);
      final code = json['code']?.toString().trim() ?? '';
      if (code.isEmpty) return;
      final snapshot = json['coupon'];
      if (snapshot is Map) {
        state = Coupon.fromJson(Map<String, dynamic>.from(snapshot));
      } else {
        _pendingCode = code;
      }
    } catch (_) {
      return;
    }
    if (_ref.read(authProvider).status == AuthStatus.unknown) {
      _awaitingAuth = true;
    } else {
      // بعد انتهاء إنشاء المزوّد — لا تُعدَّل المزوّدات الأخرى أثناءه.
      Future.microtask(() => revalidate(force: true));
    }
  }

  void _persist() {
    final prefs = _prefs;
    if (prefs == null) return;
    final coupon = state;
    final code = coupon?.code ?? _pendingCode;
    if (code == null || code.isEmpty) {
      unawaited(prefs.remove(_key));
      return;
    }
    unawaited(prefs.setString(
      _key,
      jsonEncode({'code': code, if (coupon != null) 'coupon': _couponSnapshot(coupon)}),
    ));
  }

  void _setRejectReason(String? reason) =>
      _ref.read(appliedCouponRejectProvider.notifier).state = reason;

  /// يطبّق كوداً تحقق منه السيرفر للتو (أو يزيله إن كان null).
  void set(Coupon? coupon) {
    if (coupon == null) {
      clear();
      return;
    }
    state = coupon;
    _pendingCode = null;
    _awaitingAuth = false;
    _checkedAt = DateTime.now();
    _setRejectReason(null);
    _persist();
  }

  void clear() {
    state = null;
    _pendingCode = null;
    _awaitingAuth = false;
    _setRejectReason(null);
    _persist();
  }

  void _onAuthChanged(({bool known, String? uid})? prev, ({bool known, String? uid}) next) {
    if (!next.known) return;
    if (prev == null || !prev.known) {
      // اتضحت حالة الدخول بعد فتح التطبيق: نتحقق من الكود المحفوظ الآن.
      if (_awaitingAuth) unawaited(revalidate(force: true));
      return;
    }
    if (prev.uid == next.uid) return;
    if (next.uid == null) {
      // خرجت من حسابها: شروط الكود (أول طلب، حد لكل زبونة) كانت لها هي.
      clear();
      return;
    }
    // دخلت أو بدّلت الحساب: الكود يُفحص بشروطها.
    unawaited(revalidate(force: true));
  }

  /// يعيد التحقق من الكود المطبّق مع السيرفر. يعيد false فقط إن رُفض — فيُزال ويُحفظ
  /// السبب في [appliedCouponRejectProvider]. بلا اتصال يبقى الكود ويُعاد التحقق لاحقاً.
  /// دون [force] لا يتكرر خلال 30 ثانية من آخر تحقق.
  Future<bool> revalidate({bool force = false}) {
    final running = _checking;
    if (running != null) {
      // تحقق جارٍ بحالة دخول سابقة: نعيده بعده بالحالة الحالية.
      return force ? running.then((_) => revalidate(force: true)) : running;
    }
    final code = state?.code ?? _pendingCode;
    if (code == null || code.isEmpty) return Future.value(true);
    if (_ref.read(authProvider).status == AuthStatus.unknown) {
      _awaitingAuth = true;
      return Future.value(true);
    }
    final last = _checkedAt;
    if (!force && last != null && DateTime.now().difference(last) < _recheckEvery) {
      return Future.value(true);
    }
    final run = _check(code).whenComplete(() => _checking = null);
    _checking = run;
    return run;
  }

  Future<bool> _check(String code) async {
    final api = _ref.read(apiServiceProvider);
    final ({Coupon? coupon, String? reason}) res;
    try {
      res = await api.checkCoupon(code);
    } catch (_) {
      if (!mounted) return true;
      // بلا اتصال: نبقيه — إلا إن انتهى وقته على الجهاز نفسه.
      final ends = state?.endsAt;
      if (state?.code == code && ends != null && !ends.isAfter(DateTime.now())) {
        _reject(null, expired: true);
        return false;
      }
      return true;
    }
    if (!mounted) return true;
    // تغيّر الكود أثناء الانتظار (طبّقت غيره أو أزالته): النتيجة لم تعد تخصه.
    if ((state?.code ?? _pendingCode)?.toUpperCase() != code.toUpperCase()) return true;
    _checkedAt = DateTime.now();
    _awaitingAuth = false;
    final coupon = res.coupon;
    if (coupon == null) {
      _reject(res.reason);
      return false;
    }
    // أحدث شروط الكود (الحد الأدنى، الانتهاء، المتبقي…).
    state = coupon;
    _pendingCode = null;
    _persist();
    return true;
  }

  void _reject(String? reason, {bool expired = false}) {
    final s = _ref.read(stringsProvider);
    clear();
    _setRejectReason(expired ? (s.isAr ? 'انتهت صلاحية الكود' : 'This code has expired') : couponReasonText(reason, s));
  }
}

/// بمفاتيح السيرفر نفسها — تُقرأ بـ Coupon.fromJson.
Map<String, dynamic> _couponSnapshot(Coupon c) => {
      'id': c.id,
      'code': c.code,
      'type': c.type,
      'value': c.value,
      'description': c.description,
      'minOrder': c.minOrder,
      'isActive': c.isActive,
      if (c.title != null) 'title': c.title,
      if (c.subtitle != null) 'subtitle': c.subtitle,
      'theme': c.theme,
      if (c.maxDiscount != null) 'maxDiscount': c.maxDiscount,
      if (c.endsAt != null) 'endsAt': c.endsAt!.toUtc().toIso8601String(),
      if (c.remaining != null) 'remaining': c.remaining,
    };

final appliedCouponProvider = StateNotifierProvider<AppliedCouponNotifier, Coupon?>((ref) {
  final notifier = AppliedCouponNotifier(ref);
  ref.listen<({bool known, String? uid})>(
    authProvider.select((a) => (known: a.status != AuthStatus.unknown, uid: a.user?.id)),
    notifier._onAuthChanged,
  );
  return notifier;
});

/// أسباب الرفض تصل من السيرفر بالعربية: للإنجليزية نترجم المعروف منها، وما لا نعرفه
/// يصبح رسالة عامة بدل نص عربي وسط واجهة إنجليزية.
String couponReasonText(String? reason, AppStrings s) {
  final r = reason?.trim() ?? '';
  if (r.isEmpty) return s.invalidCoupon;
  if (s.isAr) return r;
  if (r.contains('لأول طلب')) return 'This code is for your first order only';
  if (r.contains('انتهت')) return 'This code has expired';
  if (r.contains('لم يبدأ')) return "This code isn't active yet";
  if (r.contains('نفد')) return 'This code has been fully redeemed';
  if (r.contains('استخدمتِ')) return "You've already used this code";
  if (r.contains('غير صحيح')) return 'Invalid code';
  return RegExp(r'[؀-ۿ]').hasMatch(r) ? s.invalidCoupon : r;
}

/// حقل الكود في السلة والدفع: يتحقق ويطبّق. يعيد null عند النجاح أو رسالة الخطأ.
///
/// الكود السابق يبقى مطبّقاً إن رُفض الجديد، وانقطاع الشبكة يظهر كذلك لا كـ«كود غير
/// صحيح». [subtotal] أساس الكوبون (المجموع بعد توفير الباقات): دون حدّه الأدنى يبقى
/// الكود مفعّلاً ويُحسب الخصم حين تبلغه السلة.
Future<String?> applyCouponFromField(WidgetRef ref, String code, {required int subtotal}) async {
  final s = ref.read(stringsProvider);
  final trimmed = code.trim();
  if (trimmed.isEmpty) return s.enterCouponPrompt;
  final notifier = ref.read(appliedCouponProvider.notifier);
  final api = ref.read(apiServiceProvider);
  final ({Coupon? coupon, String? reason}) res;
  try {
    res = await api.checkCoupon(trimmed);
  } catch (e) {
    return friendlyError(e, lang: s.lang);
  }
  final coupon = res.coupon;
  if (coupon == null) return couponReasonText(res.reason, s);
  notifier.set(coupon);
  if (coupon.eligibleFor(subtotal)) {
    HapticFeedback.mediumImpact();
  } else {
    HapticFeedback.selectionClick();
  }
  return null;
}

/// إزالة الكود المطبّق يدوياً (من السلة أو الدفع).
void removeAppliedCoupon(WidgetRef ref) {
  ref.read(appliedCouponProvider.notifier).clear();
  HapticFeedback.selectionClick();
}

/// كوبونات العرض لعالم معيّن (null = المتجر كله) ولما يناسب الزبونة المسجّلة.
/// كل عالم بمزوّده: الطبقة الخارجة أثناء تبديل العالم تبقى بكوبوناتها حتى تختفي.
/// تبقى 5 دقائق — الرف يخرج من الشاشة ويعود دون إعادة طلب.
final featuredCouponsForWorldProvider =
    FutureProvider.autoDispose.family<List<Coupon>, String?>((ref, world) {
  ref.watch(authProvider.select((a) => a.user?.id));
  return keepAliveFor(
    ref,
    const Duration(minutes: 5),
    () => ref.read(apiServiceProvider).getFeaturedCoupons(world: world),
  );
});

/// كوبونات العرض في الرئيسية والسلة — للعالم المختار، ولما يناسب الزبونة المسجّلة.
final featuredCouponsProvider = FutureProvider.autoDispose<List<Coupon>>((ref) {
  final world = ref.watch(selectedWorldSlugProvider);
  return keepAliveFor(
    ref,
    const Duration(minutes: 5),
    () => ref.watch(featuredCouponsForWorldProvider(world).future),
  );
});

/// نتيجة «استخدمي الكود».
enum CouponApplyResult { applied, pending, invalid }

/// يفعّل كوداً بلمسة: يتحقق من السيرفر، يحفظه للسلة والدفع، ويبلّغ بالنتيجة.
Future<CouponApplyResult> applyCouponCode(
  BuildContext context,
  WidgetRef ref,
  String code, {
  VoidCallback? onViewCart,
  bool quiet = false,
}) async {
  HapticFeedback.selectionClick();
  final s = ref.read(stringsProvider);
  final notifier = ref.read(appliedCouponProvider.notifier);
  final api = ref.read(apiServiceProvider);
  // الخصم يُحسب على المجموع بعد توفير الباقات (نفس قاعدة السيرفر).
  final int base = ref.read(cartProvider).subtotal - ref.read(cartPackageSavingProvider);
  ({Coupon? coupon, String? reason}) res;
  try {
    res = await api.checkCoupon(code);
  } catch (_) {
    if (context.mounted && !quiet) {
      AppSnackbar.error(
        context,
        s.isAr ? 'تعذّر التحقق من الكود الآن، حاولي بعد قليل' : "Couldn't verify the code right now — try again shortly",
      );
    }
    return CouponApplyResult.invalid;
  }
  final coupon = res.coupon;
  if (coupon == null) {
    if (context.mounted && !quiet) AppSnackbar.error(context, couponReasonText(res.reason, s));
    return CouponApplyResult.invalid;
  }
  notifier.set(coupon);
  HapticFeedback.mediumImpact();
  final missing = coupon.missingFor(base);
  if (context.mounted && !quiet) {
    final msg = missing > 0
        ? (s.isAr
            ? 'فعّلنا ${coupon.code} ✓ أضيفي ${formatPrice(missing)} وينطبق الخصم تلقائياً'
            : '${coupon.code} activated ✓ Add ${formatPrice(missing)} and the discount applies automatically')
        : (s.isAr
            ? 'فعّلنا ${coupon.code} ✓ الخصم ينطبق على سلتكِ تلقائياً'
            : '${coupon.code} activated ✓ The discount applies to your bag automatically');
    if (onViewCart != null) {
      AppSnackbar.action(context, message: msg, actionLabel: s.navCart, onAction: onViewCart);
    } else {
      AppSnackbar.success(context, msg);
    }
  }
  return missing > 0 ? CouponApplyResult.pending : CouponApplyResult.applied;
}
