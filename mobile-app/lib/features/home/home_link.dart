import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/locale_provider.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/utils/support_links.dart';
import '../../../data/models/banner.dart';
import '../../../data/models/brand.dart';
import '../../../data/models/category.dart';
import '../../../data/models/home_section.dart';

final _uuidRe = RegExp(
  r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
);

bool _isUuid(String value) => _uuidRe.hasMatch(value.trim());

String? _trimField(dynamic value) {
  if (value == null) return null;
  final s = value.toString().trim();
  return s.isEmpty ? null : s;
}

String? _readLinkType(Map<String, dynamic> raw) =>
    _trimField(raw['linkType']) ?? _trimField(raw['targetType']);

String? _readLinkValue(Map<String, dynamic> raw) {
  final direct = _trimField(raw['linkValue']) ??
      _trimField(raw['targetId']) ??
      _trimField(raw['productId']) ??
      _trimField(raw['brandId']) ??
      _trimField(raw['categoryId']) ??
      _trimField(raw['subcategoryId']) ??
      _trimField(raw['tertiaryCategoryId']) ??
      _trimField(raw['packageId']) ??
      _trimField(raw['concernSlug']) ??
      _trimField(raw['slug']) ??
      _trimField(raw['value']);

  if (direct != null) return direct;

  final target = raw['target'];
  if (target is Map) {
    final m = Map<String, dynamic>.from(target);
    return _trimField(m['id']) ??
        _trimField(m['slug']) ??
        _trimField(m['value']);
  }
  return null;
}

String? _normalizeAppPath(String raw) {
  final p = raw.trim();
  if (p.isEmpty) return null;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  if (p.startsWith('/')) return p;
  if (p.contains('?') || p.startsWith('products')) return '/$p';
  return null;
}

void navigateSectionPath(BuildContext context, String path) {
  final normalized = _normalizeAppPath(path);
  if (normalized == null) return;
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    openExternalUrl(normalized);
    return;
  }
  _pushAppPath(context, normalized);
}

String? _readLegacyLink(Map<String, dynamic> raw) =>
    _trimField(raw['link']) ?? _trimField(raw['href']) ?? _trimField(raw['url']);

/// يبني مسار التطبيق — نفس منطق الـ API ولوحة التحكم.
String? buildSectionItemPath({
  String? linkType,
  String? linkValue,
  String? legacyLink,
}) {
  final type = (linkType ?? '').trim();
  final value = (linkValue ?? '').trim();
  final legacy = (legacyLink ?? '').trim();

  if (type == 'product' && value.isNotEmpty) {
    return '/product/${Uri.encodeComponent(value)}';
  }
  if (type == 'category' && value.isNotEmpty) {
    return '/products?categoryId=${Uri.encodeComponent(value)}';
  }
  if (type == 'subcategory' && value.isNotEmpty) {
    return '/products?subcategoryId=${Uri.encodeComponent(value)}';
  }
  if (type == 'tertiary' && value.isNotEmpty) {
    return '/products?tertiaryCategoryId=${Uri.encodeComponent(value)}';
  }
  if (type == 'brand' && value.isNotEmpty) {
    if (_isUuid(value)) {
      return '/products?brandId=${Uri.encodeComponent(value)}';
    }
    return '/brand/${Uri.encodeComponent(value)}';
  }
  if (type == 'package' && value.isNotEmpty) {
    return '/package/${Uri.encodeComponent(value)}';
  }
  if (type == 'skinConcern' && value.isNotEmpty) {
    return '/products?concernSlug=${Uri.encodeComponent(value)}';
  }
  if (type == 'search' && value.isNotEmpty) {
    return '/search?q=${Uri.encodeComponent(value)}';
  }
  if (type == 'offers') return '/products?isPromo=1&title=العروض';
  if (type == 'categoriesTab') return '/categories-tab';
  if (type == 'products' && value.isNotEmpty) {
    return value.startsWith('/') ? value : '/products?$value';
  }
  if (type == 'url' && value.isNotEmpty) return value;
  if (legacy.isNotEmpty) return legacy;
  if (value.startsWith('/')) return value;
  return null;
}

