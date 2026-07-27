import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/locale_provider.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_section.dart';
import 'gallery_tile_sizer.dart';
import 'home_theme.dart';
import 'photo_shape_kit.dart';

/// إعدادات العرض — من لوحة التحكم على مستوى القسم فقط.
/// كل الصور في القسم تستخدم نفس التصميم؛ لتصميم مختلف كرّر القسم.
class GalleryRenderStyle {
  final String defaultShape;
  final String? defaultAspect;
  final String defaultSize;
  final String defaultOverlay;
  final String defaultBorder;
  final bool defaultShadow;
  final BoxFit fit;
  final double? tileCornerRadius;
  final double? sectionCustomWidth;
  final double? sectionCustomHeight;

  /// عند true تُتجاهل إعدادات كل صورة على حدة (shape, size, overlay…).
  final bool uniformStyle;

  const GalleryRenderStyle({
    this.defaultShape = 'rounded',
    this.defaultAspect,
    this.defaultSize = 'md',
    this.defaultOverlay = 'none',
    this.defaultBorder = 'none',
    this.defaultShadow = true,
    this.fit = BoxFit.cover,
    this.tileCornerRadius,
    this.sectionCustomWidth,
    this.sectionCustomHeight,
    this.uniformStyle = true,
  });

  factory GalleryRenderStyle.fromSection(HomeSection section) {
    String? aspectLabel;
    if (section.aspectRatio != null && section.aspectRatio!.isNotEmpty) {
      aspectLabel = section.aspectRatio;
    } else if (section.bannerAspect != null) {
      final a = section.bannerAspect!;
      if ((a - 1).abs() < 0.05) aspectLabel = '1:1';
      else if ((a - 4 / 3).abs() < 0.05) aspectLabel = '4:3';
      else if ((a - 3 / 4).abs() < 0.05) aspectLabel = '3:4';
      else if ((a - 16 / 9).abs() < 0.05) aspectLabel = '16:9';
    }

    return GalleryRenderStyle(
      defaultShape: section.shape ?? 'rounded',
      defaultAspect: aspectLabel,
      defaultSize: section.cardSize ?? 'md',
      defaultOverlay: section.overlayStyle ?? 'none',
      defaultBorder: section.borderStyle ?? 'none',
      defaultShadow: section.showShadow,
      fit: _parseFit(section.kind),
      tileCornerRadius: section.tileCornerRadius ?? HomeTheme.galleryRadius,
      sectionCustomWidth: section.customWidth,
      sectionCustomHeight: section.customHeight,
      uniformStyle: true,
    );
  }

  static BoxFit _parseFit(String? kind) {
    return switch (kind) {
      'contain' => BoxFit.contain,
      'fill' => BoxFit.fill,
      _ => BoxFit.cover,
    };
  }

  static const _styleKeys = [
    'shape',
    'size',
    'aspectRatio',
    'overlayStyle',
    'borderStyle',
    'showShadow',
    'customWidth',
    'customHeight',
    'spanCols',
    'spanRows',
    'cardSize',
  ];

  Map<String, dynamic> _contentOnly(Map<String, dynamic> raw) {
    if (!uniformStyle) return Map<String, dynamic>.from(raw);
    final m = Map<String, dynamic>.from(raw);
    for (final key in _styleKeys) {
      m.remove(key);
    }
    return m;
  }

  Map<String, dynamic> enrichRaw(Map<String, dynamic> raw) {
    final m = _contentOnly(raw);
    if (m['customWidth'] == null && sectionCustomWidth != null) {
      m['customWidth'] = sectionCustomWidth;
    }
    if (m['customHeight'] == null && sectionCustomHeight != null) {
      m['customHeight'] = sectionCustomHeight;
    }
    return m;
  }

  PhotoTileData tileData(Map<String, dynamic> raw) {
    return PhotoTileData.fromMap(
      enrichRaw(raw),
      defaultShape: defaultShape,
      defaultAspect: defaultAspect,
      defaultOverlay: defaultOverlay,
      defaultBorder: defaultBorder,
      defaultShadow: defaultShadow,
    );
  }

  String itemSize(Map<String, dynamic> raw) => defaultSize;

  double resolvedAspect() =>
      PhotoShapeGeometry.parseAspect(defaultAspect) ??
      PhotoShapeGeometry.aspectForShape(defaultShape);

  double tileHeight(double fallback) =>
      sectionCustomHeight ?? PhotoShapeGeometry.sizeHeight(defaultSize).clamp(96, fallback);

  double tileWidth(double height) {
    if (sectionCustomWidth != null && sectionCustomWidth! > 0) return sectionCustomWidth!;
    final aspect = resolvedAspect();
    return height * aspect;
  }
}

