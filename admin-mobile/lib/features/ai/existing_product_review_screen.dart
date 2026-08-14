import 'dart:typed_data';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/ai_model_prefs.dart';
import '../../core/utils/media_url.dart';
import '../../core/utils/product_naming.dart';
import '../../models/ai_autofill.dart';
import '../../repositories/ai_product_repository.dart';
import '../../repositories/product_repository.dart';
import '../../widgets/section_card.dart';
import '../media/product_image_editor_screen.dart';

class _ManagedImage {
  _ManagedImage({
    this.mediaId,
    required this.displayUrl,
  });

  String? mediaId;
  String displayUrl;
  Uint8List? editedBytes;
  bool get isEdited => editedBytes != null;
}
/// مراجعة منتج موجود: عرض التفاصيل + فحص AI + قبول التصحيحات + حفظ.
class ExistingProductReviewScreen extends ConsumerStatefulWidget {
  const ExistingProductReviewScreen({
    super.key,
    required this.productId,
    required this.barcode,
    this.modelId,
    this.autoReview = false,
  });

  final String productId;
  final String barcode;
  final String? modelId;
  final bool autoReview;

  @override
  ConsumerState<ExistingProductReviewScreen> createState() => _ExistingProductReviewScreenState();
}

class _ExistingProductReviewScreenState extends ConsumerState<ExistingProductReviewScreen> {
  bool _loading = true;
  bool _reviewing = false;
  bool _saving = false;
  String? _error;

  Map<String, dynamic>? _product;
  AiAutofillResult? _review;
  final Set<String> _acceptedFields = {};
  final Set<String> _selectedNewImages = {};
  final Map<String, Uint8List> _editedNewImages = {};
  final List<_ManagedImage> _managedImages = [];
  bool _imagesDirty = false;

  final _nameAr = TextEditingController();
  final _nameEn = TextEditingController();
  final _descAr = TextEditingController();
  final _descEn = TextEditingController();
  final _price = TextEditingController();
  final _stock = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameAr.dispose();
    _nameEn.dispose();
    _descAr.dispose();
    _descEn.dispose();
    _price.dispose();
    _stock.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final raw = await ref.read(productRepositoryProvider).getProduct(widget.productId);
      _applyProduct(raw);
      if (widget.autoReview) {
        await _runAiReview();
      }
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyProduct(Map<String, dynamic> raw) {
    _product = raw;
    _nameAr.text = (raw['nameAr'] ?? raw['name'] ?? '').toString();
    _nameEn.text = (raw['nameEn'] ?? '').toString();
    _descAr.text = (raw['descriptionAr'] ?? '').toString();
    _descEn.text = (raw['descriptionEn'] ?? '').toString();
    _price.text = '${raw['price'] ?? 0}';
    _stock.text = '${raw['stock'] ?? 0}';
    _syncManagedImagesFromProduct();
  }

  void _syncManagedImagesFromProduct() {
    _managedImages.clear();
    for (final row in _currentImages) {
      final url = resolveProductImageUrl(row, prefer: 'medium');
      if (url == null || url.isEmpty) continue;
      final media = row['media'];
      final mediaId = media is Map
          ? media['id']?.toString()
          : (row['mediaId']?.toString() ?? row['id']?.toString());
      _managedImages.add(_ManagedImage(mediaId: mediaId, displayUrl: url));
    }
    _imagesDirty = false;
  }

