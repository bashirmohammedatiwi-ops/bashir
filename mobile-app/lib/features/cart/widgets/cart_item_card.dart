import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/utils/friendly_error.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/quick_shade_sheet.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/cart_item.dart';
import '../../../data/models/product.dart';
import '../../auth/auth_provider.dart';
import '../../wishlist/wishlist_provider.dart';
import '../../worlds/world_theme.dart';
import '../cart_provider.dart';
import '../cart_strings.dart';
import 'cart_theme.dart';

/// يحذف عنصراً من السلة مع إشعار "تراجع" يعيده لمكانه.
void removeCartItemWithUndo(BuildContext context, WidgetRef ref, CartItem item) {
  final s = ref.read(stringsProvider);
  final lang = ref.read(languageCodeProvider);
  final notifier = ref.read(cartProvider.notifier);
  final index = ref.read(cartProvider).items.indexWhere((e) => e.key == item.key);
  HapticFeedback.mediumImpact();
  notifier.remove(item.key);
  AppSnackbar.action(
    context,
    message: s.itemRemoved(item.localizedName(lang)),
    actionLabel: s.undo,
    onAction: () {
      HapticFeedback.selectionClick();
      notifier.restore(item, index: index < 0 ? null : index);
    },
  );
}

/// «احفظيه لاحقاً»: ينقل المنتج للمفضلة ويخرجه من السلة (السلة للشراء الآن فقط).
Future<void> saveCartItemForLater(BuildContext context, WidgetRef ref, CartItem item) async {
  final s = ref.read(stringsProvider);
  if (!ref.read(authProvider).isAuthenticated) {
    AppSnackbar.show(context, s.signInToSaveForLater);
    // بعد الدخول نكمل الحفظ نفسه بدل أن تعيد اللمسة.
    await context.push('/login');
    if (!context.mounted || !ref.read(authProvider).isAuthenticated) return;
    // ربما حُذف السطر أثناء ذلك (سلة أخرى، تحقق) — لا نحفظ ما لم يعد هنا.
    if (!ref.read(cartProvider).items.any((e) => e.key == item.key)) return;
  }
  HapticFeedback.selectionClick();
  if (!ref.read(wishlistProvider).ids.contains(item.productId)) {
    try {
      // إضافة صريحة لا «قلب»: لا تُزيل منتجاً حُفظ من جهاز آخر. النسخة المختصرة بلا صور
      // تُستبدل بنسخة السيرفر الكاملة قبل أن تظهر في المفضلة.
      await ref
          .read(wishlistProvider.notifier)
          .setWished(
            Product.fromJson({
              'id': item.productId,
              'slug': item.productSlug ?? item.productId,
              'name': item.name,
              if (item.nameAr != null) 'nameAr': item.nameAr,
              if (item.nameEn != null) 'nameEn': item.nameEn,
              'price': item.price,
              'stock': item.stock,
            }),
            true,
          );
    } catch (e) {
      if (context.mounted) AppSnackbar.error(context, friendlyError(e, lang: s.lang));
      return;
    }
  }
  final notifier = ref.read(cartProvider.notifier);
  final index = ref.read(cartProvider).items.indexWhere((e) => e.key == item.key);
  notifier.remove(item.key);
  if (!context.mounted) return;
  // «تراجع» يعيده للسلة في مكانه (ويبقى في المفضلة).
  AppSnackbar.action(
    context,
    message: s.savedForLater,
    actionLabel: s.undo,
    onAction: () {
      HapticFeedback.selectionClick();
      notifier.restore(item, index: index < 0 ? null : index);
    },
  );
}

class CartItemCard extends ConsumerWidget {
  final CartItem item;

  const CartItemCard({super.key, required this.item});

  void _openProduct(BuildContext context) {
    HapticFeedback.selectionClick();
    context.push('/product/${item.routeId}');
  }

