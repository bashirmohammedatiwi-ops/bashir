import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../data/models/home_section.dart';
import '../home_link.dart';

class PromoStripSection extends StatelessWidget {
  final HomeSection section;
  const PromoStripSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final strip = section.promoStrip;
    if (strip == null || strip.text.isEmpty) return const SizedBox.shrink();
    final bg = parseHexColor(strip.backgroundColor) ?? const Color(0xFFFCE4EC);

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: strip.link != null && strip.link!.isNotEmpty ? () => context.push(strip.link!) : null,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Text(strip.text,
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          ),
        ),
      ),
    );
  }
}
