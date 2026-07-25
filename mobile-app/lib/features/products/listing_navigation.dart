import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/locale_provider.dart';
import '../../data/models/category.dart';

String _listingQuery(Map<String, String?> params) {
  final parts = <String>[];
  for (final e in params.entries) {
    final v = e.value;
    if (v == null || v.isEmpty) continue;
    parts.add('${e.key}=${Uri.encodeComponent(v)}');
  }
  return parts.join('&');
}

void navigateListing({
  required BuildContext context,
  String? categoryId,
  String? subcategoryId,
  String? tertiaryCategoryId,
  String? brandId,
  required String title,
}) {
  final q = _listingQuery({
    'title': title,
    'categoryId': categoryId,
    'subcategoryId': subcategoryId,
    'tertiaryCategoryId': tertiaryCategoryId,
    'brandId': brandId,
  });
  context.replace('/products?$q');
}

void navigateListingChild({
  required BuildContext context,
  String? categoryId,
  String? subcategoryId,
  String? tertiaryCategoryId,
  required Category? child,
  required String parentTitle,
}) {
  if (child == null) {
    if (tertiaryCategoryId != null) {
      navigateListing(
        context: context,
        subcategoryId: subcategoryId,
        title: parentTitle,
      );
      return;
    }
    if (subcategoryId != null) {
      navigateListing(
        context: context,
        subcategoryId: subcategoryId,
        title: parentTitle,
      );
      return;
    }
    if (categoryId != null) {
      navigateListing(
        context: context,
        categoryId: categoryId,
        title: parentTitle,
      );
    }
    return;
  }

  final lang = ProviderScope.containerOf(context).read(languageCodeProvider);

  if (subcategoryId != null) {
    navigateListing(
      context: context,
      subcategoryId: subcategoryId,
      tertiaryCategoryId: child.id,
      title: child.localizedName(lang),
    );
    return;
  }

  if (categoryId != null) {
    navigateListing(
      context: context,
      subcategoryId: child.id,
      title: child.localizedName(lang),
    );
  }
}

void navigateListingBrand({
  required BuildContext context,
  String? categoryId,
  String? subcategoryId,
  String? tertiaryCategoryId,
  String? brandId,
  required String title,
}) {
  navigateListing(
    context: context,
    categoryId: categoryId,
    subcategoryId: subcategoryId,
    tertiaryCategoryId: tertiaryCategoryId,
    brandId: brandId,
    title: title,
  );
}
