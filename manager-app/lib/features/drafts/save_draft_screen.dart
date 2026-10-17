import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/format.dart';
import '../../core/photos.dart';
import '../../core/prefs.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import 'group_picker.dart';

class _Shot {
  _Shot(this.file);
  final XFile file;
  Uint8List? bytes;
  String? mediaId;
  double progress = 0;
  String? error;
  bool get uploading => mediaId == null && error == null;
}

/// حفظ باركود غير موجود مع صوره في مجموعة — للعودة وإضافته لاحقاً.
/// يُستخدم أيضاً لتعديل مسودة موجودة (draft != null).
class SaveDraftScreen extends ConsumerStatefulWidget {
  const SaveDraftScreen({super.key, required this.barcode, this.posName, this.groupId, this.draft});
  final String barcode;
  final String? posName;
  final String? groupId;
  final Draft? draft;

  @override
  ConsumerState<SaveDraftScreen> createState() => _SaveDraftScreenState();
}

class _SaveDraftScreenState extends ConsumerState<SaveDraftScreen> {
  late final _barcode = TextEditingController(text: widget.draft?.barcode ?? widget.barcode);
  late final _name = TextEditingController(text: widget.draft?.name ?? widget.posName ?? '');
  late final _note = TextEditingController(text: widget.draft?.note ?? '');
  late int? _qty = widget.draft?.quantity;
  late String? _groupId = widget.draft?.groupId ?? widget.groupId ?? Prefs.instance.lastGroupId;
  late final List<MediaImage> _existing = [...?widget.draft?.images];
  final _shots = <_Shot>[];
  bool _saving = false;
  bool _touched = false;

  /// حد السيرفر لصور الباركود المحفوظ.
  static const _maxImages = 12;

  bool get _editing => widget.draft != null;
  int get _imageCount => _existing.length + _shots.length;