/// يستخرج أفضل مسار للتنقّل من عنصر القسم.
String? resolveSectionItemPath(Map<String, dynamic> raw) {
  final legacy = _readLegacyLink(raw);
  if (legacy != null) {
    final normalized = _normalizeAppPath(legacy);
    if (normalized != null) return normalized;
  }

  final type = _readLinkType(raw);
  final value = _readLinkValue(raw);

  final built = buildSectionItemPath(
    linkType: type,
    linkValue: value,
    legacyLink: legacy,
  );
  if (built != null) {
    return _normalizeAppPath(built) ?? built;
  }

  if (type == 'offers' || type == 'categoriesTab') {
    return buildSectionItemPath(linkType: type, linkValue: '');
  }

  return null;
}

/// هل عنصر القسم يحتوي رابطاً قابلاً للتنقّل؟
bool sectionItemHasLink(Map<String, dynamic> raw) =>
    resolveSectionItemPath(raw) != null;

void openSectionItemLink(BuildContext context, Map<String, dynamic> raw) {
  final path = resolveSectionItemPath(raw);
  if (path != null) {
    navigateSectionPath(context, path);
    return;
  }

  final type = _readLinkType(raw);
  final value = _readLinkValue(raw);
  if (type == null || type.isEmpty) return;

  openSectionLink(
    context,
    linkType: type,
    linkValue: value,
    legacyLink: _readLegacyLink(raw),
    resolvedLink: _readLegacyLink(raw),
  );
}

void _pushAppPath(BuildContext context, String rawPath) {
  final path = rawPath.trim();
  if (path.isEmpty) return;

  if (path == '/categories-tab' || path == '/categories') {
    openCategoriesTab(context, ProviderScope.containerOf(context, listen: false));
    return;
  }
  if (path == '/cart') {
    openCartTab(context, ProviderScope.containerOf(context, listen: false));
    return;
  }
  if (path == '/offers' || path.startsWith('/offers')) {
    openOffersTab(context, ProviderScope.containerOf(context, listen: false));
    return;
  }

  final uri = Uri.tryParse(path);
  if (uri != null && uri.path == '/products') {
    final brandId = uri.queryParameters['brandId'];
    if (brandId != null && brandId.isNotEmpty && !_isUuid(brandId)) {
      context.push('/brand/${Uri.encodeComponent(brandId)}');
      return;
    }
    final categoryId = uri.queryParameters['categoryId'];
    if (categoryId != null && categoryId.isNotEmpty && !_isUuid(categoryId)) {
      context.push('/category/${Uri.encodeComponent(categoryId)}');
      return;
    }
  }

  context.push(path);
}

