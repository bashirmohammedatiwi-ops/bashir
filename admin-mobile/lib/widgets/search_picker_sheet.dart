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
    return widget.items.where((item) {
      final label = widget.labelOf(item).toLowerCase();
      final sub = widget.subtitleOf?.call(item).toLowerCase() ?? '';
      return label.contains(q) || sub.contains(q);
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
