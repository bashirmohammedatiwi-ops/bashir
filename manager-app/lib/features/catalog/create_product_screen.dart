import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/photos.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../product/product_screen.dart';
import 'pickers.dart';

/// صورة في نموذج الإضافة: مرفوعة (mediaId) أو رابط ويب يرفعه السيرفر.
class _Pic {
  _Pic.media(this.mediaId, this.preview) : url = null;
  _Pic.url(this.url, this.preview) : mediaId = null;
  final String? mediaId;
  final String? url;
  final String? preview;
  Uint8List? bytes;
  bool uploading = false;
}

/// إضافة منتج جديد من الهاتف: من باركود غير موجود، مسودة محفوظة، أو صنف من الكاشير.
class CreateProductScreen extends ConsumerStatefulWidget {
  const CreateProductScreen({super.key, this.barcode, this.posName, this.posPrice, this.posStock, this.draft});
  final String? barcode;
  final String? posName;
  final int? posPrice;
  final int? posStock;
  final Draft? draft;

  @override
  ConsumerState<CreateProductScreen> createState() => _CreateProductScreenState();
}

class _CreateProductScreenState extends ConsumerState<CreateProductScreen> {
  late final _barcode = TextEditingController(text: widget.draft?.barcode ?? widget.barcode ?? '');
  late final _nameAr = TextEditingController(text: widget.draft?.name ?? widget.posName ?? '');
  final _nameEn = TextEditingController();
  final _descAr = TextEditingController();
  late final _price = TextEditingController(text: widget.posPrice == null ? '' : '${widget.posPrice}');
  NamedRef? _brand;
  CategoryPick? _cat;
  late final List<_Pic> _pics = [for (final i in widget.draft?.images ?? const <MediaImage>[]) _Pic.media(i.mediaId, i.thumb)];
  bool _active = true;
  bool _saving = false;
  bool _filling = false;
  String? _fillNote;

  bool get _hasPos => widget.posPrice != null || widget.draft?.pos != null;
  int? get _posPrice => widget.posPrice ?? widget.draft?.pos?.price;

