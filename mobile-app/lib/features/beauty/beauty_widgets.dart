import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/navigation/app_navigation.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/beauty.dart';
import '../../data/models/product.dart';
import '../cart/cart_packages_provider.dart';
import '../cart/cart_provider.dart';
import '../worlds/world_theme.dart';

Color? parseHex(String? hex) {
  final h = (hex ?? '').replaceAll('#', '').trim();
  if (h.length != 6) return null;
  final v = int.tryParse(h, radix: 16);
  return v == null ? null : Color(0xFF000000 | v);
}

/// ألوان الروتين: الصباح دافئ ذهبي، المساء بنفسجي ليلي.
List<Color> routineColors(BeautyPackage p, WorldThemePalette t) {
  if (p.isMorning) return const [Color(0xFFFFC46B), Color(0xFFF08A5D)];
  if (p.isEvening) return const [Color(0xFF6C5BD4), Color(0xFF2E2A6B)];
  if (p.isBridal) return const [Color(0xFFE9B7C8), Color(0xFFB65F86)];
  return [Color.lerp(t.accent, Colors.white, 0.1)!, t.accentDark];
}

String routineIcon(BeautyPackage p) => p.isMorning
    ? '☀️'
    : p.isEvening
        ? '🌙'
        : p.isBridal
            ? '💍'
            : '🎁';

void openPackage(BuildContext context, BeautyPackage p) {
  HapticFeedback.selectionClick();
  context.push('/package/${Uri.encodeComponent(p.routeId)}');
}

void openConcern(BuildContext context, SkinConcern c) {
  HapticFeedback.selectionClick();
  context.push('/skin-guide/${Uri.encodeComponent(c.slug)}');
}

// ─── عناصر صغيرة ─────────────────────────────────────────────────────────────

/// شارة التوفير: «وفّري 20%».
class SavingBadge extends StatelessWidget {
  final BeautyPackage pack;
  final bool large;
  const SavingBadge({super.key, required this.pack, this.large = false});

  @override
  Widget build(BuildContext context) {
    if (!pack.hasSaving) return const SizedBox.shrink();
    final pct = pack.savingPercent;
    return Container(
      padding: EdgeInsets.symmetric(horizontal: large ? 12 : 8, vertical: large ? 6 : 4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF22B07D), Color(0xFF13895F)]),
        borderRadius: BorderRadius.circular(AppCorners.pill),
        boxShadow: [BoxShadow(color: const Color(0xFF13895F).withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))],
      ),
      child: Text(
        pct > 0 ? 'وفّري $pct%' : 'وفّري ${formatPrice(pack.saving)}',
        style: (large ? AppText.label : AppText.micro).copyWith(color: Colors.white, fontWeight: FontWeight.w800),
      ),
    );
  }
}

/// صور منتجات متراكبة (دوائر).
class ThumbStack extends StatelessWidget {
  final List<String> urls;
  final double size;
  final int max;
  final Color ring;
  const ThumbStack({super.key, required this.urls, this.size = 30, this.max = 4, this.ring = Colors.white});

  @override
  Widget build(BuildContext context) {
    final list = urls.take(max).toList();
    final extra = urls.length - list.length;
    final step = size * 0.68;
    final count = list.length + (extra > 0 ? 1 : 0);
    if (count == 0) return const SizedBox.shrink();
    return SizedBox(
      width: step * (count - 1) + size,
      height: size,
      child: Directionality(
        textDirection: TextDirection.ltr,
        child: Stack(
          children: [
            for (var i = 0; i < list.length; i++)
              Positioned(
                left: i * step,
                child: Container(
                  width: size,
                  height: size,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    border: Border.all(color: ring, width: 2),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 4)],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Padding(
                    padding: const EdgeInsets.all(2),
                    child: AppNetworkImage(url: list[i], fit: BoxFit.contain, backgroundColor: Colors.white),
                  ),
                ),
              ),
            if (extra > 0)
              Positioned(
                left: list.length * step,
                child: Container(
                  width: size,
                  height: size,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.black.withValues(alpha: 0.55),
                    border: Border.all(color: ring, width: 2),
                  ),
                  child: Text('+$extra', style: AppText.micro.copyWith(color: Colors.white)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// عدّاد انتهاء العرض: «ينتهي خلال 2 يوم 4 س».
class OfferCountdown extends StatefulWidget {
  final DateTime endsAt;
  final Color color;
  final Color background;
  const OfferCountdown({super.key, required this.endsAt, this.color = Colors.white, this.background = const Color(0x33000000)});

  @override
  State<OfferCountdown> createState() => _OfferCountdownState();
}

class _OfferCountdownState extends State<OfferCountdown> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => mounted ? setState(() {}) : null);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final left = widget.endsAt.difference(DateTime.now());
    if (left.isNegative) return const SizedBox.shrink();
    String two(int n) => n.toString().padLeft(2, '0');
    final text = left.inDays >= 1
        ? 'ينتهي خلال ${left.inDays} يوم ${left.inHours % 24} س'
        : 'ينتهي خلال ${two(left.inHours)}:${two(left.inMinutes % 60)}:${two(left.inSeconds % 60)}';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: widget.background, borderRadius: BorderRadius.circular(AppCorners.pill)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.timer_outlined, size: 13, color: widget.color),
          const SizedBox(width: 4),
          Text(text, style: AppText.micro.copyWith(color: widget.color, fontFeatures: const [FontFeature.tabularFigures()])),
        ],
      ),
    );
  }
}

