import '../config/app_config.dart';

/// يحوّل مسار وسائط نسبي إلى رابط كامل صالح للعرض.
String resolveMediaUrl(String? raw) {
  var value = (raw ?? '').trim();
  if (value.isEmpty) return '';

  while (value.contains('/media/media/')) {
    value = value.replaceAll('/media/media/', '/media/');
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return AppConfig.normalizeAppUrl(value);
  }

  final base = AppConfig.mediaBaseUrl;
  final origin = AppConfig.webOrigin;

  if (value.startsWith('/media')) return '$origin$value';
  if (value.startsWith('/')) return '$origin$value';
  if (value.startsWith('media/')) return '$origin/$value';
  return '$base/$value';
}

/// يستخرج رابط صورة من حقل imageUrl أو كائن media في أقسام الرئيسية/CMS.
String resolveImageFromPayload({
  String? directUrl,
  Map<String, dynamic>? image,
}) {
  final direct = (directUrl ?? '').trim();
  if (direct.isNotEmpty) return resolveMediaUrl(direct);

  if (image == null || image.isEmpty) return '';

  for (final key in ['url', 'full', 'hero', 'thumb', 'originalUrl', 'originalUrlJpg']) {
    final v = image[key]?.toString().trim();
    if (v != null && v.isNotEmpty) return resolveMediaUrl(v);
  }

  final variants = image['variants'];
  if (variants is Map) {
    for (final size in ['medium', 'thumb', 'small', 'large']) {
      final node = variants[size];
      if (node is! Map) continue;
      final formats = node['formats'];
      if (formats is! Map) continue;
      for (final fmt in ['webp', 'jpg', 'avif']) {
        final path = formats[fmt]?.toString().trim();
        if (path != null && path.isNotEmpty) return resolveMediaUrl(path);
      }
    }
  }

  final publicUrlBase = image['publicUrlBase']?.toString().trim() ?? '';
  final filename = image['filename']?.toString().trim() ?? '';
  if (publicUrlBase.isNotEmpty && filename.isNotEmpty) {
    return resolveMediaUrl('$publicUrlBase/$filename.webp');
  }

  return '';
}
