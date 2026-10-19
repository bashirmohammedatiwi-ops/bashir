import 'package:flutter/material.dart';

import '../../../core/widgets/free_shipping_progress.dart';
import '../../../data/models/coupon.dart';
import 'cart_theme.dart';

/// أقرب طريق للتوصيل المجاني في السلة: حدّ المتجر، أو كوبون توصيل مجاني لم تبلغ السلة حدّه.
///
/// حدّ المتجر يُقارن بالمجموع الفرعي، وحدّ الكوبون بأساسه (المجموع بعد توفير الباقات)
/// — نفس قاعدة الخادم. أيّهما أقرب يُعرض، حتى لا يقول الشريط شيئاً والكوبون شيئاً آخر.
@immutable
class CartShippingTarget {
  /// القيمة الحالية والحد الذي يُقاس إليه شريط التقدّم.
  final int progress;
  final int threshold;

  /// كوبون التوصيل المجاني مفعّل فعلاً (بلغت السلة حدّه الأدنى).
  final bool viaCoupon;

  /// كم ينقص للتوصيل المجاني — صفر إن تحقق أو لم يكن في المتجر توصيل مجاني.
  final int remaining;

  const CartShippingTarget._(this.progress, this.threshold, {this.viaCoupon = false, this.remaining = 0});

  factory CartShippingTarget.of({
    required int subtotal,
    required int threshold,
    Coupon? coupon,
    required int couponBase,
  }) {
    final shipCoupon = coupon != null && coupon.freeShipping ? coupon : null;
    if (shipCoupon != null && shipCoupon.eligibleFor(couponBase)) {
      return CartShippingTarget._(subtotal, threshold, viaCoupon: true);
    }
    final storeGap = threshold > 0 ? (threshold - subtotal).clamp(0, threshold) : null;
    if (storeGap == 0) return CartShippingTarget._(subtotal, threshold);
    final couponGap = shipCoupon?.missingFor(couponBase);
    if (couponGap != null && (storeGap == null || couponGap < storeGap)) {
      return CartShippingTarget._(couponBase, shipCoupon!.minOrder, remaining: couponGap);
    }
    return CartShippingTarget._(subtotal, threshold, remaining: storeGap ?? 0);
  }
}

/// شريط التقدّم نحو التوصيل المجاني في السلة — مكوّن [FreeShippingProgress] الموحّد.
class CartShippingBanner extends StatelessWidget {
  final CartShippingTarget target;

  /// «أضيفي المزيد»: يقفز لصف المنتجات المقترحة لسد الفرق.
  final VoidCallback? onFillGap;

  const CartShippingBanner({super.key, required this.target, this.onFillGap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 14, CartTheme.hPad, 0),
      child: FreeShippingProgress(
        subtotal: target.progress,
        threshold: target.threshold,
        viaCoupon: target.viaCoupon,
        onFillGap: onFillGap,
      ),
    );
  }
}
