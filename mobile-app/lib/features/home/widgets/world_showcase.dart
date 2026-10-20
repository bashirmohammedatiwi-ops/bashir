import 'dart:async';
import 'dart:ui' show ImageFilter;

import 'package:flutter/foundation.dart' show defaultTargetPlatform;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/motion/app_motion.dart';
import '../../../core/motion/offscreen_pause.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/perf/device_perf.dart';
import '../../../core/utils/support_links.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/store_world.dart';
import '../../auth/auth_provider.dart';
import '../../cart/cart_provider.dart';
import '../../profile/profile_providers.dart';
import '../../shell/nav_tabs.dart';
import '../../worlds/world_icon.dart';
import '../../worlds/world_theme.dart';
import '../../worlds/worlds_provider.dart';
import '../../../core/brand/brand_logo.dart';

/// نصوص رأس الرئيسية في هذا الملف.
extension _WorldShowcaseStrings on AppStrings {
  String get storeName => isAr ? 'ديما الحياة' : 'Deema Alhayat';
  String searchForHint(String name) =>
      isAr ? 'ابحثي عن $name…' : 'Search $name…';

  /// وصف زر الإشعارات مع عدد غير المقروء: «الإشعارات، 3 جديدة».
  String unreadBadge(String label, int n) =>
      isAr ? '$label، $n جديدة' : '$label, $n new';

  /// وصف زر السلة مع عدد الأصناف: «سلة التسوّق، 3 أصناف».
  String cartItemsBadge(String label, int n) => isAr
      ? '$label، ${n == 1 ? 'صنف واحد' : n == 2 ? 'صنفان' : n <= 10 ? '$n أصناف' : '$n صنفاً'}'
      : '$label, $n ${n == 1 ? 'item' : 'items'}';
}

/// لون الكتلة العلوية — أعمق قليلاً من لون العالم.
Color worldBandColor(StoreWorld w) => Color.lerp(w.accent, Colors.black, 0.1)!;

/// الكتلة العلوية بلون العالم:
/// شريط علوي مضغوط بلون العالم: تحية + أزرار زجاجية + شعار.
class WorldHeroBand extends ConsumerWidget {
  final StoreWorld world;
  const WorldHeroBand({super.key, required this.world});

  static const double sheetOverlap = 30;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final top = MediaQuery.paddingOf(context).top;
    // الاسم والحالة فقط — لا إعادة بناء للكتلة مع كل تحديث آخر لحالة الحساب.
    final signedIn = ref.watch(authProvider.select((a) => a.isAuthenticated));
    final userName = ref.watch(authProvider.select((a) => a.user?.name));
    final unread = signedIn ? ref.watch(unreadNotificationsCountProvider) : 0;
    // عدد الأصناف (المنتجات/الألوان المختلفة) لا مجموع القطع.
    final cartLines = ref.watch(cartProvider.select((c) => c.items.length));
    final whatsapp = ref.watch(storeSettingsProvider)?.whatsapp;
    final firstName = (userName ?? '').trim().split(' ').first;
    final base = worldBandColor(world);

