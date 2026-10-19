import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../worlds/world_theme.dart';
import 'listing_theme.dart';

/// حالة الفلاتر السريعة المعروضة في شريط الرأس.
class ListingQuickFilters {
  final String sortLabel;
  final bool sortActive;
  final String? priceLabel;
  final bool inStock;
  final bool onSale;
  final bool showOnSale;
  final String? ratingLabel;
  final int activeCount;
  final int? total;

  const ListingQuickFilters({
    required this.sortLabel,
    required this.sortActive,
    required this.priceLabel,
    required this.inStock,
    required this.onSale,
    required this.showOnSale,
    required this.ratingLabel,
    required this.activeCount,
    required this.total,
  });
}

/// رأس صفحة المنتجات — مدمج ليترك المساحة للمنتجات:
/// رجوع + عنوان ومسار + بحث/مسح، ثم شريط فلاتر سريع وعدد النتائج.
class ListingPageHeader extends ConsumerWidget {
  final String title;
  final String? subtitle;
  final ListingQuickFilters filters;
  final VoidCallback onSort;
  final VoidCallback onPrice;
  final VoidCallback onToggleInStock;
  final VoidCallback onToggleSale;
  final VoidCallback onRating;
  final VoidCallback onAllFilters;
  final VoidCallback onClearAll;