/// بطاقة صورة موحّدة — نفس التصميم لكل صور القسم.
class GalleryPhotoCard extends ConsumerWidget {
  final PhotoTileData data;
  final double width;
  final double height;
  final BoxFit fit;
  final VoidCallback? onTap;
  final bool showCaption;
  final double? cornerRadiusOverride;
  final bool showShadow;

  const GalleryPhotoCard({
    super.key,
    required this.data,
    required this.width,
    required this.height,
    this.fit = BoxFit.cover,
    this.onTap,
    this.showCaption = true,
    this.cornerRadiusOverride,
    this.showShadow = true,
  });

  bool _hasCaption(String lang) =>
      (data.titleForLang(lang)?.isNotEmpty ?? false) ||
      (data.subtitleForLang(lang)?.isNotEmpty ?? false);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (data.imageUrl.isEmpty) return const SizedBox.shrink();

    String? title;
    String? subtitle;
    String lang = 'ar';
    if (showCaption) {
      lang = ref.watch(languageCodeProvider);
      title = data.titleForLang(lang);
      subtitle = data.subtitleForLang(lang);
    }

    final shape = data.shape;
    final radius = PhotoShapeGeometry.cornerRadius(
      shape,
      height,
      override: cornerRadiusOverride,
    );
    final borderRadius = PhotoShapeGeometry.borderRadius(shape, radius);
    final border = PhotoShapeGeometry.border(data.borderStyle);

    Widget image = AppNetworkImage(
      url: data.imageUrl,
      fit: fit,
      width: width,
      height: height,
      backgroundColor: HomeTheme.pearl,
    );

    image = _GalleryOverlay(
      style: data.overlayStyle ?? 'none',
      title: title,
      subtitle: subtitle,
      badge: data.badge,
      child: image,
    );

    final framedImage = Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: shape == 'circle' ? null : borderRadius,
        shape: shape == 'circle' ? BoxShape.circle : BoxShape.rectangle,
        border: border,
        boxShadow: (showShadow || data.showShadow) ? HomeTheme.galleryShadow : null,
      ),
      child: ClipRRect(
        borderRadius: shape == 'circle' ? BorderRadius.zero : borderRadius,
        child: shape == 'circle'
            ? ClipOval(child: SizedBox(width: width, height: height, child: image))
            : SizedBox(width: width, height: height, child: image),
      ),
    );

    final card = SizedBox(
      width: width,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          framedImage,
          if (showCaption && _hasCaption(lang) && (data.overlayStyle ?? 'none') == 'none') ...[
            const SizedBox(height: 6),
            if (title?.isNotEmpty ?? false)
              Text(
                title!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: HomeTheme.chipLabel.copyWith(fontSize: 11.5, fontWeight: FontWeight.w700),
              ),
            if (subtitle?.isNotEmpty ?? false) ...[
              const SizedBox(height: 1),
              Text(
                subtitle!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: HomeTheme.body(size: 10.5, color: HomeTheme.inkMuted),
              ),
            ],
          ],
        ],
      ),
    );

    if (onTap == null) return card;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap!();
        },
        borderRadius: borderRadius,
        child: card,
      ),
    );
  }
}

/// شبكة منتظمة — كل البطاقات بنفس الحجم والشكل.
class GalleryGridLayout extends StatelessWidget {
  final HomeSection section;
  final List<Map<String, dynamic>> items;
  final int columns;
  final double gap;
  final GalleryRenderStyle style;
  final void Function(Map<String, dynamic> raw) onTap;

  const GalleryGridLayout({
    super.key,
    required this.section,
    required this.items,
    this.columns = 2,
    required this.gap,
    required this.style,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final sizer = GalleryTileSizer.forSection(
          viewportWidth: constraints.maxWidth,
          gap: gap,
          section: section,
          aspectRatio: GalleryTileSizer.resolveAspect(section, defaultAspect: style.defaultAspect),
          gridColumns: columns,
        );
        final tileW = sizer.tileWidth;
        final tileH = sizer.tileHeight;

        return Wrap(
          spacing: gap,
          runSpacing: gap,
          textDirection: Directionality.of(context),
          children: [
            for (final raw in items)
              Builder(
                builder: (context) {
                  final data = style.tileData(raw);
                  if (data.imageUrl.isEmpty) return const SizedBox.shrink();
                  return GalleryPhotoCard(
                    data: data,
                    width: tileW,
                    height: tileH,
                    fit: style.fit,
                    cornerRadiusOverride: style.tileCornerRadius,
                    showCaption: (data.overlayStyle ?? 'none') == 'none',
                    onTap: () => onTap(raw),
                  );
                },
              ),
          ],
        );
      },
    );
  }
}

/// تمرير أفقي — بطاقات موحّدة العرض والارتفاع.
class GalleryHorizontalLayout extends StatelessWidget {
  final HomeSection section;
  final List<Map<String, dynamic>> items;
  final double gap;
  final GalleryRenderStyle style;
  final void Function(Map<String, dynamic> raw) onTap;

