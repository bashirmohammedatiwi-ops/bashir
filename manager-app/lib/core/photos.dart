import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../data/repo.dart';
import 'theme.dart';

enum PhotoSource { camera, gallery }

final _picker = ImagePicker();

/// اختيار مصدر الصورة: كاميرا أو معرض.
Future<PhotoSource?> askPhotoSource(BuildContext context, {String title = 'إضافة صورة'}) {
  return showModalBottomSheet<PhotoSource>(
    context: context,
    builder: (c) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _SourceTile(
                    icon: Icons.photo_camera_rounded,
                    label: 'الكاميرا',
                    onTap: () => Navigator.pop(c, PhotoSource.camera),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _SourceTile(
                    icon: Icons.photo_library_rounded,
                    label: 'المعرض',
                    onTap: () => Navigator.pop(c, PhotoSource.gallery),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
}

class _SourceTile extends StatelessWidget {
  const _SourceTile({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Material(
    color: AppColors.primaryLight,
    borderRadius: BorderRadius.circular(18),
    child: InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 22),
        child: Column(
          children: [
            Icon(icon, size: 34, color: AppColors.primary),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    ),
  );
}

/// صور بجودة عالية (حتى 2400px — نفس حد السيرفر) لتبقى صالحة للقص لاحقاً.
Future<List<XFile>> pickPhotos(PhotoSource source, {bool multi = true}) async {
  const maxSide = 2400.0;
  if (source == PhotoSource.camera) {
    final x = await _picker.pickImage(source: ImageSource.camera, maxWidth: maxSide, maxHeight: maxSide, imageQuality: 92);
    return x == null ? [] : [x];
  }
  if (multi) {
    return _picker.pickMultiImage(maxWidth: maxSide, maxHeight: maxSide, imageQuality: 92, limit: 12);
  }
  final x = await _picker.pickImage(source: ImageSource.gallery, maxWidth: maxSide, maxHeight: maxSide, imageQuality: 92);
  return x == null ? [] : [x];
}

Future<String> uploadPhoto(Repo repo, XFile file, {String purpose = 'PRODUCT', void Function(double)? onProgress}) async {
  if (kIsWeb) return repo.uploadBytes(await file.readAsBytes(), file.name, purpose: purpose);
  return repo.upload(file.path, purpose: purpose, onProgress: onProgress);
}

/// صورة للبحث بالصورة: أصغر (1280px) لتُرسل بسرعة — التعرف لا يحتاج دقة أعلى.
Future<List<int>?> pickLensPhoto(PhotoSource source) async {
  final x = await _picker.pickImage(
    source: source == PhotoSource.camera ? ImageSource.camera : ImageSource.gallery,
    maxWidth: 1280,
    maxHeight: 1280,
    imageQuality: 82,
  );
  return x?.readAsBytes();
}
