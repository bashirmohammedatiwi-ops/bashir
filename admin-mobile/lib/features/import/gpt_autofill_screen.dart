import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/ai_draft_store.dart';
import '../../core/utils/api_error.dart';
import '../../core/utils/helpers.dart';
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
  final List<_AiShadeDraft> _shades = [];

  List<BrandEntity> _brands = [];
  List<NamedEntity> _categories = [];
  List<NamedEntity> _subcategories = [];
  List<NamedEntity> _tertiary = [];
  String? _brandId;
  String? _categoryId;
  String? _subcategoryId;
  String? _tertiaryId;

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

      if (fill.category.categoryId != null) {
        await _loadSubs(fill.category.categoryId!, clearChildren: false);
        _subcategoryId = fill.category.subcategoryId;
        if (_subcategoryId != null) {
          await _loadTertiary(_subcategoryId!, clearChildren: false);
          _tertiaryId = fill.category.tertiaryCategoryId;
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
    _subcategoryId = fill.category.subcategoryId;
    _tertiaryId = fill.category.tertiaryCategoryId;
    _images = List.of(fill.images);
    _selectedImages
      ..clear()
      ..addAll(_images.take(4).map((i) => i.url));
    _imageOrder
      ..clear()
      ..addAll(_selectedImages);
  }

  void _toggleImage(String url) {
    setState(() {
      if (_selectedImages.contains(url)) {
        _selectedImages.remove(url);
        _imageOrder.remove(url);
        for (final s in _shades) {
          if (s.imageUrl == url) s.imageUrl = null;
        }
      } else {
        _selectedImages.add(url);
        _imageOrder.add(url);
      }
    });
  }

  void _showImagePreview(String url) {
    showDialog<void>(
      context: context,
      builder: (ctx) => Dialog(
        insetPadding: const EdgeInsets.all(16),
        backgroundColor: Colors.black,
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            InteractiveViewer(
              child: CachedNetworkImage(
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
            nameHint: nameFallback,
          );
      setState(() {
        _images = imgs;
        // Keep previous selections that still exist; otherwise pick top 4
        _selectedImages.removeWhere((u) => !imgs.any((i) => i.url == u));
        _imageOrder.removeWhere((u) => !_selectedImages.contains(u));
        if (_selectedImages.isEmpty && imgs.isNotEmpty) {
          _selectedImages.addAll(imgs.take(4).map((e) => e.url));
          _imageOrder
            ..clear()
            ..addAll(_selectedImages);
        }
      });
      _snack('نتائج البحث: ${imgs.length} صورة');
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
      _subcategoryId = null;
      _tertiaryId = null;
      _tertiary = [];
    }
    if (mounted) setState(() {});
  }

  Future<void> _loadTertiary(String subcategoryId, {bool clearChildren = true}) async {
    _subcategoryId = subcategoryId;
    _tertiary = await ref.read(productRepositoryProvider).tertiarySections(parentId: subcategoryId);
    if (clearChildren) _tertiaryId = null;
    if (mounted) setState(() {});
  }

  NamedEntity? _find(List<NamedEntity> list, String? id) {
    if (id == null) return null;
    for (final e in list) {
      if (e.id == id) return e;
    }
    return null;
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
      _snack('اختر صورة واحدة على الأقل (أو حدّث البحث بالباركود)');
      return false;
    }
    if (step == 3 && (_categoryId == null || _categoryId!.isEmpty)) {
      _snack('اختر القسم الرئيسي');
      return false;
    }
    return true;
  }

  void _goTo(int step) {
    setState(() => _step = step);
    _page.animateToPage(step, duration: const Duration(milliseconds: 280), curve: Curves.easeOutCubic);
  }

  Future<void> _next() async {
    if (!_validateStep(_step)) return;
    if (_step < 4) {
      _goTo(_step + 1);
      return;
    }
    await _confirmAndSave();
  }

  Future<void> _confirmAndSave() async {
    final warnings = _qualityWarnings();
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + MediaQuery.of(ctx).padding.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('تأكيد الإضافة', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
              const SizedBox(height: 12),
              _previewTile('الاسم', _nameAr.text.trim().isNotEmpty ? _nameAr.text.trim() : _nameEn.text.trim()),
              _previewTile('البراند', _selectedBrand?.displayName ?? _brandAr.text.trim()),
              _previewTile('القسم', [
                _find(_categories, _categoryId)?.displayName,
                _find(_subcategories, _subcategoryId)?.displayName,
                _find(_tertiary, _tertiaryId)?.displayName,
              ].whereType<String>().where((s) => s.isNotEmpty).join(' › ')),
              _previewTile('السعر', '${_price.text.trim().isEmpty ? "0" : _price.text.trim()} د.ع'),
              _previewTile('الصور', '${_selectedImages.length} صورة'),
              if (_multiShadeEnabled) _previewTile('التدرجات', '${_shades.length} درجة'),
              const SizedBox(height: 8),
              if (_selectedImages.isNotEmpty)
                SizedBox(
                  height: 64,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: _imageOrder
                        .where(_selectedImages.contains)
                        .map(
                          (url) => Padding(
                            padding: const EdgeInsets.only(left: 8),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: CachedNetworkImage(imageUrl: url, width: 64, height: 64, fit: BoxFit.cover),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
              if (warnings.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.amber.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.warning_amber_rounded, color: Colors.amber.shade800, size: 20),
                          const SizedBox(width: 6),
                          Text('تنبيهات الجودة', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.amber.shade900)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      for (final w in warnings)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Text('• $w', style: TextStyle(fontSize: 13, color: Colors.amber.shade900)),
                        ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => Navigator.pop(ctx, true),
                icon: const Icon(Icons.check),
                label: const Text('تأكيد وحفظ في المتجر'),
              ),
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('رجوع للتعديل')),
            ],
          ),
        );
      },
    );
    if (ok == true) await _save();
  }

  Widget _previewTile(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 72, child: Text(label, style: TextStyle(color: Colors.grey.shade600, fontSize: 13))),
          Expanded(child: Text(value.isEmpty ? '—' : value, style: const TextStyle(fontWeight: FontWeight.w600))),
        ],
      ),
    );
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

      final sanitized = await repo.sanitizeCategoryHierarchy(
        categoryId: _categoryId!,
        subcategoryId: _subcategoryId,
        tertiaryCategoryId: _tertiaryId,
      );

      final orderedUrls = [
        ..._imageOrder.where(_selectedImages.contains),
        ..._selectedImages.where((u) => !_imageOrder.contains(u)),
      ];

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
      var i = 0;
      for (final url in allUploadUrls) {
        i++;
        _snack('رفع الصور $i / ${allUploadUrls.length}', short: true);
        final id = await repo.uploadImageFromUrl(url);
        if (id != null) urlToId[url] = id;
      }

      final imageIds = <String>[];
      for (final url in orderedUrls) {
        final id = urlToId[url];
        if (id != null && !imageIds.contains(id)) imageIds.add(id);
      }
      if (imageIds.isEmpty) throw Exception('تعذّر رفع الصور المختارة');

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
        if (sanitized.subcategoryId != null) 'subcategoryId': sanitized.subcategoryId,
        if (sanitized.tertiaryCategoryId != null) 'tertiaryCategoryId': sanitized.tertiaryCategoryId,
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

      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('تم الحفظ'),
          content: const Text('أُضيف المنتج بنجاح بعد المعاينة والتعديل'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('حسناً')),
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
                  Text(widget.manualMode ? 'جلب صور بالباركود...' : 'جلب حقائق مجانية + صور بالباركود...'),
                  if (!widget.manualMode) ...[
                    const SizedBox(height: 6),
                    Text(
                      'موديل: ${widget.modelId ?? 'gpt-5.6-luna-low'} (بدون بحث ويب)',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                      textDirection: TextDirection.ltr,
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
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: Row(
                  children: [
                    if (_step > 0)
                      OutlinedButton(
                        onPressed: _saving ? null : () => _goTo(_step - 1),
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
                            : Icon(_step == 4 ? Icons.save_outlined : Icons.arrow_back),
                        label: Text(
                          _saving
                              ? 'جاري الحفظ...'
                              : _step == 4
                                  ? 'مراجعة وحفظ'
                                  : 'التالي: ${_stepTitles[_step + 1]}',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildExistsBody() {
    final p = _result!.existingProduct;
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
            const SizedBox(height: 20),
            FilledButton(onPressed: () => Navigator.pop(context), child: const Text('رجوع')),
          ],
        ),
      ),
    );
  }

  Widget _buildNamingStep() {
    final result = _result!;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (result.needsReview || result.confidence < 70)
          Card(
            color: Colors.amber.shade50,
            child: ListTile(
              leading: const Icon(Icons.warning_amber_rounded, color: Colors.amber),
              title: Text(
                widget.manualMode
                    ? 'إدخال يدوي — راجع التسمية'
                    : 'راجع التسمية — ثقة ${result.confidence.toStringAsFixed(0)}%',
              ),
              subtitle: const Text('عدّل الاسم والوصف بحرية قبل المتابعة'),
            ),
          ),
        SectionCard(
          title: 'الاسم والوصف (قابل للتعديل)',
          icon: Icons.edit_note,
          child: Column(
            children: [
              Text(
                'عربي (سوق عراقي): البراند البراند - نوع المنتج + اسم الخط · إنجليزي: Brand - Product',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _nameAr,
                decoration: const InputDecoration(
                  labelText: 'الاسم عربي',
                  hintText: 'سفنتين - كونسيلر Ideal Cover Liquid بتغطية كاملة',
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _nameEn,
                decoration: const InputDecoration(
                  labelText: 'الاسم إنجليزي',
                  hintText: 'Seventeen - Ideal Cover Liquid Concealer Full Coverage',
                ),
                maxLines: 2,
                textDirection: TextDirection.ltr,
              ),
              const SizedBox(height: 10),
              TextField(controller: _descAr, decoration: const InputDecoration(labelText: 'الوصف عربي'), maxLines: 6),
              const SizedBox(height: 10),
              TextField(
                controller: _descEn,
                decoration: const InputDecoration(labelText: 'الوصف إنجليزي'),
                maxLines: 6,
                textDirection: TextDirection.ltr,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(child: TextField(controller: _brandAr, decoration: const InputDecoration(labelText: 'براند عربي'))),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _brandEn,
                      decoration: const InputDecoration(labelText: 'براند إنجليزي'),
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

  Widget _buildImagesStep() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
      children: [
        GoogleStyleImageSearch(
          barcode: widget.barcode,
          images: _images,
          selectedUrls: _selectedImages,
          imageOrder: _imageOrder,
          loading: _refreshingImages,
          initialNameQuery: _defaultNameQuery,
          onSearch: (mode, query) => _refreshImages(mode: mode, query: query),
          onToggle: _toggleImage,
          onPreview: _showImagePreview,
          onSelectAll: () => setState(() {
            _selectedImages
              ..clear()
              ..addAll(_images.map((e) => e.url));
            _imageOrder
              ..clear()
              ..addAll(_selectedImages);
          }),
          onClear: () => setState(() {
            _selectedImages.clear();
            _imageOrder.clear();
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
          title: 'تدرجات اللون',
          icon: Icons.palette_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('المنتج متعدد التدرجات'),
                subtitle: const Text('أضف درجات يدوياً بدون باركود لكل درجة'),
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
                subtitle: Text(_find(_subcategories, _subcategoryId)?.displayName ?? 'اختياري'),
                trailing: const Icon(Icons.chevron_left),
                onTap: _categoryId == null
                    ? null
                    : () async {
                        final picked = await showSearchPicker<NamedEntity>(
                          context: context,
                          title: 'القسم الفرعي',
                          items: _subcategories,
                          selected: _find(_subcategories, _subcategoryId),
                          labelOf: (c) => c.displayName,
                          isSame: (a, b) => a.id == b.id,
                        );
                        if (picked != null) await _loadTertiary(picked.id);
                      },
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('القسم الثانوي'),
                subtitle: Text(_find(_tertiary, _tertiaryId)?.displayName ?? 'اختياري'),
                trailing: const Icon(Icons.chevron_left),
                onTap: _subcategoryId == null
                    ? null
                    : () async {
                        final picked = await showSearchPicker<NamedEntity>(
                          context: context,
                          title: 'القسم الثانوي',
                          items: _tertiary,
                          selected: _find(_tertiary, _tertiaryId),
                          labelOf: (c) => c.displayName,
                          isSame: (a, b) => a.id == b.id,
                        );
                        if (picked != null) setState(() => _tertiaryId = picked.id);
                      },
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
    final result = _result!;
    final warnings = _qualityWarnings();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (warnings.isNotEmpty)
          Card(
            color: Colors.amber.shade50,
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Colors.amber),
                      const SizedBox(width: 8),
                      Text('تنبيهات الجودة (${warnings.length})', style: const TextStyle(fontWeight: FontWeight.w700)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  for (final w in warnings)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text('• $w', style: TextStyle(fontSize: 13, color: Colors.amber.shade900)),
                    ),
                ],
              ),
            ),
          ),
        SectionCard(
          title: 'معاينة نهائية — راجع قبل الحفظ',
          icon: Icons.fact_check_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _reviewRow('الاسم عربي', _nameAr.text),
              _reviewRow('الاسم إنجليزي', _nameEn.text),
              _reviewRow('الوصف عربي', _descAr.text, maxLines: 4),
              _reviewRow('البراند', _selectedBrand?.displayName ?? '${_brandAr.text} / ${_brandEn.text}'),
              _reviewRow(
                'التصنيف',
                [
                  _find(_categories, _categoryId)?.displayName,
                  _find(_subcategories, _subcategoryId)?.displayName,
                  _find(_tertiary, _tertiaryId)?.displayName,
                ].whereType<String>().where((s) => s.isNotEmpty).join(' › '),
              ),
              _reviewRow('السعر / المخزون', '${_price.text.isEmpty ? "0" : _price.text} د.ع · ${_stock.text}'),
              if (_multiShadeEnabled)
                _reviewRow('التدرجات', '${_shades.length} درجة')
              else
                _reviewRow('التدرجات', 'منتج بدون تدرجات'),
              const SizedBox(height: 8),
              Text('الصور (${_selectedImages.length})', style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              SizedBox(
                height: 88,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: _imageOrder
                      .where(_selectedImages.contains)
                      .map(
                        (url) => Padding(
                          padding: const EdgeInsets.only(left: 8),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: CachedNetworkImage(imageUrl: url, width: 88, height: 88, fit: BoxFit.cover),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
              if (result.model != null && !widget.manualMode) ...[
                const SizedBox(height: 12),
                Text(
                  'AI: ${result.model} · صور بالباركود · بدون web search',
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                ),
              ],
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => _goTo(0),
                icon: const Icon(Icons.edit),
                label: const Text('تعديل التسمية'),
              ),
              OutlinedButton.icon(
                onPressed: () => _goTo(1),
                icon: const Icon(Icons.image),
                label: const Text('تعديل الصور'),
              ),
              OutlinedButton.icon(
                onPressed: () => _goTo(2),
                icon: const Icon(Icons.palette_outlined),
                label: const Text('تعديل التدرجات'),
              ),
              OutlinedButton.icon(
                onPressed: () => _goTo(3),
                icon: const Icon(Icons.category),
                label: const Text('تعديل التصنيف والسعر'),
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
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      color: Colors.white,
      child: Row(
        children: [
          for (var i = 0; i < titles.length; i++) ...[
            if (i > 0)
              Expanded(
                child: Container(
                  height: 2,
                  color: i <= step ? AppTheme.primary : Colors.grey.shade300,
                ),
              ),
            Column(
              children: [
                CircleAvatar(
                  radius: 14,
                  backgroundColor: i <= step ? AppTheme.primary : Colors.grey.shade300,
                  foregroundColor: Colors.white,
                  child: Text('${i + 1}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 4),
                Text(
                  titles[i],
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: i == step ? FontWeight.w700 : FontWeight.normal,
                    color: i <= step ? AppTheme.primaryDark : Colors.grey,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
