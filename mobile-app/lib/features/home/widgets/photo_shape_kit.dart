import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/widgets/app_network_image.dart';
import 'home_theme.dart';

/// بيانات بلاطة صورة — من payload الـ API أو افتراضيات القسم
class PhotoTileData {
  final String imageUrl;
  final String? title;
  final String? subtitle;
  final String? badge;
  final String shape;
  final String? aspectRatio;
  final String? overlayStyle;
  final String? borderStyle;
  final bool showShadow;
  final double? customWidth;
  final double? customHeight;
  final int spanCols;
  final int spanRows;

  const PhotoTileData({
    required this.imageUrl,
    this.title,
    this.subtitle,
    this.badge,
    this.shape = 'rounded',
    this.aspectRatio,
    this.overlayStyle,
    this.borderStyle,
    this.showShadow = true,
    this.customWidth,
    this.customHeight,
    this.spanCols = 1,
    this.spanRows = 1,
  });

  factory PhotoTileData.fromMap(
    Map<String, dynamic> raw, {
    String defaultShape = 'rounded',
    String? defaultAspect,
    String defaultOverlay = 'none',
    String defaultBorder = 'none',
    bool defaultShadow = true,
  }) {
    return PhotoTileData(
      imageUrl: _readImageUrl(raw),
      title: _trim(raw['title']),
      subtitle: _trim(raw['subtitle']),
      badge: _trim(raw['badge']),
      shape: raw['shape']?.toString().trim().isNotEmpty == true
          ? raw['shape'].toString()
          : defaultShape,
      aspectRatio: raw['aspectRatio']?.toString().trim().isNotEmpty == true
          ? raw['aspectRatio'].toString()
          : defaultAspect,
      overlayStyle: raw['overlayStyle']?.toString().trim().isNotEmpty == true
          ? raw['overlayStyle'].toString()
          : defaultOverlay,
      borderStyle: raw['borderStyle']?.toString().trim().isNotEmpty == true
          ? raw['borderStyle'].toString()
          : defaultBorder,
      showShadow: raw['showShadow'] is bool ? raw['showShadow'] as bool : defaultShadow,
      customWidth: (raw['customWidth'] as num?)?.toDouble(),
      customHeight: (raw['customHeight'] as num?)?.toDouble(),
      spanCols: (raw['spanCols'] as num?)?.toInt() ?? 1,
      spanRows: (raw['spanRows'] as num?)?.toInt() ?? 1,
    );
  }

  static String _trim(dynamic v) {
    final s = v?.toString().trim() ?? '';
    return s.isEmpty ? '' : s;
  }

  static String _readImageUrl(Map<String, dynamic> m) {
    final direct = m['imageUrl']?.toString();
    if (direct != null && direct.isNotEmpty) return direct;
    final image = m['image'];
    if (image is Map) {
      final map = Map<String, dynamic>.from(image);
      for (final key in ['url', 'full', 'hero', 'thumb']) {
        final v = map[key]?.toString();
        if (v != null && v.isNotEmpty) return v;
      }
    }
    return '';
  }
}

/// هندسة الأشكال — نسب، زوايا، ظلال، قص
abstract final class PhotoShapeGeometry {
  static double sizeHeight(String? size) {
    return switch (size) {
      'xs' => 72,
      'sm' => 96,
      'md' => 128,
      'lg' => 160,
      'xl' => 200,
      '2xl' => 260,
      'full' => 220,
      _ => 128,
    };
  }

  static double tileWidth({
    required double height,
    required String shape,
    required String? size,
    required PhotoTileData data,
    double? defaultAspect,
  }) {
    if (data.customWidth != null && data.customWidth! > 0) return data.customWidth!;
    if (size == 'full') return height * 1.72;
    if (shape == 'circle' || shape == 'square') return height;
    if (shape == 'banner') return height * 1.92;
    if (shape == 'portrait') return height * 0.78;
    if (shape == 'landscape') return height * 1.35;
    final aspect = parseAspect(data.aspectRatio) ?? defaultAspect;
    if (aspect != null && aspect > 0) return height * aspect;
    return switch (size) {
      'xs' => 72,
      'sm' => 96,
      'md' => 128,
      'lg' => 160,
      'xl' => 200,
      '2xl' => 260,
      _ => height * 0.92,
    };
  }

