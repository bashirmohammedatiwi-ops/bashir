import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/format.dart';
import '../../core/photos.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../widgets/common.dart';
import '../product/product_screen.dart';

/// بحث صور مثل Google Images: شريط بحث قابل للتعديل، اقتراحات، صفحات بلا نهاية،
/// معاينة كاملة، والبحث بصورة المنتج (مثل Google Lens).
///
/// [pick]: وضع الاختيار (إضافة صور لمنتج) يُرجع الصور المختارة؛ بدونه للاستكشاف فقط.
class WebImageSearchScreen extends ConsumerStatefulWidget {
  const WebImageSearchScreen({super.key, this.name, this.barcode, this.pick = true, this.single = false, this.startWithLens = false});
  final String? name, barcode;
  final bool pick, single, startWithLens;

  @override
  ConsumerState<WebImageSearchScreen> createState() => _WebImageSearchScreenState();
}

class _WebImageSearchScreenState extends ConsumerState<WebImageSearchScreen> {
  late final _q = TextEditingController(text: _initialQuery());
  final _focus = FocusNode();
  final _scroll = ScrollController();
  final _items = <WebImage>[];
  final _sel = <WebImage>[];
  int _page = 0, _seq = 0;
  bool _loading = false, _hasMore = false, _lensBusy = false;
  Object? _error;

  /// من البحث بالصورة.
  VisualResult? _lens;

  String get _code => normalizeCode(widget.barcode ?? '').replaceAll(RegExp(r'[^0-9A-Za-z]'), '');

