import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/admin_repo.dart';
import '../../data/repo.dart';
import '../../data/session.dart';
import '../../widgets/common.dart';
import '../product/product_screen.dart';

/// التقييمات: الموافقة أو الإخفاء أو الحذف.
class ReviewsScreen extends ConsumerStatefulWidget {
  const ReviewsScreen({super.key});
  @override
  ConsumerState<ReviewsScreen> createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends ConsumerState<ReviewsScreen> {
  bool? _approved = false;
  List<ReviewItem>? _items;
  Object? _error;
  int _page = 1, _total = 0, _seq = 0;
  bool _hasNext = false, _loadingMore = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final seq = ++_seq;
    setState(() => _error = null);
    try {
      final r = await ref.read(repoProvider).reviews(approved: _approved);
      if (mounted && seq == _seq) setState(() => (_items = r.items, _page = 1, _hasNext = r.hasNext, _total = r.total));
    } catch (e) {
      if (mounted && seq == _seq) setState(() => _error = e);
    }
  }

  /// الصفحة التالية عند الاقتراب من نهاية القائمة.
  Future<void> _more() async {
    if (_loadingMore || !_hasNext || _items == null) return;
    final seq = _seq;
    setState(() => _loadingMore = true);
    try {
      final r = await ref.read(repoProvider).reviews(approved: _approved, page: _page + 1);
      if (!mounted || seq != _seq) return;
      final ids = _items!.map((x) => x.id).toSet();
      setState(() {
        _items!.addAll(r.items.where((x) => !ids.contains(x.id)));
        _page++;
        _hasNext = r.hasNext;
      });
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Future<void> _set(ReviewItem r, bool approved) async {
    setState(() => r.approved = approved);
    try {
      await ref.read(repoProvider).setReviewApproved(r.id, approved);
      if (!mounted) return;
      toast(context, approved ? 'ظهر التقييم في التطبيق' : 'أُخفي التقييم');
      if (_approved != null) setState(() => (_items!.remove(r), _total--));
    } catch (e) {
      if (mounted) {
        setState(() => r.approved = !approved);
        toastError(context, e);
      }
    }
  }

  Future<void> _delete(ReviewItem r) async {
    if (!await confirm(context, title: 'حذف التقييم نهائياً؟', ok: 'حذف', danger: true)) return;
    try {
      await ref.read(repoProvider).deleteReview(r.id);
      if (!mounted) return;
      setState(() => (_items!.remove(r), _total--));
      toast(context, 'حُذف التقييم');
    } catch (e) {
      if (mounted) toastError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAdmin = ref.watch(sessionProvider).isAdmin;
    return Scaffold(
      appBar: AppBar(
        title: Text(_items == null || _total == 0 ? 'التقييمات' : 'التقييمات ($_total)'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(52),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: SegmentedButton<bool?>(
              showSelectedIcon: false,
              segments: const [
                ButtonSegment(value: false, label: Text('بانتظار الموافقة')),
                ButtonSegment(value: true, label: Text('ظاهرة')),
                ButtonSegment(value: null, label: Text('الكل')),
              ],
              selected: {_approved},
              onSelectionChanged: (v) {
                setState(() => (_approved = v.first, _items = null));
                _load();
              },
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _error != null
            ? ListView(children: [ErrorView(_error!, onRetry: _load)])
            : _items == null
            ? const Center(child: CircularProgressIndicator())
            : _items!.isEmpty
            ? ListView(
                children: const [EmptyState(icon: Icons.reviews_outlined, title: 'لا تقييمات هنا')],
              )
            : NotificationListener<ScrollNotification>(
                onNotification: (n) {
                  if (n.metrics.extentAfter < 400) _more();
                  return false;
                },
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
                  itemCount: _items!.length + (_hasNext ? 1 : 0),
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    if (i >= _items!.length) {
                      return const Padding(
                        padding: EdgeInsets.all(16),
                        child: Center(child: CircularProgressIndicator()),
                      );
                    }
                    final r = _items![i];
                    return Panel(
                      padding: const EdgeInsets.all(12),
                      color: r.approved ? Colors.white : const Color(0xFFFFFBF2),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              for (var s = 1; s <= 5; s++)
                                Icon(
                                  s <= r.rating.round() ? Icons.star_rounded : Icons.star_outline_rounded,
                                  size: 18,
                                  color: const Color(0xFFF2B01E),
                                ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(r.userName, style: const TextStyle(fontWeight: FontWeight.w700)),
                              ),
                              Text(timeAgo(r.createdAt), style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(r.comment, style: const TextStyle(height: 1.6)),
                          if (r.productName != null)
                            TextButton.icon(
                              style: TextButton.styleFrom(padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
                              onPressed: r.productId == null
                                  ? null
                                  : () => Navigator.of(
                                      context,
                                    ).push(MaterialPageRoute(builder: (_) => ProductScreen(productId: r.productId!))),
                              icon: const Icon(Icons.inventory_2_outlined, size: 16),
                              label: Text(r.productName!, maxLines: 1, overflow: TextOverflow.ellipsis),
                            ),
                          Row(
                            children: [
                              Expanded(
                                child: r.approved
                                    ? OutlinedButton.icon(
                                        onPressed: () => _set(r, false),
                                        icon: const Icon(Icons.visibility_off_rounded),
                                        label: const Text('إخفاء'),
                                      )
                                    : FilledButton.icon(
                                        onPressed: () => _set(r, true),
                                        icon: const Icon(Icons.check_rounded),
                                        label: const Text('موافقة ونشر'),
                                      ),
                              ),
                              if (isAdmin)
                                IconButton(
                                  tooltip: 'حذف',
                                  onPressed: () => _delete(r),
                                  icon: const Icon(Icons.delete_outline_rounded, color: AppColors.danger),
                                ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
      ),
    );
  }
}
