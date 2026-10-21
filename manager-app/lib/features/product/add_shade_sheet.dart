import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/photos.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../widgets/common.dart';
import '../catalog/pickers.dart';
import '../scan/scan_screen.dart';

const _palette = [
  '#F4C7C3',
  '#E8B7A0',
  '#D9A38A',
  '#C98F7D',
  '#A86E58',
  '#8A5A44',
  '#6B3E26',
  '#4A2C1A',
  '#FFB6C1',
  '#E57A9A',
  '#D35D6E',
  '#B23A48',
  '#8E3B46',
  '#9C2542',
  '#6D1A36',
  '#C2185B',
  '#F7D9A8',
  '#E0AC69',
  '#C68642',
  '#B5651D',
  '#000000',
  '#5D4037',
  '#7B1FA2',
  '#1565C0',
];

/// تدرج جديد لمنتج موجود — الباركود بالمسح أو الكتابة، والسعر والمخزون من الكاشير تلقائياً.
Future<ProductDetail?> showAddShadeSheet(BuildContext context, ProductDetail product, {String? barcode}) {
  return showModalBottomSheet<ProductDetail>(
    context: context,
    isScrollControlled: true,
    builder: (_) => AddShadeSheet(product: product, barcode: barcode),
  );
}

class AddShadeSheet extends ConsumerStatefulWidget {
  const AddShadeSheet({super.key, required this.product, this.barcode});
  final ProductDetail product;
  final String? barcode;
  @override
  ConsumerState<AddShadeSheet> createState() => _AddShadeSheetState();
}

class _AddShadeSheetState extends ConsumerState<AddShadeSheet> {
  final _name = TextEditingController();
  late final _barcode = TextEditingController(text: widget.barcode ?? '');
  String _hex = '#C98F7D';
  String? _mediaId;
  String? _imageUrl;
  String? _preview;
  Uint8List? _bytes;
  bool _uploading = false;
  bool _saving = false;
  PosInfo? _pos;

  @override
  void initState() {
    super.initState();
    if (widget.barcode != null) _checkPos();
  }

  Future<void> _checkPos() async {
    final code = normalizeCode(_barcode.text);
    if (code.length < 4) return;
    try {
      final r = await ref.read(repoProvider).lookup(code);
      if (!mounted) return;
      if (r.found) {
        toast(context, 'هذا الباركود موجود مسبقاً في «${r.product?.name}»', error: true);
        return;
      }
      setState(() {
        _pos = r.pos;
        if (_name.text.isEmpty && r.pos?.name != null) _name.text = r.pos!.name!;
      });
    } catch (_) {}
  }

