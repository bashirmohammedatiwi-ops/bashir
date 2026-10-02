import 'package:flutter/material.dart';

import '../../../core/theme/card_sizes.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../worlds/world_theme.dart';
import 'home_theme.dart';

class CircleTile extends StatefulWidget {
  final String title;
  final String? subtitle;
  final String? imageUrl;
  final String? icon;
  final String? cardSize;
  final double width;
  final VoidCallback onTap;

  const CircleTile({
    super.key,
    required this.title,
    required this.onTap,
    this.subtitle,
    this.imageUrl,
    this.icon,
    this.cardSize,
    this.width = 76,
  });

  @override
  State<CircleTile> createState() => _CircleTileState();
}

class _CircleTileState extends State<CircleTile> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final spec = cardSizeSpec(widget.cardSize);
    final diameter = (spec.width > 0 ? spec.width : 64.0).clamp(56.0, 68.0);

    return SizedBox(
      width: widget.width,
      child: GestureDetector(
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp: (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        onTap: widget.onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedScale(
          scale: _pressed ? 0.97 : 1,
          duration: const Duration(milliseconds: 100),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: diameter,
                height: diameter,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: t.accentLight,
                  border: Border.all(color: t.hairline),
                ),
                clipBehavior: Clip.antiAlias,
                child: Padding(
                  padding: const EdgeInsets.all(2),
                  child: ClipOval(
                    child: _CircleContent(imageUrl: widget.imageUrl, icon: widget.icon),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                widget.title,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: HomeTheme.circleLabel.copyWith(color: t.inkSoft),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CircleContent extends StatelessWidget {
  final String? imageUrl;
  final String? icon;

  const _CircleContent({this.imageUrl, this.icon});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return AppNetworkImage(url: imageUrl!, fit: BoxFit.cover);
    }
    final emoji = icon?.trim();
    if (emoji != null && emoji.isNotEmpty) {
      return Center(child: Text(emoji, style: const TextStyle(fontSize: 22, height: 1)));
    }
    return Icon(Icons.spa_outlined, color: t.accent, size: 24);
  }
}
