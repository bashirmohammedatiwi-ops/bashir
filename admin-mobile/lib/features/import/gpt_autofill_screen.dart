import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/utils/helpers.dart';
import '../../models/ai_autofill.dart';
import '../../models/brand.dart';
import '../../models/catalog.dart';
import '../../repositories/ai_product_repository.dart';
import '../../repositories/product_repository.dart';
import '../../widgets/search_picker_sheet.dart';
import '../../widgets/section_card.dart';

class GptAutofillScreen extends ConsumerStatefulWidget {
  const GptAutofillScreen({super.key, required this.barcode, this.hint});

  final String barcode;
  final String? hint;

  @override
  ConsumerState<GptAutofillScreen> createState() => _GptAutofillScreenState();
}

class _GptAutofillScreenState extends ConsumerState<GptAutofillScreen> {
  final _nameAr = TextEditingController();
  final _nameEn = TextEditingController();
  final _descAr = TextEditingController();
  final _descEn = TextEditingController();
  final _brandAr = TextEditingController();
  final _brandEn = TextEditingController();
  final _price = TextEditingController();
  final _stock = TextEditingController(text: '0');

  bool _loading = true;
  bool _saving = false;
  String? _error;
  AiAutofillResult? _result;
  final Set<String> _selectedImages = {};

  List<BrandEntity> _brands = [];
  List<NamedEntity> _categories = [];
  List<NamedEntity> _subcategories = [];
  List<NamedEntity> _tertiary = [];
  String? _brandId;
  String? _categoryId;
  String? _subcategoryId;
  String? _tertiaryId;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
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

      _brands = brands;
      _categories = cats;
      _applyResult(fill);

      if (fill.category.categoryId != null) {
        await _loadSubs(fill.category.categoryId!);
        _subcategoryId = fill.category.subcategoryId;
        if (_subcategoryId != null) {
          await _loadTertiary(_subcategoryId!);
          _tertiaryId = fill.category.tertiaryCategoryId;
        }
      }

