import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/free_shipping_progress.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/horizontal_product_list.dart';
import '../../../data/models/product.dart';
import '../../cart/cart_provider.dart';
import '../../catalog/catalog_providers.dart';
import '../../worlds/world_theme.dart';
import '../../worlds/worlds_provider.dart';

/// بعد الإضافة للسلة: تأكيد واضح + كم يبقى للتوصيل المجاني + ما يكمّل المنتج،
/// وزرّان: متابعة التسوق أو عرض السلة.
Future<void> showAddedToCartSheet(
  BuildContext context, {
  required Product product,
  required ProductShade? shade,
  required int quantity,
  required String lang,
  required VoidCallback onViewCart,
}) {
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: false,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _AddedSheet(product: product, shade: shade, quantity: quantity, lang: lang, onViewCart: onViewCart),
  );
}

class _AddedSheet extends ConsumerWidget {
  final Product product;
  final ProductShade? shade;
  final int quantity;
  final String lang;
  final VoidCallback onViewCart;

  const _AddedSheet({
    required this.product,
    required this.shade,
    required this.quantity,
    required this.lang,
    required this.onViewCart,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final ar = ref.s.isAr;
    final cart = ref.watch(cartProvider);
    final unit = shade?.price ?? product.price;
    final image = shade?.image?.thumb ?? shade?.image?.full ?? product.coverUrl;
    final pairs = ref.watch(boughtTogetherProvider(product.id)).valueOrNull?.items.where((p) => p.id != product.id).toList() ?? const <Product>[];

    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.86),
      child: Container(
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 10),
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  decoration: BoxDecoration(color: t.hairline, borderRadius: BorderRadius.circular(99)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 0),
                child: Row(
                  children: [
                    Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.12), shape: BoxShape.circle),
                      child: const Icon(Icons.check_rounded, color: AppColors.success, size: 19),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        ar ? 'أُضيف لسلتكِ' : 'Added to your bag',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: t.ink),
                      ),
                    ),
                  ],
                ),
              ),
              // المنتج المضاف: صورة، اسم، الدرجة والكمية، السعر.
              Container(
                margin: const EdgeInsets.fromLTRB(18, 14, 18, 0),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: t.canvasWarm,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: t.hairline.withValues(alpha: 0.7)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 58,
                      height: 58,
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(13)),
                      child: AppNetworkImage(url: image, fit: BoxFit.contain, radius: BorderRadius.circular(9)),
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
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: t.ink, height: 1.35),
                          ),
                          const SizedBox(height: 4),
                          // كل جزء بعنصر مستقل: الأسماء اللاتينية والأرقام لا تختلط باتجاه النص.
                          Row(
                            children: [
                              if (shade != null && product.hasMultipleDisplayableShades) ...[
                                Flexible(
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                    decoration: BoxDecoration(color: t.accentLight, borderRadius: BorderRadius.circular(99)),
                                    child: Text(
                                      shade!.name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: t.accentDark),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                              ],
                              Text('×$quantity', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: t.inkMuted)),
                              const Spacer(),
                              Text(formatPrice(unit * quantity),
                                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: t.ink)),
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
                  child: Text(
                    ar ? 'يكمّل معه' : 'Goes well with it',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: t.ink),
                  ),
                ),
                HorizontalProductList(
                  products: pairs.take(8).toList(),
                  padding: EdgeInsets.symmetric(horizontal: Responsive.horizontalPadding(context)),
                ),
              ] else
                const SizedBox(height: 18),
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 4, 18, 16),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(50),
                          side: BorderSide(color: t.accentSoft),
                          shape: const StadiumBorder(),
                          foregroundColor: t.accentDark,
                        ),
                        child: Text(ar ? 'متابعة التسوق' : 'Keep shopping',
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DecoratedBox(
                        decoration: BoxDecoration(gradient: t.signatureGradient, borderRadius: BorderRadius.circular(999)),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(999),
                            onTap: () {
                              Navigator.of(context).pop();
                              onViewCart();
                            },
                            child: SizedBox(
                              height: 50,
                              child: Center(
                                child: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 10),
                                    child: Text(
                                      ar
                                          ? 'السلة (${cart.count})  •  ${formatPrice(cart.subtotal)}'
                                          : 'Bag (${cart.count})  •  ${formatPrice(cart.subtotal)}',
                                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: Colors.white),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
