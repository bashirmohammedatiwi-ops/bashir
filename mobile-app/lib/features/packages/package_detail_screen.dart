import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/beauty.dart';
import '../../data/services/api_service.dart';
import '../alerts/restock_watch_provider.dart';
import '../auth/auth_provider.dart';
import '../beauty/beauty_providers.dart';
import '../beauty/beauty_strings.dart';
import '../beauty/beauty_widgets.dart';
import '../cart/cart_packages_provider.dart';
import '../worlds/world_theme.dart';

/// صفحة باقة أو روتين: الغلاف، السعر والتوفير، الخطوات/المنتجات، وإضافة الكل للسلة بسعر الباقة.
class PackageDetailScreen extends ConsumerWidget {
  final String idOrSlug;

  /// الباقة كما في البطاقة التي فُتحت منها — تُعرض فوراً والأحدث يُجلب خلفها.
  final BeautyPackage? initial;

  const PackageDetailScreen({super.key, required this.idOrSlug, this.initial});

  /// الباقة انتهت أو أُوقفت: السيرفر يعيد 404 لها.
  static bool _isGone(Object? e) => e is ApiException && e.status == 404;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final async = ref.watch(beautyPackageProvider(idOrSlug));
    // التحقق من الانتهاء قبل أي نسخة سابقة: الخطأ بعد إعادة الجلب يحتفظ بالقيمة القديمة.
    final gone = async.hasError && _isGone(async.error);
    final pack = gone ? null : (async.valueOrNull ?? initial);

    final Widget page;
    if (gone) {
      page = Scaffold(backgroundColor: t.canvas, body: const _OfferEnded());
    } else if (pack != null) {
      // خطأ شبكة مع نسخة البطاقة: نبقي الصفحة — «باقات مشابهة» فقط تنتظر الجلب.
      page = Scaffold(
        backgroundColor: t.canvas,
        body: _Body(pack: pack, idOrSlug: idOrSlug),
        bottomNavigationBar: _BuyBar(pack: pack),
      );
    } else if (async.hasError) {
      page = Scaffold(
        backgroundColor: t.canvas,
        body: SafeArea(
          child: Column(
            children: [
              const Align(
                alignment: AlignmentDirectional.centerStart,
                child: Padding(padding: EdgeInsetsDirectional.only(start: 8, top: 6), child: AppBackButton()),
              ),
              Expanded(
                child: ErrorView.from(async.error, onRetry: () => ref.invalidate(beautyPackageProvider(idOrSlug))),
              ),
            ],
          ),
        ),
      );
    } else {
      page = Scaffold(
        backgroundColor: t.canvas,
        body: Stack(
          children: [
            ListView(
              padding: EdgeInsets.zero,
              physics: const NeverScrollableScrollPhysics(),
              children: const [
                ShimmerBox(height: 320, radius: 0),
                Padding(padding: EdgeInsets.all(16), child: ShimmerBox(height: 120, radius: 20)),
                Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: ShimmerBox(height: 260, radius: 20)),
              ],
            ),
            PositionedDirectional(
              top: MediaQuery.paddingOf(context).top + 6,
              start: 8,
              child: const BeautyBackButton(),
            ),
          ],
        ),
      );
    }
    // فُتحت وحدها من رابط: رجوع النظام يفتح المتجر بدل أن يغلق التطبيق.
    return PopScope(
      canPop: GoRouter.of(context).canPop(),
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) context.go('/');
      },
      child: page,
    );
  }
}

