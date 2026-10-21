import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/prefs.dart';
import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../catalog/web_image_search.dart';
import '../../data/admin_repo.dart';
import '../admin/store_admin_screens.dart';
import '../catalog/create_product_screen.dart';
import '../catalog/pos_missing_screen.dart';
import '../drafts/groups_screen.dart';
import '../product/product_screen.dart';
import '../sales/sales_screen.dart';
import '../scan/lookup_flow.dart';
import '../scan/scan_screen.dart';
import '../search/search_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key, required this.onOpenOrders});
  final VoidCallback onOpenOrders;
  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _code = TextEditingController();
  int _seen = 0;

  void _onRecent() {
    if (mounted) setState(() {});
  }

  @override
  void initState() {
    super.initState();
    Prefs.instance.recentVersion.addListener(_onRecent);
  }

  @override
  void dispose() {
    Prefs.instance.recentVersion.removeListener(_onRecent);
    _code.dispose();
    super.dispose();
  }

  void _search(SearchPreset preset) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => SearchScreen(preset: preset)));

  @override
  Widget build(BuildContext context) {
    final v = ref.watch(dataVersionProvider);
    if (v != _seen) {
      _seen = v;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.invalidate(statsProvider);
        ref.invalidate(activityProvider);
        ref.invalidate(salesProvider);
      });
    }
    final me = ref.watch(sessionProvider).me;
    final stats = ref.watch(statsProvider);
    final activity = ref.watch(activityProvider);
    final recent = Prefs.instance.recent;
    final hw = ScannerBus.instance.lastHardwareAt;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(statsProvider);
          ref.invalidate(activityProvider);
          ref.invalidate(salesProvider);
          ref.invalidate(healthProvider);
          setState(() {});
          try {
            await ref.read(statsProvider.future);
          } catch (_) {}
        },
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            // الترويسة
            Container(
              padding: EdgeInsets.fromLTRB(18, MediaQuery.paddingOf(context).top + 14, 18, 22),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primaryDeep, AppColors.primary],
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                ),
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'أهلاً ${me?.name ?? ''}',
                              style: const TextStyle(color: Colors.white, fontSize: 21, fontWeight: FontWeight.w800),
                            ),
                            const Text('لوحة المدير — ديما الحياة', style: TextStyle(color: Color(0xFFD9C8F5))),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(color: Colors.white.withValues(alpha: .14), borderRadius: BorderRadius.circular(20)),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.bluetooth_rounded, size: 16, color: hw != null ? const Color(0xFF8FE3B5) : Colors.white70),
                            const SizedBox(width: 4),
                            Text(
                              hw != null ? 'القارئ متصل' : 'القارئ جاهز',
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _code,
                    keyboardType: TextInputType.text,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (v) {
                      final t = v.trim();
                      if (t.isEmpty) return;
                      _code.clear();
                      if (looksLikeBarcode(t)) {
                        openCode(context, ref, t);
                      } else {
                        Navigator.of(context).push(MaterialPageRoute(builder: (_) => SearchScreen(initialQuery: t)));
                      }
                    },
                    decoration: InputDecoration(
                      hintText: 'اكتب باركود أو اسم منتج',
                      prefixIcon: const Icon(Icons.search_rounded),
                      suffixIcon: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            tooltip: 'ابحث بصورة المنتج',
                            onPressed: () => Navigator.of(
                              context,
                            ).push(MaterialPageRoute(builder: (_) => const WebImageSearchScreen(pick: false, startWithLens: true))),
                            icon: const Icon(Icons.center_focus_strong_rounded, color: AppColors.primary),
                          ),
                          IconButton(
                            tooltip: 'مسح بالكاميرا',
                            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ScanScreen())),
                            icon: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.primary),
                          ),
                        ],
                      ),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'قارئ باركود بلوتوث أو USB؟ امسح مباشرة من أي شاشة — بدون فتح أي حقل.',
                    style: TextStyle(color: Color(0xFFD9C8F5), fontSize: 12),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 14),
                  _TodayRow(onOpenOrders: widget.onOpenOrders),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _Quick(
                          icon: Icons.add_box_rounded,
                          label: 'إضافة منتج',
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CreateProductScreen())),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _Quick(
                          icon: Icons.point_of_sale_rounded,
                          label: 'نواقص الكاشير',
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PosMissingScreen())),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _Quick(
                          icon: Icons.bookmarks_rounded,
                          label: 'المحفوظات',
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const GroupsScreen())),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const _HealthBanner(),
                  const SectionTitle('نظرة سريعة'),
                  stats.when(
                    loading: () => const Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    error: (e, _) => ErrorView(e, onRetry: () => ref.invalidate(statsProvider)),
                    data: (s) => GridView.count(
                      crossAxisCount: MediaQuery.sizeOf(context).width > 600 ? 3 : 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      childAspectRatio: 1.75,
                      children: [
                        _StatTile(
                          icon: Icons.storefront_rounded,
                          label: 'منتج ظاهر',
                          value: s.active,
                          color: AppColors.success,
                          onTap: () => _search(const SearchPreset(status: 'active')),
                        ),
                        _StatTile(
                          icon: Icons.visibility_off_rounded,
                          label: 'منتجات موقوفة',
                          value: s.inactive,
                          color: AppColors.danger,
                          onTap: () => _search(const SearchPreset(status: 'inactive')),
                        ),
                        _StatTile(
                          icon: Icons.palette_outlined,
                          label: 'تدرجات موقوفة',
                          value: s.shadesOff,
                          sub: 'في ${s.productsWithShadesOff} منتج',
                          color: AppColors.rose,
                          onTap: () => _search(const SearchPreset(filter: 'shadesOff')),
                        ),
                        _StatTile(
                          icon: Icons.image_not_supported_outlined,
                          label: 'ظاهر بلا صور',
                          value: s.noImages,
                          color: AppColors.warning,
                          onTap: () => _search(const SearchPreset(status: 'active', filter: 'noImages')),
                        ),
                        _StatTile(
                          icon: Icons.remove_shopping_cart_outlined,
                          label: 'ظاهر ونافد',
                          value: s.outOfStock,
                          color: AppColors.info,
                          onTap: () => _search(const SearchPreset(status: 'active', filter: 'outOfStock')),
                        ),
                        _StatTile(
                          icon: Icons.bookmark_rounded,
                          label: 'باركودات بانتظار',
                          value: s.draftsPending,
                          sub: '${s.draftsAdded} أُضيفت لاحقاً',
                          color: AppColors.primary,
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const GroupsScreen())),
                        ),
                      ],
                    ),
                  ),
                  if (recent.isNotEmpty) ...[
                    SectionTitle(
                      'آخر ما مسحته',
                      trailing: TextButton(onPressed: Prefs.instance.clearRecent, child: const Text('مسح السجل')),
                    ),
                    SizedBox(
                      height: 132,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: recent.length.clamp(0, 15),
                        separatorBuilder: (_, _) => const SizedBox(width: 10),
                        itemBuilder: (_, i) {
                          final r = recent[i];
                          return SizedBox(
                            width: 128,
                            child: Panel(
                              padding: const EdgeInsets.all(8),
                              color: r.found ? Colors.white : AppColors.warningSoft,
                              onTap: () => r.productId != null
                                  ? Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductScreen(productId: r.productId!)))
                                  : openCode(context, ref, r.code),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  r.found
                                      ? NetImg(r.thumb, width: 110, height: 56, fit: BoxFit.contain)
                                      : Container(
                                          width: 110,
                                          height: 56,
                                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                                          child: const Icon(Icons.search_off_rounded, color: AppColors.warning),
                                        ),
                                  const SizedBox(height: 4),
                                  Text(
                                    r.name ?? 'غير موجود',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                                  ),
                                  Text(
                                    r.code,
                                    maxLines: 1,
                                    textDirection: TextDirection.ltr,
                                    style: const TextStyle(color: AppColors.muted, fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                  const SectionTitle('آخر التعديلات'),
                  activity.when(
                    loading: () => const SizedBox(height: 40),
                    error: (_, _) => const SizedBox(),
                    data: (list) => list.isEmpty
                        ? const Text('لا توجد تعديلات بعد', style: TextStyle(color: AppColors.muted))
                        : Panel(
                            padding: EdgeInsets.zero,
                            child: Column(
                              children: [
                                for (var i = 0; i < list.length.clamp(0, 8); i++) ...[
                                  if (i > 0) const Divider(indent: 56),
                                  ListTile(
                                    dense: true,
                                    leading: CircleAvatar(
                                      radius: 17,
                                      backgroundColor: AppColors.primaryLight,
                                      child: Icon(_activityIcon(list[i].action), size: 18, color: AppColors.primary),
                                    ),
                                    title: Text(list[i].label, style: const TextStyle(fontWeight: FontWeight.w700)),
                                    subtitle: Text([list[i].actor, timeAgo(list[i].at)].whereType<String>().join(' · ')),
                                    onTap:
                                        list[i].meta['productId'] != null ||
                                            list[i].action.startsWith('product') ||
                                            list[i].action.startsWith('images')
                                        ? () {
                                            final id = (list[i].meta['productId'] ?? list[i].entityId)?.toString();
                                            if (id != null) {
                                              Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductScreen(productId: id)));
                                            }
                                          }
                                        : null,
                                  ),
                                ],
                              ],
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _activityIcon(String a) {
    if (a.startsWith('shade')) return Icons.palette_outlined;
    if (a.startsWith('images')) return Icons.image_outlined;
    if (a.startsWith('draft')) return Icons.bookmark_outline_rounded;
    return Icons.inventory_2_outlined;
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.icon, required this.label, required this.value, required this.color, this.sub, this.onTap});
  final IconData icon;
  final String label;
  final int value;
  final Color color;
  final String? sub;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => Panel(
    padding: const EdgeInsets.all(12),
    onTap: onTap,
    child: Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(color: color.withValues(alpha: .12), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: color),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                numFmt(value),
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color, height: 1.2),
              ),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
              ),
              if (sub != null)
                Text(
                  sub!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 10.5, color: AppColors.muted),
                ),
            ],
          ),
        ),
      ],
    ),
  );
}

