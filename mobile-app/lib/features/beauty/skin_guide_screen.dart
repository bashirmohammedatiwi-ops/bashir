import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/product_card.dart';
import '../../core/widgets/product_grid.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/beauty.dart';
import '../worlds/world_theme.dart';
import 'beauty_home_sections.dart';
import 'beauty_providers.dart';
import 'beauty_strings.dart';
import 'beauty_widgets.dart';

/// صفحة فُتحت وحدها من رابط: رجوع النظام يفتح المتجر بدل أن يغلق التطبيق.
Widget _homeOnRootPop(BuildContext context, Widget child) => PopScope(
      canPop: GoRouter.of(context).canPop(),
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) context.go('/');
      },
      child: child,
    );

/// رأس صفحات الجمال: تدرّج لون العالم، زر رجوع، عنوان وسطر.
class BeautyHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final String emoji;
  const BeautyHeader({super.key, required this.title, required this.subtitle, this.emoji = '✨'});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final top = MediaQuery.paddingOf(context).top;
    return Container(
      padding: EdgeInsetsDirectional.fromSTEB(8, top + 6, 20, 26),
      // الحافة المستديرة تقصّ الرمز الكبير — لا خط مستقيم فوقها.
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [Color.lerp(t.accent, Colors.white, 0.08)!, t.accentDark],
        ),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(30)),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          PositionedDirectional(
            end: -6,
            bottom: -18,
            child: ExcludeSemantics(
              child: Text(emoji, style: TextStyle(fontSize: 86, color: Colors.white.withValues(alpha: 0.9))),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // يرجع، أو يفتح الرئيسية إن فُتحت الصفحة وحدها من رابط.
              AppBackButton(color: Colors.white, background: Colors.white.withValues(alpha: 0.18), outlined: false),
              const SizedBox(height: 4),
              Padding(
                padding: const EdgeInsetsDirectional.only(start: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Semantics(header: true, child: Text(title, style: AppText.display.copyWith(color: Colors.white))),
                    const SizedBox(height: 4),
                    SizedBox(
                      width: MediaQuery.sizeOf(context).width * 0.66,
                      child: Text(subtitle, style: AppText.bodySmall.copyWith(color: Colors.white.withValues(alpha: 0.9))),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// «دليل البشرة»: اختبار البشرة، المشاكل، روتين الصباح والمساء، الباقات، وترتيب الخطوات.
class SkinGuideScreen extends ConsumerStatefulWidget {
  const SkinGuideScreen({super.key});

  @override
  ConsumerState<SkinGuideScreen> createState() => _SkinGuideScreenState();
}

class _SkinGuideScreenState extends ConsumerState<SkinGuideScreen> {
  late bool _evening = DateTime.now().hour >= 15;

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final concerns = ref.watch(skinConcernsListProvider);
    final routines = ref.watch(beautyPackagesProvider('routines')).valueOrNull ?? const <BeautyPackage>[];
    final bundles = ref.watch(beautyPackagesProvider('bundles')).valueOrNull ?? const <BeautyPackage>[];
    final morning = routines.where((p) => p.isMorning).toList();
    final evening = routines.where((p) => p.isEvening).toList();
    final shownRoutines = morning.isNotEmpty && evening.isNotEmpty ? (_evening ? evening : morning) : routines;

    return _homeOnRootPop(context, Scaffold(
      backgroundColor: t.canvas,
      body: RefreshIndicator(
        color: t.accent,
        onRefresh: () => refreshBeautyCatalog(ref, kinds: const ['routines', 'bundles'], concerns: true),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          slivers: [
            SliverToBoxAdapter(
              child: BeautyHeader(title: s.beautySkinGuide, subtitle: s.beautySkinGuideSubtitle, emoji: '🌸'),
            ),
            const SliverToBoxAdapter(
              child: Padding(padding: EdgeInsets.fromLTRB(16, 16, 16, 0), child: SkinQuizBanner()),
            ),
            SliverToBoxAdapter(
              child: AppSectionTitle(title: s.beautyConcernsTitle, subtitle: s.beautyConcernsSubtitle),
            ),
            concerns.when(
              loading: () => SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.15,
                  children: List.generate(4, (_) => const ShimmerBox(height: double.infinity, radius: 22)),
                ),
              ),
              error: (e, _) => SliverToBoxAdapter(
                child: ErrorView.from(e, onRetry: () => ref.invalidate(skinConcernsListProvider)),
              ),
              data: (list) => list.isEmpty
                  ? SliverToBoxAdapter(
                      child: EmptyState(icon: Icons.spa_outlined, title: s.beautyGuideComingTitle, subtitle: s.beautyGuideComingSubtitle),
                    )
                  : SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverLayoutBuilder(
                        builder: (context, c) {
                          final w = (c.crossAxisExtent - 12) / 2;
                          return SliverGrid.count(
                            crossAxisCount: 2,
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                            childAspectRatio: 1.15,
                            children: [for (final x in list) SkinConcernCard(concern: x, width: w, height: w / 1.15)],
                          );
                        },
                      ),
                    ),
            ),
            if (routines.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: AppSectionTitle(
                  title: s.beautyRoutinesForYou,
                  subtitle: s.beautyRoutinesForYouSubtitle,
                  actionLabel: s.beautySeeAll,
                  onAction: () => context.push('/packages?tab=routines'),
                ),
              ),
              if (morning.isNotEmpty && evening.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: DayNightToggle(evening: _evening, onChanged: (v) => setState(() => _evening = v)),
                  ),
                ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 238,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    itemCount: shownRoutines.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (_, i) => RoutineCard(pack: shownRoutines[i], width: 300, height: 228),
                  ),
                ),
              ),
            ],
            if (bundles.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: AppSectionTitle(
                  title: s.beautyCareBundles,
                  actionLabel: s.beautySeeAll,
                  onAction: () => context.push('/packages?tab=bundles'),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 290,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                    itemCount: bundles.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (_, i) => BeautyPackageCard(pack: bundles[i], width: 226, height: 280),
                  ),
                ),
              ),
            ],
            const SliverToBoxAdapter(child: _RoutineOrderCard()),
            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ],
        ),
      ),
    ));
  }
}

