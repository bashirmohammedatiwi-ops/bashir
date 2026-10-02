import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_fonts.dart';
import '../../cart/widgets/cart_theme.dart';
import '../../worlds/world_theme.dart';
import '../../../core/widgets/app_network_image.dart';

/// نظام تصميم الرئيسية — أنيق ومتناسق مع ألوان اللوغو.
abstract final class HomeTheme {
  static const paddingH = 16.0;
  static const sectionGap = 22.0;
  static const compactGap = 12.0;
  static const itemGap = 10.0;
  static const cardRadius = 16.0;
  static const tileRadius = 14.0;
  static const galleryRadius = 16.0;
  static const squircle = 14.0;
  static const pillRadius = 999.0;

  static const productCardWidth = 158.0;
  static const productCardHeight = 268.0;
  static const productImageSize = 158.0;
  static const productRowHeight = 272.0;
  static const bannerAspect = 1.92;
  static const bannerInset = 16.0;
  static const bannerRadius = 16.0;

  static const canvas = Color(0xFFF8F6FB);
  static const canvasWarm = Color(0xFFFAF8FD);
  static const surface = Colors.white;
  static const surfaceMuted = CartTheme.brandWash;
  static const pearl = Color(0xFFF9F7FD);
  static const champagne = CartTheme.brandSoft;

  static const accent = CartTheme.brand;
  static const accentDark = CartTheme.brandDark;
  static const accentLight = CartTheme.brandSoft;
  static const accentMid = Color(0xFFE3D6F7);

  static const sage = CartTheme.brand;
  static const sageDark = CartTheme.brandDark;
  static const sageLight = CartTheme.brandSoft;
  static const sageMid = CartTheme.brandWash;

  static const roseWash = Color(0xFFFAF6FF);
  static const sand = pearl;
  static const lavender = CartTheme.brandWash;
  static const blush = Color(0xFFFBF9FF);

  static const ink = CartTheme.charcoal;
  static const inkSoft = Color(0xFF6A647A);
  static const inkMuted = Color(0xFF9C95AA);
  static const divider = Color(0xFFE7E1EF);

  static const categoryTileColors = [
    roseWash,
    sageLight,
    sand,
    lavender,
    accentLight,
    blush,
    Color(0xFFF3EFF8),
    Color(0xFFF9F7FB),
  ];

  static TextStyle brandTitle({double size = 22, required String lang, Color? color}) =>
      brandTitleStyle(size: size, lang: lang, color: color ?? ink);

  static TextStyle displayTitle({double size = 22, Color? color}) =>
      appFont(
        fontSize: size,
        fontWeight: FontWeight.w800,
        height: 1.2,
        letterSpacing: -0.3,
        color: color ?? ink,
      );

  static TextStyle sectionTitle({double size = 17, Color? color}) => appFont(
        fontSize: size,
        fontWeight: FontWeight.w800,
        height: 1.25,
        color: color ?? ink,
      );

  static TextStyle body({
    double size = 14,
    Color? color,
    FontWeight weight = FontWeight.w500,
  }) =>
      appFont(
        fontSize: size,
        fontWeight: weight,
        height: 1.4,
        color: color ?? inkSoft,
      );

  static TextStyle get overline => appFont(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.5,
        color: accent,
        height: 1.2,
      );

  static TextStyle get viewAll => appFont(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: accent,
        height: 1.2,
      );

  static IconData viewAllChevron(BuildContext context) {
    return Directionality.of(context) == TextDirection.rtl
        ? Icons.chevron_left_rounded
        : Icons.chevron_right_rounded;
  }

  static BoxDecoration sectionSurface({Color? tint}) => BoxDecoration(
        color: tint ?? surface,
        borderRadius: BorderRadius.circular(cardRadius),
        border: Border.all(color: divider),
      );

  static TextStyle get chipLabel => appFont(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: ink,
        height: 1.2,
      );

  static TextStyle get circleLabel => appFont(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: inkSoft,
        height: 1.15,
      );

  static TextStyle get price => appFont(
        fontSize: 14,
        fontWeight: FontWeight.w800,
        color: ink,
        height: 1.2,
      );

  static TextStyle get brandLabel => appFont(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.3,
        color: inkMuted,
        height: 1.2,
      );

  static List<BoxShadow> get whisperLift => [
        BoxShadow(
          color: ink.withValues(alpha: 0.03),
          blurRadius: 8,
          offset: const Offset(0, 2),
          spreadRadius: -1,
        ),
      ];

  static List<BoxShadow> get galleryShadow => [
        BoxShadow(
          color: CartTheme.brand.withValues(alpha: 0.1),
          blurRadius: 14,
          offset: const Offset(0, 5),
          spreadRadius: -2,
        ),
        BoxShadow(
          color: ink.withValues(alpha: 0.04),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get softShadow => galleryShadow;

  static List<BoxShadow> get softLift => softShadow;
  static List<BoxShadow> get cardShadow => whisperLift;
  static List<BoxShadow> get stageShadow => softShadow;

  static BoxDecoration canvasDecoration() => const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [canvasWarm, canvas, canvas],
          stops: [0, 0.25, 1],
        ),
      );

