import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/locale_provider.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../data/models/product.dart';
import '../../cart/cart_provider.dart';
import '../assistant_models.dart';

/// بطاقة منتج داخل فقاعة فضه: خطوة الروتين، السعر، وإضافة للسلة مباشرة.
class AssistantProductCard extends ConsumerWidget {
  final Product product;
  final AssistantStep? step;
  final VoidCallback? onOpen;
  final VoidCallback? onCarted;

  const AssistantProductCard({super.key, required this.product, this.step, this.onOpen, this.onCarted});

  bool get _needsShade => product.hasDisplayableShades || product.shadeCount > 1;

  void _open(BuildContext context) {
    onOpen?.call();
    context.push('/product/${product.slug.isNotEmpty ? product.slug : product.id}');
  }

  void _add(BuildContext context, WidgetRef ref, bool isAr) {
    if (_needsShade) {
      _open(context);
      return;
    }
    HapticFeedback.lightImpact();
    final added = ref.read(cartProvider.notifier).add(product, shade: product.soleDisplayableShade);
    if (!added) {
      AppSnackbar.error(context, isAr ? 'وصلتي للكمية المتوفرة' : 'You reached the available stock');
      return;
    }
    onCarted?.call();
    AppSnackbar.cartAdded(
      context,
      title: isAr ? 'انضاف للسلة' : 'Added to cart',
      viewCartLabel: isAr ? 'السلة' : 'Cart',
      onViewCart: () => openCartTab(context, ProviderScope.containerOf(context, listen: false)),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final isAr = lang == 'ar';
    final name = product.localizedName(lang);
    final brand = product.brand?.localizedName(lang) ?? '';
    final hasDiscount = product.discountPercent > 0;
    final inCart = ref.watch(cartProvider.select((cart) => cart.items.any((item) => item.productId == product.id)));

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _open(context),
        child: Ink(
          width: 172,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: step != null ? AppColors.primary.withValues(alpha: 0.28) : AppColors.hairline.withValues(alpha: 0.85)),
            boxShadow: AppColors.cardShadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AspectRatio(
                aspectRatio: 1.08,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    AppNetworkImage(url: product.coverUrl, fit: BoxFit.cover, backgroundColor: AppColors.blush),
                    if (step != null)
                      PositionedDirectional(
                        top: 8,
                        start: 8,
                        child: _Pill(
                          text: '${step!.index} · ${step!.label}',
                          background: AppColors.ink,
                          foreground: Colors.white,
                        ),
                      )
                    else if (product.isBestSeller)
                      PositionedDirectional(
                        top: 8,
                        start: 8,
                        child: _Pill(text: isAr ? 'الأكثر مبيعاً' : 'Best seller', background: AppColors.ink, foreground: Colors.white),
                      ),
                    if (hasDiscount)
                      PositionedDirectional(
                        top: 8,
                        end: 8,
                        child: _Pill(text: '-${product.discountPercent}%', background: AppColors.primary, foreground: Colors.white),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(11, 9, 11, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (brand.isNotEmpty)
                      Text(
                        brand,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: AppColors.primary.withValues(alpha: 0.9)),
                      ),
                    const SizedBox(height: 2),
                    SizedBox(
                      height: 32,
                      child: Text(
                        name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12.5, height: 1.25, fontWeight: FontWeight.w800, color: AppColors.ink),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (hasDiscount)
                                Text(
                                  formatPrice(product.originalPrice),
                                  style: TextStyle(
                                    fontSize: 10,
                                    decoration: TextDecoration.lineThrough,
                                    color: AppColors.ink.withValues(alpha: 0.38),
                                  ),
                                ),
                              Text(
                                formatPrice(product.price),
                                style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w900, color: AppColors.ink),
                              ),
                            ],
                          ),
                        ),
                        _CartButton(
                          enabled: product.inStock,
                          inCart: inCart,
                          needsShade: _needsShade,
                          onTap: () => _add(context, ref, isAr),
                        ),
                      ],
                    ),
                    if (!product.inStock)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          isAr ? 'نفد حالياً' : 'Out of stock',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.sale),
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

class _Pill extends StatelessWidget {
  final String text;
  final Color background;
  final Color foreground;
  const _Pill({required this.text, required this.background, required this.foreground});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(99)),
      child: Text(text, style: TextStyle(color: foreground, fontSize: 10, fontWeight: FontWeight.w800)),
    );
  }
}

class _CartButton extends StatelessWidget {
  final bool enabled;
  final bool inCart;
  final bool needsShade;
  final VoidCallback onTap;
  const _CartButton({required this.enabled, required this.inCart, required this.needsShade, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final icon = needsShade
        ? Icons.palette_outlined
        : inCart
            ? Icons.check_rounded
            : Icons.add_shopping_cart_rounded;
    return Material(
      color: !enabled
          ? AppColors.elevated
          : inCart
              ? AppColors.success
              : AppColors.primary,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: enabled ? onTap : null,
        child: SizedBox(
          width: 36,
          height: 36,
          child: Icon(icon, size: 18, color: enabled ? Colors.white : AppColors.textMuted),
        ),
      ),
    );
  }
}