  String _initialQuery() {
    final n = (widget.name ?? '').trim();
    if (n.isNotEmpty) return n;
    return normalizeCode(widget.barcode ?? '');
  }

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.extentAfter < 900) _more();
    });
    if (widget.startWithLens) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _lensSearch());
    } else if (_q.text.trim().length >= 2) {
      _search();
    }
  }

  @override
  void dispose() {
    _q.dispose();
    _focus.dispose();
    _scroll.dispose();
    super.dispose();
  }

  /// اقتراحات سريعة مثل «عمليات بحث ذات صلة» في Google.
  List<String> get _suggestions {
    final n = (widget.name ?? '').trim();
    final lens = _lens;
    final out = <String>[
      if (lens != null && lens.g('queryAr').isNotEmpty) lens.g('queryAr'),
      if (lens != null && lens.title.isNotEmpty) [lens.g('brand'), lens.g('name'), lens.g('variant')].where((x) => x.isNotEmpty).join(' '),
      if (n.isNotEmpty) n,
      if (_code.length >= 6) _code,
      if (n.isNotEmpty) '$n packshot',
      if (n.isNotEmpty) '$n white background',
      if (n.isNotEmpty && _code.length >= 6) '$n $_code',
    ];
    final seen = <String>{};
    return out.where((s) => s.trim().length >= 2 && seen.add(s.trim().toLowerCase())).toList();
  }

  Future<void> _search([String? text]) async {
    if (text != null) _q.text = text;
    final q = _q.text.trim();
    if (q.length < 2) return toast(context, 'اكتب كلمة البحث', error: true);
    _focus.unfocus();
    final seq = ++_seq;
    setState(() {
      _loading = true;
      _error = null;
      _items.clear();
      _page = 0;
      _hasMore = false;
    });
    try {
      final r = await ref.read(repoProvider).webImageSearch(q);
      if (!mounted || seq != _seq) return;
      setState(() {
        _items.addAll(r.items);
        _hasMore = r.hasMore;
      });
      if (_scroll.hasClients) _scroll.jumpTo(0);
    } catch (e) {
      if (mounted && seq == _seq) setState(() => _error = e);
    } finally {
      if (mounted && seq == _seq) setState(() => _loading = false);
    }
  }

  Future<void> _more() async {
    if (_loading || !_hasMore || _items.isEmpty) return;
    final seq = _seq;
    setState(() => _loading = true);
    try {
      final r = await ref.read(repoProvider).webImageSearch(_q.text.trim(), page: _page + 1);
      if (!mounted || seq != _seq) return;
      final have = _items.toSet();
      setState(() {
        _page++;
        _items.addAll(r.items.where((x) => !have.contains(x)));
        _hasMore = r.hasMore && r.items.isNotEmpty;
      });
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted && seq == _seq) setState(() => _loading = false);
    }
  }

  /// مثل Google Lens: صوّر المنتج أو اختر صورة.
  Future<void> _lensSearch() async {
    final src = await askPhotoSource(context, title: 'ابحث بصورة المنتج');
    if (src == null) {
      if (widget.startWithLens && _items.isEmpty && _lens == null && mounted) Navigator.pop(context);
      return;
    }
    final bytes = await pickLensPhoto(src);
    if (bytes == null || !mounted) return;
    final seq = ++_seq;
    setState(() {
      _lensBusy = true;
      _error = null;
      _items.clear();
      _lens = null;
    });
    try {
      final r = await ref.read(repoProvider).visualSearch(bytes);
      if (!mounted || seq != _seq) return;
      setState(() {
        _lens = r;
        _q.text = r.query;
        _items.addAll(r.images);
        _page = 0;
        _hasMore = r.hasMore;
      });
    } catch (e) {
      if (mounted && seq == _seq) setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _lensBusy = false);
    }
  }

  void _tap(WebImage img) {
    if (!widget.pick) {
      _preview(_items.indexOf(img));
      return;
    }
    if (widget.single) {
      Navigator.pop(context, [img]);
      return;
    }
    HapticFeedback.selectionClick();
    setState(() => _sel.contains(img) ? _sel.remove(img) : _sel.add(img));
  }

  Future<void> _preview(int index) async {
    final picked = await Navigator.of(context).push<WebImage>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => _Preview(items: _items, index: index, pick: widget.pick, selected: _sel),
      ),
    );
    if (picked == null || !mounted) return;
    if (widget.single) {
      Navigator.pop(context, [picked]);
    } else if (!_sel.contains(picked)) {
      setState(() => _sel.add(picked));
    }
  }

  @override
  Widget build(BuildContext context) {
    final lens = _lens;
    final suggestions = _suggestions;
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        titleSpacing: 0,
        title: Padding(
          padding: const EdgeInsetsDirectional.only(end: 8),
          child: TextField(
            controller: _q,
            focusNode: _focus,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _search(),
            decoration: InputDecoration(
              hintText: 'ابحث عن صور المنتج',
              isDense: true,
              filled: true,
              fillColor: AppColors.scaffold,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(28), borderSide: BorderSide.none),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(28), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(28),
                borderSide: const BorderSide(color: AppColors.primary),
              ),
              prefixIcon: IconButton(tooltip: 'بحث', onPressed: _search, icon: const Icon(Icons.search_rounded)),
              suffixIcon: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_q.text.isNotEmpty)
                    IconButton(
                      tooltip: 'مسح',
                      onPressed: () {
                        _q.clear();
                        _focus.requestFocus();
                        setState(() {});
                      },
                      icon: const Icon(Icons.close_rounded, size: 20),
                    ),
                  IconButton(
                    tooltip: 'ابحث بصورة',
                    onPressed: _lensBusy ? null : _lensSearch,
                    icon: const Icon(Icons.center_focus_strong_rounded, color: AppColors.primary),
                  ),
                ],
              ),
            ),
            onChanged: (_) => setState(() {}),
          ),
        ),
      ),
      bottomNavigationBar: widget.pick && !widget.single && _sel.isNotEmpty
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: Row(
                  children: [
                    TextButton(onPressed: () => setState(_sel.clear), child: const Text('إلغاء التحديد')),
                    const Spacer(),
                    FilledButton.icon(
                      onPressed: () => Navigator.pop(context, [..._sel]),
                      icon: const Icon(Icons.add_photo_alternate_rounded),
                      label: Text('إضافة ${arCount(_sel.length, one: 'صورة', two: 'صورتين', few: 'صور', many: 'صورة')}'),
                    ),
                  ],
                ),
              ),
            )
          : null,
      body: _lensBusy
          ? const _LensBusy()
          : CustomScrollView(
              controller: _scroll,
              slivers: [
                if (suggestions.isNotEmpty)
                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: 48,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        children: [
                          for (final s in suggestions)
                            Padding(
                              padding: const EdgeInsetsDirectional.only(end: 8),
                              child: ActionChip(
                                label: Text(s, style: const TextStyle(fontSize: 12.5)),
                                avatar: Icon(RegExp(r'^\d{6,}$').hasMatch(s) ? Icons.qr_code_rounded : Icons.search_rounded, size: 16),
                                backgroundColor: s == _q.text.trim() ? AppColors.primarySoft : AppColors.scaffold,
                                side: BorderSide.none,
                                onPressed: () => _search(s),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                if (lens != null)
                  SliverToBoxAdapter(
                    child: _LensCard(result: lens, onRetry: _lensSearch),
                  ),
                if (_error != null && _items.isEmpty)
                  SliverFillRemaining(hasScrollBody: false, child: ErrorView(_error!, onRetry: _q.text.isEmpty ? _lensSearch : _search))
                else if (_loading && _items.isEmpty)
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [CircularProgressIndicator(), SizedBox(height: 12), Text('نبحث في الويب…')],
                      ),
                    ),
                  )
                else if (_items.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: EmptyState(
                      icon: Icons.image_search_rounded,
                      title: _q.text.trim().isEmpty ? 'ابحث بالاسم أو صوّر المنتج' : 'لا صور لهذا البحث',
                      message: _q.text.trim().isEmpty
                          ? 'اكتب اسم المنتج، أو اضغط زر العدسة لتصوير العلبة ونتعرّف عليها.'
                          : 'جرّب الاسم بالإنجليزي، أو أحد الاقتراحات أعلاه، أو ابحث بصورة.',
                      action: FilledButton.icon(
                        onPressed: _lensSearch,
                        icon: const Icon(Icons.center_focus_strong_rounded),
                        label: const Text('ابحث بصورة'),
                      ),
                    ),
                  )
                else ...[
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 6),
                      child: Text(
                        widget.pick
                            ? '${numFmt(_items.length)}${_hasMore ? '+' : ''} صورة · اضغط للاختيار، مطولاً للمعاينة'
                            : '${numFmt(_items.length)}${_hasMore ? '+' : ''} صورة',
                        style: const TextStyle(color: AppColors.muted, fontSize: 12),
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    sliver: SliverGrid(
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: MediaQuery.sizeOf(context).width > 600 ? 4 : 3,
                        mainAxisSpacing: 6,
                        crossAxisSpacing: 6,
                        childAspectRatio: .78,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => _Tile(
                          img: _items[i],
                          selected: _sel.contains(_items[i]),
                          onTap: () => _tap(_items[i]),
                          onLongPress: () => _preview(i),
                        ),
                        childCount: _items.length,
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Center(
                        child: _loading
                            ? const CircularProgressIndicator()
                            : _hasMore
                            ? TextButton(onPressed: _more, child: const Text('المزيد من النتائج'))
                            : const Text('نهاية النتائج', style: TextStyle(color: AppColors.muted)),
                      ),
                    ),
                  ),
                ],
              ],
            ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.img, required this.selected, required this.onTap, required this.onLongPress});
  final WebImage img;
  final bool selected;
  final VoidCallback onTap, onLongPress;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    onLongPress: onLongPress,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: Stack(
            fit: StackFit.expand,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                decoration: BoxDecoration(
                  color: AppColors.scaffold,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: selected ? AppColors.primary : Colors.transparent, width: 3),
                ),
                child: NetImg(img.thumb ?? img.url, radius: 8, fit: BoxFit.cover),
              ),
              if (selected)
                const PositionedDirectional(
                  top: 6,
                  end: 6,
                  child: CircleAvatar(
                    radius: 12,
                    backgroundColor: AppColors.primary,
                    child: Icon(Icons.check_rounded, size: 16, color: Colors.white),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 3),
        Text(
          img.source ?? '',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textDirection: TextDirection.ltr,
          style: const TextStyle(fontSize: 10.5, color: AppColors.muted),
        ),
      ],
    ),
  );
}

