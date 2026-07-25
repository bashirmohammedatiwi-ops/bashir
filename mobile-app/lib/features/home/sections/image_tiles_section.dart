import 'package:flutter/material.dart';

import '../../../data/models/home_section.dart';
import 'photo_wall_section.dart';

/// بلاطات صور — نفس محرك معرض الصور الموحّد (تصميم واحد لكل القسم).
class ImageTilesSection extends StatelessWidget {
  final HomeSection section;
  const ImageTilesSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    return PhotoWallSection(section: section);
  }
}
