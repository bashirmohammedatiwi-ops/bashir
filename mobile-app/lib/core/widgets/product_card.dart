import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product.dart';
import '../../features/alerts/restock_watch_provider.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/brands/brand_search.dart';
import '../../features/worlds/world_theme.dart';
import '../l10n/app_strings.dart';
import '../navigation/product_nav.dart';
import '../theme/app_colors.dart';
import '../theme/app_shadows.dart';
import '../theme/app_text.dart';
import '../utils/formatters.dart';
import '../utils/friendly_error.dart';
import 'app_network_image.dart';
import 'app_snackbar.dart';
import 'ds_strings.dart';
import 'product_card_actions.dart';
import 'quick_shade_sheet.dart';
import 'ui/price_view.dart';

/// كان هناك أسلوبان مختلفان؛ الآن تصميم واحد موحّد لكل التطبيق.
/// يبقى الـ enum للتوافق مع الاستدعاءات القديمة.
enum ProductCardStyle { standard, listing }

/// بطاقة المنتج الموحّدة:
/// صورة داخل إطار ناعم + شارة خصم/جديد + قلب + زر سلة (أو جرس توفّر للنافد)،
/// ثم البراند، الاسم (سطران ثابتان)، التقييم، السعر، ودرجات الألوان.
class ProductCard extends ConsumerWidget {
  final Product product;
  final double? width;
  final bool showPromoBadge;
  final bool showRating;
  final bool lite;
  final ProductCardStyle style;

  const ProductCard({
    super.key,
    required this.product,
    this.width,
    this.showPromoBadge = false,
    this.showRating = false,
    this.lite = false,
    this.style = ProductCardStyle.standard,
  });

  static const radius = AppCorners.lg;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final s = ref.s;
    final name = product.localizedName(s.lang);
    final brand = product.brandLabel;
    // البراند والاسم مستبعدان من القراءة داخل البطاقة — الوصف هنا يجمعهما مع السعر مرة واحدة.
    final spokenName = brand.isNotEmpty && !name.toLowerCase().contains(brand.toLowerCase())
        ? '$brand $name'
        : name;

    return Semantics(
      button: true,
      label: s.dsProductSemantics(
        spokenName,
        formatPrice(product.price),
        !product.inStock,
        product.hasDiscount ? product.discountPercent : 0,
      ),
      child: _PressScale(
        width: width,
        radius: radius,
        color: t.surface,
        shadows: AppShadows.card(t),
        splashColor: t.accent.withValues(alpha: 0.06),
        highlightColor: t.accent.withValues(alpha: 0.06),
        onTap: () => openProduct(context, product),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: _CardImage(
                product: product,
                showPromoBadge: showPromoBadge,
                lite: lite,
              ),
            ),
            _CardInfo(product: product, showRating: showRating),
          ],
        ),
      ),
    );
  }
}

/// ضغطة البطاقة: انكماش خفيف (0.97) مع تموّج — إحساس فوري بأن اللمسة وصلت
/// حتى قبل ظهور الصفحة التالية. بلا حركة عند تفعيل «تقليل الحركة».
class _PressScale extends StatefulWidget {
  final double? width;
  final double radius;
  final Color color;
  final List<BoxShadow> shadows;
  final Color splashColor;
  final Color highlightColor;
  final VoidCallback onTap;
  final Widget child;

  const _PressScale({
    required this.width,
    required this.radius,
    required this.color,
    required this.shadows,
    required this.splashColor,
    required this.highlightColor,
    required this.onTap,
    required this.child,
  });

  @override
  State<_PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<_PressScale> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    final still = MediaQuery.disableAnimationsOf(context);
    final r = BorderRadius.circular(widget.radius);
    return AnimatedScale(
      scale: _down && !still ? 0.97 : 1,
      duration: const Duration(milliseconds: 110),
      curve: Curves.easeOut,
      // الظل على حاوية خارجية — طبقة التموّج في Material تقصّ ما يخرج عن حدودها.
      child: Container(
        width: widget.width,
        decoration: BoxDecoration(
          color: widget.color,
          borderRadius: r,
          boxShadow: widget.shadows,
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: r,
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: widget.onTap,
            onHighlightChanged: (v) {
              if (v != _down) setState(() => _down = v);
            },
            borderRadius: r,
            splashColor: widget.splashColor,
            highlightColor: widget.highlightColor,
            child: SizedBox(width: widget.width, child: widget.child),
          ),
        ),
      ),
    );
  }
}

