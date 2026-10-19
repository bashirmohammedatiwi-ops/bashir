import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/beauty.dart';
import '../../data/models/product.dart';
import '../cart/cart_packages_provider.dart';
import '../cart/cart_provider.dart';
import '../worlds/world_theme.dart';
import 'beauty_strings.dart';

Color? parseHex(String? hex) {
  final h = (hex ?? '').replaceAll('#', '').trim();
  if (h.length != 6) return null;
  final v = int.tryParse(h, radix: 16);
  return v == null ? null : Color(0xFF000000 | v);
}

/// ألوان الروتين: الصباح دافئ ذهبي، المساء بنفسجي ليلي — من [RoutinePalette] الموحّدة.
List<Color> routineColors(BeautyPackage p, WorldThemePalette t) {
  if (p.isMorning) return RoutinePalette.morning.colors;
  if (p.isEvening) return RoutinePalette.evening.colors;
  if (p.isBridal) return RoutinePalette.bridal.colors;
  return [Color.lerp(t.accent, Colors.white, 0.1)!, t.accentDark];
}

String routineIcon(BeautyPackage p) => p.isMorning
    ? '☀️'
    : p.isEvening
        ? '🌙'
        : p.isBridal
            ? '💍'
            : '🎁';

/// يفتح الباقة بما في البطاقة فوراً (الصفحة تعرضه وتجلب الأحدث خلفه).
void openPackage(BuildContext context, BeautyPackage p) {
  HapticFeedback.selectionClick();
  context.push('/package/${Uri.encodeComponent(p.routeId)}', extra: p);
}

void openConcern(BuildContext context, SkinConcern c) {
  HapticFeedback.selectionClick();
  context.push('/skin-guide/${Uri.encodeComponent(c.slug)}');
}

// ─── عناصر صغيرة ─────────────────────────────────────────────────────────────

/// زر رجوع فوق الأغلفة: دائرة داكنة شفافة بسهم أبيض يُقرأ فوق أي صورة.
/// صفحة فُتحت وحدها من رابط (واتساب، حملة) يصير زرها «الرئيسية» بدل أن يبقى بلا عمل.
class BeautyBackButton extends StatelessWidget {
  const BeautyBackButton({super.key});

  @override
  Widget build(BuildContext context) => AppBackButton(
        color: Colors.white,
        background: Colors.black.withValues(alpha: 0.28),
        outlined: false,
      );
}

/// زر مشاركة رابط الصفحة فوق الغلاف — ورقة المشاركة، وإن تعذّرت نسخ الرابط.
class BeautyShareButton extends ConsumerWidget {
  final String url;
  final String title;
  const BeautyShareButton({super.key, required this.url, required this.title});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    return AppIconButton(
      icon: Icons.ios_share_rounded,
      iconSize: 19,
      color: Colors.white,
      background: Colors.black.withValues(alpha: 0.28),
      outlined: false,
      tooltip: s.share,
      onTap: () => _share(context, s),
    );
  }

  Future<void> _share(BuildContext context, AppStrings s) async {
    final box = context.findRenderObject() as RenderBox?;
    // آيباد يحتاج مكان الزر ليفتح ورقة المشاركة بجانبه.
    final origin = box != null && box.hasSize ? box.localToGlobal(Offset.zero) & box.size : null;
    try {
      await SharePlus.instance.share(ShareParams(text: '$title\n$url', subject: title, sharePositionOrigin: origin));
    } catch (_) {
      await Clipboard.setData(ClipboardData(text: url));
      if (context.mounted) AppSnackbar.success(context, s.linkCopied);
    }
  }
}

/// عنوان شريط علوي يظهر فقط حين ينطوي الغلاف (لا يتكرر فوق عنوان الصورة).
class CollapsingTitle extends StatelessWidget {
  final Widget child;
  const CollapsingTitle({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final s = context.dependOnInheritedWidgetOfExactType<FlexibleSpaceBarSettings>();
    if (s == null || s.maxExtent <= s.minExtent) return child;
    final t = ((s.maxExtent - s.currentExtent) / (s.maxExtent - s.minExtent)).clamp(0.0, 1.0);
    return Opacity(opacity: t < 0.7 ? 0 : (t - 0.7) / 0.3, child: child);
  }
}

/// ظل علوي خفيف فوق الأغلفة: زر الرجوع وأيقونات شريط الحالة تبقى مقروءة فوق صورة فاتحة.
class TopScrim extends StatelessWidget {
  const TopScrim({super.key});