  const ListingPageHeader({
    super.key,
    required this.title,
    required this.filters,
    required this.onSort,
    required this.onPrice,
    required this.onToggleInStock,
    required this.onToggleSale,
    required this.onRating,
    required this.onAllFilters,
    required this.onClearAll,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    final f = filters;

    final count = f.total == null ? null : s.lfResults(_fmt(f.total!));
    final meta = [if (subtitle != null && subtitle!.isNotEmpty) subtitle!, if (count != null) count].join('  •  ');

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent),
      child: Container(
        decoration: BoxDecoration(
          // شريط بلون العالم يذوب في سطح الصفحة — نفس لغة رأس الرئيسية.
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color.lerp(t.accentLight, t.surface, 0.15)!, t.surface],
          ),
          borderRadius: const BorderRadius.vertical(bottom: Radius.circular(26)),
          boxShadow: [
            BoxShadow(color: t.accentDark.withValues(alpha: 0.07), blurRadius: 18, offset: const Offset(0, 6)),
          ],
        ),
        child: SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(6, 4, 10, 0),
                child: Row(
                  children: [
                    const AppBackButton(),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppText.title1.copyWith(color: t.ink, height: 1.2),
                          ),
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 220),
                            layoutBuilder: (current, previous) => Stack(
                              alignment: AlignmentDirectional.centerStart,
                              children: [...previous, if (current != null) current],
                            ),
                            child: meta.isEmpty
                                ? const SizedBox(height: 16)
                                : Text(
                                    meta,
                                    key: ValueKey(meta),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppText.caption.copyWith(color: t.inkMuted, fontWeight: FontWeight.w600),
                                  ),
                          ),
                        ],
                      ),
                    ),
                    _RoundAction(
                      icon: Icons.search_rounded,
                      tooltip: s.searchHint,
                      onTap: () => context.push('/search'),
                    ),
                    const SizedBox(width: 8),
                    _RoundAction(
                      icon: Icons.qr_code_scanner_rounded,
                      tooltip: s.scan,
                      onTap: () => context.push('/scan'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              // الشرائح 36 للعين و44 للمس — الصف بارتفاع منطقة اللمس.
              SizedBox(
                height: kMinTapTarget,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: ListingTheme.padH),
                  children: [
                    _FilterButton(label: s.filter, count: f.activeCount, onTap: onAllFilters),
                    const SizedBox(width: 8),
                    AppChoiceChip(
                      label: f.sortLabel,
                      icon: Icons.swap_vert_rounded,
                      selected: f.sortActive,
                      showChevron: true,
                      onTap: onSort,
                    ),
                    const SizedBox(width: 8),
                    AppChoiceChip(
                      label: f.priceLabel ?? s.lfPrice,
                      selected: f.priceLabel != null,
                      showChevron: true,
                      onTap: onPrice,
                    ),
                    const SizedBox(width: 8),
                    AppChoiceChip(
                      label: s.lfInStock,
                      icon: f.inStock ? Icons.check_rounded : null,
                      selected: f.inStock,
                      onTap: onToggleInStock,
                    ),
                    if (f.showOnSale) ...[
                      const SizedBox(width: 8),
                      AppChoiceChip(
                        label: s.lfOffers,
                        icon: f.onSale ? Icons.check_rounded : Icons.local_offer_outlined,
                        selected: f.onSale,
                        onTap: onToggleSale,
                      ),
                    ],
                    const SizedBox(width: 8),
                    AppChoiceChip(
                      label: f.ratingLabel ?? s.lfRating,
                      icon: Icons.star_rounded,
                      selected: f.ratingLabel != null,
                      showChevron: true,
                      onTap: onRating,
                    ),
                    if (f.activeCount > 0) ...[
                      const SizedBox(width: 8),
                      Center(
                        child: TextButton.icon(
                          onPressed: onClearAll,
                          icon: const Icon(Icons.close_rounded, size: 16),
                          label: Text(s.lfClearAll, style: AppText.label.copyWith(fontSize: 12.5)),
                          style: TextButton.styleFrom(
                            foregroundColor: t.accentDark,
                            minimumSize: const Size(44, 34),
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  static String _fmt(int n) {
    final str = n.toString();
    final b = StringBuffer();
    for (var i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) b.write(',');
      b.write(str[i]);
    }
    return b.toString();
  }
}

/// زر دائري أبيض للبحث/المسح — بنفس لغة أزرار الرئيسية.
class _RoundAction extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  const _RoundAction({required this.icon, required this.tooltip, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Tooltip(
      message: tooltip,
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: Container(
          width: kMinTapTarget,
          height: kMinTapTarget,
          decoration: BoxDecoration(
            color: t.surface,
            shape: BoxShape.circle,
            border: Border.all(color: t.hairline),
            boxShadow: [
              BoxShadow(color: t.accentDark.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, 3)),
            ],
          ),
          child: Icon(icon, size: 20, color: t.ink),
        ),
      ),
    );
  }
}

/// زر "فلترة" الرئيسي — يتلوّن بتدرّج العالم مع عدّاد حين تكون هناك فلاتر فعّالة.
class _FilterButton extends StatelessWidget {
  final String label;
  final int count;
  final VoidCallback onTap;
  const _FilterButton({required this.label, required this.count, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final active = count > 0;
    return Semantics(
      button: true,
      label: active ? '$label ($count)' : label,
      excludeSemantics: true,
      child: GestureDetector(
        // منطقة اللمس بارتفاع الصف كاملاً، والزر المرسوم 36.
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: Center(widthFactor: 1, child: _face(context, t, active)),
      ),
    );
  }

  Widget _face(BuildContext context, WorldThemePalette t, bool active) {
    return AnimatedContainer(
      duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 220),
      height: 36,
      padding: const EdgeInsetsDirectional.fromSTEB(12, 0, 14, 0),
      decoration: BoxDecoration(
        gradient: active ? t.signatureGradient : null,
        color: active ? null : t.ink,
        borderRadius: BorderRadius.circular(AppCorners.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.tune_rounded, size: 17, color: Colors.white),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppText.label.copyWith(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800),
          ),
          if (active) ...[
            const SizedBox(width: 6),
            Container(
              constraints: const BoxConstraints(minWidth: 18),
              height: 18,
              alignment: Alignment.center,
              padding: const EdgeInsets.symmetric(horizontal: 5),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(9)),
              child: Text(
                '$count',
                style: AppText.micro.copyWith(color: t.accentDark, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
