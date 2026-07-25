import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_feed.dart';
import '../../home/widgets/home_scroll_perf.dart';
import '../../home/widgets/home_theme.dart';
import '../../shell/main_shell.dart';
import 'offers_theme.dart';

/// عرض سريع مع عدّاد تنازلي.
class OffersFlashPulse extends ConsumerStatefulWidget {
  final FlashSale flashSale;

  const OffersFlashPulse({super.key, required this.flashSale});

  @override
  ConsumerState<OffersFlashPulse> createState() => _OffersFlashPulseState();
}

class _OffersFlashPulseState extends ConsumerState<OffersFlashPulse> {
  Timer? _timer;
  final _remaining = ValueNotifier<Duration>(Duration.zero);

  @override
  void initState() {
    super.initState();
    _tick();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _syncTimer(bool active) {
    if (active) {
      if (_timer == null || !(_timer?.isActive ?? false)) {
        _tick();
        _startTimer();
      }
    } else {
      _timer?.cancel();
      _timer = null;
    }
  }

  void _tick() {
    final end = widget.flashSale.endsAt;
    if (end == null) return;
    final diff = end.difference(DateTime.now());
    _remaining.value = diff.isNegative ? Duration.zero : diff;
  }

  @override
  void dispose() {
    _timer?.cancel();
    _remaining.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<int>(navIndexProvider, (_, next) => _syncTimer(next == 2));

    final products = widget.flashSale.products;
    if (products.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, 12),
      child: Container(
        decoration: OffersTheme.flashDecoration(),
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: OffersTheme.accent.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.bolt_rounded, size: 18, color: OffersTheme.accent),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('عرض سريع', style: OffersTheme.title(size: 15)),
                      Text('ينتهي قريباً', style: OffersTheme.body(size: 11)),
                    ],
                  ),
                ),
                if (widget.flashSale.endsAt != null)
                  ValueListenableBuilder<Duration>(
                    valueListenable: _remaining,
                    builder: (_, remaining, __) {
                      if (remaining <= Duration.zero) return const SizedBox.shrink();
                      final h = remaining.inHours.toString().padLeft(2, '0');
                      final m = (remaining.inMinutes % 60).toString().padLeft(2, '0');
                      final s = (remaining.inSeconds % 60).toString().padLeft(2, '0');
                      return HomeCountdownBoxes(hours: h, minutes: m, seconds: s);
                    },
                  ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 108,
              child: HomeHorizontalList(
                height: 108,
                padding: EdgeInsets.zero,
                itemCount: products.length.clamp(0, 10),
                itemBuilder: (_, i) {
                  final p = products[i];
                  return _FlashProductChip(
                    name: p.name,
                    imageUrl: p.coverUrl,
                    onTap: () => context.push('/product/${p.slug.isNotEmpty ? p.slug : p.id}'),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FlashProductChip extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final VoidCallback onTap;

  const _FlashProductChip({
    required this.name,
    required this.imageUrl,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Ink(
            width: 84,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: OffersTheme.line),
            ),
            child: Column(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
                    child: AppNetworkImage(
                      url: imageUrl ?? '',
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(6, 4, 6, 6),
                  child: Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: OffersTheme.body(size: 9, weight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
