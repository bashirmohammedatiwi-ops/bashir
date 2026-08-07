import 'dart:typed_data';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/ai_draft_store.dart';
import '../../core/utils/api_error.dart';
import '../../core/utils/daily_progress_store.dart';
import '../../core/utils/helpers.dart';
import '../../core/utils/readd_assets_cache.dart';
import '../../models/ai_autofill.dart';
import '../../models/brand.dart';
import '../../models/catalog.dart';
import '../../models/inventory.dart';
import '../../repositories/ai_product_repository.dart';
import '../../repositories/product_repository.dart';
import '../../widgets/google_style_image_search.dart';
import '../../widgets/search_picker_sheet.dart';
import '../../widgets/section_card.dart';
import '../../widgets/shade_tile.dart';
import '../media/product_image_editor_screen.dart';

/// Multi-step AI add wizard: naming → images → shades → category/price → review & save.
class GptAutofillScreen extends ConsumerStatefulWidget {
  const GptAutofillScreen({
    super.key,
    required this.barcode,
    this.hint,
    this.manualMode = false,
    this.modelId,
  });

  final String barcode;
  final String? hint;
  final bool manualMode;
  final String? modelId;

  @override
  ConsumerState<GptAutofillScreen> createState() => _GptAutofillScreenState();
}

class _AiShadeDraft {
  _AiShadeDraft({String name = '', String colorHex = '#CCCCCC', this.imageUrl})
      : nameController = TextEditingController(text: name),
        hexController = TextEditingController(text: colorHex);

  final TextEditingController nameController;
  final TextEditingController hexController;
  String? imageUrl;

  void dispose() {
    nameController.dispose();
    hexController.dispose();
  }
}

class _GptAutofillScreenState extends ConsumerState<GptAutofillScreen> {
  final _page = PageController();
  final _nameAr = TextEditingController();
  final _nameEn = TextEditingController();
  final _descAr = TextEditingController();
  final _descEn = TextEditingController();
  final _brandAr = TextEditingController();
  final _brandEn = TextEditingController();
  final _price = TextEditingController();
  final _stock = TextEditingController(text: '0');

  int _step = 0;
  bool _loading = true;
  bool _saving = false;
  bool _refreshingImages = false;
  bool _posFilled = false;
  bool _multiShadeEnabled = false;
  String? _error;
  AiAutofillResult? _result;
  List<AiAutofillImage> _images = [];
  final Set<String> _selectedImages = {};
  final List<String> _imageOrder = [];
  /// Keeps metadata for selected URLs so they survive barcode ↔ name search swaps.
  final Map<String, AiAutofillImage> _imageByUrl = {};
  final Map<String, Uint8List> _editedBytesByUrl = {};
  final List<_AiShadeDraft> _shades = [];
  /// Media from a deleted product kept for reuse (url → mediaId).
  final Map<String, String> _preservedMediaByUrl = {};
  List<AiAutofillImage> _preservedImages = [];

  List<BrandEntity> _brands = [];
  List<NamedEntity> _categories = [];
  List<NamedEntity> _subcategories = [];
  List<NamedEntity> _tertiary = [];
  String? _brandId;
  String? _categoryId;
  final List<String> _subcategoryIds = [];
  final List<String> _tertiaryIds = [];

  static const _stepTitles = ['التسمية', 'الصور', 'التدرجات', 'التصنيف', 'المعاينة'];

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _page.dispose();
    _nameAr.dispose();
    _nameEn.dispose();
    _descAr.dispose();
    _descEn.dispose();
    _brandAr.dispose();
    _brandEn.dispose();
    _price.dispose();
    _stock.dispose();
    for (final s in _shades) {
      s.dispose();
    }
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final kept = ReaddAssetsCache.take(widget.barcode);
      if (kept != null && kept.isNotEmpty) {
        _preservedImages = List.of(kept.images);
        _preservedMediaByUrl
          ..clear()
          ..addAll(kept.urlToMediaId);
      }

      final products = ref.read(productRepositoryProvider);
      final ai = ref.read(aiProductRepositoryProvider);
      final brandsFuture = products.brands();
      final catsFuture = products.categories();
      final invFuture = products.lookupBarcodes([widget.barcode]);

      AiAutofillResult fill;
      if (widget.manualMode) {
        final images = await ai.searchImages(
          widget.barcode,
          nameHint: widget.hint,
        );
        fill = AiAutofillResult(
          barcode: widget.barcode,
          brandAr: '',
          brandEn: '',
          nameAr: '',
          nameEn: '',
          descriptionAr: '',
          descriptionEn: '',
          category: const AiAutofillCategory(),
          confidence: 0,
          needsReview: true,
          images: images,
          aiSkipped: true,
        );
      } else {
        fill = await ai.autofill(
          barcode: widget.barcode,
          hint: widget.hint,
          model: widget.modelId,
        );
      }

      final brands = await brandsFuture;
      final cats = await catsFuture;
      final invMap = await invFuture;

      if (fill.exists) {
        if (!mounted) return;
        setState(() {
          _result = fill;
          _loading = false;
        });
        return;
      }

      _brands = brands;
      _categories = cats;
      _applyPosFromLookup(invMap);
      _applyResult(fill);
      _mergePreservedImages();

      if (fill.category.categoryId != null) {
        await _loadSubs(fill.category.categoryId!, clearChildren: false);
        _subcategoryIds
          ..clear()
          ..addAll(
            fill.category.subcategoryIds.isNotEmpty
                ? fill.category.subcategoryIds
                : [
                    if (fill.category.subcategoryId != null && fill.category.subcategoryId!.isNotEmpty)
                      fill.category.subcategoryId!,
                  ],
          );
        if (_subcategoryIds.isNotEmpty) {
          await _reloadTertiaries(pruneSelection: false);
          final suggestedTert = fill.category.tertiaryCategoryIds.isNotEmpty
              ? fill.category.tertiaryCategoryIds
              : [
                  if (fill.category.tertiaryCategoryId != null &&
                      fill.category.tertiaryCategoryId!.isNotEmpty)
                    fill.category.tertiaryCategoryId!,
                ];
          _tertiaryIds
            ..clear()
            ..addAll(suggestedTert.where((id) => _tertiary.any((t) => t.id == id)));
        }
      }