void openSectionLink(
  BuildContext context, {
  String? linkType,
  String? linkValue,
  String? legacyLink,
  String? resolvedLink,
}) {
  final built = buildSectionItemPath(
    linkType: linkType,
    linkValue: linkValue,
    legacyLink: resolvedLink ?? legacyLink,
  );
  if (built != null) {
    if (built.startsWith('http://') || built.startsWith('https://')) {
      openExternalUrl(built);
      return;
    }
    _pushAppPath(context, built.startsWith('/') ? built : '/$built');
    return;
  }

  final direct = (resolvedLink ?? legacyLink ?? '').trim();
  if (direct.startsWith('http://') || direct.startsWith('https://')) {
    openExternalUrl(direct);
    return;
  }
  if (direct.startsWith('/')) {
    _pushAppPath(context, direct);
    return;
  }
  if (direct.contains('?') || direct.startsWith('products')) {
    _pushAppPath(context, direct.startsWith('/') ? direct : '/$direct');
    return;
  }

  final type = (linkType ?? '').trim();
  final value = (linkValue ?? '').trim();

  if (type == 'product' && value.isNotEmpty) {
    context.push('/product/${Uri.encodeComponent(value)}');
    return;
  }
  if (type == 'category' && value.isNotEmpty) {
    if (_isUuid(value)) {
      context.push('/products?categoryId=${Uri.encodeComponent(value)}');
    } else {
      context.push('/category/${Uri.encodeComponent(value)}');
    }
    return;
  }
  if (type == 'subcategory' && value.isNotEmpty) {
    context.push('/products?subcategoryId=${Uri.encodeComponent(value)}');
    return;
  }
  if (type == 'tertiary' && value.isNotEmpty) {
    context.push('/products?tertiaryCategoryId=${Uri.encodeComponent(value)}');
    return;
  }
  if (type == 'brand' && value.isNotEmpty) {
    if (_isUuid(value)) {
      context.push('/products?brandId=${Uri.encodeComponent(value)}');
    } else {
      context.push('/brand/${Uri.encodeComponent(value)}');
    }
    return;
  }
  if (type == 'package' && value.isNotEmpty) {
    context.push('/package/${Uri.encodeComponent(value)}');
    return;
  }
  if (type == 'skinConcern' && value.isNotEmpty) {
    context.push('/products?concernSlug=${Uri.encodeComponent(value)}');
    return;
  }
  if (type == 'search' && value.isNotEmpty) {
    context.push('/search?q=${Uri.encodeComponent(value)}');
    return;
  }
  if (type == 'offers') {
    openOffersTab(context, ProviderScope.containerOf(context, listen: false));
    return;
  }
  if (type == 'categoriesTab') {
    openCategoriesTab(context, ProviderScope.containerOf(context, listen: false));
    return;
  }
  if (type == 'products' && value.isNotEmpty) {
    final path = value.startsWith('/') ? value : '/products?$value';
    _pushAppPath(context, path);
    return;
  }
  if (type == 'url' && value.isNotEmpty) {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      openExternalUrl(value);
    } else {
      _pushAppPath(context, value.startsWith('/') ? value : '/$value');
    }
    return;
  }
  if (value.startsWith('/')) {
    _pushAppPath(context, value);
  }
}

void openBannerLink(BuildContext context, AppBanner banner) {
  openSectionLink(
    context,
    linkType: banner.linkType,
    linkValue: banner.linkValue,
    legacyLink: banner.link,
    resolvedLink: banner.link,
  );
}

/// «عرض الكل» — يدعم query أو مسار كامل (/brands, /categories-tab)
void openViewAllLink(
  BuildContext context, {
  String? query,
  String? fallbackQuery,
}) {
  final raw = (query ?? fallbackQuery ?? '').trim();
  if (raw.isEmpty) return;
  _pushAppPath(context, raw.startsWith('/') ? raw : '/products?$raw');
}

void openCategoryLink(BuildContext context, Category category) {
  final lang = ProviderScope.containerOf(context).read(languageCodeProvider);
  openSectionLink(
    context,
    linkType: category.linkType,
    linkValue: category.linkValue,
    legacyLink: category.link ??
        '/products?categoryId=${category.id}&title=${Uri.encodeComponent(category.localizedName(lang))}',
  );
}

void openBrandLink(BuildContext context, Brand brand) {
  final lang = ProviderScope.containerOf(context).read(languageCodeProvider);
  openSectionLink(
    context,
    linkType: 'brand',
    linkValue: brand.id,
    legacyLink: brand.link ??
        '/products?brandId=${brand.id}&title=${Uri.encodeComponent(brand.localizedName(lang))}',
  );
}

void openPackageLink(BuildContext context, HomePackage package) {
  openSectionLink(
    context,
    linkType: 'package',
    linkValue: package.slug.isNotEmpty ? package.slug : package.id,
    legacyLink: package.link,
  );
}

Color? parseHexColor(String? hex) {
  if (hex == null || hex.isEmpty) return null;
  final h = hex.replaceFirst('#', '');
  if (h.length == 6) return Color(int.parse('FF$h', radix: 16));
  if (h.length == 8) return Color(int.parse(h, radix: 16));
  return null;
}