/// سعر الباقة مع المجموع الأصلي مشطوباً.
class PackagePrice extends StatelessWidget {
  final BeautyPackage pack;
  final Color color;
  final Color muted;
  final bool large;
  const PackagePrice({super.key, required this.pack, required this.color, required this.muted, this.large = false});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.end,
      spacing: 6,
      children: [
        Text(formatPrice(pack.price), style: (large ? AppText.priceLarge : AppText.price).copyWith(color: color)),
        if (pack.hasSaving)
          Padding(
            padding: const EdgeInsets.only(bottom: 1),
            child: Text(
              formatPrice(pack.itemsTotal),
              style: AppText.caption.copyWith(
                color: muted,
                decoration: TextDecoration.lineThrough,
                decorationColor: muted,
              ),
            ),
          ),
      ],
    );
  }
}

// ─── بطاقة باقة ──────────────────────────────────────────────────────────────

/// بطاقة باقة: الغلاف (أو صور المنتجات)، التوفير، الاسم، السعر.
class BeautyPackageCard extends StatelessWidget {
  final BeautyPackage pack;
  final double width;
  final double height;
  const BeautyPackageCard({super.key, required this.pack, this.width = 240, this.height = 280});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final colors = routineColors(pack, t);
    return GestureDetector(
      onTap: () => openPackage(context, pack),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(22),
          boxShadow: t.cardShadow,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _PackageVisual(pack: pack, colors: colors),
                  PositionedDirectional(
                    top: 10,
                    start: 10,
                    child: SavingBadge(pack: pack),
                  ),
                  if (pack.badge != null)
                    PositionedDirectional(
                      top: 10,
                      end: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.92),
                          borderRadius: BorderRadius.circular(AppCorners.pill),
                        ),
                        child: Text(pack.badge!, style: AppText.micro.copyWith(color: colors.last)),
                      ),
                    ),
                  if (pack.endsAt != null)
                    PositionedDirectional(
                      bottom: 8,
                      start: 8,
                      child: OfferCountdown(endsAt: pack.endsAt!, background: Colors.black.withValues(alpha: 0.45)),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(pack.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.title3.copyWith(color: t.ink)),
                  const SizedBox(height: 2),
                  Text(
                    pack.subtitle.isNotEmpty ? pack.subtitle : '${pack.stepCount} منتجات مختارة',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.caption.copyWith(color: t.inkMuted),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(child: PackagePrice(pack: pack, color: t.ink, muted: t.inkMuted)),
                      ThumbStack(urls: pack.thumbs, size: 26, max: 3),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// صورة الباقة: الغلاف إن وُجد، وإلا منتجاتها مصفوفة على تدرّج لونها.
class _PackageVisual extends StatelessWidget {
  final BeautyPackage pack;
  final List<Color> colors;
  const _PackageVisual({required this.pack, required this.colors});

  @override
  Widget build(BuildContext context) {
    if (pack.coverUrl != null) {
      return AppNetworkImage(url: pack.coverUrl!, fit: BoxFit.cover, backgroundColor: colors.first.withValues(alpha: 0.2));
    }
    final thumbs = pack.thumbs.take(4).toList();
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [colors.first.withValues(alpha: 0.28), colors.last.withValues(alpha: 0.18)],
        ),
      ),
      child: thumbs.isEmpty
          ? Center(child: Text(routineIcon(pack), style: const TextStyle(fontSize: 46)))
          : Padding(
              padding: const EdgeInsets.fromLTRB(18, 34, 18, 14),
              child: Row(
                children: [
                  for (var i = 0; i < thumbs.length; i++)
                    Expanded(
                      child: Transform.translate(
                        offset: Offset(0, i.isOdd ? 8 : -2),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 3),
                          child: AppNetworkImage(url: thumbs[i], fit: BoxFit.contain),
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}

// ─── بطاقة روتين ─────────────────────────────────────────────────────────────

/// بطاقة روتين: تدرّج الصباح/المساء، خطوات مرقّمة، صور المنتجات، والسعر.
class RoutineCard extends StatelessWidget {
  final BeautyPackage pack;
  final double width;
  final double height;
  const RoutineCard({super.key, required this.pack, this.width = 290, this.height = 230});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final colors = routineColors(pack, t);
    final steps = pack.items.map((i) => i.stepTitle ?? '').where((s) => s.isNotEmpty).toList();
    return GestureDetector(
      onTap: () => openPackage(context, pack),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: LinearGradient(begin: Alignment.topRight, end: Alignment.bottomLeft, colors: colors),
          boxShadow: [BoxShadow(color: colors.last.withValues(alpha: 0.32), blurRadius: 18, offset: const Offset(0, 8), spreadRadius: -6)],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            // غلاف الروتين خافتاً في الخلف.
            if (pack.coverUrl != null)
              Positioned.fill(
                child: Opacity(
                  opacity: 0.22,
                  child: AppNetworkImage(url: pack.coverUrl!, fit: BoxFit.cover),
                ),
              ),
            PositionedDirectional(
              top: -24,
              end: -18,
              child: Text(routineIcon(pack), style: TextStyle(fontSize: 92, color: Colors.white.withValues(alpha: 0.9))),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.22),
                          borderRadius: BorderRadius.circular(AppCorners.pill),
                        ),
                        child: Text(
                          '${pack.isMorning ? 'روتين الصباح' : pack.isEvening ? 'روتين المساء' : 'روتين'} • ${pack.stepCount} خطوات',
                          style: AppText.micro.copyWith(color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 6),
                      SavingBadge(pack: pack),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: width * 0.68,
                    child: Text(
                      pack.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.title2.copyWith(color: Colors.white, height: 1.25),
                    ),
                  ),
                  if (pack.subtitle.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(pack.subtitle, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: AppText.caption.copyWith(color: Colors.white.withValues(alpha: 0.88))),
                  ],
                  const Spacer(),
                  if (steps.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _StepTrail(steps: steps),
                    ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: PackagePrice(pack: pack, color: Colors.white, muted: Colors.white.withValues(alpha: 0.7)),
                      ),
                      ThumbStack(urls: pack.thumbs, size: 32, max: 4, ring: Colors.white.withValues(alpha: 0.9)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// «١ غسول ← ٢ سيروم ← ٣ مرطب» بخط صغير.
class _StepTrail extends StatelessWidget {
  final List<String> steps;
  const _StepTrail({required this.steps});

  @override
  Widget build(BuildContext context) {
    final style = AppText.micro.copyWith(color: Colors.white, fontWeight: FontWeight.w700);
    final shown = steps.take(4).toList();
    return Wrap(
      spacing: 4,
      runSpacing: 4,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        for (var i = 0; i < shown.length; i++) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text('${i + 1} ${shown[i]}', style: style),
          ),
          if (i < shown.length - 1) Icon(Icons.arrow_back_ios_new_rounded, size: 9, color: Colors.white.withValues(alpha: 0.7)),
        ],
        if (steps.length > shown.length) Text('+${steps.length - shown.length}', style: style),
      ],
    );
  }
}

// ─── بطاقة مشكلة بشرة ────────────────────────────────────────────────────────

/// بطاقة مشكلة: صورة كبيرة بتدرّج لونها، الاسم، السطر القصير، عدد المنتجات.
class SkinConcernCard extends StatelessWidget {
  final SkinConcern concern;
  final double width;
  final double height;
  final bool selected;
  final VoidCallback? onTap;
  const SkinConcernCard({
    super.key,
    required this.concern,
    this.width = 150,
    this.height = 190,
    this.selected = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final color = parseHex(concern.color) ?? t.accent;
    return GestureDetector(
      onTap: onTap ?? () => openConcern(context, concern),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        width: width,
        height: height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          color: Color.lerp(color, Colors.white, 0.82),
          border: Border.all(color: selected ? color : Colors.transparent, width: 2.5),
          boxShadow: [BoxShadow(color: color.withValues(alpha: selected ? 0.4 : 0.18), blurRadius: 14, offset: const Offset(0, 6), spreadRadius: -4)],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (concern.imageUrl != null)
              AppNetworkImage(url: concern.imageUrl!, fit: BoxFit.cover)
            else
              Align(
                alignment: const Alignment(0, -0.35),
                child: Text(concern.icon ?? '✨', style: const TextStyle(fontSize: 52)),
              ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  stops: const [0.35, 1],
                  colors: [Colors.transparent, Color.lerp(color, Colors.black, 0.35)!.withValues(alpha: 0.92)],
                ),
              ),
            ),
            if (selected)
              PositionedDirectional(
                top: 8,
                end: 8,
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                  child: const Icon(Icons.check_rounded, size: 14, color: Colors.white),
                ),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${concern.imageUrl != null && concern.icon != null ? '${concern.icon} ' : ''}${concern.name}',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.title3.copyWith(color: Colors.white, height: 1.2),
                  ),
                  if (concern.subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(concern.subtitle!, maxLines: 2, overflow: TextOverflow.ellipsis,
                        style: AppText.micro.copyWith(color: Colors.white.withValues(alpha: 0.88), fontWeight: FontWeight.w500, height: 1.35)),
                  ],
                  if (concern.productCount > 0) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.22), borderRadius: BorderRadius.circular(AppCorners.pill)),
                      child: Text('${concern.productCount} منتج', style: AppText.micro.copyWith(color: Colors.white)),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── إضافة باقة للسلة ────────────────────────────────────────────────────────

/// يضيف كل منتجات الباقة للسلة ويسجّل الباقة (ليُطبَّق سعرها الخاص في الطلب).
/// المنتج متعدد الألوان يُسأل عن لونه أولاً.
Future<bool> addPackageToCart(BuildContext context, WidgetRef ref, BeautyPackage pack) async {
  final unavailable = pack.items.where((i) => i.product.stock < i.quantity).toList();
  if (unavailable.isNotEmpty) {
    AppSnackbar.show(context, 'نفد «${unavailable.first.product.name}» حالياً — لا يمكن إضافة الباقة كاملة');
    return false;
  }
  final shades = <String, ProductShade?>{};
  for (final i in pack.items) {
    final p = i.product;
    if (p.hasMultipleDisplayableShades) {
      final picked = await showAppSheet<ProductShade>(
        context: context,
        title: 'اختاري اللون — ${p.name}',
        builder: (_) => _ShadePickList(product: p),
      );
      if (picked == null) return false;
      shades[p.id] = picked;
    } else {
      shades[p.id] = p.soleDisplayableShade;
    }
  }
  if (!context.mounted) return false;
  HapticFeedback.mediumImpact();
  final cart = ref.read(cartProvider.notifier);
  for (final i in pack.items) {
    cart.add(i.product, quantity: i.quantity, shade: shades[i.product.id]);
  }
  ref.read(cartPackagesProvider.notifier).add(pack);
  AppSnackbar.cartAdded(
    context,
    title: pack.hasSaving ? 'أُضيفت ${pack.isRoutine ? 'خطوات الروتين' : 'الباقة'} — وفّرتِ ${formatPrice(pack.saving)} ✨' : 'أُضيفت للسلة ✨',
    productName: pack.name,
    viewCartLabel: 'السلة',
    onViewCart: () => openCartTab(context, ProviderScope.containerOf(context, listen: false)),
  );
  return true;
}

class _ShadePickList extends StatelessWidget {
  final Product product;
  const _ShadePickList({required this.product});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final shades = product.displayableShades.where((s) => s.stock > 0).toList();
    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.6),
      child: ListView.separated(
        shrinkWrap: true,
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
        itemCount: shades.length,
        separatorBuilder: (_, __) => Divider(height: 1, color: t.hairline),
        itemBuilder: (context, i) {
          final s = shades[i];
          final c = parseHex(s.colorHex) ?? t.accentLight;
          final end = parseHex(s.colorHexEnd);
          return ListTile(
            contentPadding: EdgeInsets.zero,
            onTap: () => Navigator.of(context).pop(s),
            leading: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(colors: [c, end ?? c]),
                border: Border.all(color: t.hairline),
              ),
            ),
            title: Text(s.name, style: AppText.label.copyWith(color: t.ink)),
            trailing: Icon(Icons.chevron_left_rounded, color: t.inkMuted),
          );
        },
      ),
    );
  }
}