  static BoxDecoration heroHeaderDecoration() => const BoxDecoration(color: canvas);

  static BoxDecoration heroActionClusterDecoration() => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(pillRadius),
        border: Border.all(color: divider),
      );

  static BoxDecoration heroSearchDecoration() => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: divider),
      );

  static BoxDecoration heroDateChipDecoration() => BoxDecoration(
        color: pearl,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: divider),
      );

  static BoxDecoration heroTrustPillDecoration() => BoxDecoration(
        color: pearl,
        borderRadius: BorderRadius.circular(pillRadius),
        border: Border.all(color: divider),
      );

  static BoxDecoration cardDecoration({Color? color}) => BoxDecoration(
        color: color ?? surface,
        borderRadius: BorderRadius.circular(cardRadius),
        border: Border.all(color: divider),
      );

  static BoxDecoration pillSurface({Color? fill}) => BoxDecoration(
        color: fill ?? surface,
        borderRadius: BorderRadius.circular(pillRadius),
        border: Border.all(color: divider),
      );

  static BoxDecoration searchDecoration() => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: divider),
      );

  static BoxDecoration dockDecoration() => BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(cardRadius),
        border: Border.all(color: divider),
      );

  // Legacy aliases
  static const petal = roseWash;
  static const mist = surfaceMuted;
  static const blushDeep = divider;
  static const blushMid = divider;
}

class HomeCanvasBackground extends ConsumerWidget {
  final Widget child;

  const HomeCanvasBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(activeWorldThemeProvider);
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [t.canvasWarm, t.canvas, t.canvas],
          stops: const [0, 0.25, 1],
        ),
      ),
      child: child,
    );
  }
}

class HomeSectionDivider extends ConsumerWidget {
  const HomeSectionDivider({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(activeWorldThemeProvider);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH, vertical: 4),
      child: Divider(height: 1, thickness: 1, color: theme.divider),
    );
  }
}

class HomeEditorialHeader extends ConsumerWidget {
  final String title;
  final String? subtitle;
  final String? headerImageUrl;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Widget? trailing;
  final bool compact;
  final String? overline;

  const HomeEditorialHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.headerImageUrl,
    this.actionLabel,
    this.onAction,
    this.trailing,
    this.compact = false,
    this.overline,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(activeWorldThemeProvider);
    return Padding(
      padding: EdgeInsets.fromLTRB(
        HomeTheme.paddingH,
        compact ? 0 : 4,
        HomeTheme.paddingH,
        12,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (headerImageUrl != null && headerImageUrl!.isNotEmpty) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: AppNetworkImage(
                url: headerImageUrl!,
                width: 32,
                height: 32,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (overline != null && overline!.isNotEmpty) ...[
                  Text(
                    overline!,
                    style: HomeTheme.overline.copyWith(color: theme.accent),
                  ),
                  const SizedBox(height: 2),
                ],
                Text(
                  title,
                  style: HomeTheme.sectionTitle(size: compact ? 16 : 17, color: theme.ink),
                ),
                if (subtitle != null && subtitle!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!, style: HomeTheme.body(size: 12, color: theme.inkSoft)),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
          if (actionLabel != null && onAction != null)
            HomeViewAllLink(label: actionLabel!, onTap: onAction!),
        ],
      ),
    );
  }
}

/// رابط «عرض الكل» — دائماً في نهاية صف العنوان (يسار في RTL / يمين في LTR).
class HomeViewAllLink extends ConsumerWidget {
  final String label;
  final VoidCallback onTap;

  const HomeViewAllLink({super.key, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(activeWorldThemeProvider);
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label, style: HomeTheme.viewAll.copyWith(color: theme.accent)),
            Icon(HomeTheme.viewAllChevron(context), size: 16, color: theme.accent),
          ],
        ),
      ),
    );
  }
}

class HomeFilterPill extends ConsumerWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final String? icon;

  const HomeFilterPill({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(activeWorldThemeProvider);
    return Material(
      color: selected ? theme.accent : theme.surface,
      borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(HomeTheme.pillRadius),
            border: Border.all(color: selected ? theme.accent : theme.divider),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null && icon!.isNotEmpty) ...[
                Text(icon!, style: const TextStyle(fontSize: 13)),
                const SizedBox(width: 5),
              ],
              Text(
                label,
                style: HomeTheme.chipLabel.copyWith(
                  color: selected ? Colors.white : theme.ink,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class HomeCountdownBoxes extends StatelessWidget {
  final String hours;
  final String minutes;
  final String seconds;

  const HomeCountdownBoxes({
    super.key,
    required this.hours,
    required this.minutes,
    required this.seconds,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _box(hours),
        _sep(),
        _box(minutes),
        _sep(),
        _box(seconds),
      ],
    );
  }

  Widget _sep() => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 3),
        child: Text(
          ':',
          style: HomeTheme.body(size: 13, color: HomeTheme.ink, weight: FontWeight.w800),
        ),
      );

  Widget _box(String v) => Container(
        width: 28,
        padding: const EdgeInsets.symmetric(vertical: 5),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: HomeTheme.ink,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          v,
          style: appFont(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: Colors.white,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      );
}
