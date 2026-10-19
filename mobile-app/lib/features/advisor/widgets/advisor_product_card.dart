import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/brand/brand_logo.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/friendly_error.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/app_snackbar.dart';
import '../../../core/widgets/ds_strings.dart';
import '../../alerts/restock_watch_provider.dart';
import '../../auth/auth_provider.dart';
import '../../cart/cart_provider.dart';
import '../advisor_cart.dart';
import '../advisor_controller.dart';
import '../advisor_models.dart';
import '../advisor_strings.dart';
import 'advisor_product_sheet.dart';
import 'advisor_style.dart';
import 'stagger_in.dart';

const _cardWidth = 172.0;

/// ارتفاع البطاقة: الصورة والهوامش ثابتة (228)، والجزء النصي (84 عند الخط العادي) يكبر
/// مع خط النظام — حتى لا يُقصّ السعر وزر الإضافة بخط 1.25.
double advisorCardHeight(BuildContext context) => 228 + 84 * (MediaQuery.textScalerOf(context).scale(100) / 100);

/// شريط ترشيحات أفقي بعنوان صغير — البطاقات تظهر بتتابع.
class AdvisorProductRail extends ConsumerWidget {
  final String? title;
  final List<AdvisorProduct> products;
  final bool animate;
  final bool highlightFirst;

