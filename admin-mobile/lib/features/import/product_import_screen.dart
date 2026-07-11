import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart' hide TextDirection;

import '../../core/utils/brand_match.dart';
import '../../core/utils/helpers.dart';
import '../../models/brand.dart';
import '../../models/catalog.dart';
import '../../models/inventory.dart';
import '../../repositories/catalog_repository.dart';
import '../../repositories/product_repository.dart';
import '../../widgets/inventory_meta.dart';
import '../../widgets/search_picker_sheet.dart';
import '../../widgets/section_card.dart';
import '../../widgets/shade_tile.dart';

class ProductImportScreen extends ConsumerStatefulWidget {
  const ProductImportScreen({
    super.key,
    required this.store,
    required this.sourceId,
    this.barcode,
    this.shadeCountHint = 0,
    this.storeLabel = '',
  });

  final String store;
  final String sourceId;
  final String? barcode;
  final int shadeCountHint;
  final String storeLabel;

  @override
  ConsumerState<ProductImportScreen> createState() => _ProductImportScreenState();
}

class _ProductImportScreenState extends ConsumerState<ProductImportScreen> {
  CatalogImportProduct? _product;
  Map<String, BarcodeInventoryLookup> _inv = {};
  List<BrandEntity> _brands = [];
  List<NamedEntity> _categories = [];
  List<NamedEntity> _subcategories = [];
  List<NamedEntity> _tertiarySections = [];
  String? _brandId;
  String? _categoryId;
  String? _subcategoryId;
  String? _tertiaryCategoryId;
  int? _expandedShade;
  bool _descExpanded = false;
  int _imageIndex = 0;
  bool _loading = true;
  bool _loadingSubs = false;
  bool _loadingTertiary = false;
  bool _importing = false;
  String? _error;
  String _stage = '';
  int _progressDone = 0;
  int _progressTotal = 0;
  int _loadGen = 0;
  String _loadStage = 'جاري تحميل المنتج...';
  final Set<int> _selectedShadeIndices = {};
  final _priceController = TextEditingController();
  final _stockController = TextEditingController();
  bool _allowDuplicateImport = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _priceController.dispose();
    _stockController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant ProductImportScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.store != widget.store ||
        oldWidget.sourceId != widget.sourceId ||
        oldWidget.barcode != widget.barcode) {
      _resetForNewProduct();
      _load();
    }
  }

  void _resetForNewProduct() {
    _loadGen += 1;
    setState(() {
      _product = null;
      _inv = {};
      _brandId = null;
      _categoryId = null;
      _subcategoryId = null;
      _tertiaryCategoryId = null;
      _subcategories = [];
      _tertiarySections = [];
      _expandedShade = null;
      _descExpanded = false;
      _imageIndex = 0;
      _loading = true;
      _error = null;
      _importing = false;
      _loadStage = 'جاري تحميل المنتج...';
      _selectedShadeIndices.clear();
      _priceController.clear();
      _stockController.clear();
      _allowDuplicateImport = false;
    });
  }

  Future<void> _load() async {
    final gen = ++_loadGen;
    final store = widget.store;
    final sourceId = widget.sourceId;

    setState(() {
      _loading = true;
      _error = null;
      _loadStage = 'جاري تحميل التصنيفات...';
    });
    try {
      final catalog = ref.read(catalogRepositoryProvider);
      final products = ref.read(productRepositoryProvider);

      CatalogImportProduct? product;
      final results = await Future.wait([
        products.categories(),
        products.brands(),
      ]);
      if (!_isCurrentLoad(gen, store, sourceId)) return;

      final categories = results[0] as List<NamedEntity>;
      var brands = results[1] as List<BrandEntity>;

      product = await catalog.fetchProductSmart(
        store,
        sourceId,
        storeLabel: widget.storeLabel,
        shadeCountHint: widget.shadeCountHint,
        onPartial: (partial) {
          if (!_isCurrentLoad(gen, store, sourceId)) return;
          if (mounted) {
            setState(() {
              _product = partial;
              _loadStage = partial.shades.length > 1
                  ? 'جاري جلب ${partial.shades.length} تدرج...'
                  : 'جاري إكمال التفاصيل...';
            });
          }
        },
      );
      if (!_isCurrentLoad(gen, store, sourceId)) return;

      final subcategories = await products.subcategories();
      final tertiary = await products.tertiarySections();
      final match = products.matchCategoryFromHints(
        categories,
        subcategories,
        tertiary,
        product.categoryHint ?? '',
        product.nameEn.isNotEmpty ? product.nameEn : (product.categoryHint ?? ''),
      );

      final barcodes = _collectBarcodes(product);
      final inv = await products.lookupBarcodes(barcodes);

      final brandId = await ensureBrandId(
        brands,
        ({brandAr, brandEn, createIfMissing = true}) => products.resolveBrand(
          brandAr: brandAr,
          brandEn: brandEn,
          createIfMissing: createIfMissing,
        ),
        product,
      );

      if (brandId != null && !brands.any((b) => b.id == brandId)) {
        brands = await products.brands();
      }

      List<NamedEntity> subs = [];
      List<NamedEntity> tert = [];
      final catId = match.categoryId;
      if (catId != null) {
        subs = await products.subcategories(parentId: catId);
      }
      if (match.subcategoryId != null) {
        tert = await products.tertiarySections(parentId: match.subcategoryId);
      }

      if (!_isCurrentLoad(gen, store, sourceId)) return;

      final loadedProduct = product;
      if (loadedProduct == null) {
        if (mounted) setState(() => _error = 'لم يُعثر على المنتج');
        return;
      }

      final selectedShades = <int>{};
      for (var i = 0; i < loadedProduct.shades.length; i++) {
        selectedShades.add(i);
      }

      if (mounted) {
        setState(() {
          _product = loadedProduct;
          _categories = categories;
          _brands = brands;
          _subcategories = subs;
          _tertiarySections = tert;
          _brandId = brandId;
          _categoryId = match.categoryId;
          _subcategoryId = match.subcategoryId;
          _tertiaryCategoryId = match.tertiaryCategoryId;
          _inv = inv;
          _selectedShadeIndices
            ..clear()
            ..addAll(selectedShades);
          _prefillPriceStock(loadedProduct, inv);
        });
      }
    } catch (e) {
      if (!_isCurrentLoad(gen, store, sourceId)) return;
      if (mounted) setState(() => _error = 'فشل جلب تفاصيل المنتج: ${e.toString().replaceFirst('Exception: ', '')}');
    } finally {
      if (_isCurrentLoad(gen, store, sourceId) && mounted) {
        setState(() => _loading = false);
      }
    }
  }

  bool _isCurrentLoad(int gen, String store, String sourceId) {
    return mounted && gen == _loadGen && widget.store == store && widget.sourceId == sourceId;
  }

  List<String> _collectBarcodes(CatalogImportProduct product) {
    final barcodes = <String>[];
    final main = _validBc(product.barcode) ?? _validBc(widget.barcode);
    if (main != null) barcodes.add(main);
    for (final s in product.shades) {
      final bc = _validBc(s.barcode);
      if (bc != null) barcodes.add(bc);
    }
    return barcodes;
  }

  String? _validBc(String? raw) {
    if (raw == null || isMiswagInternalId(raw)) return null;
    final n = normalizeBarcode(raw);
    return n.isNotEmpty ? n : null;
  }

  void _prefillPriceStock(CatalogImportProduct product, Map<String, BarcodeInventoryLookup> inv) {
    final mainLookup = lookupBarcode(inv, product.barcode ?? widget.barcode);
    if (mainLookup?.pos != null && mainLookup!.pos!.price > 0) {
      _priceController.text = mainLookup.pos!.price.toInt().toString();
      _stockController.text = mainLookup.pos!.stock.toString();
      return;
    }
    final hint = int.tryParse((product.priceHint ?? '').replaceAll(RegExp(r'[^\d]'), ''));
    if (hint != null && hint > 0) {
      _priceController.text = hint.toString();
    }
  }

  List<CatalogImportShade> _activeShades(CatalogImportProduct product) {
    if (product.shades.isEmpty) return product.shades;
    if (_selectedShadeIndices.isEmpty) return product.shades;
    return [
      for (var i = 0; i < product.shades.length; i++)
        if (_selectedShadeIndices.contains(i)) product.shades[i],
    ];
  }

  bool get _duplicateExists {
    final product = _product;
    if (product == null) return false;
    final mainLookup = lookupBarcode(_inv, product.barcode ?? widget.barcode);
    return mainLookup?.existsInApp == true;
  }

  Future<void> _showImportSuccess() async {
    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.check_circle, color: Colors.green.shade600, size: 56),
              const SizedBox(height: 12),
              const Text('تم استيراد المنتج بنجاح', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  context.go('/scan');
                },
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('مسح منتج التالي'),
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('البقاء في المعاينة'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  BrandEntity? get _selectedBrand {
    if (_brandId == null) return null;
    for (final b in _brands) {
      if (b.id == _brandId) return b;
    }
    return null;
  }

  String? _entityName(List<NamedEntity> list, String? id) {
    if (id == null) return null;
    for (final e in list) {
      if (e.id == id) return e.displayName;
    }
    return null;
  }

  Future<void> _onCategoryChanged(String? id) async {
    if (id == null) return;
    setState(() {
      _categoryId = id;
      _subcategoryId = null;
      _tertiaryCategoryId = null;
      _subcategories = [];
      _tertiarySections = [];
      _loadingSubs = true;
    });
    final subs = await ref.read(productRepositoryProvider).subcategories(parentId: id);
    if (mounted) {
      setState(() {
        _subcategories = subs;
        _loadingSubs = false;
      });
    }
  }

  Future<void> _onSubcategoryChanged(String? id) async {
    setState(() {
      _subcategoryId = id;
      _tertiaryCategoryId = null;
      _tertiarySections = [];
      _loadingTertiary = id != null;
    });
    if (id == null) return;
    final tert = await ref.read(productRepositoryProvider).tertiarySections(parentId: id);
    if (mounted) {
      setState(() {
        _tertiarySections = tert;
        _loadingTertiary = false;
      });
    }
  }

  NamedEntity? _findEntity(List<NamedEntity> list, String? id) {
    if (id == null) return null;
    for (final e in list) {
      if (e.id == id) return e;
    }
    return null;
  }

  Future<void> _pickBrand() async {
    final picked = await showSearchPicker<BrandEntity>(
      context: context,
      title: 'اختر البراند',
      items: _brands,
      selected: _selectedBrand,
      labelOf: (b) => b.displayName,
      subtitleOf: (b) => [b.nameEn, b.nameAr].whereType<String>().where((s) => s.isNotEmpty).join(' · '),
      isSame: (a, b) => a.id == b.id,
    );
    if (picked != null && mounted) setState(() => _brandId = picked.id);
  }

  Future<void> _pickCategory() async {
    final picked = await showSearchPicker<NamedEntity>(
      context: context,
      title: 'القسم الرئيسي',
      items: _categories,
      selected: _findEntity(_categories, _categoryId),
      labelOf: (c) => c.displayName,
      isSame: (a, b) => a.id == b.id,
    );
    if (picked != null) await _onCategoryChanged(picked.id);
  }

  Future<void> _pickSubcategory() async {
    if (_categoryId == null) return;
    if (_subcategories.isEmpty && !_loadingSubs) {
      await _onCategoryChanged(_categoryId);
    }
    if (!mounted) return;
    final picked = await showSearchPicker<NamedEntity>(
      context: context,
      title: 'القسم الفرعي',
      items: _subcategories,
      selected: _findEntity(_subcategories, _subcategoryId),
      labelOf: (c) => c.displayName,
      isSame: (a, b) => a.id == b.id,
    );
    if (picked != null) await _onSubcategoryChanged(picked.id);
  }

  Future<void> _pickTertiary() async {
    if (_subcategoryId == null) return;
    if (_tertiarySections.isEmpty && !_loadingTertiary) {
      await _onSubcategoryChanged(_subcategoryId);
    }
    if (!mounted) return;
    final picked = await showSearchPicker<NamedEntity>(
      context: context,
      title: 'القسم الثانوي',
      items: _tertiarySections,
      selected: _findEntity(_tertiarySections, _tertiaryCategoryId),
      labelOf: (c) => c.displayName,
      isSame: (a, b) => a.id == b.id,
    );
    if (picked != null && mounted) setState(() => _tertiaryCategoryId = picked.id);
  }

  Future<void> _import() async {
    final product = _product;
    if (product == null) return;
    if (_categoryId == null) {
      _snack('اختر القسم الرئيسي');
      return;
    }
    if (_duplicateExists && !_allowDuplicateImport) {
      _snack('المنتج موجود في التطبيق — فعّل الاستيراد رغم التكرار أو تحقق من المخزون');
      return;
    }

    final activeShades = _activeShades(product);
    if (product.shades.isNotEmpty && activeShades.isEmpty) {
      _snack('اختر تدرجاً واحداً على الأقل');
      return;
    }

    var brandId = _brandId;
    if (brandId == null || brandId.isEmpty) {
      brandId = await ref.read(productRepositoryProvider).resolveBrand(
            brandAr: product.brandAr,
            brandEn: product.brandEn,
          );
      if (brandId == null) {
        _snack('اختر البراند أو تأكد من اسمه');
        return;
      }
    }

    final priceOverride = int.tryParse(_priceController.text.trim());
    final stockOverride = int.tryParse(_stockController.text.trim());

    setState(() {
      _importing = true;
      _stage = 'جاري الاستيراد...';
    });
    try {
      await ref.read(productRepositoryProvider).importCatalogProduct(
            preview: product,
            brandId: brandId,
            selectedBarcode: widget.barcode,
            categoryId: _categoryId,
            subcategoryId: _subcategoryId,
            tertiaryCategoryId: _tertiaryCategoryId,
            shadesOverride: activeShades.isNotEmpty ? activeShades : null,
            priceOverride: priceOverride,
            stockOverride: stockOverride,
            onProgress: (stage, done, total) {
              if (mounted) {
                setState(() {
                  _stage = stage;
                  _progressDone = done;
                  _progressTotal = total;
                });
              }
            },
          );
      if (!mounted) return;
      await _showImportSuccess();
    } catch (e) {
      if (mounted) {
        final msg = e.toString().replaceFirst('Exception: ', '');
        await showDialog<void>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('فشل الاستيراد'),
            content: SingleChildScrollView(child: Text(msg)),
            actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('حسناً'))],
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _importing = false);
    }
  }

  void _snack(String msg, {bool success = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: success ? Colors.green.shade700 : null,
      ),
    );
  }

  String _formatIqd(num n) => '${NumberFormat('#,###', 'ar').format(n)} د.ع';

  @override
  Widget build(BuildContext context) {
    final product = _product;
    final mainLookup = lookupBarcode(_inv, product?.barcode ?? widget.barcode);
    final catalogBrand = product != null && product.brandAr.isNotEmpty ? product.brandAr : product?.brandEn;

    return Scaffold(
      appBar: AppBar(
        title: const Text('معاينة واستيراد'),
        actions: [
          if (!_loading)
            IconButton(icon: const Icon(Icons.refresh), onPressed: _importing ? null : _load),
        ],
      ),
      body: _loading
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text(_loadStage),
            ]))
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!),
                      const SizedBox(height: 12),
                      FilledButton(onPressed: _load, child: const Text('إعادة المحاولة')),
                    ],
                  ),
                )
              : product == null
                  ? const SizedBox.shrink()
                  : Stack(
                      children: [
                        ListView(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 110),
                          children: [
                            _ImageGallery(product: product, index: _imageIndex, onPage: (i) => setState(() => _imageIndex = i)),
                            const SizedBox(height: 12),
                            Text(product.nameAr, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                            if (product.nameEn.isNotEmpty)
                              Text(product.nameEn, style: TextStyle(color: Colors.grey.shade600)),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 6,
                              children: [
                                Chip(avatar: const Icon(Icons.store, size: 16), label: Text(product.storeLabel)),
                                if (product.priceHint?.isNotEmpty == true)
                                  Chip(avatar: const Icon(Icons.sell_outlined, size: 16), label: Text('${product.priceHint} د.ع')),
                                if (product.shades.isNotEmpty)
                                  Chip(avatar: const Icon(Icons.palette, size: 16), label: Text('${product.shades.length} تدرج')),
                                if (product.sourceUrl != null && product.sourceUrl!.isNotEmpty)
                                  ActionChip(
                                    avatar: const Icon(Icons.link, size: 16),
                                    label: const Text('رابط المصدر'),
                                    onPressed: () {
                                      Clipboard.setData(ClipboardData(text: product.sourceUrl!));
                                      _snack('تم نسخ رابط المتجر الأصلي');
                                    },
                                  ),
                              ],
                            ),
                            if (_duplicateExists) ...[
                              const SizedBox(height: 12),
                              MaterialBanner(
                                backgroundColor: Colors.orange.shade50,
                                content: Text(
                                  'هذا المنتج موجود في التطبيق${mainLookup?.inApp?.name != null ? ': ${mainLookup!.inApp!.name}' : ''}',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => setState(() => _allowDuplicateImport = !_allowDuplicateImport),
                                    child: Text(_allowDuplicateImport ? 'إلغاء التجاوز' : 'استيراد رغم التكرار'),
                                  ),
                                ],
                              ),
                            ],
                            const SizedBox(height: 12),
                            SectionCard(
                              title: 'السعر والمخزون',
                              icon: Icons.payments_outlined,
                              child: Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      controller: _priceController,
                                      keyboardType: TextInputType.number,
                                      enabled: !_importing,
                                      decoration: const InputDecoration(
                                        labelText: 'السعر (د.ع)',
                                        border: OutlineInputBorder(),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: TextField(
                                      controller: _stockController,
                                      keyboardType: TextInputType.number,
                                      enabled: !_importing,
                                      decoration: const InputDecoration(
                                        labelText: 'المخزون',
                                        border: OutlineInputBorder(),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            SectionCard(
                              title: 'معلومات المخزون',
                              icon: Icons.point_of_sale,
                              child: InventoryMeta(lookup: mainLookup, formatIqd: _formatIqd),
                            ),
                            SectionCard(
                              title: 'التصنيف والبراند',
                              icon: Icons.category_outlined,
                              child: Column(
                                children: [
                                  PickerField(
                                    label: 'البراند',
                                    value: _selectedBrand?.displayName ?? (catalogBrand?.isNotEmpty == true ? '$catalogBrand (مقترح)' : null),
                                    hint: 'اختر البراند',
                                    enabled: !_importing,
                                    onTap: _pickBrand,
                                    leading: _selectedBrand?.logoUrl != null
                                        ? ClipRRect(
                                            borderRadius: BorderRadius.circular(6),
                                            child: CachedNetworkImage(imageUrl: _selectedBrand!.logoUrl!, width: 32, height: 32, fit: BoxFit.cover),
                                          )
                                        : const Icon(Icons.branding_watermark_outlined, size: 28),
                                  ),
                                  const SizedBox(height: 12),
                                  PickerField(
                                    label: 'القسم الرئيسي',
                                    value: _entityName(_categories, _categoryId),
                                    hint: 'اختر القسم',
                                    enabled: !_importing,
                                    onTap: _pickCategory,
                                  ),
                                  const SizedBox(height: 12),
                                  PickerField(
                                    label: 'القسم الفرعي',
                                    value: _loadingSubs ? 'جاري التحميل...' : _entityName(_subcategories, _subcategoryId),
                                    hint: _categoryId == null ? 'اختر القسم أولاً' : 'اختر القسم الفرعي (اختياري)',
                                    enabled: !_importing && _categoryId != null && !_loadingSubs,
                                    onTap: _pickSubcategory,
                                  ),
                                  const SizedBox(height: 12),
                                  PickerField(
                                    label: 'القسم الثانوي',
                                    value: _loadingTertiary ? 'جاري التحميل...' : _entityName(_tertiarySections, _tertiaryCategoryId),
                                    hint: _subcategoryId == null ? 'اختر القسم الفرعي أولاً' : 'اختر القسم الثانوي (اختياري)',
                                    enabled: !_importing && _subcategoryId != null && !_loadingTertiary,
                                    onTap: _pickTertiary,
                                  ),
                                  if (product.categoryHint?.isNotEmpty == true) ...[
                                    const SizedBox(height: 10),
                                    Text('تلميح الكتالوج: ${product.categoryHint}', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                                  ],
                                ],
                              ),
                            ),
                            if (product.shades.isNotEmpty)
                              SectionCard(
                                title: 'التدرجات',
                                icon: Icons.palette_outlined,
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    TextButton(
                                      onPressed: _importing
                                          ? null
                                          : () => setState(() {
                                                _selectedShadeIndices
                                                  ..clear()
                                                  ..addAll(List.generate(product.shades.length, (i) => i));
                                              }),
                                      child: const Text('الكل'),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Theme.of(context).colorScheme.primaryContainer,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text('${_selectedShadeIndices.length}/${product.shades.length}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  children: [
                                    for (var i = 0; i < product.shades.length; i++)
                                      ShadeTile(
                                        shade: product.shades[i],
                                        index: i,
                                        lookup: lookupBarcode(_inv, product.shades[i].barcode),
                                        formatIqd: _formatIqd,
                                        expanded: _expandedShade == i,
                                        selected: _selectedShadeIndices.contains(i),
                                        onSelected: (v) => setState(() {
                                          if (v) {
                                            _selectedShadeIndices.add(i);
                                          } else {
                                            _selectedShadeIndices.remove(i);
                                          }
                                        }),
                                        onToggle: () => setState(() => _expandedShade = _expandedShade == i ? null : i),
                                      ),
                                  ],
                                ),
                              ),
                            if (stripHtml(product.descriptionAr).isNotEmpty || stripHtml(product.descriptionEn).isNotEmpty)
                              SectionCard(
                                title: 'الوصف',
                                icon: Icons.description_outlined,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    Text(
                                      stripHtml(product.descriptionAr).isNotEmpty ? stripHtml(product.descriptionAr) : stripHtml(product.descriptionEn),
                                      maxLines: _descExpanded ? null : 4,
                                      overflow: _descExpanded ? null : TextOverflow.ellipsis,
                                    ),
                                    if (stripHtml(product.descriptionAr).length > 120)
                                      TextButton(
                                        onPressed: () => setState(() => _descExpanded = !_descExpanded),
                                        child: Text(_descExpanded ? 'عرض أقل' : 'عرض المزيد'),
                                      ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                        if (_importing) _ImportOverlay(stage: _stage, done: _progressDone, total: _progressTotal),
                      ],
                    ),
      bottomNavigationBar: product == null
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: FilledButton.icon(
                  onPressed: _importing ? null : _import,
                  icon: const Icon(Icons.download_rounded),
                  label: const Text('استيراد إلى المتجر'),
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                ),
              ),
            ),
    );
  }
}

class _ImageGallery extends StatelessWidget {
  const _ImageGallery({required this.product, required this.index, required this.onPage});

  final CatalogImportProduct product;
  final int index;
  final ValueChanged<int> onPage;

  @override
  Widget build(BuildContext context) {
    final images = product.images;
    if (images.isEmpty) {
      return AspectRatio(
        aspectRatio: 1,
        child: Container(
          decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(16)),
          child: const Icon(Icons.image_not_supported, size: 64, color: Colors.grey),
        ),
      );
    }
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: AspectRatio(
            aspectRatio: 1,
            child: PageView.builder(
              itemCount: images.length,
              onPageChanged: onPage,
              itemBuilder: (_, i) => CachedNetworkImage(imageUrl: images[i].url, fit: BoxFit.contain),
            ),
          ),
        ),
        if (images.length > 1) ...[
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(images.length, (i) => Container(
                  width: i == index ? 10 : 6,
                  height: 6,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(3),
                    color: i == index ? Theme.of(context).colorScheme.primary : Colors.grey.shade400,
                  ),
                )),
          ),
        ],
      ],
    );
  }
}

class _ImportOverlay extends StatelessWidget {
  const _ImportOverlay({required this.stage, required this.done, required this.total});

  final String stage;
  final int done;
  final int total;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.black45,
      child: Center(
        child: Card(
          margin: const EdgeInsets.all(32),
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 20),
                Text(stage, style: const TextStyle(fontWeight: FontWeight.w600)),
                if (total > 0) ...[
                  const SizedBox(height: 12),
                  LinearProgressIndicator(value: total > 0 ? done / total : null),
                  const SizedBox(height: 6),
                  Text('$done / $total'),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