/// نتيجة التعرّف على صورة المنتج + ما يطابقه في المتجر.
class _LensCard extends StatelessWidget {
  const _LensCard({required this.result, required this.onRetry});
  final VisualResult result;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final r = result;
    final sure = r.confidence >= .6;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
      child: Panel(
        padding: const EdgeInsets.all(12),
        color: AppColors.primaryLight,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.center_focus_strong_rounded, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(sure ? 'المنتج في الصورة' : 'ربما يكون', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                      Text(r.title.isEmpty ? r.query : r.title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                      if (r.g('variant').isNotEmpty || r.g('category').isNotEmpty)
                        Text(
                          [r.g('variant'), r.g('category')].where((x) => x.isNotEmpty).join(' · '),
                          style: const TextStyle(color: AppColors.muted, fontSize: 12.5),
                        ),
                      if (r.g('barcode').isNotEmpty)
                        Text('باركود ظاهر: ${r.g('barcode')}', style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
                TextButton.icon(onPressed: onRetry, icon: const Icon(Icons.photo_camera_rounded, size: 18), label: const Text('صورة أخرى')),
              ],
            ),
            const SizedBox(height: 8),
            if (r.products.isEmpty)
              const Text(
                'غير موجود في متجرك — يمكنك إضافة صوره من النتائج أدناه.',
                style: TextStyle(color: AppColors.warning, fontWeight: FontWeight.w700, fontSize: 12.5),
              )
            else ...[
              Text(
                r.products.length == 1 ? 'في متجرك:' : 'في متجرك (${r.products.length}):',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
              ),
              const SizedBox(height: 6),
              SizedBox(
                height: 74,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: r.products.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    final p = r.products[i];
                    return Material(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(12),
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductScreen(productId: p.id))),
                        child: SizedBox(
                          width: 210,
                          child: Padding(
                            padding: const EdgeInsets.all(6),
                            child: Row(
                              children: [
                                NetImg(p.thumb, size: 58, fit: BoxFit.contain),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        p.name,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                                      ),
                                      Text(
                                        p.isActive ? 'ظاهر' : 'موقوف',
                                        style: TextStyle(fontSize: 11, color: p.isActive ? AppColors.success : AppColors.danger),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _LensBusy extends StatelessWidget {
  const _LensBusy();
  @override
  Widget build(BuildContext context) => const Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.center_focus_strong_rounded, size: 56, color: AppColors.primary),
        SizedBox(height: 16),
        CircularProgressIndicator(),
        SizedBox(height: 16),
        Text('نتعرّف على المنتج من الصورة…', style: TextStyle(fontWeight: FontWeight.w700)),
        SizedBox(height: 4),
        Text('ثم نبحث عنه في متجرك وعلى الويب', style: TextStyle(color: AppColors.muted)),
      ],
    ),
  );
}

/// معاينة بالحجم الكامل مع التنقل بين الصور، كما في Google.
class _Preview extends StatefulWidget {
  const _Preview({required this.items, required this.index, required this.pick, required this.selected});
  final List<WebImage> items;
  final int index;
  final bool pick;
  final List<WebImage> selected;
  @override
  State<_Preview> createState() => _PreviewState();
}

class _PreviewState extends State<_Preview> {
  late final _ctrl = PageController(initialPage: widget.index);
  late int _i = widget.index;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final img = widget.items[_i];
    final chosen = widget.selected.contains(img);
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text('${_i + 1} / ${widget.items.length}', style: const TextStyle(color: Colors.white)),
      ),
      body: PageView.builder(
        controller: _ctrl,
        itemCount: widget.items.length,
        onPageChanged: (i) => setState(() => _i = i),
        itemBuilder: (_, i) {
          final it = widget.items[i];
          return InteractiveViewer(
            maxScale: 5,
            child: Center(
              // الصورة الكاملة، والمصغّرة مكانها إن تعذّر تحميلها من موقعها
              child: Image.network(
                it.url,
                fit: BoxFit.contain,
                loadingBuilder: (_, child, p) => p == null ? child : NetImg(it.thumb, fit: BoxFit.contain, radius: 0),
                errorBuilder: (_, _, _) => NetImg(it.thumb, fit: BoxFit.contain, radius: 0),
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          color: Colors.black,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if ((img.title ?? '').isNotEmpty)
                Text(
                  img.title!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                ),
              Text(
                [img.source, if (img.width != null && img.height != null) '${img.width}×${img.height}'].whereType<String>().join(' · '),
                textDirection: TextDirection.ltr,
                textAlign: TextAlign.start,
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  if (img.link != null)
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white38),
                      ),
                      onPressed: () => launchUrl(Uri.parse(img.link!), mode: LaunchMode.externalApplication),
                      icon: const Icon(Icons.open_in_new_rounded, size: 18),
                      label: const Text('زيارة الموقع'),
                    ),
                  const Spacer(),
                  if (widget.pick)
                    FilledButton.icon(
                      onPressed: chosen ? null : () => Navigator.pop(context, img),
                      icon: Icon(chosen ? Icons.check_rounded : Icons.add_photo_alternate_rounded),
                      label: Text(chosen ? 'مختارة' : 'اختر هذه الصورة'),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
