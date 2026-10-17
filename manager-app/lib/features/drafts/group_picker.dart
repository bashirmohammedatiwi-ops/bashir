import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';

const groupColorNames = {
  'violet': 'بنفسجي',
  'rose': 'وردي',
  'gold': 'ذهبي',
  'mint': 'نعناعي',
  'sky': 'سماوي',
  'coral': 'مرجاني',
  'slate': 'رمادي',
};

/// اختيار مجموعة الحفظ (مع إنشاء مجموعة جديدة في نفس المكان).
class GroupPicker extends ConsumerWidget {
  const GroupPicker({super.key, required this.selected, required this.onChanged, this.exclude});
  final String? selected;
  final ValueChanged<String> onChanged;
  final String? exclude;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groups = ref.watch(groupsProvider);
    return groups.when(
      loading: () => const Padding(padding: EdgeInsets.all(12), child: LinearProgressIndicator()),
      error: (e, _) => Text('تعذر تحميل المجموعات: $e', style: const TextStyle(color: AppColors.danger)),
      data: (list) {
        final visible = list.where((g) => g.id != exclude).toList();
        // المحددة لم تعد موجودة → أول مجموعة
        if (selected != null && !visible.any((g) => g.id == selected) && visible.isNotEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) => onChanged(visible.first.id));
        }
        if (selected == null && visible.isNotEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) => onChanged(visible.first.id));
        }
        return Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final g in visible) _GroupChip(group: g, selected: g.id == selected, onTap: () => onChanged(g.id)),
            ActionChip(
              avatar: const Icon(Icons.add_rounded, size: 18, color: AppColors.primary),
              label: const Text('مجموعة جديدة', style: TextStyle(color: AppColors.primary)),
              backgroundColor: AppColors.primaryLight,
              onPressed: () async {
                final g = await showCreateGroupDialog(context, ref);
                if (g != null) onChanged(g.id);
              },
            ),
          ],
        );
      },
    );
  }
}

class _GroupChip extends StatelessWidget {
  const _GroupChip({required this.group, required this.selected, required this.onTap});
  final DraftGroup group;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.group(group.color);
    return Material(
      color: selected ? c : c.withValues(alpha: .1),
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(selected ? Icons.check_circle_rounded : Icons.folder_rounded, size: 18, color: selected ? Colors.white : c),
              const SizedBox(width: 6),
              Text(
                group.name,
                style: TextStyle(fontWeight: FontWeight.w700, color: selected ? Colors.white : c),
              ),
              if (group.pending > 0) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  decoration: BoxDecoration(
                    color: selected ? Colors.white24 : c.withValues(alpha: .15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${group.pending}',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: selected ? Colors.white : c),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// إنشاء أو تعديل مجموعة (اسم + لون + ملاحظة).
Future<DraftGroup?> showCreateGroupDialog(BuildContext context, WidgetRef ref, {DraftGroup? edit}) async {
  final name = TextEditingController(text: edit?.name);
  final note = TextEditingController(text: edit?.note);
  var color = edit?.color ?? 'violet';
  final result = await showDialog<bool>(
    context: context,
    builder: (c) => StatefulBuilder(
      builder: (c, setS) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(edit == null ? 'مجموعة جديدة' : 'تعديل المجموعة', style: const TextStyle(fontWeight: FontWeight.w800)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: name,
                autofocus: edit == null,
                decoration: const InputDecoration(labelText: 'الاسم', hintText: 'مثلاً: رف العطور، طلبية تركيا'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: note,
                decoration: const InputDecoration(labelText: 'ملاحظة (اختياري)'),
              ),
              const SizedBox(height: 14),
              const Text('اللون', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  for (final k in AppColors.groupColors.keys)
                    Tooltip(
                      message: groupColorNames[k] ?? k,
                      child: GestureDetector(
                        onTap: () => setS(() => color = k),
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: AppColors.group(k),
                            shape: BoxShape.circle,
                            border: Border.all(color: color == k ? AppColors.ink : Colors.white, width: 3),
                          ),
                          child: color == k ? const Icon(Icons.check_rounded, color: Colors.white, size: 18) : null,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('إلغاء')),
          FilledButton(onPressed: () => Navigator.pop(c, true), child: Text(edit == null ? 'إنشاء' : 'حفظ')),
        ],
      ),
    ),
  );
  if (result != true || name.text.trim().isEmpty) return null;
  final repo = ref.read(repoProvider);
  try {
    if (edit != null) {
      await repo.updateGroup(edit.id, {'name': name.text.trim(), 'color': color, 'note': note.text.trim()});
      ref.invalidate(groupsProvider);
      return edit;
    }
    final g = await repo.createGroup(name.text.trim(), color: color, note: note.text.trim());
    ref.invalidate(groupsProvider);
    return g;
  } catch (e) {
    if (context.mounted) toastError(context, e);
    return null;
  }
}
