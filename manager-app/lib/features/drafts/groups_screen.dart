import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import 'group_picker.dart';
import 'group_screen.dart';

/// مجموعات الباركودات المحفوظة — كل مجموعة تعرض كم أضيف منها لاحقاً.
class GroupsScreen extends ConsumerWidget {
  const GroupsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groups = ref.watch(groupsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('الباركودات المحفوظة'),
        actions: [
          IconButton(
            tooltip: 'كل المحفوظات',
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const GroupScreen(group: null))),
            icon: const Icon(Icons.view_list_rounded),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'newGroup',
        onPressed: () => showCreateGroupDialog(context, ref),
        icon: const Icon(Icons.create_new_folder_rounded),
        label: const Text('مجموعة جديدة', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(groupsProvider.future),
        child: groups.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [ErrorView(e, onRetry: () => ref.invalidate(groupsProvider))]),
          data: (list) {
            if (list.isEmpty) {
              return ListView(
                children: [
                  EmptyState(
                    icon: Icons.folder_open_rounded,
                    title: 'لا توجد مجموعات بعد',
                    message:
                        'عند مسح منتج غير موجود في التطبيق احفظ باركوده وصورته في مجموعة،\nوحين تضيفه لاحقاً يتحول لونه للأخضر تلقائياً.',
                    action: FilledButton.icon(
                      onPressed: () => showCreateGroupDialog(context, ref),
                      icon: const Icon(Icons.add_rounded),
                      label: const Text('أنشئ أول مجموعة'),
                    ),
                  ),
                ],
              );
            }
            final pending = list.fold<int>(0, (s, g) => s + g.pending);
            final added = list.fold<int>(0, (s, g) => s + g.added);
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _Mini(label: 'بانتظار الإضافة', value: pending, color: AppColors.warning, bg: AppColors.warningSoft),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _Mini(label: 'أُضيفت لاحقاً', value: added, color: AppColors.success, bg: AppColors.successSoft),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                for (final g in list)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _GroupCard(group: g),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _Mini extends StatelessWidget {
  const _Mini({required this.label, required this.value, required this.color, required this.bg});
  final String label;
  final int value;
  final Color color;
  final Color bg;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          numFmt(value),
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color),
        ),
        Text(
          label,
          style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12.5),
        ),
      ],
    ),
  );
}

class _GroupCard extends ConsumerWidget {
  const _GroupCard({required this.group});
  final DraftGroup group;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final g = group;
    final c = AppColors.group(g.color);
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => GroupScreen(group: g))),
        onLongPress: () => _menu(context, ref),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.line),
          ),
          child: Column(
            children: [
              Container(
                height: 6,
                decoration: BoxDecoration(
                  color: c,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 6, 14),
                child: Row(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(color: c.withValues(alpha: .12), borderRadius: BorderRadius.circular(14)),
                      child: Icon(Icons.folder_rounded, color: c, size: 28),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(g.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16.5)),
                          if ((g.note ?? '').isNotEmpty)
                            Text(
                              g.note!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                            ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Pill('${g.pending} بانتظار', color: AppColors.warning, bg: AppColors.warningSoft, small: true),
                              const SizedBox(width: 6),
                              Pill('${g.added} أُضيف', color: AppColors.success, bg: AppColors.successSoft, small: true),
                              const Spacer(),
                              if (g.lastDraftAt != null)
                                Text(timeAgo(g.lastDraftAt), style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: g.progress,
                              minHeight: 6,
                              backgroundColor: c.withValues(alpha: .12),
                              color: AppColors.success,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (g.covers.isNotEmpty) ...[
                      const SizedBox(width: 10),
                      SizedBox(
                        width: 56,
                        height: 56,
                        child: Stack(
                          children: [
                            for (var i = g.covers.length - 1; i >= 0; i--)
                              Positioned(
                                left: i * 6.0,
                                top: i * 4.0,
                                child: Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: Colors.white, width: 2),
                                  ),
                                  child: NetImg(g.covers[i], size: 44, radius: 9),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                    IconButton(onPressed: () => _menu(context, ref), icon: const Icon(Icons.more_vert_rounded)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _menu(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      builder: (c) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit_rounded, color: AppColors.primary),
              title: const Text('تعديل الاسم واللون'),
              onTap: () {
                Navigator.pop(c);
                showCreateGroupDialog(context, ref, edit: group);
              },
            ),
            ListTile(
              leading: const Icon(Icons.archive_outlined, color: AppColors.primary),
              title: const Text('أرشفة (إخفاء من القائمة)'),
              onTap: () async {
                Navigator.pop(c);
                try {
                  await ref.read(repoProvider).updateGroup(group.id, {'isArchived': true});
                  ref.invalidate(groupsProvider);
                  if (context.mounted) toast(context, 'أُرشفت «${group.name}»');
                } catch (e) {
                  if (context.mounted) toastError(context, e);
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline_rounded, color: AppColors.danger),
              title: const Text('حذف المجموعة', style: TextStyle(color: AppColors.danger)),
              onTap: () async {
                Navigator.pop(c);
                final ok = await confirm(
                  context,
                  title: 'حذف «${group.name}»؟',
                  message: group.total > 0 ? 'ستُحذف ${group.total} باركود محفوظ فيها نهائياً.' : null,
                  ok: 'حذف',
                  danger: true,
                );
                if (!ok) return;
                try {
                  await ref.read(repoProvider).deleteGroup(group.id);
                  ref.invalidate(groupsProvider);
                  ref.invalidate(statsProvider);
                } catch (e) {
                  if (context.mounted) toastError(context, e);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
