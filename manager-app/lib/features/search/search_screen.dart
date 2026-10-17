import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/scanner_bus.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../product/product_screen.dart';
import '../scan/lookup_flow.dart';

/// فلتر مبدئي عند الفتح من بطاقات الرئيسية.
class SearchPreset {
  const SearchPreset({this.status = 'all', this.filter, this.brandId, this.brandName});
  final String status;
  final String? filter;
  final String? brandId;
  final String? brandName;
}

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key, this.preset, this.autofocus = false, this.embedded = false, this.initialQuery, this.onPick});

  /// وضع الاختيار: الضغط على منتج يرجعه بدل فتحه.
  final void Function(ProductSummary)? onPick;
  final SearchPreset? preset;
  final String? initialQuery;
  final bool autofocus;

  /// داخل تبويب الصفحة الرئيسية (بلا زر رجوع).
  final bool embedded;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final _q = TextEditingController(text: widget.initialQuery);
  final _scroll = ScrollController();
  Timer? _debounce;
  late String _status = widget.preset?.status ?? 'all';
  late String? _filter = widget.preset?.filter;
  late NamedRef? _brand = widget.preset?.brandId == null ? null : NamedRef(widget.preset!.brandId!, widget.preset!.brandName ?? '');

  final _items = <ProductSummary>[];
  int _total = 0;
  int _page = 1;
  bool _hasNext = false;
  bool _loading = false;
  Object? _error;
  int _seq = 0;
  int _seenVersion = 0;
  final _sel = <String>{};

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 600) _more();
    });
    _seenVersion = ref.read(dataVersionProvider);
    _reload();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _q.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _onChanged(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 320), _reload);
    setState(() {});
  }

  Future<void> _reload() async {
    final seq = ++_seq;
    setState(() {
      _loading = true;
      _error = null;
      _page = 1;
    });
    try {
      final r = await ref.read(repoProvider).search(q: _q.text, status: _status, filter: _filter, brandId: _brand?.id, page: 1);
      if (seq != _seq || !mounted) return;
      setState(() {
        _items
          ..clear()
          ..addAll(r.items);
        _total = r.total;
        _hasNext = r.hasNext;
      });
    } catch (e) {
      if (seq == _seq && mounted) setState(() => _error = e);
    } finally {
      if (seq == _seq && mounted) setState(() => _loading = false);
    }
  }

  Future<void> _more() async {
    if (_loading || !_hasNext) return;
    final seq = _seq;
    setState(() => _loading = true);
    try {
      final r = await ref.read(repoProvider).search(q: _q.text, status: _status, filter: _filter, brandId: _brand?.id, page: _page + 1);
      if (seq != _seq || !mounted) return;
      setState(() {
        _page += 1;
        final seen = _items.map((e) => e.id).toSet();
        _items.addAll(r.items.where((e) => !seen.contains(e.id)));
        _hasNext = r.hasNext;
      });
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _submit(String v) {
    final t = v.trim();
    if (t.isEmpty) return;
    // باركود مطابق تماماً لمنتج واحد → افتحه مباشرة
    final exact = _items.where((e) => e.exactBarcode || e.matchedShades.any((s) => s.barcode == normalizeCode(t))).toList();
    if (looksLikeBarcode(t) && (exact.length == 1 || _items.isEmpty)) {
      openCode(context, ref, t, source: ScanSource.typed);
    }
  }

  Future<void> _open(ProductSummary p, {String? shadeId}) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ProductScreen(productId: p.id, highlightShadeId: shadeId),
      ),
    );
  }

  Future<void> _bulk(bool active) async {
    final ids = _sel.toList();
    if (!active &&
        !await confirm(context, title: 'إيقاف ${ids.length} منتج؟', message: 'ستختفي كلها من التطبيق فوراً.', ok: 'إيقاف', danger: true)) {
      return;
    }
    try {
      final n = await ref.read(repoProvider).bulkProducts(ids, active);
      if (!mounted) return;
      setState(() {
        for (final p in _items) {
          if (_sel.contains(p.id)) p.isActive = active;
        }
        _sel.clear();
      });
      ref.read(dataVersionProvider.notifier).state++;
      _seenVersion = ref.read(dataVersionProvider);
      ref.invalidate(statsProvider);
      toast(context, active ? 'شُغّل $n منتج' : 'أُوقف $n منتج');
    } catch (e) {
      if (mounted) toastError(context, e);
    }
  }

  Future<void> _toggle(ProductSummary p, bool v) async {
    if (!v && !await confirm(context, title: 'إيقاف «${p.name}»؟', message: 'سيختفي من التطبيق فوراً.', ok: 'إيقاف', danger: true)) return;
    setState(() => p.isActive = v);
    try {
      await ref.read(repoProvider).patchProduct(p.id, {'isActive': v});
      ref.read(dataVersionProvider.notifier).state++;
      _seenVersion = ref.read(dataVersionProvider);
      if (mounted) toast(context, v ? 'شُغّل المنتج' : 'أُوقف المنتج');
    } catch (e) {
      if (mounted) {
        setState(() => p.isActive = !v);
        toastError(context, e);
      }
    }
  }

  Future<void> _toggleShade(MatchedShade s, bool v) async {
    setState(() => s.isActive = v);
    try {
      await ref.read(repoProvider).patchShade(s.id, {'isActive': v});
      ref.read(dataVersionProvider.notifier).state++;
      _seenVersion = ref.read(dataVersionProvider);
      if (mounted) toast(context, v ? 'شُغّل «${s.name}»' : 'أُوقف «${s.name}»');
    } catch (e) {
      if (mounted) {
        setState(() => s.isActive = !v);
        toastError(context, e);
      }
    }
  }

  Future<void> _pickBrand() async {
    final brands = await ref.read(brandsProvider.future);
    if (!mounted) return;
    final picked = await showModalBottomSheet<NamedRef?>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _BrandPicker(brands: brands),
    );
    if (picked == null) return;
    setState(() => _brand = picked.id.isEmpty ? null : picked);
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    // عودة من صفحة منتج عدّلناه → حدّث القائمة
    final version = ref.watch(dataVersionProvider);
    if (version != _seenVersion) {
      _seenVersion = version;
      WidgetsBinding.instance.addPostFrameCallback((_) => _reload());
    }
    const filters = [
      ('all', null, 'الكل'),
      ('active', null, 'ظاهر'),
      ('inactive', null, 'موقوف'),
      ('all', 'shadesOff', 'فيه تدرج موقوف'),
      ('all', 'noImages', 'بلا صور'),
      ('all', 'outOfStock', 'نافد'),
      ('all', 'noBarcode', 'بلا باركود'),
      ('active', 'lowStock', 'مخزون قليل'),
      ('inactive', 'ready', 'موقوف وجاهز للعرض'),
      ('active', 'noCategory', 'بلا قسم'),
      ('active', 'noDescription', 'بلا وصف'),
    ];
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: !widget.embedded,
        backgroundColor: _sel.isEmpty ? null : AppColors.primarySoft,
        leading: _sel.isEmpty ? null : IconButton(onPressed: () => setState(_sel.clear), icon: const Icon(Icons.close_rounded)),
        title: Text(_sel.isEmpty ? 'المنتجات' : '${_sel.length} محدد'),
        actions: _sel.isEmpty
            ? null
            : [
                IconButton(
                  tooltip: 'تحديد الكل',
                  onPressed: () => setState(() => _sel.addAll(_items.map((e) => e.id))),
                  icon: const Icon(Icons.select_all_rounded),
                ),
                TextButton(
                  onPressed: () => _bulk(true),
                  child: const Text(
                    'تشغيل',
                    style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w800),
                  ),
                ),
                TextButton(
                  onPressed: () => _bulk(false),
                  child: const Text(
                    'إيقاف',
                    style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800),
                  ),
                ),
              ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(118),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Column(
              children: [
                TextField(
                  controller: _q,
                  autofocus: widget.autofocus,
                  onChanged: _onChanged,
                  onSubmitted: _submit,
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: 'اسم، براند، باركود، أو اسم تدرج...',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: _q.text.isEmpty
                        ? null
                        : IconButton(
                            onPressed: () {
                              _q.clear();
                              _reload();
                            },
                            icon: const Icon(Icons.close_rounded),
                          ),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      Padding(
                        padding: const EdgeInsetsDirectional.only(end: 8),
                        child: ActionChip(
                          avatar: Icon(Icons.sell_outlined, size: 17, color: _brand != null ? Colors.white : AppColors.primary),
                          label: Text(_brand?.name ?? 'البراند', style: TextStyle(color: _brand != null ? Colors.white : AppColors.ink)),
                          backgroundColor: _brand != null ? AppColors.primary : Colors.white,
                          onPressed: _pickBrand,
                        ),
                      ),
                      // فلتر جاء من الرئيسية أو صحة المتجر وليس ضمن الأزرار: نُظهره محدداً مع زر إزالة.
                      if (!filters.any((f) => f.$1 == _status && f.$2 == _filter))
                        Padding(
                          padding: const EdgeInsetsDirectional.only(end: 8),
                          child: InputChip(
                            selected: true,
                            showCheckmark: false,
                            selectedColor: AppColors.primarySoft,
                            label: Text(
                              [
                                if (_status == 'active') 'ظاهر',
                                if (_status == 'inactive') 'موقوف',
                                if (_filter != null) filters.firstWhere((f) => f.$2 == _filter, orElse: () => ('', _filter, _filter!)).$3,
                              ].join(' · '),
                            ),
                            onDeleted: () {
                              setState(() => (_status = 'all', _filter = null));
                              _reload();
                            },
                          ),
                        ),
                      for (final f in filters)
                        Padding(
                          padding: const EdgeInsetsDirectional.only(end: 8),
                          child: ChoiceChip(
                            label: Text(f.$3),
                            selected: _status == f.$1 && _filter == f.$2,
                            showCheckmark: false,
                            selectedColor: AppColors.primarySoft,
                            onSelected: (_) {
                              setState(() {
                                _status = f.$1;
                                _filter = f.$2;
                              });
                              _reload();
                            },
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: _error != null && _items.isEmpty
            ? ListView(children: [ErrorView(_error!, onRetry: _reload)])
            : !_loading && _items.isEmpty
            ? ListView(
                children: [
                  EmptyState(
                    icon: Icons.inventory_2_outlined,
                    title: _q.text.isEmpty ? 'لا توجد منتجات بهذا الفلتر' : 'لا نتائج لـ «${_q.text}»',
                    message: looksLikeBarcode(_q.text) ? 'الباركود غير موجود في التطبيق' : null,
                    action: looksLikeBarcode(_q.text)
                        ? FilledButton.icon(
                            onPressed: () => openCode(context, ref, _q.text),
                            icon: const Icon(Icons.bookmark_add_rounded),
                            label: const Text('احفظه في مجموعة'),
                          )
                        : null,
                  ),
                ],
              )
            : ListView.separated(
                controller: _scroll,
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                itemCount: _items.length + 1,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  if (i == 0) {
                    return Row(
                      children: [
                        Text(
                          '${numFmt(_total)} منتج',
                          style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700),
                        ),
                        const Spacer(),
                        if (_loading) const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                      ],
                    );
                  }
                  final p = _items[i - 1];
                  return ProductTile(
                    product: p,
                    selected: _sel.isEmpty ? null : _sel.contains(p.id),
                    onLongPress: () => setState(() => _sel.contains(p.id) ? _sel.remove(p.id) : _sel.add(p.id)),
                    onTap: () => widget.onPick != null
                        ? widget.onPick!(p)
                        : _sel.isEmpty
                        ? _open(p)
                        : setState(() => _sel.contains(p.id) ? _sel.remove(p.id) : _sel.add(p.id)),
                    onToggle: (v) => _toggle(p, v),
                    onShadeTap: (s) => _open(p, shadeId: s.id),
                    onShadeToggle: _toggleShade,
                  );
                },
              ),
      ),
    );
  }
}