  @override
  Widget build(BuildContext context) => PositionedDirectional(
        top: 0,
        start: 0,
        end: 0,
        height: MediaQuery.paddingOf(context).top + 100,
        child: IgnorePointer(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.black.withValues(alpha: 0.35), Colors.transparent],
              ),
            ),
          ),
        ),
      );
}

/// شارة التوفير: «وفّري 20%».
class SavingBadge extends ConsumerWidget {
  final BeautyPackage pack;
  final bool large;
  const SavingBadge({super.key, required this.pack, this.large = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!pack.hasSaving) return const SizedBox.shrink();
    final s = ref.watch(stringsProvider);
    final pct = pack.savingPercent;
    return Container(
      padding: EdgeInsets.symmetric(horizontal: large ? 12 : 8, vertical: large ? 6 : 4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppColors.success, AppColors.successDeep]),
        borderRadius: BorderRadius.circular(AppCorners.pill),
        boxShadow: [BoxShadow(color: AppColors.successDeep.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))],
      ),
      child: Text(
        pct > 0 ? s.beautySavePercent(pct) : s.beautySaveAmount(formatPrice(pack.saving)),
        maxLines: 1,
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
                    child: AppNetworkImage(url: list[i], width: size - 4, fit: BoxFit.contain, backgroundColor: Colors.white),
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

/// سعر الباقة مع المجموع الأصلي مشطوباً — سطر واحد يصغر ولا ينكسر في البطاقات الضيقة.
class PackagePrice extends StatelessWidget {
  final BeautyPackage pack;
  final Color color;
  final Color muted;
  final bool large;
  const PackagePrice({super.key, required this.pack, required this.color, required this.muted, this.large = false});

  @override
  Widget build(BuildContext context) {
    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: AlignmentDirectional.centerStart,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            formatPrice(pack.price),
            maxLines: 1,
            softWrap: false,
            style: (large ? AppText.priceLarge : AppText.price).copyWith(color: color),
          ),
          if (pack.hasSaving) ...[
            const SizedBox(width: 6),
            Padding(
              padding: const EdgeInsets.only(bottom: 1),
              child: Text(
                formatPrice(pack.itemsTotal),
                maxLines: 1,
                softWrap: false,
                style: AppText.caption.copyWith(
                  color: muted,
                  decoration: TextDecoration.lineThrough,
                  decorationColor: muted,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── بطاقة باقة ──────────────────────────────────────────────────────────────

/// بطاقة باقة: الغلاف (أو صور المنتجات)، التوفير، الاسم، السعر.
class BeautyPackageCard extends ConsumerWidget {
  final BeautyPackage pack;
  final double width;
  final double height;
  const BeautyPackageCard({super.key, required this.pack, this.width = 240, this.height = 280});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final colors = routineColors(pack, t);
    // البطاقة الضيقة (عمودان) تعطي السعر عرضه كاملاً وتنقل صور المنتجات فوق الغلاف.
    final roomy = width >= 200;
    final hasCover = pack.coverUrl != null;
    final radius = BorderRadius.circular(AppCorners.lg + 2);
    return AppTap(
      onTap: () => openPackage(context, pack),
      radius: radius,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: radius,
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
                  _PackageVisual(pack: pack, colors: colors, width: width),
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
                        constraints: BoxConstraints(maxWidth: width * 0.45),
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.92),
                          borderRadius: BorderRadius.circular(AppCorners.pill),
                        ),
                        child: Text(
                          pack.badge!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.micro.copyWith(color: colors.last),
                        ),
                      ),
                    ),
                  if (pack.endsAt != null)
                    PositionedDirectional(
                      bottom: 8,
                      start: 8,
                      end: 8,
                      child: Align(
                        alignment: AlignmentDirectional.centerStart,
                        child: AppCountdown(
                          endsAt: pack.endsAt!,
                          color: Colors.white,
                          background: Colors.black.withValues(alpha: 0.45),
                        ),
                      ),
                    )
                  else if (hasCover && !roomy)
                    PositionedDirectional(
                      bottom: 8,
                      end: 8,
                      child: ThumbStack(urls: pack.thumbs, size: 26, max: 3),
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
                    pack.subtitle.isNotEmpty ? pack.subtitle : s.beautyCuratedProducts(pack.stepCount),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.caption.copyWith(color: t.inkMuted),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(child: PackagePrice(pack: pack, color: t.ink, muted: t.inkMuted)),
                      // الصورة تعرض المنتجات أصلاً حين لا يوجد غلاف — هنا عددها فقط.
                      if (hasCover && roomy) ...[
                        const SizedBox(width: 6),
                        ThumbStack(urls: pack.thumbs, size: 26, max: 3, ring: t.surface),
                      ] else if (!hasCover && roomy) ...[
                        const SizedBox(width: 6),
                        Text(s.productsN(pack.stepCount), style: AppText.micro.copyWith(color: t.inkMuted)),
                      ],
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
  final double width;
  const _PackageVisual({required this.pack, required this.colors, required this.width});

  @override
  Widget build(BuildContext context) {
    if (pack.coverUrl != null) {
      return AppNetworkImage(
        url: pack.coverUrl!,
        width: width,
        fit: BoxFit.cover,
        backgroundColor: colors.first.withValues(alpha: 0.2),
      );
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
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: [BoxShadow(color: colors.last.withValues(alpha: 0.12), blurRadius: 8, offset: const Offset(0, 3))],
                          ),
                          child: AspectRatio(
                            aspectRatio: 0.82,
                            child: AppNetworkImage(url: thumbs[i], width: (width - 36) / 4, fit: BoxFit.contain),
                          ),
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
class RoutineCard extends ConsumerWidget {
  final BeautyPackage pack;
  final double width;
  final double height;
  const RoutineCard({super.key, required this.pack, this.width = 290, this.height = 230});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final colors = routineColors(pack, t);
    final steps = pack.items.map((i) => i.stepTitle ?? '').where((s) => s.isNotEmpty).toList();
    final radius = BorderRadius.circular(AppCorners.lg + 4);
    return AppTap(
      onTap: () => openPackage(context, pack),
      radius: radius,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          borderRadius: radius,
          gradient: LinearGradient(begin: AlignmentDirectional.topStart, end: AlignmentDirectional.bottomEnd, colors: colors),
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
                  child: AppNetworkImage(url: pack.coverUrl!, width: width, fit: BoxFit.cover),
                ),
              ),
            PositionedDirectional(
              top: -24,
              end: -18,
              child: ExcludeSemantics(
                child: Text(routineIcon(pack), style: TextStyle(fontSize: 92, color: Colors.white.withValues(alpha: 0.9))),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.22),
                            borderRadius: BorderRadius.circular(AppCorners.pill),
                          ),
                          child: Text(
                            '${s.beautyKindLabel(pack)} • ${s.stepsCount(pack.stepCount)}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppText.micro.copyWith(color: Colors.white),
                          ),
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
                  // الخطوات تأخذ ما يبقى: سطر واحد يتمرر، ويختفي إن لم تبقَ مساحة (نص مكبّر).
                  Expanded(
                    child: steps.isEmpty
                        ? const SizedBox.shrink()
                        : LayoutBuilder(
                            builder: (context, c) => c.maxHeight < 34
                                ? const SizedBox.shrink()
                                : Align(
                                    alignment: AlignmentDirectional.bottomStart,
                                    child: Padding(
                                      padding: const EdgeInsets.only(bottom: 10),
                                      child: _StepTrail(steps: steps),
                                    ),
                                  ),
                          ),
                  ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: PackagePrice(pack: pack, color: Colors.white, muted: Colors.white.withValues(alpha: 0.7)),
                      ),
                      const SizedBox(width: 6),
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

/// «١ غسول ← ٢ سيروم ← ٣ مرطب» بخط صغير — سطر واحد يتمرر أفقياً مهما كثرت الخطوات.
class _StepTrail extends StatelessWidget {
  final List<String> steps;
  const _StepTrail({required this.steps});

  @override
  Widget build(BuildContext context) {
    final style = AppText.micro.copyWith(color: Colors.white, fontWeight: FontWeight.w700);
    final shown = steps.take(4).toList();
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          for (var i = 0; i < shown.length; i++) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(AppCorners.xs),
              ),
              child: Text('${i + 1} ${shown[i]}', maxLines: 1, style: style),
            ),
            if (i < shown.length - 1)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                // ينعكس تلقائياً بالعربي: يشير دائماً للخطوة التالية.
                child: Icon(Icons.arrow_forward_ios_rounded, size: 9, color: Colors.white.withValues(alpha: 0.7)),
              ),
          ],
          if (steps.length > shown.length) ...[
            const SizedBox(width: 4),
            Text('+${steps.length - shown.length}', style: style),
          ],
        ],
      ),
    );
  }
}