      // Prefer exact brand match
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
    _selectedImages
      ..clear()
      ..addAll(fill.images.take(4).map((i) => i.url));
  }

  Future<void> _loadSubs(String categoryId) async {
    _categoryId = categoryId;
    _subcategories = await ref.read(productRepositoryProvider).subcategories(parentId: categoryId);
    _subcategoryId = null;
    _tertiaryId = null;
    _tertiary = [];
    if (mounted) setState(() {});
  }

  Future<void> _loadTertiary(String subcategoryId) async {
    _subcategoryId = subcategoryId;
    _tertiary = await ref.read(productRepositoryProvider).tertiarySections(parentId: subcategoryId);
    _tertiaryId = null;
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

      final imageIds = <String>[];
      var i = 0;
      for (final url in _selectedImages) {
        i++;
        _snack('رفع الصور $i / ${_selectedImages.length}', short: true);
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
        'sku': 'GPT-$barcode',
        if (barcode.isNotEmpty) 'barcode': barcode,
        'name': nameAr.isNotEmpty ? nameAr : nameEn,
        if (nameAr.isNotEmpty) 'nameAr': nameAr,
        if (nameEn.isNotEmpty) 'nameEn': nameEn,
        'slug': slugify(nameAr.isNotEmpty ? nameAr : nameEn, 'gpt'),
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
          content: const Text('أُضيف المنتج بنجاح عبر التعبئة الذكية'),
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
            const Text('تعبئة ذكية (GPT)', style: TextStyle(fontSize: 16)),
            Text(widget.barcode, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal), textDirection: TextDirection.ltr),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'إعادة التعبئة',
            onPressed: _loading || _saving ? null : _bootstrap,
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
                  Text('جاري البحث والتعبئة بموديل اقتصادي...'),
                  SizedBox(height: 6),
                  Text('gpt-5.4-nano (استهلاك منخفض)', style: TextStyle(fontSize: 12, color: Colors.grey)),
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
              : _buildForm(),
      bottomNavigationBar: _loading || _error != null
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: FilledButton.icon(
                  onPressed: _saving ? null : _save,
                  icon: _saving
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.auto_awesome),
                  label: Text(_saving ? 'جاري الحفظ...' : 'حفظ المنتج (${_selectedImages.length} صور)'),
                ),
              ),
            ),
    );
  }

  Widget _buildForm() {
    final result = _result!;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (result.needsReview || result.confidence < 70)
          Card(
            color: Colors.amber.shade50,
            child: ListTile(
              leading: const Icon(Icons.warning_amber_rounded, color: Colors.amber),
              title: Text('مراجعة مطلوبة — ثقة ${result.confidence.toStringAsFixed(0)}%'),
              subtitle: Text(result.reviewNotes?.isNotEmpty == true ? result.reviewNotes! : 'تحقق من الاسم والتصنيف قبل الحفظ'),
            ),
          ),
        SectionCard(
          title: 'الصور من Google',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Text('${_selectedImages.length} مختارة / ${result.images.length}', style: TextStyle(color: Colors.grey.shade700)),
                  const Spacer(),
                  TextButton(
                    onPressed: () => setState(() {
                      _selectedImages
                        ..clear()
                        ..addAll(result.images.map((e) => e.url));
                    }),
                    child: const Text('تحديد الكل'),
                  ),
                  TextButton(
                    onPressed: () => setState(() => _selectedImages.clear()),
                    child: const Text('مسح'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (result.images.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Text('لا توجد صور — يمكنك الحفظ لاحقاً بعد إضافة صور يدوياً من لوحة التحكم', textAlign: TextAlign.center),
                )
              else
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: result.images.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 0.85,
                  ),
                  itemBuilder: (_, i) {
                    final img = result.images[i];
                    final selected = _selectedImages.contains(img.url);
                    return InkWell(
                      onTap: () => setState(() {
                        if (selected) {
                          _selectedImages.remove(img.url);
                        } else {
                          _selectedImages.add(img.url);
                        }
                      }),
                      borderRadius: BorderRadius.circular(12),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CachedNetworkImage(
                              imageUrl: img.thumbUrl.isNotEmpty ? img.thumbUrl : img.url,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) => Container(color: Colors.grey.shade200, child: const Icon(Icons.broken_image)),
                            ),
                          ),
                          Positioned(
                            top: 6,
                            left: 6,
                            child: CircleAvatar(
                              radius: 12,
                              backgroundColor: selected ? Theme.of(context).colorScheme.primary : Colors.black45,
                              child: Icon(selected ? Icons.check : Icons.add, size: 14, color: Colors.white),
                            ),
                          ),
                          if (img.title.isNotEmpty)
                            Positioned(
                              left: 0,
                              right: 0,
                              bottom: 0,
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: Colors.black54,
                                  borderRadius: BorderRadius.vertical(bottom: Radius.circular(12)),
                                ),
                                child: Text(img.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 10)),
                              ),
                            ),
                        ],
                      ),
                    );
                  },
                ),
              if (result.model != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    'موديل: ${result.model}${result.usedWebSearch ? ' · بحث ويب' : ' · بدون بحث ويب'}',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SectionCard(
          title: 'التسمية والوصف',
          child: Column(
            children: [
              TextField(controller: _nameAr, decoration: const InputDecoration(labelText: 'الاسم عربي'), maxLines: 2),
              const SizedBox(height: 10),
              TextField(controller: _nameEn, decoration: const InputDecoration(labelText: 'الاسم إنجليزي'), maxLines: 2, textDirection: TextDirection.ltr),
              const SizedBox(height: 10),
              TextField(controller: _descAr, decoration: const InputDecoration(labelText: 'الوصف عربي'), maxLines: 5),
              const SizedBox(height: 10),
              TextField(controller: _descEn, decoration: const InputDecoration(labelText: 'الوصف إنجليزي'), maxLines: 5, textDirection: TextDirection.ltr),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SectionCard(
          title: 'البراند والتصنيف',
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(child: TextField(controller: _brandAr, decoration: const InputDecoration(labelText: 'براند عربي'))),
                  const SizedBox(width: 8),
                  Expanded(child: TextField(controller: _brandEn, decoration: const InputDecoration(labelText: 'براند إنجليزي'), textDirection: TextDirection.ltr)),
                ],
              ),
              const SizedBox(height: 8),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('البراند من القائمة'),
                subtitle: Text(_selectedBrand?.displayName ?? 'يُنشأ تلقائياً إن لم يُختر'),
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
        const SizedBox(height: 12),
        SectionCard(
          title: 'السعر والمخزون',
          child: Row(
            children: [
              Expanded(child: TextField(controller: _price, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'السعر د.ع'), textDirection: TextDirection.ltr)),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: _stock, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'المخزون'), textDirection: TextDirection.ltr)),
            ],
          ),
        ),
        const SizedBox(height: 80),
      ],
    );
  }
}
