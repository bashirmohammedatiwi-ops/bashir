import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/ad_slots.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/banner.dart';
import '../../../data/models/home_section.dart';
import '../../worlds/world_theme.dart';
import '../home_link.dart';
import 'home_theme.dart';

/// بنر — صورة فقط مع مقاسات من لوحة التحكم.
class HomeBannerStage extends StatelessWidget {
  final AppBanner banner;
  final BannerLayoutConfig layout;
  final int sceneIndex;
  final VoidCallback? onTap;
  final double? width;

  const HomeBannerStage({
    super.key,
    required this.banner,
    required this.layout,
    this.sceneIndex = 0,
    this.onTap,
    this.width,
  });

  factory HomeBannerStage.fromSection({
    required AppBanner banner,
    required HomeSection section,
    int sceneIndex = 0,
    int index = 0,
    VoidCallback? onTap,
    double? width,
  }) {
    final itemSize = banner.cardSize;
    return HomeBannerStage(
      banner: banner,
      layout: resolveBannerLayout(section, index: index, itemCardSize: itemSize),
      sceneIndex: sceneIndex,
      onTap: onTap,
      width: width,
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final screenW = MediaQuery.sizeOf(context).width;
    final cardW = width ??
        (layout.fullBleed ? screenW : screenW - HomeTheme.paddingH * 2);
    final cardH = layout.heightFor(cardW);
    final radius = layout.radius;
    final tint = _tintFor(context, sceneIndex, banner);

    Widget card = Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap != null
            ? () {
                HapticFeedback.selectionClick();
                onTap!();
              }
            : null,
        borderRadius: BorderRadius.circular(radius),
        child: Ink(
          width: cardW,
          height: cardH,
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: BorderRadius.circular(radius),
            border: layout.fullBleed
                ? null
                : Border.all(color: t.hairline.withValues(alpha: 0.75)),
            boxShadow: layout.fullBleed ? null : t.cardShadow,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(radius),
            child: _ImageOnlyLayout(
              banner: banner,
              tint: tint,
              imageBg: t.accentLight,
            ),
          ),
        ),
      ),
    );

    if (!layout.fullBleed && width == null) {
      card = Padding(
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        child: card,
      );
    }

    return card;
  }

  static _BannerTint _tintFor(BuildContext context, int index, AppBanner banner) {
    final t = context.worldTheme;
    final custom = parseHexColor(banner.backgroundColor);
    if (custom != null) {
      return _BannerTint(
        bg: Color.lerp(custom, t.canvas, 0.78)!,
        border: Color.lerp(custom, t.canvas, 0.62)!.withValues(alpha: 0.85),
        accent: custom,
      );
    }
    final presets = [
      _BannerTint(
        bg: t.accentLight,
        border: t.accentSoft,
        accent: t.accent,
      ),
      _BannerTint(
        bg: t.canvasWarm,
        border: t.hairline,
        accent: t.accentDark,
      ),
      _BannerTint(
        bg: Color.lerp(t.accent, t.canvas, 0.88)!,
        border: t.divider,
        accent: t.accentDark,
      ),
    ];
    return presets[index % presets.length];
  }
}

class _BannerTint {
  final Color bg;
  final Color border;
  final Color accent;

  const _BannerTint({
    required this.bg,
    required this.border,
    required this.accent,
  });
}

class _ImageOnlyLayout extends StatelessWidget {
  final AppBanner banner;
  final _BannerTint tint;
  final Color imageBg;

  const _ImageOnlyLayout({
    required this.banner,
    required this.tint,
    required this.imageBg,
  });

  @override
  Widget build(BuildContext context) {
    if (!banner.hasImage) {
      return DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [tint.bg, Color.lerp(tint.bg, tint.accent, 0.15)!],
          ),
        ),
        child: Center(
          child: Icon(
            Icons.spa_rounded,
            size: 44,
            color: tint.accent.withValues(alpha: 0.35),
          ),
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) => AppNetworkImage(
        url: banner.imageUrl,
        width: constraints.maxWidth,
        height: constraints.maxHeight,
        fit: BoxFit.contain,
        backgroundColor: imageBg,
      ),
    );
  }
}

double homeHeroBannerHeight(
  BuildContext context, {
  HomeSection? section,
  double? width,
}) {
  final inset = HomeTheme.bannerInset;
  final w = width ??
      (MediaQuery.sizeOf(context).width - (section?.fullBleed == true ? 0 : inset * 2));
  final layout = section != null
      ? resolveBannerLayout(section)
      : BannerLayoutConfig(aspect: HomeTheme.bannerAspect);
  return layout.heightFor(w);
}