      final brandNeedleAr = fill.brandAr.trim();
      final brandNeedleEn = fill.brandEn.trim();
      _brandId = _bestBrandMatch(brands, brandNeedleAr, brandNeedleEn)?.id;
      final matchedBrand = _selectedBrand;
      if (matchedBrand != null) {
        // Keep GPT brand labels if richer; fill empty side from catalog name.
        if (_brandAr.text.trim().isEmpty) _brandAr.text = matchedBrand.displayName;
        if (_brandEn.text.trim().isEmpty) {
          _brandEn.text = matchedBrand.nameEn ?? matchedBrand.name ?? matchedBrand.displayName;
        }
      }
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyPosFromLookup(Map<String, BarcodeInventoryLookup> invMap) {
    BarcodeInventoryLookup? hit = lookupBarcode(invMap, widget.barcode);
    if (hit == null || !hit.hasPos) {
      for (final v in invMap.values) {
        if (v.hasPos) {
          hit = v;
          break;
        }
      }
    }
    if (hit != null && hit.hasPos) {
      _price.text = toIntPrice(hit.pos!.price).toString();
      _stock.text = toIntPrice(hit.pos!.stock).toString();
      _posFilled = true;
    }
  }

  void _applyResult(AiAutofillResult fill) {
    _result = fill;
    _nameAr.text = fill.nameAr;
    _nameEn.text = fill.nameEn;
    _descAr.text = fill.descriptionAr;
    _descEn.text = fill.descriptionEn;
    _brandAr.text = fill.brandAr;
    _brandEn.text = fill.brandEn;
    _categoryId = fill.category.categoryId;
    _subcategoryIds
      ..clear()
      ..addAll(
        fill.category.subcategoryIds.isNotEmpty
            ? fill.category.subcategoryIds
            : [
                if (fill.category.subcategoryId != null && fill.category.subcategoryId!.isNotEmpty)
                  fill.category.subcategoryId!,
              ],
      );
    _tertiaryIds
      ..clear()
      ..addAll(
        fill.category.tertiaryCategoryIds.isNotEmpty
            ? fill.category.tertiaryCategoryIds
            : [
                if (fill.category.tertiaryCategoryId != null &&
                    fill.category.tertiaryCategoryId!.isNotEmpty)
                  fill.category.tertiaryCategoryId!,
              ],
      );
    _images = List.of(fill.images);
    for (final img in _images) {
      _imageByUrl[img.url] = img;
    }
    // User picks images manually — never auto-select defaults
    _selectedImages.clear();
    _imageOrder.clear();
  }

  void _mergePreservedImages() {
    if (_preservedImages.isEmpty) return;
    final seen = _images.map((e) => e.url).toSet();
    final prepend = _preservedImages.where((i) => !seen.contains(i.url)).toList();
    if (prepend.isEmpty) return;
    _images = [...prepend, ..._images];
  }

  void _toggleImage(String url) {
    setState(() {
      if (_selectedImages.contains(url)) {
        _selectedImages.remove(url);
        _imageOrder.remove(url);
        _editedBytesByUrl.remove(url);
        for (final s in _shades) {
          if (s.imageUrl == url) s.imageUrl = null;
        }
      } else {
        AiAutofillImage? hit;
        for (final i in _images) {
          if (i.url == url) {
            hit = i;
            break;
          }
        }
        hit ??= _imageByUrl[url];
        if (hit != null) _imageByUrl[url] = hit;
        _selectedImages.add(url);
        _imageOrder.add(url);
      }
    });
  }

  /// First in [_imageOrder] is the product primary image.
  void _setPrimaryImage(String url) {
    if (!_selectedImages.contains(url)) return;
    setState(() {
      _imageOrder.remove(url);
      _imageOrder.insert(0, url);
    });
    _snack('تم تعيين الصورة كرئيسية', short: true);
  }

  List<String> _orderedSelectedUrls() {
    final ordered = <String>[
      ..._imageOrder.where(_selectedImages.contains),
      ..._selectedImages.where((u) => !_imageOrder.contains(u)),
    ];
    return ordered;
  }

  Future<String> _uploadSelectedUrl(ProductRepository repo, String url) async {
    final edited = _editedBytesByUrl[url];
    if (edited != null) {
      final id = await repo.uploadImageBytes(edited);
      if (id == null || id.isEmpty) {
        throw Exception('فشل رفع صورة معدّلة');
      }
      return id;
    }
    final preservedId = _preservedMediaByUrl[url];
    if (preservedId != null && preservedId.isNotEmpty) {
      return preservedId;
    }
    return repo.uploadImageFromUrlRequired(url);
  }

  Future<void> _editImage(String url) async {
    final existing = _editedBytesByUrl[url];
    final result = await openProductImageEditor(
      context,
      imageUrl: existing == null ? url : null,
      imageBytes: existing,
      title: 'تعديل صورة المنتج',
    );
    if (result == null || !mounted) return;
    setState(() {
      _editedBytesByUrl[url] = result.bytes;
      if (!_selectedImages.contains(url)) {
        _selectedImages.add(url);
        _imageOrder.add(url);
      }
    });
    _snack('تم تعديل الصورة — ستُرفع النسخة الجديدة عند الحفظ', short: true);
  }

