import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_section.dart';
import '../../worlds/world_theme.dart';
import 'gallery_tile_sizer.dart';
import 'home_animations.dart';
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
      if ((a - 1).abs() < 0.05) {
        aspectLabel = '1:1';
      } else if ((a - 4 / 3).abs() < 0.05) {
        aspectLabel = '4:3';
      } else if ((a - 3 / 4).abs() < 0.05) {
        aspectLabel = '3:4';
      } else if ((a - 16 / 9).abs() < 0.05) {
        aspectLabel = '16:9';
      }
    }

    return GalleryRenderStyle(
      defaultShape: section.shape ?? 'rounded',
      defaultAspect: aspectLabel,
      defaultSize: section.cardSize ?? 'md',
      defaultOverlay: section.overlayStyle ?? 'none',
      defaultBorder: section.borderStyle ?? 'none',
      defaultShadow: section.showShadow,
      fit: _parseFit(section.kind),
      // بلا قيمة من اللوحة = زوايا الشكل نفسه (حبة/قوس/دائرة) أو galleryRadius — انظري [cornerRadiusFor].
      tileCornerRadius: section.tileCornerRadius,
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

  /// زاوية البطاقة: الأشكال ذات الزوايا المحسوبة (حبة، قوس، دائرة) تبقى كما صمّمتها اللوحة،
  /// والبقية تأخذ زاوية القسم أو [HomeTheme.galleryRadius].
  double? cornerRadiusFor(String shape) =>
      _shapeOwnsRadius.contains(shape) ? null : (tileCornerRadius ?? HomeTheme.galleryRadius);

  static const _shapeOwnsRadius = {'pill', 'arch', 'circle'};

  double tileHeight(double fallback) {
    if (sectionCustomHeight != null) return sectionCustomHeight!;
    // حدّ أدنى لا يتجاوز الأعلى — clamp يرمي خطأ إن انعكس المدى.
    final lo = math.min(96.0, fallback);
    return PhotoShapeGeometry.sizeHeight(defaultSize).clamp(lo, math.max(lo, fallback));
  }

  double tileWidth(double height) {
    if (sectionCustomWidth != null && sectionCustomWidth! > 0) {
      return sectionCustomWidth!;
    }
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

  /// null = إعداد الصورة/القسم من اللوحة ([PhotoTileData.showShadow]).
  final bool? showShadow;

  const GalleryPhotoCard({
    super.key,
    required this.data,
    required this.width,
    required this.height,
    this.fit = BoxFit.cover,
    this.onTap,
    this.showCaption = true,
    this.cornerRadiusOverride,
    this.showShadow,
  });

  bool _hasCaption(String lang) =>
      (data.titleForLang(lang)?.isNotEmpty ?? false) ||
      (data.subtitleForLang(lang)?.isNotEmpty ?? false);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (data.imageUrl.isEmpty) return const SizedBox.shrink();

    final t = context.worldTheme;
    final lang = ref.watch(languageCodeProvider);
    final rawTitle = data.titleForLang(lang);
    final title = showCaption ? rawTitle : null;
    final subtitle = showCaption ? data.subtitleForLang(lang) : null;

    final shape = data.shape;
    final radius = PhotoShapeGeometry.cornerRadius(shape, height, override: cornerRadiusOverride);
    final borderRadius = PhotoShapeGeometry.borderRadius(shape, radius);
    final border = PhotoShapeGeometry.border(data.borderStyle, accent: t.accent);

    Widget image = AppNetworkImage(
      url: data.imageUrl,
      fit: fit,
      width: width,
      height: height,
      backgroundColor: t.accentLight,
    );

    // 'none' = النص تحت الصورة فقط؛ غير ذلك = النص فوق الصورة فقط — لا تكرار.
    final overlayStyle = data.overlayStyle ?? 'none';
    final textOnImage = overlayStyle != 'none';
    image = _GalleryOverlay(
      style: overlayStyle,
      title: textOnImage ? title : null,
      subtitle: textOnImage ? subtitle : null,
      badge: data.badge,
      accent: t.accent,
      child: image,
    );

    final framedImage = Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: shape == 'circle' ? null : borderRadius,
        shape: shape == 'circle' ? BoxShape.circle : BoxShape.rectangle,
        border: border,
        boxShadow: (showShadow ?? data.showShadow) ? t.cardShadow : null,
      ),
      child: ClipRRect(
        borderRadius: shape == 'circle' ? BorderRadius.zero : borderRadius,
        child: shape == 'circle'
            ? ClipOval(
                child: SizedBox(width: width, height: height, child: image),
              )
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
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (title?.isNotEmpty ?? false)
                        Text(
                          title!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: HomeTheme.chipLabel.copyWith(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                            color: t.ink,
                            height: 1.2,
                          ),
                        ),
                      if (subtitle?.isNotEmpty ?? false)
                        Text(
                          subtitle!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: HomeTheme.body(size: 11, color: t.inkMuted),
                        ),
                    ],
                  ),
                ),
                if (onTap != null && width >= 110)
                  Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(
                      color: t.accentLight,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.chevron_right_rounded, size: 18, color: t.accentDark),
                  ),
              ],
            ),
          ],
        ],
      ),
    );

    // تسمية لقارئ الشاشة — العنوان (والعنوان الفرعي) من اللوحة، أو «صورة».
    final rawSubtitle = data.subtitleForLang(lang);
    final label = rawTitle == null
        ? ref.watch(stringsProvider).homeMediaPhoto
        : (rawSubtitle == null ? rawTitle : '$rawTitle, $rawSubtitle');
    if (onTap == null) {
      return Semantics(
        image: true,
        label: label,
        child: ExcludeSemantics(child: card),
      );
    }

    // ضغطة مرئية فوق الصورة (التموّج كان يُرسم تحت الصورة المعتمة فلا يظهر).
    return Semantics(
      button: true,
      image: true,
      label: label,
      child: ExcludeSemantics(
        child: HomeTapScale(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap!();
          },
          child: card,
        ),
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

        // الصف الأخير الناقص يتمدد ليملأ العرض — لا بطاقات يتيمة ولا فراغات.
        final visible = items.where((raw) => style.tileData(raw).imageUrl.isNotEmpty).toList();
        final remainder = columns > 1 ? visible.length % columns : 0;
        final rowW = constraints.maxWidth;
        return Wrap(
          spacing: gap,
          runSpacing: gap,
          textDirection: Directionality.of(context),
          children: [
            for (var i = 0; i < visible.length; i++)
              Builder(
                builder: (context) {
                  final raw = visible[i];
                  final data = style.tileData(raw);
                  final inLastRow = remainder > 0 && i >= visible.length - remainder;
                  final w = inLastRow ? (rowW - gap * (remainder - 1)) / remainder : tileW;
                  // البطاقة الوحيدة في الصف الأخير أعرض — نحدّ ارتفاعها دون قلب مدى clamp
                  // (البلاطات القصيرة < 120 كانت ترمي ArgumentError).
                  final lo = math.min(120.0, tileH);
                  final h = inLastRow && remainder == 1
                      ? (w / 2.1).clamp(lo, math.max(lo, tileH)).toDouble()
                      : tileH;
                  return GalleryPhotoCard(
                    data: data,
                    width: w,
                    height: h,
                    fit: style.fit,
                    cornerRadiusOverride: style.cornerRadiusFor(data.shape),
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
/// [padding] داخل القائمة نفسها، فتمرّ الصور حتى حافة الشاشة مثل صفوف المنتجات.
class GalleryHorizontalLayout extends ConsumerWidget {
  final HomeSection section;
  final List<Map<String, dynamic>> items;
  final double gap;
  final GalleryRenderStyle style;
  final void Function(Map<String, dynamic> raw) onTap;
  final EdgeInsetsGeometry padding;

  const GalleryHorizontalLayout({
    super.key,
    required this.section,
    required this.items,
    required this.gap,
    required this.style,
    required this.onTap,
    this.padding = EdgeInsets.zero,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    final scaler = MediaQuery.textScalerOf(context);
    final resolvedPadding = padding.resolve(Directionality.of(context));
    // الصور بلا رابط صورة تُستبعد قبل البناء — لا فجوات مزدوجة بين الفواصل.
    final visible = [
      for (final raw in items)
        if (style.tileData(raw).imageUrl.isNotEmpty) raw,
    ];
    if (visible.isEmpty) return const SizedBox.shrink();

    return LayoutBuilder(
      builder: (context, constraints) {
        final sizer = GalleryTileSizer.forSection(
          // مقاس البطاقات من العرض المرئي بعد الحشوة — نفس المقاس قبل نقل الحشوة للداخل.
          viewportWidth: math.max(0.0, constraints.maxWidth - resolvedPadding.horizontal),
          gap: gap,
          section: section,
          aspectRatio: GalleryTileSizer.resolveAspect(section, defaultAspect: style.defaultAspect),
        );
        final tileH = sizer.tileHeight;
        final tileW = sizer.tileWidth;

        // مساحة التعليق تحت الصورة: 9 فراغ + العنوان (13.5×1.2) + العنوان الفرعي (11×1.4) إن وُجد،
        // بحجم الخط الفعلي للمستخدم — لا قصّ للنص عند تكبير الخط.
        var hasCaption = false;
        var hasSub = false;
        for (final raw in visible) {
          final d = style.tileData(raw);
          if ((d.overlayStyle ?? 'none') != 'none') continue;
          if (d.titleForLang(lang)?.isNotEmpty ?? false) hasCaption = true;
          if (d.subtitleForLang(lang)?.isNotEmpty ?? false) {
            hasCaption = true;
            hasSub = true;
          }
        }
        final textH = scaler.scale(13.5) * 1.2 + (hasSub ? scaler.scale(11) * 1.4 : 0);
        // سهم «افتحي» (24) يظهر بجانب النص في البطاقات العريضة.
        final captionRowH = tileW >= 110 ? math.max(textH, 24.0) : textH;
        final captionExtra = hasCaption ? 9 + captionRowH + 2 : 0.0;

        return SizedBox(
          height: tileH + captionExtra,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
            padding: padding,
            itemCount: visible.length,
            separatorBuilder: (_, __) => SizedBox(width: gap),
            itemBuilder: (context, i) {
              final raw = visible[i];
              final data = style.tileData(raw);
              return Align(
                alignment: AlignmentDirectional.topStart,
                child: GalleryPhotoCard(
                  data: data,
                  width: tileW,
                  height: tileH,
                  fit: style.fit,
                  cornerRadiusOverride: style.cornerRadiusFor(data.shape),
                  showCaption: (data.overlayStyle ?? 'none') == 'none',
                  onTap: () => onTap(raw),
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
        // كل صورة بعرض الشاشة كاملاً — الارتفاع من النسبة بغضّ النظر عن tilesPerView
        // (الفسيفساء كانت تُرسم شريطاً بارتفاع ~73).
        final tileH = GalleryTileSizer(
          viewportWidth: constraints.maxWidth,
          gap: gap,
          tilesPerView: 1,
          rowHeight: section.rowHeight ?? 'auto',
          aspectRatio: GalleryTileSizer.resolveAspect(section, defaultAspect: style.defaultAspect),
        ).tileHeight;
        final visible = [
          for (final raw in items)
            if (style.tileData(raw).imageUrl.isNotEmpty) raw,
        ];

        return Column(
          children: [
            for (var i = 0; i < visible.length; i++) ...[
              if (i > 0) SizedBox(height: gap),
              Builder(
                builder: (context) {
                  final data = style.tileData(visible[i]);
                  return GalleryPhotoCard(
                    data: data,
                    width: constraints.maxWidth,
                    height: tileH,
                    fit: style.fit,
                    cornerRadiusOverride: style.cornerRadiusFor(data.shape),
                    onTap: () => onTap(visible[i]),
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
  final Color accent;
  final Widget child;

  const _GalleryOverlay({
    required this.style,
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.accent,
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
              decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(20)),
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
            style: HomeTheme.sectionTitle(
              size: 13,
            ).copyWith(color: Colors.white, fontWeight: FontWeight.w800),
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