    return AnimatedContainer(
      duration: MediaQuery.disableAnimationsOf(context)
          ? Duration.zero
          : const Duration(milliseconds: 450),
      curve: Curves.easeOutCubic,
      decoration: BoxDecoration(
        // توهّج ناعم من الزاوية العليا — عمق بدل لون مسطّح.
        gradient: RadialGradient(
          center: const AlignmentDirectional(
            0.9,
            -1.1,
          ).resolve(Directionality.of(context)),
          radius: 1.35,
          colors: [
            Color.lerp(base, Colors.white, 0.16)!,
            base,
            Color.lerp(base, Colors.black, 0.14)!,
          ],
          stops: const [0.0, 0.55, 1.0],
        ),
      ),
      padding: EdgeInsets.only(
        top: top + 4,
        bottom: WorldHeroBand.sheetOverlap + 16,
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                child: Row(
                  children: [
                    _GlassCircle(
                      label: s.myAccount,
                      child: const Icon(
                        Icons.person_outline_rounded,
                        color: Colors.white,
                        size: 21,
                      ),
                      onTap: () => openMainTab(
                        context,
                        ProviderScope.containerOf(context, listen: false),
                        NavTabs.account,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            s.greetingForHour(DateTime.now().hour),
                            style: AppText.caption.copyWith(
                              color: Colors.white.withValues(alpha: 0.75),
                              height: 1.2,
                            ),
                          ),
                          Text(
                            firstName.isNotEmpty ? firstName : s.storeName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppText.title3.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              height: 1.25,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (whatsapp != null && whatsapp.isNotEmpty) ...[
                      _GlassCircle(
                        label: s.whatsappSupport,
                        child: const Icon(
                          Icons.chat_bubble_outline_rounded,
                          color: Colors.white,
                          size: 19,
                        ),
                        onTap: () => openWhatsApp(
                          whatsapp,
                          message: s.whatsappHelpMessage,
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    _GlassCircle(
                      label: s.notifications,
                      badge: unread,
                      child: const Icon(
                        Icons.notifications_none_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                      onTap: () => context.push('/notifications'),
                    ),
                    const SizedBox(width: 8),
                    // وصول سريع للسلة من الرئيسية مع عدد الأصناف.
                    _GlassCircle(
                      label: s.cartTitle,
                      badge: cartLines,
                      badgeLabel: s.cartItemsBadge(s.cartTitle, cartLines),
                      bump: true,
                      child: const HugeIcon(
                        icon: HugeIcons.strokeRoundedShoppingBag02,
                        color: Colors.white,
                        size: 20,
                        strokeWidth: 1.7,
                      ),
                      onTap: () => openCartTab(
                        context,
                        ProviderScope.containerOf(context, listen: false),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const BrandMark(
                      height: 38,
                      color: Colors.white,
                      weight: 0.8,
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

/// البحث في رأس الورقة البيضاء: حبة رمادية فاتحة + مربع أبيض لمسح الباركود.
///
/// التلميح يتناوب بين أقسام العالم، ولمسة الحبة تحمل القسم المعروض لحظتها إلى
/// شاشة البحث (`?hint=`) — فلا يضيع الإلهام في بحث فارغ.
class _SheetSearch extends ConsumerStatefulWidget {
  final Color accent;
  final String worldSlug;
  const _SheetSearch({required this.accent, required this.worldSlug});

  @override
  ConsumerState<_SheetSearch> createState() => _SheetSearchState();
}

class _SheetSearchState extends ConsumerState<_SheetSearch> {
  /// التلميح الظاهر الآن — يملكه البحث ليعرف ما رأته الزبونة عند اللمس.
  final _hintIndex = ValueNotifier<int>(0);

  @override
  void didUpdateWidget(covariant _SheetSearch oldWidget) {
    super.didUpdateWidget(oldWidget);
    // عالم جديد = أقسام جديدة: نبدأ من التلميح العام.
    if (oldWidget.worldSlug != widget.worldSlug) _hintIndex.value = 0;
  }

  @override
  void dispose() {
    _hintIndex.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final s = ref.s;
    final lang = ref.watch(languageCodeProvider);
    // اقتراحات متناوبة من أقسام العالم الحالي — البحث يلهم بدل أن ينتظر.
    final cats =
        ref
            .watch(worldDetailProvider(widget.worldSlug))
            .valueOrNull
            ?.categories ??
        const [];
    final names = [
      for (final c in cats.take(6))
        if (c.localizedName(lang).trim().isNotEmpty)
          c.localizedName(lang).trim(),
    ];
    final hints = <String>[
      s.searchHintHome,
      for (final n in names) s.searchForHint(n),
    ];

    void openSearch() {
      HapticFeedback.selectionClick();
      final i = _hintIndex.value % hints.length;
      // التلميح الأول عام؛ ما بعده اسم قسم يُثبَّت أولاً في اقتراحات البحث.
      context.push(
        i == 0
            ? '/search'
            : '/search?hint=${Uri.encodeComponent(names[i - 1])}',
      );
    }

    return Semantics(
      button: true,
      label: s.searchHintHome,
      child: GestureDetector(
        onTap: openSearch,
        child: Container(
          height: 56,
          padding: const EdgeInsetsDirectional.fromSTEB(16, 6, 6, 6),
          decoration: BoxDecoration(
            color: Color.alphaBlend(t.ink.withValues(alpha: 0.045), t.surface),
            borderRadius: BorderRadius.circular(AppCorners.lg),
          ),
          child: Row(
            children: [
              Icon(Icons.search_rounded, color: t.ink, size: 24),
              const SizedBox(width: 10),
              Expanded(
                child: ExcludeSemantics(
                  child: _RotatingHint(
                    key: ValueKey(widget.worldSlug),
                    hints: hints,
                    index: _hintIndex,
                    style: AppText.bodySmall.copyWith(
                      color: t.inkMuted,
                      fontSize: 14,
                      height: 1.2,
                    ),
                  ),
                ),
              ),
              Semantics(
                button: true,
                label: s.scanBarcode,
                child: GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    context.push('/scan');
                  },
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: t.surface,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: t.ink.withValues(alpha: 0.07),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.qr_code_scanner_rounded,
                      color: widget.accent,
                      size: 22,
                    ),
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

/// نص يتبدّل كل بضع ثوانٍ بانزلاق ناعم للأعلى — والفهرس في [index] يملكه الأب.
/// مع «تقليل الحركة» يثبت على التلميح الأول.
class _RotatingHint extends StatefulWidget {
  final List<String> hints;
  final ValueNotifier<int> index;
  final TextStyle style;
  const _RotatingHint({
    super.key,
    required this.hints,
    required this.index,
    required this.style,
  });

  @override
  State<_RotatingHint> createState() => _RotatingHintState();
}

class _RotatingHintState extends State<_RotatingHint> with MotionGateMixin {
  Timer? _timer;
  bool _still = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _still = MediaQuery.disableAnimationsOf(context);
    if (_still) widget.index.value = 0;
    _sync();
  }

  @override
  void onMotionGateChanged(bool allowed) => _sync();

  @override
  void didUpdateWidget(_RotatingHint old) {
    super.didUpdateWidget(old);
    if (old.hints.length != widget.hints.length) _sync();
  }

  /// المؤقّت يعمل فقط والحقل ظاهر، والتبويب ظاهر، والشاشة في الأعلى، والصفحة
  /// ساكنة — لا تبديل (ولا إطارات انتقال) والرأس خارج الشاشة أو تحت شاشة أخرى.
  void _sync() {
    final run = !_still && motionAllowed && widget.hints.length >= 2;
    if (!run) {
      _timer?.cancel();
      _timer = null;
      return;
    }
    _timer ??= Timer.periodic(const Duration(milliseconds: 3200), (_) {
      if (!mounted || widget.hints.length < 2 || !motionAllowed) return;
      widget.index.value = (widget.index.value + 1) % widget.hints.length;
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final still = MediaQuery.disableAnimationsOf(context);
    // الأجهزة البسيطة: انزلاق كامل بلا تلاشٍ (لا طبقة شفافية لكل تبديل).
    final low = DevicePerf.isLow;
    final travel = low ? 1.0 : 0.6;
    return ValueListenableBuilder<int>(
      valueListenable: widget.index,
      builder: (context, i, _) {
        final text = widget.hints[i % widget.hints.length];
        return ClipRect(
          child: AnimatedSwitcher(
            duration: still ? Duration.zero : const Duration(milliseconds: 420),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            layoutBuilder: (current, previous) => Stack(
              alignment: AlignmentDirectional.centerStart,
              children: [...previous, if (current != null) current],
            ),
            transitionBuilder: (child, a) {
              final incoming = child.key == ValueKey(text);
              return FadeTransition(
                opacity: low ? kAlwaysCompleteAnimation : a,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: Offset(0, incoming ? travel : -travel),
                    end: Offset.zero,
                  ).animate(a),
                  child: child,
                ),
              );
            },
            child: Text(
              text,
              key: ValueKey(text),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: widget.style,
            ),
          ),
        );
      },
    );
  }
}

/// زر زجاجي دائري في رأس العالم — باسم مسموع لقارئ الشاشة ومعه عدد الشارة.
class _GlassCircle extends ConsumerWidget {
  final Widget child;
  final VoidCallback onTap;
  final String label;
  final int badge;

  /// وصف بديل للشارة لقارئ الشاشة (افتراضياً «n جديدة»).
  final String? badgeLabel;

  /// نبضة الشارة حين يزيد العدد (السلة).
  final bool bump;
  const _GlassCircle({
    required this.child,
    required this.onTap,
    required this.label,
    this.badge = 0,
    this.badgeLabel,
    this.bump = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Semantics(
      button: true,
      label: badge > 0 ? (badgeLabel ?? ref.s.unreadBadge(label, badge)) : label,
      excludeSemantics: true,
      onTap: onTap,
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
              ),
              alignment: Alignment.center,
              child: child,
            ),
            if (badge > 0)
              PositionedDirectional(
                top: -2,
                end: -2,
                child: bump
                    ? BadgeBump(value: badge, child: CountBadge(count: badge))
                    : CountBadge(count: badge),
              ),
          ],
        ),
      ),
    );
  }
}

/// رأس الورقة البيضاء: مقبض + محدّد العوالم (بلا عنوان).
class WorldSheetTop extends StatelessWidget {
  final List<StoreWorld> worlds;
  final StoreWorld current;
  const WorldSheetTop({super.key, required this.worlds, required this.current});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 10),
        Center(
          child: Container(
            width: 40,
            height: 4.5,
            decoration: BoxDecoration(
              color: t.hairline,
              borderRadius: BorderRadius.circular(5),
            ),
          ),
        ),
        const SizedBox(height: 14),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _SheetSearch(
            accent: worldBandColor(current),
            worldSlug: current.slug,
          ),
        ),
        const SizedBox(height: 14),
        // عالم الهدايا لا يظهر في المحدّد إلا حين يكون مفتوحاً — فيُرى مختاراً.
        WorldSegments(
          worlds: [
            ...worlds,
            if (current.isGift && !worlds.any((w) => w.slug == current.slug))
              current,
          ],
          selectedSlug: current.slug,
        ),
      ],
    );
  }
}

/// عدد أقسام العالم تحت اسمه — قبل وصول البيانات سطر فارغ يحفظ الارتفاع بدل «0 أقسام».
String _sectionsLabel(AppStrings s, int n) => n <= 0 ? ' ' : s.sectionCount(n);

/// محدّد العوالم على عرض الشاشة: حاوية رمادية ناعمة، والمختار يمتلئ بلون عالمه.
class WorldSegments extends ConsumerWidget {
  final List<StoreWorld> worlds;

  /// العالم المختار — null يعني لا شيء مختار (مثل "كل الأقسام" في صفحة الأقسام).
  final String? selectedSlug;

  /// افتراضياً يغيّر عالم التطبيق كله؛ صفحة الأقسام تمرّر تصفية محلية بدلاً منه.
  final ValueChanged<String>? onSelect;

  /// حشوة جانبية حول المحدّد.
  final double inset;

  const WorldSegments({
    super.key,
    required this.worlds,
    required this.selectedSlug,
    this.onSelect,
    this.inset = 16,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;
    final t = context.worldTheme;
    // عوالم الهدايا تُعرض فقط وهي المختارة — حتى يرى الزبون أين هو.
    final list = worlds
        .where((w) => !w.isGift || w.slug == selectedSlug)
        .toList();
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: inset),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Color.alphaBlend(t.ink.withValues(alpha: 0.04), t.surface),
          borderRadius: BorderRadius.circular(22),
        ),
        child: Row(
          children: [
            for (final w in list)
              Expanded(
                child: _Segment(
                  world: w,
                  name: w.localizedName(lang),
                  subtitle: _sectionsLabel(
                    s,
                    ref
                            .watch(worldDetailProvider(w.slug))
                            .valueOrNull
                            ?.categories
                            .length ??
                        0,
                  ),
                  selected: w.slug == selectedSlug,
                  ink: t.ink,
                  inkMuted: t.inkMuted,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    if (onSelect != null) {
                      onSelect!(w.slug);
                      return;
                    }
                    if (w.slug == selectedSlug) return;
                    ref.read(selectedWorldSlugProvider.notifier).state = w.slug;
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Segment extends StatelessWidget {
  final StoreWorld world;
  final String name;
  final String subtitle;
  final bool selected;
  final Color ink;
  final Color inkMuted;
  final VoidCallback onTap;

  const _Segment({
    required this.world,
    required this.name,
    required this.subtitle,
    required this.selected,
    required this.ink,
    required this.inkMuted,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = worldBandColor(world);
    final still = MediaQuery.disableAnimationsOf(context);
    Duration ms(int v) => still ? Duration.zero : Duration(milliseconds: v);
    return Semantics(
      button: true,
      selected: selected,
      label: name,
      excludeSemantics: true,
      onTap: onTap,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: ms(320),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.fromLTRB(4, 8, 4, 7),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            gradient: selected
                ? LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color.lerp(c, Colors.white, 0.16)!, c],
                  )
                : null,
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: c.withValues(alpha: 0.38),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // الأيقونة بألوانها مباشرة — تكبر قليلاً وتطفو بظل ناعم عند الاختيار.
              AnimatedScale(
                scale: selected ? 1.12 : 1.0,
                duration: ms(320),
                curve: Curves.easeOutBack,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    boxShadow: selected
                        ? [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.18),
                              blurRadius: 12,
                              offset: const Offset(0, 5),
                            ),
                          ]
                        : null,
                    shape: BoxShape.circle,
                  ),
                  child: SizedBox.square(
                    dimension: 32,
                    child: Stack(
                      children: [
                        AnimatedOpacity(
                          opacity: selected ? 0 : 1,
                          duration: ms(280),
                          child: WorldIcon(slug: world.slug, size: 32),
                        ),
                        AnimatedOpacity(
                          opacity: selected ? 1 : 0,
                          duration: ms(280),
                          child: WorldIcon(
                            slug: world.slug,
                            size: 32,
                            white: true,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 4),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  name,
                  maxLines: 1,
                  style: AppText.label.copyWith(
                    fontWeight: FontWeight.w900,
                    fontSize: 12.5,
                    height: 1.15,
                    color: selected ? Colors.white : ink,
                  ),
                ),
              ),
              Text(
                subtitle,
                maxLines: 1,
                style: AppText.micro.copyWith(
                  fontSize: 10,
                  height: 1.1,
                  fontWeight: FontWeight.w600,
                  color: selected
                      ? Colors.white.withValues(alpha: 0.85)
                      : inkMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// شريط العوالم المصغّر: يظهر أعلى الرئيسية عند التمرير بعيداً عن المحدّد الكبير.
/// زجاج فاتح، حبّات صغيرة (أيقونة + اسم)، والمختار بتدرّج لون عالمه — مع زر بحث سريع.
class StickyWorldsBar extends ConsumerWidget {
  final List<StoreWorld> worlds;
  final String? currentSlug;
  final VoidCallback? onWorldChanged;

  const StickyWorldsBar({
    super.key,
    required this.worlds,
    required this.currentSlug,
    this.onWorldChanged,
  });

  static const height = 56.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;
    final top = MediaQuery.paddingOf(context).top;
    // عالم الهدايا يظهر مختاراً فقط حين يكون مفتوحاً.
    final list = worlds
        .where((w) => !w.isGift || w.slug == currentSlug)
        .toList();
    // ضبابية الخلفية مكلفة على أندرويد أثناء التمرير: هناك سطح شبه مصمت بلا ضبابية.
    // وكذلك على أي جهاز بسيط.
    final blur =
        defaultTargetPlatform == TargetPlatform.iOS && !DevicePerf.isLow;

    final bar = Container(
      padding: EdgeInsets.fromLTRB(12, top + 2, 12, 8),
      decoration: BoxDecoration(
        color: t.surface.withValues(alpha: blur ? 0.86 : 0.97),
        border: Border(
          bottom: BorderSide(color: t.hairline.withValues(alpha: 0.7)),
        ),
        boxShadow: [
          BoxShadow(
            color: t.accentDark.withValues(alpha: 0.07),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: SizedBox(
        height: height - 10,
        child: Row(
          children: [
            for (final w in list)
              Expanded(
                // المختار يتمدّد بأيقونته واسمه، والبقية أيقونات — نفس لغة شريط التنقل.
                flex: w.slug == currentSlug ? 20 : 8,
                child: _MiniWorld(
                  world: w,
                  name: w.localizedName(lang),
                  selected: w.slug == currentSlug,
                  ink: t.ink,
                  onTap: () {
                    if (w.slug == currentSlug) return;
                    HapticFeedback.selectionClick();
                    ref.read(selectedWorldSlugProvider.notifier).state = w.slug;
                    onWorldChanged?.call();
                  },
                ),
              ),
            const SizedBox(width: 6),
            Semantics(
              button: true,
              label: s.searchShort,
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  context.push('/search');
                },
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: t.accentLight,
                    border: Border.all(color: t.accentSoft),
                  ),
                  child: Icon(
                    Icons.search_rounded,
                    size: 21,
                    color: t.accentDark,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
    if (!blur) return bar;
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
        child: bar,
      ),
    );
  }
}

class _MiniWorld extends StatelessWidget {
  final StoreWorld world;
  final String name;
  final bool selected;
  final Color ink;
  final VoidCallback onTap;

  const _MiniWorld({
    required this.world,
    required this.name,
    required this.selected,
    required this.ink,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = worldBandColor(world);
    final still = MediaQuery.disableAnimationsOf(context);
    return Semantics(
      button: true,
      selected: selected,
      label: name,
      excludeSemantics: true,
      onTap: onTap,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: still ? Duration.zero : const Duration(milliseconds: 320),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 2),
          padding: const EdgeInsets.symmetric(horizontal: 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            gradient: selected
                ? LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color.lerp(c, Colors.white, 0.16)!, c],
                  )
                : null,
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: c.withValues(alpha: 0.32),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox.square(
                dimension: 26,
                child: AnimatedSwitcher(
                  duration: still
                      ? Duration.zero
                      : const Duration(milliseconds: 260),
                  child: WorldIcon(
                    key: ValueKey(selected),
                    slug: world.slug,
                    size: 26,
                    white: selected,
                  ),
                ),
              ),
              if (selected) ...[
                const SizedBox(width: 6),
                Flexible(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      name,
                      maxLines: 1,
                      style: AppText.label.copyWith(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        height: 1,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
