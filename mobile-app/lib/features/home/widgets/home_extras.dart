import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/theme/app_fonts.dart';
import '../../../core/utils/support_links.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/category.dart';
import '../../../data/models/product.dart';
import '../../catalog/catalog_providers.dart';
import '../../catalog/recently_viewed_provider.dart';
import '../../categories/category_browse.dart';
import '../../worlds/world_theme.dart';
import '../../worlds/worlds_provider.dart';
import '../home_strings.dart';
import '../../../core/brand/brand_logo.dart';

const _cardW = 150.0;
const _rowH = 262.0;

/// صف منتجات أفقي موحّد لأقسام الرئيسية الجديدة.
class _ProductRow extends StatelessWidget {
  final List<Product> products;
  const _ProductRow({required this.products});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: _rowH,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: products.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) => ProductCard(
          key: ValueKey(products[i].id),
          product: products[i],
          width: _cardW,
          lite: true,
          showPromoBadge: true,
        ),
      ),
    );
  }
}

// ─── شريط الثقة ──────────────────────────────────────────────────────────────

/// أربع وعود قصيرة — تطمئن المتسوّقة من أول نظرة.
class HomePromiseStrip extends ConsumerWidget {
  const HomePromiseStrip({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final items = [
      (
        HugeIcons.strokeRoundedDeliveryTruck01,
        s.homeTrustDelivery,
        s.homeTrustDeliverySub,
      ),
      (
        HugeIcons.strokeRoundedCheckmarkBadge01,
        s.homeTrustAuthentic,
        s.homeTrustAuthenticSub,
      ),
      (HugeIcons.strokeRoundedCash01, s.homeTrustCod, s.homeTrustCodSub),
      (
        HugeIcons.strokeRoundedCustomerSupport,
        s.homeTrustSupport,
        s.homeTrustSupportSub,
      ),
    ];
    // وعود المتجر بلا صندوق: أيقونات رفيعة داخل دوائر ناعمة بلون العالم.
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 22, 10, 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final it in items)
            Expanded(
              child: Column(
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [t.accentLight, t.surface],
                      ),
                      border: Border.all(
                        color: t.accentSoft.withValues(alpha: 0.8),
                      ),
                    ),
                    alignment: Alignment.center,
                    child: HugeIcon(
                      icon: it.$1,
                      size: 22,
                      color: t.accentDark,
                      strokeWidth: 1.6,
                    ),
                  ),
                  const SizedBox(height: 8),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      it.$2,
                      maxLines: 1,
                      textAlign: TextAlign.center,
                      style: AppText.micro.copyWith(
                        fontSize: 11.5,
                        color: t.ink,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(height: 1),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      it.$3,
                      maxLines: 1,
                      textAlign: TextAlign.center,
                      style: AppText.micro.copyWith(
                        fontSize: 10,
                        color: t.inkMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

// ─── أكملي من حيث توقفتِ ──────────────────────────────────────────────────────

class HomeContinueShopping extends ConsumerWidget {
  const HomeContinueShopping({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(recentlyViewedProvider);
    if (items.length < 2) return const SizedBox.shrink();
    final s = ref.s;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppSectionTitle(title: s.homeContinue, subtitle: s.homeContinueSub),
        _ProductRow(products: items.take(12).toList()),
      ],
    );
  }
}

// ─── تسوّقي حسب الحاجة ────────────────────────────────────────────────────────

/// رفّ بتبويبات من أقسام العالم: اختاري الحاجة فتظهر أكثر منتجاتها طلباً —
/// تصفّح سريع بدل التنقل بين صفحات كثيرة.
class HomeNeedsShelf extends ConsumerStatefulWidget {
  const HomeNeedsShelf({super.key});

  @override
  ConsumerState<HomeNeedsShelf> createState() => _HomeNeedsShelfState();
}

class _HomeNeedsShelfState extends ConsumerState<HomeNeedsShelf> {
  String? _selectedId;
  String? _forSlug;

  CategoryTarget _target(Category c, String lang) =>
      c.listingKind == 'subcategory'
      ? CategoryTarget(title: c.localizedName(lang), subcategoryId: c.id)
      : CategoryTarget(title: c.localizedName(lang), categoryId: c.id);

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageCodeProvider);
    final s = ref.s;
    final t = context.worldTheme;
    final worlds = ref.watch(worldsProvider).valueOrNull;
    final slug = resolveWorldSlug(
      selected: ref.watch(selectedWorldSlugProvider),
      worlds: worlds,
    );
    if (slug == null) return const SizedBox.shrink();
    final world = ref.watch(worldDetailProvider(slug)).valueOrNull;
    final cats = world?.categories ?? const <Category>[];
    if (cats.length < 2) return const SizedBox.shrink();
    if (_forSlug != slug) {
      _forSlug = slug;
      _selectedId = null;
    }
    final selected = cats.firstWhere(
      (c) => c.id == _selectedId,
      orElse: () => cats.first,
    );
    final target = _target(selected, lang);
    final products = ref.watch(categoryTopProductsProvider(target));

    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AppSectionTitle(
            title: s.homeNeedsTitle,
            subtitle: s.homeNeedsSub,
            actionLabel: s.viewAll,
            onAction: () => target.open(context),
          ),
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: cats.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final c = cats[i];
                final on = c.id == selected.id;
                return GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () {
                    if (on) return;
                    HapticFeedback.selectionClick();
                    setState(() => _selectedId = c.id);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    padding: const EdgeInsetsDirectional.fromSTEB(4, 4, 14, 4),
                    // المختار بتدرّج لون العالم — نفس لغة شريط التنقل والعوالم.
                    decoration: BoxDecoration(
                      color: on ? null : t.surface,
                      gradient: on
                          ? LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Color.lerp(t.accent, Colors.white, 0.08)!,
                                Color.lerp(t.accent, Colors.black, 0.1)!,
                              ],
                            )
                          : null,
                      borderRadius: BorderRadius.circular(AppCorners.pill),
                      border: Border.all(
                        color: on ? Colors.transparent : t.hairline,
                      ),
                      boxShadow: on
                          ? [
                              BoxShadow(
                                color: t.accent.withValues(alpha: 0.3),
                                blurRadius: 12,
                                offset: const Offset(0, 5),
                              ),
                            ]
                          : null,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ClipOval(
                          child: SizedBox(
                            width: 34,
                            height: 34,
                            child: AppNetworkImage(
                              url: c.imageUrl,
                              fit: BoxFit.cover,
                              backgroundColor: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          c.localizedName(lang),
                          style: AppText.label.copyWith(
                            color: on ? Colors.white : t.ink,
                            fontWeight: on ? FontWeight.w800 : FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 14),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 280),
            child: products.when(
              loading: () => SizedBox(
                key: const ValueKey('loading'),
                height: _rowH,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: 3,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (_, __) => const ShimmerBox(
                    width: _cardW,
                    height: _rowH,
                    radius: 18,
                  ),
                ),
              ),
              error: (_, __) => const SizedBox.shrink(key: ValueKey('error')),
              data: (list) => list.isEmpty
                  ? const SizedBox.shrink(key: ValueKey('empty'))
                  : KeyedSubtree(
                      key: ValueKey(target.key),
                      child: _ProductRow(products: list),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── توقيع ختامي ──────────────────────────────────────────────────────────────

/// نهاية الصفحة: توقيع المتجر + طلب مساعدة + تصفّح الأقسام — بدل نهاية مفاجئة.
class HomeFooterSignature extends ConsumerWidget {
  const HomeFooterSignature({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final lang = ref.watch(languageCodeProvider);
    final t = context.worldTheme;
    final whatsapp = ref.watch(activeHomeFeedProvider).valueOrNull?.settings.whatsapp;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 30, 16, 8),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 26, 20, 22),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppCorners.xl),
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [t.surface, t.accentLight],
          ),
          border: Border.all(color: t.accentSoft),
        ),
        child: Column(
          children: [
            // شعار الشركة الكامل بألوان الهوية.
            const BrandWordmark(width: 200),
            if (s.isAr) ...[
              const SizedBox(height: 10),
              Text(
                'ديما الحياة',
                style: brandTitleStyle(lang: lang, size: 19, color: t.ink),
              ),
            ],
            const SizedBox(height: 4),
            Text(
              s.homeFooterLine,
              textAlign: TextAlign.center,
              style: AppText.bodySmall.copyWith(color: t.inkSoft),
            ),
            const SizedBox(height: 18),
            Text(s.homeFooterHelp, style: AppText.label.copyWith(color: t.ink)),
            const SizedBox(height: 10),
            Row(
              children: [
                if (whatsapp != null && whatsapp.isNotEmpty) ...[
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => openWhatsApp(
                        whatsapp,
                        message: s.whatsappHelpMessage,
                      ),
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size.fromHeight(46),
                      ),
                      icon: const Icon(Icons.support_agent_rounded, size: 19),
                      label: Text(
                        s.homeFooterChat,
                        style: AppText.label.copyWith(
                          fontSize: 14,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => openCategoriesTab(
                      context,
                      ProviderScope.containerOf(context, listen: false),
                    ),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(46),
                    ),
                    child: Text(
                      s.homeFooterBrowse,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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