/// العرض انتهى (رابط حملة قديم، أو انتهى والصفحة مفتوحة).
class _OfferEnded extends ConsumerWidget {
  const _OfferEnded();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    return SafeArea(
      child: Column(
        children: [
          const Align(
            alignment: AlignmentDirectional.centerStart,
            child: Padding(padding: EdgeInsetsDirectional.only(start: 8, top: 6), child: AppBackButton()),
          ),
          Expanded(
            child: EmptyState(
              icon: Icons.timer_off_outlined,
              title: s.beautyOfferEndedTitle,
              subtitle: s.beautyOfferEndedSubtitle,
              action: FilledButton(
                onPressed: () => context.go('/packages'),
                style: FilledButton.styleFrom(
                  minimumSize: const Size(200, 48),
                  backgroundColor: t.accentDark,
                  shape: const StadiumBorder(),
                ),
                child: Text(s.beautyBrowsePackages, style: AppText.title3.copyWith(color: Colors.white)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  final BeautyPackage pack;
  final String idOrSlug;
  const _Body({required this.pack, required this.idOrSlug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final colors = routineColors(pack, t);
    final concerns = ref.watch(skinConcernsListProvider).valueOrNull ?? const <SkinConcern>[];
    final myConcerns = concerns.where((c) => pack.concernSlugs.contains(c.slug)).toList();
    final profile = ref.watch(skinProfileProvider);
    final fitsMe = profile != null && pack.skinTypes.contains(profile.skinType.key);

    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverAppBar(
          expandedHeight: 330,
          pinned: true,
          stretch: true,
          backgroundColor: colors.last,
          foregroundColor: Colors.white,
          automaticallyImplyLeading: false,
          leadingWidth: 60,
          leading: const Padding(
            padding: EdgeInsetsDirectional.only(start: 8),
            child: Center(child: BeautyBackButton()),
          ),
          actions: [
            BeautyShareButton(url: AppConfig.packageShareUrl(pack.routeId), title: pack.name),
            const SizedBox(width: 8),
          ],
          title: CollapsingTitle(
            child: Text(pack.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.title3.copyWith(color: Colors.white)),
          ),
          flexibleSpace: FlexibleSpaceBar(
            stretchModes: const [StretchMode.zoomBackground],
            background: _Hero(pack: pack, colors: colors, kindLabel: s.beautyKindLabel(pack)),
          ),
        ),
        // السعر والتوفير.
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(AppCorners.lg + 2), boxShadow: t.cardShadow),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: PackagePrice(pack: pack, color: t.ink, muted: t.inkMuted, large: true)),
                      const SizedBox(width: 8),
                      SavingBadge(pack: pack, large: true),
                    ],
                  ),
                  if (pack.hasSaving) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(color: AppColors.successSoft, borderRadius: BorderRadius.circular(AppCorners.sm)),
                      child: Row(
                        children: [
                          const Text('💚', style: TextStyle(fontSize: 16)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              s.beautySavingVsSingles(formatPrice(pack.saving)),
                              style: AppText.label.copyWith(color: AppColors.successDeep),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  if (pack.endsAt != null) ...[
                    const SizedBox(height: 10),
                    // انتهى والصفحة مفتوحة: إعادة الجلب تعيد 404 فتظهر «انتهى هذا العرض».
                    AppCountdown(
                      endsAt: pack.endsAt!,
                      color: colors.last,
                      background: colors.first.withValues(alpha: 0.18),
                      onExpired: () => ref.invalidate(beautyPackageProvider(idOrSlug)),
                    ),
                  ],
                  if (fitsMe || pack.skinTypes.isNotEmpty || myConcerns.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        if (fitsMe) _Pill(s.beautyFitsYourSkin(profile.skinType), AppColors.successDeep, AppColors.successSoft),
                        if (!fitsMe)
                          for (final k in pack.skinTypes)
                            if (skinTypeFromKey(k) case final type?)
                              _Pill('${type.emoji} ${s.beautySkinOf(type)}', t.accentDark, t.accentLight),
                        for (final c in myConcerns)
                          AppTap(
                            onTap: () => openConcern(context, c),
                            radius: BorderRadius.circular(AppCorners.pill),
                            haptic: false,
                            child: _Pill('${c.icon ?? '•'} ${c.name}', t.inkSoft, t.canvasWarm),
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
        if (pack.description.isNotEmpty)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
              child: Text(pack.description, style: AppText.body.copyWith(color: t.inkSoft)),
            ),
          ),
        SliverToBoxAdapter(
          child: AppSectionTitle(
            title: pack.isRoutine ? s.beautyRoutineSteps : s.beautyBundleContents,
            subtitle: pack.isRoutine ? s.beautyLightToHeavy : s.beautyCuratedProducts(pack.stepCount),
          ),
        ),
        SliverList.builder(
          itemCount: pack.items.length,
          itemBuilder: (_, i) => _ItemRow(
            item: pack.items[i],
            index: i,
            last: i == pack.items.length - 1,
            routine: pack.isRoutine,
            color: colors.last,
          ),
        ),
        if (pack.isRoutine)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: colors.first.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(AppCorners.md + 2)),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(pack.isMorning ? '☀️' : '🌙', style: const TextStyle(fontSize: 20)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        pack.isMorning ? s.beautyMorningTip : s.beautyEveningTip,
                        style: AppText.bodySmall.copyWith(color: t.ink),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        if (pack.related.isNotEmpty) ...[
          SliverToBoxAdapter(child: AppSectionTitle(title: pack.isRoutine ? s.beautyOtherRoutines : s.beautySimilarBundles)),
          SliverToBoxAdapter(
            child: SizedBox(
              height: pack.related.every((p) => p.isRoutine) ? 238 : 290,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                itemCount: pack.related.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) {
                  final r = pack.related[i];
                  return r.isRoutine
                      ? RoutineCard(pack: r, width: 290, height: 228)
                      : BeautyPackageCard(pack: r, width: 226, height: 280);
                },
              ),
            ),
          ),
        ],
        // شريط الشراء في bottomNavigationBar — هذا هامش أخير فقط.
        const SliverToBoxAdapter(child: SizedBox(height: 24)),
      ],
    );
  }
}

class _Hero extends StatelessWidget {
  final BeautyPackage pack;
  final List<Color> colors;
  final String kindLabel;
  const _Hero({required this.pack, required this.colors, required this.kindLabel});

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    return Consumer(
      builder: (context, ref, _) {
        final s = ref.watch(stringsProvider);
        return Stack(
          fit: StackFit.expand,
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(begin: AlignmentDirectional.topStart, end: AlignmentDirectional.bottomEnd, colors: colors),
              ),
            ),
            if (pack.coverUrl != null)
              // العرض فقط: الارتفاع مع BoxFit.cover كان سيصغّر الغلاف العريض أقل مما يلزم.
              AppNetworkImage(url: pack.coverUrl!, width: width, fit: BoxFit.cover)
            else
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 76, 24, 128),
                child: Row(
                  children: [
                    for (var i = 0; i < pack.thumbs.length.clamp(0, 4); i++)
                      Expanded(
                        child: Transform.translate(
                          offset: Offset(0, i.isOdd ? 10 : -6),
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppCorners.md + 2)),
                            child: AspectRatio(
                              aspectRatio: 0.8,
                              child: AppNetworkImage(url: pack.thumbs[i], width: (width - 48) / 4, fit: BoxFit.contain),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            const TopScrim(),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  stops: const [0.58, 1],
                  colors: [Colors.transparent, colors.last.withValues(alpha: 0.95)],
                ),
              ),
            ),
            PositionedDirectional(
              start: 20,
              end: 20,
              bottom: 20,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _Pill('${routineIcon(pack)} $kindLabel • ${s.beautyPackCount(pack)}', Colors.white,
                          Colors.white.withValues(alpha: 0.22)),
                      if (pack.badge != null) _Pill(pack.badge!, colors.last, Colors.white),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(pack.name, maxLines: 3, overflow: TextOverflow.ellipsis, style: AppText.display.copyWith(color: Colors.white)),
                  if (pack.subtitle.isNotEmpty)
                    Text(pack.subtitle, maxLines: 2, overflow: TextOverflow.ellipsis,
                        style: AppText.bodySmall.copyWith(color: Colors.white.withValues(alpha: 0.9))),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _Pill extends StatelessWidget {
  final String text;
  final Color fg;
  final Color bg;
  final FontWeight? weight;
  const _Pill(this.text, this.fg, this.bg, {this.weight});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(AppCorners.pill)),
        child: Text(text, style: AppText.micro.copyWith(color: fg, fontSize: 11.5, fontWeight: weight)),
      );
}

/// خطوة روتين (رقم + خط زمني) أو منتج باقة.
class _ItemRow extends ConsumerWidget {
  final BeautyPackageItem item;
  final int index;
  final bool last;
  final bool routine;
  final Color color;
  const _ItemRow({required this.item, required this.index, required this.last, required this.routine, required this.color});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final p = item.product;
    final out = p.stock < item.quantity;
    final radius = BorderRadius.circular(AppCorners.md + 2);
    final card = AppTap(
      onTap: () => context.push('/product/${Uri.encodeComponent(p.slug.isNotEmpty ? p.slug : p.id)}'),
      radius: radius,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: t.surface, borderRadius: radius, border: Border.all(color: t.hairline)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 68,
                  height: 68,
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: t.hairline)),
                  child: AppNetworkImage(url: p.coverUrl, width: 60, fit: BoxFit.contain),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (routine && item.stepTitle != null)
                        Text(item.stepTitle!, style: AppText.micro.copyWith(color: color, fontSize: 12)),
                      if (p.brand?.name != null)
                        Text(p.brand!.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                            style: AppText.micro.copyWith(color: t.inkMuted, fontWeight: FontWeight.w600)),
                      Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: AppText.label.copyWith(color: t.ink, height: 1.35)),
                      const SizedBox(height: 6),
                      // سطر يلتف: «نفد» أهم معلومة فيه ولا يُقصّ أبداً.
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(formatPrice(p.price), style: AppText.caption.copyWith(color: t.inkSoft, fontWeight: FontWeight.w700)),
                          if (item.quantity > 1) _Pill('× ${item.quantity}', t.accentDark, t.accentLight, weight: FontWeight.w800),
                          if (p.hasMultipleDisplayableShades) _Pill(s.beautyChooseShade, t.inkSoft, t.canvasWarm),
                          if (out) _Pill(s.beautySoldOut, AppColors.danger, AppColors.dangerSoft, weight: FontWeight.w800),
                        ],
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right_rounded, color: t.inkMuted),
              ],
            ),
            if (item.note != null) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                decoration: BoxDecoration(color: t.canvasWarm, borderRadius: BorderRadius.circular(10)),
                child: Text('💡 ${item.note!}', style: AppText.caption.copyWith(color: t.inkSoft)),
              ),
            ],
          ],
        ),
      ),
    );
    if (!routine) {
      return Padding(padding: const EdgeInsets.fromLTRB(16, 0, 16, 10), child: card);
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              width: 34,
              child: Column(
                children: [
                  Container(
                    width: 30,
                    height: 30,
                    margin: const EdgeInsets.only(top: 12),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: color, shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: color.withValues(alpha: 0.35), blurRadius: 8, offset: const Offset(0, 3))]),
                    child: Text('${index + 1}', style: AppText.label.copyWith(color: Colors.white)),
                  ),
                  if (!last) Expanded(child: Container(width: 2, color: color.withValues(alpha: 0.25))),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(child: Padding(padding: const EdgeInsets.only(bottom: 12), child: card)),
          ],
        ),
      ),
    );
  }
}

