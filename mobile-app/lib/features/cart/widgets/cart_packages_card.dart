import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../worlds/world_theme.dart';
import '../cart_packages_provider.dart';
import 'cart_theme.dart';

/// باقات السلة: المكتملة بتوفيرها، والناقصة بما ينقصها — حتى تفهم الزبونة لماذا تغيّر السعر.
class CartPackagesCard extends ConsumerWidget {
  const CartPackagesCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(cartPackageStatusProvider);
    if (list.isEmpty) return const SizedBox.shrink();
    final t = context.worldTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 12, CartTheme.hPad, 0),
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 6),
        decoration: CartTheme.cardDecoration(context),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                CartTheme.iconBadge(context, Icons.card_giftcard_rounded, size: 34),
                const SizedBox(width: 10),
                Expanded(child: Text('باقاتكِ', style: AppText.title3.copyWith(color: t.ink))),
              ],
            ),
            const SizedBox(height: 8),
            for (final st in list) _PackageLine(status: st),
          ],
        ),
      ),
    );
  }
}

class _PackageLine extends ConsumerWidget {
  final CartPackageStatus status;
  const _PackageLine({required this.status});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final p = status.pack;
    final done = status.complete;
    final missing = status.missingProductIds.length;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => context.push('/package/${Uri.encodeComponent(p.routeId)}'),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: done ? AppColors.success.withValues(alpha: 0.07) : t.canvasWarm,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                clipBehavior: Clip.antiAlias,
                child: p.coverUrl != null
                    ? AppNetworkImage(url: p.coverUrl!, fit: BoxFit.cover)
                    : Center(child: Text(p.isRoutine ? '✨' : '🎁', style: const TextStyle(fontSize: 20))),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      status.completeSets > 1 ? '${p.name} × ${status.completeSets}' : p.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.label.copyWith(color: t.ink),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      done
                          ? (status.saving > 0 ? '✓ مكتملة — وفّرتِ ${formatPrice(status.saving)}' : '✓ مكتملة')
                          : 'ينقصها $missing ${missing == 1 ? 'منتج' : 'منتجات'} — أكمليها لسعر الباقة',
                      style: AppText.caption.copyWith(
                        color: done ? AppColors.success : t.inkSoft,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              if (!done)
                TextButton(
                  onPressed: () => context.push('/package/${Uri.encodeComponent(p.routeId)}'),
                  child: const Text('أكمليها'),
                ),
              IconButton(
                visualDensity: VisualDensity.compact,
                tooltip: 'إلغاء الباقة (تبقى المنتجات)',
                onPressed: () {
                  HapticFeedback.selectionClick();
                  ref.read(cartPackagesProvider.notifier).remove(p.id);
                },
                icon: Icon(Icons.close_rounded, size: 18, color: t.inkMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
