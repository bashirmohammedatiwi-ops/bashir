import 'package:flutter/material.dart';
import '../models/brand_model.dart';

abstract final class MockBrands {
  static const List<String> _names = [
    'MAC', 'NYX', 'Maybelline', "L'Oréal Paris", 'Nivea', 'Neutrogena',
    'The Ordinary', 'CeraVe', 'La Roche-Posay', 'Garnier', 'Olay',
    'NARS', 'Urban Decay', 'Charlotte Tilbury', 'Fenty Beauty',
    'Huda Beauty', 'Dior Beauty', 'Chanel', 'Lancôme', 'Estée Lauder',
    'Clinique', 'Armani Beauty', 'YSL Beauty', 'Givenchy Beauty',
    'Too Faced', 'Benefit', 'e.l.f.', 'Revolution Beauty', 'Essence',
    'Catrice', 'Golden Rose', 'Flormar', 'Bourjois', 'Rimmel London',
    'Max Factor', 'Morphe', 'ABH', 'Kylie Cosmetics', 'ColourPop',
    'Wet n Wild', 'Sleek', 'MUA', 'Inglot', 'Kiko Milano', 'Pupa',
    'Paese', 'OPI', 'Sally Hansen', 'Essie', 'Bioderma', 'Vichy',
    'Avène', 'COSRX', 'Some By Mi', 'Innisfree',
  ];

  static const List<Color> _colors = [
    Color(0xFFF5F3FF), Color(0xFFFFF7ED), Color(0xFFF0FDF4),
    Color(0xFFFEF2F2), Color(0xFFEFF6FF), Color(0xFFFDF4FF),
  ];

  static late final List<BrandModel> all = List.generate(_names.length, (i) {
    return BrandModel(
      id: 'brand_$i',
      name: _names[i],
      productCount: 5 + (i * 7) % 30,
      isFeatured: i < 6,
      bgColor: _colors[i % _colors.length],
    );
  });

  static BrandModel? findById(String id) {
    try {
      return all.firstWhere((b) => b.id == id);
    } catch (_) {
      return null;
    }
  }
}
