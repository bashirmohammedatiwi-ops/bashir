import 'package:flutter/material.dart';

import '../../../data/models/home_section.dart';
import 'photo_wall_section.dart';

/// صور متحركة — نفس محرك المعرض الموحّد.
class ImageMarqueeSection extends StatelessWidget {
  final HomeSection section;
  const ImageMarqueeSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    return PhotoWallSection(section: section);
  }
}