  void _onQuantity(BuildContext context, WidgetRef ref, int next) {
    final notifier = ref.read(cartProvider.notifier);
    if (next <= 0) {
      removeCartItemWithUndo(context, ref, item);
      return;
    }
    if (next > item.quantity) {
      final ok = notifier.increment(item.key);
      if (!ok && context.mounted) AppSnackbar.show(context, ref.read(stringsProvider).maxQtyReached);
    } else if (next < item.quantity) {
      notifier.decrement(item.key);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;
    final t = context.worldTheme;
    final displayName = item.localizedName(lang);
    final imageSize = Responsive.cartItemImageSize(context);
    // التحقق مع السيرفر: حُذف أو أُوقف أو نفد — يبقى ظاهراً ليعرف سبب غيابه، والإجراء الحذف.
    final unavailable = ref.watch(cartProvider.select((c) => c.isUnavailable(item.key)));
    final lowStock = !unavailable && item.stock > 0 && item.stock <= 5;

    return Dismissible(
      key: ValueKey('cart-${item.key}'),
      direction: DismissDirection.endToStart,
      dismissThresholds: const {DismissDirection.endToStart: 0.35},
      background: Container(
        alignment: AlignmentDirectional.centerEnd,
        padding: const EdgeInsetsDirectional.only(end: 24),
        decoration: BoxDecoration(color: AppColors.sale, borderRadius: BorderRadius.circular(CartTheme.radiusLg)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.delete_outline_rounded, color: Colors.white, size: 24),
            const SizedBox(height: 4),
            Text(s.removeItem, style: AppText.micro.copyWith(color: Colors.white)),
          ],
        ),
      ),
      onDismissed: (_) => removeCartItemWithUndo(context, ref, item),
      // الظل على حاوية خارجية: طبقة التموّج في Material تقصّ ما يخرج عن حدودها.
      child: DecoratedBox(
        decoration: CartTheme.cardDecoration(context),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(CartTheme.radiusLg),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () => _openProduct(context),
            child: Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(12, 6, 2, 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Opacity(
                      opacity: unavailable ? 0.45 : 1,
                      child: _Thumb(item: item, name: displayName, size: imageSize),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  displayName,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppText.bodySmall.copyWith(
                                    color: unavailable ? t.inkMuted : t.ink,
                                    fontWeight: FontWeight.w700,
                                    height: 1.4,
                                  ),
                                ),
                              ),
                            ),
                            // لمسة 44 كاملة لكل زر، بلا إزاحات تقصّ منطقة اللمس.
                            AppIconButton(
                              icon: Icons.favorite_border_rounded,
                              size: kMinTapTarget,
                              iconSize: 17,
                              outlined: false,
                              background: Colors.transparent,
                              color: t.inkMuted,
                              tooltip: s.saveForLater,
                              onTap: () => saveCartItemForLater(context, ref, item),
                            ),
                            AppIconButton(
                              icon: Icons.close_rounded,
                              size: kMinTapTarget,
                              iconSize: 17,
                              outlined: false,
                              background: Colors.transparent,
                              color: t.inkMuted,
                              tooltip: s.removeItem,
                              onTap: () => removeCartItemWithUndo(context, ref, item),
                            ),
                          ],
                        ),
                        if (item.shadeName != null || lowStock || unavailable) ...[
                          const SizedBox(height: 2),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              if (unavailable)
                                _MetaChip(
                                  icon: Icons.remove_shopping_cart_outlined,
                                  label: s.cartUnavailableLabel,
                                  color: AppColors.sale,
                                ),
                              if (item.shadeName != null) _ShadeChip(label: item.shadeName!, hex: item.shadeHex),
                              if (lowStock)
                                _MetaChip(
                                  icon: Icons.bolt_rounded,
                                  label: s.onlyLeftInStock(item.stock),
                                  color: AppColors.warning,
                                ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 10),
                        Padding(
                          padding: const EdgeInsetsDirectional.only(end: 8),
                          child: LayoutBuilder(
                            builder: (context, c) {
                              if (unavailable) {
                                return Align(
                                  alignment: AlignmentDirectional.centerStart,
                                  child: TextButton.icon(
                                    onPressed: () => removeCartItemWithUndo(context, ref, item),
                                    style: TextButton.styleFrom(
                                      foregroundColor: AppColors.sale,
                                      minimumSize: const Size(0, kMinTapTarget),
                                    ),
                                    icon: const Icon(Icons.delete_outline_rounded, size: 18),
                                    label: Text(s.removeItem),
                                  ),
                                );
                              }
                              final price = _PriceBlock(item: item);
                              final stepper = QuantityStepper(
                                quantity: item.quantity,
                                min: 0,
                                max: item.stock > 0 ? item.stock : null,
                                onChanged: (q) => _onQuantity(context, ref, q),
                              );
                              if (c.maxWidth < 220) {
                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [price, const SizedBox(height: 8), stepper],
                                );
                              }
                              return Row(
                                children: [
                                  Expanded(child: price),
                                  const SizedBox(width: 8),
                                  stepper,
                                ],
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Thumb extends StatelessWidget {
  final CartItem item;
  final String name;
  final double size;

  const _Thumb({required this.item, required this.name, required this.size});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: t.accentLight,
        borderRadius: BorderRadius.circular(AppCorners.md),
        border: Border.all(color: t.accentSoft),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppCorners.md - 1),
        child: item.imageUrl.isNotEmpty
            ? Padding(
                padding: const EdgeInsets.all(4),
                child: ProductCoverImage(url: item.imageUrl, fit: BoxFit.contain),
              )
            : Center(
                child: Text(
                  name.isNotEmpty ? name.characters.first : '?',
                  style: AppText.display.copyWith(color: t.accent),
                ),
              ),
      ),
    );
  }
}

class _PriceBlock extends ConsumerWidget {
  final CartItem item;
  const _PriceBlock({required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: AlignmentDirectional.centerStart,
          // سعر العرض وبجانبه الأصلي مشطوباً — الخصم يبقى ظاهراً في السلة.
          child: PriceView(price: item.lineTotal, oldPrice: item.hasDiscount ? item.lineOriginalTotal : null),
        ),
        if (item.quantity > 1)
          Text(
            ref.s.pricePerPiece(formatPrice(item.price, lang: ref.s.lang)),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppText.caption.copyWith(color: t.inkMuted),
          ),
      ],
    );
  }
}

/// الدرجة: نقطة بلونها الحقيقي (12px) — وأيقونة لوحة الألوان إن لم يُعرف اللون.
class _ShadeChip extends ConsumerWidget {
  final String label;
  final String? hex;
  const _ShadeChip({required this.label, this.hex});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final code = hex;
    return Semantics(
      label: ref.s.shadeLabel(label),
      excludeSemantics: true,
      child: _MetaChip(
        icon: Icons.palette_outlined,
        leading: code == null
            ? null
            : Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: shadeSwatchColor(code),
                  shape: BoxShape.circle,
                  // حدّ رفيع حتى لا تذوب الدرجات الفاتحة في خلفية الشريحة.
                  border: Border.all(color: t.ink.withValues(alpha: 0.18), width: 0.8),
                ),
              ),
        label: label,
        color: t.accentDark,
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  /// يحل محل [icon] (مثل نقطة لون الدرجة).
  final Widget? leading;

  const _MetaChip({required this.icon, required this.label, required this.color, this.leading});

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 180),
      padding: const EdgeInsetsDirectional.fromSTEB(6, 3, 9, 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(AppCorners.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          leading ?? Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.micro.copyWith(color: color),
            ),
          ),
        ],
      ),
    );
  }
}