  static double? parseAspect(String? value) {
    if (value == null || value.isEmpty || value == 'auto' || value == 'custom') return null;
    if (value.contains(':')) {
      final parts = value.split(':');
      if (parts.length == 2) {
        final a = double.tryParse(parts[0]);
        final b = double.tryParse(parts[1]);
        if (a != null && b != null && b != 0) return a / b;
      }
    }
    return double.tryParse(value);
  }

  static double aspectForShape(String shape) {
    return switch (shape) {
      'circle' || 'square' => 1,
      'portrait' => 3 / 4,
      'landscape' => 4 / 3,
      'banner' => 16 / 9,
      'pill' => 2.2,
      _ => 0.88,
    };
  }

  static BoxFit parseFit(String? kind) {
    return switch (kind) {
      'contain' => BoxFit.contain,
      'fill' => BoxFit.fill,
      _ => BoxFit.cover,
    };
  }

  static double cornerRadius(String shape, double height) {
    return switch (shape) {
      'circle' => height / 2,
      'pill' => height / 2,
      'rect' => 8,
      'square' => 14,
      'arch' => height * 0.52,
      'banner' => 18,
      'rounded' => 18,
      _ => 16,
    };
  }

  static BorderRadius borderRadius(String shape, double radius) {
    if (shape == 'arch') {
      return BorderRadius.only(
        topLeft: Radius.circular(radius),
        topRight: Radius.circular(radius),
        bottomLeft: const Radius.circular(6),
        bottomRight: const Radius.circular(6),
      );
    }
    if (shape == 'rect') {
      return BorderRadius.circular(radius.clamp(4, 10));
    }
    return BorderRadius.circular(radius);
  }

  static List<BoxShadow> shadows(String shape, bool enabled) {
    if (!enabled) return const [];
    if (shape == 'circle') {
      return [
        BoxShadow(
          color: HomeTheme.sage.withValues(alpha: 0.18),
          blurRadius: 18,
          offset: const Offset(0, 6),
          spreadRadius: -4,
        ),
        BoxShadow(
          color: HomeTheme.ink.withValues(alpha: 0.06),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ];
    }
    return [
      BoxShadow(
        color: HomeTheme.ink.withValues(alpha: 0.1),
        blurRadius: 20,
        offset: const Offset(0, 8),
        spreadRadius: -6,
      ),
      BoxShadow(
        color: HomeTheme.ink.withValues(alpha: 0.04),
        blurRadius: 4,
        offset: const Offset(0, 1),
      ),
    ];
  }

  static BoxBorder? border(String? style) {
    if (style == null || style == 'none') return null;
    final width = switch (style) {
      'thin' => 1.0,
      'medium' => 2.0,
      'thick' => 3.0,
      'accent' => 2.0,
      _ => 0.0,
    };
    if (width <= 0) return null;
    if (style == 'accent') {
      return Border.all(color: HomeTheme.sage.withValues(alpha: 0.85), width: width);
    }
    return Border.all(color: Colors.white.withValues(alpha: 0.92), width: width);
  }

  static Widget shapedClip({
    required Widget child,
    required String shape,
    required BorderRadius radius,
  }) {
    if (shape == 'circle') {
      return ClipOval(child: child);
    }
    if (shape == 'arch') {
      return ClipPath(
        clipper: _ArchClipper(radius.topLeft.x),
        child: child,
      );
    }
    if (shape == 'diamond') {
      return ClipPath(
        clipper: _DiamondClipper(),
        child: child,
      );
    }
    return ClipRRect(borderRadius: radius, child: child);
  }
}

/// بلاطة صورة احترافية — ظل، شكل، overlay، ضغط
class PhotoTile extends StatefulWidget {
  final PhotoTileData data;
  final double? width;
  final double height;
  final BoxFit fit;
  final VoidCallback? onTap;
  final bool expand;
  final double? aspectRatio;

  const PhotoTile({
    super.key,
    required this.data,
    required this.height,
    this.width,
    this.fit = BoxFit.cover,
    this.onTap,
    this.expand = false,
    this.aspectRatio,
  });

  @override
  State<PhotoTile> createState() => _PhotoTileState();
}

class _PhotoTileState extends State<PhotoTile> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    if (widget.data.imageUrl.isEmpty) return const SizedBox.shrink();

    final shape = widget.data.shape;
    final h = widget.data.customHeight ?? widget.height;
    final w = widget.expand ? null : widget.width;
    final radius = PhotoShapeGeometry.cornerRadius(shape, h);
    final borderRadius = PhotoShapeGeometry.borderRadius(shape, radius);
    final aspect = widget.aspectRatio ?? PhotoShapeGeometry.parseAspect(widget.data.aspectRatio);

