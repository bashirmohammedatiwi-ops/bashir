import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models.dart';
import '../../data/repo.dart';
import '../../core/theme.dart';
import '../../widgets/common.dart';
import '../catalog/pickers.dart';

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
  late NamedRef? _brand = widget.product.brand;
  CategoryPick? _cat;
  bool _catChanged = false;

  Map<String, dynamic> get _changes => {
    for (final e in _fields.entries)
      if (e.value.text.trim() != _initial[e.key]!.trim()) e.key: e.value.text.trim(),
    if (_brand != null && _brand!.id.isNotEmpty && _brand!.id != widget.product.brand?.id) 'brandId': _brand!.id,
    if (_catChanged && _cat != null) ...{
      'categoryId': _cat!.categoryId,
      'subcategoryIds': _cat!.subcategoryIds,
      'tertiaryCategoryIds': _cat!.tertiaryIds,
    },
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

  Widget _picker({required IconData icon, required String label, required String? value, required VoidCallback onTap}) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: InputDecorator(
        decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon), suffixIcon: const Icon(Icons.expand_more_rounded)),
        isEmpty: value == null,
        child: value == null
            ? const SizedBox(height: 20)
            : Text(
                value,
                style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.ink),
              ),
      ),
    ),
  );

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
            _picker(
              icon: Icons.sell_outlined,
              label: 'البراند',
              value: _brand?.name,
              onTap: () async {
                final b = await pickBrand(context);
                if (b == null) return;
                if (b.id.isEmpty) {
                  if (context.mounted) toast(context, 'لتغيير البراند إلى براند جديد أنشئه من «إضافة منتج» أو لوحة التحكم', error: true);
                  return;
                }
                setState(() => _brand = b);
              },
            ),
            Consumer(
              builder: (context, ref, _) {
                final roots = ref.watch(categoriesProvider).valueOrNull;
                final current =
                    _cat ??
                    (roots == null
                        ? null
                        : categoryPathFor(
                            roots,
                            widget.product.categoryId,
                            widget.product.subcategoryIds,
                            widget.product.tertiaryCategoryIds,
                          ));
                return _picker(
                  icon: Icons.category_outlined,
                  label: 'القسم',
                  value: current?.label ?? widget.product.category?.name,
                  onTap: () async {
                    final c = await pickCategory(context);
                    if (c != null) setState(() => (_cat = c, _catChanged = true));
                  },
                );
              },
            ),
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