  @override
  void dispose() {
    _barcode.dispose();
    _name.dispose();
    _note.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    // أول مرة بلا صور: نفتح الكاميرا مباشرة لتسريع العمل على الرف
    if (!_editing && !kIsWeb) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _add(PhotoSource.camera));
    }
  }

  Future<void> _add([PhotoSource? src]) async {
    if (_imageCount >= _maxImages) return toast(context, 'الحد $_maxImages صورة — احذف صورة لإضافة أخرى', error: true);
    src ??= await askPhotoSource(context, title: 'صورة المنتج');
    if (src == null) return;
    var files = await pickPhotos(src);
    if (files.isEmpty || !mounted) return;
    final room = _maxImages - _imageCount;
    if (files.length > room) {
      files = files.take(room).toList();
      toast(context, 'أُضيفت $room فقط — الحد $_maxImages صورة', error: true);
    }
    for (final f in files) {
      final shot = _Shot(f);
      setState(() {
        _shots.add(shot);
        _touched = true;
      });
      shot.bytes = await f.readAsBytes();
      if (mounted) setState(() {});
      _upload(shot);
    }
  }

  void _upload(_Shot shot) {
    setState(() => (shot.error = null, shot.progress = 0));
    uploadPhoto(
          ref.read(repoProvider),
          shot.file,
          purpose: 'GENERAL',
          onProgress: (p) {
            if (mounted) setState(() => shot.progress = p);
          },
        )
        .then((id) {
          if (mounted) setState(() => shot.mediaId = id);
        })
        .catchError((Object e) {
          if (mounted) setState(() => shot.error = e.toString());
        });
  }

  Future<void> _save() async {
    final code = normalizeCode(_barcode.text);
    if (code.isEmpty) return toast(context, 'الباركود فارغ', error: true);
    if (_shots.any((s) => s.uploading)) return toast(context, 'انتظر اكتمال رفع الصور', error: true);
    final failed = _shots.where((s) => s.error != null).length;
    if (failed > 0 &&
        !await confirm(
          context,
          title: 'فشل رفع $failed ${failed == 1 ? 'صورة' : 'صور'}',
          message: 'اضغط على الصورة الحمراء لإعادة رفعها، أو احفظ بدونها.',
          ok: 'احفظ بدونها',
        )) {
      return;
    }
    if (!mounted) return;
    setState(() => _saving = true);
    final repo = ref.read(repoProvider);
    try {
      _groupId = await repo.ensureGroup(_groupId);
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        toastError(context, e);
      }
      return;
    }
    final ids = [..._existing.map((e) => e.mediaId), ..._shots.where((s) => s.mediaId != null).map((s) => s.mediaId!)];
    try {
      final Draft d;
      if (_editing) {
        d = await repo.updateDraft(widget.draft!.id, {
          'barcode': code,
          'name': _name.text.trim(),
          'note': _note.text.trim(),
          'quantity': _qty,
          'imageIds': ids,
          'groupId': _groupId,
        });
      } else {
        d = await repo.saveDraft(groupId: _groupId!, barcode: code, name: _name.text, note: _note.text, quantity: _qty, imageIds: ids);
      }
      Prefs.instance.lastGroupId = _groupId;
      ref.invalidate(groupsProvider);
      ref.invalidate(statsProvider);
      if (!mounted) return;
      toast(context, _editing ? 'تم الحفظ' : 'حُفظ في «${d.groupName}»');
      _touched = false;
      Navigator.pop(context, d);
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return UnsavedGuard(
      dirty: _touched && !_saving,
      child: Scaffold(
        appBar: AppBar(title: Text(_editing ? 'تعديل الباركود المحفوظ' : 'حفظ باركود غير موجود')),
        bottomNavigationBar: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: FilledButton.icon(
              onPressed: _saving ? null : _save,
              icon: _saving
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                  : const Icon(Icons.bookmark_added_rounded),
              label: const Text('حفظ'),
            ),
          ),
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
          children: [
            TextField(
              controller: _barcode,
              textDirection: TextDirection.ltr,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, letterSpacing: .6),
              decoration: const InputDecoration(labelText: 'الباركود', prefixIcon: Icon(Icons.qr_code_rounded)),
            ),
            const SectionTitle('الصور', subtitle: 'صوّر المنتج من أكثر من جهة'),
            SizedBox(
              height: 112,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _AddTile(onTap: () => _add()),
                  for (final e in _existing) _Thumb(child: NetImg(e.thumb, size: 104), onRemove: () => setState(() => _existing.remove(e))),
                  for (final s in _shots)
                    _Thumb(
                      progress: s.uploading ? s.progress : null,
                      error: s.error != null,
                      onRetry: s.error != null ? () => _upload(s) : null,
                      onRemove: () => setState(() => _shots.remove(s)),
                      child: s.bytes == null
                          ? const SizedBox(width: 104, height: 104)
                          : ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.memory(s.bytes!, width: 104, height: 104, fit: BoxFit.cover),
                            ),
                    ),
                ],
              ),
            ),
            const SectionTitle('المجموعة', subtitle: 'أين يظهر في لوحة التحكم'),
            GroupPicker(selected: _groupId, onChanged: (id) => setState(() => _groupId = id)),
            const SectionTitle('معلومات (اختياري)'),
            TextField(
              controller: _name,
              onChanged: (_) => _touched = true,
              decoration: const InputDecoration(labelText: 'اسم المنتج', prefixIcon: Icon(Icons.label_outline_rounded)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _note,
              onChanged: (_) => _touched = true,
              maxLines: 3,
              minLines: 2,
              decoration: const InputDecoration(labelText: 'ملاحظة (مكانه، المورد، السعر...)', alignLabelWithHint: true),
            ),
            const SizedBox(height: 12),
            Panel(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: Row(
                children: [
                  const Icon(Icons.inventory_2_outlined, color: AppColors.muted),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text('الكمية', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                  IconButton(
                    onPressed: () => setState(() => _qty = (_qty ?? 0) > 0 ? _qty! - 1 : null),
                    icon: const Icon(Icons.remove_circle_outline_rounded),
                  ),
                  SizedBox(
                    width: 40,
                    child: Text(
                      _qty?.toString() ?? '—',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                    ),
                  ),
                  IconButton(onPressed: () => setState(() => _qty = (_qty ?? 0) + 1), icon: const Icon(Icons.add_circle_outline_rounded)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
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
        child: Container(
          width: 104,
          height: 104,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.primary.withValues(alpha: .35), width: 1.4),
          ),
          child: const Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.add_a_photo_rounded, color: AppColors.primary, size: 30),
              SizedBox(height: 6),
              Text(
                'صورة',
                style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _Thumb extends StatelessWidget {
  const _Thumb({required this.child, required this.onRemove, this.progress, this.error = false, this.onRetry});
  final Widget child;
  final VoidCallback onRemove;
  final VoidCallback? onRetry;
  final double? progress;
  final bool error;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsetsDirectional.only(end: 8),
    child: Stack(
      children: [
        child,
        if (progress != null)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(color: const Color(0x88000000), borderRadius: BorderRadius.circular(12)),
              alignment: Alignment.center,
              child: SizedBox(
                width: 34,
                height: 34,
                child: CircularProgressIndicator(value: progress! > 0 ? progress : null, color: Colors.white, strokeWidth: 3),
              ),
            ),
          ),
        if (error)
          Positioned.fill(
            child: GestureDetector(
              onTap: onRetry,
              child: Container(
                decoration: BoxDecoration(color: const Color(0xAAD64545), borderRadius: BorderRadius.circular(12)),
                alignment: Alignment.center,
                child: const Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.refresh_rounded, color: Colors.white),
                    Text(
                      'فشل — أعد',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
            ),
          ),
        PositionedDirectional(
          top: 4,
          end: 4,
          child: GestureDetector(
            onTap: onRemove,
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              child: const Icon(Icons.close_rounded, size: 16),
            ),
          ),
        ),
      ],
    ),
  );
}
