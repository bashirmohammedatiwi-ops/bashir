import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../data/models/banner.dart';

void openBannerLink(BuildContext context, AppBanner banner) {
  final type = banner.linkType ?? '';
  final value = banner.linkValue ?? '';
  if (type == 'product' && value.isNotEmpty) {
    context.push('/product/$value');
    return;
  }
  if (type == 'category' && value.isNotEmpty) {
    context.push('/products?categoryId=$value');
    return;
  }
  if (type == 'brand' && value.isNotEmpty) {
    context.push('/products?brandId=$value');
    return;
  }
  if (type == 'offers') {
    context.push('/products?isPromo=1&title=العروض');
    return;
  }
  if (value.startsWith('/')) {
    context.push(value);
    return;
  }
  if (banner.linkValue != null && banner.linkValue!.startsWith('/')) {
    context.push(banner.linkValue!);
  }
}

Color? parseHexColor(String? hex) {
  if (hex == null || hex.isEmpty) return null;
  final h = hex.replaceFirst('#', '');
  if (h.length == 6) return Color(int.parse('FF$h', radix: 16));
  if (h.length == 8) return Color(int.parse(h, radix: 16));
  return null;
}
