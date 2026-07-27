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
  final direct = (resolvedLink ?? legacyLink ?? '').trim();
  if (direct.startsWith('/')) {
    _pushAppPath(context, direct);
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
    openExternalUrl(value);
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
