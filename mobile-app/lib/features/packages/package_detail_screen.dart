import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/navigation/app_navigation.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/beauty.dart';
import '../beauty/beauty_providers.dart';
import '../beauty/beauty_widgets.dart';
import '../cart/cart_packages_provider.dart';
import '../worlds/world_theme.dart';

/// صفحة باقة أو روتين: الغلاف، السعر والتوفير، الخطوات/المنتجات، وإضافة الكل للسلة بسعر الباقة.
class PackageDetailScreen extends ConsumerWidget {
  final String idOrSlug;
  const PackageDetailScreen({super.key, required this.idOrSlug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final async = ref.watch(beautyPackageProvider(idOrSlug));
    return Scaffold(
      backgroundColor: t.canvas,
      body: async.when(
        loading: () => ListView(
          padding: EdgeInsets.zero,
          children: const [
            ShimmerBox(height: 320, radius: 0),
            Padding(padding: EdgeInsets.all(16), child: ShimmerBox(height: 120, radius: 20)),
            Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: ShimmerBox(height: 260, radius: 20)),
          ],
        ),
        error: (e, _) => SafeArea(
          child: Column(
            children: [
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back_rounded)),
              ),
              Expanded(
                child: ErrorView(message: friendlyError(e), onRetry: () => ref.invalidate(beautyPackageProvider(idOrSlug))),
              ),
            ],
          ),
        ),
        data: (p) => _Body(pack: p),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  final BeautyPackage pack;
  const _Body({required this.pack});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final colors = routineColors(pack, t);
    final concerns = ref.watch(skinConcernsListProvider).valueOrNull ?? const <SkinConcern>[];
    final myConcerns = concerns.where((c) => pack.concernSlugs.contains(c.slug)).toList();
    final profile = ref.watch(skinProfileProvider);
    final fitsMe = profile != null && pack.skinTypes.contains(profile.skinType.key);
    final kindLabel = pack.isMorning
        ? 'روتين الصباح'
        : pack.isEvening
            ? 'روتين المساء'
            : pack.isBridal
                ? 'باقة العروس'
                : 'باقة';

