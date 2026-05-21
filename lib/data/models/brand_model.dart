import 'package:flutter/material.dart';

class BrandModel {
  const BrandModel({
    required this.id,
    required this.name,
    required this.productCount,
    this.isFeatured = false,
    this.bgColor,
    this.logoUrl,
  });

  final String id;
  final String name;
  final int productCount;
  final bool isFeatured;
  final Color? bgColor;
  final String? logoUrl;

  String get initial => name.isNotEmpty ? name[0].toUpperCase() : '?';
}