class ProductTile extends StatelessWidget {
  const ProductTile({
    super.key,
    required this.product,
    required this.onTap,
    required this.onToggle,
    this.onShadeTap,
    this.onShadeToggle,
    this.onLongPress,
    this.selected,
  });
  final ProductSummary product;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  /// null = خارج وضع التحديد.
  final bool? selected;
  final ValueChanged<bool> onToggle;
  final void Function(MatchedShade)? onShadeTap;
  final void Function(MatchedShade, bool)? onShadeToggle;

  @override
  Widget build(BuildContext context) {
    final p = product;
    return GestureDetector(
      onLongPress: onLongPress,
      child: Panel(
        padding: const EdgeInsets.all(10),
        onTap: onTap,
        color: selected == true
            ? AppColors.primarySoft
            : p.isActive
            ? Colors.white
            : const Color(0xFFFCF7F7),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Stack(
                  children: [
                    NetImg(p.thumb, size: 74, fit: BoxFit.contain),
                    if (!p.isActive)
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(color: const Color(0x88FFFFFF), borderRadius: BorderRadius.circular(12)),
                          child: const Icon(Icons.visibility_off_rounded, color: AppColors.danger),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w700, height: 1.45),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        [p.brand?.name, money(p.price)].whereType<String>().join(' · '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          if (p.exactBarcode)
                            const Pill(
                              'مطابقة الباركود',
                              color: AppColors.info,
                              bg: AppColors.infoSoft,
                              small: true,
                              icon: Icons.qr_code_rounded,
                            ),
                          if (p.stock <= 0) const Pill('نافد', color: AppColors.danger, bg: AppColors.dangerSoft, small: true),
                          if (p.imageCount == 0)
                            const Pill(
                              'بلا صور',
                              color: AppColors.warning,
                              bg: AppColors.warningSoft,
                              small: true,
                              icon: Icons.image_not_supported_outlined,
                            ),
                          if (p.shadeCount > 0)
                            Pill(
                              p.shadesOff > 0 ? '${p.shadeCount} تدرج · ${p.shadesOff} موقوف' : '${p.shadeCount} تدرج',
                              color: p.shadesOff > 0 ? AppColors.rose : AppColors.primary,
                              bg: p.shadesOff > 0 ? AppColors.roseSoft : AppColors.primaryLight,
                              small: true,
                              icon: Icons.palette_outlined,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                Column(
                  children: [
                    Switch(value: p.isActive, onChanged: onToggle),
                    Text(
                      p.isActive ? 'ظاهر' : 'موقوف',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: p.isActive ? AppColors.success : AppColors.danger),
                    ),
                  ],
                ),
              ],
            ),
            if (p.matchedShades.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
                child: Column(
                  children: [
                    for (final s in p.matchedShades)
                      InkWell(
                        onTap: onShadeTap == null ? null : () => onShadeTap!(s),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(10, 2, 4, 2),
                          child: Row(
                            children: [
                              Swatch(hex: s.colorHex, hexEnd: s.colorHexEnd, size: 26, off: !s.isActive),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      s.name,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13.5,
                                        decoration: s.isActive ? null : TextDecoration.lineThrough,
                                      ),
                                    ),
                                    if (s.barcode != null)
                                      Text(
                                        s.barcode!,
                                        textDirection: TextDirection.ltr,
                                        style: const TextStyle(fontSize: 11.5, color: AppColors.muted),
                                      ),
                                  ],
                                ),
                              ),
                              Text(
                                s.stock > 0 ? '${s.stock}' : 'نافد',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: s.stock > 0 ? AppColors.success : AppColors.danger,
                                ),
                              ),
                              Transform.scale(
                                scale: .82,
                                child: Switch(value: s.isActive, onChanged: onShadeToggle == null ? null : (v) => onShadeToggle!(s, v)),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ] else if (p.shadePreview.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  for (final d in p.shadePreview)
                    Padding(
                      padding: const EdgeInsetsDirectional.only(end: 4),
                      child: Swatch(hex: d.colorHex, hexEnd: d.colorHexEnd, size: 18, off: !d.isActive),
                    ),
                  if (p.shadeCount > p.shadePreview.length)
                    Text(
                      ' +${p.shadeCount - p.shadePreview.length}',
                      textDirection: TextDirection.ltr,
                      style: const TextStyle(color: AppColors.muted, fontSize: 12),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _BrandPicker extends StatefulWidget {
  const _BrandPicker({required this.brands});
  final List<NamedRef> brands;
  @override
  State<_BrandPicker> createState() => _BrandPickerState();
}

class _BrandPickerState extends State<_BrandPicker> {
  String _q = '';
  @override
  Widget build(BuildContext context) {
    final list = widget.brands.where((b) => b.name.toLowerCase().contains(_q.toLowerCase())).toList();
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * .75,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: TextField(
              autofocus: true,
              onChanged: (v) => setState(() => _q = v),
              decoration: const InputDecoration(hintText: 'ابحث عن براند', prefixIcon: Icon(Icons.search_rounded)),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.clear_all_rounded),
            title: const Text('كل البراندات', style: TextStyle(fontWeight: FontWeight.w700)),
            onTap: () => Navigator.pop(context, NamedRef('', '')),
          ),
          const Divider(),
          Expanded(
            child: ListView.builder(
              itemCount: list.length,
              itemBuilder: (_, i) => ListTile(title: Text(list[i].name), onTap: () => Navigator.pop(context, list[i])),
            ),
          ),
        ],
      ),
    );
  }
}