  List<Map<String, dynamic>> get _currentImages {
    final list = _product?['images'];
    if (list is! List) return [];
    return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  String? get _brandName {
    final brand = _product?['brand'];
    if (brand is Map) return (brand['name'] ?? brand['nameAr'])?.toString();
    return null;
  }

  String get _brandArText {
    final review = _review;
    if (_acceptedFields.contains('brand') && review != null && review.brandAr.trim().isNotEmpty) {
      return review.brandAr.trim();
    }
    final brand = _product?['brand'];
    if (brand is Map) {
      final ar = (brand['nameAr'] ?? '').toString().trim();
      if (ar.isNotEmpty) return ar;
      final name = (brand['name'] ?? '').toString().trim();
      if (ProductNaming.hasArabicScript(name)) return name;
    }
    return '';
  }

  String get _brandEnText {
    final review = _review;
    if (_acceptedFields.contains('brand') && review != null && review.brandEn.trim().isNotEmpty) {
      return review.brandEn.trim();
    }
    final brand = _product?['brand'];
    if (brand is Map) {
      final en = (brand['nameEn'] ?? '').toString().trim();
      if (en.isNotEmpty) return en;
      final name = (brand['name'] ?? '').toString().trim();
      if (ProductNaming.isLatinBrand(name)) return name;
    }
    return '';
  }

  void _applyNamePrefixes() {
    final ar = ProductNaming.applyArabicTitle(
      current: _nameAr.text,
      brandAr: _brandArText,
      brandEn: _brandEnText,
      englishName: _nameEn.text,
    );
    final en = ProductNaming.applyEnglishTitle(
      current: _nameEn.text,
      brandEn: _brandEnText,
      brandAr: _brandArText,
    );
    if (_nameAr.text != ar) _nameAr.text = ar;
    if (_nameEn.text != en) _nameEn.text = en;
  }

  String? get _categoryPath {
    final parts = <String>[];
    for (final key in ['category', 'subcategory', 'tertiaryCategory']) {
      final row = _product?[key];
      if (row is Map) {
        final n = (row['nameAr'] ?? row['name'] ?? '').toString().trim();
        if (n.isNotEmpty) parts.add(n);
      }
    }
    return parts.isEmpty ? null : parts.join(' › ');
  }

  Future<void> _runAiReview() async {
    setState(() {
      _reviewing = true;
      _error = null;
    });
    try {
      final model = widget.modelId ?? await AiModelPrefs.getSelectedId();
      final result = await ref.read(aiProductRepositoryProvider).reviewExisting(
            barcode: widget.barcode,
            model: model,
          );
      if (!mounted) return;
      setState(() {
        _review = result;
        _acceptedFields.clear();
        _selectedNewImages.clear();
      });
      _snack(result.issues.isEmpty ? 'المراجعة اكتملت — لا ملاحظات حرجة' : 'وُجدت ${result.issues.length} ملاحظة');
    } catch (e) {
      _snack(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _reviewing = false);
    }
  }

  void _acceptIssue(AiQualityIssue issue) {
    final suggested = issue.suggested?.trim() ?? '';
    if (suggested.isEmpty) return;
    setState(() {
      switch (issue.field) {
        case 'nameAr':
          _nameAr.text = suggested;
          _acceptedFields.add('nameAr');
          break;
        case 'nameEn':
          _nameEn.text = suggested;
          _acceptedFields.add('nameEn');
          break;
        case 'descriptionAr':
          _descAr.text = suggested;
          _acceptedFields.add('descriptionAr');
          break;
        case 'brand':
          // Brand text only — resolve on save from AI suggestion brand fields
          _acceptedFields.add('brand');
          break;
        default:
          break;
      }
    });
    _snack('تم قبول الاقتراح', short: true);
  }

  void _applyAllSuggestions() {
    final r = _review;
    if (r == null) return;
    setState(() {
      if (r.nameAr.trim().isNotEmpty) {
        _nameAr.text = r.nameAr;
        _acceptedFields.add('nameAr');
      }
      if (r.nameEn.trim().isNotEmpty) {
        _nameEn.text = r.nameEn;
        _acceptedFields.add('nameEn');
      }
      _acceptedFields.add('brand');
      _applyNamePrefixes();
      if (r.descriptionAr.trim().isNotEmpty) {
        _descAr.text = r.descriptionAr;
        _acceptedFields.add('descriptionAr');
      }
      if (r.descriptionEn.trim().isNotEmpty) {
        _descEn.text = r.descriptionEn;
        _acceptedFields.add('descriptionEn');
      }
    });
    _snack('تم تطبيق اقتراحات التسمية والوصف');
  }

  Future<void> _save() async {
    final id = _product?['id']?.toString() ?? widget.productId;
    if (id.isEmpty) return;
    setState(() => _saving = true);
    try {
      final repo = ref.read(productRepositoryProvider);
      String? brandId = _product?['brandId']?.toString() ??
          (_product?['brand'] is Map ? (_product!['brand'] as Map)['id']?.toString() : null);

      final review = _review;
      if (_acceptedFields.contains('brand') && review != null) {
        final resolved = await repo.resolveBrand(
          brandAr: review.brandAr,
          brandEn: review.brandEn,
          createIfMissing: true,
        );
        if (resolved != null && resolved.isNotEmpty) brandId = resolved;
      }

      // Images: keep order of managed list (edited re-uploaded), then append AI picks
      final imageIds = <String>[];
      for (final img in _managedImages) {
        if (img.editedBytes != null) {
          final mid = await repo.uploadImageBytes(img.editedBytes!);
          if (mid != null && mid.isNotEmpty) imageIds.add(mid);
        } else if (img.mediaId != null && img.mediaId!.isNotEmpty) {
          imageIds.add(img.mediaId!);
        }
      }

      for (final url in _selectedNewImages) {
        final edited = _editedNewImages[url];
        final String mid;
        if (edited != null) {
          final uploaded = await repo.uploadImageBytes(edited);
          if (uploaded == null || uploaded.isEmpty) {
            throw Exception('فشل رفع صورة معدّلة');
          }
          mid = uploaded;
        } else {
          mid = await repo.uploadImageFromUrlRequired(url);
        }
        if (!imageIds.contains(mid)) imageIds.add(mid);
      }

      if (_acceptedFields.contains('brand') ||
          (!_acceptedFields.contains('nameAr') && !_acceptedFields.contains('nameEn'))) {
        _applyNamePrefixes();
      }
      final payload = <String, dynamic>{
        'nameAr': _nameAr.text.trim(),
        'nameEn': _nameEn.text.trim(),
        'name': _nameAr.text.trim().isNotEmpty ? _nameAr.text.trim() : _nameEn.text.trim(),
        'descriptionAr': _descAr.text.trim(),
        'descriptionEn': _descEn.text.trim(),
        'price': int.tryParse(_price.text.trim()) ?? 0,
        'stock': int.tryParse(_stock.text.trim()) ?? 0,
        if (brandId != null && brandId.isNotEmpty) 'brandId': brandId,
        if (review?.category.categoryId != null && _acceptedFields.contains('category'))
          'categoryId': review!.category.categoryId,
        if (review != null &&
            _acceptedFields.contains('category') &&
            (review.category.subcategoryIds.isNotEmpty || review.category.subcategoryId != null))
          'subcategoryIds': review.category.subcategoryIds.isNotEmpty
              ? review.category.subcategoryIds
              : [review.category.subcategoryId!],
        if (review != null &&
            _acceptedFields.contains('category') &&
            (review.category.tertiaryCategoryIds.isNotEmpty || review.category.tertiaryCategoryId != null))
          'tertiaryCategoryIds': review.category.tertiaryCategoryIds.isNotEmpty
              ? review.category.tertiaryCategoryIds
              : [review.category.tertiaryCategoryId!],
        if (review?.category.subcategoryId != null && _acceptedFields.contains('category'))
          'subcategoryId': review!.category.subcategoryId,
        if (review?.category.tertiaryCategoryId != null && _acceptedFields.contains('category'))
          'tertiaryCategoryId': review!.category.tertiaryCategoryId,
      };

      if (_imagesDirty || _selectedNewImages.isNotEmpty || imageIds.isNotEmpty) {
        payload['imageIds'] = imageIds;
      }

      final updated = await repo.updateProduct(id, payload);
      _applyProduct(updated);
      _selectedNewImages.clear();
      _editedNewImages.clear();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم حفظ التصحيحات')),
      );
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
        title: const Text('مراجعة منتج موجود'),
        actions: [
          IconButton(
            tooltip: 'تحديث',
            onPressed: _loading || _saving ? null : _load,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null && _product == null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        FilledButton(onPressed: _load, child: const Text('إعادة المحاولة')),
                      ],
                    ),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 100),
                  children: [
                    _buildHeroCard(),
                    const SizedBox(height: 10),
                    _buildStatsRow(),
                    const SizedBox(height: 10),
                    _buildAiActions(),
                    if (_review != null) ...[
                      const SizedBox(height: 10),
                      _buildIssuesCard(),
                    ],
                    const SizedBox(height: 10),
                    _buildEditableFields(),
                    if (_review != null && _review!.images.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      _buildSuggestedImages(),
                    ],
                    const SizedBox(height: 10),
                    _buildCurrentImages(),
                  ],
                ),
      bottomNavigationBar: _product == null
          ? null
          : SafeArea(
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Color(0xFFECE7F0))),
                ),
                child: FilledButton.icon(
                  onPressed: _saving ? null : _save,
                  icon: _saving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.save_outlined),
                  label: Text(_saving ? 'جاري الحفظ…' : 'حفظ التصحيحات'),
                ),
              ),
            ),
    );
  }

  Widget _buildHeroCard() {
    final thumbBytes = _managedImages.isNotEmpty ? _managedImages.first.editedBytes : null;
    final thumbUrl = _managedImages.isNotEmpty ? _managedImages.first.displayUrl : null;
    final active = _product?['isActive'] == true;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 84,
                height: 84,
                child: thumbBytes != null
                    ? Image.memory(thumbBytes, fit: BoxFit.cover)
                    : thumbUrl == null
                        ? ColoredBox(
                            color: Colors.grey.shade100,
                            child: const Icon(Icons.image_not_supported_outlined),
                          )
                        : CachedNetworkImage(
                            imageUrl: thumbUrl,
                            fit: BoxFit.cover,
                            memCacheWidth: 200,
                            errorWidget: (_, __, ___) => ColoredBox(
                              color: Colors.grey.shade100,
                              child: const Icon(Icons.broken_image_outlined),
                            ),
                          ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _nameAr.text.trim().isNotEmpty ? _nameAr.text.trim() : (_product?['name']?.toString() ?? ''),
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15.5, height: 1.3),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.barcode,
                    style: const TextStyle(color: AppTheme.muted, fontSize: 12.5),
                    textDirection: TextDirection.ltr,
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _chip(active ? 'نشط' : 'موقوف', active ? AppTheme.success : Colors.orange.shade800),
                      if (_brandName != null) _chip(_brandName!, AppTheme.primaryDark),
                      if (_categoryPath != null) _chip(_categoryPath!, AppTheme.muted),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: color)),
    );
  }

  Widget _buildStatsRow() {
    final images = _managedImages.length;
    final shades = (_product?['shades'] is List) ? (_product!['shades'] as List).length : 0;
    return Row(
      children: [
        Expanded(child: _statTile('السعر', '${_price.text} د.ع')),
        const SizedBox(width: 8),
        Expanded(child: _statTile('المخزون', _stock.text)),
        const SizedBox(width: 8),
        Expanded(child: _statTile('صور', '$images')),
        const SizedBox(width: 8),
        Expanded(child: _statTile('درجات', '$shades')),
      ],
    );
  }

  Widget _statTile(String label, String value) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        child: Column(
          children: [
            Text(value, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.muted)),
          ],
        ),
      ),
    );
  }

  Widget _buildAiActions() {
    return SectionCard(
      title: 'مراجعة بالذكاء الاصطناعي',
      subtitle: 'الموديل يؤكد الاسم باللغتين ويقارن مع بيانات المتجر',
      icon: Icons.auto_awesome,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          FilledButton.icon(
            onPressed: _reviewing || _saving ? null : _runAiReview,
            icon: _reviewing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.fact_check_outlined),
            label: Text(_reviewing ? 'جاري تأكيد الاسم…' : 'فحص وتصحيح الاسم بالـ AI'),
          ),
          if (_review != null) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _saving ? null : _applyAllSuggestions,
              icon: const Icon(Icons.done_all),
              label: const Text('تطبيق كل اقتراحات التسمية/الوصف'),
            ),
            const SizedBox(height: 8),
            Text(
              'ثقة التعرّف: ${_review!.confidence.toStringAsFixed(0)}%'
              '${_review!.namesVerified ? ' · اسم مؤكَّد بالـ AI' : ''}'
              '${_review!.reviewNotes != null ? ' · ${_review!.reviewNotes}' : ''}',
              style: const TextStyle(fontSize: 12.5, color: AppTheme.muted),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildIssuesCard() {
    final issues = _review?.issues ?? [];
    if (issues.isEmpty) {
      return Card(
        color: const Color(0xFFEAF7F0),
        child: const ListTile(
          leading: Icon(Icons.verified_outlined, color: AppTheme.success),
          title: Text('لا ملاحظات جودة حرجة', style: TextStyle(fontWeight: FontWeight.w700)),
          subtitle: Text('يمكنك مع ذلك تحسين الاسم أو الصور يدوياً'),
        ),
      );
    }
    return SectionCard(
      title: 'ملاحظات التصحيح (${issues.length})',
      subtitle: 'اضغط قبول لتطبيق الاقتراح على الحقل',
      icon: Icons.rule_folder_outlined,
      child: Column(
        children: [
          for (final issue in issues)
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: issue.isHigh ? const Color(0xFFFFF1F0) : const Color(0xFFFFF8E8),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: issue.isHigh ? Colors.red.shade100 : Colors.amber.shade100,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Icon(
                        issue.isHigh ? Icons.error_outline : Icons.info_outline,
                        size: 18,
                        color: issue.isHigh ? Colors.red.shade700 : Colors.amber.shade800,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(issue.messageAr, style: const TextStyle(fontWeight: FontWeight.w700)),
                      ),
                      Text(
                        issue.severity,
                        style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                      ),
                    ],
                  ),
                  if (issue.current != null && issue.current!.trim().isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text('الحالي: ${issue.current}', style: const TextStyle(fontSize: 12.5, color: AppTheme.muted)),
                  ],
                  if (issue.suggested != null && issue.suggested!.trim().isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      'المقترح: ${issue.suggested}',
                      style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
                      maxLines: 4,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: FilledButton.tonal(
                        onPressed: () => _acceptIssue(issue),
                        child: const Text('قبول'),
                      ),
                    ),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEditableFields() {
    return SectionCard(
      title: 'بيانات قابلة للتعديل',
      icon: Icons.edit_note,
      child: Column(
        children: [
          TextField(
            controller: _nameAr,
            decoration: InputDecoration(
              labelText: 'الاسم عربي',
              helperText: _brandEnText.isNotEmpty || _brandArText.isNotEmpty
                  ? 'يبدأ بالبراند كما هو: ${ProductNaming.arabicTitleBrand(brandAr: _brandArText, brandEn: _brandEnText)}'
                  : 'البراند الإنجليزي يبقى إنجليزي في بداية الاسم',
              helperMaxLines: 2,
            ),
            maxLines: 2,
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _nameEn,
            decoration: const InputDecoration(labelText: 'English name'),
            maxLines: 2,
            textDirection: TextDirection.ltr,
          ),
          const SizedBox(height: 10),
          TextField(controller: _descAr, decoration: const InputDecoration(labelText: 'الوصف عربي'), maxLines: 4),
          const SizedBox(height: 10),
          TextField(
            controller: _descEn,
            decoration: const InputDecoration(labelText: 'English description'),
            maxLines: 4,
            textDirection: TextDirection.ltr,
          ),
          const SizedBox(height: 10),
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
          if (_review?.category.categoryId != null) ...[
            const SizedBox(height: 10),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('تطبيق تصنيف AI المقترح'),
              subtitle: Text(
                [
                  _review!.category.categoryNameAr,
                  if (_review!.category.subcategoryNamesAr.isNotEmpty)
                    _review!.category.subcategoryNamesAr.join(' · ')
                  else
                    _review!.category.subcategoryNameAr,
                  if (_review!.category.tertiaryNamesAr.isNotEmpty)
                    _review!.category.tertiaryNamesAr.join(' · ')
                  else
                    _review!.category.tertiaryNameAr,
                ].whereType<String>().where((s) => s.isNotEmpty).join(' › '),
                maxLines: 3,
              ),
              value: _acceptedFields.contains('category'),
              onChanged: (v) => setState(() {
                if (v) {
                  _acceptedFields.add('category');
                } else {
                  _acceptedFields.remove('category');
                }
              }),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSuggestedImages() {
    final images = _review!.images;
    return SectionCard(
      title: 'صور مقترحة من الباركود',
      subtitle: 'اختر ثم عدّل (قص/إطار أبيض) قبل الإضافة',
      icon: Icons.add_photo_alternate_outlined,
      child: SizedBox(
        height: 118,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: images.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (_, i) {
            final img = images[i];
            final selected = _selectedNewImages.contains(img.url);
            final edited = _editedNewImages[img.url];
            return SizedBox(
              width: 100,
              child: Stack(
                children: [
                  Positioned.fill(
                    child: InkWell(
                      onTap: () => setState(() {
                        if (selected) {
                          _selectedNewImages.remove(img.url);
                          _editedNewImages.remove(img.url);
                        } else {
                          _selectedNewImages.add(img.url);
                        }
                      }),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: selected ? AppTheme.primary : const Color(0xFFECE7F0),
                            width: selected ? 2 : 1,
                          ),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: edited != null
                            ? Image.memory(edited, fit: BoxFit.cover)
                            : CachedNetworkImage(
                                imageUrl: img.thumbUrl.isNotEmpty ? img.thumbUrl : img.url,
                                fit: BoxFit.cover,
                                memCacheWidth: 240,
                              ),
                      ),
                    ),
                  ),
                  if (selected)
                    Positioned(
                      top: 6,
                      left: 6,
                      child: CircleAvatar(
                        radius: 12,
                        backgroundColor: AppTheme.primary,
                        child: const Icon(Icons.check, size: 14, color: Colors.white),
                      ),
                    ),
                  if (selected)
                    Positioned(
                      bottom: 6,
                      right: 6,
                      child: Material(
                        color: Colors.black87,
                        borderRadius: BorderRadius.circular(16),
                        child: InkWell(
                          onTap: () async {
                            final result = await openProductImageEditor(
                              context,
                              imageUrl: edited == null ? img.url : null,
                              imageBytes: edited,
                            );
                            if (result != null && mounted) {
                              setState(() => _editedNewImages[img.url] = result.bytes);
                            }
                          },
                          borderRadius: BorderRadius.circular(16),
                          child: const Padding(
                            padding: EdgeInsets.all(6),
                            child: Icon(Icons.crop_rotate, size: 14, color: Colors.white),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _editManagedImage(int index) async {
    final img = _managedImages[index];
    final result = await openProductImageEditor(
      context,
      imageUrl: img.editedBytes == null ? img.displayUrl : null,
      imageBytes: img.editedBytes,
      title: 'تعديل صورة #${index + 1}',
    );
    if (result == null || !mounted) return;
    setState(() {
      img.editedBytes = result.bytes;
      _imagesDirty = true;
    });
  }

  Widget _buildCurrentImages() {
    return SectionCard(
      title: 'صور المنتج (${_managedImages.length})',
      subtitle: 'عرض · قص · إطار أبيض · حذف · إعادة ترتيب',
      icon: Icons.photo_library_outlined,
      child: _managedImages.isEmpty
          ? const Text('لا توجد صور محفوظة', style: TextStyle(color: AppTheme.muted))
          : Column(
              children: [
                SizedBox(
                  height: 148,
                  child: ReorderableListView.builder(
                    scrollDirection: Axis.horizontal,
                    buildDefaultDragHandles: false,
                    onReorder: (oldIndex, newIndex) {
                      setState(() {
                        if (newIndex > oldIndex) newIndex -= 1;
                        final item = _managedImages.removeAt(oldIndex);
                        _managedImages.insert(newIndex, item);
                        _imagesDirty = true;
                      });
                    },
                    itemCount: _managedImages.length,
                    itemBuilder: (context, index) {
                      final img = _managedImages[index];
                      return ReorderableDelayedDragStartListener(
                        key: ValueKey('img-$index-${img.mediaId ?? img.displayUrl}'),
                        index: index,
                        child: Padding(
                          padding: const EdgeInsets.only(left: 10),
                          child: SizedBox(
                            width: 120,
                            child: Column(
                              children: [
                                Expanded(
                                  child: Stack(
                                    children: [
                                      Positioned.fill(
                                        child: Material(
                                          color: const Color(0xFFF7F5F9),
                                          borderRadius: BorderRadius.circular(14),
                                          clipBehavior: Clip.antiAlias,
                                          child: InkWell(
                                            onTap: () => _editManagedImage(index),
                                            child: img.editedBytes != null
                                                ? Image.memory(img.editedBytes!, fit: BoxFit.cover)
                                                : CachedNetworkImage(
                                                    imageUrl: img.displayUrl,
                                                    fit: BoxFit.cover,
                                                    memCacheWidth: 320,
                                                    errorWidget: (_, __, ___) => const Icon(Icons.broken_image_outlined),
                                                  ),
                                          ),
                                        ),
                                      ),
                                      Positioned(
                                        top: 6,
                                        left: 6,
                                        child: CircleAvatar(
                                          radius: 12,
                                          backgroundColor: AppTheme.primary,
                                          child: Text(
                                            '${index + 1}',
                                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                                          ),
                                        ),
                                      ),
                                      if (img.isEdited)
                                        Positioned(
                                          bottom: 6,
                                          left: 6,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: AppTheme.success,
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: const Text(
                                              'معدّلة',
                                              style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                                            ),
                                          ),
                                        ),
                                      Positioned(
                                        top: 4,
                                        right: 4,
                                        child: IconButton.filledTonal(
                                          style: IconButton.styleFrom(
                                            backgroundColor: Colors.black87,
                                            foregroundColor: Colors.white,
                                            minimumSize: const Size(32, 32),
                                            padding: EdgeInsets.zero,
                                          ),
                                          onPressed: () => setState(() {
                                            _managedImages.removeAt(index);
                                            _imagesDirty = true;
                                          }),
                                          icon: const Icon(Icons.close, size: 16),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton(
                                        onPressed: () => _editManagedImage(index),
                                        style: OutlinedButton.styleFrom(
                                          padding: EdgeInsets.zero,
                                          minimumSize: const Size.fromHeight(32),
                                          visualDensity: VisualDensity.compact,
                                        ),
                                        child: const Text('تعديل', style: TextStyle(fontSize: 11)),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'اضغط مطوّلاً واسحب لإعادة الترتيب · تعديل = قص أو إطار أبيض',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                ),
              ],
            ),
    );
  }
}
