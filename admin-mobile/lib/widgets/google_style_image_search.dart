import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../models/ai_autofill.dart';

enum ImageSearchMode { barcode, name }

/// Compact image picker: barcode/name search + tap to select.
class GoogleStyleImageSearch extends StatefulWidget {
  const GoogleStyleImageSearch({
    super.key,
    required this.barcode,
    required this.images,
    required this.selectedUrls,
    required this.imageOrder,
    required this.loading,
    required this.onSearch,
    required this.onToggle,
    required this.onPreview,
    required this.onSelectAll,
    required this.onClear,
    required this.initialNameQuery,
  });

  final String barcode;
  final List<AiAutofillImage> images;
  final Set<String> selectedUrls;
  final List<String> imageOrder;
  final bool loading;
  final Future<void> Function(ImageSearchMode mode, String query) onSearch;
  final void Function(String url) onToggle;
  final void Function(String url) onPreview;
  final VoidCallback onSelectAll;
  final VoidCallback onClear;
  final String initialNameQuery;

  @override
  State<GoogleStyleImageSearch> createState() => _GoogleStyleImageSearchState();
}

class _GoogleStyleImageSearchState extends State<GoogleStyleImageSearch> {
  late ImageSearchMode _mode;
  late final TextEditingController _query;

  @override
  void initState() {
    super.initState();
    _mode = ImageSearchMode.barcode;
    _query = TextEditingController(text: widget.barcode);
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  void _setMode(ImageSearchMode mode) {
    if (_mode == mode) return;
    setState(() {
      _mode = mode;
      if (mode == ImageSearchMode.barcode) {
        _query.text = widget.barcode;
      } else if (_query.text.trim() == widget.barcode.trim() || _query.text.trim().isEmpty) {
        _query.text = widget.initialNameQuery;
      }
    });
  }

  Future<void> _runSearch() async {
    final q = _query.text.trim();
    if (_mode == ImageSearchMode.name && q.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('أدخل اسم المنتج للبحث')),
      );
      return;
    }
    await widget.onSearch(_mode, q);
  }

  String _hostOf(String url) {
    try {
      return Uri.parse(url).host.replaceFirst(RegExp(r'^www\.'), '');
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'اختر الصور',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15.5),
                      ),
                    ),
                    Text(
                      '${widget.selectedUrls.length} مختارة',
                      style: const TextStyle(
                        color: AppTheme.primaryDark,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SegmentedButton<ImageSearchMode>(
                  segments: const [
                    ButtonSegment(
                      value: ImageSearchMode.barcode,
                      icon: Icon(Icons.qr_code_2, size: 18),
                      label: Text('باركود'),
                    ),
                    ButtonSegment(
                      value: ImageSearchMode.name,
                      icon: Icon(Icons.search, size: 18),
                      label: Text('اسم'),
                    ),
                  ],
                  selected: {_mode},
                  onSelectionChanged: (s) => _setMode(s.first),
                  style: const ButtonStyle(visualDensity: VisualDensity.compact),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _query,
                        textInputAction: TextInputAction.search,
                        textDirection:
                            _mode == ImageSearchMode.barcode ? TextDirection.ltr : TextDirection.rtl,
                        onSubmitted: (_) => _runSearch(),
                        decoration: InputDecoration(
                          hintText: _mode == ImageSearchMode.barcode ? 'الباركود…' : 'اسم المنتج…',
                          prefixIcon: const Icon(Icons.search),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: widget.loading ? null : _runSearch,
                      style: FilledButton.styleFrom(
                        minimumSize: const Size(72, 48),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                      ),
                      child: widget.loading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('بحث'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Text(
              '${widget.images.length} نتيجة',
              style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.muted),
            ),
            const Spacer(),
            TextButton(onPressed: widget.onSelectAll, child: const Text('الكل')),
            TextButton(onPressed: widget.onClear, child: const Text('مسح')),
          ],
        ),
        const SizedBox(height: 4),
        if (widget.loading && widget.images.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 48),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (widget.images.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 16),
              child: Column(
                children: [
                  Icon(Icons.image_search_outlined, size: 40, color: Colors.grey.shade400),
                  const SizedBox(height: 10),
                  Text(
                    'لا نتائج — جرّب البحث بالاسم',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey.shade700),
                  ),
                ],
              ),
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: widget.images.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 0.78,
            ),
            itemBuilder: (context, index) {
              final img = widget.images[index];
              final selected = widget.selectedUrls.contains(img.url);
              final order = widget.imageOrder.indexOf(img.url);
              final host = _hostOf(img.source.isNotEmpty ? img.source : img.url);

              return Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () => widget.onToggle(img.url),
                  onLongPress: () => widget.onPreview(img.url),
                  child: Ink(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: selected ? AppTheme.primary : const Color(0xFFECE7F0),
                        width: selected ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              ColoredBox(
                                color: const Color(0xFFF7F5F9),
                                child: CachedNetworkImage(
                                  imageUrl: img.thumbUrl.isNotEmpty ? img.thumbUrl : img.url,
                                  fit: BoxFit.contain,
                                  errorWidget: (_, __, ___) =>
                                      Icon(Icons.broken_image_outlined, color: Colors.grey.shade400),
                                ),
                              ),
                              Positioned(
                                top: 8,
                                left: 8,
                                child: CircleAvatar(
                                  radius: 13,
                                  backgroundColor: selected ? AppTheme.primary : Colors.black45,
                                  child: selected
                                      ? Text(
                                          '${order + 1}',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        )
                                      : const Icon(Icons.add, size: 15, color: Colors.white),
                                ),
                              ),
                              Positioned(
                                top: 8,
                                right: 8,
                                child: _SizeBadge(image: img),
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
                          child: Text(
                            host.isNotEmpty
                                ? host
                                : (img.title.isNotEmpty ? img.title : 'صورة'),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 11, color: AppTheme.muted),
                            textDirection: host.isNotEmpty ? TextDirection.ltr : TextDirection.rtl,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}

class _SizeBadge extends StatefulWidget {
  const _SizeBadge({required this.image});
  final AiAutofillImage image;

  @override
  State<_SizeBadge> createState() => _SizeBadgeState();
}

class _SizeBadgeState extends State<_SizeBadge> {
  String _label = '…';

  @override
  void initState() {
    super.initState();
    final known = widget.image.sizeLabel;
    if (known != null) {
      _label = known;
    } else {
      _resolve();
    }
  }

  Future<void> _resolve() async {
    final url = widget.image.url;
    if (url.isEmpty) return;
    final provider = NetworkImage(url);
    final stream = provider.resolve(const ImageConfiguration());
    late final ImageStreamListener listener;
    listener = ImageStreamListener((info, _) {
      if (!mounted) return;
      setState(() => _label = '${info.image.width}×${info.image.height}');
      stream.removeListener(listener);
    }, onError: (_, __) {
      if (!mounted) return;
      setState(() => _label = '—');
      stream.removeListener(listener);
    });
    stream.addListener(listener);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _label,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
        textDirection: TextDirection.ltr,
      ),
    );
  }
}
