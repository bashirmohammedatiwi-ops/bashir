import 'package:flutter/material.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../widgets/common.dart';

/// تشغيل منتج له تدرجات: يختار المدير أي التدرجات تظهر معه (المتوفر محدد مسبقاً).
/// يُرجع معرّفات التدرجات المختارة، أو null عند الإلغاء.
Future<List<String>?> pickShadesToShow(BuildContext context, ProductDetail p) {
  return showModalBottomSheet<List<String>>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _ShadePicker(product: p),
  );
}

class _ShadePicker extends StatefulWidget {
  const _ShadePicker({required this.product});
  final ProductDetail product;
  @override
  State<_ShadePicker> createState() => _ShadePickerState();
}

class _ShadePickerState extends State<_ShadePicker> {
  late final List<Shade> _shades = [...widget.product.shades]..sort((a, b) => (b.stock > 0 ? 1 : 0).compareTo(a.stock > 0 ? 1 : 0));
  late final Set<String> _on = {
    for (final s in _shades)
      if (s.stock > 0) s.id,
  };

  int get _inStock => _shades.where((s) => s.stock > 0).length;

  @override
  Widget build(BuildContext context) {
    final n = _on.length;
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * .82,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('أي التدرجات تظهر للزبائن؟', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text(
                  _inStock > 0
                      ? 'حدّدنا المتوفر في المخزون ($_inStock). المنتج يظهر مع التدرجات المختارة فقط.'
                      : 'كل التدرجات نافدة في المخزون — اختر ما تريد إظهاره.',
                  style: const TextStyle(color: AppColors.muted, fontSize: 12.5, height: 1.5),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    if (_inStock > 0)
                      ActionChip(
                        label: const Text('المتوفر فقط'),
                        onPressed: () => setState(
                          () => _on
                            ..clear()
                            ..addAll(_shades.where((s) => s.stock > 0).map((s) => s.id)),
                        ),
                      ),
                    ActionChip(label: const Text('الكل'), onPressed: () => setState(() => _on.addAll(_shades.map((s) => s.id)))),
                    ActionChip(label: const Text('لا شيء'), onPressed: () => setState(_on.clear)),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: _shades.length,
              itemBuilder: (_, i) {
                final s = _shades[i];
                final on = _on.contains(s.id);
                return CheckboxListTile(
                  value: on,
                  onChanged: (v) => setState(() => v == true ? _on.add(s.id) : _on.remove(s.id)),
                  controlAffinity: ListTileControlAffinity.trailing,
                  secondary: Swatch(hex: s.colorHex, hexEnd: s.colorHexEnd, size: 38, imageUrl: s.image?.thumb),
                  title: Text(s.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text(
                    s.stock > 0 ? 'متوفر ${numFmt(s.stock)}' : 'نافد',
                    style: TextStyle(color: s.stock > 0 ? AppColors.success : AppColors.danger, fontSize: 12),
                  ),
                );
              },
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: FilledButton.icon(
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(50)),
                onPressed: n == 0 ? null : () => Navigator.pop(context, _on.toList()),
                icon: const Icon(Icons.storefront_rounded),
                label: Text(
                  n == 0
                      ? 'اختر تدرجاً واحداً على الأقل'
                      : 'إظهار المنتج مع ${arCount(n, one: 'تدرج واحد', two: 'تدرجين', few: 'تدرجات', many: 'تدرجاً')}',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
