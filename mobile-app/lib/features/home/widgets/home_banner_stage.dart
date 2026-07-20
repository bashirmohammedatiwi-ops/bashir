import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/ad_slots.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/banner.dart';
import '../../../data/models/home_section.dart';
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
    final screenW = MediaQuery.sizeOf(context).width;
    final cardW = width ??
        (layout.fullBleed ? screenW : screenW - HomeTheme.paddingH * 2);
    final cardH = layout.heightFor(cardW);
    final radius = layout.radius;
    final tint = _tintFor(sceneIndex, banner);

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
            color: tint.bg,
            borderRadius: BorderRadius.circular(radius),
            border: layout.fullBleed
                ? null
                : Border.all(color: tint.border),
            boxShadow: layout.fullBleed ? null : HomeTheme.softShadow,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(radius),
            child: _ImageOnlyLayout(
              banner: banner,
              tint: tint,
            ),
          ),
        ),
      ),
    );

    if (!layout.fullBleed) {
      card = Padding(
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        child: card,
      );
    }

    return card;
  }

  static _BannerTint _tintFor(int index, AppBanner banner) {
    final custom = parseHexColor(banner.backgroundColor);
    if (custom != null) {
      return _BannerTint(
        bg: Color.lerp(custom, Colors.white, 0.78)!,
        border: Color.lerp(custom, Colors.white, 0.62)!.withValues(alpha: 0.85),
        accent: custom,
      );
    }
    const presets = [
      _BannerTint(
        bg: Color(0xFFF8F0F2),
        border: Color(0xFFEED6DE),
        accent: AppColors.primary,
      ),
      _BannerTint(
        bg: Color(0xFFF0F4EE),
        border: Color(0xFFD4E0CC),
        accent: HomeTheme.sage,
      ),
      _BannerTint(
        bg: Color(0xFFF4F0EA),
        border: Color(0xFFE0D5C8),
        accent: Color(0xFF8B7355),
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

  const _ImageOnlyLayout({
    required this.banner,
    required this.tint,
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

    return AppNetworkImage(
      url: banner.imageUrl,
      fit: BoxFit.cover,
    );
  }
}

double homeHeroBannerHeight(BuildContext context, {HomeSection? section}) {
  final w = MediaQuery.sizeOf(context).width -
      (section?.fullBleed == true ? 0 : HomeTheme.paddingH * 2);
  final layout = section != null
      ? resolveBannerLayout(section)
      : const BannerLayoutConfig(aspect: 2.08);
  return layout.heightFor(w);
}