/// «ترتيب الخطوات الصحيح»: من الأخف للأثقل.
class _RoutineOrderCard extends ConsumerWidget {
  const _RoutineOrderCard();

  static const _icons = ['🫧', '💦', '💧', '👁️', '🧴', '☀️'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final steps = s.beautyRoutineOrderSteps;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(22), boxShadow: t.cardShadow),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(s.beautyRoutineOrderTitle, style: AppText.title3.copyWith(color: t.ink)),
            const SizedBox(height: 2),
            Text(s.beautyRoutineOrderRule, style: AppText.caption.copyWith(color: t.inkMuted)),
            const SizedBox(height: 12),
            for (var i = 0; i < steps.length; i++)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(color: t.accentLight, shape: BoxShape.circle),
                        child: Text(_icons[i], style: const TextStyle(fontSize: 16)),
                      ),
                      if (i < steps.length - 1) Container(width: 2, height: 18, color: t.accentLight),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text.rich(
                        TextSpan(children: [
                          TextSpan(text: '${i + 1}. ${steps[i].$1}  ', style: AppText.label.copyWith(color: t.ink)),
                          TextSpan(text: steps[i].$2, style: AppText.caption.copyWith(color: t.inkMuted)),
                        ]),
                      ),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

/// صفحة الدليل لمشكلة: الصورة، النبذة، النصائح، الأسباب، المكونات، الروتينات والمنتجات.
class SkinConcernScreen extends ConsumerWidget {
  final String slug;
  const SkinConcernScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final async = ref.watch(skinGuideProvider(slug));
    return _homeOnRootPop(context, Scaffold(
      backgroundColor: t.canvas,
      body: async.when(
        loading: () => const _GuideSkeleton(),
        error: (e, _) => SafeArea(
          child: Column(
            children: [
              const Align(
                alignment: AlignmentDirectional.centerStart,
                child: Padding(padding: EdgeInsetsDirectional.only(start: 8, top: 6), child: AppBackButton()),
              ),
              Expanded(child: ErrorView.from(e, onRetry: () => ref.invalidate(skinGuideProvider(slug)))),
            ],
          ),
        ),
        data: (g) => _GuideBody(guide: g),
      ),
    ));
  }
}

class _GuideSkeleton extends StatelessWidget {
  const _GuideSkeleton();
  @override
  Widget build(BuildContext context) => Stack(
        children: [
          ListView(
            padding: EdgeInsets.zero,
            physics: const NeverScrollableScrollPhysics(),
            children: const [
              ShimmerBox(height: 300, radius: 0),
              Padding(padding: EdgeInsets.all(16), child: ShimmerBox(height: 90, radius: 18)),
              Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: ShimmerBox(height: 160, radius: 18)),
            ],
          ),
          PositionedDirectional(
            top: MediaQuery.paddingOf(context).top + 6,
            start: 8,
            child: const BeautyBackButton(),
          ),
        ],
      );
}

