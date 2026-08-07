import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../models/ai_autofill.dart';

enum ImageSearchMode { barcode, name }

/// Google-like image results panel: mode toggle, search bar, size badges, selection.
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
        const SnackBar(content: Text('أدخل اسم المنتج للبحث مثل Google')),
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
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.primary.withValues(alpha: 0.12)),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primary.withValues(alpha: 0.06),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(Icons.travel_explore, color: AppTheme.primary),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'بحث الصور',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                    ),
                  ),
                  Text(
                    '${widget.selectedUrls.length} مختارة',
                    style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'اضغط على الصور التي تريدها — لا يُختار شيء تلقائياً',
                style: TextStyle(fontSize: 12.5, color: Colors.grey.shade700),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _ModeChip(
                        selected: _mode == ImageSearchMode.barcode,
                        icon: Icons.qr_code_2,
                        label: 'بالباركود',
                        onTap: () => _setMode(ImageSearchMode.barcode),
                      ),
                    ),
                    Expanded(
                      child: _ModeChip(
                        selected: _mode == ImageSearchMode.name,
                        icon: Icons.title,
                        label: 'بالاسم',
                        onTap: () => _setMode(ImageSearchMode.name),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _query,
                      textInputAction: TextInputAction.search,
                      textDirection: _mode == ImageSearchMode.barcode ? TextDirection.ltr : TextDirection.rtl,
                      onSubmitted: (_) => _runSearch(),
                      decoration: InputDecoration(
                        hintText: _mode == ImageSearchMode.barcode
                            ? 'أدخل الباركود…'
                            : 'ابحث باسم المنتج مثل Google…',
                        prefixIcon: const Icon(Icons.search),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(28)),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(28),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(28),
                          borderSide: const BorderSide(color: AppTheme.primary, width: 1.4),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: widget.loading ? null : _runSearch,
                    style: FilledButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
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
              const SizedBox(height: 8),
              Text(
                _mode == ImageSearchMode.barcode
                    ? 'نتائج صور مرتبطة بالباركود — بدون استهلاك AI'
                    : 'نتائج صور بالاسم كما في بحث Google — بدون استهلاك AI',
                style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Text(
              '${widget.images.length} نتيجة',
              style: TextStyle(fontWeight: FontWeight.w700, color: Colors.grey.shade800),
            ),
            const Spacer(),
            TextButton(onPressed: widget.onSelectAll, child: const Text('تحديد الكل')),
            TextButton(onPressed: widget.onClear, child: const Text('مسح')),
          ],
        ),
        const SizedBox(height: 6),
        if (widget.loading && widget.images.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 48),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (widget.images.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                Icon(Icons.image_not_supported_outlined, size: 42, color: Colors.grey.shade400),
                const SizedBox(height: 10),
                Text(
                  'لا توجد نتائج — جرّب تبديل الوضع أو تعديل نص البحث',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey.shade700),
                ),
              ],
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: widget.images.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.72,
            ),
            itemBuilder: (_, i) {
              final img = widget.images[i];
              final selected = widget.selectedUrls.contains(img.url);
              final order = widget.imageOrder.indexOf(img.url);
              final host = _hostOf(img.source.isNotEmpty ? img.source : img.url);

              return Material(
                color: Colors.white,
                elevation: selected ? 2 : 0,
                shadowColor: AppTheme.primary.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(16),
                child: InkWell(
                  onTap: () => widget.onToggle(img.url),
                  onLongPress: () => widget.onPreview(img.url),
                  borderRadius: BorderRadius.circular(16),
                  child: Ink(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: selected ? AppTheme.primary : Colors.grey.shade200,
                        width: selected ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(8, 8, 8, 4),
                          child: Row(
                            children: [
                              Expanded(
                                child: _SizeBadge(image: img),
                              ),
                              const SizedBox(width: 6),
                              CircleAvatar(
                                radius: 12,
                                backgroundColor: selected ? AppTheme.primary : Colors.black38,
                                child: selected
                                    ? Text(
                                        '${order + 1}',
                                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                      )
                                    : const Icon(Icons.add, size: 14, color: Colors.white),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: ColoredBox(
                                color: const Color(0xFFF7F5F9),
                                child: CachedNetworkImage(
                                  imageUrl: img.thumbUrl.isNotEmpty ? img.thumbUrl : img.url,
                                  fit: BoxFit.contain,
                                  errorWidget: (_, __, ___) => Icon(Icons.broken_image, color: Colors.grey.shade400),
                                ),
                              ),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                img.title.isNotEmpty ? img.title : 'صورة منتج',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, height: 1.25),
                              ),
                              if (host.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(
                                  host,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                                  textDirection: TextDirection.ltr,
                                ),
                              ],
                            ],
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

class _ModeChip extends StatelessWidget {
  const _ModeChip({
    required this.selected,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final bool selected;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppTheme.primary : Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: selected ? Colors.white : AppTheme.primaryDark),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: selected ? Colors.white : AppTheme.primaryDark,
                ),
              ),
            ],
          ),
        ),
      ),
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _label,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: AppTheme.primaryDark,
        ),
        textDirection: TextDirection.ltr,
      ),
    );
  }
}
