import 'dart:async';
import 'dart:typed_data';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/ai_draft_store.dart';
import '../../core/utils/ai_model_prefs.dart';
import '../../core/utils/api_error.dart';
import '../../core/utils/brand_match.dart';
import '../../core/utils/daily_progress_store.dart';
import '../../core/utils/helpers.dart';
import '../../core/utils/product_naming.dart';
import '../../core/utils/shade_catalog_enrich.dart';
import '../../core/utils/shade_family_fallback.dart';
import '../../core/utils/shade_sort.dart';
import '../../core/utils/store_image_enrich.dart';
import '../../models/ai_autofill.dart';
import '../../models/brand.dart';
import '../../models/catalog.dart';
import '../../models/inventory.dart';
import '../../providers/auth_provider.dart';
import '../../repositories/ai_product_repository.dart';
import '../../repositories/catalog_repository.dart';
import '../../repositories/product_repository.dart';
import '../../widgets/composer_naming_banner.dart';
import '../../widgets/google_style_image_search.dart';
import '../../widgets/search_picker_sheet.dart';
import '../../widgets/section_card.dart';
import '../../widgets/shade_tile.dart';
import '../media/product_image_editor_screen.dart';

class ShadeFamilyWizardScreen extends ConsumerStatefulWidget {
  const ShadeFamilyWizardScreen({
    super.key,
    required this.barcodes,
    this.hint,
    this.modelId,
    this.existsNames = const {},
  });

  final List<String> barcodes;
  final String? hint;
  final String? modelId;
  final Map<String, String> existsNames;

  @override
  ConsumerState<ShadeFamilyWizardScreen> createState() => _ShadeFamilyWizardScreenState();
}

class _ShadeDraft {
  _ShadeDraft({
    required this.barcode,
    required String name,
    required String code,
    required String hex,
  })  : nameController = TextEditingController(text: name),
        codeController = TextEditingController(text: code),
        hexController = TextEditingController(text: hex);

  final String barcode;
  final TextEditingController nameController;
  final TextEditingController codeController;
  final TextEditingController hexController;
  String? imageUrl;
  List<AiAutofillImage> imageHits = [];
  bool loadingImages = false;

  String get displayName {
    final code = codeController.text.trim();
    final name = nameController.text.trim();
    if (name.isEmpty) return code.isNotEmpty ? code : barcode;
    if (code.isEmpty) return name;
    final ln = name.toLowerCase();
    final lc = code.toLowerCase();
    if (ln == lc || ln.endsWith(' $lc') || ln.contains(' $lc ') || ln.startsWith('$lc ')) {
      return name;
    }
    if (!ln.startsWith(lc)) return '$code $name';
    return name;
  }

  void dispose() {
    nameController.dispose();
    codeController.dispose();
    hexController.dispose();
  }
}

class _ShadeFamilyWizardScreenState extends ConsumerState<ShadeFamilyWizardScreen> {
  final _page = PageController();
  final _nameAr = TextEditingController();
  final _nameEn = TextEditingController();
  final _descAr = TextEditingController();
  final _descEn = TextEditingController();
  final _brandAr = TextEditingController();
  final _brandEn = TextEditingController();
  final _price = TextEditingController();
  final _stock = TextEditingController(text: '0');
  final _shadeQueryCtrl = TextEditingController();

  static const _titles = ['التسمية', 'صور التدرجات', 'صور المنتج', 'التصنيف', 'المعاينة'];

  int _step = 0;
  int _shadeImageIndex = 0;
  bool _loading = true;
  bool _saving = false;
  bool _refreshingGallery = false;
  bool _posFilled = false;
  String? _error;
  ShadeFamilyResult? _result;
  bool _enriching = false;

  final _shades = <_ShadeDraft>[];
  List<AiAutofillImage> _gallery = [];
  final Set<String> _selectedGallery = {};
  final List<String> _galleryOrder = [];
  final Map<String, AiAutofillImage> _imageByUrl = {};
  final Map<String, Uint8List> _editedBytesByUrl = {};

  List<BrandEntity> _brands = [];
  List<NamedEntity> _categories = [];
  List<NamedEntity> _subcategories = [];
  List<NamedEntity> _tertiary = [];
  String? _brandId;
  String? _categoryId;
  final List<String> _subcategoryIds = [];
  final List<String> _tertiaryIds = [];
  Map<String, BarcodeInventoryLookup> _inv = {};

  String get _mainBarcode => widget.barcodes.isNotEmpty ? widget.barcodes.first : '';

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
    _shadeQueryCtrl.dispose();
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
      final invFuture = products.lookupBarcodes(widget.barcodes);

      ShadeFamilyResult fill;
      var usedLocalFallback = false;
      try {
        fill = await ai.shadeFamily(
          barcodes: widget.barcodes,
          hint: widget.hint,
          model: widget.modelId,
        );
      } catch (e) {
        usedLocalFallback = true;
        fill = buildLocalShadeFamilyFallback(
          barcodes: widget.barcodes,
          hint: widget.hint,
          existsNames: widget.existsNames,
        );
      }

      _brands = await brandsFuture;
      _categories = await catsFuture;
      _inv = await invFuture;
      _applyPos();
      _applyResult(fill);

      if (mounted) {
        if (usedLocalFallback) {
          _snack('تعذّر التعرف التلقائي — جاري إثراء النتائج من المتاجر…', short: false);
        } else if (fill.isFallback) {
          _snack('تعرف محدود — جاري إثراء الأسماء والصور…', short: false);
        } else if (!fill.namesVerified && fill.needsReview) {
          _snack('تم التعرف — راجع الأسماء والتصنيف قبل الحفظ', short: false);
        }
      }