/// الشريط السفلي: السعر + «أضيفي الباقة كاملة» (أو «في سلتكِ ✓» / «أكملي الباقة»).
/// ناقصة المخزون: «نبّهيني عند التوفر» و«أضيفي المتوفر» بدل زر معطّل.
class _BuyBar extends ConsumerStatefulWidget {
  final BeautyPackage pack;
  const _BuyBar({required this.pack});

  @override
  ConsumerState<_BuyBar> createState() => _BuyBarState();
}

class _BuyBarState extends ConsumerState<_BuyBar> {
  bool _busy = false;

  Future<void> _run(Future<void> Function() action) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await action();
    } catch (e) {
      if (mounted) AppSnackbar.error(context, friendlyError(e, lang: ref.read(stringsProvider).lang));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// تنبيه لكل منتج ناقص: إن كانت كلها مراقبة يُلغى التنبيه، وإلا يُفعَّل للباقي.
  Future<void> _toggleRestock(List<BeautyPackageItem> short) async {
    final s = ref.read(stringsProvider);
    if (!ref.read(authProvider).isAuthenticated) {
      AppSnackbar.show(context, s.beautyLoginForRestock);
      context.push('/login');
      return;
    }
    final notifier = ref.read(restockWatchProvider.notifier);
    final watching = ref.read(restockWatchProvider);
    final ids = {for (final i in short) i.product.id};
    final allOn = ids.every(watching.contains);
    for (final id in ids) {
      if (allOn || !watching.contains(id)) await notifier.toggle(id);
    }
    if (mounted) AppSnackbar.success(context, allOn ? s.beautyRestockOff : s.beautyRestockOn);
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final t = context.worldTheme;
    final pack = widget.pack;
    final status = ref.watch(cartPackageStatusProvider).where((e) => e.pack.id == pack.id).firstOrNull;
    final inCart = status?.complete ?? false;
    final incomplete = status != null && !status.complete;
    final short = pack.items.where((i) => i.product.stock < i.quantity).toList();
    final live = pack.isLive;
    final colors = routineColors(pack, t);
    final restockMode = live && !inCart && short.isNotEmpty;

    final Widget actions;
    if (restockMode) {
      final watching = ref.watch(restockWatchProvider);
      final allOn = short.every((i) => watching.contains(i.product.id));
      final anyAvailable = pack.items.length > short.length;
      actions = Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _busy ? null : () => _run(() => _toggleRestock(short)),
              icon: Icon(allOn ? Icons.notifications_active_rounded : Icons.notifications_none_rounded, size: 19),
              label: Text(allOn ? s.beautyWatchingRestock : s.notifyMeWhenAvailable, maxLines: 1, overflow: TextOverflow.ellipsis),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                foregroundColor: colors.last,
                side: BorderSide(color: colors.last.withValues(alpha: 0.6)),
                textStyle: AppText.label,
                shape: const StadiumBorder(),
              ),
            ),
          ),
          if (anyAvailable) ...[
            const SizedBox(width: 10),
            Expanded(
              child: FilledButton(
                onPressed: _busy ? null : () => _run(() => addAvailablePackageItems(context, ref, pack)),
                style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  backgroundColor: colors.last,
                  disabledBackgroundColor: t.hairline,
                  textStyle: AppText.label,
                  shape: const StadiumBorder(),
                ),
                child: Text(s.beautyAddAvailable, maxLines: 1, overflow: TextOverflow.ellipsis),
              ),
            ),
          ],
        ],
      );
    } else {
      final available = live && pack.inStock;
      final VoidCallback? onPressed;
      final String label;
      if (!available) {
        onPressed = null;
        label = s.beautyUnavailableNow;
      } else if (inCart) {
        onPressed = () => openCartTab(context, ProviderScope.containerOf(context, listen: false));
        label = s.beautyInCartViewCart;
      } else if (incomplete) {
        onPressed = () => _run(() => completePackageInCart(context, ref, pack, status));
        label = s.beautyCompletePackage(status.missingProductIds.length);
      } else {
        onPressed = () => _run(() => addPackageToCart(context, ref, pack));
        label = pack.isRoutine ? s.beautyAddRoutine : s.beautyAddBundle;
      }
      actions = Row(
        children: [
          ConstrainedBox(
            constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.34),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: AlignmentDirectional.centerStart,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(formatPrice(pack.price), style: AppText.priceLarge.copyWith(color: t.ink, fontSize: 21)),
                  if (pack.hasSaving)
                    Text(s.beautySavedAmount(formatPrice(pack.saving)), style: AppText.micro.copyWith(color: AppColors.successDeep)),
                ],
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: FilledButton(
              onPressed: _busy ? null : onPressed,
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(54),
                backgroundColor: inCart ? AppColors.success : colors.last,
                disabledBackgroundColor: t.hairline,
                shape: const StadiumBorder(),
              ),
              child: _busy
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                  : Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.title3.copyWith(color: available ? Colors.white : t.inkMuted),
                    ),
            ),
          ),
        ],
      );
    }

    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + MediaQuery.paddingOf(context).bottom),
      decoration: BoxDecoration(
        color: t.surface,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 20, offset: const Offset(0, -6))],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(AppCorners.lg + 4)),
      ),
      child: actions,
    );
  }
}
