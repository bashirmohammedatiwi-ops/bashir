import 'package:flutter/material.dart';

import '../../../core/l10n/localized_text.dart' as l10n;
import '../../../core/utils/json.dart';
import '../../../core/utils/media_url.dart';
import 'home_theme.dart';

/// بيانات بلاطة صورة — من payload الـ API أو افتراضيات القسم
class PhotoTileData {
  final String imageUrl;
  final String? title;
  final String? titleEn;
  final String? subtitle;
  final String? subtitleEn;
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
    this.titleEn,
    this.subtitle,
    this.subtitleEn,
    this.badge,
    this.shape = 'rounded',
    this.aspectRatio,
    this.overlayStyle,
    this.borderStyle,
    this.showShadow = false,
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
    bool defaultShadow = false,
    bool galleryMode = false,
  }) {
    final overlayFromRaw = raw['overlayStyle']?.toString().trim();
    final borderFromRaw = raw['borderStyle']?.toString().trim();
    final shadowFromRaw = raw['showShadow'] is bool ? raw['showShadow'] as bool : defaultShadow;

    return PhotoTileData(
      imageUrl: _readImageUrl(raw),
      title: _trim(raw['title']),
      titleEn: _trim(raw['titleEn']),
      subtitle: _trim(raw['subtitle']),
      subtitleEn: _trim(raw['subtitleEn']),
      badge: _trim(raw['badge']),
      shape: raw['shape']?.toString().trim().isNotEmpty == true
          ? raw['shape'].toString()
          : defaultShape,
      aspectRatio: raw['aspectRatio']?.toString().trim().isNotEmpty == true
          ? raw['aspectRatio'].toString()
          : defaultAspect,
      overlayStyle: overlayFromRaw?.isNotEmpty == true ? overlayFromRaw : defaultOverlay,
      borderStyle: borderFromRaw?.isNotEmpty == true ? borderFromRaw : defaultBorder,
      showShadow: shadowFromRaw,
      customWidth: (raw['customWidth'] as num?)?.toDouble(),
      customHeight: (raw['customHeight'] as num?)?.toDouble(),
      spanCols: (raw['spanCols'] as num?)?.toInt() ?? 1,
      spanRows: (raw['spanRows'] as num?)?.toInt() ?? 1,
    );
  }

  String? titleForLang(String lang) {
    final val = l10n.localizedText(languageCode: lang, ar: title, en: titleEn, fallback: '');
    return val.trim().isEmpty ? null : val;
  }

  String? subtitleForLang(String lang) {
    final val = l10n.localizedText(languageCode: lang, ar: subtitle, en: subtitleEn, fallback: '');
    return val.trim().isEmpty ? null : val;
  }

  static String _trim(dynamic v) {
    final s = v?.toString().trim() ?? '';
    return s.isEmpty ? '' : s;
  }

  static String _readImageUrl(Map<String, dynamic> m) {
    return resolveImageFromPayload(
      directUrl: m['imageUrl']?.toString(),
      image: m['image'] is Map ? asMap(m['image']) : null,
    );
  }
}

/// هندسة الأشكال — نسب، زوايا، إطارات
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

  static double? parseAspect(String? value) {
    if (value == null || value.isEmpty || value == 'auto' || value == 'custom') {
      return null;
    }
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

  static double cornerRadius(String shape, double height, {double? override}) {
    if (override != null && override >= 0) return override;
    return switch (shape) {
      'circle' => height / 2,
      'pill' => height / 2,
      'rect' => 8,
      'square' => 12,
      'arch' => height * 0.52,
      'banner' => 14,
      'rounded' => 14,
      _ => 14,
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

  /// إطار الصورة — «accent» بلون العالم الحالي (مرّري `t.accent`)، والبقية أبيض شفيف.
  static BoxBorder? border(String? style, {Color accent = HomeTheme.accent}) {
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
      return Border.all(color: accent.withValues(alpha: 0.85), width: width);
    }
    return Border.all(color: Colors.white.withValues(alpha: 0.92), width: width);
  }
}
