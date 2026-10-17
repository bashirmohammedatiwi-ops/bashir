import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../widgets/common.dart';
import '../product/product_screen.dart';

final salesProvider = FutureProvider.autoDispose<SalesSummary>((ref) => ref.watch(repoProvider).sales());

String compactMoney(int v) {
  if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(v >= 10000000 ? 0 : 1)} مليون';
  if (v >= 1000) return '${(v / 1000).round()} ألف';
  return '$v';
}

/// المبيعات: اليوم مقابل أمس، الأسبوع والشهر، رسم 14 يوماً، والأكثر مبيعاً فعلياً (آخر 30 يوماً).
class SalesScreen extends ConsumerWidget {
  const SalesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sales = ref.watch(salesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('المبيعات')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(salesProvider.future),
        child: sales.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [ErrorView(e, onRetry: () => ref.invalidate(salesProvider))]),
          data: (s) => ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 40),
            children: [
              SalesTodayCard(s: s),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _Kpi(label: 'آخر 7 أيام', value: money(s.week.revenue), sub: '${s.week.orders} طلب'),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _Kpi(label: 'آخر 30 يوماً', value: money(s.month.revenue), sub: '${s.month.orders} طلب'),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _Kpi(label: 'متوسط الطلب', value: money(s.averageOrder)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _Kpi(label: 'زبونات جدد (أسبوع)', value: numFmt(s.newCustomersWeek)),
                  ),
                ],
              ),
              const SectionTitle('آخر 14 يوماً'),
              Panel(
                child: SizedBox(height: 190, child: SalesBars(days: s.days)),
              ),
              const SectionTitle('الأكثر مبيعاً', subtitle: 'آخر 30 يوماً — بعدد القطع المباعة فعلياً'),
              Panel(
                padding: EdgeInsets.zero,
                child: s.top.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.all(20),
                        child: Text('لا مبيعات بعد', style: TextStyle(color: AppColors.muted)),
                      )
                    : Column(
                        children: [
                          for (var i = 0; i < s.top.length; i++) ...[
                            if (i > 0) const Divider(indent: 70),
                            ListTile(
                              onTap: () => Navigator.of(
                                context,
                              ).push(MaterialPageRoute(builder: (_) => ProductScreen(productId: '${s.top[i]['productId']}'))),
                              leading: Stack(
                                children: [
                                  NetImg(s.top[i]['thumb'] as String?, size: 46, fit: BoxFit.contain),
                                  PositionedDirectional(
                                    top: 0,
                                    start: 0,
                                    child: CircleAvatar(
                                      radius: 9,
                                      backgroundColor: AppColors.primary,
                                      child: Text(
                                        '${i + 1}',
                                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              title: Text(
                                '${s.top[i]['name']}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                              subtitle: Text(money((s.top[i]['revenue'] as num).toInt())),
                              trailing: Text(
                                '${s.top[i]['qty']} قطعة',
                                style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary),
                              ),
                            ),
                          ],
                        ],
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class SalesTodayCard extends StatelessWidget {
  const SalesTodayCard({super.key, required this.s, this.onTap});
  final SalesSummary s;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final diff = s.yesterday.revenue == 0 ? null : (s.today.revenue - s.yesterday.revenue) / s.yesterday.revenue * 100;
    return Material(
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Ink(
          decoration: const BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFF1F9D63), Color(0xFF15805A)], begin: Alignment.topRight, end: Alignment.bottomLeft),
          ),
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'مبيعات اليوم',
                      style: TextStyle(color: Color(0xFFD7F5E6), fontWeight: FontWeight.w700),
                    ),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: AlignmentDirectional.centerStart,
                      child: Text(
                        money(s.today.revenue),
                        style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900),
                      ),
                    ),
                    Text(
                      '${s.today.orders} طلب · أمس ${money(s.yesterday.revenue)}',
                      style: const TextStyle(color: Color(0xFFD7F5E6), fontSize: 12.5),
                    ),
                  ],
                ),
              ),
              if (diff != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: .18), borderRadius: BorderRadius.circular(14)),
                  // الإشارة صريحة (+/−) والسهم لا ينعكس في الواجهة العربية — كي لا يُقرأ الهبوط صعوداً.
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Directionality(
                        textDirection: TextDirection.ltr,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(diff >= 0 ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded, color: Colors.white, size: 16),
                            const SizedBox(width: 2),
                            Text(
                              '${diff >= 0 ? '+' : '−'}${diff.abs().round()}%',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                      ),
                      const Text('عن أمس', style: TextStyle(color: Color(0xFFD7F5E6), fontSize: 10.5)),
                    ],
                  ),
                ),
              if (onTap != null) const Icon(Icons.chevron_left_rounded, color: Colors.white),
            ],
          ),
        ),
      ),
    );
  }
}

class _Kpi extends StatelessWidget {
  const _Kpi({required this.label, required this.value, this.sub});
  final String label, value;
  final String? sub;
  @override
  Widget build(BuildContext context) => Panel(
    padding: const EdgeInsets.all(14),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
        FittedBox(
          child: Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
        ),
        if (sub != null) Text(sub!, style: const TextStyle(color: AppColors.muted, fontSize: 12)),
      ],
    ),
  );
}

/// أعمدة بسيطة للمبيعات اليومية — اضغط عموداً لرؤية رقمه.
class SalesBars extends StatefulWidget {
  const SalesBars({super.key, required this.days});
  final List<({String day, int revenue, int orders})> days;
  @override
  State<SalesBars> createState() => _SalesBarsState();
}

class _SalesBarsState extends State<SalesBars> {
  int? _sel;

  @override
  Widget build(BuildContext context) {
    final days = widget.days;
    final max = days.fold<int>(1, (m, d) => d.revenue > m ? d.revenue : m);
    final sel = _sel == null ? days.last : days[_sel!];
    return Column(
      children: [
        Row(
          children: [
            Text(
              sel.day.substring(5).replaceAll('-', '/'),
              textDirection: TextDirection.ltr,
              style: const TextStyle(color: AppColors.muted),
            ),
            const Spacer(),
            Text('${money(sel.revenue)} · ${sel.orders} طلب', style: const TextStyle(fontWeight: FontWeight.w800)),
          ],
        ),
        const SizedBox(height: 10),
        Expanded(
          child: Directionality(
            textDirection: TextDirection.ltr,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                for (var i = 0; i < days.length; i++)
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _sel = i),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 2.5),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 250),
                              height: (days[i].revenue / max * 130).clamp(3, 130).toDouble(),
                              decoration: BoxDecoration(
                                color: (_sel ?? days.length - 1) == i ? AppColors.primary : AppColors.primary.withValues(alpha: .35),
                                borderRadius: BorderRadius.circular(5),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(days[i].day.substring(8), style: const TextStyle(fontSize: 9.5, color: AppColors.muted)),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