  Future<void> _autofill() async {
    final code = normalizeCode(_barcode.text);
    if (code.length < 6) return toast(context, 'التعبئة الذكية تحتاج باركوداً (6 خانات على الأقل)', error: true);
    setState(() {
      _filling = true;
      _fillNote = null;
    });
    try {
      final a = await ref.read(repoProvider).autofill(code, hint: _nameAr.text.isEmpty ? null : _nameAr.text);
      if (!mounted) return;
      if (a.exists) {
        toast(context, 'هذا الباركود موجود في التطبيق مسبقاً', error: true);
        return;
      }
      setState(() {
        if (a.nameAr.isNotEmpty) _nameAr.text = a.nameAr;
        if (a.nameEn.isNotEmpty) _nameEn.text = a.nameEn;
        if (a.descriptionAr.isNotEmpty) _descAr.text = a.descriptionAr;
        final brandName = a.brandEn.isNotEmpty ? a.brandEn : a.brandAr;
        if (_brand == null && brandName.isNotEmpty) {
          final brands = ref.read(brandsProvider).valueOrNull ?? const <NamedRef>[];
          _brand = brands.where((b) => b.name.toLowerCase() == brandName.toLowerCase()).firstOrNull ?? NamedRef('', brandName);
        }
        final roots = ref.read(categoriesProvider).valueOrNull;
        if (roots != null && a.categoryId != null) _cat = categoryPathFor(roots, a.categoryId, a.subcategoryIds, a.tertiaryIds) ?? _cat;
        for (final img in a.images.take(_pics.isEmpty ? 3 : 0)) {
          _pics.add(_Pic.url(img.url, img.thumb ?? img.url));
        }
        _fillNote = 'راجع الأسماء والصور قبل الحفظ';
      });
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _filling = false);
    }
  }

  Future<void> _addPhotos() async {
    final choice = await showModalBottomSheet<String>(
      context: context,
      builder: (c) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera_rounded),
              title: const Text('الكاميرا'),
              onTap: () => Navigator.pop(c, 'camera'),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_rounded),
              title: const Text('المعرض'),
              onTap: () => Navigator.pop(c, 'gallery'),
            ),
            ListTile(
              leading: const Icon(Icons.travel_explore_rounded),
              title: const Text('بحث في الويب والمتاجر'),
              onTap: () => Navigator.pop(c, 'web'),
            ),
          ],
        ),
      ),
    );
    if (choice == null || !mounted) return;
    if (choice == 'web') {
      final picked = await pickWebImages(context, barcode: _barcode.text, name: _nameEn.text.isNotEmpty ? _nameEn.text : _nameAr.text);
      if (picked != null) setState(() => _pics.addAll(picked.map((w) => _Pic.url(w.url, w.thumb ?? w.url))));
      return;
    }
    final files = await pickPhotos(choice == 'camera' ? PhotoSource.camera : PhotoSource.gallery);
    for (final f in files) {
      final bytes = await f.readAsBytes();
      final placeholder = _Pic.media(null, null)
        ..uploading = true
        ..bytes = bytes;
      setState(() => _pics.add(placeholder));
      try {
        final id = await uploadPhoto(ref.read(repoProvider), f);
        final i = _pics.indexOf(placeholder);
        if (mounted && i >= 0) setState(() => _pics[i] = _Pic.media(id, null)..bytes = bytes);
      } catch (e) {
        if (mounted) {
          setState(() => _pics.remove(placeholder));
          toastError(context, e);
        }
      }
    }
  }

  Future<void> _save() async {
    if (_nameAr.text.trim().isEmpty && _nameEn.text.trim().isEmpty) return toast(context, 'اكتب اسم المنتج', error: true);
    if (_brand == null) return toast(context, 'اختر البراند', error: true);
    if (_pics.any((p) => p.uploading)) return toast(context, 'انتظر اكتمال رفع الصور', error: true);
    final price = int.tryParse(_price.text.replaceAll(RegExp(r'\D'), ''));
    if (!_hasPos && (price == null || price <= 0)) return toast(context, 'اكتب السعر — الباركود غير موجود في الكاشير', error: true);
    setState(() => _saving = true);
    try {
      final r = await ref.read(repoProvider).createProduct({
        if (_barcode.text.trim().isNotEmpty) 'barcode': normalizeCode(_barcode.text),
        'nameAr': _nameAr.text.trim(),
        'nameEn': _nameEn.text.trim(),
        if (_descAr.text.trim().isNotEmpty) 'descriptionAr': _descAr.text.trim(),
        if (_brand!.id.isNotEmpty) 'brandId': _brand!.id else 'brandName': _brand!.name,
        if (_cat?.categoryId != null) 'categoryId': _cat!.categoryId,
        if (_cat != null) 'subcategoryIds': _cat!.subcategoryIds,
        if (_cat != null) 'tertiaryCategoryIds': _cat!.tertiaryIds,
        'imageIds': [for (final p in _pics) ?p.mediaId],
        'imageUrls': [for (final p in _pics) ?p.url],
        'price': ?price,
        'isActive': _active,
        if (widget.draft != null) 'draftId': widget.draft!.id,
      });
      ref.invalidate(statsProvider);
      ref.invalidate(groupsProvider);
      ref.invalidate(brandsProvider);
      ref.read(dataVersionProvider.notifier).state++;
      if (!mounted) return;
      toast(context, r.failedImages > 0 ? 'أُضيف المنتج — تعذّر رفع ${r.failedImages} صورة' : 'أُضيف المنتج إلى التطبيق ✓');
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => ProductScreen(productId: r.product.id, initial: r.product),
        ),
      );
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('إضافة منتج جديد')),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: FilledButton.icon(
            onPressed: _saving ? null : _save,
            icon: _saving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                : const Icon(Icons.add_task_rounded),
            label: Text(_saving ? 'جارٍ الحفظ ورفع الصور…' : 'حفظ المنتج'),
          ),
        ),
      ),
      body: BusyOverlay(
        busy: _filling,
        label: 'تعبئة ذكية… قد تأخذ دقيقة',
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 30),
          children: [
            TextField(
              controller: _barcode,
              textDirection: TextDirection.ltr,
              keyboardType: TextInputType.number,
              style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: .5),
              decoration: const InputDecoration(labelText: 'الباركود', prefixIcon: Icon(Icons.qr_code_rounded)),
            ),
            if (_hasPos) ...[
              const SizedBox(height: 10),
              Panel(
                color: AppColors.infoSoft,
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    const Icon(Icons.point_of_sale_rounded, color: AppColors.info),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'السعر والمخزون من الكاشير تلقائياً: ${money(_posPrice)}${widget.posStock != null ? ' · ${widget.posStock} قطعة' : ''}',
                        style: const TextStyle(color: AppColors.info, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _filling ? null : _autofill,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
              ),
              icon: const Icon(Icons.auto_awesome_rounded),
              label: const Text('تعبئة ذكية من الباركود (اسم، براند، قسم، صور)'),
            ),
            if (_fillNote != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  _fillNote!,
                  style: const TextStyle(color: AppColors.warning, fontWeight: FontWeight.w700, fontSize: 12.5),
                ),
              ),
            SectionTitle('الصور (${_pics.length})', subtitle: 'الأولى غلاف — اضغط مطولاً لجعل صورة غلافاً'),
            SizedBox(
              height: 108,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _AddTile(onTap: _addPhotos),
                  for (var i = 0; i < _pics.length; i++)
                    Padding(
                      padding: const EdgeInsetsDirectional.only(end: 8),
                      child: GestureDetector(
                        onLongPress: () => setState(() => _pics.insert(0, _pics.removeAt(i))),
                        child: Stack(
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: i == 0 ? AppColors.primary : AppColors.line, width: i == 0 ? 2 : 1),
                              ),
                              child: _pics[i].bytes != null
                                  ? Stack(
                                      children: [
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(12),
                                          child: Image.memory(_pics[i].bytes!, width: 100, height: 100, fit: BoxFit.cover),
                                        ),
                                        if (_pics[i].uploading) const Positioned.fill(child: Center(child: CircularProgressIndicator())),
                                      ],
                                    )
                                  : _pics[i].preview == null
                                  ? Container(
                                      width: 100,
                                      height: 100,
                                      alignment: Alignment.center,
                                      child: const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 32),
                                    )
                                  : NetImg(_pics[i].preview, size: 100, radius: 12, fit: BoxFit.contain),
                            ),
                            if (i == 0)
                              const PositionedDirectional(
                                top: 4,
                                start: 4,
                                child: Pill('غلاف', color: Colors.white, bg: AppColors.primary, small: true),
                              ),
                            if (_pics[i].url != null)
                              const PositionedDirectional(
                                bottom: 4,
                                start: 4,
                                child: Pill('ويب', color: Colors.white, bg: Color(0x99000000), small: true),
                              ),
                            PositionedDirectional(
                              top: 4,
                              end: 4,
                              child: GestureDetector(
                                onTap: () => setState(() => _pics.removeAt(i)),
                                child: const CircleAvatar(
                                  radius: 11,
                                  backgroundColor: Colors.white,
                                  child: Icon(Icons.close_rounded, size: 15),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SectionTitle('المعلومات'),
            TextField(
              controller: _nameAr,
              decoration: const InputDecoration(labelText: 'الاسم بالعربي'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _nameEn,
              textDirection: TextDirection.ltr,
              decoration: const InputDecoration(labelText: 'الاسم بالإنجليزي'),
            ),
            const SizedBox(height: 10),
            _PickerField(
              icon: Icons.sell_outlined,
              label: 'البراند',
              value: _brand == null ? null : (_brand!.id.isEmpty ? '${_brand!.name} (جديد)' : _brand!.name),
              onTap: () async {
                final b = await pickBrand(context, suggestion: _brand?.id.isEmpty == true ? _brand!.name : null);
                if (b != null) setState(() => _brand = b);
              },
            ),
            const SizedBox(height: 10),
            _PickerField(
              icon: Icons.category_outlined,
              label: 'القسم',
              value: _cat?.label,
              onTap: () async {
                final c = await pickCategory(context);
                if (c != null) setState(() => _cat = c);
              },
            ),
            const SizedBox(height: 10),
            if (!_hasPos)
              TextField(
                controller: _price,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(labelText: 'السعر (دينار)', suffixText: 'د.ع'),
              ),
            if (!_hasPos) const SizedBox(height: 10),
            TextField(
              controller: _descAr,
              minLines: 3,
              maxLines: 8,
              decoration: const InputDecoration(labelText: 'الوصف (اختياري)', alignLabelWithHint: true),
            ),
            const SizedBox(height: 10),
            Panel(
              padding: EdgeInsets.zero,
              child: SwitchListTile(
                value: _active,
                onChanged: (v) => setState(() => _active = v),
                title: const Text('اعرضه في التطبيق فوراً', style: TextStyle(fontWeight: FontWeight.w700)),
                subtitle: Text(_pics.isEmpty ? 'بلا صور يبقى مخفياً حتى تضيف صورة' : 'يمكنك إيقافه لاحقاً بمفتاح واحد'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PickerField extends StatelessWidget {
  const _PickerField({required this.icon, required this.label, required this.value, required this.onTap});
  final IconData icon;
  final String label;
  final String? value;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(14),
    child: InputDecorator(
      decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon), suffixIcon: const Icon(Icons.expand_more_rounded)),
      isEmpty: value == null,
      child: value == null ? const SizedBox(height: 20) : Text(value!, style: const TextStyle(fontWeight: FontWeight.w700)),
    ),
  );
}

class _AddTile extends StatelessWidget {
  const _AddTile({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsetsDirectional.only(end: 8),
    child: Material(
      color: AppColors.primaryLight,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: const SizedBox(
          width: 100,
          height: 100,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.add_photo_alternate_rounded, color: AppColors.primary, size: 30),
              SizedBox(height: 4),
              Text(
                'صور',
                style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
