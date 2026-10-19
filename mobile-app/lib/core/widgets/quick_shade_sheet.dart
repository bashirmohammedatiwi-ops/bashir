import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/product.dart';
import '../../features/cart/cart_provider.dart';
import '../../features/worlds/world_theme.dart';
import '../l10n/app_strings.dart';
import '../navigation/app_navigation.dart';
import '../navigation/product_nav.dart';
import '../theme/app_text.dart';
import 'app_network_image.dart';
import 'app_snackbar.dart';
import 'ds_strings.dart';
import 'ui/app_sheet.dart';
import 'ui/price_view.dart';

/// لون الدرجة من «#RGB» أو «#RRGGBB» أو «#AARRGGBB» — رمادي محايد إن تعذّرت القراءة.
Color shadeSwatchColor(String? hex, {Color fallback = const Color(0xFFCCCCCC)}) {
  var h = (hex ?? '').replaceAll('#', '').trim();
  if (h.length == 3) h = h.split('').map((c) => '$c$c').join();
  if (h.length == 6) h = 'FF$h';
  if (h.length != 8) return fallback;
  final v = int.tryParse(h, radix: 16);
  return v == null ? fallback : Color(v);
}

/// ورقة اختيار الدرجة السريعة — من البطاقة مباشرة دون فتح صفحة المنتج.
///
/// تُرسم فوراً من درجات البطاقة ([Product.displayableShades]) بلا أي طلب شبكة،
/// ثم تضيف الدرجة المختارة للسلة بالكمية [quantity]. يعيد true إن أُضيفت قطعة.
/// منتج بلا درجات معروضة يفتح صفحته بدلها (الصفحة تجلب الدرجات).
Future<bool> showQuickShadeSheet(
  BuildContext context,
  WidgetRef ref,
  Product product, {
  int quantity = 1,
}) async {
  final shades = product.displayableShades;
  if (shades.isEmpty) {
    openProduct(context, product);
    return false;
  }
  final s = ref.read(stringsProvider);
  // درجة واحدة متوفرة فقط: نختارها مسبقاً — لا خيار آخر يمكن شراؤه.
  final available = shades.where((x) => x.inStock).toList(growable: false);
  final picked = ValueNotifier<ProductShade?>(available.length == 1 ? available.first : null);
  try {
    final added = await showAppSheet<bool>(
      context: context,
      title: s.dsChooseShade,
      builder: (_) => _QuickShadeBody(product: product, picked: picked),
      footer: _QuickShadeFooter(product: product, picked: picked, quantity: quantity),
    );
    return added ?? false;
  } finally {
    picked.dispose();
  }
}

class _QuickShadeBody extends ConsumerWidget {
  final Product product;
  final ValueNotifier<ProductShade?> picked;

  const _QuickShadeBody({required this.product, required this.picked});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final shades = product.displayableShades;
    final inStock = shades.where((x) => x.inStock).length;
    final brand = product.brandLabel;

    return SingleChildScrollView(
      padding: const EdgeInsetsDirectional.fromSTEB(20, 4, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // صورة الدرجة المختارة إن وُجدت — وإلا صورة المنتج.
              ValueListenableBuilder<ProductShade?>(
                valueListenable: picked,
                builder: (_, shade, __) {
                  final thumb = shade?.image?.thumb ?? '';
                  return Container(
                    width: 56,
                    height: 56,
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: ProductCoverImage.wellColor,
                      borderRadius: BorderRadius.circular(AppCorners.sm),
                      border: Border.all(color: t.hairline),
                    ),
                    child: ProductCoverImage(
                      url: thumb.isNotEmpty ? thumb : product.coverUrl,
                      width: 48,
                      height: 48,
                    ),
                  );
                },
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (brand.isNotEmpty)
                      Text(
                        brand.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.micro.copyWith(color: t.accentDark),
                      ),
                    Text(
                      product.localizedName(s.lang),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.label.copyWith(color: t.ink, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            s.dsShadesInStock(inStock, shades.length),
            style: AppText.caption.copyWith(color: t.inkMuted, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
          ValueListenableBuilder<ProductShade?>(
            valueListenable: picked,
            builder: (_, selected, __) => Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final shade in shades)
                  _QuickShadeSwatch(
                    shade: shade,
                    selected: selected?.id == shade.id,
                    label: s.dsShadeOption(shade.name, soldOut: !shade.inStock),
                    onTap: shade.inStock
                        ? () {
                            HapticFeedback.selectionClick();
                            picked.value = shade;
                          }
                        : null,
                  ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () {
              Navigator.of(context).pop(false);
              openProduct(context, product);
            },
            style: TextButton.styleFrom(
              foregroundColor: t.accentDark,
              minimumSize: const Size(0, kMinTapTarget),
              padding: const EdgeInsetsDirectional.fromSTEB(4, 0, 8, 0),
              textStyle: AppText.label,
            ),
            // السهم ينعكس تلقائياً في العربية.
            icon: const Icon(Icons.arrow_forward_rounded, size: 18),
            iconAlignment: IconAlignment.end,
            label: Text(s.dsProductDetails),
          ),
        ],
      ),
    );
  }
}

/// دائرة درجة قابلة للاختيار (44 نقطة) — الدرجة النافدة باهتة ومشطوبة ومعطّلة.
class _QuickShadeSwatch extends StatelessWidget {
  final ProductShade shade;
  final bool selected;
  final String label;
  final VoidCallback? onTap;

