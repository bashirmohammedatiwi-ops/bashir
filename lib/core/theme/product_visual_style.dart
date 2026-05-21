import 'package:flutter/material.dart';

/// Solid backdrop for transparentproduct PNGs.
class ProductVisualStyle {
  const ProductVisualStyle({
    required this.backgroundColor,
    this.imagePaddingFactor = 0.14,
  });

  final Color backgroundColor;
  final double imagePaddingFactor;
}
