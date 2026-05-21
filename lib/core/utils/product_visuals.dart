import 'package:flutter/material.dart';
import '../../data/mock/mock_brands.dart';
import '../../data/models/brand_model.dart';
import '../../data/models/product_model.dart';
import '../theme/product_visual_style.dart';

enum ProductShowcaseLayout {
  gridCard,
  hero,
  cartThumb,
  compact,
  brandSpotlight,
}

abstract final class ProductVisuals {
  static const List<double> _hueSeeds = [
    330, 200, 38, 145, 280, 12, 175, 250, 55, 310,
  ];

  static int _seed(ProductModel product) =>
      product.id.hashCode ^ product.brandId.hashCode ^ product.categoryId.hashCode;

  static ProductVisualStyle resolve(
    ProductModel product, {
    ProductShowcaseLayout layout = ProductShowcaseLayout.gridCard,
  }) {
    final seed = _seed(product) + layout.index * 11;
    final brand = MockBrands.findById(product.brandId);
    final hue = _resolveHue(seed, brand, layout);

    return ProductVisualStyle(
      backgroundColor: _solidBackground(hue, layout),
      imagePaddingFactor: switch (layout) {
        ProductShowcaseLayout.hero => 0.1,
        ProductShowcaseLayout.cartThumb => 0.12,
        _ => 0.14,
      },
    );
  }

  static double _resolveHue(int seed, BrandModel? brand, ProductShowcaseLayout layout) {
    var hue = _hueSeeds[seed.abs() % _hueSeeds.length];
    if (brand?.bgColor != null) {
      final brandHue = HSLColor.fromColor(brand!.bgColor!).hue;
      final t = layout == ProductShowcaseLayout.gridCard ? 0.25 : 0.4;
      final diff = ((brandHue - hue + 540) % 360) - 180;
      hue = (hue + diff * t) % 360;
    }
    return hue;
  }

  static Color _solidBackground(double hue, ProductShowcaseLayout layout) {
    final lightness = switch (layout) {
      ProductShowcaseLayout.hero => 0.94,
      ProductShowcaseLayout.cartThumb => 0.96,
      _ => 0.93,
    };
    return HSLColor.fromAHSL(1, hue, 0.28, lightness).toColor();
  }
}
