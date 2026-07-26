/// يحوّل روابط الموقع (App Links / Universal Links) إلى مسارات التطبيق.
String? resolveDeepLink(Uri uri) {
  var path = uri.path;
  if (path.length > 1 && path.endsWith('/')) {
    path = path.substring(0, path.length - 1);
  }

  final slug = uri.queryParameters['slug']?.trim();

  switch (path) {
    case '/product':
      if (slug != null && slug.isNotEmpty) return '/product/$slug';
      break;
    case '/package':
      if (slug != null && slug.isNotEmpty) return '/package/$slug';
      break;
    case '/category':
      if (slug != null && slug.isNotEmpty) return '/category/$slug';
      break;
    case '/brand':
      if (slug != null && slug.isNotEmpty) return '/brand/$slug';
      break;
    case '/offers':
      return '/offers';
    case '/categories':
    case '/categories-tab':
      return '/categories-tab';
    case '/brands':
      return '/brands';
    case '/cart':
      return '/cart';
    case '/privacy':
      return '/privacy';
    case '/terms':
      return '/terms';
    case '/about':
      return '/about';
    case '/products':
      return uri.hasQuery ? '/products?${uri.query}' : '/products';
    case '':
    case '/':
      return '/';
  }

  final productSeg = RegExp(r'^/product/([^/]+)$').firstMatch(path);
  if (productSeg != null) return '/product/${productSeg.group(1)}';

  final packageSeg = RegExp(r'^/package/([^/]+)$').firstMatch(path);
  if (packageSeg != null) return '/package/${packageSeg.group(1)}';

  final categorySeg = RegExp(r'^/category/([^/]+)$').firstMatch(path);
  if (categorySeg != null) return '/category/${categorySeg.group(1)}';

  final brandSeg = RegExp(r'^/brand/([^/]+)$').firstMatch(path);
  if (brandSeg != null) return '/brand/${brandSeg.group(1)}';

  if (path.startsWith('/admin')) return '/';

  return null;
}

/// يحلّل نص QR/باركود أو رابط كامل إلى مسار داخل التطبيق.
String? resolveScannedLink(String raw) {
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return null;

  final uri = Uri.tryParse(trimmed);
  if (uri != null && uri.hasScheme) {
    if (_isStoreHost(uri.host)) return resolveDeepLink(uri);
    if (uri.pathSegments.contains('product')) {
      final idx = uri.pathSegments.indexOf('product');
      if (idx + 1 < uri.pathSegments.length) {
        return '/product/${uri.pathSegments[idx + 1]}';
      }
      final slug = uri.queryParameters['slug'];
      if (slug != null && slug.isNotEmpty) return '/product/$slug';
    }
  }

  if (trimmed.startsWith('/')) {
    return resolveDeepLink(Uri.parse('https://deemaalhayat.com$trimmed'));
  }

  if (RegExp(r'^[0-9a-f-]{36}$', caseSensitive: false).hasMatch(trimmed)) {
    return '/product/$trimmed';
  }

  return null;
}

bool _isStoreHost(String host) {
  final h = host.toLowerCase();
  return h == 'deemaalhayat.com' || h == 'www.deemaalhayat.com';
}
