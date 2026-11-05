import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/prefs.dart';
import '../../core/theme.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';

/// «أدائي»: إحصائيات التجهيز محسوبة محلياً على هذا الجهاز (عدد الطلبات ومتوسط الزمن).
class StatsScreen extends ConsumerWidget {
  const StatsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(sessionProvider).me;
    return Scaffold(
      appBar: AppBar(title: const Text('أدائي')),
      body: ValueListenableBuilder<int>(
        valueListenable: Prefs.instance.statsVersion,
        builder: (context, _, _) {
          final all = Prefs.instance.prepared;
          final now = DateTime.now();
          final today = all.where((e) => _sameDay(e.at, now)).toList();
          final weekAgo = now.subtract(const Duration(days: 7));
          final week = all.where((e) => e.at.isAfter(weekAgo)).toList();

          final avgToday = _avgSeconds(today);
          final avgWeek = _avgSeconds(week);

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 30),
            children: [
              if (me != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text('مرحباً ${me.name} 👋', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      icon: Icons.inventory_2_rounded,
                      color: AppColors.primary,
                      value: '${today.length}',
                      label: 'مجهّزة اليوم',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _StatCard(
                      icon: Icons.timer_outlined,
                      color: AppColors.info,
                      value: avgToday == null ? '—' : _dur(avgToday),
                      label: 'متوسط زمن التجهيز اليوم',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      icon: Icons.calendar_month_rounded,
                      color: AppColors.rose,
                      value: '${week.length}',
                      label: 'آخر 7 أيام',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _StatCard(
                      icon: Icons.speed_rounded,
                      color: AppColors.success,
                      value: avgWeek == null ? '—' : _dur(avgWeek),
                      label: 'متوسط الأسبوع',
                    ),
                  ),
                ],
              ),
              const SectionTitle('آخر الطلبات المجهّزة'),
              if (all.isEmpty)
                const EmptyState(
                  icon: Icons.insights_outlined,
                  title: 'لا توجد بيانات بعد',
                  message: 'ستظهر هنا الطلبات التي تجهّزها وتضغط «جاهز للتوصيل».',
                )
              else
                Panel(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      for (var i = 0; i < all.take(30).length; i++) ...[
                        if (i > 0) const Divider(height: 1),
                        ListTile(
                          leading: const Icon(Icons.check_circle_rounded, color: AppColors.success),
                          title: Text(
                            all[i].orderNumber ?? 'طلب',
                            textDirection: TextDirection.ltr,
                            textAlign: TextAlign.right,
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                          subtitle: Text('زمن التجهيز: ${_dur(all[i].seconds)}'),
                          trailing: Text(timeAgo(all[i].at), style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                        ),
                      ],
                    ],
                  ),
                ),
              const SizedBox(height: 10),
              Text(
                'هذه الإحصائيات محفوظة على هذا الجهاز فقط لمساعدتك على متابعة إنجازك.',
                style: const TextStyle(color: AppColors.muted, fontSize: 12, height: 1.6),
                textAlign: TextAlign.center,
              ),
            ],
          );
        },
      ),
    );
  }

  static bool _sameDay(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;

  static int? _avgSeconds(List<PreparedEntry> list) {
    if (list.isEmpty) return null;
    final total = list.fold<int>(0, (n, e) => n + e.seconds);
    return (total / list.length).round();
  }

  /// «3 د 20 ث» أو «45 ث».
  static String _dur(int seconds) {
    if (seconds < 60) return '$seconds ث';
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return s == 0 ? '$m د' : '$m د $s ث';
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.icon, required this.color, required this.value, required this.label});
  final IconData icon;
  final Color color;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: color, size: 26),
        const SizedBox(height: 8),
        Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12.5, height: 1.4)),
      ],
    ),
  );
}
