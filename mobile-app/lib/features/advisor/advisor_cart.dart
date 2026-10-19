import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/navigation/app_navigation.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../cart/cart_provider.dart';
import 'advisor_models.dart';

enum AdvisorAddResult { added, needsShade, unavailable, failed }

void openAdvisorProduct(BuildContext context, AdvisorProduct p) {
  HapticFeedback.selectionClick();
  context.push('/product/${p.route}');
}

Future<Product> _fetch(WidgetRef ref, AdvisorProduct p) => ref.read(apiServiceProvider).getProduct(p.route);

AdvisorAddResult _addLoaded(WidgetRef ref, Product product) {
  if (!product.inStock) return AdvisorAddResult.unavailable;
  if (product.hasMultipleDisplayableShades) return AdvisorAddResult.needsShade;
  ref.read(cartProvider.notifier).add(product, shade: product.soleDisplayableShade);
  return AdvisorAddResult.added;
}

void _showAdded(BuildContext context, {required String title, String? name}) {
  AppSnackbar.cartAdded(
    context,
    title: title,
    productName: name,
    viewCartLabel: 'عرض السلة',
    onViewCart: () => openCartTab(context, ProviderScope.containerOf(context, listen: false)),
  );
}

/// إضافة منتج واحد من بطاقة الترشيح. ذات الدرجات تفتح صفحتها لاختيار الدرجة.
Future<AdvisorAddResult> advisorAddToCart(BuildContext context, WidgetRef ref, AdvisorProduct p) async {
  try {
    final product = await _fetch(ref, p);
    if (!context.mounted) return AdvisorAddResult.failed;
    final r = _addLoaded(ref, product);
    switch (r) {
      case AdvisorAddResult.added:
        HapticFeedback.mediumImpact();
        _showAdded(context, title: 'أُضيف إلى السلة', name: product.name);
      case AdvisorAddResult.needsShade:
        AppSnackbar.show(context, 'اختاري الدرجة المناسبة لكِ 🎨');
        openAdvisorProduct(context, p);
      case AdvisorAddResult.unavailable:
        AppSnackbar.show(context, 'هذا المنتج نفد حالياً');
      case AdvisorAddResult.failed:
        break;
    }
    return r;
  } catch (e) {
    if (context.mounted) AppSnackbar.error(context, ref.friendly(e));
    return AdvisorAddResult.failed;
  }
}

/// إضافة الروتين كاملاً: تُضاف المنتجات الجاهزة، وما يحتاج درجة يُذكر بالاسم.
Future<int> advisorAddRoutine(BuildContext context, WidgetRef ref, List<AdvisorProduct> items) async {
  final results = await Future.wait(items.map((p) async {
    try {
      return (p, await _fetch(ref, p));
    } catch (_) {
      return (p, null);
    }
  }));
  if (!context.mounted) return 0;
  var added = 0;
  final needShade = <AdvisorProduct>[];
  for (final (p, product) in results) {
    if (product == null) continue;
    final r = _addLoaded(ref, product);
    if (r == AdvisorAddResult.added) added++;
    if (r == AdvisorAddResult.needsShade) needShade.add(p);
  }
  if (added > 0) {
    HapticFeedback.mediumImpact();
    _showAdded(
      context,
      title: added == items.length ? 'أُضيف الروتين كاملاً ($added منتجات)' : 'أُضيف $added من ${items.length} منتجات',
      name: needShade.isEmpty ? null : 'اختاري درجة: ${needShade.map((e) => e.brand.isNotEmpty ? e.brand : e.name).join('، ')}',
    );
  } else if (needShade.isNotEmpty) {
    AppSnackbar.show(context, 'منتجات الروتين تحتاج اختيار درجة — افتحيها من البطاقات');
  } else {
    AppSnackbar.error(context, 'تعذّرت الإضافة، حاولي مرة ثانية');
  }
  return added;
}