class _GuideBody extends ConsumerWidget {
  final SkinGuide guide;
  const _GuideBody({required this.guide});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final c = guide.concern;
    final width = MediaQuery.sizeOf(context).width;
    void openAll() => context.push('/products?concernSlug=${Uri.encodeComponent(c.slug)}&title=${Uri.encodeComponent(c.name)}');
    final color = parseHex(c.color) ?? t.accent;
    final dark = Color.lerp(color, Colors.black, 0.4)!;
    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverAppBar(
          expandedHeight: 300,
          pinned: true,
          stretch: true,
          backgroundColor: dark,
          foregroundColor: Colors.white,
          automaticallyImplyLeading: false,
          leadingWidth: 60,
          leading: const Padding(
            padding: EdgeInsetsDirectional.only(start: 8),
            child: Center(child: BeautyBackButton()),
          ),
          actions: [
            BeautyShareButton(url: AppConfig.webUrl('/skin-guide/${Uri.encodeComponent(c.slug)}'), title: c.name),
            const SizedBox(width: 8),
          ],
          title: CollapsingTitle(
            child: Text(c.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.title3.copyWith(color: Colors.white)),
          ),
          flexibleSpace: FlexibleSpaceBar(
            collapseMode: CollapseMode.parallax,
            stretchModes: const [StretchMode.zoomBackground],
            background: Stack(
              fit: StackFit.expand,
              children: [
                if (c.imageUrl != null)
                  AppNetworkImage(url: c.imageUrl!, width: width, fit: BoxFit.cover)
                else
                  DecoratedBox(
                    decoration: BoxDecoration(gradient: LinearGradient(colors: [color, dark])),
                    child: Center(child: Text(c.icon ?? '✨', style: const TextStyle(fontSize: 96))),
                  ),
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: const [0.3, 1],
                      colors: [Colors.black.withValues(alpha: 0.05), dark.withValues(alpha: 0.95)],
                    ),
                  ),
                ),
                const TopScrim(),
                PositionedDirectional(
                  start: 20,
                  end: 20,
                  bottom: 22,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.beautySkinGuide, style: AppText.micro.copyWith(color: Colors.white.withValues(alpha: 0.8))),
                      const SizedBox(height: 4),
                      Text('${c.icon != null ? '${c.icon} ' : ''}${c.name}', maxLines: 2, overflow: TextOverflow.ellipsis,
                          style: AppText.display.copyWith(color: Colors.white)),
                      if (c.subtitle != null)
                        Text(c.subtitle!, maxLines: 2, overflow: TextOverflow.ellipsis, style: AppText.bodySmall.copyWith(color: Colors.white.withValues(alpha: 0.9))),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: [
                          if (guide.productTotal > 0) _HeroChip(s.beautyProductsToTreat(guide.productTotal)),
                          if (guide.routines.isNotEmpty) _HeroChip(s.beautySuggestedRoutines(guide.routines.length)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        if (c.description.isNotEmpty)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(20), boxShadow: t.cardShadow),
                child: Text(c.description, style: AppText.body.copyWith(color: t.inkSoft)),
              ),
            ),
          ),
        if (c.tips.isNotEmpty) ...[
          SliverToBoxAdapter(child: AppSectionTitle(title: s.beautyTipsTitle)),
          SliverList.builder(
            itemCount: c.tips.length,
            itemBuilder: (_, i) => Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(18), border: Border.all(color: t.hairline)),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                      child: Text('${i + 1}', style: AppText.label.copyWith(color: Colors.white)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Text(c.tips[i], style: AppText.body.copyWith(color: t.ink, height: 1.5))),
                  ],
                ),
              ),
            ),
          ),
        ],
        if (c.causes.isNotEmpty)
          SliverToBoxAdapter(
            child: _ListCard(title: s.beautyCausesTitle, items: c.causes, dot: color),
          ),
        if (c.ingredients.isNotEmpty || c.avoid.isNotEmpty)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(20), boxShadow: t.cardShadow),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (c.ingredients.isNotEmpty) ...[
                      Text(s.beautyIngredientsTitle, style: AppText.title3.copyWith(color: t.ink)),
                      Text(s.beautyIngredientsHint, style: AppText.caption.copyWith(color: t.inkMuted)),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final x in c.ingredients)
                            ActionChip(
                              label: Text(x),
                              labelStyle: AppText.label.copyWith(color: AppColors.successDeep),
                              backgroundColor: AppColors.successSoft,
                              side: BorderSide.none,
                              shape: const StadiumBorder(),
                              onPressed: () {
                                HapticFeedback.selectionClick();
                                context.push('/search?q=${Uri.encodeComponent(x)}');
                              },
                            ),
                        ],
                      ),
                    ],
                    if (c.ingredients.isNotEmpty && c.avoid.isNotEmpty) const SizedBox(height: 16),
                    if (c.avoid.isNotEmpty) ...[
                      Text(s.beautyAvoidTitle, style: AppText.title3.copyWith(color: t.ink)),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final x in c.avoid)
                            Chip(
                              label: Text(x),
                              labelStyle: AppText.label.copyWith(color: AppColors.danger),
                              backgroundColor: AppColors.dangerSoft,
                              side: BorderSide.none,
                              shape: const StadiumBorder(),
                            ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        if (guide.routines.isNotEmpty) ...[
          SliverToBoxAdapter(
            child: AppSectionTitle(title: s.beautyRoutinesFor(c.name), subtitle: s.beautyRoutinesForSubtitle),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: guide.routines.any((p) => !p.isRoutine) ? 290 : 238,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                itemCount: guide.routines.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) {
                  final p = guide.routines[i];
                  return p.isRoutine
                      ? RoutineCard(pack: p, width: 300, height: 228)
                      : BeautyPackageCard(pack: p, width: 226, height: 280);
                },
              ),
            ),
          ),
        ],
        if (guide.products.isNotEmpty) ...[
          SliverToBoxAdapter(
            child: AppSectionTitle(
              title: s.beautyProductsFor(c.name),
              actionLabel: guide.productTotal > guide.products.length ? s.beautySeeAllCount(guide.productTotal) : null,
              onAction: openAll,
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverGrid(
              gridDelegate: ProductGrid.delegateFor(context, listing: true),
              delegate: SliverChildBuilderDelegate(
                (_, i) => ProductCard(product: guide.products[i], style: ProductCardStyle.listing),
                childCount: guide.products.length,
              ),
            ),
          ),
          if (guide.productTotal > guide.products.length)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                child: OutlinedButton(
                  onPressed: openAll,
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                    side: BorderSide(color: color),
                    foregroundColor: dark,
                    shape: const StadiumBorder(),
                  ),
                  child: Text(s.beautyShowAllProducts(guide.productTotal)),
                ),
              ),
            ),
        ],
        if (!c.hasGuide && guide.products.isEmpty && guide.routines.isEmpty)
          SliverToBoxAdapter(
            child: EmptyState(icon: Icons.spa_outlined, title: s.beautyConcernComingTitle, subtitle: s.beautyConcernComingSubtitle),
          ),
        if (guide.others.isNotEmpty) ...[
          SliverToBoxAdapter(child: AppSectionTitle(title: s.beautyOtherConcerns)),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 176,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                itemCount: guide.others.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) => SkinConcernCard(
                  concern: guide.others[i],
                  width: 132,
                  height: 166,
                  onTap: () => context.pushReplacement('/skin-guide/${Uri.encodeComponent(guide.others[i].slug)}'),
                ),
              ),
            ),
          ),
        ],
        const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.fromLTRB(16, 20, 16, 0), child: SkinQuizBanner())),
        SliverToBoxAdapter(child: SizedBox(height: 32 + MediaQuery.paddingOf(context).bottom)),
      ],
    );
  }
}

class _HeroChip extends StatelessWidget {
  final String text;
  const _HeroChip(this.text);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(AppCorners.pill)),
        child: Text(text, style: AppText.micro.copyWith(color: Colors.white)),
      );
}

class _ListCard extends StatelessWidget {
  final String title;
  final List<String> items;
  final Color dot;
  const _ListCard({required this.title, required this.items, required this.dot});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(20), boxShadow: t.cardShadow),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: AppText.title3.copyWith(color: t.ink)),
            const SizedBox(height: 10),
            for (final x in items)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      margin: const EdgeInsets.only(top: 8),
                      decoration: BoxDecoration(color: dot, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 10),
                    Expanded(child: Text(x, style: AppText.body.copyWith(color: t.inkSoft, height: 1.5))),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
