import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/utils/formatters.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../data/models/coupon.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../worlds/worlds_provider.dart';
import 'cart_provider.dart';

/// كوبون مطبّق يُشارَك بين الرئيسية والسلة وصفحة الدفع.
/// يبقى مفعّلاً حتى لو كانت السلة دون الحد الأدنى — والخصم يُحسب حين تبلغه.
final appliedCouponProvider = StateProvider<Coupon?>((ref) => null);

/// كوبونات العرض في الرئيسية والسلة — للعالم المختار، ولما يناسب الزبونة المسجّلة.
final featuredCouponsProvider = FutureProvider.autoDispose<List<Coupon>>((ref) async {
  final world = ref.watch(selectedWorldSlugProvider);
  ref.watch(authProvider.select((a) => a.user?.id));
  try {
    return await ref.read(apiServiceProvider).getFeaturedCoupons(world: world);
  } catch (_) {
    return const [];
  }
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
  ({Coupon? coupon, String? reason}) res;
  try {
    res = await ref.read(apiServiceProvider).checkCoupon(code);
  } catch (_) {
    if (context.mounted && !quiet) AppSnackbar.error(context, 'تعذّر التحقق من الكود الآن، حاولي بعد قليل');
    return CouponApplyResult.invalid;
  }
  final coupon = res.coupon;
  if (coupon == null) {
    if (context.mounted && !quiet) AppSnackbar.error(context, res.reason ?? 'الكود غير صحيح');
    return CouponApplyResult.invalid;
  }
  ref.read(appliedCouponProvider.notifier).state = coupon;
  HapticFeedback.mediumImpact();
  final subtotal = ref.read(cartProvider).subtotal;
  final missing = coupon.missingFor(subtotal);
  if (context.mounted && !quiet) {
    final msg = missing > 0
        ? 'فعّلنا ${coupon.code} ✓ أضيفي ${formatPrice(missing)} وينطبق الخصم تلقائياً'
        : 'فعّلنا ${coupon.code} ✓ الخصم ينطبق على سلتكِ تلقائياً';
    if (onViewCart != null) {
      AppSnackbar.action(context, message: msg, actionLabel: 'السلة', onAction: onViewCart);
    } else {
      AppSnackbar.success(context, msg);
    }
  }
  return missing > 0 ? CouponApplyResult.pending : CouponApplyResult.applied;
}
