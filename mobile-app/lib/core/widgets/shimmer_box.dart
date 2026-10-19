import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import '../../features/worlds/world_theme.dart';
import '../brand/brand_logo.dart';
import '../theme/app_spacing.dart';
import '../theme/app_text.dart';
import 'product_grid.dart';

/// لون كتل الهيكل — أغمق قليلاً من خلفية العالم الدافئة.
Color _blockColor(WorldThemePalette t) => Color.lerp(t.canvasWarm, t.hairline, 0.35)!;

/// يعلّم أن الشجرة تحت [Skeleton]: كتل [ShimmerBox] داخلها لا تشغّل وميضاً خاصاً بها.
class _SkeletonScope extends InheritedWidget {
  const _SkeletonScope({required super.child});

  static bool active(BuildContext context) =>
      context.getInheritedWidgetOfExactType<_SkeletonScope>() != null;

  @override
  bool updateShouldNotify(_SkeletonScope oldWidget) => false;
}

/// وميض واحد يعبر هيكل التحميل كله بدل وميض لكل كتلة: متحكّم حركة واحد، وبريق
/// يمرّ مرة واحدة على التخطيط (من اليمين في العربية). كل ما تحته يُرسم بلون الوميض،
/// فالأسطح البيضاء (بئر الصورة مثلاً) تُبنى خارجه.
class Skeleton extends StatelessWidget {
  final Widget child;

  const Skeleton({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final rtl = Directionality.of(context) == TextDirection.rtl;
    return ExcludeSemantics(
      child: Shimmer.fromColors(
        baseColor: _blockColor(t),
        highlightColor: t.surface,
        direction: rtl ? ShimmerDirection.rtl : ShimmerDirection.ltr,
        // تقليل الحركة: الكتل ثابتة بلا بريق.
        enabled: !MediaQuery.disableAnimationsOf(context),
        child: _SkeletonScope(child: child),
      ),
    );
  }
}

/// كتلة هيكل مستديرة الزوايا. داخل [Skeleton] تومض معه، وخارجه تبقى بلونها الثابت.
class SkeletonBlock extends StatelessWidget {
  final double? width;
  final double? height;
  final double radius;

  const SkeletonBlock({super.key, this.width, this.height, this.radius = AppCorners.xs});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: _blockColor(context.worldTheme),
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}

/// كتلة تومض وحدها — للاستدعاءات القديمة. داخل [Skeleton] تصبح [SkeletonBlock] عادية
/// حتى لا يتراكب وميضان.
class ShimmerBox extends StatelessWidget {
  final double? width;
  final double height;
  final double radius;
  const ShimmerBox({super.key, this.width, this.height = 16, this.radius = 8});

  @override
  Widget build(BuildContext context) {
    final block = SkeletonBlock(width: width, height: height, radius: radius);
    if (_SkeletonScope.active(context)) return block;
    return Skeleton(child: block);
  }
}

/// ارتفاع منطقة البيانات في بطاقة المنتج (براند، سطرا الاسم، السعر) — كما في ProductCard.
const double _cardInfoHeight = 94;

/// بطاقة منتج هيكلية بطبقتين بنفس الأبعاد: [lines] = false يرسم البطاقة الثابتة وبئر
/// الصورة الأبيض بعلامة المتجر (كما تبدو البطاقة الحقيقية قبل وصول صورتها)، و
/// [lines] = true يرسم أسطر البيانات فقط لتوضع تحت [Skeleton].
class _SkeletonCard extends StatelessWidget {
  final bool lines;

  const _SkeletonCard({required this.lines});

  @override
  Widget build(BuildContext context) {
    if (!lines) {
      final t = context.worldTheme;
      return DecoratedBox(
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(AppCorners.lg),
          boxShadow: t.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(6, 6, 6, 0),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppCorners.lg - 5),
                  ),
                  child: Center(child: BrandMark(height: 26, color: t.hairline)),
                ),
              ),
            ),
            const SizedBox(height: _cardInfoHeight),
          ],
        ),
      );
    }
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Spacer(),
        SizedBox(
          height: _cardInfoHeight,
          child: Padding(
            padding: EdgeInsetsDirectional.fromSTEB(11, 9, 11, 11),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 14,
                  child: Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: SkeletonBlock(width: 52, height: 8),
                  ),
                ),
                SizedBox(height: 3),
                SizedBox(
                  height: 34,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      SkeletonBlock(width: double.infinity, height: 10),
                      FractionallySizedBox(widthFactor: 0.62, child: SkeletonBlock(height: 10)),
                    ],
                  ),
                ),
                SizedBox(height: 6),
                Expanded(
                  child: Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: SkeletonBlock(width: 64, height: 13),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// بطاقة منتج هيكلية واحدة (خانات «تحميل المزيد» في آخر الشبكة).
class ProductCardSkeleton extends StatelessWidget {
  const ProductCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return const Stack(
      fit: StackFit.expand,
      children: [
        _SkeletonCard(lines: false),
        Skeleton(child: _SkeletonCard(lines: true)),
      ],
    );
  }
}

