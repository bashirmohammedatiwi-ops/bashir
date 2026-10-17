import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../product/add_shade_sheet.dart';
import '../product/product_screen.dart';

/// باركود غير موجود هو غالباً لون جديد لمنتج موجود: اختر المنتج ثم أضف التدرج.
Future<bool> attachAsShade(BuildContext context, WidgetRef ref, String barcode, {String? hint}) async {
  final picked = await showModalBottomSheet<ProductSummary>(
    context: context,
    isScrollControlled: true,
    builder: (_) => _ProductPickerSheet(hint: hint),
  );
  if (picked == null || !context.mounted) return false;
  ProductDetail product;
  try {
    product = await ref.read(repoProvider).product(picked.id);
  } catch (e) {
    if (context.mounted) toastError(context, e);
    return false;
  }
  if (!context.mounted) return false;
  final next = await showAddShadeSheet(context, product, barcode: barcode);
  if (next == null || !context.mounted) return false;
  ref.read(dataVersionProvider.notifier).state++;
  ref.invalidate(statsProvider);
  toast(context, 'أُضيف التدرج إلى «${next.name}»');
  await Navigator.of(context).push(
    MaterialPageRoute(
      builder: (_) => ProductScreen(productId: next.id, initial: next),
    ),
  );
  return true;
}

class _ProductPickerSheet extends ConsumerStatefulWidget {
  const _ProductPickerSheet({this.hint});
  final String? hint;
  @override
  ConsumerState<_ProductPickerSheet> createState() => _ProductPickerSheetState();
}

class _ProductPickerSheetState extends ConsumerState<_ProductPickerSheet> {
  late final _q = TextEditingController(text: widget.hint ?? '');
  Timer? _debounce;
  List<ProductSummary> _items = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (_q.text.isNotEmpty) _search();
  }

  Future<void> _search() async {
    if (_q.text.trim().length < 2) return setState(() => _items = []);
    setState(() => _loading = true);
    try {
      final r = await ref.read(repoProvider).search(q: _q.text, limit: 30);
      if (mounted) setState(() => _items = r.items);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * .85,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('لأي منتج هذا التدرج؟', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
                const SizedBox(height: 8),
                TextField(
                  controller: _q,
                  autofocus: widget.hint == null,
                  onChanged: (_) {
                    _debounce?.cancel();
                    _debounce = Timer(const Duration(milliseconds: 300), _search);
                  },
                  decoration: InputDecoration(
                    hintText: 'ابحث باسم المنتج أو البراند',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: _loading
                        ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2))
                        : null,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
              itemCount: _items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final p = _items[i];
                return Panel(
                  padding: const EdgeInsets.all(8),
                  onTap: () => Navigator.pop(context, p),
                  child: Row(
                    children: [
                      NetImg(p.thumb, size: 52, fit: BoxFit.contain),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                            Text(
                              [p.brand?.name, if (p.shadeCount > 0) '${p.shadeCount} تدرج', money(p.price)].whereType<String>().join(' · '),
                              style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