  const _QuickShadeSwatch({
    required this.shade,
    required this.selected,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final soldOut = !shade.inStock;
    final start = shadeSwatchColor(shade.colorHex);
    final endHex = shade.colorHexEnd?.trim() ?? '';
    final end = endHex.isEmpty ? start : shadeSwatchColor(endHex, fallback: start);
    final still = MediaQuery.disableAnimationsOf(context);
    final mark = start.computeLuminance() > 0.6 ? t.ink : Colors.white;

    return Semantics(
      container: true,
      button: true,
      selected: selected,
      enabled: !soldOut,
      inMutuallyExclusiveGroup: true,
      label: label,
      child: Tooltip(
        message: shade.name,
        excludeFromSemantics: true,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onTap,
          child: AnimatedContainer(
            duration: still ? Duration.zero : const Duration(milliseconds: 160),
            curve: Curves.easeOutCubic,
            width: kMinTapTarget,
            height: kMinTapTarget,
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: selected ? t.accent : Colors.transparent,
                width: 2,
              ),
            ),
            child: Opacity(
              opacity: soldOut ? 0.4 : 1,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: start == end ? start : null,
                  gradient: start == end
                      ? null
                      : LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [start, end],
                        ),
                  // حلقة رفيعة — الدرجات الفاتحة لا تختفي على الخلفية البيضاء.
                  boxShadow: [BoxShadow(color: t.ink.withValues(alpha: 0.18), spreadRadius: 0.6)],
                ),
                child: soldOut
                    ? CustomPaint(painter: _StrikePainter(t.ink.withValues(alpha: 0.7)))
                    : selected
                        ? Icon(Icons.check_rounded, size: 18, color: mark)
                        : const SizedBox.expand(),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// خط مائل عبر الدائرة للدرجة النافدة.
class _StrikePainter extends CustomPainter {
  final Color color;
  const _StrikePainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final inset = size.width * 0.18;
    canvas.drawLine(
      Offset(size.width - inset, inset),
      Offset(inset, size.height - inset),
      Paint()
        ..color = color
        ..strokeWidth = 1.6
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_StrikePainter old) => old.color != color;
}

/// أسفل الورقة: الدرجة المختارة وسعرها + زر الإضافة.
class _QuickShadeFooter extends ConsumerWidget {
  final Product product;
  final ValueNotifier<ProductShade?> picked;
  final int quantity;

  const _QuickShadeFooter({
    required this.product,
    required this.picked,
    required this.quantity,
  });

  void _add(BuildContext context, AppStrings s, ProductShade shade) {
    final container = ProviderScope.containerOf(context, listen: false);
    final ok = container.read(cartProvider.notifier).add(product, shade: shade, quantity: quantity);
    Navigator.of(context).pop(ok);
    if (!ok) {
      HapticFeedback.heavyImpact();
      AppSnackbar.show(context, s.maxStockReached);
      return;
    }
    HapticFeedback.mediumImpact();
    AppSnackbar.cartAdded(
      context,
      title: s.addedToCart,
      productName: '${product.localizedName(s.lang)} — ${shade.name}',
      viewCartLabel: s.viewCart,
      // الورقة أُغلقت — نفتح السلة عبر الحاوية لا عبر سياق زال.
      onViewCart: () => openCartFromContainer(container),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    // الشاشات الضيقة: «أضيفي» بدل «أضيفي للسلة» حتى يبقى السعر ظاهراً كاملاً.
    final narrow = MediaQuery.sizeOf(context).width < 360;

    return ValueListenableBuilder<ProductShade?>(
      valueListenable: picked,
      builder: (context, shade, _) {
        // نفس قاعدة السلة: سعر الدرجة إن كان لها سعر خاص، وإلا سعر المنتج وخصمه.
        final price = shade?.price ?? product.price;
        final oldPrice = shade?.price == null && product.hasDiscount ? product.originalPrice : null;
        return Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      if (shade != null) ...[
                        Container(
                          width: 14,
                          height: 14,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: shadeSwatchColor(shade.colorHex),
                            boxShadow: [BoxShadow(color: t.ink.withValues(alpha: 0.18), spreadRadius: 0.6)],
                          ),
                        ),
                        const SizedBox(width: 6),
                      ],
                      Flexible(
                        // قبل الاختيار: عدد الدرجات (العنوان أعلاه يقول «اختاري الدرجة»).
                        child: Text(
                          shade?.name ?? s.dsShadesCount(product.displayableShades.length),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.caption.copyWith(
                            color: shade == null ? t.inkMuted : t.inkSoft,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  PriceView.compact(price: price, oldPrice: oldPrice),
                ],
              ),
            ),
            const SizedBox(width: 12),
            FilledButton.icon(
              onPressed: shade == null ? null : () => _add(context, s, shade),
              style: FilledButton.styleFrom(
                minimumSize: const Size(0, 48),
                padding: const EdgeInsets.symmetric(horizontal: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppCorners.md)),
                textStyle: AppText.label.copyWith(fontSize: 14),
              ),
              icon: const Icon(Icons.shopping_bag_outlined, size: 18),
              label: Text(narrow ? s.dsAdd : s.dsAddToCart, maxLines: 1),
            ),
          ],
        );
      },
    );
  }
}