      await _applyCategoryFromProduct(fill);

      _brandId = _bestBrandMatch(_brands, fill.brandAr, fill.brandEn)?.id;
      final matched = _selectedBrand;
      if (matched != null) {
        if (_brandAr.text.trim().isEmpty) _brandAr.text = matched.displayName;
        if (_brandEn.text.trim().isEmpty) {
          _brandEn.text = matched.nameEn ?? matched.name ?? matched.displayName;
        }
      }

      if (mounted) setState(() => _loading = false);

      unawaited(_postBootstrapEnrich(usedLocalFallback: usedLocalFallback));
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _postBootstrapEnrich({required bool usedLocalFallback}) async {
    if (!mounted) return;
    setState(() => _enriching = true);
    try {
      final catalog = ref.read(catalogRepositoryProvider);

      try {
        _gallery = await enrichImagesFromStores(
          catalog: catalog,
          barcode: _mainBarcode,
          nameHint: _enrichNameHint,
          base: _gallery,
        );
        for (final img in _gallery) {
          _imageByUrl[img.url] = img;
        }
        if (mounted) setState(() {});
      } catch (_) {}

      final catalogHits = await enrichShadesFromCatalog(
        catalog: catalog,
        barcodes: _shades.map((s) => s.barcode).toList(),
      );
      if (catalogHits.isNotEmpty && mounted) {
        setState(() {
          for (final shade in _shades) {
            final hit = catalogHits[shade.barcode];
            if (hit == null) continue;
            if (hit.shadeName != null && isGenericShadeName(shade.nameController.text)) {
              shade.nameController.text = hit.shadeName!;
            }
            if (hit.image != null && shade.imageHits.isEmpty) {
              shade.imageHits = [hit.image!];
              _imageByUrl[hit.image!.url] = hit.image!;
            }
          }
        });
      }

      if (_gallery.isEmpty && mounted) {
        await _refreshGallery();
      }

      if (_shades.isNotEmpty) {
        await _prefetchShadeImages();
      }

      if (mounted && (usedLocalFallback || _gallery.isEmpty)) {
        final withImages = _shades.where((s) => s.imageHits.isNotEmpty).length;
        if (withImages > 0 || _gallery.isNotEmpty) {
          _snack('تم إثراء ${withImages} تدرج و${_gallery.length} صورة عامة', short: false);
        }
      }
    } finally {
      if (mounted) setState(() => _enriching = false);
    }
  }

  String get _enrichNameHint {
    final parts = <String>[
      if ((widget.hint ?? '').trim().isNotEmpty) widget.hint!.trim(),
      _productNameQuery,
      '${_brandEn.text.trim()} ${_nameEn.text.trim()}'.trim(),
    ].where((s) => s.isNotEmpty).toList();
    return parts.isNotEmpty ? parts.first : '';
  }

  Future<void> _continueWithLocalFallback() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final products = ref.read(productRepositoryProvider);
      final fill = buildLocalShadeFamilyFallback(
        barcodes: widget.barcodes,
        hint: widget.hint,
        existsNames: widget.existsNames,
      );
      _brands = await products.brands();
      _categories = await products.categories();
      _inv = await products.lookupBarcodes(widget.barcodes);
      _applyPos();
      _applyResult(fill);
      await _applyCategoryFromProduct(fill);
      if (mounted) setState(() => _loading = false);
      unawaited(_postBootstrapEnrich(usedLocalFallback: true));
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyPos() {
    BarcodeInventoryLookup? hit = lookupBarcode(_inv, _mainBarcode);
    if (hit == null || !hit.hasPos) {
      for (final v in _inv.values) {
        if (v.hasPos) {
          hit = v;
          break;
        }
      }
    }
    if (hit != null && hit.hasPos) {
      _price.text = toIntPrice(hit.pos!.price).toString();
      final totalStock = widget.barcodes.fold<int>(0, (sum, bc) {
        final inv = lookupBarcode(_inv, bc);
        return sum + toIntPrice(inv?.pos?.stock);
      });
      _stock.text = (totalStock > 0 ? totalStock : toIntPrice(hit.pos!.stock)).toString();
      _posFilled = true;
    }
  }

  void _applyResult(ShadeFamilyResult fill) {
    _result = fill;
    _nameEn.text = fill.nameEn;
    _nameAr.text = ProductNaming.applyArabicTitle(
      current: fill.nameAr,
      brandAr: fill.brandAr,
      brandEn: fill.brandEn,
      englishName: fill.nameEn,
    );
    _descAr.text = fill.descriptionAr;
    _descEn.text = fill.descriptionEn;
    _brandAr.text = fill.brandAr;
    _brandEn.text = fill.brandEn;
    _categoryId = fill.category.categoryId;
    for (final s in _shades) {
      s.dispose();
    }
    _shades
      ..clear()
      ..addAll(
        fill.shades.map(
          (s) => _ShadeDraft(
            barcode: s.barcode,
            name: s.name,
            code: s.code,
            hex: s.colorHex,
          ),
        ),
      );
    if (_shades.isEmpty) {
      for (var i = 0; i < widget.barcodes.length; i++) {
        _shades.add(_ShadeDraft(barcode: widget.barcodes[i], name: 'تدرج ${i + 1}', code: '', hex: '#CCCCCC'));
      }
    }
    _sortShades();
    _applyKnownShadeNames();
    _gallery = List.of(fill.images);
    for (final img in _gallery) {
      _imageByUrl[img.url] = img;
    }
    _selectedGallery.clear();
    _galleryOrder.clear();
  }