/// شبكة هياكل تحميل بشكل بطاقات المنتجات وأبعاد شبكتها الحقيقية
/// ([ProductGrid.delegateFor]) — تحلّ البطاقات مكانها دون قفزة.
class ProductGridSkeleton extends StatelessWidget {
  final int count;

  /// نسبة بطاقات صفحات القوائم (كـ `ProductGrid.listingStyle`).
  final bool listing;

  final EdgeInsetsGeometry padding;

  const ProductGridSkeleton({
    super.key,
    this.count = 6,
    this.listing = false,
    this.padding = const EdgeInsets.all(AppSpacing.md),
  });

  @override
  Widget build(BuildContext context) {
    final delegate = ProductGrid.delegateFor(context, listing: listing);
    Widget grid(Widget tile) => GridView.builder(
          padding: padding,
          physics: const NeverScrollableScrollPhysics(),
          shrinkWrap: true,
          gridDelegate: delegate,
          itemCount: count,
          itemBuilder: (_, __) => tile,
        );
    // طبقتان بنفس الهندسة: البطاقات ثابتة، والأسطر وحدها تحت وميض واحد يعبر الشبكة.
    return Stack(
      children: [
        grid(const _SkeletonCard(lines: false)),
        Positioned.fill(child: Skeleton(child: grid(const _SkeletonCard(lines: true)))),
      ],
    );
  }
}

/// هيكل تحميل الصفحة الرئيسية — يشبه التخطيط الفعلي.
class HomeLoadingSkeleton extends StatelessWidget {
  const HomeLoadingSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    // نفس هيكل الرئيسية الفعلي: كتلة بلون العالم ثم ورقة بيضاء —
    // المحتوى يحلّ مكانه دون أي قفزة.
    final t = context.worldTheme;
    final top = MediaQuery.paddingOf(context).top;
    final band = Color.lerp(t.accent, Colors.black, 0.1)!;
    final width = MediaQuery.sizeOf(context).width;
    final tileW = (width - 16 - 40) / 4.3;

    Widget glass(double size) => Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white.withValues(alpha: 0.14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
          ),
        );

    return ColoredBox(
      color: t.surface,
      child: ListView(
        padding: EdgeInsets.zero,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          Container(
            color: band,
            padding: EdgeInsetsDirectional.fromSTEB(18, top + 4, 18, 46),
            child: Row(
              children: [
                glass(44),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 64,
                      height: 9,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: 96,
                      height: 13,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                glass(44),
                const SizedBox(width: 8),
                glass(44),
              ],
            ),
          ),
          Transform.translate(
            offset: const Offset(0, -30),
            child: Container(
              decoration: BoxDecoration(
                color: t.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
              ),
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: t.hairline,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  // كل كتل الورقة تحت وميض واحد.
                  Skeleton(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SkeletonBlock(height: 52, radius: 26),
                        const SizedBox(height: 14),
                        const SkeletonBlock(height: 86, radius: 22),
                        const SizedBox(height: 16),
                        SkeletonBlock(height: (width * 0.9 - 12) / 2.15, radius: 24),
                        const SizedBox(height: 26),
                        const Row(
                          children: [
                            SkeletonBlock(width: 120, height: 16),
                            Spacer(),
                            SkeletonBlock(width: 70, height: 16),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            for (var i = 0; i < 4; i++) ...[
                              if (i > 0) const SizedBox(width: 10),
                              Column(
                                children: [
                                  SkeletonBlock(width: tileW, height: tileW, radius: AppCorners.md),
                                  const SizedBox(height: 7),
                                  SkeletonBlock(width: tileW * 0.6, height: 10, radius: 5),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
