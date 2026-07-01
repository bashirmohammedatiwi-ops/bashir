import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/coupon.dart';

/// كوبون مطبّق يُشارَك بين السلة وصفحة الدفع.
final appliedCouponProvider = StateProvider<Coupon?>((ref) => null);
