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

void openSectionLink(
  BuildContext context, {
  String? linkType,
  String? linkValue,
  String? legacyLink,
}) {
  final type = (linkType ?? '').trim();
  final value = (linkValue ?? '').trim();
  final legacy = (legacyLink ?? '').trim();

  if (type == 'product' && value.isNotEmpty) {
    context.push('/product/$value');
    return;
  }
  if (type == 'category' && value.isNotEmpty) {
    context.push('/products?categoryId=$value');
    return;
  }
  if (type == 'subcategory' && value.isNotEmpty) {
    context.push('/products?subcategoryId=$value');
    return;
  }
  if (type == 'tertiary' && value.isNotEmpty) {
    context.push('/products?tertiaryCategoryId=$value');
    return;
  }
  if (type == 'brand' && value.isNotEmpty) {
    context.push('/products?brandId=$value');
    return;
  }
  if (type == 'package' && value.isNotEmpty) {
    context.push('/package/$value');
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
    context.push(path);
    return;
  }
  if (type == 'url' && value.isNotEmpty) {
    openExternalUrl(value);
    return;
  }
  if (legacy.isNotEmpty) {
    if (legacy == '/categories-tab' || legacy == '/categories') {
      openCategoriesTab(context, ProviderScope.containerOf(context, listen: false));
      return;
    }
    if (legacy == '/cart') {
      openCartTab(context, ProviderScope.containerOf(context, listen: false));
      return;
    }
    if (legacy == '/offers' || legacy.startsWith('/offers')) {
      openOffersTab(context, ProviderScope.containerOf(context, listen: false));
      return;
    }
    context.push(legacy);
    return;
  }
  if (value.startsWith('/')) {
    context.push(value);
  }
}

void openBannerLink(BuildContext context, AppBanner banner) {
  openSectionLink(
    context,
    linkType: banner.linkType,
    linkValue: banner.linkValue,
    legacyLink: banner.link,
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
  if (raw == '/categories' || raw == '/categories-tab') {
    openCategoriesTab(context, ProviderScope.containerOf(context, listen: false));
    return;
  }
  if (raw.startsWith('/')) {
    context.push(raw);
    return;
  }
  context.push('/products?$raw');
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
