import 'package:flutter/material.dart';

typedef PickerItemBuilder<T> = Widget Function(BuildContext context, T item, bool selected);

Future<T?> showSearchPicker<T>({
  required BuildContext context,
  required String title,
  required List<T> items,
  required String Function(T item) labelOf,
  String Function(T item)? subtitleOf,
  T? selected,
  bool Function(T a, T b)? isSame,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (ctx) => _SearchPickerBody<T>(
      title: title,
      items: items,
      labelOf: labelOf,
      subtitleOf: subtitleOf,
      selected: selected,
      isSame: isSame ?? (a, b) => a == b,
    ),
  );
}

/// Multi-select search sheet — returns the full selected list (may be empty).
Future<List<T>?> showMultiSearchPicker<T>({
  required BuildContext context,
  required String title,
  required List<T> items,
  required String Function(T item) labelOf,
  String Function(T item)? subtitleOf,
  List<T> selected = const [],
  bool Function(T a, T b)? isSame,
}) {
  return showModalBottomSheet<List<T>>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (ctx) => _MultiSearchPickerBody<T>(
      title: title,
      items: items,
      labelOf: labelOf,
      subtitleOf: subtitleOf,
      initiallySelected: selected,
      isSame: isSame ?? (a, b) => a == b,
    ),
  );
}

class _SearchPickerBody<T> extends StatefulWidget {
  const _SearchPickerBody({
    required this.title,
    required this.items,
    required this.labelOf,
    this.subtitleOf,
    this.selected,
    required this.isSame,
  });

  final String title;
  final List<T> items;
  final String Function(T item) labelOf;
  final String Function(T item)? subtitleOf;
  final T? selected;
  final bool Function(T a, T b) isSame;

  @override
  State<_SearchPickerBody<T>> createState() => _SearchPickerBodyState<T>();
}

class _SearchPickerBodyState<T> extends State<_SearchPickerBody<T>> {
  final _query = TextEditingController();
  String _q = '';

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  List<T> get _filtered {
    final q = _q.trim().toLowerCase();
    if (q.isEmpty) return widget.items;
    final tokens = q.split(RegExp(r'\s+')).where((t) => t.isNotEmpty).toList();
    return widget.items.where((item) {
      final label = widget.labelOf(item).toLowerCase();
      final sub = widget.subtitleOf?.call(item).toLowerCase() ?? '';
      final hay = '$label $sub';
      if (hay.contains(q)) return true;
      return tokens.every((t) => hay.contains(t));
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scroll) => Column(
        children: [
          const SizedBox(height: 8),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Text(widget.title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _query,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'بحث...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _q.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.clear), onPressed: () => setState(() { _query.clear(); _q = ''; }))
                    : null,
              ),
              onChanged: (v) => setState(() => _q = v),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Align(
              alignment: Alignment.centerRight,
              child: Text('${filtered.length} نتيجة', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
            ),
          ),
          Expanded(
            child: filtered.isEmpty
                ? const Center(child: Text('لا توجد نتائج'))
                : ListView.builder(
                    controller: scroll,
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final item = filtered[i];
                      final selected = widget.selected != null && widget.isSame(item, widget.selected as T);
                      return ListTile(
                        selected: selected,
                        leading: selected ? const Icon(Icons.check_circle, color: Colors.green) : const Icon(Icons.circle_outlined),
                        title: Text(widget.labelOf(item)),
                        subtitle: widget.subtitleOf != null ? Text(widget.subtitleOf!(item)) : null,
                        onTap: () => Navigator.pop(context, item),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _MultiSearchPickerBody<T> extends StatefulWidget {
  const _MultiSearchPickerBody({
    required this.title,
    required this.items,
    required this.labelOf,
    this.subtitleOf,
    required this.initiallySelected,
    required this.isSame,
  });

  final String title;
  final List<T> items;
  final String Function(T item) labelOf;
  final String Function(T item)? subtitleOf;
  final List<T> initiallySelected;
  final bool Function(T a, T b) isSame;

  @override
  State<_MultiSearchPickerBody<T>> createState() => _MultiSearchPickerBodyState<T>();
}

class _MultiSearchPickerBodyState<T> extends State<_MultiSearchPickerBody<T>> {
  final _query = TextEditingController();
  String _q = '';
  late List<T> _selected;

  @override
  void initState() {
    super.initState();
    _selected = List<T>.of(widget.initiallySelected);
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  bool _isSelected(T item) => _selected.any((s) => widget.isSame(s, item));

  void _toggle(T item) {
    setState(() {
      final idx = _selected.indexWhere((s) => widget.isSame(s, item));
      if (idx >= 0) {
        _selected.removeAt(idx);
      } else {
        _selected.add(item);
      }
    });
  }

  List<T> get _filtered {
    final q = _q.trim().toLowerCase();
    if (q.isEmpty) return widget.items;
    final tokens = q.split(RegExp(r'\s+')).where((t) => t.isNotEmpty).toList();
    return widget.items.where((item) {
      final label = widget.labelOf(item).toLowerCase();
      final sub = widget.subtitleOf?.call(item).toLowerCase() ?? '';
      final hay = '$label $sub';
      if (hay.contains(q)) return true;
      return tokens.every((t) => hay.contains(t));
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scroll) => Column(
        children: [
          const SizedBox(height: 8),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    widget.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                Text(
                  '${_selected.length} مختار',
                  style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _query,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'بحث...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _q.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(() {
                          _query.clear();
                          _q = '';
                        }),
                      )
                    : null,
              ),
              onChanged: (v) => setState(() => _q = v),
            ),
          ),
          Expanded(
            child: filtered.isEmpty
                ? const Center(child: Text('لا توجد نتائج'))
                : ListView.builder(
                    controller: scroll,
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final item = filtered[i];
                      final selected = _isSelected(item);
                      return CheckboxListTile(
                        value: selected,
                        controlAffinity: ListTileControlAffinity.leading,
                        title: Text(widget.labelOf(item)),
                        subtitle: widget.subtitleOf != null ? Text(widget.subtitleOf!(item)) : null,
                        onChanged: (_) => _toggle(item),
                      );
                    },
                  ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Row(
                children: [
                  TextButton(
                    onPressed: () => setState(() => _selected.clear()),
                    child: const Text('مسح'),
                  ),
                  const Spacer(),
                  FilledButton(
                    onPressed: () => Navigator.pop(context, List<T>.of(_selected)),
                    child: const Text('تم'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
