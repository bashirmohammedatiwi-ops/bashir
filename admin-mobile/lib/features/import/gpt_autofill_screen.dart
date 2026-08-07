import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/helpers.dart';
import '../../models/ai_autofill.dart';
import '../../models/brand.dart';
import '../../models/catalog.dart';
import '../../repositories/ai_product_repository.dart';
import '../../repositories/product_repository.dart';
import '../../widgets/search_picker_sheet.dart';
import '../../widgets/section_card.dart';

/// Multi-step AI add wizard: naming → images → category/price → review & save.
class GptAutofillScreen extends ConsumerStatefulWidget {
  const GptAutofillScreen({super.key, required this.barcode, this.hint});

  final String barcode;
  final String? hint;

  @override
  ConsumerState<GptAutofillScreen> createState() => _GptAutofillScreenState();
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
  String? _error;
  AiAutofillResult? _result;
  List<AiAutofillImage> _images = [];
  final Set<String> _selectedImages = {};
  final List<String> _imageOrder = [];

  List<BrandEntity> _brands = [];
  List<NamedEntity> _categories = [];
  List<NamedEntity> _subcategories = [];
  List<NamedEntity> _tertiary = [];
  String? _brandId;
  String? _categoryId;
  String? _subcategoryId;
  String? _tertiaryId;

  static const _stepTitles = ['التسمية', 'الصور', 'التصنيف', 'المعاينة'];

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
      final fill = await ai.autofill(barcode: widget.barcode, hint: widget.hint);
      final brands = await brandsFuture;
      final cats = await catsFuture;

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
      _applyResult(fill);

      if (fill.category.categoryId != null) {
        await _loadSubs(fill.category.categoryId!, clearChildren: false);
        _subcategoryId = fill.category.subcategoryId;
        if (_subcategoryId != null) {
          await _loadTertiary(_subcategoryId!, clearChildren: false);
          _tertiaryId = fill.category.tertiaryCategoryId;
        }
      }

