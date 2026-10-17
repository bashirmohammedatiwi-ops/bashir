import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models.dart';
import '../../data/repo.dart';
import '../../widgets/common.dart';

/// تعديل نصوص المنتج — يُرسل الحقول المتغيرة فقط.
class ProductEditScreen extends ConsumerStatefulWidget {
  const ProductEditScreen({super.key, required this.product});
  final ProductDetail product;
  @override
  ConsumerState<ProductEditScreen> createState() => _ProductEditScreenState();
}

class _ProductEditScreenState extends ConsumerState<ProductEditScreen> {
  late final _fields = <String, TextEditingController>{
    'nameAr': TextEditingController(text: widget.product.nameAr ?? widget.product.name),
    'nameEn': TextEditingController(text: widget.product.nameEn ?? ''),
    'barcode': TextEditingController(text: widget.product.barcode ?? ''),
    'descriptionAr': TextEditingController(text: widget.product.descriptionAr ?? ''),
    'descriptionEn': TextEditingController(text: widget.product.descriptionEn ?? ''),
    'howToUse': TextEditingController(text: widget.product.howToUse ?? ''),
    'ingredients': TextEditingController(text: widget.product.ingredients ?? ''),
  };
  late final Map<String, String> _initial = {for (final e in _fields.entries) e.key: e.value.text};
  bool _saving = false;

  Map<String, String> get _changes => {
    for (final e in _fields.entries)
      if (e.value.text.trim() != _initial[e.key]!.trim()) e.key: e.value.text.trim(),
  };

  Future<void> _save() async {
    final patch = _changes;
    if (patch.isEmpty) return Navigator.pop(context);
    if ((patch['nameAr'] ?? 'x').isEmpty && (_fields['nameEn']!.text.trim().isEmpty)) {
      return toast(context, 'اكتب اسم المنتج', error: true);
    }
    setState(() => _saving = true);
    try {
      final p = await ref.read(repoProvider).patchProduct(widget.product.id, patch);
      if (!mounted) return;
      toast(context, 'تم حفظ التعديلات');
      Navigator.pop(context, p);
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _field(String key, String label, {int lines = 1, bool ltr = false, String? hint}) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextField(
      controller: _fields[key],
      minLines: lines,
      maxLines: lines == 1 ? 1 : lines + 6,
      textDirection: ltr ? TextDirection.ltr : null,
      onChanged: (_) => setState(() {}),
      decoration: InputDecoration(labelText: label, hintText: hint, alignLabelWithHint: lines > 1),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final dirty = _changes.isNotEmpty;
    return PopScope(
      canPop: !dirty,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (await confirm(context, title: 'تجاهل التعديلات؟', ok: 'تجاهل', danger: true) && context.mounted) {
          Navigator.pop(context);
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('تعديل المعلومات'),
          actions: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: FilledButton(
                onPressed: _saving || !dirty ? null : _save,
                style: FilledButton.styleFrom(minimumSize: const Size(0, 40)),
                child: _saving
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white))
                    : const Text('حفظ'),
              ),
            ),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            _field('nameAr', 'الاسم بالعربي'),
            _field('nameEn', 'الاسم بالإنجليزي', ltr: true),
            if (widget.product.shades.isEmpty) _field('barcode', 'الباركود', ltr: true, hint: 'يُسحب السعر والمخزون من الكاشير تلقائياً'),
            _field('descriptionAr', 'الوصف بالعربي', lines: 5),
            _field('descriptionEn', 'الوصف بالإنجليزي', lines: 4, ltr: true),
            _field('howToUse', 'طريقة الاستخدام', lines: 3),
            _field('ingredients', 'المكونات', lines: 3, ltr: true),
          ],
        ),
      ),
    );
  }
}