    return Stack(
      children: [
        CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              expandedHeight: 330,
              pinned: true,
              stretch: true,
              backgroundColor: colors.last,
              foregroundColor: Colors.white,
              title: Text(pack.name, style: AppText.title3.copyWith(color: Colors.white)),
              flexibleSpace: FlexibleSpaceBar(
                stretchModes: const [StretchMode.zoomBackground],
                background: _Hero(pack: pack, colors: colors, kindLabel: kindLabel),
              ),
            ),
            // السعر والتوفير.
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(22), boxShadow: t.cardShadow),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: PackagePrice(pack: pack, color: t.ink, muted: t.inkMuted, large: true)),
                          SavingBadge(pack: pack, large: true),
                        ],
                      ),
                      if (pack.hasSaving) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(color: const Color(0xFFE6F6EF), borderRadius: BorderRadius.circular(12)),
                          child: Row(
                            children: [
                              const Text('💚', style: TextStyle(fontSize: 16)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'توفّرين ${formatPrice(pack.saving)} مقارنة بشراء ${pack.stepCount} منتجات منفردة',
                                  style: AppText.label.copyWith(color: const Color(0xFF13795B)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      if (pack.endsAt != null) ...[
                        const SizedBox(height: 10),
                        OfferCountdown(endsAt: pack.endsAt!, color: colors.last, background: colors.first.withValues(alpha: 0.18)),
                      ],
                      if (fitsMe || pack.skinTypes.isNotEmpty || myConcerns.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            if (fitsMe) _Pill('✓ يناسب بشرتكِ ${profile.skinType.labelAr}', const Color(0xFF13795B), const Color(0xFFE6F6EF)),
                            if (!fitsMe)
                              for (final k in pack.skinTypes)
                                if (skinTypeFromKey(k) != null)
                                  _Pill('${skinTypeFromKey(k)!.emoji} بشرة ${skinTypeFromKey(k)!.labelAr}', t.accentDark, t.accentLight),
                            for (final c in myConcerns)
                              GestureDetector(
                                onTap: () => openConcern(context, c),
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
                title: pack.isRoutine ? 'خطوات الروتين' : 'محتوى الباقة',
                subtitle: pack.isRoutine ? 'بالترتيب — من الأخف إلى الأثقل' : '${pack.stepCount} منتجات مختارة',
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
                    decoration: BoxDecoration(color: colors.first.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(18)),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(pack.isMorning ? '☀️' : '🌙', style: const TextStyle(fontSize: 20)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            pack.isMorning
                                ? 'انتظري دقيقة بين الخطوات حتى تمتص البشرة كل طبقة، وواقي الشمس دائماً آخر خطوة حتى بالبيت.'
                                : 'إذا وضعتِ مكياجاً، نظّفي مرتين: مزيل المكياج ثم الغسول. وخلي المنتجات العلاجية للمساء.',
                            style: AppText.bodySmall.copyWith(color: t.ink),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            if (pack.related.isNotEmpty) ...[
              SliverToBoxAdapter(child: AppSectionTitle(title: pack.isRoutine ? 'روتينات أخرى' : 'باقات مشابهة')),
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
            SliverToBoxAdapter(child: SizedBox(height: 120 + MediaQuery.paddingOf(context).bottom)),
          ],
        ),
        Positioned(left: 0, right: 0, bottom: 0, child: _BuyBar(pack: pack)),
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
    return Stack(
      fit: StackFit.expand,
      children: [
        DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topRight, end: Alignment.bottomLeft, colors: colors))),
        if (pack.coverUrl != null)
          AppNetworkImage(url: pack.coverUrl!, fit: BoxFit.cover)
        else
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 90, 24, 96),
            child: Row(
              children: [
                for (var i = 0; i < pack.thumbs.length.clamp(0, 4); i++)
                  Expanded(
                    child: Transform.translate(
                      offset: Offset(0, i.isOdd ? 10 : -6),
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
                        child: AspectRatio(aspectRatio: 0.8, child: AppNetworkImage(url: pack.thumbs[i], fit: BoxFit.contain)),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              stops: const [0.4, 1],
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
              Row(
                children: [
                  _Pill('${routineIcon(pack)} $kindLabel • ${pack.stepCount} ${pack.isRoutine ? 'خطوات' : 'منتجات'}', Colors.white,
                      Colors.white.withValues(alpha: 0.22)),
                  if (pack.badge != null) ...[
                    const SizedBox(width: 6),
                    _Pill(pack.badge!, colors.last, Colors.white),
                  ],
                ],
              ),
              const SizedBox(height: 8),
              Text(pack.name, style: AppText.display.copyWith(color: Colors.white)),
              if (pack.subtitle.isNotEmpty)
                Text(pack.subtitle, style: AppText.bodySmall.copyWith(color: Colors.white.withValues(alpha: 0.9))),
            ],
          ),
        ),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  final String text;
  final Color fg;
  final Color bg;
  const _Pill(this.text, this.fg, this.bg);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(AppCorners.pill)),
        child: Text(text, style: AppText.micro.copyWith(color: fg, fontSize: 11.5)),
      );
}

/// خطوة روتين (رقم + خط زمني) أو منتج باقة.
class _ItemRow extends StatelessWidget {
  final BeautyPackageItem item;
  final int index;
  final bool last;
  final bool routine;
  final Color color;
  const _ItemRow({required this.item, required this.index, required this.last, required this.routine, required this.color});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final p = item.product;
    final out = p.stock < item.quantity;
    final card = GestureDetector(
      onTap: () => context.push('/product/${Uri.encodeComponent(p.slug.isNotEmpty ? p.slug : p.id)}'),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: t.surface, borderRadius: BorderRadius.circular(18), border: Border.all(color: t.hairline)),
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
                  child: AppNetworkImage(url: p.coverUrl, fit: BoxFit.contain),
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
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(formatPrice(p.price), style: AppText.caption.copyWith(color: t.inkSoft, fontWeight: FontWeight.w700)),
                          if (item.quantity > 1) Text('  × ${item.quantity}', style: AppText.caption.copyWith(color: t.accentDark, fontWeight: FontWeight.w800)),
                          if (p.hasMultipleDisplayableShades)
                            Text('  • تختارين اللون', style: AppText.caption.copyWith(color: t.inkMuted)),
                          if (out) Text('  • نفد', style: AppText.caption.copyWith(color: const Color(0xFFB4232F), fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_left_rounded, color: t.inkMuted),
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

/// الشريط السفلي: السعر + «أضيفي الباقة كاملة» (أو «في سلتكِ ✓»).
class _BuyBar extends ConsumerStatefulWidget {
  final BeautyPackage pack;
  const _BuyBar({required this.pack});

  @override
  ConsumerState<_BuyBar> createState() => _BuyBarState();
}

class _BuyBarState extends ConsumerState<_BuyBar> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final pack = widget.pack;
    final status = ref.watch(cartPackageStatusProvider).where((s) => s.pack.id == pack.id).firstOrNull;
    final inCart = status?.complete ?? false;
    final available = pack.inStock && pack.isLive;
    final colors = routineColors(pack, t);
    return Container(
      padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + MediaQuery.paddingOf(context).bottom),
      decoration: BoxDecoration(
        color: t.surface,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 20, offset: const Offset(0, -6))],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Row(
        children: [
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(formatPrice(pack.price), style: AppText.priceLarge.copyWith(color: t.ink, fontSize: 21)),
              if (pack.hasSaving)
                Text('وفّرتِ ${formatPrice(pack.saving)}', style: AppText.micro.copyWith(color: const Color(0xFF13795B))),
            ],
          ),
          const SizedBox(width: 14),
          Expanded(
            child: SizedBox(
              height: 54,
              child: FilledButton(
                onPressed: !available || _busy
                    ? null
                    : inCart
                        ? () => openCartTab(context, ProviderScope.containerOf(context, listen: false))
                        : () async {
                            setState(() => _busy = true);
                            await addPackageToCart(context, ref, pack);
                            if (mounted) setState(() => _busy = false);
                          },
                style: FilledButton.styleFrom(
                  backgroundColor: inCart ? const Color(0xFF13895F) : colors.last,
                  disabledBackgroundColor: t.hairline,
                  shape: const StadiumBorder(),
                ),
                child: Text(
                  !available
                      ? 'غير متوفرة حالياً'
                      : inCart
                          ? 'في سلتكِ ✓ — عرض السلة'
                          : pack.isRoutine
                              ? 'أضيفي الروتين كاملاً'
                              : 'أضيفي الباقة للسلة',
                  style: AppText.title3.copyWith(color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

