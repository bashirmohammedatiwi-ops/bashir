/// Resolve display/download URLs for Media objects returned by the API.
String? resolveMediaUrl(Map<String, dynamic>? media, {String prefer = 'medium'}) {
  if (media == null || media.isEmpty) return null;

  final direct = media['url']?.toString() ?? media['thumbnailUrl']?.toString();
  if (direct != null && direct.startsWith('http')) return direct;

  final variants = media['variants'];
  if (variants is Map) {
    final order = <String>[
      prefer,
      if (prefer != 'medium') 'medium',
      if (prefer != 'large') 'large',
      if (prefer != 'small') 'small',
      if (prefer != 'thumb') 'thumb',
    ];
    for (final size in order) {
      final slot = variants[size];
      if (slot is! Map) continue;
      final formats = slot['formats'];
      if (formats is! Map) continue;
      for (final fmt in ['webp', 'jpg', 'jpeg', 'avif', 'png']) {
        final u = formats[fmt]?.toString();
        if (u != null && u.startsWith('http')) return u;
      }
    }
  }

  final base = media['publicUrlBase']?.toString();
  final filename = media['filename']?.toString();
  if (base != null && filename != null && base.isNotEmpty && filename.isNotEmpty) {
    final b = base.endsWith('/') ? base.substring(0, base.length - 1) : base;
    return '$b/$filename.webp';
  }
  return null;
}

/// Resolve URL from a ProductImage row (`{ media, url, ... }`).
String? resolveProductImageUrl(Map<String, dynamic> image, {String prefer = 'medium'}) {
  final media = image['media'];
  if (media is Map) {
    final fromMedia = resolveMediaUrl(Map<String, dynamic>.from(media), prefer: prefer);
    if (fromMedia != null) return fromMedia;
  }
  final url = image['url']?.toString() ?? image['thumbUrl']?.toString();
  if (url != null && url.startsWith('http')) return url;
  return null;
}