  void _showImagePreview(String url) {
    final edited = _editedBytesByUrl[url];
    showDialog<void>(
      context: context,
      builder: (ctx) => Dialog(
        insetPadding: const EdgeInsets.all(16),
        backgroundColor: Colors.black,
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            InteractiveViewer(
              child: edited != null
                  ? Image.memory(edited, fit: BoxFit.contain)
                  : CachedNetworkImage(
                      imageUrl: url,
                      fit: BoxFit.contain,
                      errorWidget: (_, __, ___) => const Center(
                        child: Icon(Icons.broken_image, color: Colors.white54, size: 48),
                      ),
                    ),
            ),
            IconButton(
              icon: const Icon(Icons.close, color: Colors.white),
              onPressed: () => Navigator.pop(ctx),
            ),
            if (_selectedImages.contains(url))
              Positioned(
                bottom: 16,
                left: 16,
                right: 16,
                child: FilledButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _editImage(url);
                  },
                  icon: const Icon(Icons.crop_rotate),
                  label: const Text('قص / إطار أبيض'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  BrandEntity? _bestBrandMatch(List<BrandEntity> brands, String ar, String en) {
    String norm(String s) => s
        .toLowerCase()
        .replaceAll(RegExp(r'[^\w\s\u0600-\u06FF]'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();

    final needles = [ar, en].map(norm).where((s) => s.isNotEmpty).toList();
    if (needles.isEmpty) return null;

    // Prefer exact / near-exact — avoid "بيو" matching inside "بيوتي"
    BrandEntity? best;
    var bestScore = 0;
    for (final b in brands) {
      final candidates = [b.name, b.nameAr, b.nameEn, b.displayName]
          .whereType<String>()
          .map(norm)
          .where((s) => s.isNotEmpty)
          .toSet();
      var score = 0;
      for (final needle in needles) {
        for (final c in candidates) {
          if (c == needle) {
            score = score < 100 ? 100 : score;
          } else if (c.startsWith(needle) || needle.startsWith(c)) {
            // Only if the shorter side is long enough (avoids Beyu/بيو false positives)
            final shorter = c.length < needle.length ? c : needle;
            if (shorter.length >= 6) score = score < 85 ? 85 : score;
          } else {
            final nTokens = needle.split(' ').where((t) => t.length > 1).toSet();
            final cTokens = c.split(' ').where((t) => t.length > 1).toSet();
            if (nTokens.isEmpty || cTokens.isEmpty) continue;
            final overlap = nTokens.where(cTokens.contains).length;
            // Require majority of tokens, and overlapping tokens must be meaningful
            if (overlap >= 2 || (nTokens.length == 1 && overlap == 1 && nTokens.first.length >= 5)) {
              final ratio = overlap / (nTokens.length > cTokens.length ? nTokens.length : cTokens.length);
              if (ratio >= 0.66) score = score < 75 ? 75 : score;
            }
          }
        }
      }
      // Special: Huda Beauty aliases
      final joined = candidates.join(' ');
      if (needles.any((n) => n.contains('huda') || n.contains('هدى') || n.contains('هودا'))) {
        if (joined.contains('huda') || joined.contains('هدى') || joined.contains('هودا')) {
          score = score < 95 ? 95 : score;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = b;
      }
    }
    return bestScore >= 75 ? best : null;
  }

  Future<void> _refreshImages({ImageSearchMode mode = ImageSearchMode.barcode, String? query}) async {
    setState(() => _refreshingImages = true);
    try {
      final nameFallback = [
        _brandEn.text.trim().isNotEmpty ? _brandEn.text.trim() : _brandAr.text.trim(),
        _nameEn.text.trim(),
        _nameAr.text.trim(),
      ].where((s) => s.isNotEmpty).join(' ');

      final q = (query ?? '').trim().isNotEmpty
          ? query!.trim()
          : (mode == ImageSearchMode.name ? nameFallback : widget.barcode);

      final imgs = await ref.read(aiProductRepositoryProvider).searchImages(
            widget.barcode,
            mode: mode == ImageSearchMode.name ? 'name' : 'barcode',
            query: q,
            // Always pass known name so barcode search can enrich thin results
            nameHint: nameFallback.isNotEmpty ? nameFallback : widget.hint,
          );
      setState(() {
        for (final img in imgs) {
          _imageByUrl[img.url] = img;
        }
        for (final img in _preservedImages) {
          _imageByUrl.putIfAbsent(img.url, () => img);
        }

        // Keep every selected image visible (even if not in this search result)
        final selectedKept = <AiAutofillImage>[];
        final seen = <String>{};
        for (final url in _imageOrder.where(_selectedImages.contains)) {
          final img = _imageByUrl[url];
          if (img == null || seen.contains(url)) continue;
          seen.add(url);
          selectedKept.add(img);
        }

        final searchNew = <AiAutofillImage>[];
        for (final img in imgs) {
          if (seen.contains(img.url)) continue;
          seen.add(img.url);
          searchNew.add(img);
        }
        for (final img in _preservedImages) {
          if (seen.contains(img.url)) continue;
          seen.add(img.url);
          searchNew.add(img);
        }

        _images = [...selectedKept, ...searchNew];
        // Never drop selections when switching barcode ↔ name search
      });
      final keptCount = _selectedImages.length;
      _snack(
        imgs.isEmpty && keptCount == 0 && _preservedImages.isEmpty
            ? 'لا نتائج — جرّب البحث بالاسم'
            : 'نتائج: ${imgs.length}'
                '${keptCount > 0 ? ' · مختارة محفوظة: $keptCount' : ''}'
                '${_preservedImages.isNotEmpty ? ' · سابقة: ${_preservedImages.length}' : ''}'
                ' — يمكنك الجمع بين بحث الباركود والاسم',
      );
    } catch (e) {
      _snack(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _refreshingImages = false);
    }
  }

  String get _defaultNameQuery {
    final en = _nameEn.text.trim();
    final ar = _nameAr.text.trim();
    final brand = _brandEn.text.trim().isNotEmpty ? _brandEn.text.trim() : _brandAr.text.trim();
    if (en.isNotEmpty) return en;
    if (ar.isNotEmpty) return ar;
    if (brand.isNotEmpty) return brand;
    return widget.hint?.trim() ?? '';
  }

  void _addShade() {
    setState(() => _shades.add(_AiShadeDraft()));
  }

  void _removeShade(int index) {
    setState(() {
      _shades[index].dispose();
      _shades.removeAt(index);
    });
  }

  void _setMultiShadeEnabled(bool value) {
    setState(() {
      _multiShadeEnabled = value;
      if (!value) {
        for (final s in _shades) {
          s.dispose();
        }
        _shades.clear();
      } else if (_shades.isEmpty) {
        _shades.add(_AiShadeDraft());
      }
    });
  }

  Future<void> _pickShadeImage(_AiShadeDraft shade) async {
    final urls = _imageOrder.where(_selectedImages.contains).toList();
    if (urls.isEmpty) {
      _snack('اختر صور المنتج أولاً من خطوة الصور');
      return;
    }
    final picked = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('اختر صورة للدرجة'),
        content: SizedBox(
          width: double.maxFinite,
          child: GridView.builder(
            shrinkWrap: true,
            itemCount: urls.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
            ),
            itemBuilder: (_, i) {
              final url = urls[i];
              return InkWell(
                onTap: () => Navigator.pop(ctx, url),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(imageUrl: url, fit: BoxFit.cover),
                ),
              );
            },
          ),
        ),
        actions: [
          if (shade.imageUrl != null)
            TextButton(
              onPressed: () => Navigator.pop(ctx, ''),
              child: const Text('إزالة الصورة'),
            ),
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
        ],
      ),
    );
    if (picked == null) return;
    setState(() => shade.imageUrl = picked.isEmpty ? null : picked);
  }

  Color _colorFromHex(String raw) {
    final hex = raw.replaceAll('#', '').trim();
    if (hex.length >= 6) {
      try {
        return Color(int.parse('FF${hex.substring(0, 6)}', radix: 16));
      } catch (_) {}
    }
    return Colors.grey.shade300;
  }

  List<String> _qualityWarnings() {
    final warnings = <String>[];
    final nameAr = _nameAr.text.trim();
    final nameEn = _nameEn.text.trim();
    if (!nameAr.contains(' - ') && !nameEn.contains(' - ')) {
      warnings.add('الاسم يفضّل أن يحتوي على " - " بين البراند واسم المنتج');
    }
    if (_selectedImages.isEmpty) {
      warnings.add('اختر صورة واحدة على الأقل');
    }
    if (_categoryId == null || _categoryId!.isEmpty) {
      warnings.add('القسم الرئيسي مطلوب');
    }
    if (_multiShadeEnabled && _shades.isEmpty) {
      warnings.add('فعّلت التدرجات لكن لم تُضف أي درجة');
    }
    return warnings;
  }

  Future<void> _loadSubs(String categoryId, {bool clearChildren = true}) async {
    _categoryId = categoryId;
    _subcategories = await ref.read(productRepositoryProvider).subcategories(parentId: categoryId);
    if (clearChildren) {
      _subcategoryIds.clear();
      _tertiaryIds.clear();
      _tertiary = [];
    }
    if (mounted) setState(() {});
  }

  Future<void> _reloadTertiaries({bool pruneSelection = true}) async {
    if (_subcategoryIds.isEmpty) {
      _tertiary = [];
      if (pruneSelection) _tertiaryIds.clear();
      if (mounted) setState(() {});
      return;
    }
    final repo = ref.read(productRepositoryProvider);
    final merged = <NamedEntity>[];
    final seen = <String>{};
    for (final subId in _subcategoryIds) {
      final list = await repo.tertiarySections(parentId: subId);
      for (final t in list) {
        if (seen.add(t.id)) merged.add(t);
      }
    }
    _tertiary = merged;
    if (pruneSelection) {
      _tertiaryIds.removeWhere((id) => !seen.contains(id));
    }
    if (mounted) setState(() {});
  }

  Future<void> _setSubcategories(List<NamedEntity> picked) async {
    _subcategoryIds
      ..clear()
      ..addAll(picked.map((e) => e.id));
    await _reloadTertiaries();
  }

  NamedEntity? _find(List<NamedEntity> list, String? id) {
    if (id == null) return null;
    for (final e in list) {
      if (e.id == id) return e;
    }
    return null;
  }

  List<NamedEntity> _findMany(List<NamedEntity> list, List<String> ids) {
    final set = ids.toSet();
    return list.where((e) => set.contains(e.id)).toList();
  }

  String _labelsOf(List<NamedEntity> list, List<String> ids, {String empty = 'اختياري'}) {
    if (ids.isEmpty) return empty;
    final labels = _findMany(list, ids).map((e) => e.displayName).where((s) => s.isNotEmpty).toList();
    if (labels.isEmpty) return empty;
    return labels.join(' · ');
  }

  BrandEntity? get _selectedBrand {
    if (_brandId == null) return null;
    for (final b in _brands) {
      if (b.id == _brandId) return b;
    }
    return null;
  }

  bool _validateStep(int step) {
    if (step == 0) {
      if (_nameAr.text.trim().isEmpty && _nameEn.text.trim().isEmpty) {
        _snack('أدخل الاسم عربي أو إنجليزي على الأقل');
        return false;
      }
    }
    if (step == 1 && _selectedImages.isEmpty) {
      _snack('اختر صورة واحدة على الأقل');
      return false;
    }
    if (step == 3 && (_categoryId == null || _categoryId!.isEmpty)) {
      _snack('اختر القسم الرئيسي');
      return false;
    }
    return true;
  }

  /// Skip shades step when product has no color variants.
  int _forwardStep(int from) {
    if (from == 1 && !_multiShadeEnabled) return 3;
    return from + 1;
  }

  int _backStep(int from) {
    if (from == 3 && !_multiShadeEnabled) return 1;
    return from - 1;
  }

  void _goTo(int step) {
    setState(() => _step = step);
    _page.animateToPage(step, duration: const Duration(milliseconds: 260), curve: Curves.easeOutCubic);
  }

  Future<void> _next() async {
    if (!_validateStep(_step)) return;
    if (_step < 4) {
      _goTo(_forwardStep(_step));
      return;
    }
    // Review step is the confirmation — save directly
    await _save();
  }

  void _goBack() {
    if (_step <= 0 || _saving) return;
    _goTo(_backStep(_step));
  }

  Future<void> _save() async {
    if (_categoryId == null || _categoryId!.isEmpty) {
      _snack('اختر القسم الرئيسي');
      return;
    }
    if (_selectedImages.isEmpty) {
      _snack('اختر صورة واحدة على الأقل');
      return;
    }
    setState(() => _saving = true);
    try {
      final repo = ref.read(productRepositoryProvider);
      var brandId = _brandId;
      if (brandId == null || brandId.isEmpty) {
        brandId = await repo.resolveBrand(
          brandAr: _brandAr.text.trim(),
          brandEn: _brandEn.text.trim(),
          createIfMissing: true,
        );
      }
      if (brandId == null || brandId.isEmpty) {
        throw Exception('تعذّر تحديد البراند');
      }

      final sanitized = await repo.sanitizeCategoryHierarchyMulti(
        categoryId: _categoryId!,
        subcategoryIds: _subcategoryIds,
        tertiaryCategoryIds: _tertiaryIds,
      );

      final orderedUrls = _orderedSelectedUrls();

      final shadeImageUrls = <String>[];
      if (_multiShadeEnabled) {
        for (final s in _shades) {
          if (s.imageUrl != null && s.imageUrl!.isNotEmpty && !orderedUrls.contains(s.imageUrl)) {
            shadeImageUrls.add(s.imageUrl!);
          }
        }
      }
      final allUploadUrls = [...orderedUrls, ...shadeImageUrls];

      final urlToId = <String, String>{};
      final failedUrls = <String>[];
      for (var i = 0; i < allUploadUrls.length; i++) {
        final url = allUploadUrls[i];
        _snack('رفع الصور ${i + 1} / ${allUploadUrls.length}', short: true);
        try {
          urlToId[url] = await _uploadSelectedUrl(repo, url);
        } catch (_) {
          failedUrls.add(url);
        }
      }

      // One more pass for transient failures
      if (failedUrls.isNotEmpty) {
        final retry = List<String>.from(failedUrls);
        failedUrls.clear();
        for (var i = 0; i < retry.length; i++) {
          final url = retry[i];
          _snack('إعادة رفع ${i + 1} / ${retry.length}', short: true);
          try {
            urlToId[url] = await _uploadSelectedUrl(repo, url);
          } catch (_) {
            failedUrls.add(url);
          }
        }
      }

      if (failedUrls.isNotEmpty) {
        throw Exception(
          'تعذّر رفع ${failedUrls.length} من ${orderedUrls.length} صور مختارة. '
          'جرّب صوراً أخرى أو أعد المحاولة.',
        );
      }

      final imageIds = <String>[];
      for (final url in orderedUrls) {
        final id = urlToId[url];
        if (id != null && !imageIds.contains(id)) imageIds.add(id);
      }
      if (imageIds.isEmpty) throw Exception('تعذّر رفع الصور المختارة');
      if (imageIds.length < orderedUrls.length) {
        // Same file uploaded from different URLs → one media id; still OK if primary kept
        _snack(
          'ملاحظة: ${orderedUrls.length - imageIds.length} صورة مكررة المحتوى — حُفظت ${imageIds.length}',
          short: true,
        );
      }

      final nameAr = _nameAr.text.trim();
      final nameEn = _nameEn.text.trim();
      final price = toIntPrice(int.tryParse(_price.text.trim()));
      final stock = toIntPrice(int.tryParse(_stock.text.trim()));
      final barcode = normalizeBarcode(widget.barcode);

      final shadePayloads = <Map<String, dynamic>>[];
      if (_multiShadeEnabled) {
        for (var idx = 0; idx < _shades.length; idx++) {
          final s = _shades[idx];
          final name = s.nameController.text.trim();
          String? imageId;
          if (s.imageUrl != null && s.imageUrl!.isNotEmpty) {
            imageId = urlToId[s.imageUrl];
          }
          shadePayloads.add({
            'name': name.isEmpty ? 'درجة ${idx + 1}' : name,
            'colorHex': normalizeColorHex(s.hexController.text),
            'position': idx,
            if (imageId != null) 'imageId': imageId,
          });
        }
      }

      await repo.createProduct({
        'sku': 'AI-$barcode',
        if (barcode.isNotEmpty) 'barcode': barcode,
        'name': nameAr.isNotEmpty ? nameAr : nameEn,
        if (nameAr.isNotEmpty) 'nameAr': nameAr,
        if (nameEn.isNotEmpty) 'nameEn': nameEn,
        'slug': slugify(nameAr.isNotEmpty ? nameAr : nameEn, 'ai'),
        'brandId': brandId,
        'categoryId': _categoryId,
        if (sanitized.subcategoryIds.isNotEmpty) 'subcategoryId': sanitized.subcategoryIds.first,
        if (sanitized.tertiaryCategoryIds.isNotEmpty) 'tertiaryCategoryId': sanitized.tertiaryCategoryIds.first,
        if (sanitized.subcategoryIds.isNotEmpty) 'subcategoryIds': sanitized.subcategoryIds,
        if (sanitized.tertiaryCategoryIds.isNotEmpty) 'tertiaryCategoryIds': sanitized.tertiaryCategoryIds,
        'description': _descAr.text.trim().isNotEmpty ? _descAr.text.trim() : _descEn.text.trim(),
        if (_descAr.text.trim().isNotEmpty) 'descriptionAr': _descAr.text.trim(),
        if (_descEn.text.trim().isNotEmpty) 'descriptionEn': _descEn.text.trim(),
        'price': price,
        'originalPrice': price,
        'discountPercent': 0,
        'stock': stock,
        'isActive': true,
        'imageIds': imageIds,
        'shades': shadePayloads,
      });

      await AiDraftStore.push(
        barcode: barcode,
        nameAr: nameAr.isNotEmpty ? nameAr : null,
        nameEn: nameEn.isNotEmpty ? nameEn : null,
      );

      await ref.read(dailyProgressProvider.notifier).recordAdd(
            barcode: barcode,
            name: nameAr.isNotEmpty ? nameAr : nameEn,
            source: 'ai',
          );

      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('تم الحفظ'),
          content: Text(
            'أُضيف المنتج بنجاح.\nمنتجات اليوم: ${ref.read(dailyProgressProvider).todayCount}',
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('حسناً')),
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.push('/daily-progress');
              },
              child: const Text('التقدم'),
            ),
          ],
        ),
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      _snack(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _snack(String msg, {bool short = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), duration: Duration(milliseconds: short ? 900 : 2800)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          children: [
            Text(
              widget.manualMode ? 'إضافة يدوية بالباركود' : 'معاينة الإضافة الذكية',
              style: const TextStyle(fontSize: 16),
            ),
            Text(
              widget.barcode,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
              textDirection: TextDirection.ltr,
            ),
          ],
        ),
        actions: [
          if (!_loading && _error == null && _result?.exists != true && !widget.manualMode)
            IconButton(
              tooltip: 'إعادة التعبئة (يستهلك AI)',
              onPressed: _saving ? null : _bootstrap,
              icon: const Icon(Icons.refresh),
            ),
        ],
      ),
      body: _loading
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(widget.manualMode ? 'جاري جلب الصور…' : 'جاري التعرف على المنتج…'),
                  if (!widget.manualMode) ...[
                    const SizedBox(height: 6),
                    Text(
                      'قد يستغرق بضع ثوانٍ',
                      style: TextStyle(fontSize: 12.5, color: Colors.grey.shade600),
                    ),
                  ],
                ],
              ),
            )
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.error_outline, size: 48, color: Colors.red.shade300),
                        const SizedBox(height: 12),
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        FilledButton(onPressed: _bootstrap, child: const Text('إعادة المحاولة')),
                      ],
                    ),
                  ),
                )
              : _result?.exists == true
                  ? _buildExistsBody()
                  : Column(
                      children: [
                        _StepHeader(step: _step, titles: _stepTitles),
                        Expanded(
                          child: PageView(
                            controller: _page,
                            physics: const NeverScrollableScrollPhysics(),
                            onPageChanged: (i) => setState(() => _step = i),
                            children: [
                              _buildNamingStep(),
                              _buildImagesStep(),
                              _buildShadesStep(),
                              _buildCategoryStep(),
                              _buildReviewStep(),
                            ],
                          ),
                        ),
                      ],
                    ),
      bottomNavigationBar: _loading || _error != null || _result?.exists == true
          ? null
          : SafeArea(
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Color(0xFFECE7F0))),
                ),
                child: Row(
                  children: [
                    if (_step > 0)
                      OutlinedButton(
                        onPressed: _saving ? null : _goBack,
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(88, 48),
                        ),
                        child: const Text('رجوع'),
                      ),
                    if (_step > 0) const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: _saving ? null : _next,
                        icon: _saving
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : Icon(_step == 4 ? Icons.check_rounded : Icons.arrow_back_rounded),
                        label: Text(
                          _saving
                              ? 'جاري الحفظ…'
                              : _step == 4
                                  ? 'حفظ في المتجر'
                                  : 'التالي: ${_stepTitles[_forwardStep(_step)]}',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Future<void> _deleteExistingAndReadd() async {
    final id = _result?.existingProduct?.id;
    if (id == null || id.isEmpty) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('حذف وإعادة إضافة؟'),
        content: const Text(
          'سيُحذف المنتج الحالي، ثم تُعاد الإضافة الذكية.\n\n'
          'الصور القديمة ستظهر في خطوة الصور لتعيد استخدامها.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('حذف ومتابعة')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final products = ref.read(productRepositoryProvider);
      final raw = await products.getProduct(id);
      final assets = ReaddAssets.fromProductJson(raw);
      ReaddAssetsCache.save(widget.barcode, assets);
      await products.deleteProduct(id);
      if (!mounted) return;
      await _bootstrap();
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString().replaceFirst('Exception: ', '');
        });
        _snack(_error ?? 'فشل الحذف');
      }
    }
  }

  Widget _buildExistsBody() {
    final p = _result!.existingProduct;
    final id = p?.id ?? '';
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.inventory_2, size: 56, color: Colors.orange.shade700),
            const SizedBox(height: 12),
            const Text('المنتج موجود مسبقاً', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(p?.displayName ?? '', textAlign: TextAlign.center, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 12),
            Text(
              'احذف المنتج وأضفه من جديد بالـ AI. الصور القديمة تبقى متاحة للاختيار.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13.5, height: 1.35, color: Colors.grey.shade700),
            ),
            const SizedBox(height: 20),
            if (id.isNotEmpty) ...[
              FilledButton.icon(
                onPressed: _deleteExistingAndReadd,
                icon: const Icon(Icons.refresh),
                label: const Text('حذف وإعادة إضافة بالـ AI'),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () {
                  final uri = Uri(
                    path: '/product-review',
                    queryParameters: {
                      'id': id,
                      'barcode': widget.barcode,
                      if (widget.modelId != null) 'model': widget.modelId!,
                    },
                  );
                  context.pushReplacement(uri.toString());
                },
                icon: const Icon(Icons.info_outline),
                label: const Text('عرض التفاصيل فقط'),
              ),
              const SizedBox(height: 8),
            ],
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('رجوع')),
          ],
        ),
      ),
    );
  }

  Widget _buildNamingStep() {
    final result = _result!;
    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
      children: [
        if (result.needsReview || result.confidence < 70)
          Card(
            color: const Color(0xFFFFF8E8),
            child: ListTile(
              leading: Icon(Icons.info_outline, color: Colors.amber.shade800),
              title: Text(
                widget.manualMode
                    ? 'أدخل الاسم بنفسك'
                    : 'راجع التسمية — ثقة ${result.confidence.toStringAsFixed(0)}%',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
              subtitle: const Text('يمكنك التعديل بحرية قبل المتابعة'),
            ),
          ),
        SectionCard(
          title: 'الاسم',
          subtitle: 'براند - اسم المنتج',
          icon: Icons.badge_outlined,
          child: Column(
            children: [
              TextField(
                controller: _nameAr,
                decoration: const InputDecoration(labelText: 'عربي'),
                maxLines: 2,
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _nameEn,
                decoration: const InputDecoration(labelText: 'English'),
                maxLines: 2,
                textDirection: TextDirection.ltr,
              ),
            ],
          ),
        ),
        SectionCard(
          title: 'البراند',
          icon: Icons.storefront_outlined,
          child: Row(
            children: [
              Expanded(child: TextField(controller: _brandAr, decoration: const InputDecoration(labelText: 'عربي'))),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _brandEn,
                  decoration: const InputDecoration(labelText: 'English'),
                  textDirection: TextDirection.ltr,
                ),
              ),
            ],
          ),
        ),
        Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ExpansionTile(
              initiallyExpanded: false,
              tilePadding: const EdgeInsets.symmetric(horizontal: 16),
              childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              leading: Icon(Icons.notes_outlined, color: AppTheme.primary),
              title: const Text('الوصف', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15.5)),
              subtitle: const Text('اضغط للتعديل إن لزم', style: TextStyle(fontSize: 12.5, color: AppTheme.muted)),
              children: [
                TextField(controller: _descAr, decoration: const InputDecoration(labelText: 'وصف عربي'), maxLines: 5),
                const SizedBox(height: 10),
                TextField(
                  controller: _descEn,
                  decoration: const InputDecoration(labelText: 'English description'),
                  maxLines: 5,
                  textDirection: TextDirection.ltr,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildImagesStep() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
      children: [
        if (_preservedImages.isNotEmpty)
          Card(
            color: AppTheme.primary.withValues(alpha: 0.06),
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: Icon(Icons.photo_library_outlined, color: AppTheme.primary),
              title: Text(
                'صور سابقة (${_preservedImages.length})',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              subtitle: const Text(
                'ظاهرة في أعلى القائمة — اختر ما تحتاجه؛ لن تُرفع من جديد إن اخترتها.',
              ),
            ),
          ),
        GoogleStyleImageSearch(
          barcode: widget.barcode,
          images: _images,
          selectedUrls: _selectedImages,
          imageOrder: _imageOrder,
          loading: _refreshingImages,
          initialNameQuery: _defaultNameQuery,
          editedBytesByUrl: _editedBytesByUrl,
          onSearch: (mode, query) => _refreshImages(mode: mode, query: query),
          onToggle: _toggleImage,
          onPreview: _showImagePreview,
          onEdit: _editImage,
          onSetPrimary: _setPrimaryImage,
          onSelectAll: () => setState(() {
            final urls = _images.map((e) => e.url).toList();
            for (final img in _images) {
              _imageByUrl[img.url] = img;
            }
            _selectedImages
              ..clear()
              ..addAll(urls);
            _imageOrder
              ..clear()
              ..addAll(urls);
          }),
          onClear: () => setState(() {
            _selectedImages.clear();
            _imageOrder.clear();
            _editedBytesByUrl.clear();
            for (final s in _shades) {
              s.imageUrl = null;
            }
          }),
        ),
      ],
    );
  }

  Widget _buildShadesStep() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SectionCard(
          title: 'التدرجات',
          subtitle: 'اختياري — اتركه مغلقاً إن لم يكن للمنتج درجات لون',
          icon: Icons.palette_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('متعدد التدرجات'),
                subtitle: const Text('مثل فاونديشن أو أحمر شفاه بدرجات'),
                value: _multiShadeEnabled,
                onChanged: _setMultiShadeEnabled,
              ),
              if (_multiShadeEnabled) ...[
                const SizedBox(height: 8),
                for (var i = 0; i < _shades.length; i++) _buildShadeRow(i),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: _addShade,
                  icon: const Icon(Icons.add),
                  label: const Text('إضافة درجة'),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildShadeRow(int index) {
    final shade = _shades[index];
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Text('درجة ${index + 1}', style: const TextStyle(fontWeight: FontWeight.w700)),
                const Spacer(),
                IconButton(
                  tooltip: 'حذف',
                  onPressed: _shades.length > 1 ? () => _removeShade(index) : null,
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                ),
              ],
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  margin: const EdgeInsets.only(top: 12, left: 8),
                  decoration: BoxDecoration(
                    color: _colorFromHex(shade.hexController.text),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.grey.shade400),
                  ),
                ),
                Expanded(
                  child: Column(
                    children: [
                      TextField(
                        controller: shade.nameController,
                        decoration: const InputDecoration(labelText: 'اسم الدرجة'),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: shade.hexController,
                        decoration: const InputDecoration(
                          labelText: 'لون HEX',
                          hintText: '#RRGGBB',
                        ),
                        textDirection: TextDirection.ltr,
                        onChanged: (_) => setState(() {}),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                if (shade.imageUrl != null && shade.imageUrl!.isNotEmpty)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: CachedNetworkImage(
                      imageUrl: shade.imageUrl!,
                      width: 48,
                      height: 48,
                      fit: BoxFit.cover,
                    ),
                  )
                else
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.image_outlined, color: Colors.grey),
                  ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickShadeImage(shade),
                    icon: const Icon(Icons.photo_library_outlined, size: 18),
                    label: Text(shade.imageUrl == null ? 'اختر صورة من المنتج' : 'تغيير الصورة'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryStep() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SectionCard(
          title: 'البراند والتصنيف',
          icon: Icons.category_outlined,
          child: Column(
            children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('البراند من القائمة'),
                subtitle: Text(_selectedBrand?.displayName ?? 'يُنشأ من الاسم إن لم يُختر'),
                trailing: const Icon(Icons.chevron_left),
                onTap: () async {
                  final picked = await showSearchPicker<BrandEntity>(
                    context: context,
                    title: 'اختر البراند',
                    items: _brands,
                    selected: _selectedBrand,
                    labelOf: (b) => b.displayName,
                    subtitleOf: (b) => b.searchTokens.where((t) => t != b.displayName).join(' · '),
                    isSame: (a, b) => a.id == b.id,
                  );
                  if (picked != null) {
                    setState(() {
                      _brandId = picked.id;
                      _brandAr.text = picked.displayName;
                      _brandEn.text = picked.nameEn?.trim().isNotEmpty == true
                          ? picked.nameEn!.trim()
                          : (picked.name?.trim().isNotEmpty == true ? picked.name!.trim() : picked.displayName);
                    });
                  }
                },
              ),
              const Divider(),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('القسم الرئيسي'),
                subtitle: Text(_find(_categories, _categoryId)?.displayName ?? 'غير محدد'),
                trailing: const Icon(Icons.chevron_left),
                onTap: () async {
                  final picked = await showSearchPicker<NamedEntity>(
                    context: context,
                    title: 'القسم الرئيسي',
                    items: _categories,
                    selected: _find(_categories, _categoryId),
                    labelOf: (c) => c.displayName,
                    isSame: (a, b) => a.id == b.id,
                  );
                  if (picked != null) await _loadSubs(picked.id);
                },
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('القسم الفرعي'),
                subtitle: Text(
                  _labelsOf(_subcategories, _subcategoryIds, empty: 'يمكن اختيار أكثر من قسم'),
                ),
                trailing: const Icon(Icons.chevron_left),
                onTap: _categoryId == null
                    ? null
                    : () async {
                        final picked = await showMultiSearchPicker<NamedEntity>(
                          context: context,
                          title: 'الأقسام الفرعية',
                          items: _subcategories,
                          selected: _findMany(_subcategories, _subcategoryIds),
                          labelOf: (c) => c.displayName,
                          isSame: (a, b) => a.id == b.id,
                        );
                        if (picked != null) await _setSubcategories(picked);
                      },
              ),
              if (_subcategoryIds.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: _findMany(_subcategories, _subcategoryIds)
                        .map(
                          (e) => InputChip(
                            label: Text(e.displayName),
                            onDeleted: () async {
                              _subcategoryIds.remove(e.id);
                              await _reloadTertiaries();
                            },
                          ),
                        )
                        .toList(),
                  ),
                ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('القسم الثانوي'),
                subtitle: Text(
                  _labelsOf(_tertiary, _tertiaryIds, empty: 'يمكن اختيار أكثر من قسم'),
                ),
                trailing: const Icon(Icons.chevron_left),
                onTap: _subcategoryIds.isEmpty
                    ? null
                    : () async {
                        final picked = await showMultiSearchPicker<NamedEntity>(
                          context: context,
                          title: 'الأقسام الثانوية',
                          items: _tertiary,
                          selected: _findMany(_tertiary, _tertiaryIds),
                          labelOf: (c) => c.displayName,
                          isSame: (a, b) => a.id == b.id,
                        );
                        if (picked != null) {
                          setState(() {
                            _tertiaryIds
                              ..clear()
                              ..addAll(picked.map((e) => e.id));
                          });
                        }
                      },
              ),
              if (_tertiaryIds.isNotEmpty)
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: _findMany(_tertiary, _tertiaryIds)
                      .map(
                        (e) => InputChip(
                          label: Text(e.displayName),
                          onDeleted: () => setState(() => _tertiaryIds.remove(e.id)),
                        ),
                      )
                      .toList(),
                ),
            ],
          ),
        ),
        SectionCard(
          title: 'السعر والمخزون',
          icon: Icons.payments_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_posFilled)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Chip(
                    avatar: Icon(Icons.point_of_sale, size: 18, color: Colors.amber.shade800),
                    label: Text(
                      'مُعبّأ من POS: ${_price.text} د.ع · مخزون ${_stock.text}',
                      style: TextStyle(fontSize: 12, color: Colors.amber.shade900),
                    ),
                    backgroundColor: Colors.amber.shade50,
                    side: BorderSide(color: Colors.amber.shade200),
                  ),
                ),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _price,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'السعر د.ع'),
                      textDirection: TextDirection.ltr,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _stock,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'المخزون'),
                      textDirection: TextDirection.ltr,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReviewStep() {
    final warnings = _qualityWarnings();
    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
      children: [
        if (warnings.isNotEmpty)
          Card(
            color: const Color(0xFFFFF8E8),
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.amber.shade800, size: 22),
                      const SizedBox(width: 8),
                      Text(
                        'تنبيهات (${warnings.length})',
                        style: TextStyle(fontWeight: FontWeight.w800, color: Colors.amber.shade900),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  for (final w in warnings)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text('• $w', style: TextStyle(fontSize: 13, color: Colors.amber.shade900, height: 1.35)),
                    ),
                ],
              ),
            ),
          ),
        SectionCard(
          title: 'جاهز للحفظ',
          subtitle: 'راجع الملخص ثم اضغط حفظ',
          icon: Icons.fact_check_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _reviewRow('الاسم', _nameAr.text.trim().isNotEmpty ? _nameAr.text : _nameEn.text),
              _reviewRow('البراند', _selectedBrand?.displayName ?? '${_brandAr.text} / ${_brandEn.text}'),
              _reviewRow(
                'التصنيف',
                [
                  _find(_categories, _categoryId)?.displayName,
                  if (_subcategoryIds.isNotEmpty) _labelsOf(_subcategories, _subcategoryIds, empty: ''),
                  if (_tertiaryIds.isNotEmpty) _labelsOf(_tertiary, _tertiaryIds, empty: ''),
                ].whereType<String>().where((s) => s.isNotEmpty).join(' › '),
              ),
              _reviewRow('السعر / المخزون', '${_price.text.isEmpty ? "0" : _price.text} د.ع · ${_stock.text}'),
              if (_multiShadeEnabled) _reviewRow('التدرجات', '${_shades.length} درجة'),
              const SizedBox(height: 4),
              Text(
                'الصور (${_selectedImages.length}) — الأولى رئيسية',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 84,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: _orderedSelectedUrls()
                      .asMap()
                      .entries
                      .map(
                        (e) => Padding(
                          padding: const EdgeInsets.only(left: 8),
                          child: Stack(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: CachedNetworkImage(
                                  imageUrl: e.value,
                                  width: 84,
                                  height: 84,
                                  fit: BoxFit.cover,
                                ),
                              ),
                              if (e.key == 0)
                                Positioned(
                                  top: 4,
                                  right: 4,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppTheme.primary,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text(
                                      'رئيسية',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 9,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ActionChip(
                    avatar: const Icon(Icons.edit, size: 16),
                    label: const Text('التسمية'),
                    onPressed: () => _goTo(0),
                  ),
                  ActionChip(
                    avatar: const Icon(Icons.image_outlined, size: 16),
                    label: const Text('الصور'),
                    onPressed: () => _goTo(1),
                  ),
                  ActionChip(
                    avatar: const Icon(Icons.palette_outlined, size: 16),
                    label: const Text('التدرجات'),
                    onPressed: () => _goTo(2),
                  ),
                  ActionChip(
                    avatar: const Icon(Icons.category_outlined, size: 16),
                    label: const Text('التصنيف'),
                    onPressed: () => _goTo(3),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _reviewRow(String label, String value, {int maxLines = 2}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
          const SizedBox(height: 2),
          Text(
            value.trim().isEmpty ? '—' : value.trim(),
            maxLines: maxLines,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.w600, height: 1.35),
          ),
        ],
      ),
    );
  }
}

class _StepHeader extends StatelessWidget {
  const _StepHeader({required this.step, required this.titles});

  final int step;
  final List<String> titles;

  @override
  Widget build(BuildContext context) {
    final progress = (step + 1) / titles.length;
    return Material(
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Text(
                  titles[step],
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    color: AppTheme.primaryDark,
                  ),
                ),
                const Spacer(),
                Text(
                  '${step + 1} / ${titles.length}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: AppTheme.muted,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 6,
                backgroundColor: const Color(0xFFECE7F0),
                color: AppTheme.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