  const GalleryHorizontalLayout({
    super.key,
    required this.section,
    required this.items,
    required this.gap,
    required this.style,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final sizer = GalleryTileSizer.forSection(
          viewportWidth: constraints.maxWidth,
          gap: gap,
          section: section,
          aspectRatio: GalleryTileSizer.resolveAspect(section, defaultAspect: style.defaultAspect),
        );
        final tileH = sizer.tileHeight;
        final tileW = sizer.tileWidth;
        final captionExtra = style.defaultOverlay == 'none' ? 28.0 : 0.0;

        return SizedBox(
          height: tileH + captionExtra,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
            padding: EdgeInsets.zero,
            itemCount: items.length,
            separatorBuilder: (_, __) => SizedBox(width: gap),
            itemBuilder: (context, i) {
              final raw = items[i];
              final data = style.tileData(raw);
              if (data.imageUrl.isEmpty) return const SizedBox.shrink();
              return GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {
                  HapticFeedback.selectionClick();
                  onTap(raw);
                },
                child: GalleryPhotoCard(
                  data: data,
                  width: tileW,
                  height: tileH,
                  fit: style.fit,
                  cornerRadiusOverride: style.tileCornerRadius,
                  showCaption: (data.overlayStyle ?? 'none') == 'none',
                  onTap: null,
                ),
              );
            },
          ),
        );
      },
    );
  }
}

/// عمود كامل العرض — صور بنفس النسبة.
class GalleryStackLayout extends StatelessWidget {
  final HomeSection section;
  final List<Map<String, dynamic>> items;
  final double gap;
  final GalleryRenderStyle style;
  final void Function(Map<String, dynamic> raw) onTap;

  const GalleryStackLayout({
    super.key,
    required this.section,
    required this.items,
    required this.gap,
    required this.style,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final sizer = GalleryTileSizer.forSection(
          viewportWidth: constraints.maxWidth,
          gap: gap,
          section: section,
          aspectRatio: GalleryTileSizer.resolveAspect(section, defaultAspect: style.defaultAspect),
        );

        return Column(
          children: [
            for (var i = 0; i < items.length; i++) ...[
              if (i > 0) SizedBox(height: gap),
              Builder(
                builder: (context) {
                  final data = style.tileData(items[i]);
                  if (data.imageUrl.isEmpty) return const SizedBox.shrink();
                  return GalleryPhotoCard(
                    data: data,
                    width: constraints.maxWidth,
                    height: sizer.tileHeight,
                    fit: style.fit,
                    cornerRadiusOverride: style.tileCornerRadius,
                    onTap: () => onTap(items[i]),
                  );
                },
              ),
            ],
          ],
        );
      },
    );
  }
}

class _GalleryOverlay extends StatelessWidget {
  final String style;
  final String? title;
  final String? subtitle;
  final String? badge;
  final Widget child;

  const _GalleryOverlay({
    required this.style,
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final hasText = (title?.isNotEmpty ?? false) || (subtitle?.isNotEmpty ?? false);
    final hasBadge = badge?.isNotEmpty ?? false;
    if (style == 'none' && !hasText && !hasBadge) return child;

    return Stack(
      fit: StackFit.expand,
      children: [
        child,
        if (style == 'gradient' || style == 'bottom' || hasText)
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: style == 'center' ? 0.35 : 0.04),
                    Colors.black.withValues(alpha: 0.68),
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ),
        if (hasBadge)
          PositionedDirectional(
            top: 8,
            end: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(
                color: HomeTheme.accent,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                badge!,
                style: HomeTheme.overline.copyWith(color: Colors.white, fontSize: 10),
              ),
            ),
          ),
        if (hasText && style != 'badge')
          PositionedDirectional(
            start: 12,
            end: 12,
            bottom: style == 'center' ? null : 12,
            top: style == 'center' ? 0 : null,
            child: style == 'center'
                ? Center(
                    child: _GalleryOverlayText(title: title, subtitle: subtitle, center: true),
                  )
                : _GalleryOverlayText(title: title, subtitle: subtitle),
          ),
      ],
    );
  }
}

class _GalleryOverlayText extends StatelessWidget {
  final String? title;
  final String? subtitle;
  final bool center;

  const _GalleryOverlayText({this.title, this.subtitle, this.center = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: center ? CrossAxisAlignment.center : CrossAxisAlignment.start,
      children: [
        if (title != null && title!.isNotEmpty)
          Text(
            title!,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: center ? TextAlign.center : TextAlign.start,
            style: HomeTheme.sectionTitle(size: 13).copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
        if (subtitle != null && subtitle!.isNotEmpty) ...[
          const SizedBox(height: 2),
          Text(
            subtitle!,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: center ? TextAlign.center : TextAlign.start,
            style: HomeTheme.body(size: 11, color: Colors.white.withValues(alpha: 0.9)),
          ),
        ],
      ],
    );
  }
}