  void _sortShades() {
    if (_shades.length < 2) return;
    _shades.sort(
      (a, b) => compareShadeOrder(
        codeA: a.codeController.text,
        nameA: a.nameController.text,
        barcodeA: a.barcode,
        codeB: b.codeController.text,
        nameB: b.nameController.text,
        barcodeB: b.barcode,
      ),
    );
  }

  void _applyKnownShadeNames() {
    for (final shade in _shades) {
      final known = widget.existsNames[shade.barcode]?.trim();
      if (known == null || known.isEmpty) continue;
      final current = shade.nameController.text.trim();
      if (current.isEmpty || RegExp(r'^shade\s*\d+', caseSensitive: false).hasMatch(current)) {
        shade.nameController.text = known;
      }
    }
  }

  Future<void> _prefetchShadeImages() async {
    for (var i = 0; i < _shades.length; i += 3) {
      final end = (i + 3 < _shades.length) ? i + 3 : _shades.length;
      await Future.wait(List.generate(end - i, (j) => _searchShadeImages(i + j, skipSnack: true)));
      if (!mounted) return;
    }
  }

  BrandEntity? _bestBrandMatch(List<BrandEntity> brands, String ar, String en) {
    String norm(String s) => s
        .toLowerCase()
        .replaceAll(RegExp(r'[^\w\s\u0600-\u06FF]'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
    final needles = [ar, en].map(norm).where((s) => s.isNotEmpty).toList();
    if (needles.isEmpty) return null;
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
            score = 100;
          } else if ((c.startsWith(needle) || needle.startsWith(c)) && (c.length < needle.length ? c : needle).length >= 5) {
            if (score < 85) score = 85;
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = b;
      }
    }
    return bestScore >= 75 ? best : null;
  }

  BrandEntity? get _selectedBrand {
    if (_brandId == null) return null;
    for (final b in _brands) {
      if (b.id == _brandId) return b;
    }
    return null;
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
    if (pruneSelection) _tertiaryIds.removeWhere((id) => !seen.contains(id));
    if (mounted) setState(() {});
  }

  Future<void> _applyCategoryFromProduct(ShadeFamilyResult fill) async {
    final mainId = fill.category.categoryId;
    if (mainId != null && mainId.isNotEmpty) {
      _categoryId = mainId;
      await _loadSubs(mainId, clearChildren: false);
      final suggestedSubs = fill.category.subcategoryIds.isNotEmpty
          ? fill.category.subcategoryIds
          : [
              if ((fill.category.subcategoryId ?? '').isNotEmpty) fill.category.subcategoryId!,
            ];
      _subcategoryIds
        ..clear()
        ..addAll(suggestedSubs.where((id) => _subcategories.any((s) => s.id == id)));
      if (_subcategoryIds.isEmpty && fill.category.subcategoryNameAr != null) {
        final subName = fill.category.subcategoryNameAr!.toLowerCase();
        for (final s in _subcategories) {
          final n = s.displayName.toLowerCase();
          if (n.contains(subName) || subName.contains(n)) {
            _subcategoryIds.add(s.id);
          }
        }
      }
      if (_subcategoryIds.isNotEmpty) {
        await _reloadTertiaries(pruneSelection: false);
        final suggestedTert = fill.category.tertiaryCategoryIds.isNotEmpty
            ? fill.category.tertiaryCategoryIds
            : [
                if ((fill.category.tertiaryCategoryId ?? '').isNotEmpty) fill.category.tertiaryCategoryId!,
              ];
        _tertiaryIds
          ..clear()
          ..addAll(suggestedTert.where((id) => _tertiary.any((t) => t.id == id)));
      }
      if (mounted) setState(() {});
      return;
    }
    await _guessCategoryLocally();
  }

