import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/free_shipping_progress.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/horizontal_product_list.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/product.dart';
import '../../cart/cart_provider.dart';
import '../../catalog/catalog_providers.dart';
import '../../worlds/world_theme.dart';
import '../../worlds/worlds_provider.dart';

/// نصوص ورقة «أُضيف لسلتكِ».
extension _AddedSheetStringsX on AppStrings {
  String get addedToYourBag => isAr ? 'أُضيف لسلتكِ' : 'Added to your bag';
  String get goesWellWith => isAr ? 'يكمّل معه' : 'Goes well with it';
  String get checkoutNow => isAr ? 'إتمام الشراء' : 'Checkout';
  String bagWithCount(int n) => isAr ? 'السلة (\u2066$n\u2069)' : 'Bag ($n)';
}

/// بعد الإضافة للسلة: تأكيد واضح + كم يبقى للتوصيل المجاني + ما يكمّل المنتج،
/// وإتمام الشراء مباشرة (يُبقي صفحات التصفح خلفه) أو السلة أو متابعة التسوق.
///
/// [added]: ما أُضيف فعلاً إن كان أقل من [quantity] (حد المخزون) — هو ما يُعرض.
Future<void> showAddedToCartSheet(
  BuildContext context, {
  required Product product,
  required ProductShade? shade,
  required int quantity,
  required String lang,
  required VoidCallback onViewCart,
  int? added,
}) {
  final s = ProviderScope.containerOf(context, listen: false).read(stringsProvider);
  return showAppSheet<void>(
    context: context,
    title: s.addedToYourBag,
    footer: _AddedSheetActions(onViewCart: onViewCart),
    builder: (_) => _AddedSheet(
      product: product,
      shade: shade,
      quantity: added ?? quantity,
      lang: lang,
    ),
  );
}

class _AddedSheet extends ConsumerWidget {
  final Product product;
  final ProductShade? shade;
  final int quantity;
  final String lang;

  const _AddedSheet({
    required this.product,
    required this.shade,
    required this.quantity,
    required this.lang,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final s = ref.s;
    final cart = ref.watch(cartProvider);
    final unit = product.unitFor(shade);
    final image = shade?.image?.thumb ?? shade?.image?.full ?? product.coverUrl;
    final pairs = ref.watch(boughtTogetherProvider(product.id)).valueOrNull?.items.where((p) => p.id != product.id).toList() ?? const <Product>[];

    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // المنتج المضاف: صورة مع علامة التأكيد، اسم، الدرجة والكمية، السعر.
          Container(
            margin: const EdgeInsets.fromLTRB(18, 6, 18, 0),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: t.canvasWarm,
              borderRadius: BorderRadius.circular(AppCorners.lg),
              border: Border.all(color: t.hairline.withValues(alpha: 0.7)),
            ),
            child: Row(
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 58,
                      height: 58,
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(13)),
                      child: AppNetworkImage(url: image, fit: BoxFit.contain, radius: BorderRadius.circular(9)),
                    ),
                    PositionedDirectional(
                      top: -5,
                      end: -5,
                      child: Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          color: AppColors.success,
                          shape: BoxShape.circle,
                          border: Border.all(color: t.surface, width: 2),
                        ),
                        child: const Icon(Icons.check_rounded, color: Colors.white, size: 13),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.localizedName(lang),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.label.copyWith(color: t.ink, height: 1.35),
                      ),
                      const SizedBox(height: 4),
                      // كل جزء بعنصر مستقل: الأسماء اللاتينية والأرقام لا تختلط باتجاه النص.
                      Row(
                        children: [
                          if (shade != null && product.hasMultipleDisplayableShades) ...[
                            Flexible(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: t.accentLight,
                                  borderRadius: BorderRadius.circular(AppCorners.pill),
                                ),
                                child: Text(
                                  shade!.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppText.micro.copyWith(color: t.accentDark, fontWeight: FontWeight.w800),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                          ],
                          Text('×$quantity', style: AppText.caption.copyWith(color: t.inkMuted, fontWeight: FontWeight.w700)),
                          const Spacer(),
                          Text(
                            formatPrice(unit * quantity),
                            style: AppText.label.copyWith(color: t.ink, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 0),
            child: FreeShippingProgress(
              subtotal: cart.subtotal,
              threshold: ref.watch(storeSettingsProvider)?.freeShippingThreshold ?? 0,
              compact: true,
            ),
          ),
          if (pairs.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 10),
              child: Text(s.goesWellWith, style: AppText.title3.copyWith(color: t.ink)),
            ),
            HorizontalProductList(
              products: pairs.take(8).toList(),
              padding: EdgeInsets.symmetric(horizontal: Responsive.horizontalPadding(context)),
            ),
          ],
          const SizedBox(height: 14),
        ],
      ),
    );
  }
}

/// أزرار مثبّتة أسفل الورقة: إتمام الشراء بمجموع السلة، ثم السلة ومتابعة التسوق.
class _AddedSheetActions extends ConsumerWidget {
  final VoidCallback onViewCart;
  const _AddedSheetActions({required this.onViewCart});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final s = ref.s;
    final cart = ref.watch(cartProvider);

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        DecoratedBox(
          decoration: BoxDecoration(gradient: t.signatureGradient, borderRadius: BorderRadius.circular(AppCorners.pill)),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(AppCorners.pill),
              onTap: () {
                // الدفع فوق الصفحة الحالية: الرجوع من الدفع يعيدها لنفس المنتج والقائمة.
                final router = GoRouter.of(context);
                Navigator.of(context).pop();
                router.push('/checkout');
              },
              child: SizedBox(
                height: 50,
                child: Center(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        '${s.checkoutNow}  •  ${formatPrice(cart.subtotal)}',
                        style: AppText.label.copyWith(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  onViewCart();
                },
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(kMinTapTarget),
                  side: BorderSide(color: t.accentSoft),
                  shape: const StadiumBorder(),
                  foregroundColor: t.accentDark,
                ),
                child: Text(s.bagWithCount(cart.count), style: AppText.label.copyWith(fontWeight: FontWeight.w800)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextButton(
                onPressed: () => Navigator.of(context).pop(),
                style: TextButton.styleFrom(
                  minimumSize: const Size.fromHeight(kMinTapTarget),
                  shape: const StadiumBorder(),
                  foregroundColor: t.inkSoft,
                ),
                child: Text(s.continueShopping, style: AppText.label.copyWith(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
