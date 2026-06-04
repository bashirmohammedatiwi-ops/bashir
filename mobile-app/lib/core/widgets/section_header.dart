import 'package:flutter/material.dart';
import '../constants/app_sizes.dart';
import 'luxe.dart';

class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.onSeeAll,
    this.padding,
  });

  final String title;
  final String? subtitle;
  final VoidCallback? onSeeAll;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return Luxe.sectionTitle(
      title: title,
      subtitle: subtitle,
      onAction: onSeeAll,
      padding: padding ??
          const EdgeInsets.fromLTRB(
            AppSizes.xl,
            AppSizes.md,
            AppSizes.xl,
            AppSizes.sm,
          ),
    );
  }
}