/// مبيعات اليوم (للمدير) + الطلبات الجديدة.
class _TodayRow extends ConsumerWidget {
  const _TodayRow({required this.onOpenOrders});
  final VoidCallback onOpenOrders;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAdmin = ref.watch(sessionProvider).isAdmin;
    final pending = ref.watch(pendingOrdersProvider);
    final sales = isAdmin ? ref.watch(salesProvider).valueOrNull : null;
    final ordersCard = Material(
      color: pending > 0 ? AppColors.warningSoft : Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onOpenOrders,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.line),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.receipt_long_rounded, color: pending > 0 ? AppColors.warning : AppColors.muted),
                  const Spacer(),
                  if (pending > 0) const Icon(Icons.circle, size: 10, color: AppColors.danger),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                '$pending',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: pending > 0 ? AppColors.warning : AppColors.ink),
              ),
              const Text('طلبات جديدة', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5)),
            ],
          ),
        ),
      ),
    );
    if (sales == null) return ordersCard;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: SalesTodayCard(
            s: sales,
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SalesScreen())),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(child: ordersCard),
      ],
    );
  }
}

class _Quick extends StatelessWidget {
  const _Quick({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Panel(
    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
    onTap: onTap,
    child: Column(
      children: [
        Icon(icon, color: AppColors.primary),
        const SizedBox(height: 4),
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
        ),
      ],
    ),
  );
}

class _HealthBanner extends ConsumerWidget {
  const _HealthBanner();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final h = ref.watch(healthProvider).valueOrNull;
    if (h == null || h.issues == 0) return const SizedBox.shrink();
    final top = h.items.where((i) => i.count > 0 && i.severity == 'high').map((i) => '${i.label} (${i.count})').take(2).join(' · ');
    return Panel(
      color: AppColors.warningSoft,
      padding: const EdgeInsets.all(12),
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const HealthScreen())),
      child: Row(
        children: [
          const Icon(Icons.health_and_safety_rounded, color: AppColors.warning),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  issuesLabel(h.issues),
                  style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.warning),
                ),
                if (top.isNotEmpty) Text(top, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12.5)),
              ],
            ),
          ),
          const Icon(Icons.chevron_left_rounded),
        ],
      ),
    );
  }
}
