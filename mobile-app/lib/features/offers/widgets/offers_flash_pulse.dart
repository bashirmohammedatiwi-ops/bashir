import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_feed.dart';
import '../../home/widgets/home_scroll_perf.dart';
import '../../shell/main_shell.dart';
import 'offers_theme.dart';

/// عرض سريع — بطاقة بيضاء بسيطة مع عدّاد.
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
    final s = ref.s;
    final products = widget.flashSale.products;
    if (products.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(OffersTheme.hPad, 0, OffersTheme.hPad, 14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: OffersTheme.surfaceCard(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.bolt_rounded, color: OffersTheme.brand, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(s.flashSale, style: OffersTheme.title(size: 15, color: OffersTheme.ink)),
                ),
                if (widget.flashSale.endsAt != null)
                  ValueListenableBuilder<Duration>(
                    valueListenable: _remaining,
                    builder: (_, remaining, __) {
                      if (remaining <= Duration.zero) return const SizedBox.shrink();
                      final h = remaining.inHours.toString().padLeft(2, '0');
                      final m = (remaining.inMinutes % 60).toString().padLeft(2, '0');
                      final sec = (remaining.inSeconds % 60).toString().padLeft(2, '0');
                      return Text(
                        '$h:$m:$sec',
                        style: const TextStyle(
                          color: OffersTheme.brand,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          fontFeatures: [FontFeature.tabularFigures()],
                        ),
                      );
                    },
                  ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 100,
              child: HomeHorizontalList(
                height: 100,
                padding: EdgeInsets.zero,
                itemCount: products.length.clamp(0, 10),
                itemBuilder: (_, i) {
                  final p = products[i];
                  return _ProductThumb(
                    name: p.name,
                    imageUrl: p.coverUrl,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      context.push('/product/${p.slug.isNotEmpty ? p.slug : p.id}');
                    },
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

class _ProductThumb extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final VoidCallback onTap;

  const _ProductThumb({
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
          child: SizedBox(
            width: 76,
            child: Column(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: AppNetworkImage(
                      url: imageUrl ?? '',
                      width: 76,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: OffersTheme.body(size: 9, weight: FontWeight.w600, color: OffersTheme.ink),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