  Future<void> _guessCategoryLocally() async {
    if (_categories.isEmpty) return;
    final hint = (widget.hint ?? '').toLowerCase();
    final hay = '${_nameEn.text} ${_nameAr.text} ${_result?.productTypeAr ?? ''} $hint'.toLowerCase();

    NamedEntity? main;
    for (final c in _categories) {
      final n = c.displayName.toLowerCase();
      if (n.contains('مكياج') || n.contains('makeup')) {
        if (hay.contains('lip') || hay.contains('شفاه') || hay.contains('أحمر') || hay.contains('fluid') || hay.contains('gloss')) {
          main = c;
          break;
        }
      }
    }
    if (main == null) {
      for (final c in _categories) {
        if (c.displayName.contains('مكياج')) {
          main = c;
          break;
        }
      }
    }
    main ??= _categories.isNotEmpty ? _categories.first : null;
    if (main == null) return;

    await _loadSubs(main.id);
    final subs = _subcategories.where((s) {
      final n = s.displayName.toLowerCase();
      if (hay.contains('lip') || hay.contains('شفاه') || hay.contains('fluid')) {
        return n.contains('شفاه') || n.contains('lip');
      }
      if (hay.contains('eye') || hay.contains('عيون') || hay.contains('mascara')) {
        return n.contains('عيون') || n.contains('eye');
      }
      if (hay.contains('face') || hay.contains('وجه') || hay.contains('foundation') || hay.contains('blush')) {
        return n.contains('وجه') || n.contains('face');
      }
      if (hay.contains('brow') || hay.contains('حواجب')) return n.contains('حواجب') || n.contains('brow');
      return false;
    }).toList();

    if (subs.isNotEmpty) {
      _subcategoryIds
        ..clear()
        ..addAll(subs.map((e) => e.id));
      await _reloadTertiaries();
    }
    if (mounted) setState(() {});
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
    return labels.isEmpty ? empty : labels.join(' · ');
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

  String get _productNameQuery {
    final hint = (widget.hint ?? '').trim();
    final en = _nameEn.text.trim();
    final ar = _nameAr.text.trim();
    final brand = _brandEn.text.trim().isNotEmpty ? _brandEn.text.trim() : _brandAr.text.trim();
    if (en.isNotEmpty) return en;
    if (ar.isNotEmpty) return ar;
    if (hint.isNotEmpty) return hint;
    return brand;
  }

  String _shadeSearchQuery(_ShadeDraft shade) {
    final hint = (widget.hint ?? '').trim();
    final brand = _brandEn.text.trim().isNotEmpty ? _brandEn.text.trim() : _brandAr.text.trim();
    final product = _nameEn.text.trim().isNotEmpty ? _nameEn.text.trim() : _nameAr.text.trim();
    final code = shade.codeController.text.trim();
    final shadeName = shade.nameController.text.trim();
    final genericName = isGenericShadeName(shadeName);
    final parts = <String>[
      if (brand.isNotEmpty) brand,
      if (product.isNotEmpty) product.split(' - ').first.trim(),
      if (hint.isNotEmpty && product.isEmpty) hint.split(' - ').first.trim(),
      if (shadeName.isNotEmpty && !genericName) shadeName,
      if (code.isNotEmpty && code.length <= 3) code,
    ];
    final query = parts.where((s) => s.isNotEmpty).join(' ');
    return query.isNotEmpty ? query : shade.barcode;
  }

  Future<void> _ensureShadeImages(int index) async {
    if (index < 0 || index >= _shades.length) return;
    final shade = _shades[index];
    if (shade.imageHits.isNotEmpty || shade.loadingImages) return;
    await _searchShadeImages(index);
  }

  Future<void> _searchShadeImages(int index, {String? query, String mode = 'barcode', bool skipSnack = false}) async {
    if (index < 0 || index >= _shades.length) return;
    final shade = _shades[index];
    setState(() => shade.loadingImages = true);
    try {
      final q = (query ?? _shadeSearchQuery(shade)).trim();
      final imgs = await ref.read(aiProductRepositoryProvider).searchImages(
            shade.barcode,
            mode: mode,
            query: mode == 'name' ? (q.isNotEmpty ? q : shade.barcode) : shade.barcode,
            nameHint: q.isNotEmpty ? q : _enrichNameHint,
          );
      final merged = await enrichImagesFromStores(
        catalog: ref.read(catalogRepositoryProvider),
        barcode: shade.barcode,
        nameHint: q.isNotEmpty ? q : _enrichNameHint,
        base: imgs,
      );
      if (!mounted) return;
      setState(() {
        shade.imageHits = merged;
        for (final img in merged) {
          _imageByUrl[img.url] = img;
        }
      });
    } catch (e) {
      if (!skipSnack) _snack(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => shade.loadingImages = false);
    }
  }

  Future<void> _refreshGallery({ImageSearchMode mode = ImageSearchMode.barcode, String? query}) async {
    setState(() => _refreshingGallery = true);
    try {
      final q = (query ?? '').trim().isNotEmpty
          ? query!.trim()
          : (mode == ImageSearchMode.name ? _productNameQuery : _mainBarcode);
      final imgs = await ref.read(aiProductRepositoryProvider).searchImages(
            _mainBarcode,
            mode: mode == ImageSearchMode.name ? 'name' : 'barcode',
            query: q,
            nameHint: _productNameQuery,
          );
      final merged = await enrichImagesFromStores(
        catalog: ref.read(catalogRepositoryProvider),
        barcode: _mainBarcode,
        nameHint: _enrichNameHint,
        base: imgs,
      );
      if (!mounted) return;
      setState(() {
        for (final img in merged) {
          _imageByUrl[img.url] = img;
        }
        final selectedKept = <AiAutofillImage>[];
        final seen = <String>{};
        for (final url in _galleryOrder.where(_selectedGallery.contains)) {
          final img = _imageByUrl[url];
          if (img == null || !seen.add(url)) continue;
          selectedKept.add(img);
        }
        final searchNew = <AiAutofillImage>[];
        for (final img in merged) {
          if (!seen.add(img.url)) continue;
          searchNew.add(img);
        }
        _gallery = [...selectedKept, ...searchNew];
      });
    } catch (e) {
      _snack(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _refreshingGallery = false);
    }
  }

  void _toggleGallery(String url) {
    setState(() {
      if (_selectedGallery.contains(url)) {
        _selectedGallery.remove(url);
        _galleryOrder.remove(url);
        _editedBytesByUrl.remove(url);
      } else {
        final hit = _imageByUrl[url];
        if (hit != null) _imageByUrl[url] = hit;
        _selectedGallery.add(url);
        _galleryOrder.add(url);
      }
    });
  }

  Future<void> _editImage(String url) async {
    final existing = _editedBytesByUrl[url];
    final result = await openProductImageEditor(
      context,
      imageUrl: existing == null ? url : null,
      imageBytes: existing,
      title: 'تعديل الصورة',
    );
    if (result == null || !mounted) return;
    setState(() => _editedBytesByUrl[url] = result.bytes);
  }

  void _previewImage(String url) {
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
                  : CachedNetworkImage(imageUrl: url, fit: BoxFit.contain),
            ),
            IconButton(icon: const Icon(Icons.close, color: Colors.white), onPressed: () => Navigator.pop(ctx)),
          ],
        ),
      ),
    );
  }

  Future<String?> _uploadUrl(ProductRepository repo, String url, {bool required = true}) async {
    final edited = _editedBytesByUrl[url];
    if (edited != null) {
      final id = await repo.uploadImageBytes(edited);
      if (id == null || id.isEmpty) {
        if (required) throw Exception('فشل رفع صورة معدّلة');
        return null;
      }
      return id;
    }
    final id = await repo.uploadImageFromUrl(url);
    if (id == null || id.isEmpty) {
      if (required) {
        final host = Uri.tryParse(url.trim())?.host;
        throw Exception(
          host != null && host.isNotEmpty ? 'تعذّر رفع صورة من $host' : 'تعذّر رفع إحدى الصور المختارة',
        );
      }
      return null;
    }
    return id;
  }

  bool _validateStep(int step) {
    if (step == 0) {
      if (_nameAr.text.trim().isEmpty && _nameEn.text.trim().isEmpty) {
        _snack('أدخل اسم المنتج عربي أو إنجليزي');
        return false;
      }
      if (_shades.isEmpty) {
        _snack('لا توجد تدرجات');
        return false;
      }
    }
    if (step == 2 && _selectedGallery.isEmpty) {
      _snack('اختر صورة عامة واحدة على الأقل للمنتج');
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
    _page.animateToPage(step, duration: const Duration(milliseconds: 260), curve: Curves.easeOutCubic);
  }

  Future<void> _next() async {
    if (_step == 1) {
      final shade = _shades[_shadeImageIndex];
      if (shade.imageUrl == null || shade.imageUrl!.isEmpty) {
        _snack('اختر صورة لهذا التدرج أو اضغط مطولاً للتخطي');
        return;
      }
      if (_shadeImageIndex < _shades.length - 1) {
        setState(() => _shadeImageIndex++);
        _syncShadeQuery();
        await _ensureShadeImages(_shadeImageIndex);
        return;
      }
      if (!_validateStep(1)) return;
      _goTo(2);
      return;
    }
    if (!_validateStep(_step)) return;
    if (_step == 0) {
      _shadeImageIndex = 0;
      _syncShadeQuery();
      _goTo(1);
      await _ensureShadeImages(0);
      return;
    }
    if (_step < 4) {
      _goTo(_step + 1);
      return;
    }
    await _save();
  }

  void _goBack() {
    if (_saving) return;
    if (_step == 1 && _shadeImageIndex > 0) {
      setState(() => _shadeImageIndex--);
      _syncShadeQuery();
      return;
    }
    if (_step <= 0) return;
    _goTo(_step - 1);
  }

  void _syncShadeQuery() {
    if (_shadeImageIndex < 0 || _shadeImageIndex >= _shades.length) return;
    _shadeQueryCtrl.text = _shadeSearchQuery(_shades[_shadeImageIndex]);
  }

  Future<void> _skipShadeImage() async {
    if (_shadeImageIndex < _shades.length - 1) {
      setState(() => _shadeImageIndex++);
      _syncShadeQuery();
      await _ensureShadeImages(_shadeImageIndex);
      return;
    }
    _goTo(2);
  }

  Future<void> _save() async {
    if (_categoryId == null || _categoryId!.isEmpty) {
      _snack('اختر القسم الرئيسي');
      return;
    }
    if (_selectedGallery.isEmpty) {
      _snack('اختر صورة عامة واحدة على الأقل');
      return;
    }
    final missing = _shades.where((s) => s.imageUrl == null || s.imageUrl!.isEmpty).length;
    if (missing > 0) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('تدرجات بدون صورة'),
          content: Text('$missing تدرج بدون صورة. المتابعة؟'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('رجوع')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('متابعة')),
          ],
        ),
      );
      if (ok != true) return;
    }

    setState(() => _saving = true);
    try {
      _sortShades();
      final repo = ref.read(productRepositoryProvider);
      final brandAr = _brandAr.text.trim();
      final brandEn = _brandEn.text.trim();
      var brandId = _brandId;
      final selectedStillValid = typedBrandMatchesSelected(
        _selectedBrand,
        brandAr: brandAr,
        brandEn: brandEn,
      );
      if (!selectedStillValid || brandId == null || brandId.isEmpty) {
        brandId = matchBrandIdLocal(_brands, brandAr: brandAr, brandEn: brandEn) ??
            await repo.resolveBrand(
              brandAr: brandAr,
              brandEn: brandEn,
              createIfMissing: true,
            );
        _brandId = brandId;
      }
      if (brandId == null || brandId.isEmpty) throw Exception('تعذّر تحديد البراند');

      final sanitized = await repo.sanitizeCategoryHierarchyMulti(
        categoryId: _categoryId!,
        subcategoryIds: _subcategoryIds,
        tertiaryCategoryIds: _tertiaryIds,
      );
      _subcategoryIds
        ..clear()
        ..addAll(sanitized.subcategoryIds);
      _tertiaryIds
        ..clear()
        ..addAll(sanitized.tertiaryCategoryIds);

      final galleryUrls = [
        ..._galleryOrder.where(_selectedGallery.contains),
        ..._selectedGallery.where((u) => !_galleryOrder.contains(u)),
      ];
      final shadeUrls = [
        for (final s in _shades)
          if (s.imageUrl != null && s.imageUrl!.isNotEmpty && !galleryUrls.contains(s.imageUrl)) s.imageUrl!,
      ];
      final urlToId = <String, String>{};
      var galleryIdx = 0;
      for (final url in galleryUrls) {
        galleryIdx++;
        _snack('رفع صور المنتج $galleryIdx / ${galleryUrls.length}', short: true);
        final id = await _uploadUrl(repo, url, required: true);
        if (id != null) urlToId[url] = id;
      }
      var shadeIdx = 0;
      for (final url in shadeUrls) {
        shadeIdx++;
        _snack('رفع صور التدرجات $shadeIdx / ${shadeUrls.length}', short: true);
        try {
          final id = await _uploadUrl(repo, url, required: false);
          if (id != null) urlToId[url] = id;
        } catch (_) {
          _snack('تخطّي صورة تدرج', short: true);
        }
      }

      final imageIds = <String>[];
      for (final url in galleryUrls) {
        final id = urlToId[url];
        if (id != null && !imageIds.contains(id)) imageIds.add(id);
      }
      if (imageIds.isEmpty) throw Exception('تعذّر رفع صور المنتج');

      final nameAr = _nameAr.text.trim();
      final nameEn = _nameEn.text.trim();
      final price = toIntPrice(int.tryParse(_price.text.trim()));
      final barcode = normalizeBarcode(_mainBarcode);

      final shadePayloads = <Map<String, dynamic>>[];
      for (var i = 0; i < _shades.length; i++) {
        final s = _shades[i];
        final inv = lookupBarcode(_inv, s.barcode)?.pos;
        final imageId = s.imageUrl != null ? urlToId[s.imageUrl] : null;
        shadePayloads.add({
          'name': s.displayName,
          'colorHex': normalizeColorHex(s.hexController.text),
          'position': i,
          'barcode': s.barcode,
          if (imageId != null) 'imageId': imageId,
          if (inv != null) ...{
            'price': toIntPrice(inv.price),
            'originalPrice': toIntPrice(inv.originalPrice),
            'discountPercent': toIntPrice(inv.discountPercent),
            'stock': toIntPrice(inv.stock),
          },
        });
      }

      final stock = shadePayloads.fold<int>(
        0,
        (sum, s) => sum + ((s['stock'] as int?) ?? 0),
      );

      await repo.createProduct({
        'sku': 'SHD-$barcode',
        if (barcode.isNotEmpty) 'barcode': barcode,
        'name': nameAr.isNotEmpty ? nameAr : nameEn,
        if (nameAr.isNotEmpty) 'nameAr': nameAr,
        if (nameEn.isNotEmpty) 'nameEn': nameEn,
        'slug': slugify(nameAr.isNotEmpty ? nameAr : nameEn, 'shade'),
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
        'stock': stock > 0 ? stock : toIntPrice(int.tryParse(_stock.text.trim())),
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
            source: 'shade-family',
          );

      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('تم الحفظ'),
          content: Text(
            'أُضيف المنتج مع ${_shades.length} تدرج.\nمنتجات اليوم: ${ref.read(dailyProgressProvider).todayCount}',
          ),
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

  String get _nextLabel {
    if (_saving) return 'جاري الحفظ…';
    if (_step == 1) {
      if (_shadeImageIndex < _shades.length - 1) {
        return 'التالي: تدرج ${_shadeImageIndex + 2}';
      }
      return 'التالي: صور المنتج';
    }
    if (_step == 4) return 'حفظ في المتجر';
    return 'التالي: ${_titles[_step + 1]}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          children: [
            const Text('إضافة تدرجات مكياج', style: TextStyle(fontSize: 16)),
            Text(
              '${widget.barcodes.length} تدرج',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
            ),
          ],
        ),
        actions: [
          if (!_loading && _error == null)
            IconButton(
              tooltip: 'إعادة التعرف',
              onPressed: _saving ? null : _bootstrap,
              icon: const Icon(Icons.refresh),
            ),
        ],
      ),
      body: _loading
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 16),
                    Text(
                      'جاري التعرف على ${widget.barcodes.length} تدرج…',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'قد يستغرق دقيقة — يمكنك المتابعة يدوياً إذا تأخر',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppTheme.muted),
                    ),
                  ],
                ),
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
                        const SizedBox(height: 8),
                        OutlinedButton(
                          onPressed: _continueWithLocalFallback,
                          child: const Text('متابعة يدوياً'),
                        ),
                        if (isSessionExpiredError(_error!)) ...[
                          const SizedBox(height: 10),
                          TextButton(
                            onPressed: () {
                              ref.read(authProvider.notifier).logout();
                              context.go('/login');
                            },
                            child: const Text('تسجيل الدخول'),
                          ),
                        ],
                      ],
                    ),
                  ),
                )
              : Column(
                  children: [
                    _StepHeader(
                      step: _step,
                      titles: _titles,
                      extra: _step == 1 ? 'تدرج ${_shadeImageIndex + 1} / ${_shades.length}' : null,
                    ),
                    if (_enriching)
                      const LinearProgressIndicator(minHeight: 3),
                    Expanded(
                      child: PageView(
                        controller: _page,
                        physics: const NeverScrollableScrollPhysics(),
                        onPageChanged: (i) => setState(() => _step = i),
                        children: [
                          _buildNamingStep(),
                          _buildShadeImageStep(),
                          _buildGalleryStep(),
                          _buildCategoryStep(),
                          _buildReviewStep(),
                        ],
                      ),
                    ),
                  ],
                ),
      bottomNavigationBar: _loading || _error != null
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
                    if (_step > 0 || (_step == 1 && _shadeImageIndex > 0))
                      OutlinedButton(
                        onPressed: _saving ? null : _goBack,
                        style: OutlinedButton.styleFrom(minimumSize: const Size(88, 48)),
                        child: const Text('رجوع'),
                      ),
                    if (_step > 0 || (_step == 1 && _shadeImageIndex > 0)) const SizedBox(width: 10),
                    if (_step == 1)
                      IconButton.outlined(
                        tooltip: 'تخطي هذا التدرج',
                        onPressed: _saving ? null : _skipShadeImage,
                        icon: const Icon(Icons.skip_next_rounded),
                      ),
                    if (_step == 1) const SizedBox(width: 8),
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
                        label: Text(_nextLabel),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildNamingStep() {
    final hits = _result?.existingHits ?? [];
    return ListView(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
      children: [
        ComposerNamingBanner(
          model: AiModelOption.byId(widget.modelId ?? _result?.modelChoice ?? _result?.model),
          verified: _result?.namesVerified,
        ),
        if ((_result?.productTypeAr ?? '').isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Chip(
              avatar: const Icon(Icons.palette_outlined, size: 18, color: AppTheme.primary),
              label: Text(_result!.productTypeAr),
              backgroundColor: AppTheme.primary.withValues(alpha: 0.08),
            ),
          ),
        if (hits.isNotEmpty)
          Card(
            color: Colors.orange.shade50,
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('بعض الباركودات موجودة مسبقاً (${hits.length})', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.orange.shade900)),
                  const SizedBox(height: 6),
                  for (final h in hits.take(6))
                    Text(
                      '• ${h.barcode} — ${h.matchedShadeName ?? h.nameAr ?? h.nameEn ?? ''}',
                      textDirection: TextDirection.ltr,
                      style: TextStyle(fontSize: 12.5, color: Colors.orange.shade800),
                    ),
                ],
              ),
            ),
          ),
        SectionCard(
          title: 'اسم المنتج (عام)',
          subtitle: 'بدون رقم تدرج — ينطبق على كل الدرجات',
          icon: Icons.badge_outlined,
          child: Column(
            children: [
              TextField(controller: _nameAr, decoration: const InputDecoration(labelText: 'عربي'), maxLines: 2),
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
              Expanded(
                child: TextField(
                  controller: _brandAr,
                  decoration: const InputDecoration(labelText: 'عربي'),
                  onChanged: (_) {
                    if (!typedBrandMatchesSelected(_selectedBrand, brandAr: _brandAr.text, brandEn: _brandEn.text)) {
                      setState(() => _brandId = null);
                    }
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _brandEn,
                  decoration: const InputDecoration(labelText: 'English'),
                  textDirection: TextDirection.ltr,
                  onChanged: (_) {
                    if (!typedBrandMatchesSelected(_selectedBrand, brandAr: _brandAr.text, brandEn: _brandEn.text)) {
                      setState(() => _brandId = null);
                    }
                  },
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
              leading: const Icon(Icons.notes_outlined, color: AppTheme.primary),
              title: const Text('الوصف العام', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15.5)),
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
        SectionCard(
          title: 'التدرجات المكتشفة',
          subtitle: 'راجع الرقم والاسم ولون الصبغة',
          icon: Icons.color_lens_outlined,
          child: Column(
            children: [
              for (var i = 0; i < _shades.length; i++) _shadeEditor(i),
            ],
          ),
        ),
      ],
    );
  }

  Widget _shadeEditor(int i) {
    final s = _shades[i];
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFE8E4EC)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: _colorFromHex(s.hexController.text),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.black12),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    s.barcode,
                    textDirection: TextDirection.ltr,
                    style: const TextStyle(fontSize: 12, color: AppTheme.muted),
                  ),
                ),
                Text('#${i + 1}', style: const TextStyle(fontWeight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                SizedBox(
                  width: 72,
                  child: TextField(
                    controller: s.codeController,
                    decoration: const InputDecoration(labelText: 'رقم'),
                    textDirection: TextDirection.ltr,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: s.nameController,
                    decoration: const InputDecoration(labelText: 'اسم التدرج'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: s.hexController,
              decoration: const InputDecoration(labelText: 'لون الصبغة #HEX', prefixIcon: Icon(Icons.colorize_outlined)),
              textDirection: TextDirection.ltr,
              onChanged: (_) => setState(() {}),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShadeImageStep() {
    if (_shades.isEmpty) return const Center(child: Text('لا تدرجات'));
    final shade = _shades[_shadeImageIndex];
    return ListView(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: _colorFromHex(shade.hexController.text),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.black12),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(shade.displayName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                      Text(shade.barcode, textDirection: TextDirection.ltr, style: const TextStyle(color: AppTheme.muted, fontSize: 12.5)),
                      Text('صورة واحدة فقط لهذا التدرج', style: TextStyle(color: Colors.grey.shade600, fontSize: 12.5)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _shadeQueryCtrl,
                decoration: const InputDecoration(labelText: 'بحث صور التدرج', prefixIcon: Icon(Icons.search)),
                textInputAction: TextInputAction.search,
                onSubmitted: (q) => _searchShadeImages(_shadeImageIndex, query: q, mode: 'name'),
              ),
            ),
            const SizedBox(width: 8),
            FilledButton(
              onPressed: shade.loadingImages
                  ? null
                  : () => _searchShadeImages(_shadeImageIndex, query: _shadeQueryCtrl.text, mode: 'name'),
              child: const Text('بحث'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: shade.loadingImages ? null : () => _searchShadeImages(_shadeImageIndex, mode: 'barcode'),
          icon: const Icon(Icons.qr_code_2),
          label: const Text('بحث بباركود التدرج'),
        ),
        const SizedBox(height: 12),
        if (shade.loadingImages)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 32),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (shade.imageHits.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Column(
              children: [
                const Text('لا نتائج بعد — جاري البحث أو جرّب يدوياً'),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: shade.loadingImages
                      ? null
                      : () => _searchShadeImages(_shadeImageIndex, mode: 'name'),
                  icon: const Icon(Icons.refresh),
                  label: const Text('إعادة البحث'),
                ),
              ],
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: shade.imageHits.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
            ),
            itemBuilder: (_, i) {
              final img = shade.imageHits[i];
              final selected = shade.imageUrl == img.url;
              return InkWell(
                onTap: () => setState(() => shade.imageUrl = img.url),
                onLongPress: () => _previewImage(img.url),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: CachedNetworkImage(imageUrl: img.thumbUrl.isNotEmpty ? img.thumbUrl : img.url, fit: BoxFit.cover),
                    ),
                    if (selected)
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.primary, width: 3),
                          color: AppTheme.primary.withValues(alpha: 0.18),
                        ),
                        child: const Icon(Icons.check_circle, color: AppTheme.primary),
                      ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildGalleryStep() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
      children: [
        GoogleStyleImageSearch(
        barcode: _mainBarcode,
        images: _gallery,
        selectedUrls: _selectedGallery,
        imageOrder: _galleryOrder,
        loading: _refreshingGallery,
        initialNameQuery: _productNameQuery,
        editedBytesByUrl: _editedBytesByUrl,
        onSearch: (mode, query) => _refreshGallery(mode: mode, query: query),
        onToggle: _toggleGallery,
        onPreview: _previewImage,
        onEdit: _editImage,
        onSetPrimary: (url) {
          if (!_selectedGallery.contains(url)) return;
          setState(() {
            _galleryOrder.remove(url);
            _galleryOrder.insert(0, url);
          });
        },
        onSelectAll: () => setState(() {
          final urls = _gallery.map((e) => e.url).toList();
          _selectedGallery
            ..clear()
            ..addAll(urls);
          _galleryOrder
            ..clear()
            ..addAll(urls);
        }),
        onClear: () => setState(() {
          _selectedGallery.clear();
          _galleryOrder.clear();
          _editedBytesByUrl.clear();
        }),
        ),
      ],
    );
  }

  Widget _buildCategoryStep() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
      children: [
        SectionCard(
          title: 'التصنيف',
          icon: Icons.category_outlined,
          child: Column(
            children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('البراند'),
                subtitle: Text(_selectedBrand?.displayName ?? (_brandAr.text.trim().isNotEmpty ? _brandAr.text : 'يُنشأ من الاسم')),
                trailing: const Icon(Icons.chevron_left),
                onTap: () async {
                  final picked = await showSearchPicker<BrandEntity>(
                    context: context,
                    title: 'البراند',
                    items: _brands,
                    selected: _selectedBrand,
                    labelOf: (b) => b.displayName,
                    isSame: (a, b) => a.id == b.id,
                  );
                  if (picked != null) {
                    setState(() {
                      _brandAr.text = picked.displayName;
                      _brandEn.text = picked.nameEn?.trim().isNotEmpty == true
                          ? picked.nameEn!.trim()
                          : (picked.name?.trim().isNotEmpty == true ? picked.name!.trim() : picked.displayName);
                      _brandId = picked.id;
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
                subtitle: Text(_labelsOf(_subcategories, _subcategoryIds, empty: 'يمكن اختيار أكثر من قسم')),
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
                        if (picked != null) {
                          setState(() {
                            _subcategoryIds
                              ..clear()
                              ..addAll(picked.map((e) => e.id));
                          });
                          await _reloadTertiaries();
                        }
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
                              setState(() => _subcategoryIds.remove(e.id));
                              await _reloadTertiaries();
                            },
                          ),
                        )
                        .toList(),
                  ),
                ),
              if (_subcategoryIds.isNotEmpty)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('القسم الثانوي'),
                  subtitle: Text(_labelsOf(_tertiary, _tertiaryIds, empty: 'يمكن اختيار أكثر من قسم')),
                  trailing: const Icon(Icons.chevron_left),
                  onTap: () async {
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
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text('تعبئة من POS', style: TextStyle(color: Colors.amber.shade800, fontWeight: FontWeight.w700)),
                ),
              TextField(
                controller: _price,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'السعر د.ع'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _stock,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'المخزون الكلي'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReviewStep() {
    final withImg = _shades.where((s) => s.imageUrl != null && s.imageUrl!.isNotEmpty).length;
    return ListView(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
      children: [
        SectionCard(
          title: _nameAr.text.trim().isNotEmpty ? _nameAr.text.trim() : _nameEn.text.trim(),
          subtitle: _nameEn.text.trim().isNotEmpty ? _nameEn.text.trim() : null,
          icon: Icons.check_circle_outline,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('${_shades.length} تدرج · $withImg بصورة · ${_selectedGallery.length} صورة عامة'),
              const SizedBox(height: 8),
              Text('باركود المنتج: $_mainBarcode', textDirection: TextDirection.ltr, style: const TextStyle(color: AppTheme.muted)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final s in _shades)
                    Chip(
                      avatar: CircleAvatar(backgroundColor: _colorFromHex(s.hexController.text)),
                      label: Text(s.displayName, style: const TextStyle(fontSize: 12)),
                    ),
                ],
              ),
            ],
          ),
        ),
        if (_descAr.text.trim().isNotEmpty)
          SectionCard(
            title: 'الوصف',
            icon: Icons.notes_outlined,
            child: Text(_descAr.text.trim(), style: const TextStyle(height: 1.4)),
          ),
      ],
    );
  }
}

class _StepHeader extends StatelessWidget {
  const _StepHeader({required this.step, required this.titles, this.extra});

  final int step;
  final List<String> titles;
  final String? extra;

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
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppTheme.primaryDark),
                ),
                const Spacer(),
                Text(
                  extra ?? '${step + 1} / ${titles.length}',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.muted),
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