class _CardImage extends ConsumerWidget {
  final Product product;
  final bool showPromoBadge;
  final bool lite;

  const _CardImage({
    required this.product,
    required this.showPromoBadge,
    required this.lite,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    // الخصم يُقرأ ضمن وصف البطاقة؛ «جديد» و«عرض» يُقرآن كما هما.
    final Widget? badge = product.hasDiscount
        ? ExcludeSemantics(
            child: DiscountBadge(percent: product.discountPercent, small: true),
          )
        : product.isNew
        ? LabelBadge(label: s.newBadge, color: t.ink, small: true)
        : (showPromoBadge && product.isPromo)
        ? LabelBadge(label: s.offerBadge, color: t.accent, small: true)
        : null;

    return Padding(
      padding: const EdgeInsets.fromLTRB(6, 6, 6, 0),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // إطار الصورة: خلفية دافئة خفيفة تجعل صور المنتجات البيضاء تبدو أنيقة.
          DecoratedBox(
            decoration: BoxDecoration(
              // أبيض مثل خلفيات صور المنتجات — لا مربعات ظاهرة حول الصورة.
              color: Colors.white,
              borderRadius: BorderRadius.circular(ProductCard.radius - 5),
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 14, 12, 12),
              child: LayoutBuilder(
                builder: (context, c) => Opacity(
                  opacity: product.inStock ? 1 : 0.45,
                  child: ProductCoverImage(
                    url: product.coverUrl,
                    width: c.maxWidth,
                    height: c.maxHeight,
                    fit: BoxFit.contain,
                    filterQuality: lite
                        ? FilterQuality.low
                        : FilterQuality.medium,
                  ),
                ),
              ),
            ),
          ),
          if (badge != null)
            PositionedDirectional(top: 8, start: 8, child: badge),
          // الأزرار على الحافة تماماً: مساحة لمسها 44 والشكل المرئي في منتصفها.
          PositionedDirectional(
            top: 0,
            end: 0,
            child: RepaintBoundary(
              child: ProductCardWishButton(product: product, size: 32),
            ),
          ),
          if (!product.inStock) ...[
            Center(
              child: ExcludeSemantics(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: t.ink.withValues(alpha: 0.82),
                    borderRadius: BorderRadius.circular(AppCorners.pill),
                  ),
                  child: Text(
                    s.soldOut,
                    style: AppText.micro.copyWith(color: Colors.white),
                  ),
                ),
              ),
            ),
            PositionedDirectional(
              end: 0,
              bottom: 0,
              child: _RestockBellButton(product: product),
            ),
          ] else
            PositionedDirectional(
              end: 0,
              bottom: 0,
              child: ProductCardCartControl(product: product, compact: true),
            ),
        ],
      ),
    );
  }
}

/// جرس «نبّهيني عند التوفّر» على بطاقة المنتج النافد — بدل زر السلة.
class _RestockBellButton extends ConsumerWidget {
  final Product product;

  const _RestockBellButton({required this.product});

  static const _side = 34.0;