  Future<void> _photo() async {
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
            if (widget.product.images.isNotEmpty)
              ListTile(
                leading: const Icon(Icons.collections_rounded),
                title: const Text('من صور المنتج'),
                onTap: () => Navigator.pop(c, 'product'),
              ),
            ListTile(
              leading: const Icon(Icons.travel_explore_rounded),
              title: const Text('بحث في الويب'),
              onTap: () => Navigator.pop(c, 'web'),
            ),
          ],
        ),
      ),
    );
    if (choice == null || !mounted) return;
    if (choice == 'product') {
      final img = await showModalBottomSheet<MediaImage>(
        context: context,
        builder: (c) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                for (final i in widget.product.images) GestureDetector(onTap: () => Navigator.pop(c, i), child: NetImg(i.thumb, size: 90)),
              ],
            ),
          ),
        ),
      );
      if (img != null) setState(() => (_mediaId = img.mediaId, _preview = img.thumb, _imageUrl = null, _bytes = null));
      return;
    }
    if (choice == 'web') {
      final picked = await pickWebImages(context, barcode: _barcode.text, name: imageQueryFor(widget.product, _name.text), single: true);
      if (picked != null && picked.isNotEmpty) {
        setState(() => (_imageUrl = picked.first.url, _preview = picked.first.thumb ?? picked.first.url, _mediaId = null, _bytes = null));
      }
      return;
    }
    final files = await pickPhotos(choice == 'camera' ? PhotoSource.camera : PhotoSource.gallery, multi: false);
    if (files.isEmpty) return;
    final bytes = await files.first.readAsBytes();
    setState(() => (_bytes = bytes, _uploading = true, _imageUrl = null, _preview = null));
    try {
      final id = await uploadPhoto(ref.read(repoProvider), files.first);
      if (mounted) setState(() => _mediaId = id);
    } catch (e) {
      if (mounted) {
        toastError(context, e);
        setState(() => _bytes = null);
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty) return toast(context, 'اكتب اسم التدرج', error: true);
    if (_uploading) return toast(context, 'انتظر رفع الصورة', error: true);
    setState(() => _saving = true);
    try {
      final p = await ref.read(repoProvider).addShade(widget.product.id, {
        'name': _name.text.trim(),
        'colorHex': _hex,
        if (_barcode.text.trim().isNotEmpty) 'barcode': normalizeCode(_barcode.text),
        'imageMediaId': ?_mediaId,
        'imageUrl': ?_imageUrl,
      });
      if (mounted) Navigator.pop(context, p);
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'تدرج جديد — ${widget.product.name}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                GestureDetector(
                  onTap: _photo,
                  child: Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(18)),
                    child: _bytes != null
                        ? Stack(
                            fit: StackFit.expand,
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(18),
                                child: Image.memory(_bytes!, fit: BoxFit.cover),
                              ),
                              if (_uploading) const Center(child: CircularProgressIndicator()),
                            ],
                          )
                        : _preview != null
                        ? NetImg(_preview, size: 84, radius: 18)
                        : const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_a_photo_rounded, color: AppColors.primary),
                              Text(
                                'صورة',
                                style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 12),
                              ),
                            ],
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    children: [
                      TextField(
                        controller: _name,
                        decoration: const InputDecoration(labelText: 'اسم التدرج', hintText: 'مثلاً 05 Rose Nude', isDense: true),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _barcode,
                        textDirection: TextDirection.ltr,
                        onSubmitted: (_) => _checkPos(),
                        onEditingComplete: _checkPos,
                        decoration: InputDecoration(
                          labelText: 'الباركود',
                          isDense: true,
                          suffixIcon: IconButton(
                            tooltip: 'مسح بالكاميرا',
                            onPressed: () async {
                              final code = await Navigator.of(
                                context,
                              ).push<String>(MaterialPageRoute(builder: (_) => const ScanScreen(pickOnly: true)));
                              if (code != null) {
                                _barcode.text = code;
                                _checkPos();
                              }
                            },
                            icon: const Icon(Icons.qr_code_scanner_rounded),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (_pos != null) ...[
              const SizedBox(height: 10),
              Text(
                'من الكاشير: ${money(_pos!.price)} · ${numFmt(_pos!.stock)} قطعة',
                style: const TextStyle(color: AppColors.info, fontWeight: FontWeight.w700),
              ),
            ],
            const SizedBox(height: 14),
            Row(
              children: [
                const Text('اللون', style: TextStyle(fontWeight: FontWeight.w800)),
                const SizedBox(width: 10),
                Swatch(hex: _hex, size: 30),
                const SizedBox(width: 8),
                SizedBox(
                  width: 110,
                  child: TextFormField(
                    key: ValueKey(_hex),
                    initialValue: _hex,
                    textDirection: TextDirection.ltr,
                    inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[#0-9a-fA-F]')), LengthLimitingTextInputFormatter(7)],
                    decoration: const InputDecoration(isDense: true),
                    onFieldSubmitted: (v) {
                      if (RegExp(r'^#[0-9a-fA-F]{6}$').hasMatch(v)) setState(() => _hex = v.toUpperCase());
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final h in _palette)
                  GestureDetector(
                    onTap: () => setState(() => _hex = h),
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: _hex == h ? AppColors.ink : Colors.transparent, width: 2),
                      ),
                      child: Swatch(hex: h, size: 30),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: _saving ? null : _save,
              icon: _saving
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                  : const Icon(Icons.add_rounded),
              label: const Text('إضافة التدرج'),
            ),
          ],
        ),
      ),
    );
  }
}