      final brandNeedle = (fill.brandAr.isNotEmpty ? fill.brandAr : fill.brandEn).toLowerCase();
      for (final b in brands) {
        final names = [b.nameAr, b.nameEn, b.name].whereType<String>().map((s) => s.toLowerCase());
        if (names.any((n) => n == brandNeedle || n.contains(brandNeedle) || brandNeedle.contains(n))) {
          _brandId = b.id;
          break;
        }
      }
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      if (mounted) setState(() => _loading = false);
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
      } else {
        _selectedImages.add(url);
        _imageOrder.add(url);
      }
    });
  }

  Future<void> _refreshImages() async {
    setState(() => _refreshingImages = true);
    try {
      final imgs = await ref.read(aiProductRepositoryProvider).searchImages(widget.barcode);
      setState(() {
        _images = imgs;
        if (_selectedImages.isEmpty && imgs.isNotEmpty) {
          _selectedImages.addAll(imgs.take(4).map((e) => e.url));
          _imageOrder
            ..clear()
            ..addAll(_selectedImages);
        }
      });
      _snack('تم تحديث الصور بالباركود (${imgs.length})');
    } catch (e) {
      _snack(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _refreshingImages = false);
    }
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
    if (step == 2 && (_categoryId == null || _categoryId!.isEmpty)) {
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
    if (_step < 3) {
      _goTo(_step + 1);
      return;
    }
    await _confirmAndSave();
  }

  Future<void> _confirmAndSave() async {
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

      final imageIds = <String>[];
      var i = 0;
      for (final url in orderedUrls) {
        i++;
        _snack('رفع الصور $i / ${orderedUrls.length}', short: true);
        final id = await repo.uploadImageFromUrl(url);
        if (id != null && !imageIds.contains(id)) imageIds.add(id);
      }
      if (imageIds.isEmpty) throw Exception('تعذّر رفع الصور المختارة');

      final nameAr = _nameAr.text.trim();
      final nameEn = _nameEn.text.trim();
      final price = int.tryParse(_price.text.trim()) ?? 0;
      final stock = int.tryParse(_stock.text.trim()) ?? 0;
      final barcode = normalizeBarcode(widget.barcode);

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
        'shades': <Map<String, dynamic>>[],
      });

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
            const Text('معاينة الإضافة الذكية', style: TextStyle(fontSize: 16)),
            Text(
              widget.barcode,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
              textDirection: TextDirection.ltr,
            ),
          ],
        ),
        actions: [
          if (!_loading && _error == null && _result?.exists != true)
            IconButton(
              tooltip: 'إعادة التعبئة (يستهلك AI)',
              onPressed: _saving ? null : _bootstrap,
              icon: const Icon(Icons.refresh),
            ),
        ],
      ),
      body: _loading
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('جلب حقائق مجانية + صور بالباركود...'),
                  SizedBox(height: 6),
                  Text('ثم تعبئة نصية بموديل اقتصادي (بدون بحث ويب)', style: TextStyle(fontSize: 12, color: Colors.grey)),
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
                            : Icon(_step == 3 ? Icons.save_outlined : Icons.arrow_back),
                        label: Text(
                          _saving
                              ? 'جاري الحفظ...'
                              : _step == 3
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
              title: Text('راجع التسمية — ثقة ${result.confidence.toStringAsFixed(0)}%'),
              subtitle: const Text('عدّل الاسم والوصف بحرية قبل المتابعة'),
            ),
          ),
        SectionCard(
          title: 'الاسم والوصف (قابل للتعديل)',
          icon: Icons.edit_note,
          child: Column(
            children: [
              TextField(controller: _nameAr, decoration: const InputDecoration(labelText: 'الاسم عربي'), maxLines: 2),
              const SizedBox(height: 10),
              TextField(
                controller: _nameEn,
                decoration: const InputDecoration(labelText: 'الاسم إنجليزي'),
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
      padding: const EdgeInsets.all(16),
      children: [
        SectionCard(
          title: 'صور بالباركود',
          icon: Icons.image_search,
          trailing: TextButton.icon(
            onPressed: _refreshingImages ? null : _refreshImages,
            icon: _refreshingImages
                ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.refresh, size: 18),
            label: const Text('تحديث'),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'البحث يتم بالباركود ${widget.barcode} — بدون استهلاك AI',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                textDirection: TextDirection.ltr,
                textAlign: TextAlign.right,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text('${_selectedImages.length} مختارة / ${_images.length}', style: TextStyle(color: Colors.grey.shade700)),
                  const Spacer(),
                  TextButton(
                    onPressed: () => setState(() {
                      _selectedImages
                        ..clear()
                        ..addAll(_images.map((e) => e.url));
                      _imageOrder
                        ..clear()
                        ..addAll(_selectedImages);
                    }),
                    child: const Text('الكل'),
                  ),
                  TextButton(
                    onPressed: () => setState(() {
                      _selectedImages.clear();
                      _imageOrder.clear();
                    }),
                    child: const Text('مسح'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (_images.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 28),
                  child: Text('لا توجد صور لهذا الباركود — جرّب تحديث البحث', textAlign: TextAlign.center),
                )
              else
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _images.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 0.85,
                  ),
                  itemBuilder: (_, i) {
                    final img = _images[i];
                    final selected = _selectedImages.contains(img.url);
                    final order = _imageOrder.indexOf(img.url);
                    return InkWell(
                      onTap: () => _toggleImage(img.url),
                      borderRadius: BorderRadius.circular(12),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CachedNetworkImage(
                              imageUrl: img.thumbUrl.isNotEmpty ? img.thumbUrl : img.url,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) =>
                                  Container(color: Colors.grey.shade200, child: const Icon(Icons.broken_image)),
                            ),
                          ),
                          Positioned(
                            top: 6,
                            left: 6,
                            child: CircleAvatar(
                              radius: 12,
                              backgroundColor: selected ? AppTheme.primary : Colors.black45,
                              child: selected
                                  ? Text('${order + 1}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold))
                                  : const Icon(Icons.add, size: 14, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ],
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
                    isSame: (a, b) => a.id == b.id,
                  );
                  if (picked != null) setState(() => _brandId = picked.id);
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
          child: Row(
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
        ),
      ],
    );
  }

  Widget _buildReviewStep() {
    final result = _result!;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
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
              if (result.model != null) ...[
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
