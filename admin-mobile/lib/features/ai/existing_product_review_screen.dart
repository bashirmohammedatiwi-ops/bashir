import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/ai_model_prefs.dart';
import '../../models/ai_autofill.dart';
import '../../repositories/ai_product_repository.dart';
import '../../repositories/product_repository.dart';
import '../../widgets/section_card.dart';

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
  }

  List<Map<String, dynamic>> get _currentImages {
    final list = _product?['images'];
    if (list is! List) return [];
    return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  String? _mediaUrl(Map<String, dynamic> image) {
    final media = image['media'];
    if (media is Map) {
      return (media['url'] ?? media['thumbnailUrl'])?.toString();
    }
    return image['url']?.toString();
  }

  String? get _brandName {
    final brand = _product?['brand'];
    if (brand is Map) return (brand['name'] ?? brand['nameAr'])?.toString();
    return null;
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
      if (r.descriptionAr.trim().isNotEmpty) {
        _descAr.text = r.descriptionAr;
        _acceptedFields.add('descriptionAr');
      }
      if (r.descriptionEn.trim().isNotEmpty) {
        _descEn.text = r.descriptionEn;
        _acceptedFields.add('descriptionEn');
      }
      _acceptedFields.add('brand');
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

      // Keep existing image IDs; append newly selected uploaded images
      final existingImageIds = _currentImages
          .map((e) {
            final media = e['media'];
            if (media is Map) return media['id']?.toString();
            return e['mediaId']?.toString() ?? e['id']?.toString();
          })
          .whereType<String>()
          .where((s) => s.isNotEmpty)
          .toList();

      final newIds = <String>[];
      for (final url in _selectedNewImages) {
        final mid = await repo.uploadImageFromUrl(url);
        if (mid != null && mid.isNotEmpty) newIds.add(mid);
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
        if (review?.category.subcategoryId != null && _acceptedFields.contains('category'))
          'subcategoryId': review!.category.subcategoryId,
        if (review?.category.tertiaryCategoryId != null && _acceptedFields.contains('category'))
          'tertiaryCategoryId': review!.category.tertiaryCategoryId,
      };

      if (newIds.isNotEmpty) {
        payload['imageIds'] = [...existingImageIds, ...newIds];
      }

      final updated = await repo.updateProduct(id, payload);
      _applyProduct(updated);
      _selectedNewImages.clear();
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
    final thumb = _currentImages.isNotEmpty ? _mediaUrl(_currentImages.first) : null;
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
                child: thumb == null
                    ? ColoredBox(
                        color: Colors.grey.shade100,
                        child: const Icon(Icons.image_not_supported_outlined),
                      )
                    : CachedNetworkImage(imageUrl: thumb, fit: BoxFit.cover),
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
    final images = _currentImages.length;
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
      subtitle: 'يفحص الباركود ويقارن مع بيانات المتجر ويقترح تصحيحاً',
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
            label: Text(_reviewing ? 'جاري المراجعة…' : 'فحص وتصحيح بالـ AI'),
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
              '${_review!.usedWebSearch ? ' · بحث ويب' : ''}'
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
          TextField(controller: _nameAr, decoration: const InputDecoration(labelText: 'الاسم عربي'), maxLines: 2),
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
                  _review!.category.subcategoryNameAr,
                  _review!.category.tertiaryNameAr,
                ].whereType<String>().where((s) => s.isNotEmpty).join(' › '),
                maxLines: 2,
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
      subtitle: 'اختر صوراً لإضافتها للمنتج عند الحفظ',
      icon: Icons.add_photo_alternate_outlined,
      child: SizedBox(
        height: 110,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: images.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (_, i) {
            final img = images[i];
            final selected = _selectedNewImages.contains(img.url);
            return InkWell(
              onTap: () => setState(() {
                if (selected) {
                  _selectedNewImages.remove(img.url);
                } else {
                  _selectedNewImages.add(img.url);
                }
              }),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: 96,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: selected ? AppTheme.primary : const Color(0xFFECE7F0),
                    width: selected ? 2 : 1,
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CachedNetworkImage(
                      imageUrl: img.thumbUrl.isNotEmpty ? img.thumbUrl : img.url,
                      fit: BoxFit.cover,
                    ),
                    if (selected)
                      const Align(
                        alignment: Alignment.topLeft,
                        child: Padding(
                          padding: EdgeInsets.all(6),
                          child: CircleAvatar(
                            radius: 12,
                            backgroundColor: AppTheme.primary,
                            child: Icon(Icons.check, size: 14, color: Colors.white),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildCurrentImages() {
    final images = _currentImages;
    return SectionCard(
      title: 'صور المنتج الحالية (${images.length})',
      icon: Icons.photo_library_outlined,
      child: images.isEmpty
          ? const Text('لا توجد صور محفوظة', style: TextStyle(color: AppTheme.muted))
          : SizedBox(
              height: 96,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: images.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final url = _mediaUrl(images[i]);
                  return ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: url == null
                        ? ColoredBox(color: Colors.grey.shade100, child: const SizedBox(width: 96, height: 96))
                        : CachedNetworkImage(imageUrl: url, width: 96, height: 96, fit: BoxFit.cover),
                  );
                },
              ),
            ),
    );
  }
}
