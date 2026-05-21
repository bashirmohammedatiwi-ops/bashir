import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/widgets/animated_counter.dart';
import '../../../data/models/loyalty_model.dart';
import '../providers/loyalty_provider.dart';

class LoyaltyScreen extends ConsumerWidget {
  const LoyaltyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loyalty = ref.watch(loyaltyProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('نقاط الولاء')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.gold, Color(0xFFFDE68A)],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                Text('رصيدكِ', style: AppTextStyles.body()),
                AnimatedCounter(
                  value: loyalty.points,
                  formatCurrency: false,
                  style: AppTextStyles.display(size: 48),
                ),
                Text('نقطة', style: AppTextStyles.title()),
                const SizedBox(height: 8),
                Chip(
                  label: Text(loyalty.tier.label),
                  backgroundColor: Colors.white,
                ),
              ],
            ),
          ).animate().fadeIn().scale(),
          const SizedBox(height: 24),
          Text('مستواكِ', style: AppTextStyles.headline()),
          const SizedBox(height: 12),
          _TierProgress(current: loyalty.points),
          const SizedBox(height: 24),
          Text('السجل', style: AppTextStyles.headline()),
          ...loyalty.history.map((h) => ListTile(
                leading: Icon(
                  h.isEarned ? Icons.add_circle : Icons.remove_circle,
                  color: h.isEarned ? AppColors.success : AppColors.error,
                ),
                title: Text(h.title),
                trailing: Text(
                  '${h.isEarned ? '+' : ''}${CurrencyFormatter.formatPoints(h.points)}',
                ),
              )),
          const SizedBox(height: 16),
          Text('كيف تكسبين', style: AppTextStyles.headline()),
          const _InfoTile('كل ١,٠٠٠ د.ع = ١ نقطة'),
          const _InfoTile('تقييم منتج = ٥ نقاط'),
          const _InfoTile('أول طلب = ٥٠ نقطة'),
          const _InfoTile('عيد ميلادك = ١٠٠ نقطة'),
          const SizedBox(height: 16),
          Text('كيف تستخدمين', style: AppTextStyles.headline()),
          const _InfoTile('١٠٠ نقطة = ١,٠٠٠ د.ع خصم'),
        ],
      ),
    );
  }
}

class _TierProgress extends StatelessWidget {
  const _TierProgress({required this.current});
  final int current;

  @override
  Widget build(BuildContext context) {
    final tiers = LoyaltyTier.values;
    final progress = (current / 3000).clamp(0.0, 1.0);
    return Column(
      children: [
        LinearProgressIndicator(
          value: progress,
          backgroundColor: AppColors.divider,
          color: AppColors.primary,
          minHeight: 8,
          borderRadius: BorderRadius.circular(4),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: tiers
              .map((t) => Text(t.label, style: AppTextStyles.caption(size: 10)))
              .toList(),
        ),
      ],
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.star, color: AppColors.gold, size: 20),
      title: Text(text, style: AppTextStyles.body()),
      dense: true,
    );
  }
}
