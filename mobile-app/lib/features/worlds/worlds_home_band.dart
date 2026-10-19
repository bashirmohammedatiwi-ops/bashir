import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/motion/app_motion.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/theme/app_fonts.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/store_world.dart';
import '../shell/main_shell.dart' show homeScrollToTopProvider;
import '../shell/nav_tabs.dart';
import 'world_icon.dart';
import 'world_strings.dart';
import 'world_theme.dart';
import 'worlds_provider.dart';

/// نطاقات الهدايا حين لا يحدد العالم نطاقاته — أول ثلاثة من رفّ «تسوّقي حسب ميزانيتكِ».
const List<({int? min, int? max})> _defaultGiftTiers = [
  (min: null, max: 10000),
  (min: 10000, max: 25000),
  (min: 25000, max: 50000),
];

/// بطاقة عالم الهدايا أسفل الرئيسية: لمسة البطاقة تنقل إليه وتعود لأعلى الصفحة
/// (حتى يُرى العالم من بدايته)، وشرائح الميزانية تفتح الهدايا بنطاق السعر مباشرة.
///
/// [currentSlug] العالم الذي تُعرض فيه البطاقة (تختفي داخل عالم الهدايا نفسه)؛
/// يثبّته للطبقة الخارجة أثناء تبديل العالم. بدونه: العالم المختار.
class GiftWorldHomeCard extends ConsumerWidget {
  final String? currentSlug;

