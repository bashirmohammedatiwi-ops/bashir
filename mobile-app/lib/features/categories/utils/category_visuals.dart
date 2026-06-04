import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

/// أيقونة خطية ملوّنة لكل فئة — أسلوب browse نظيف (مستوحى من تطبيقات الجمال).
class CategoryVisual {
  const CategoryVisual({required this.icon, required this.color});
  final IconData icon;
  final Color color;
}

abstract final class CategoryVisuals {
  static const _palette = [
    Color(0xFFE53935),
    Color(0xFF00897B),
    Color(0xFF1E88E5),
    Color(0xFFF4511E),
    Color(0xFF8E24AA),
    Color(0xFF43A047),
    Color(0xFFD81B60),
    Color(0xFF5E35B1),
  ];

  static CategoryVisual resolve(CategoryVisualInput input) {
    final slug = input.slug?.toLowerCase() ?? '';
    final name = input.name.toLowerCase();

    if (_matches(slug, name, ['عطر', 'frag', 'perfume', 'العطور'])) {
      return const CategoryVisual(
        icon: Icons.spa_outlined,
        color: Color(0xFF5C6BC0),
      );
    }
    if (_matches(slug, name, ['مكياج', 'makeup', 'lip', 'rebella', 'شفاه'])) {
      return const CategoryVisual(
        icon: Icons.brush_outlined,
        color: Color(0xFFE53935),
      );
    }
    if (_matches(slug, name, ['بشرة', 'skin', 'care', 'clean'])) {
      return const CategoryVisual(
        icon: Icons.eco_outlined,
        color: Color(0xFF43A047),
      );
    }
    if (_matches(slug, name, ['شعر', 'hair'])) {
      return const CategoryVisual(
        icon: Icons.content_cut_outlined,
        color: Color(0xFF00897B),
      );
    }
    if (_matches(slug, name, ['أداة', 'tool', 'فرش'])) {
      return const CategoryVisual(
        icon: Icons.home_repair_service_outlined,
        color: Color(0xFFF4511E),
      );
    }
    if (_matches(slug, name, ['هدية', 'gift', 'باقة', 'package'])) {
      return const CategoryVisual(
        icon: Icons.card_giftcard_outlined,
        color: Color(0xFFD81B60),
      );
    }
    if (_matches(slug, name, ['جسم', 'body', 'bath'])) {
      return const CategoryVisual(
        icon: Icons.water_drop_outlined,
        color: Color(0xFF1E88E5),
      );
    }

    final i = input.index.abs() % _palette.length;
    return CategoryVisual(
      icon: Icons.category_outlined,
      color: _palette[i],
    );
  }

  static bool _matches(String slug, String name, List<String> keys) {
    for (final k in keys) {
      if (slug.contains(k) || name.contains(k)) return true;
    }
    return false;
  }
}

class CategoryVisualInput {
  const CategoryVisualInput({
    required this.name,
    this.slug,
    this.index = 0,
  });
  final String name;
  final String? slug;
  final int index;
}
