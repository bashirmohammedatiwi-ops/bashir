import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../catalog/create_product_screen.dart';
import '../catalog/pos_missing_screen.dart';
import '../drafts/groups_screen.dart';
import '../product/product_screen.dart';
import '../sales/sales_screen.dart';
import '../settings/settings_screen.dart';

/// كل الأدوات في مكان واحد.
class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(sessionProvider).me;
    final isAdmin = me == null || me.role != 'STAFF';
    final stats = ref.watch(statsProvider).valueOrNull;
    void go(Widget w) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => w));
    return Scaffold(
      appBar: AppBar(title: const Text('المزيد')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
        children: [
          GridView.count(
            crossAxisCount: MediaQuery.sizeOf(context).width > 600 ? 4 : 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.25,
            children: [
              if (isAdmin)
                _Tile(
                  icon: Icons.insights_rounded,
                  color: AppColors.success,
                  title: 'المبيعات',
                  sub: 'اليوم والشهر والأكثر مبيعاً',
                  onTap: () => go(const SalesScreen()),
                ),
              _Tile(
                icon: Icons.add_box_rounded,
                color: AppColors.primary,
                title: 'إضافة منتج',
                sub: 'بالباركود والذكاء',
                onTap: () => go(const CreateProductScreen()),
              ),
              _Tile(
                icon: Icons.point_of_sale_rounded,
                color: AppColors.info,
                title: 'نواقص الكاشير',
                sub: 'في الكاشير وغير معروضة',
                onTap: () => go(const PosMissingScreen()),
              ),
              _Tile(
                icon: Icons.bookmarks_rounded,
                color: AppColors.warning,
                title: 'الباركودات المحفوظة',
                sub: stats == null ? 'مجموعات' : '${stats.draftsPending} بانتظار',
                onTap: () => go(const GroupsScreen()),
              ),
              _Tile(
                icon: Icons.history_rounded,
                color: AppColors.rose,
                title: 'سجل التعديلات',
                sub: 'من عدّل ماذا ومتى',
                onTap: () => go(const ActivityScreen()),
              ),
              _Tile(
                icon: Icons.settings_rounded,
                color: AppColors.muted,
                title: 'الإعدادات',
                sub: 'القارئ، الصوت، الحساب',
                onTap: () => go(const SettingsScreen()),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.icon, required this.color, required this.title, required this.sub, required this.onTap});
  final IconData icon;
  final Color color;
  final String title, sub;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Panel(
    onTap: onTap,
    padding: const EdgeInsets.all(14),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(color: color.withValues(alpha: .12), borderRadius: BorderRadius.circular(14)),
          child: Icon(icon, color: color),
        ),
        const Spacer(),
        Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
        Text(
          sub,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: AppColors.muted, fontSize: 12),
        ),
      ],
    ),
  );
}

final _activityFull = FutureProvider.autoDispose<List<ActivityItem>>((ref) => ref.watch(repoProvider).activity(limit: 100));

class ActivityScreen extends ConsumerWidget {
  const ActivityScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(_activityFull);
    return Scaffold(
      appBar: AppBar(title: const Text('سجل التعديلات')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(_activityFull.future),
        child: list.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [ErrorView(e, onRetry: () => ref.invalidate(_activityFull))]),
          data: (items) => items.isEmpty
              ? ListView(
                  children: const [EmptyState(icon: Icons.history_rounded, title: 'لا تعديلات بعد')],
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final a = items[i];
                    final pid =
                        (a.meta['productId'] ?? (a.action.startsWith('product') || a.action.startsWith('images') ? a.entityId : null))
                            ?.toString();
                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                      leading: CircleAvatar(
                        backgroundColor: AppColors.primaryLight,
                        child: Icon(_icon(a.action), color: AppColors.primary, size: 20),
                      ),
                      title: Text(a.label, style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text(
                        [a.actor, timeAgo(a.at), if (a.meta['name'] != null) '${a.meta['name']}'].whereType<String>().join(' · '),
                      ),
                      trailing: pid == null ? null : const Icon(Icons.chevron_left_rounded),
                      onTap: pid == null
                          ? null
                          : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductScreen(productId: pid))),
                    );
                  },
                ),
        ),
      ),
    );
  }

  IconData _icon(String a) {
    if (a.startsWith('shade')) return Icons.palette_outlined;
    if (a.startsWith('images')) return Icons.image_outlined;
    if (a.startsWith('draft')) return Icons.bookmark_outline_rounded;
    if (a == 'product.create') return Icons.add_box_outlined;
    return Icons.inventory_2_outlined;
  }
}
