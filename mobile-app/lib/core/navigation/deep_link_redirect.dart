final _worldSlug = RegExp(r'^[a-z0-9-]{1,40}$', caseSensitive: false);

/// slug العالم من «?world=…» إن كان صالحاً — نفس شرط الموقع (web-store/middleware.ts).
String? worldSlugOf(Uri uri) {
  final world = uri.queryParameters['world']?.trim();
  return world != null && _worldSlug.hasMatch(world) ? world : null;
}

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
      // نُبقي المسار كما هو (مثل /offers) — الموجّه يفتح تبويب الأقسام مباشرة.
      // تحويله إلى مسار آخر أولاً كان ينتهي بصفحة "غير موجودة".
      return path;
    case '/brands':
      // ?q= يملأ بحث دليل البراندات (يطبّقه الموجّه قبل فتح التبويب).
      return uri.hasQuery ? '/brands?${uri.query}' : '/brands';
    // دليل البشرة والباقات والروتين — للإشعارات والحملات.
    case '/skin-guide':
    case '/skin-quiz':
      return path;
    case '/packages':
      return uri.hasQuery ? '/packages?${uri.query}' : '/packages';
    case '/cart':
      return '/cart';
    // صفحات الزبونة — للإشعارات والحملات (افتحي مفضلتك، تتبّعي طلبك…).
    case '/account':
    case '/wishlist':
    case '/orders':
    case '/notifications':
    case '/loyalty':
      return path;
    // صفحات «حسابي» في الموقع ← شاشاتها في التطبيق (روابط واتساب والبريد).
    case '/account/orders':
      return '/orders';
    case '/account/points':
      return '/loyalty';
    case '/account/addresses':
      return '/addresses';
    case '/account/notifications':
      return '/notifications';
    case '/account/profile':
      return '/edit-profile';
    case '/account/alerts':
      return '/alerts';
    case '/account/beauty':
      // «ملفّي الجمالي» في الموقع = نتيجة اختبار البشرة المحفوظة.
      return '/skin-quiz?result=1';
    case '/signin':
      return '/login';
    case '/signup':
      return '/register';
    case '/help':
      return '/help';
    // المقارنة: قائمة الجهاز نفسه (الموقع يحفظها محلياً أيضاً، فلا معاملات تُنقل).
    case '/compare':
      return '/compare';
    // صفحات ويب بلا مقابل في التطبيق — الرئيسية بدل «الصفحة غير موجودة».
    case '/gifts':
      return '/';
    case '/privacy':
    case '/en/privacy':
      return '/privacy';
    case '/terms':
    case '/en/terms':
      return '/terms';
    case '/about':
      return '/about';
    case '/products':
      return uri.hasQuery ? '/products?${uri.query}' : '/products';
    case '/search':
      return uri.hasQuery ? '/search?${uri.query}' : '/search';
    // «ديما»: روابط الحملات والإشعارات (سؤال جاهز ?q= أو منتج ?product=).
    case '/advisor':
      return uri.hasQuery ? '/advisor?${uri.query}' : '/advisor';
    case '':
    case '/':
      // ?world=slug يلوّن الرئيسية بعالمه (يطبّقه الموجّه) — بقية المعاملات تُهمل.
      final world = worldSlugOf(uri);
      return world != null ? '/?world=$world' : '/';
  }

  final productSeg = RegExp(r'^/product/([^/]+)$').firstMatch(path);
  if (productSeg != null) return '/product/${productSeg.group(1)}';

  final packageSeg = RegExp(r'^/package/([^/]+)$').firstMatch(path);
  if (packageSeg != null) return '/package/${packageSeg.group(1)}';

  final guideSeg = RegExp(r'^/skin-guide/([^/]+)$').firstMatch(path);
  if (guideSeg != null) return '/skin-guide/${guideSeg.group(1)}';

  final categorySeg = RegExp(r'^/category/([^/]+)$').firstMatch(path);
  if (categorySeg != null) return '/category/${categorySeg.group(1)}';

  final orderSeg = RegExp(r'^/(?:account/)?orders/([^/]+)$').firstMatch(path);
  if (orderSeg != null) return '/orders/${orderSeg.group(1)}';

  final brandSeg = RegExp(r'^/brand/([^/]+)$').firstMatch(path);
  if (brandSeg != null) return '/brand/${brandSeg.group(1)}';

  if (path.startsWith('/admin')) return '/';

  return null;
}

/// رابط كامل لموقع المتجر نفسه (من إشعار أو بانر) ← مساره داخل التطبيق،
/// أو null إن لم يكن من موقعنا أو لا مقابل له (مثل /pay) فيُفتح في المتصفح.
String? resolveStoreUrl(String url) {
  final uri = Uri.tryParse(url.trim());
  if (uri == null || !(uri.isScheme('https') || uri.isScheme('http'))) return null;
  if (!_isStoreHost(uri.host)) return null;
  return resolveDeepLink(uri);
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
