import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/models/banner.dart';
import '../../../data/models/brand.dart';
import '../../../data/models/category.dart';
import '../../../data/models/home_section.dart';
import '../shell/main_shell.dart';

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
    context.push('/products?isPromo=1&title=العروض');
    return;
  }
  if (type == 'categoriesTab') {
    ProviderScope.containerOf(context, listen: false).read(navIndexProvider.notifier).state = 1;
    return;
  }
  if (type == 'products' && value.isNotEmpty) {
    final path = value.startsWith('/') ? value : '/products?$value';
    context.push(path);
    return;
  }
  if (type == 'url' && value.isNotEmpty) {
    context.push(value);
    return;
  }
  if (legacy.isNotEmpty) {
    if (legacy == '/categories-tab') {
      ProviderScope.containerOf(context, listen: false).read(navIndexProvider.notifier).state = 1;
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

/// «عرض الكل» — يدعم query أو مسار كامل (/brands)
void openViewAllLink(
  BuildContext context, {
  String? query,
  String? fallbackQuery,
}) {
  final raw = (query ?? fallbackQuery ?? '').trim();
  if (raw.isEmpty) return;
  if (raw.startsWith('/')) {
    context.push(raw);
    return;
  }
  context.push('/products?$raw');
}

void openCategoryLink(BuildContext context, Category category) {
  openSectionLink(
    context,
    linkType: category.linkType,
    linkValue: category.linkValue,
    legacyLink: category.link ??
        '/products?categoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
  );
}

void openBrandLink(BuildContext context, Brand brand) {
  openSectionLink(
    context,
    linkType: 'brand',
    linkValue: brand.id,
    legacyLink: brand.link ??
        '/products?brandId=${brand.id}&title=${Uri.encodeComponent(brand.name)}',
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
