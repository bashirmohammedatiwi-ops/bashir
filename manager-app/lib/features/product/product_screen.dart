import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config.dart';
import '../../core/format.dart';
import '../../core/photos.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../image/crop_screen.dart';
import '../image/gallery_viewer.dart';
import '../catalog/pickers.dart';
import 'add_shade_sheet.dart';
import 'product_edit_screen.dart';
import 'shade_sheet.dart';

class ProductScreen extends ConsumerStatefulWidget {
  const ProductScreen({super.key, required this.productId, this.initial, this.highlightShadeId});
  final String productId;
  final ProductDetail? initial;
  final String? highlightShadeId;

  @override
  ConsumerState<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends ConsumerState<ProductScreen> {
  ProductDetail? _p;
  Object? _error;
  bool _busy = false;
  String? _busyLabel;
  final _shadeQuery = TextEditingController();
  String _shadeFilter = 'all';
  final _highlightKey = GlobalKey();
  int _page = 0;

  @override
  void initState() {
    super.initState();
    _p = widget.initial;
    if (_p == null) _load();
    if (widget.highlightShadeId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        await Future<void>.delayed(const Duration(milliseconds: 350));
        final ctx = _highlightKey.currentContext;
        if (ctx != null && ctx.mounted) Scrollable.ensureVisible(ctx, duration: const Duration(milliseconds: 450), alignment: .3);
      });
    }
  }

  Future<void> _load() async {
    try {
      final p = await ref.read(repoProvider).product(widget.productId);
      if (mounted) setState(() => (_p = p, _error = null));
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  /// تنفيذ عملية على السيرفر ثم تحديث الشاشة بالنسخة الراجعة.
  Future<ProductDetail?> _run(Future<ProductDetail> Function() op, {String? label, String? success}) async {
    setState(() {
      _busy = true;
      _busyLabel = label;
    });
    try {
      final p = await op();
      if (!mounted) return p;
      setState(() => _p = p);
      ref.read(dataVersionProvider.notifier).state++;
      if (success != null) toast(context, success);
      return p;
    } catch (e) {
      if (mounted) toastError(context, e);
      return null;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Repo get _repo => ref.read(repoProvider);

  // ------------------------------------------------------------------ actions

  Future<void> _toggleProduct(bool v) async {
    if (!v &&
        !await confirm(
          context,
          title: 'إيقاف المنتج؟',
          message: 'سيختفي من التطبيق والموقع فوراً، ويبقى هنا لتشغيله متى شئت.',
          ok: 'إيقاف',
          danger: true,
        )) {
      return;
    }
    await _run(() => _repo.patchProduct(_p!.id, {'isActive': v}), success: v ? 'المنتج ظاهر الآن في التطبيق' : 'تم إيقاف المنتج');
  }

  Future<void> _toggleShade(Shade s, bool v) async {
    setState(() => s.isActive = v); // استجابة فورية
    final r = await _run(() => _repo.patchShade(s.id, {'isActive': v}));
    if (r == null && mounted) setState(() => s.isActive = !v);
  }

  Future<void> _bulkShades(String action) async {
    final p = _p!;
    switch (action) {
      case 'on':
        await _run(() => _repo.bulkShades(p.id, true), success: 'تم تشغيل كل التدرجات');
      case 'off':
        if (!await confirm(
          context,
          title: 'إيقاف كل التدرجات؟',
          message: 'لن يظهر أي لون للزبونة حتى تشغّله.',
          ok: 'إيقاف الكل',
          danger: true,
        )) {
          return;
        }
        await _run(() => _repo.bulkShades(p.id, false), success: 'تم إيقاف كل التدرجات');
      case 'offEmpty':
        final ids = p.shades.where((s) => s.stock <= 0 && s.isActive).map((s) => s.id).toList();
        if (ids.isEmpty) return toast(context, 'لا توجد تدرجات نافدة شغّالة');
        await _run(() => _repo.bulkShades(p.id, false, ids: ids), success: 'أُوقف ${ids.length} تدرج نافد');
      case 'onStock':
        final ids = p.shades.where((s) => s.stock > 0 && !s.isActive).map((s) => s.id).toList();
        if (ids.isEmpty) return toast(context, 'لا توجد تدرجات متوفرة موقوفة');
        await _run(() => _repo.bulkShades(p.id, true, ids: ids), success: 'شُغّل ${ids.length} تدرج متوفر');
    }
  }

  Future<void> _addImages({bool asCover = false}) async {
    final choice = await showModalBottomSheet<String>(
      context: context,
      builder: (c) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(asCover ? 'صورة غلاف جديدة' : 'إضافة صور للمنتج', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              ListTile(
                leading: const Icon(Icons.photo_camera_rounded, color: AppColors.primary),
                title: const Text('الكاميرا'),
                onTap: () => Navigator.pop(c, 'camera'),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_rounded, color: AppColors.primary),
                title: const Text('المعرض (عدة صور)'),
                onTap: () => Navigator.pop(c, 'gallery'),
              ),
              ListTile(
                leading: const Icon(Icons.travel_explore_rounded, color: AppColors.primary),
                title: const Text('بحث في الويب والمتاجر'),
                subtitle: const Text('بالباركود أو بالاسم'),
                onTap: () => Navigator.pop(c, 'web'),
              ),
            ],
          ),
        ),
      ),
    );
    if (choice == null || !mounted) return;
    if (choice == 'web') return _addWebImages(asCover: asCover);
    final src = choice == 'camera' ? PhotoSource.camera : PhotoSource.gallery;
    final files = await pickPhotos(src);
    if (files.isEmpty || !mounted) return;
    setState(() {
      _busy = true;
      _busyLabel = 'رفع ${files.length} صورة...';
    });
    try {
      final ids = <String>[];
      for (var i = 0; i < files.length; i++) {
        if (mounted) setState(() => _busyLabel = 'رفع الصورة ${i + 1} من ${files.length}...');
        ids.add(await uploadPhoto(_repo, files[i]));
      }
      final p = await _repo.addImages(_p!.id, ids, asCover: asCover);
      if (!mounted) return;
      setState(() => _p = p);
      ref.read(dataVersionProvider.notifier).state++;
      toast(context, 'أُضيفت ${ids.length} صورة');
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _addWebImages({bool asCover = false}) async {
    final p = _p!;
    final code = p.barcode ?? (p.shades.isNotEmpty ? p.shades.first.barcode : null) ?? p.sku;
    final picked = await pickWebImages(context, barcode: code, name: p.nameEn ?? p.name);
    if (picked == null || picked.isEmpty || !mounted) return;
    setState(() {
      _busy = true;
      _busyLabel = 'تنزيل ${picked.length} صورة إلى السيرفر...';
    });
    try {
      final ids = <String>[];
      var failed = 0;
      for (var i = 0; i < picked.length; i++) {
        if (mounted) setState(() => _busyLabel = 'تنزيل الصورة ${i + 1} من ${picked.length}...');
        try {
          ids.add(await _repo.uploadFromUrl(picked[i].url));
        } catch (_) {
          failed += 1;
        }
      }
      if (ids.isEmpty) throw Exception('تعذّر تنزيل الصور المختارة — جرّب صوراً أخرى');
      final next = await _repo.addImages(p.id, ids, asCover: asCover);
      if (!mounted) return;
      setState(() => _p = next);
      ref.read(dataVersionProvider.notifier).state++;
      toast(context, failed > 0 ? 'أُضيفت ${ids.length} — تعذّر $failed' : 'أُضيفت ${ids.length} صورة');
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _addShade() async {
    final next = await showAddShadeSheet(context, _p!);
    if (next != null && mounted) {
      setState(() => _p = next);
      ref.read(dataVersionProvider.notifier).state++;
      toast(context, 'أُضيف التدرج');
    }
  }

  Future<void> _reorder(int from, int to) async {
    final ids = _p!.images.map((e) => e.mediaId).toList();
    if (to > from) to -= 1;
    final id = ids.removeAt(from);
    ids.insert(to, id);
    await _run(() => _repo.setImages(_p!.id, ids), success: to == 0 ? 'أصبحت صورة الغلاف' : null);
  }

  Future<void> _crop(MediaImage img) async {
    final r = await Navigator.of(context).push<CropResult>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => CropScreen(image: img, productId: _p!.id),
      ),
    );
    if (r == null || !mounted) return;
    if (r.product != null) setState(() => _p = r.product);
    ref.read(dataVersionProvider.notifier).state++;
    _offerUndo(r.newMediaId, r.previousMediaId, 'تم تعديل الصورة');
  }

  void _offerUndo(String now, String before, String msg) {
    toast(
      context,
      msg,
      action: SnackBarAction(
        label: 'تراجع',
        textColor: const Color(0xFFC9B2F2),
        onPressed: () => _run(() => _repo.replaceImage(_p!.id, now, before), success: 'تم التراجع'),
      ),
    );
  }

  Future<void> _quickEdit(MediaImage img, String mode) async {
    setState(() {
      _busy = true;
      _busyLabel = mode == 'trim' ? 'إزالة الحواف...' : 'تأطير في مربع أبيض...';
    });
    try {
      final r = await _repo.editImage(img.mediaId, {'mode': mode, if (mode != 'trim') 'padding': 0.06, 'productId': _p!.id});
      if (!mounted) return;
      if (r.unchanged) {
        toast(context, 'الصورة لا تحتاج تعديلاً');
      } else {
        setState(() => _p = r.product ?? _p);
        ref.read(dataVersionProvider.notifier).state++;
        _offerUndo(r.mediaId, r.previous, 'تم');
      }
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _replace(MediaImage img) async {
    final src = await askPhotoSource(context, title: 'استبدال الصورة');
    if (src == null) return;
    final files = await pickPhotos(src, multi: false);
    if (files.isEmpty || !mounted) return;
    setState(() {
      _busy = true;
      _busyLabel = 'رفع الصورة الجديدة...';
    });
    try {
      final id = await uploadPhoto(_repo, files.first);
      final p = await _repo.replaceImage(_p!.id, img.mediaId, id);
      if (!mounted) return;
      setState(() => _p = p);
      ref.read(dataVersionProvider.notifier).state++;
      _offerUndo(id, img.mediaId, 'تم استبدال الصورة');
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _deleteImage(MediaImage img) async {
    if (!await confirm(context, title: 'حذف الصورة؟', message: 'تُزال من المنتج فقط (يمكن إعادتها بالتراجع).', ok: 'حذف', danger: true)) {
      return;
    }
    final before = _p!.images.map((e) => e.mediaId).toList();
    final r = await _run(() => _repo.removeImage(_p!.id, img.mediaId));
    if (r != null && mounted) {
      toast(
        context,
        'حُذفت الصورة',
        action: SnackBarAction(
          label: 'تراجع',
          textColor: const Color(0xFFC9B2F2),
          onPressed: () => _run(() => _repo.setImages(_p!.id, before), success: 'أُعيدت الصورة'),
        ),
      );
    }
  }

  Future<void> _frameAll() async {
    final p = _p!;
    final choice = await showModalBottomSheet<(String, bool)>(
      context: context,
      builder: (c) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('تأطير كل الصور دفعة واحدة', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              const Text('من الصورة الأصلية بدقتها الكاملة — ويمكن التراجع لكل صورة.', style: TextStyle(color: AppColors.muted)),
              const SizedBox(height: 14),
              _OptionTile(
                icon: Icons.crop_square_rounded,
                title: 'إطار مربع موحّد',
                subtitle: 'يزيل الفراغ ثم يضع المنتج في وسط مربع أبيض بهامش متساوٍ',
                onTap: () => Navigator.pop(c, ('trimSquare', false)),
              ),
              _OptionTile(
                icon: Icons.crop_free_rounded,
                title: 'قص الحواف الفارغة فقط',
                subtitle: 'يقرّب المنتج دون تغيير النسبة',
                onTap: () => Navigator.pop(c, ('trim', false)),
              ),
              if (p.shades.any((s) => s.image != null))
                _OptionTile(
                  icon: Icons.palette_outlined,
                  title: 'مربع موحّد + صور التدرجات',
                  subtitle: 'يشمل صور كل الألوان',
                  onTap: () => Navigator.pop(c, ('trimSquare', true)),
                ),
            ],
          ),
        ),
      ),
    );
    if (choice == null || !mounted) return;
    setState(() {
      _busy = true;
      _busyLabel = 'تأطير الصور...';
    });
    try {
      final r = await _repo.frameAll(p.id, mode: choice.$1, padding: choice.$1 == 'trimSquare' ? 0.06 : null, includeShades: choice.$2);
      if (!mounted) return;
      setState(() => _p = r.product);
      ref.read(dataVersionProvider.notifier).state++;
      final parts = ['عُدّلت ${r.changed}', if (r.unchanged > 0) '${r.unchanged} جاهزة مسبقاً', if (r.failed > 0) 'فشل ${r.failed}'];
      toast(
        context,
        parts.join(' · '),
        error: r.failed > 0,
        action: r.swaps.isEmpty
            ? null
            : SnackBarAction(
                label: 'تراجع',
                textColor: const Color(0xFFC9B2F2),
                onPressed: () async {
                  for (final s in r.swaps.reversed) {
                    await _run(() => _repo.replaceImage(p.id, '${s['to']}', '${s['from']}'));
                  }
                },
              ),
      );
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _imageMenu(MediaImage img, int index) {
    showModalBottomSheet(
      context: context,
      builder: (c) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  NetImg(img.thumb, size: 56),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          index == 0 ? 'صورة الغلاف' : 'الصورة ${index + 1}',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                        ),
                        Text(
                          img.sizeLabel,
                          style: const TextStyle(color: AppColors.muted),
                          textDirection: TextDirection.ltr,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              _MenuItem(Icons.zoom_in_rounded, 'عرض بالحجم الكامل', () {
                Navigator.pop(c);
                openGallery(context, _p!.images, index);
              }),
              _MenuItem(Icons.crop_rounded, 'قص وتدوير', () {
                Navigator.pop(c);
                _crop(img);
              }),
              _MenuItem(Icons.crop_free_rounded, 'قص الحواف الفارغة تلقائياً', () {
                Navigator.pop(c);
                _quickEdit(img, 'trim');
              }),
              _MenuItem(Icons.crop_square_rounded, 'إطار مربع أبيض', () {
                Navigator.pop(c);
                _quickEdit(img, 'trimSquare');
              }),
              if (index != 0)
                _MenuItem(Icons.star_rounded, 'تعيين كصورة غلاف', () {
                  Navigator.pop(c);
                  _reorder(index, 0);
                }),
              _MenuItem(Icons.swap_horiz_rounded, 'استبدال بصورة جديدة', () {
                Navigator.pop(c);
                _replace(img);
              }),
              _MenuItem(Icons.delete_outline_rounded, 'حذف من المنتج', () {
                Navigator.pop(c);
                _deleteImage(img);
              }, danger: true),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openShade(Shade s) async {
    final r = await showModalBottomSheet<ProductDetail>(
      context: context,
      isScrollControlled: true,
      builder: (_) => ShadeSheet(product: _p!, shade: s),
    );
    if (r != null && mounted) {
      setState(() => _p = r);
      ref.read(dataVersionProvider.notifier).state++;
    }
  }

  Future<void> _edit() async {
    final r = await Navigator.of(context).push<ProductDetail>(MaterialPageRoute(builder: (_) => ProductEditScreen(product: _p!)));
    if (r != null && mounted) {
      setState(() => _p = r);
      ref.read(dataVersionProvider.notifier).state++;
    }
  }

  void _copy(String label, String? v) {
    if (v == null || v.isEmpty) return;
    Clipboard.setData(ClipboardData(text: v));
    toast(context, 'نُسخ $label');
  }

  // ------------------------------------------------------------------ build

  @override
  Widget build(BuildContext context) {
    final p = _p;
    if (p == null) {
      return Scaffold(
        appBar: AppBar(),
        body: _error != null ? ErrorView(_error!, onRetry: _load) : const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      body: BusyOverlay(
        busy: _busy,
        label: _busyLabel,
        child: RefreshIndicator(
          onRefresh: _load,
          child: CustomScrollView(
            slivers: [
              _gallery(p),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 40),
                sliver: SliverList.list(
                  children: [
                    _header(p),
                    _imagesSection(p),
                    if (p.shades.isNotEmpty)
                      _shadesSection(p)
                    else
                      Padding(
                        padding: const EdgeInsets.only(top: 14),
                        child: OutlinedButton.icon(
                          onPressed: _addShade,
                          icon: const Icon(Icons.palette_outlined),
                          label: const Text('إضافة تدرجات (ألوان) لهذا المنتج'),
                        ),
                      ),
                    _infoSection(p),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _gallery(ProductDetail p) {
    return SliverAppBar(
      pinned: true,
      expandedHeight: MediaQuery.sizeOf(context).width.clamp(0, 520) * .86,
      backgroundColor: Colors.white,
      actions: [
        IconButton(
          tooltip: 'فتح في المتجر',
          onPressed: p.slug == null
              ? null
              : () => launchUrl(
                  Uri.parse('${AppConfig.storeBase}/product/?slug=${Uri.encodeComponent(p.slug!)}'),
                  mode: LaunchMode.externalApplication,
                ),
          icon: const Icon(Icons.open_in_new_rounded),
        ),
        IconButton(tooltip: 'تحديث', onPressed: _load, icon: const Icon(Icons.refresh_rounded)),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: p.images.isEmpty
            ? Container(
                color: AppColors.primaryLight,
                child: Center(
                  child: TextButton.icon(
                    onPressed: () => _addImages(asCover: true),
                    icon: const Icon(Icons.add_a_photo_rounded, size: 30),
                    label: const Text('لا توجد صور — أضف صورة', style: TextStyle(fontSize: 16)),
                  ),
                ),
              )
            : Stack(
                fit: StackFit.expand,
                children: [
                  PageView.builder(
                    itemCount: p.images.length,
                    onPageChanged: (i) => setState(() => _page = i),
                    itemBuilder: (_, i) => GestureDetector(
                      onTap: () => openGallery(context, p.images, i),
                      child: Container(
                        color: Colors.white,
                        child: NetImg(p.images[i].best, radius: 0, fit: BoxFit.contain),
                      ),
                    ),
                  ),
                  if (!p.isActive)
                    Positioned(
                      top: MediaQuery.paddingOf(context).top + 60,
                      left: 16,
                      child: const Pill(
                        'موقوف — لا يظهر للزبائن',
                        color: Colors.white,
                        bg: AppColors.danger,
                        icon: Icons.visibility_off_rounded,
                      ),
                    ),
                  if (p.images.length > 1)
                    Positioned(
                      bottom: 12,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          for (var i = 0; i < p.images.length; i++)
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              width: i == _page ? 18 : 7,
                              height: 7,
                              decoration: BoxDecoration(
                                color: i == _page ? AppColors.primary : const Color(0x33000000),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                        ],
                      ),
                    ),
                ],
              ),
      ),
    );
  }

  Widget _header(ProductDetail p) {
    final discount = p.discountPercent > 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (p.brand != null)
          Text(
            p.brand!.name.toUpperCase(),
            style: const TextStyle(color: AppColors.rose, fontWeight: FontWeight.w800, letterSpacing: .6, fontSize: 13),
          ),
        Text(p.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, height: 1.4)),
        if ((p.nameEn ?? '').isNotEmpty && p.nameEn != p.name)
          Text(
            p.nameEn!,
            textDirection: TextDirection.ltr,
            textAlign: TextAlign.right,
            style: const TextStyle(color: AppColors.muted, fontSize: 13.5),
          ),
        const SizedBox(height: 14),
        // مفتاح الظهور
        Material(
          color: p.isActive ? AppColors.successSoft : AppColors.dangerSoft,
          borderRadius: BorderRadius.circular(18),
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: () => _toggleProduct(!p.isActive),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 10, 10),
              child: Row(
                children: [
                  Icon(
                    p.isActive ? Icons.storefront_rounded : Icons.visibility_off_rounded,
                    color: p.isActive ? AppColors.success : AppColors.danger,
                    size: 28,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          p.isActive ? 'ظاهر في التطبيق' : 'موقوف',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: p.isActive ? AppColors.success : AppColors.danger,
                          ),
                        ),
                        Text(
                          p.isActive ? 'اضغط للإيقاف والإخفاء عن الزبائن' : 'اضغط للتشغيل وإظهاره للزبائن',
                          style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                        ),
                      ],
                    ),
                  ),
                  Switch(value: p.isActive, onChanged: _toggleProduct),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _Stat(
                label: 'السعر',
                value: money(p.price),
                sub: discount ? 'بدل ${money(p.originalPrice)} · خصم ${p.discountPercent}%' : null,
                color: discount ? AppColors.rose : null,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _Stat(
                label: 'المخزون',
                value: numFmt(p.stock),
                sub: p.stock <= 0 ? 'نافد' : (p.soldCount > 0 ? 'بيع ${numFmt(p.soldCount)}' : null),
                color: p.stock <= 0 ? AppColors.danger : null,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Panel(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          child: Column(
            children: [
              _KV(
                'الباركود',
                p.barcode ?? (p.shades.isNotEmpty ? 'لكل تدرج باركود' : '—'),
                ltr: p.barcode != null,
                onTap: p.barcode == null ? null : () => _copy('الباركود', p.barcode),
              ),
              const Divider(),
              _KV('SKU', p.sku ?? '—', ltr: true, onTap: () => _copy('SKU', p.sku)),
              const Divider(),
              _KV('القسم', [p.category?.name, p.subcategory?.name].whereType<String>().join(' › ').ifEmpty('—')),
              if (p.pos != null) ...[
                const Divider(),
                _KV(
                  'الكاشير',
                  '${numFmt(p.pos!.stock)} قطعة · ${money(p.pos!.price)}',
                  sub: p.pos!.syncedAt == null ? null : 'آخر مزامنة ${timeAgo(p.pos!.syncedAt)}',
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _imagesSection(ProductDetail p) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionTitle(
          'الصور (${p.images.length})',
          subtitle: p.images.length > 1 ? 'اسحب مطولاً لتغيير الترتيب — الأولى غلاف' : null,
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (p.images.isNotEmpty)
                IconButton.filledTonal(tooltip: 'تأطير كل الصور', onPressed: _frameAll, icon: const Icon(Icons.auto_fix_high_rounded)),
              const SizedBox(width: 6),
              FilledButton.icon(
                onPressed: () => _addImages(),
                style: FilledButton.styleFrom(minimumSize: const Size(0, 42), padding: const EdgeInsets.symmetric(horizontal: 14)),
                icon: const Icon(Icons.add_photo_alternate_rounded, size: 20),
                label: const Text('إضافة'),
              ),
            ],
          ),
        ),
        if (p.images.isEmpty)
          Panel(
            onTap: () => _addImages(asCover: true),
            child: const Row(
              children: [
                Icon(Icons.image_not_supported_outlined, color: AppColors.warning),
                SizedBox(width: 12),
                Expanded(
                  child: Text('المنتج بلا صور — يظهر بصورة افتراضية. اضغط لإضافة صورة.', style: TextStyle(fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          )
        else
          SizedBox(
            height: 128,
            child: ReorderableListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: p.images.length,
              onReorder: _reorder,
              proxyDecorator: (child, _, _) =>
                  Material(color: Colors.transparent, elevation: 6, borderRadius: BorderRadius.circular(16), child: child),
              itemBuilder: (_, i) {
                final img = p.images[i];
                return Padding(
                  key: ValueKey(img.mediaId),
                  padding: const EdgeInsetsDirectional.only(end: 10),
                  child: GestureDetector(
                    onTap: () => _imageMenu(img, i),
                    child: Stack(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: i == 0 ? AppColors.primary : AppColors.line, width: i == 0 ? 2 : 1),
                            color: Colors.white,
                          ),
                          padding: const EdgeInsets.all(3),
                          child: NetImg(img.thumb, size: 116, radius: 13, fit: BoxFit.contain),
                        ),
                        if (i == 0)
                          const PositionedDirectional(
                            top: 6,
                            start: 6,
                            child: Pill('غلاف', color: Colors.white, bg: AppColors.primary, small: true, icon: Icons.star_rounded),
                          ),
                        PositionedDirectional(
                          bottom: 6,
                          end: 6,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(color: Colors.white.withValues(alpha: .92), shape: BoxShape.circle),
                            child: const Icon(Icons.more_horiz_rounded, size: 18),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _shadesSection(ProductDetail p) {
    final q = _shadeQuery.text.trim().toLowerCase();
    final list = p.shades.where((s) {
      if (_shadeFilter == 'on' && !s.isActive) return false;
      if (_shadeFilter == 'off' && s.isActive) return false;
      if (_shadeFilter == 'empty' && s.stock > 0) return false;
      if (q.isEmpty) return true;
      return s.name.toLowerCase().contains(q) || (s.barcode ?? '').contains(q);
    }).toList();
    final off = p.shadesOff;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionTitle(
          'التدرجات (${p.shades.length})',
          subtitle: off > 0 ? '$off موقوف · ${p.shades.length - off} ظاهر' : 'كلها ظاهرة للزبائن',
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton.filledTonal(tooltip: 'إضافة تدرج', onPressed: _addShade, icon: const Icon(Icons.add_rounded)),
              PopupMenuButton<String>(
                onSelected: _bulkShades,
                icon: const Icon(Icons.tune_rounded),
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'on', child: Text('تشغيل كل التدرجات')),
                  PopupMenuItem(value: 'off', child: Text('إيقاف كل التدرجات')),
                  PopupMenuItem(value: 'offEmpty', child: Text('إيقاف النافدة (مخزون 0)')),
                  PopupMenuItem(value: 'onStock', child: Text('تشغيل المتوفرة الموقوفة')),
                ],
              ),
            ],
          ),
        ),
        if (p.shades.length > 6) ...[
          TextField(
            controller: _shadeQuery,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: 'ابحث في التدرجات بالاسم أو الباركود',
              prefixIcon: const Icon(Icons.search_rounded),
              isDense: true,
              suffixIcon: _shadeQuery.text.isEmpty
                  ? null
                  : IconButton(onPressed: () => setState(_shadeQuery.clear), icon: const Icon(Icons.close_rounded)),
            ),
          ),
          const SizedBox(height: 8),
        ],
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (final f in const [('all', 'الكل'), ('on', 'ظاهر'), ('off', 'موقوف'), ('empty', 'نافد')])
                Padding(
                  padding: const EdgeInsetsDirectional.only(end: 8),
                  child: ChoiceChip(
                    label: Text(f.$2),
                    selected: _shadeFilter == f.$1,
                    onSelected: (_) => setState(() => _shadeFilter = f.$1),
                    showCheckmark: false,
                    selectedColor: AppColors.primarySoft,
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Panel(
          padding: EdgeInsets.zero,
          child: list.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(20),
                  child: Text(
                    'لا توجد تدرجات بهذا الفلتر',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.muted),
                  ),
                )
              : Column(
                  children: [
                    for (var i = 0; i < list.length; i++) ...[
                      if (i > 0) const Divider(indent: 70),
                      _ShadeTile(
                        key: list[i].id == widget.highlightShadeId ? _highlightKey : null,
                        shade: list[i],
                        highlighted: list[i].id == widget.highlightShadeId,
                        onToggle: (v) => _toggleShade(list[i], v),
                        onTap: () => _openShade(list[i]),
                      ),
                    ],
                  ],
                ),
        ),
      ],
    );
  }

  Widget _infoSection(ProductDetail p) {
    Widget flag(String label, bool on, String key) => FilterChip(
      label: Text(label),
      selected: on,
      showCheckmark: true,
      selectedColor: AppColors.primarySoft,
      onSelected: (v) => _run(() => _repo.patchProduct(p.id, {key: v}), success: v ? 'أُضيف «$label»' : 'أُزيل «$label»'),
    );
    final desc = (p.descriptionAr ?? '').trim();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionTitle(
          'المعلومات',
          trailing: TextButton.icon(onPressed: _edit, icon: const Icon(Icons.edit_rounded, size: 18), label: const Text('تعديل')),
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            flag('جديد', p.isNew, 'isNew'),
            flag('الأكثر مبيعاً', p.isBestSeller, 'isBestSeller'),
            flag('مميّز', p.isFeatured, 'isFeatured'),
          ],
        ),
        const SizedBox(height: 10),
        Panel(
          onTap: _edit,
          child: Text(
            desc.isEmpty ? 'لا يوجد وصف — اضغط للإضافة' : desc,
            maxLines: 6,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(height: 1.7, color: desc.isEmpty ? AppColors.muted : AppColors.ink),
          ),
        ),
        const SizedBox(height: 14),
        Text(
          'أُضيف ${timeAgo(p.createdAt)} · آخر تعديل ${timeAgo(p.updatedAt)}',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
        ),
      ],
    );
  }
}

extension on String {
  String ifEmpty(String other) => isEmpty ? other : this;
}

class _ShadeTile extends StatelessWidget {
  const _ShadeTile({super.key, required this.shade, required this.onToggle, required this.onTap, this.highlighted = false});
  final Shade shade;
  final ValueChanged<bool> onToggle;
  final VoidCallback onTap;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    final s = shade;
    return Material(
      color: highlighted ? AppColors.warningSoft : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 8, 10),
          child: Row(
            children: [
              Swatch(hex: s.colorHex, hexEnd: s.colorHexEnd, size: 46, off: !s.isActive, imageUrl: s.image?.thumb),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            s.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: s.isActive ? AppColors.ink : AppColors.muted,
                              decoration: s.isActive ? null : TextDecoration.lineThrough,
                            ),
                          ),
                        ),
                        if (highlighted) ...[
                          const SizedBox(width: 6),
                          const Pill('الممسوح', color: AppColors.warning, bg: Colors.white, small: true),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        if (s.barcode != null)
                          Flexible(
                            child: Text(
                              s.barcode!,
                              textDirection: TextDirection.ltr,
                              style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                            ),
                          ),
                        const SizedBox(width: 8),
                        Text(
                          s.stock > 0 ? 'متوفر ${s.stock}' : 'نافد',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: s.stock > 0 ? AppColors.success : AppColors.danger,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Switch(value: s.isActive, onChanged: onToggle),
            ],
          ),
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, this.sub, this.color});
  final String label;
  final String value;
  final String? sub;
  final Color? color;
  @override
  Widget build(BuildContext context) => Panel(
    padding: const EdgeInsets.all(14),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
        Text(
          value,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color ?? AppColors.ink),
        ),
        if (sub != null) Text(sub!, style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
      ],
    ),
  );
}

class _KV extends StatelessWidget {
  const _KV(this.k, this.v, {this.ltr = false, this.onTap, this.sub});
  final String k;
  final String v;
  final bool ltr;
  final VoidCallback? onTap;
  final String? sub;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          SizedBox(
            width: 74,
            child: Text(k, style: const TextStyle(color: AppColors.muted)),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  v,
                  textDirection: ltr ? TextDirection.ltr : null,
                  textAlign: TextAlign.start,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                if (sub != null) Text(sub!, style: const TextStyle(color: AppColors.muted, fontSize: 11.5)),
              ],
            ),
          ),
          if (onTap != null) const Icon(Icons.copy_rounded, size: 16, color: AppColors.muted),
        ],
      ),
    ),
  );
}

class _MenuItem extends StatelessWidget {
  const _MenuItem(this.icon, this.label, this.onTap, {this.danger = false});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;
  @override
  Widget build(BuildContext context) => ListTile(
    leading: Icon(icon, color: danger ? AppColors.danger : AppColors.primary),
    title: Text(
      label,
      style: TextStyle(fontWeight: FontWeight.w700, color: danger ? AppColors.danger : AppColors.ink),
    ),
    onTap: onTap,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  );
}

class _OptionTile extends StatelessWidget {
  const _OptionTile({required this.icon, required this.title, required this.subtitle, required this.onTap});
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Panel(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary, size: 30),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
                Text(subtitle, style: const TextStyle(color: AppColors.muted, fontSize: 12.5)),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
