import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/auth_gate.dart';
import '../../core/widgets/states.dart';
import '../../data/models/loyalty_summary.dart';
import '../auth/auth_provider.dart';
import '../catalog/catalog_providers.dart';

class LoyaltyScreen extends ConsumerWidget {
  const LoyaltyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AuthGate(
      title: 'نقاط الولاء',
      emptyTitle: 'سجّل الدخول لعرض نقاطك',
      child: const _LoyaltyBody(),
    );
  }
}

class _LoyaltyBody extends ConsumerWidget {
  const _LoyaltyBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final async = ref.watch(loyaltyProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('نقاط الولاء')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(loyaltyProvider)),
        data: (summary) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _PointsCard(summary: summary, userName: user?.name ?? ''),
            const SizedBox(height: 20),
            if (summary.pointsToNext > 0)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.trending_up_rounded, color: AppColors.primary),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        '${summary.pointsToNext} نقطة للوصول لمستوى ${summary.nextTier ?? ''}',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                'كل 100 نقطة = ${formatPrice(1000)} خصم عند الدفع',
                style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 24),
            const Text('سجل النقاط', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            if (summary.history.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: Text('لا يوجد سجل بعد', style: TextStyle(color: AppColors.textMuted))),
              )
            else
              for (final h in summary.history) _HistoryTile(item: h),
          ],
        ),
      ),
    );
  }
}

class _PointsCard extends StatelessWidget {
  final LoyaltySummary summary;
  final String userName;

  const _PointsCard({required this.summary, required this.userName});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryDark]),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Text(userName, style: const TextStyle(color: Colors.white70, fontSize: 13)),
          const SizedBox(height: 8),
          const Icon(Icons.stars_rounded, color: Colors.white, size: 44),
          const SizedBox(height: 8),
          Text('${summary.points}',
              style: const TextStyle(color: Colors.white, fontSize: 44, fontWeight: FontWeight.w900)),
          const Text('نقطة متاحة', style: TextStyle(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text('مستوى: ${summary.tierLabel}',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  final LoyaltyHistoryItem item;
  const _HistoryTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final positive = item.isEarned;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(
            positive ? Icons.add_circle_outline : Icons.remove_circle_outline,
            color: positive ? AppColors.success : AppColors.sale,
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w600))),
          Text(
            '${positive ? '+' : ''}${item.points}',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              color: positive ? AppColors.success : AppColors.sale,
            ),
          ),
        ],
      ),
    );
  }
}