    Widget image = AppNetworkImage(
      url: widget.data.imageUrl,
      fit: widget.fit,
      width: w,
      height: h,
    );

    image = _PhotoOverlay(
      style: widget.data.overlayStyle ?? 'none',
      title: widget.data.title,
      subtitle: widget.data.subtitle,
      badge: widget.data.badge,
      child: image,
    );

    image = PhotoShapeGeometry.shapedClip(
      child: image,
      shape: shape,
      radius: borderRadius,
    );

    // حلقة داخلية للعمق
    if (shape != 'rect') {
      image = Stack(
        fit: StackFit.passthrough,
        children: [
          image,
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: borderRadius,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.12), width: 1),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.white.withValues(alpha: 0.14),
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.04),
                    ],
                    stops: const [0, 0.35, 1],
                  ),
                ),
              ),
            ),
          ),
        ],
      );
    }

    Widget tile = AnimatedScale(
      scale: _pressed ? 0.97 : 1,
      duration: const Duration(milliseconds: 140),
      curve: Curves.easeOutCubic,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        width: widget.expand ? double.infinity : w,
        height: widget.expand ? null : h,
        constraints: widget.expand && aspect != null
            ? null
            : BoxConstraints.tightFor(width: w, height: h),
        decoration: BoxDecoration(
          borderRadius: shape == 'circle' ? null : borderRadius,
          shape: shape == 'circle' ? BoxShape.circle : BoxShape.rectangle,
          boxShadow: PhotoShapeGeometry.shadows(shape, widget.data.showShadow),
          border: PhotoShapeGeometry.border(widget.data.borderStyle),
          color: HomeTheme.surfaceMuted,
        ),
        clipBehavior: Clip.none,
        child: aspect != null && widget.expand
            ? AspectRatio(aspectRatio: aspect, child: image)
            : SizedBox(width: w, height: h, child: image),
      ),
    );

    if (widget.onTap != null) {
      tile = GestureDetector(
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp: (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        onTap: () {
          HapticFeedback.lightImpact();
          widget.onTap!();
        },
        child: tile,
      );
    }

    return tile;
  }
}

class _PhotoOverlay extends StatelessWidget {
  final String style;
  final String? title;
  final String? subtitle;
  final String? badge;
  final Widget child;

  const _PhotoOverlay({
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
                    Colors.black.withValues(alpha: style == 'center' ? 0.35 : 0.05),
                    Colors.black.withValues(alpha: 0.72),
                  ],
                  stops: const [0.0, 0.45, 1.0],
                ),
              ),
            ),
          ),
        if (hasBadge)
          Positioned(
            top: 10,
            right: 10,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: HomeTheme.sage.withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                  ),
                  child: Text(
                    badge!,
                    style: GoogleFontsStyle.badge,
                  ),
                ),
              ),
            ),
          ),
        if (hasText)
          Positioned(
            left: 12,
            right: 12,
            bottom: style == 'center' ? null : 12,
            top: style == 'center' ? 0 : null,
            child: style == 'center'
                ? Center(child: _TextBlock(title: title, subtitle: subtitle, center: true))
                : _TextBlock(title: title, subtitle: subtitle),
          ),
      ],
    );
  }
}

class _TextBlock extends StatelessWidget {
  final String? title;
  final String? subtitle;
  final bool center;

  const _TextBlock({this.title, this.subtitle, this.center = false});

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
              shadows: [
                Shadow(color: Colors.black.withValues(alpha: 0.4), blurRadius: 6),
              ],
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

/// تجنّب import google_fonts في كل ملف — wrapper بسيط
abstract final class GoogleFontsStyle {
  static TextStyle get badge => HomeTheme.overline.copyWith(
        color: Colors.white,
        fontSize: 10,
        letterSpacing: 0.2,
      );
}

class _ArchClipper extends CustomClipper<Path> {
  final double archRadius;
  const _ArchClipper(this.archRadius);

  @override
  Path getClip(Size size) {
    final path = Path();
    path.moveTo(0, size.height);
    path.lineTo(0, archRadius);
    path.quadraticBezierTo(size.width / 2, -archRadius * 0.15, size.width, archRadius);
    path.lineTo(size.width, size.height);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant _ArchClipper old) => old.archRadius != archRadius;
}

class _DiamondClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final path = Path();
    path.moveTo(size.width / 2, 0);
    path.lineTo(size.width, size.height / 2);
    path.lineTo(size.width / 2, size.height);
    path.lineTo(0, size.height / 2);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}