  Future<void> _toggle(BuildContext context, WidgetRef ref) async {
    HapticFeedback.lightImpact();
    final s = ref.read(stringsProvider);
    final id = product.id;
    // الحاوية لا العنصر: البطاقة قد تُعاد بناؤها أثناء صفحة الدخول.
    final container = ProviderScope.containerOf(context, listen: false);
    try {
      if (!container.read(authProvider).isAuthenticated) {
        await context.push('/login');
        if (!container.read(authProvider).isAuthenticated) return;
        // حساب جديد: نجلب تنبيهاته أولاً — قد يكون طلب التنبيه سابقاً من جهاز آخر.
        await container.read(restockWatchProvider.notifier).load();
        if (container.read(restockWatchProvider).contains(id)) {
          if (context.mounted) AppSnackbar.success(context, s.dsRestockWillNotify);
          return;
        }
      }
      final watching = await container.read(restockWatchProvider.notifier).toggle(id);
      if (!context.mounted) return;
      if (watching) {
        AppSnackbar.success(context, s.dsRestockWillNotify);
      } else {
        AppSnackbar.show(context, s.dsRestockCancelled);
      }
    } catch (e) {
      if (context.mounted) AppSnackbar.error(context, friendlyError(e, lang: s.lang));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final s = ref.s;
    final still = MediaQuery.disableAnimationsOf(context);
    final watching = ref.watch(
      restockWatchProvider.select((w) => w.contains(product.id)),
    );

    return Semantics(
      container: true,
      button: true,
      toggled: watching,
      label: s.dsNotifyMe,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => _toggle(context, ref),
        child: SizedBox.square(
          dimension: math.max(kMinTapTarget, _side),
          child: Center(
            child: AnimatedContainer(
              duration: still ? Duration.zero : const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              width: _side,
              height: _side,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: watching ? t.accent : t.surface,
                border: Border.all(
                  color: watching ? t.accent : t.hairline.withValues(alpha: 0.9),
                ),
                boxShadow: watching ? AppShadows.floating(t) : AppShadows.raised(t),
              ),
              child: AnimatedSwitcher(
                duration: still ? Duration.zero : const Duration(milliseconds: 220),
                transitionBuilder: (child, a) => ScaleTransition(
                  scale: Tween(begin: 0.6, end: 1.0).animate(
                    CurvedAnimation(parent: a, curve: Curves.easeOutBack),
                  ),
                  child: child,
                ),
                child: Icon(
                  watching
                      ? Icons.notifications_active_rounded
                      : Icons.notifications_none_rounded,
                  key: ValueKey(watching),
                  size: _side * 0.5,
                  color: watching ? Colors.white : t.accentDark,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

final _arabicLetters = RegExp('[\u0600-\u06FF]');

class _CardInfo extends ConsumerWidget {
  final Product product;
  final bool showRating;

  const _CardInfo({required this.product, required this.showRating});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(stringsProvider.select((s) => s.lang));
    final t = context.worldTheme;
    final brand = product.brandLabel;
    final hasShades = product.hasDisplayableShades || product.shadeCount > 1;
    // صندوقا البراند والاسم يكبران مع خط النظام (حتى 1.25) — لا قصّ لنزول الحروف العربية.
    // الصورة (Expanded) تمتص الفرق، فتبقى البطاقات في الصف متحاذية بأي حجم خط.
    final sc = MediaQuery.textScalerOf(context);
    final brandBox = (sc.scale(10.5) * 1.2).ceilToDouble() + 1;
    final nameBox = (sc.scale(12.5) * 1.32 * 2).ceilToDouble() + 1;

    return Padding(
      padding: const EdgeInsets.fromLTRB(11, 9, 11, 11),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ExcludeSemantics(
            child: SizedBox(
              height: brandBox,
              child: Text(
                brand.toUpperCase(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.micro.copyWith(
                  fontSize: 10.5,
                  color: t.accentDark,
                  // تباعد خفيف للاسم اللاتيني فقط — أي تباعد يقطع وصل الحروف العربية.
                  letterSpacing: _arabicLetters.hasMatch(brand) ? 0 : 0.3,
                ),
              ),
            ),
          ),
          const SizedBox(height: 3),
          // ارتفاع ثابت لسطرين — كل البطاقات في الصف بنفس المحاذاة.
          ExcludeSemantics(
            child: SizedBox(
              height: nameBox,
              child: Text(
                stripBrandPrefix(product.localizedName(lang), product.brand?.name),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppText.bodySmall.copyWith(
                  fontSize: 12.5,
                  height: 1.32,
                  fontWeight: FontWeight.w600,
                  color: t.ink,
                ),
              ),
            ),
          ),
          if (showRating && product.rating > 0) ...[
            const SizedBox(height: 5),
            Row(
              children: [
                const Icon(Icons.star_rounded, size: 13, color: AppColors.star),
                const SizedBox(width: 2),
                Text(
                  product.rating.toStringAsFixed(1),
                  style: AppText.micro.copyWith(color: t.inkSoft),
                ),
                if (product.reviewCount > 0)
                  // العدد يُختصر قبل أن يدفع الصف خارج البطاقة الضيقة بخط كبير.
                  Flexible(
                    child: Text(
                      ' (${product.reviewCount})',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.micro.copyWith(
                        color: t.inkMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
              ],
            ),
          ],
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // السعر الحالي بارزاً والقديم بجانبه صغيراً — سطر واحد أنظف.
              // يُقرأ ضمن وصف البطاقة، فلا يتكرر هنا.
              Expanded(
                child: ExcludeSemantics(
                  child: PriceView.compact(
                    price: product.price,
                    oldPrice: product.hasDiscount ? product.originalPrice : null,
                  ),
                ),
              ),
              if (hasShades) ...[
                const SizedBox(width: 6),
                ProductShadeSwatchRow(
                  shades: product.shades,
                  shadeCount: product.shadeCount,
                  max: 5,
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

/// نقاط درجات الألوان (مكياج) — حتى [max] نقاط ثم "+N".
class ProductShadeSwatchRow extends StatelessWidget {
  final List<ProductShade> shades;
  final int shadeCount;
  final int max;

  const ProductShadeSwatchRow({
    super.key,
    required this.shades,
    this.shadeCount = 0,
    this.max = 5,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final real = shades.where((s) => s.hasBarcode).toList();
    final total = real.length > 1
        ? real.length
        : (shadeCount > 1 && real.isEmpty ? shadeCount : real.length);
    if (total < 2) return const SizedBox.shrink();
    final visible = real.take(max).toList();
    final extra = total - visible.length;

    // بلا ألوان في بيانات القائمة: «🎨 21 درجة» أوضح من «+21» وحدها.
    if (visible.isEmpty) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.palette_outlined, size: 12.5, color: t.accent),
          const SizedBox(width: 3),
          // اللغة من إعداد التطبيق لا من اتجاه النص.
          Consumer(
            builder: (context, ref, _) => Text(
              ref.s.dsShadesCount(total),
              style: AppText.micro.copyWith(fontSize: 10.5, color: t.inkSoft, height: 1),
            ),
          ),
        ],
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // دوائر صغيرة للدلالة فقط — أول 5 درجات متراكبة قليلاً، شكل أنيق ومساحة أقل.
        SizedBox(
          width: 11 + (visible.length - 1) * 8.0,
          height: 11,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              for (var i = 0; i < visible.length; i++)
                PositionedDirectional(
                  start: i * 8.0,
                  child: _ShadeDot(
                    shade: visible[i],
                    size: 11,
                    ring: t.surface,
                  ),
                ),
            ],
          ),
        ),
        if (extra > 0) ...[
          const SizedBox(width: 3),
          Text(
            '+$extra',
            textDirection: TextDirection.ltr,
            style: AppText.micro.copyWith(
              fontSize: 10.5,
              color: t.inkSoft,
              height: 1,
            ),
          ),
        ],
      ],
    );
  }
}

class _ShadeDot extends StatelessWidget {
  final ProductShade shade;
  final double size;
  final Color ring;
  const _ShadeDot({
    required this.shade,
    required this.size,
    required this.ring,
  });

  /// «#FFF» و«#FFFFFF» و«#AARRGGBB» — كانت الثلاثية تُقرأ شفافة فتختفي النقطة.
  static Color _hex(String hex) => shadeSwatchColor(hex);

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final start = _hex(shade.colorHex);
    final end = _hex(shade.colorHexEnd ?? shade.colorHex);
    final hasGradient =
        shade.colorHexEnd != null &&
        shade.colorHexEnd!.trim().isNotEmpty &&
        shade.colorHexEnd!.toLowerCase() != shade.colorHex.toLowerCase();

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: hasGradient ? null : start,
        gradient: hasGradient
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [start, end],
              )
            : null,
        // فاصل بلون البطاقة بين النقاط المتراكبة + حلقة رفيعة تُظهر الدرجات الفاتحة
        // (العاجي والأبيض) على البطاقة البيضاء.
        border: Border.all(color: ring, width: 1.5),
        boxShadow: [
          BoxShadow(color: t.ink.withValues(alpha: 0.18), spreadRadius: 0.6),
        ],
      ),
    );
  }
}
