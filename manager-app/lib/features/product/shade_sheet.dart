import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/photos.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../widgets/common.dart';
import '../image/crop_screen.dart';
import '../image/gallery_viewer.dart';

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

/// تفاصيل تدرج واحد: تشغيل/إيقاف، الاسم، اللون، الصورة (كاميرا، معرض، من صور المنتج، قص).
class ShadeSheet extends ConsumerStatefulWidget {
  const ShadeSheet({super.key, required this.product, required this.shade});
  final ProductDetail product;
  final Shade shade;
  @override
  ConsumerState<ShadeSheet> createState() => _ShadeSheetState();
}

class _ShadeSheetState extends ConsumerState<ShadeSheet> {
  late ProductDetail _p = widget.product;
  late Shade _s = widget.shade;
  bool _busy = false;
  bool _changed = false;

  Repo get _repo => ref.read(repoProvider);

  Future<void> _patch(Map<String, dynamic> patch, {String? ok}) async {
    setState(() => _busy = true);
    try {
      final p = await _repo.patchShade(_s.id, patch);
      if (!mounted) return;
      setState(() {
        _p = p;
        _s = p.shades.firstWhere((x) => x.id == _s.id, orElse: () => _s);
        _changed = true;
      });
      if (ok != null) toast(context, ok);
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _photo() async {
    final src = await askPhotoSource(context, title: 'صورة التدرج');
    if (src == null) return;
    final files = await pickPhotos(src, multi: false);
    if (files.isEmpty || !mounted) return;
    setState(() => _busy = true);
    try {
      final id = await uploadPhoto(_repo, files.first);
      await _patch({'imageMediaId': id}, ok: 'تم تحديث صورة التدرج');
    } catch (e) {
      if (mounted) toastError(context, e);
      setState(() => _busy = false);
    }
  }

  Future<void> _fromProduct() async {
    final picked = await showModalBottomSheet<MediaImage>(
      context: context,
      builder: (c) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('اختر من صور المنتج', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  for (final img in _p.images) GestureDetector(onTap: () => Navigator.pop(c, img), child: NetImg(img.thumb, size: 96)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
    if (picked != null) await _patch({'imageMediaId': picked.mediaId}, ok: 'تم تعيين الصورة');
  }

  Future<void> _crop() async {
    final img = _s.image;
    if (img == null) return;
    final r = await Navigator.of(context).push<CropResult>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => CropScreen(image: img, shadeId: _s.id, title: 'قص صورة ${_s.name}'),
      ),
    );
    if (r?.product != null && mounted) {
      setState(() {
        _p = r!.product!;
        _s = _p.shades.firstWhere((x) => x.id == _s.id, orElse: () => _s);
        _changed = true;
      });
      toast(context, 'تم قص صورة التدرج');
    }
  }

  Future<void> _color() async {
    final ctrl = TextEditingController(text: _s.colorHex ?? '#');
    final hex = await showDialog<String>(
      context: context,
      builder: (c) => StatefulBuilder(
        builder: (c, setS) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('لون التدرج', style: TextStyle(fontWeight: FontWeight.w800)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Swatch(hex: ctrl.text, size: 44),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: ctrl,
                      textDirection: TextDirection.ltr,
                      onChanged: (_) => setS(() {}),
                      inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[#0-9a-fA-F]')), LengthLimitingTextInputFormatter(7)],
                      decoration: const InputDecoration(hintText: '#C98F7D'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final h in _palette)
                    GestureDetector(
                      onTap: () => setS(() => ctrl.text = h),
                      child: Swatch(hex: h, size: 32),
                    ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c), child: const Text('إلغاء')),
            FilledButton(onPressed: () => Navigator.pop(c, ctrl.text.trim()), child: const Text('حفظ')),
          ],
        ),
      ),
    );
    if (hex == null || hex == _s.colorHex) return;
    if (!RegExp(r'^#[0-9a-fA-F]{6}$').hasMatch(hex)) {
      if (mounted) toast(context, 'اكتب اللون بصيغة #RRGGBB', error: true);
      return;
    }
    await _patch({'colorHex': hex}, ok: 'تم تحديث اللون');
  }

  @override
  Widget build(BuildContext context) {
    final s = _s;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) Navigator.pop(context, _changed ? _p : null);
      },
      child: SafeArea(
        child: BusyOverlay(
          busy: _busy,
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    GestureDetector(
                      onTap: s.image == null ? _photo : () => openGallery(context, [s.image!], 0),
                      child: s.image != null
                          ? NetImg(s.image!.thumb, size: 86, radius: 18)
                          : Swatch(hex: s.colorHex, hexEnd: s.colorHexEnd, size: 86),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.name, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
                          if (s.barcode != null)
                            GestureDetector(
                              onTap: () {
                                Clipboard.setData(ClipboardData(text: s.barcode!));
                                toast(context, 'نُسخ الباركود');
                              },
                              child: Text(
                                s.barcode!,
                                textDirection: TextDirection.ltr,
                                style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600),
                              ),
                            ),
                          const SizedBox(height: 4),
                          Text(
                            '${s.stock > 0 ? 'متوفر ${s.stock}' : 'نافد'}${s.price != null ? ' · ${money(s.price)}' : ''}',
                            style: TextStyle(fontWeight: FontWeight.w700, color: s.stock > 0 ? AppColors.success : AppColors.danger),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Material(
                  color: s.isActive ? AppColors.successSoft : AppColors.dangerSoft,
                  borderRadius: BorderRadius.circular(16),
                  child: SwitchListTile(
                    value: s.isActive,
                    onChanged: (v) => _patch({'isActive': v}, ok: v ? 'التدرج ظاهر الآن' : 'تم إيقاف التدرج'),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    title: Text(
                      s.isActive ? 'ظاهر للزبائن' : 'موقوف',
                      style: TextStyle(fontWeight: FontWeight.w800, color: s.isActive ? AppColors.success : AppColors.danger),
                    ),
                    subtitle: Text(s.isActive ? 'يمكن طلب هذا اللون' : 'مخفي عن التطبيق والموقع ولا يمكن طلبه'),
                  ),
                ),
                if (s.pos != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    'الكاشير: ${numFmt(s.pos!.stock)} قطعة · ${money(s.pos!.price)} · ${timeAgo(s.pos!.syncedAt)}',
                    style: const TextStyle(color: AppColors.info, fontWeight: FontWeight.w600),
                  ),
                ],
                const SizedBox(height: 16),
                const Text('الصورة', style: TextStyle(fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _Act(Icons.add_a_photo_rounded, s.image == null ? 'إضافة صورة' : 'صورة جديدة', _photo),
                    if (_p.images.isNotEmpty) _Act(Icons.photo_library_outlined, 'من صور المنتج', _fromProduct),
                    if (s.image != null) _Act(Icons.crop_rounded, 'قص', _crop),
                    if (s.image != null)
                      _Act(Icons.delete_outline_rounded, 'إزالة', () => _patch({'imageMediaId': ''}, ok: 'أُزيلت الصورة'), danger: true),
                  ],
                ),
                const SizedBox(height: 16),
                const Text('البيانات', style: TextStyle(fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _Act(Icons.drive_file_rename_outline_rounded, 'تعديل الاسم', () async {
                      final v = await promptText(context, title: 'اسم التدرج', initial: s.name);
                      if (v != null && v.trim().isNotEmpty && v.trim() != s.name) await _patch({'name': v.trim()}, ok: 'تم تغيير الاسم');
                    }),
                    _Act(Icons.palette_outlined, 'اللون', _color),
                    _Act(Icons.qr_code_rounded, 'الباركود', () async {
                      final v = await promptText(
                        context,
                        title: 'باركود التدرج',
                        initial: s.barcode,
                        direction: TextDirection.ltr,
                        keyboard: TextInputType.text,
                      );
                      if (v != null && v.trim() != (s.barcode ?? '')) await _patch({'barcode': v.trim()}, ok: 'تم حفظ الباركود');
                    }),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Act extends StatelessWidget {
  const _Act(this.icon, this.label, this.onTap, {this.danger = false});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;
  @override
  Widget build(BuildContext context) => ActionChip(
    avatar: Icon(icon, size: 18, color: danger ? AppColors.danger : AppColors.primary),
    label: Text(label, style: TextStyle(color: danger ? AppColors.danger : AppColors.ink)),
    onPressed: onTap,
    backgroundColor: Colors.white,
  );
}