// ─── بطاقة مشكلة بشرة ────────────────────────────────────────────────────────

/// بطاقة مشكلة: صورة كبيرة بتدرّج لونها، الاسم، السطر القصير، عدد المنتجات.
class SkinConcernCard extends ConsumerWidget {
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
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final color = parseHex(concern.color) ?? t.accent;
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final radius = BorderRadius.circular(AppCorners.lg + 2);
    // اختيار في الاختبار: حالة «محدد» لقارئ الشاشة؛ وإلا بطاقة تفتح الدليل.
    final selectable = onTap != null;
    return AppTap(
      onTap: onTap ?? () => openConcern(context, concern),
      selected: selectable ? selected : null,
      radius: radius,
      haptic: !selectable,
      child: AnimatedContainer(
        duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 220),
        width: width,
        height: height,
        decoration: BoxDecoration(
          borderRadius: radius,
          color: Color.lerp(color, Colors.white, 0.82),
          border: Border.all(color: selected ? color : Colors.transparent, width: 2.5),
          boxShadow: [BoxShadow(color: color.withValues(alpha: selected ? 0.4 : 0.18), blurRadius: 14, offset: const Offset(0, 6), spreadRadius: -4)],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (concern.imageUrl != null)
              AppNetworkImage(url: concern.imageUrl!, width: width, fit: BoxFit.cover)
            else
              Align(
                alignment: const Alignment(0, -0.35),
                child: ExcludeSemantics(child: Text(concern.icon ?? '✨', style: const TextStyle(fontSize: 52))),
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
              child: LayoutBuilder(
                builder: (context, c) {
                  // البطاقة القصيرة (أو النص المكبّر) تسقط السطر القصير؛ والتصغير ضمان أخير.
                  final roomForSubtitle = c.maxHeight >= MediaQuery.textScalerOf(context).scale(150);
                  return Align(
                    alignment: AlignmentDirectional.bottomStart,
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: AlignmentDirectional.bottomStart,
                      child: SizedBox(
                        width: c.maxWidth,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${concern.imageUrl != null && concern.icon != null ? '${concern.icon} ' : ''}${concern.name}',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.title3.copyWith(color: Colors.white, height: 1.2),
                            ),
                            if (concern.subtitle != null && roomForSubtitle) ...[
                              const SizedBox(height: 2),
                              Text(concern.subtitle!, maxLines: 1, overflow: TextOverflow.ellipsis,
                                  style: AppText.micro.copyWith(color: Colors.white.withValues(alpha: 0.88), fontWeight: FontWeight.w500, height: 1.35)),
                            ],
                            if (concern.productCount > 0) ...[
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.22), borderRadius: BorderRadius.circular(AppCorners.pill)),
                                child: Text(s.productsN(concern.productCount), maxLines: 1, style: AppText.micro.copyWith(color: Colors.white)),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── إضافة باقة للسلة ────────────────────────────────────────────────────────

/// سطر واحد يُضاف للسلة: منتج وكميته (مجموعاً إن تكرر في أكثر من باقة).
class _Line {
  final Product product;
  final int quantity;
  final String? step;
  const _Line(this.product, this.quantity, this.step);
}

/// أسطر الباقات مدموجة بالمنتج — المنتج المشترك بين روتينين يُختار لونه مرة واحدة.
List<_Line> _linesOf(Iterable<BeautyPackage> packs) {
  final byId = <String, _Line>{};
  for (final p in packs) {
    for (final i in p.items) {
      final had = byId[i.product.id];
      byId[i.product.id] = _Line(i.product, (had?.quantity ?? 0) + i.quantity, had?.step ?? i.stepTitle);
    }
  }
  return byId.values.toList();
}

/// يضيف كل منتجات الباقة للسلة ويسجّل الباقة (ليُطبَّق سعرها الخاص في الطلب).
/// ألوان كل المنتجات متعددة الألوان تُختار معاً في ورقة واحدة قبل أي إضافة.
/// الباقة الموجودة في السلة وينقصها منتج تُكمَّل بما ينقصها فقط ([completePackageInCart]).
Future<bool> addPackageToCart(BuildContext context, WidgetRef ref, BeautyPackage pack) async {
  final status = ref.read(cartPackageStatusProvider).where((e) => e.pack.id == pack.id).firstOrNull;
  if (status != null && !status.complete) return completePackageInCart(context, ref, pack, status);
  return addPackagesToCart(context, ref, [pack]);
}

/// يضيف باقة أو أكثر دفعة واحدة (روتين الصباح والمساء معاً): ورقة ألوان واحدة،
/// ثم كل الإضافات، ثم إشعار واحد. نقص المخزون في أي منتج يمنع تسجيل الباقة كي لا
/// يظن السعر الخاص قائماً وهو لن يُطبَّق.
Future<bool> addPackagesToCart(BuildContext context, WidgetRef ref, List<BeautyPackage> packs) async {
  if (packs.isEmpty) return false;
  final s = ref.read(stringsProvider);
  final lines = _linesOf(packs);
  final unavailable = lines.where((l) => l.product.stock < l.quantity).firstOrNull;
  if (unavailable != null) {
    AppSnackbar.show(context, s.beautyItemSoldOut(unavailable.product.name));
    return false;
  }
  final total = packs.fold<int>(0, (sum, p) => sum + p.price);
  final shades = await _pickShades(context, lines, confirmLabel: s.beautyAddToBagFor(formatPrice(total)));
  if (shades == null || !context.mounted) return false;

  final short = _addLines(ref, lines, shades);
  if (short != null) {
    AppSnackbar.show(context, s.beautyNotEnoughStock(short));
    return false;
  }
  final registry = ref.read(cartPackagesProvider.notifier);
  for (final p in packs) {
    registry.add(p);
  }
  HapticFeedback.mediumImpact();
  final saving = packs.fold<int>(0, (sum, p) => sum + p.saving);
  final routine = packs.every((p) => p.isRoutine);
  AppSnackbar.cartAdded(
    context,
    title: packs.length > 1
        ? s.beautyRoutinesAdded
        : saving > 0
            ? s.beautyAddedWithSaving(routine, formatPrice(saving))
            : s.beautyAddedToBag,
    productName: packs.map((p) => p.name).join(' + '),
    viewCartLabel: s.navCart,
    onViewCart: () => openCartTab(context, ProviderScope.containerOf(context, listen: false)),
  );
  return true;
}

/// يكمل باقة في السلة بما ينقصها فقط — لا يعيد إضافة ما فيها ولا يسجّلها مرة ثانية
/// (تسجيلها ثانية يطلب نسختين، فتُحسب القطع الزائدة بسعرها الكامل).
Future<bool> completePackageInCart(
  BuildContext context,
  WidgetRef ref,
  BeautyPackage pack,
  CartPackageStatus status,
) async {
  final s = ref.read(stringsProvider);
  final cart = ref.read(cartProvider);
  final lines = <_Line>[];
  for (final i in pack.items) {
    if (!status.missingProductIds.contains(i.product.id)) continue;
    final have = quantityForProduct(cart, i.product.id) % i.quantity;
    final units = i.quantity - math.min<int>(i.quantity, have);
    if (units > 0) lines.add(_Line(i.product, units, i.stepTitle));
  }
  if (lines.isEmpty) return true;
  final unavailable = lines.where((l) => l.product.stock < l.quantity).firstOrNull;
  if (unavailable != null) {
    AppSnackbar.show(context, s.beautyItemSoldOut(unavailable.product.name));
    return false;
  }
  final missingTotal = lines.fold<int>(0, (sum, l) => sum + l.product.price * l.quantity);
  final shades = await _pickShades(context, lines, confirmLabel: s.beautyAddToBagFor(formatPrice(missingTotal)));
  if (shades == null || !context.mounted) return false;
  final short = _addLines(ref, lines, shades);
  if (short != null) {
    AppSnackbar.show(context, s.beautyNotEnoughStock(short));
    return false;
  }
  HapticFeedback.mediumImpact();
  AppSnackbar.cartAdded(
    context,
    title: s.beautyPackageCompleted,
    productName: pack.name,
    viewCartLabel: s.navCart,
    onViewCart: () => openCartTab(context, ProviderScope.containerOf(context, listen: false)),
  );
  return true;
}

/// الباقة ناقصة المخزون: يضيف المتوفر منها فقط كمنتجات عادية — بلا تسجيل باقة،
/// فلا يُوعد بسعر الباقة الخاص.
Future<bool> addAvailablePackageItems(BuildContext context, WidgetRef ref, BeautyPackage pack) async {
  final s = ref.read(stringsProvider);
  final lines = _linesOf([pack]).where((l) => l.product.stock >= l.quantity).toList();
  if (lines.isEmpty) return false;
  final total = lines.fold<int>(0, (sum, l) => sum + l.product.price * l.quantity);
  final shades = await _pickShades(context, lines, confirmLabel: s.beautyAddToBagFor(formatPrice(total)));
  if (shades == null || !context.mounted) return false;
  final short = _addLines(ref, lines, shades);
  HapticFeedback.mediumImpact();
  if (short != null) {
    AppSnackbar.show(context, s.beautyNotEnoughStock(short));
  } else {
    AppSnackbar.cartAdded(
      context,
      title: s.beautyAvailableAdded,
      productName: pack.name,
      viewCartLabel: s.navCart,
      onViewCart: () => openCartTab(context, ProviderScope.containerOf(context, listen: false)),
    );
  }
  return true;
}

/// يضيف الأسطر للسلة؛ يعيد اسم أول منتج أُضيف منه أقل من المطلوب (حد المخزون)، أو null.
String? _addLines(WidgetRef ref, List<_Line> lines, Map<String, ProductShade?> shades) {
  final cart = ref.read(cartProvider.notifier);
  String? short;
  for (final l in lines) {
    final added = cart.addCounted(l.product, quantity: l.quantity, shade: shades[l.product.id]);
    if (added < l.quantity) short ??= l.product.name;
  }
  return short;
}

/// ألوان المنتجات متعددة الألوان كلها في ورقة واحدة. يعيد null إن أُغلقت الورقة.
/// المنتج بلون واحد يأخذه تلقائياً.
Future<Map<String, ProductShade?>?> _pickShades(
  BuildContext context,
  List<_Line> lines, {
  required String confirmLabel,
}) async {
  final shades = <String, ProductShade?>{
    for (final l in lines)
      if (!l.product.hasMultipleDisplayableShades) l.product.id: l.product.soleDisplayableShade,
  };
  final multi = lines.where((l) => l.product.hasMultipleDisplayableShades).toList();
  if (multi.isEmpty) return shades;
  final container = ProviderScope.containerOf(context, listen: false);
  final picked = await showAppSheet<Map<String, ProductShade>>(
    context: context,
    title: container.read(stringsProvider).beautyChooseShades,
    builder: (_) => _ShadesSheet(lines: multi, confirmLabel: confirmLabel),
  );
  if (picked == null) return null;
  return {...shades, ...picked};
}

/// ورقة الألوان: قسم لكل منتج، دوائر الألوان المتوفرة بكمية الباقة، وزر يكتمل
/// حين تُختار كلها.
class _ShadesSheet extends ConsumerStatefulWidget {
  final List<_Line> lines;
  final String confirmLabel;
  const _ShadesSheet({required this.lines, required this.confirmLabel});

  @override
  ConsumerState<_ShadesSheet> createState() => _ShadesSheetState();
}

class _ShadesSheetState extends ConsumerState<_ShadesSheet> {
  final _picked = <String, ProductShade>{};

  /// اللون المختار يجب أن يكفي كمية الباقة، لا أن يكون متوفراً فقط.
  List<ProductShade> _options(_Line l) =>
      l.product.displayableShades.where((sh) => sh.stock >= l.quantity).toList();

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final soldOut = widget.lines.any((l) => _options(l).isEmpty);
    final remaining = widget.lines.where((l) => !_picked.containsKey(l.product.id)).length;
    final ready = !soldOut && remaining == 0;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Flexible(
          child: ListView.separated(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
            itemCount: widget.lines.length,
            separatorBuilder: (_, __) => Divider(height: 24, color: t.divider),
            itemBuilder: (context, i) => _shadeSection(s, t, i),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
          child: FilledButton(
            onPressed: ready
                ? () {
                    HapticFeedback.lightImpact();
                    Navigator.of(context).pop(Map<String, ProductShade>.of(_picked));
                  }
                : null,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
              backgroundColor: t.accentDark,
              disabledBackgroundColor: t.hairline,
              shape: const StadiumBorder(),
            ),
            child: Text(
              soldOut
                  ? s.beautyShadesSoldOut
                  : ready
                      ? widget.confirmLabel
                      : s.beautyPickRemainingShades(remaining),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.title3.copyWith(color: ready ? Colors.white : t.inkMuted),
            ),
          ),
        ),
      ],
    );
  }

  Widget _shadeSection(AppStrings s, WorldThemePalette t, int index) {
    final l = widget.lines[index];
    final options = _options(l);
    final chosen = _picked[l.product.id];
    final title = [if (l.step != null) l.step!, l.product.name].join(' • ');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('${index + 1}. $title', maxLines: 2, overflow: TextOverflow.ellipsis, style: AppText.label.copyWith(color: t.ink)),
        const SizedBox(height: 2),
        Text(
          options.isEmpty ? s.beautyShadesSoldOut : (chosen?.name ?? s.beautyChooseShade),
          style: AppText.caption.copyWith(
            color: options.isEmpty ? AppColors.danger : (chosen != null ? t.accentDark : t.inkMuted),
            fontWeight: chosen != null || options.isEmpty ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
        if (options.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 4,
            runSpacing: 4,
            children: [
              for (final sh in options)
                _Swatch(
                  shade: sh,
                  selected: chosen?.id == sh.id,
                  onTap: () => setState(() => _picked[l.product.id] = sh),
                ),
            ],
          ),
        ],
      ],
    );
  }
}

/// دائرة لون 40 بمساحة لمس 44، بحلقة حين تُختار.
class _Swatch extends StatelessWidget {
  final ProductShade shade;
  final bool selected;
  final VoidCallback onTap;
  const _Swatch({required this.shade, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final c = parseHex(shade.colorHex) ?? t.accentLight;
    final end = parseHex(shade.colorHexEnd);
    return Tooltip(
      message: shade.name,
      child: AppTap(
        onTap: onTap,
        selected: selected,
        semanticsLabel: shade.name,
        radius: BorderRadius.circular(AppCorners.pill),
        child: SizedBox(
          width: kMinTapTarget + 4,
          height: kMinTapTarget + 4,
          child: Center(
            child: AnimatedContainer(
              duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 160),
              width: 40,
              height: 40,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: selected ? t.accentDark : Colors.transparent, width: 2),
              ),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: [c, end ?? c]),
                  border: Border.all(color: t.hairline),
                ),
                child: selected
                    ? Icon(Icons.check_rounded, size: 16, color: c.computeLuminance() > 0.6 ? t.ink : Colors.white)
                    : null,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
