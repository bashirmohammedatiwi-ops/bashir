import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart' hide TextDirection;

import '../../core/theme/app_theme.dart';
import '../../core/utils/daily_progress_store.dart';
import '../../widgets/section_card.dart';

/// Persisted daily progress: today count + history of previous days.
class DailyProgressScreen extends ConsumerWidget {
  const DailyProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progress = ref.watch(dailyProgressProvider);
    final days = progress.recentDays(days: 14);
    final maxBar = days.map((e) => e.count).fold<int>(1, (a, b) => a > b ? a : b);

    return Scaffold(
      appBar: AppBar(
        title: const Text('التقدم اليومي'),
        actions: [
          IconButton(
            tooltip: 'تحديث',
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(dailyProgressProvider.notifier).refresh(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(dailyProgressProvider.notifier).refresh(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            _TodayHero(count: progress.todayCount),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _StatTile(
                    label: 'هذا الأسبوع',
                    value: '${progress.weekTotal}',
                    icon: Icons.date_range_outlined,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _StatTile(
                    label: 'أفضل يوم (30)',
                    value: '${progress.bestDayInPeriod}',
                    icon: Icons.emoji_events_outlined,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'آخر 14 يوماً',
              subtitle: 'يُحفظ على الجهاز ويعود العداد للصفر كل يوم',
              icon: Icons.bar_chart_rounded,
              child: Column(
                children: [
                  for (final row in days.reversed)
                    _DayBar(
                      dayLabel: formatDayKeyAr(row.day),
                      count: row.count,
                      maxCount: maxBar,
                      isToday: row.day == progress.todayKey,
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SectionCard(
              title: 'إضافات اليوم',
              subtitle: progress.todayEntries.isEmpty
                  ? 'لم تُضف منتجات بعد اليوم'
                  : '${progress.todayEntries.length} منتج',
              icon: Icons.playlist_add_check_rounded,
              child: progress.todayEntries.isEmpty
                  ? Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(
                        'عند حفظ منتج من الإضافة الذكية أو الكتالوج سيظهر هنا.',
                        style: TextStyle(color: Colors.grey.shade700, height: 1.35),
                      ),
                    )
                  : Column(
                      children: [
                        for (final e in progress.todayEntries) ...[
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                              child: Icon(
                                e.source == 'catalog' ? Icons.storefront : Icons.auto_awesome,
                                color: AppTheme.primary,
                                size: 20,
                              ),
                            ),
                            title: Text(
                              e.displayName,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            subtitle: Text(
                              '${e.sourceLabelAr} · ${DateFormat('h:mm a', 'ar').format(e.at)}',
                              style: const TextStyle(fontSize: 12),
                            ),
                            trailing: Text(
                              e.barcode,
                              textDirection: TextDirection.ltr,
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                            ),
                          ),
                          if (e != progress.todayEntries.last) const Divider(height: 8),
                        ],
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TodayHero extends StatelessWidget {
  const _TodayHero({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [AppTheme.primary, AppTheme.primaryDark],
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'منتجات اليوم',
                  style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                Text(
                  '$count',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 48,
                    fontWeight: FontWeight.w800,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  count == 0 ? 'ابدأ الإضافة — العداد يتصفر غداً تلقائياً' : 'استمر — التقدم محفوظ',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.local_fire_department_rounded, color: Colors.white, size: 34),
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE8E4EC)),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.muted)),
                Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DayBar extends StatelessWidget {
  const _DayBar({
    required this.dayLabel,
    required this.count,
    required this.maxCount,
    required this.isToday,
  });

  final String dayLabel;
  final int count;
  final int maxCount;
  final bool isToday;

  @override
  Widget build(BuildContext context) {
    final ratio = maxCount <= 0 ? 0.0 : (count / maxCount).clamp(0.0, 1.0);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(
            width: 96,
            child: Text(
              dayLabel,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isToday ? FontWeight.w800 : FontWeight.w500,
                color: isToday ? AppTheme.primary : AppTheme.muted,
              ),
            ),
          ),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(
                value: ratio,
                minHeight: 10,
                backgroundColor: const Color(0xFFF0ECF4),
                color: isToday ? AppTheme.primary : AppTheme.accent,
              ),
            ),
          ),
          const SizedBox(width: 10),
          SizedBox(
            width: 28,
            child: Text(
              '$count',
              textAlign: TextAlign.left,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: isToday ? AppTheme.primary : AppTheme.muted,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact chip for app bars — opens daily progress.
class DailyProgressChip extends ConsumerWidget {
  const DailyProgressChip({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(dailyProgressProvider).todayCount;
    return IconButton(
      tooltip: 'التقدم اليومي — اليوم $count',
      onPressed: () => context.push('/daily-progress'),
      icon: Badge(
        isLabelVisible: true,
        label: Text(
          '$count',
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
        ),
        child: const Icon(Icons.local_fire_department_rounded),
      ),
    );
  }
}
