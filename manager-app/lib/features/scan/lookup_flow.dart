import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/prefs.dart';
import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../widgets/common.dart';
import '../drafts/save_draft_screen.dart';
import '../product/product_screen.dart';

/// يفتح نتيجة باركود: المنتج مباشرة، أو نافذة «غير موجود» مع الحفظ في مجموعة.
Future<void> openCode(BuildContext context, WidgetRef ref, String raw, {ScanSource source = ScanSource.typed}) async {
  final code = normalizeCode(raw);
  if (code.isEmpty) return;
  final nav = Navigator.of(context);
  showDialog(
    context: context,
    barrierDismissible: false,
    barrierColor: const Color(0x55000000),
    builder: (_) => PopScope(
      canPop: false,
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5)),
              const SizedBox(width: 14),
              Text(
                code,
                textDirection: TextDirection.ltr,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  decoration: TextDecoration.none,
                  color: AppColors.ink,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
  LookupResult? res;
  Object? error;
  try {
    res = await ref.read(repoProvider).lookup(code);
  } catch (e) {
    error = e;
  }
  nav.pop();
  if (!context.mounted) return;
  if (error != null || res == null) {
    Prefs.instance.feedback(error: true);
    toastError(context, error ?? 'خطأ');
    return;
  }
  if (res.found && res.product != null) {
    final p = res.product!;
    Prefs.instance.feedback();
    final shade = res.matchedShadeId == null ? null : p.shades.where((s) => s.id == res!.matchedShadeId).firstOrNull;
    Prefs.instance.addRecent(
      RecentScan(
        code: code,
        at: DateTime.now(),
        name: shade == null ? p.name : '${p.name} — ${shade.name}',
        productId: p.id,
        found: true,
        thumb: shade?.image?.thumb ?? p.cover,
      ),
    );
    await nav.push(
      MaterialPageRoute(
        builder: (_) => ProductScreen(productId: p.id, initial: p, highlightShadeId: res!.matchedShadeId),
      ),
    );
    return;
  }
  Prefs.instance.feedback(error: true);
  Prefs.instance.addRecent(RecentScan(code: code, at: DateTime.now(), name: res.pos?.name, found: false));
  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (_) => NotFoundSheet(result: res!),
  );
}

class NotFoundSheet extends StatelessWidget {
  const NotFoundSheet({super.key, required this.result});
  final LookupResult result;

  @override
  Widget build(BuildContext context) {
    final pos = result.pos;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(color: AppColors.warningSoft, borderRadius: BorderRadius.circular(16)),
                  child: const Icon(Icons.search_off_rounded, color: AppColors.warning, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('غير موجود في التطبيق', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                      GestureDetector(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: result.code));
                          toast(context, 'نُسخ الباركود');
                        },
                        child: Row(
                          children: [
                            Text(
                              result.code,
                              textDirection: TextDirection.ltr,
                              style: const TextStyle(fontSize: 16, color: AppColors.muted, fontWeight: FontWeight.w700, letterSpacing: .5),
                            ),
                            const SizedBox(width: 6),
                            const Icon(Icons.copy_rounded, size: 15, color: AppColors.muted),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (pos != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.infoSoft, borderRadius: BorderRadius.circular(16)),
                child: Row(
                  children: [
                    const Icon(Icons.point_of_sale_rounded, color: AppColors.info),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'موجود في نظام الكاشير',
                            style: TextStyle(color: AppColors.info, fontWeight: FontWeight.w800, fontSize: 12.5),
                          ),
                          Text(pos.name ?? '—', style: const TextStyle(fontWeight: FontWeight.w700)),
                          Text(
                            '${money(pos.price)} · الكمية ${numFmt(pos.stock)}',
                            style: const TextStyle(color: AppColors.muted, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (result.drafts.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Text(
                'محفوظ مسبقاً في:',
                style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.muted),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final d in result.drafts)
                    Pill(
                      d.groupName,
                      color: AppColors.group(d.groupColor),
                      bg: AppColors.group(d.groupColor).withValues(alpha: .12),
                      icon: Icons.folder_rounded,
                    ),
                ],
              ),
            ],
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: () async {
                final saved = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(
                    builder: (_) => SaveDraftScreen(barcode: result.code, posName: pos?.name),
                  ),
                );
                if (saved == true && context.mounted) Navigator.pop(context);
              },
              icon: const Icon(Icons.bookmark_add_rounded),
              label: Text(result.drafts.isEmpty ? 'احفظه مع صورة في مجموعة' : 'أضف صوراً أو احفظه في مجموعة أخرى'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('إغلاق')),
          ],
        ),
      ),
    );
  }
}
