import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/quick_shade_sheet.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../cart/cart_provider.dart';
import 'advisor_models.dart';
import 'advisor_strings.dart';

/// نتيجة إضافة من بطاقات «ديما». [maxReached]: السطر بلغ حد المخزون فلم يُضف شيء —
/// لا يُعدّ إضافة ولا يُرسل كإشارة تعلّم.
enum AdvisorAddResult { added, needsShade, unavailable, maxReached, failed }

void openAdvisorProduct(BuildContext context, AdvisorProduct p) {
  HapticFeedback.selectionClick();
  context.push('/product/${p.route}');
}

Future<Product> _fetch(WidgetRef ref, AdvisorProduct p) => ref.read(apiServiceProvider).getProduct(p.route);

AdvisorAddResult _addLoaded(WidgetRef ref, Product product) {
  if (!product.inStock) return AdvisorAddResult.unavailable;
  if (product.hasMultipleDisplayableShades) return AdvisorAddResult.needsShade;
  // add() تعيد false حين تبلغ الكمية حد المخزون — لا نُظهر «أُضيف» لشيء لم يُضف.
  final ok = ref.read(cartProvider.notifier).add(product, shade: product.soleDisplayableShade);
  return ok ? AdvisorAddResult.added : AdvisorAddResult.maxReached;
}

void _showAdded(BuildContext context, AppStrings s, {required String title, String? name}) {
  AppSnackbar.cartAdded(
    context,
    title: title,
    productName: name,
    viewCartLabel: s.advisorViewCart,
    onViewCart: () => openCartTab(context, ProviderScope.containerOf(context, listen: false)),
  );
}

/// إضافة منتج واحد من بطاقة الترشيح. ذات الدرجات تفتح ورقة الدرجات فوق المحادثة
/// (الورقة نفسها تُظهر إشعار الإضافة) — لا مغادرة للمحادثة.
Future<AdvisorAddResult> advisorAddToCart(BuildContext context, WidgetRef ref, AdvisorProduct p) async {
  final s = ref.read(stringsProvider);
  try {
    final product = await _fetch(ref, p);
    if (!context.mounted) return AdvisorAddResult.failed;
    final r = _addLoaded(ref, product);
    switch (r) {
      case AdvisorAddResult.added:
        HapticFeedback.mediumImpact();
        _showAdded(context, s, title: s.advisorAdded, name: product.localizedName(s.lang));
      case AdvisorAddResult.needsShade:
        final ok = await showQuickShadeSheet(context, ref, product);
        return ok ? AdvisorAddResult.added : AdvisorAddResult.needsShade;
      case AdvisorAddResult.maxReached:
        HapticFeedback.heavyImpact();
        AppSnackbar.show(context, s.maxStockReached);
      case AdvisorAddResult.unavailable:
        AppSnackbar.show(context, s.advisorSoldOut);
      case AdvisorAddResult.failed:
        break;
    }
    return r;
  } catch (e) {
    if (context.mounted) AppSnackbar.error(context, ref.friendly(e));
    return AdvisorAddResult.failed;
  }
}

/// إضافة الروتين كاملاً: تُضاف المنتجات الجاهزة أولاً، ثم تُفتح ورقة الدرجات لكل منتج
/// يحتاج درجة بالتتابع. إغلاق ورقة يوقف البقية ويذكّرها بأسمائها.
/// تعيد عدد المنتجات المضافة فعلاً (ما بلغ حد المخزون لا يُعدّ).
Future<int> advisorAddRoutine(BuildContext context, WidgetRef ref, List<AdvisorProduct> items) async {
  final s = ref.read(stringsProvider);
  final results = await Future.wait(items.map((p) async {
    try {
      return (p, await _fetch(ref, p));
    } catch (_) {
      return (p, null);
    }
  }));
  if (!context.mounted) return 0;
  var added = 0;
  var maxed = 0;
  final needShade = <(AdvisorProduct, Product)>[];
  for (final (p, product) in results) {
    if (product == null) continue;
    switch (_addLoaded(ref, product)) {
      case AdvisorAddResult.added:
        added++;
      case AdvisorAddResult.needsShade:
        needShade.add((p, product));
      case AdvisorAddResult.maxReached:
        maxed++;
      case AdvisorAddResult.unavailable || AdvisorAddResult.failed:
        break;
    }
  }
  if (added > 0) HapticFeedback.mediumImpact();

  // ورقة الدرجات لكل منتج بالدور — المحادثة تبقى خلفها.
  final skipped = <AdvisorProduct>[];
  for (var i = 0; i < needShade.length; i++) {
    if (!context.mounted) return added;
    final ok = await showQuickShadeSheet(context, ref, needShade[i].$2);
    if (ok) {
      added++;
    } else {
      skipped.addAll(needShade.skip(i).map((e) => e.$1));
      break;
    }
  }
  if (!context.mounted) return added;

  final skippedNames = skipped.isEmpty
      ? null
      : s.advisorChooseShadeFor(skipped.map((e) => e.brand.isNotEmpty ? e.brand : e.name).join(s.isAr ? '، ' : ', '));
  if (added > 0) {
    _showAdded(
      context,
      s,
      title: added == items.length ? s.advisorRoutineAdded(added) : s.advisorAddedOf(added, items.length),
      name: skippedNames,
    );
  } else if (skipped.isNotEmpty) {
    AppSnackbar.show(context, skippedNames!);
  } else if (maxed > 0) {
    AppSnackbar.show(context, s.maxStockReached);
  } else {
    AppSnackbar.error(context, s.advisorAddFailed);
  }
  return added;
}