  const AdvisorProductRail({
    super.key,
    this.title,
    required this.products,
    this.animate = true,
    this.highlightFirst = true,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final h = advisorCardHeight(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(20, 0, 20, 10),
          child: Row(
            children: [
              const Icon(Icons.auto_awesome_rounded, size: 15, color: BrandColors.rose),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  title ?? s.advisorPicksForYou,
                  style: AdvisorStyle.text(size: 13.5, weight: FontWeight.w800, height: 1.3),
                ),
              ),
              if (products.length > 2)
                Text(
                  s.productsN(products.length),
                  style: AdvisorStyle.text(size: 11.5, weight: FontWeight.w600, color: AdvisorStyle.inkMuted, height: 1.3),
                ),
            ],
          ),
        ),
        SizedBox(
          height: h + 18,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 2, 16, 16),
            itemCount: products.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) => StaggerIn(
              index: i,
              animate: animate && i < 4,
              step: const Duration(milliseconds: 90),
              from: const Offset(-26, 0),
              fromScale: 0.94,
              child: AdvisorProductCard(
                product: products[i],
                best: highlightFirst && i == 0,
                animate: animate,
                height: h,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class AdvisorProductCard extends ConsumerWidget {
  final AdvisorProduct product;
  final bool best;
  final bool animate;
  /// يمرّره الشريط؛ وبدونه يُحسب بنفس المعادلة ([advisorCardHeight]).
  final double? height;
  const AdvisorProductCard({super.key, required this.product, this.best = false, this.animate = true, this.height});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = product;
    final s = ref.s;
    final k = MediaQuery.textScalerOf(context).scale(100) / 100;
    final h = height ?? advisorCardHeight(context);
    // بخط كبير يبقى سطر واحد للأسباب حتى يتسع السعر وزر الإضافة.
    final lines = k > 1.1 ? 1 : 2;
    final showRating = p.reviewCount > 0 && (lines > 1 || p.reasons.isEmpty);
    final reasons = p.reasons.take(showRating ? lines - 1 : lines);
    final selected = ref.watch(advisorProvider.select((s) => s.comparing.any((x) => x.id == p.id)));
    final still = MediaQuery.disableAnimationsOf(context);
    return SizedBox(
      width: _cardWidth,
      height: h,
      child: AnimatedContainer(
        duration: still ? Duration.zero : const Duration(milliseconds: 220),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: selected ? BrandColors.rose : (best ? AdvisorStyle.accentBorder : AdvisorStyle.glassBorder),
            width: selected ? 2 : (best ? 1.4 : 1),
          ),
          boxShadow: AdvisorStyle.shadow(best || selected ? 1.2 : 0.8),
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(22),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () {
              ref.read(advisorProvider.notifier).track('click', productId: p.id);
              openAdvisorProduct(context, p);
            },
            onLongPress: () => showAdvisorProductSheet(context, p, ref: ref),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ImageArea(product: p, best: best, animate: animate, selected: selected, s: s),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (p.brand.isNotEmpty)
                          Text(
                            p.brand,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AdvisorStyle.text(size: 10.5, weight: FontWeight.w800, color: BrandColors.orchid, height: 1.2)
                                .copyWith(letterSpacing: 0.6),
                          ),
                        const SizedBox(height: 3),
                        Text(
                          p.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AdvisorStyle.text(size: 12.8, weight: FontWeight.w600, height: 1.38),
                        ),
                        const SizedBox(height: 7),
                        for (final r in reasons) _Reason(text: r),
                        if (showRating) _Rating(rating: p.rating, count: p.reviewCount, s: s),
                        const Spacer(),
                        _PriceRow(product: p, s: s),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ImageArea extends StatelessWidget {
  final AdvisorProduct product;
  final bool best;
  final bool animate;
  final bool selected;
  final AppStrings s;
  const _ImageArea({required this.product, required this.best, required this.animate, required this.selected, required this.s});

  @override
  Widget build(BuildContext context) {
    final p = product;
    return SizedBox(
      height: 152,
      width: double.infinity,
      child: Stack(
        children: [
          Positioned.fill(
            child: ColoredBox(
              color: AdvisorStyle.surface,
              child: Opacity(
                opacity: p.inStock ? 1 : 0.45,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: AppNetworkImage(
                    url: p.image,
                    width: _cardWidth - 24,
                    fit: BoxFit.contain,
                    backgroundColor: AdvisorStyle.surface,
                  ),
                ),
              ),
            ),
          ),
          if (p.match > 0 || p.similarity != null)
            PositionedDirectional(
              top: 8,
              start: 8,
              child: Column(
                children: [
                  MatchRing(match: p.similarity ?? p.match, animate: animate),
                  if (p.similarity != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(s.isAr ? 'شبه' : 'Similar',
                          style: AdvisorStyle.text(size: 9.5, weight: FontWeight.w800, color: AdvisorStyle.inkMuted, height: 1)),
                    ),
                ],
              ),
            ),
          PositionedDirectional(
            top: 1,
            end: 1,
            child: _MoreButton(product: p, selected: selected, s: s),
          ),
          if (p.saving >= 1000)
            PositionedDirectional(
              top: 44,
              end: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(color: AdvisorStyle.successBg, borderRadius: BorderRadius.circular(10)),
                // بالآلاف مقرّباً للأسفل: 2,500 ← «أوفر ألفين» لا «3 ألف».
                child: Text(s.advisorSaving(p.saving ~/ 1000),
                    style: AdvisorStyle.text(size: 10, weight: FontWeight.w800, color: AdvisorStyle.successFg, height: 1.2)),
              ),
            ),
          if (best)
            PositionedDirectional(
              bottom: 8,
              start: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  gradient: AdvisorStyle.gradient,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: BrandColors.rose.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.workspace_premium_rounded, size: 12, color: Colors.white),
                    const SizedBox(width: 3),
                    Text(s.advisorBestForYou, style: AdvisorStyle.text(size: 10, weight: FontWeight.w800, color: Colors.white, height: 1.2)),
                  ],
                ),
              ),
            ),
          if (p.shadeCount > 1)
            PositionedDirectional(
              bottom: 8,
              end: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AdvisorStyle.glassBorder),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.palette_outlined, size: 11, color: AdvisorStyle.inkSoft),
                    const SizedBox(width: 3),
                    Text(s.advisorShadeCount(p.shadeCount),
                        style: AdvisorStyle.text(size: 10, weight: FontWeight.w700, color: AdvisorStyle.inkSoft, height: 1.2)),
                  ],
                ),
              ),
            ),
          if (!p.inStock)
            Positioned.fill(
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.ink.withValues(alpha: 0.75), borderRadius: BorderRadius.circular(20)),
                  child: Text(s.advisorSoldOutShort,
                      style: AdvisorStyle.text(size: 11, weight: FontWeight.w700, color: Colors.white, height: 1.2)),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _Reason extends StatelessWidget {
  final String text;
  const _Reason({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Row(
        children: [
          Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(color: BrandColors.rose.withValues(alpha: 0.10), shape: BoxShape.circle),
            alignment: Alignment.center,
            child: const Icon(Icons.check_rounded, size: 10, color: BrandColors.rose),
          ),
          const SizedBox(width: 5),
          Expanded(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AdvisorStyle.text(size: 11, weight: FontWeight.w600, color: AdvisorStyle.inkSoft, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }
}

/// «★ 4.6 (128)» — مكان السبب الثاني، بنفس ارتفاع سطره.
class _Rating extends StatelessWidget {
  final double rating;
  final int count;
  final AppStrings s;
  const _Rating({required this.rating, required this.count, required this.s});

  @override
  Widget build(BuildContext context) {
    final value = rating.toStringAsFixed(1);
    return Semantics(
      label: s.isAr ? 'التقييم $value من 5، $count مراجعة' : 'Rated $value of 5, $count reviews',
      excludeSemantics: true,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 3),
        child: Row(
          children: [
            const SizedBox(
              width: 14,
              child: Icon(Icons.star_rounded, size: 14, color: AppColors.star),
            ),
            const SizedBox(width: 5),
            Flexible(
              child: Directionality(
                textDirection: TextDirection.ltr,
                child: Text(
                  '$value ($count)',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AdvisorStyle.text(size: 10.5, weight: FontWeight.w700, color: AdvisorStyle.inkMuted, height: 1.4),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  final AdvisorProduct product;
  final AppStrings s;
  const _PriceRow({required this.product, required this.s});

  @override
  Widget build(BuildContext context) {
    final p = product;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (p.hasDiscount)
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        formatPrice(p.originalPrice, lang: s.lang),
                        maxLines: 1,
                        overflow: TextOverflow.fade,
                        softWrap: false,
                        style: AdvisorStyle.text(size: 10.5, color: AdvisorStyle.inkMuted, height: 1.2).copyWith(
                          decoration: TextDecoration.lineThrough,
                          decorationColor: AdvisorStyle.inkMuted,
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(formatDiscount(p.discountPercent),
                        style: AdvisorStyle.text(size: 10.5, weight: FontWeight.w800, color: AppColors.sale, height: 1.2)),
                  ],
                ),
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: AlignmentDirectional.centerStart,
                child: Text(
                  formatPrice(p.price, lang: s.lang),
                  style: AdvisorStyle.text(
                    size: 14,
                    weight: FontWeight.w800,
                    color: p.hasDiscount ? AppColors.sale : AdvisorStyle.ink,
                    height: 1.25,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (p.inStock) AdvisorAddButton(product: p) else AdvisorRestockButton(productId: p.id),
      ],
    );
  }
}

/// زر الإضافة: انتظار ثم علامة صح، ثم حقيبة ممتلئة بعدد ما في السلة من المنتج.
/// لمسة أخرى تزيد قطعة (أو تفتح ورقة الدرجات لذات الدرجات).
class AdvisorAddButton extends ConsumerStatefulWidget {
  final AdvisorProduct product;
  final double size;
  const AdvisorAddButton({super.key, required this.product, this.size = 36});

  @override
  ConsumerState<AdvisorAddButton> createState() => _AdvisorAddButtonState();
}

enum _AddState { idle, busy, done }

class _AdvisorAddButtonState extends ConsumerState<AdvisorAddButton> {
  _AddState _s = _AddState.idle;

  Future<void> _add() async {
    if (_s != _AddState.idle) return;
    HapticFeedback.selectionClick();
    setState(() => _s = _AddState.busy);
    final r = await advisorAddToCart(context, ref, widget.product);
    if (!mounted) return;
    // حد المخزون أو إلغاء ورقة الدرجات ليس إضافة — لا علامة صح ولا إشارة تعلّم.
    final added = r == AdvisorAddResult.added;
    if (added) ref.read(advisorProvider.notifier).track('cart', productId: widget.product.id);
    setState(() => _s = added ? _AddState.done : _AddState.idle);
    if (added) {
      await Future<void>.delayed(const Duration(milliseconds: 1600));
      if (mounted) setState(() => _s = _AddState.idle);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final id = widget.product.id;
    final inCart = ref.watch(cartProvider.select((c) => c.items.where((e) => e.productId == id).fold<int>(0, (a, e) => a + e.quantity)));
    final multiShade = widget.product.shadeCount > 1;
    final done = _s == _AddState.done;
    final filled = inCart > 0 && _s == _AddState.idle;
    final still = MediaQuery.disableAnimationsOf(context);
    final size = widget.size;
    final label = inCart > 0
        ? (s.isAr ? '${s.advisorAddProduct(widget.product.name)} — في السلة $inCart' : '${s.advisorAddProduct(widget.product.name)} — $inCart in bag')
        : s.advisorAddProduct(widget.product.name);
    return Semantics(
      button: true,
      enabled: _s == _AddState.idle,
      label: label,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: _add,
        child: SizedBox.square(
          dimension: size,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              AnimatedContainer(
                duration: still ? Duration.zero : const Duration(milliseconds: 260),
                curve: Curves.easeOutCubic,
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: done ? null : AdvisorStyle.gradient,
                  color: done ? AdvisorStyle.successFg : null,
                  boxShadow: [
                    BoxShadow(
                      color: (done ? AdvisorStyle.successFg : BrandColors.rose).withValues(alpha: 0.30),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: AnimatedSwitcher(
                  duration: still ? Duration.zero : const Duration(milliseconds: 220),
                  transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
                  child: switch (_s) {
                    _AddState.busy => const SizedBox(
                        key: ValueKey('busy'),
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      ),
                    _AddState.done => const Icon(Icons.check_rounded, key: ValueKey('done'), size: 20, color: Colors.white),
                    _AddState.idle => Icon(
                        filled
                            ? Icons.shopping_bag_rounded
                            : (multiShade ? Icons.palette_outlined : Icons.add_shopping_cart_rounded),
                        key: ValueKey(filled ? 'bag' : 'idle'),
                        size: 18,
                        color: Colors.white,
                      ),
                  },
                ),
              ),
              if (filled)
                PositionedDirectional(
                  top: -3,
                  end: -3,
                  child: Container(
                    constraints: const BoxConstraints(minWidth: 17),
                    height: 17,
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(9),
                      border: Border.all(color: BrandColors.rose, width: 1.2),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      inCart > 99 ? '99+' : '$inCart',
                      textScaler: TextScaler.noScaling,
                      style: AdvisorStyle.text(size: 9.5, weight: FontWeight.w800, color: BrandColors.rose, height: 1),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// جرس «نبّهيني عند توفره» للمنتج النافد — بدل زر الإضافة.
/// الضيفة تُرسل لتسجيل الدخول أولاً، ثم يُفعّل التنبيه إن لم يكن مفعّلاً من جهاز آخر.
class AdvisorRestockButton extends ConsumerWidget {
  final String productId;
  final double size;
  const AdvisorRestockButton({super.key, required this.productId, this.size = 36});

  Future<void> _toggle(BuildContext context, WidgetRef ref) async {
    HapticFeedback.lightImpact();
    final s = ref.read(stringsProvider);
    final willNotify = s.isAr ? 'راح أنبهكِ أول ما يتوفر 🔔' : 'I’ll let you know as soon as it’s back 🔔';
    // الحاوية لا العنصر: البطاقة قد يُعاد بناؤها أثناء صفحة الدخول.
    final container = ProviderScope.containerOf(context, listen: false);
    try {
      if (!container.read(authProvider).isAuthenticated) {
        await context.push('/login');
        if (!container.read(authProvider).isAuthenticated) return;
        await container.read(restockWatchProvider.notifier).load();
        if (container.read(restockWatchProvider).contains(productId)) {
          if (context.mounted) AppSnackbar.success(context, willNotify);
          return;
        }
      }
      final watching = await container.read(restockWatchProvider.notifier).toggle(productId);
      if (!context.mounted) return;
      if (watching) {
        AppSnackbar.success(context, willNotify);
      } else {
        AppSnackbar.show(context, s.dsRestockCancelled);
      }
    } catch (e) {
      if (context.mounted) AppSnackbar.error(context, friendlyError(e, lang: s.lang));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final watching = ref.watch(restockWatchProvider.select((w) => w.contains(productId)));
    final still = MediaQuery.disableAnimationsOf(context);
    return Semantics(
      button: true,
      toggled: watching,
      label: s.advisorNotifyRestock,
      excludeSemantics: true,
      child: Tooltip(
        message: s.advisorNotifyRestock,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => _toggle(context, ref),
          child: AnimatedContainer(
            duration: still ? Duration.zero : const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: watching ? AdvisorStyle.gradient : null,
              color: watching ? null : Colors.white,
              border: watching ? null : Border.all(color: AdvisorStyle.accentBorder),
              boxShadow: AdvisorStyle.shadow(watching ? 0.9 : 0.5),
            ),
            alignment: Alignment.center,
            child: Icon(
              watching ? Icons.notifications_active_rounded : Icons.notifications_none_rounded,
              size: size * 0.5,
              color: watching ? Colors.white : AdvisorStyle.accentText,
            ),
          ),
        ),
      ),
    );
  }
}

/// «⋯»: يفتح خيارات المنتج (ليش رشحته، يناسبني؟، بديل أرخص، قارني…).
/// الدائرة 30 للعين، ومساحة اللمس 44.
class _MoreButton extends ConsumerWidget {
  final AdvisorProduct product;
  final bool selected;
  final AppStrings s;
  const _MoreButton({required this.product, required this.selected, required this.s});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final still = MediaQuery.disableAnimationsOf(context);
    return Semantics(
      button: true,
      selected: selected,
      label: selected ? '${s.advisorProductOptions} — ${s.advisorInCompare}' : s.advisorProductOptions,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => showAdvisorProductSheet(context, product, ref: ref),
        child: SizedBox.square(
          dimension: kMinTapTarget,
          child: Center(
            child: AnimatedContainer(
              duration: still ? Duration.zero : const Duration(milliseconds: 200),
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? null : Colors.white.withValues(alpha: 0.94),
                gradient: selected ? AdvisorStyle.gradient : null,
                border: Border.all(color: selected ? Colors.transparent : AdvisorStyle.glassBorder),
              ),
              child: Icon(selected ? Icons.balance_rounded : Icons.more_horiz_rounded,
                  size: 17, color: selected ? Colors.white : AdvisorStyle.inkSoft),
            ),
          ),
        ),
      ),
    );
  }
}

/// حلقة نسبة الملاءمة — تمتلئ وتعدّ عند الظهور (ثابتة مع «تقليل الحركة»).
class MatchRing extends StatelessWidget {
  final int match;
  final bool animate;
  final double size;
  const MatchRing({super.key, required this.match, this.animate = true, this.size = 40});

  @override
  Widget build(BuildContext context) {
    final target = match.clamp(0, 100) / 100;
    final run = animate && !MediaQuery.disableAnimationsOf(context);
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: run ? 0 : target, end: target),
      duration: const Duration(milliseconds: 1100),
      curve: Curves.easeOutCubic,
      builder: (_, v, __) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [BoxShadow(color: BrandColors.orchid.withValues(alpha: 0.18), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: CustomPaint(
          painter: _RingPainter(v),
          child: Center(
            child: Directionality(
              textDirection: TextDirection.ltr,
              child: Text(
                '${(v * 100).round()}%',
                style: AdvisorStyle.text(size: size * 0.25, weight: FontWeight.w800, color: AdvisorStyle.accentText, height: 1),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double v;
  _RingPainter(this.v);

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = size.width * 0.085;
    final rect = Rect.fromLTWH(stroke, stroke, size.width - stroke * 2, size.height - stroke * 2);
    canvas.drawArc(
      rect,
      0,
      math.pi * 2,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..color = AdvisorStyle.tint,
    );
    if (v <= 0) return;
    canvas.drawArc(
      rect,
      -math.pi / 2,
      math.pi * 2 * v,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round
        ..shader = SweepGradient(
          colors: const [BrandColors.orchidLight, BrandColors.orchid, BrandColors.rose],
          stops: [0, v * 0.5, v],
          transform: const GradientRotation(-math.pi / 2),
        ).createShader(rect),
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.v != v;
}