  const GiftWorldHomeCard({super.key, this.currentSlug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;
    final worlds = ref.watch(worldsProvider).valueOrNull ?? const <StoreWorld>[];
    final gift = worlds.where((world) => world.isGift).firstOrNull;
    if (gift == null) return const SizedBox.shrink();
    final current = currentSlug ?? ref.watch(selectedWorldSlugProvider);
    if (current == gift.slug) return const SizedBox.shrink();

    final detailTiers = ref.watch(worldDetailProvider(gift.slug)).valueOrNull?.budgetTiers ?? const [];
    final tiers = (detailTiers.isNotEmpty
            ? detailTiers
            : gift.budgetTiers.isNotEmpty
                ? gift.budgetTiers
                : _defaultGiftTiers)
        .take(3)
        .toList();
    final tagline = gift.localizedTagline(lang);

    void openGiftWorld() {
      AppHaptics.select();
      ref.read(selectedWorldSlugProvider.notifier).state = gift.slug;
      // البطاقة في آخر الصفحة: نعود لأعلاها فيظهر العالم الجديد من بدايته.
      ref.read(homeScrollToTopProvider.notifier).state++;
    }

    void openBudget(({int? min, int? max}) tier) {
      AppHaptics.select();
      final q = <String>[
        if (tier.min != null) 'minPrice=${tier.min}',
        if (tier.max != null) 'maxPrice=${tier.max}',
        'world=${Uri.encodeComponent(gift.slug)}',
        'title=${Uri.encodeComponent(s.worldGiftBudgetTitle(tier.min, tier.max))}',
      ].join('&');
      context.push('/products?$q');
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
      child: Material(
        color: gift.canvas,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppCorners.lg),
          side: BorderSide(color: gift.accent.withValues(alpha: 0.35)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            // زخرفة زاوية ناعمة بلون العالم — عمق دون تشويش.
            PositionedDirectional(
              top: -26,
              end: -22,
              child: IgnorePointer(
                child: Container(
                  width: 110,
                  height: 110,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        gift.accent.withValues(alpha: 0.20),
                        gift.accent.withValues(alpha: 0.0),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Semantics(
                  button: true,
                  label: gift.localizedName(lang),
                  hint: tagline.isEmpty ? s.worldGiftPromise : '$tagline. ${s.worldGiftPromise}',
                  excludeSemantics: true,
                  child: InkWell(
                    onTap: openGiftWorld,
                    child: Padding(
                      padding: const EdgeInsetsDirectional.fromSTEB(14, 13, 14, 10),
                      child: Row(
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                begin: AlignmentDirectional.topStart,
                                end: AlignmentDirectional.bottomEnd,
                                colors: [
                                  Colors.white,
                                  Color.lerp(gift.accent, Colors.white, 0.82)!,
                                ],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: gift.accent.withValues(alpha: 0.28),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Center(child: WorldIcon(slug: gift.slug, size: 26)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  gift.localizedName(lang),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppText.title3.copyWith(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: tracking(lang, -0.2),
                                    color: gift.ink,
                                  ),
                                ),
                                if (tagline.isNotEmpty)
                                  Text(
                                    tagline,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppText.caption.copyWith(
                                      fontWeight: FontWeight.w600,
                                      color: gift.ink.withValues(alpha: 0.6),
                                    ),
                                  ),
                                const SizedBox(height: 3),
                                Row(
                                  children: [
                                    Icon(Icons.card_giftcard_rounded, size: 13, color: gift.ink.withValues(alpha: 0.7)),
                                    const SizedBox(width: 4),
                                    Flexible(
                                      child: Text(
                                        s.worldGiftPromise,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: AppText.micro.copyWith(color: gift.ink.withValues(alpha: 0.75)),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            width: 30,
                            height: 30,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: gift.accent.withValues(alpha: 0.12),
                            ),
                            child: Icon(Icons.arrow_forward_rounded, size: 17, color: gift.ink),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(14, 0, 14, 13),
                  child: Row(
                    children: [
                      for (var i = 0; i < tiers.length; i++) ...[
                        if (i > 0) const SizedBox(width: 8),
                        Expanded(
                          child: _GiftBudgetChip(
                            label: s.worldBudgetChip(tiers[i].min, tiers[i].max),
                            semanticLabel: s.worldGiftBudgetTitle(tiers[i].min, tiers[i].max),
                            world: gift,
                            onTap: () => openBudget(tiers[i]),
                          ),
                        ),
                      ],
                    ],
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

/// شريحة ميزانية بيضاء بحافة بلون العالم — تصغر لتتّسع مع تكبير الخط.
class _GiftBudgetChip extends StatelessWidget {
  final String label;
  final String semanticLabel;
  final StoreWorld world;
  final VoidCallback onTap;

  const _GiftBudgetChip({
    required this.label,
    required this.semanticLabel,
    required this.world,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final shape = StadiumBorder(side: BorderSide(color: world.accent.withValues(alpha: 0.4)));
    return Semantics(
      button: true,
      label: semanticLabel,
      excludeSemantics: true,
      child: Material(
        color: world.surface,
        shape: shape,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          customBorder: shape,
          onTap: onTap,
          child: SizedBox(
            height: kMinTapTarget,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Center(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    label,
                    maxLines: 1,
                    style: AppText.label.copyWith(fontSize: 12.5, color: world.ink),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// براندات العالم تحت الأقسام، ببطاقات بيضاء مثل المرجع.
///
/// [slug] يثبّت العالم (للطبقة الخارجة أثناء التبديل). بدونه: العالم المختار.
class WorldHomeBrands extends ConsumerWidget {
  final String? slug;

  const WorldHomeBrands({super.key, this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slug = this.slug ?? ref.watch(selectedWorldSlugProvider);
    if (slug == null) return const SizedBox.shrink();
    final s = ref.s;
    final theme = ref.watch(activeWorldThemeProvider);
    final brands =
        ref.watch(worldFeedProvider(slug)).valueOrNull?.brands ?? const [];
    if (brands.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(
          title: s.worldOurBrands,
          actionLabel: s.viewAll,
          // تبديل تبويب البراندات — دفع «/brands» كان يكدّس نسخة ثانية من التطبيق.
          onAction: () => openMainTab(context, ProviderScope.containerOf(context, listen: false), NavTabs.brands),
        ),
        SizedBox(
          height: 100,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: brands.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) {
              final brand = brands[i];
              return _HomeBrandPill(
                name: brand.label,
                logoUrl: brand.logoUrl,
                ring: theme.hairline,
                ink: theme.ink,
                onTap: () => context.push(
                  '/brand/${Uri.encodeComponent(brand.slug.isNotEmpty ? brand.slug : brand.id)}',
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

/// دائرة براند بيضاء بحلقة مزدوجة وظل منخفض — أهدأ من بطاقة المنتج.
class _HomeBrandPill extends StatelessWidget {
  final String name;
  final String logoUrl;
  final Color ring;
  final Color ink;
  final VoidCallback onTap;

  const _HomeBrandPill({
    required this.name,
    required this.logoUrl,
    required this.ring,
    required this.ink,
    required this.onTap,
  });

  /// تباعد الحروف للاسم اللاتيني فقط — يفصل الحروف العربية المتصلة.
  static final _arabic = RegExp(r'[\u0600-\u06FF]');

  @override
  Widget build(BuildContext context) {
    final latin = !_arabic.hasMatch(name);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(40),
      child: SizedBox(
        width: 72,
        child: Column(
          children: [
            Container(
              width: 62,
              height: 62,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
                border: Border.all(color: ring),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x12000000),
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                  BoxShadow(
                    color: Color(0x0A000000),
                    blurRadius: 3,
                    offset: Offset(0, 1),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              alignment: Alignment.center,
              padding: const EdgeInsets.all(10),
              // بدون شعار: اسم البراند كعلامة كتابية أنيقة بدل حرف واحد.
              child: logoUrl.isEmpty
                  ? FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        name.isEmpty ? '•' : name.toUpperCase(),
                        maxLines: 2,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 11,
                          height: 1.1,
                          letterSpacing: latin ? 0.8 : 0,
                          color: ink,
                        ),
                      ),
                    )
                  : AppNetworkImage(
                      url: logoUrl,
                      fit: BoxFit.contain,
                      backgroundColor: Colors.white,
                    ),
            ),
            const SizedBox(height: 6),
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: latin ? 0.1 : 0,
                color: ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

