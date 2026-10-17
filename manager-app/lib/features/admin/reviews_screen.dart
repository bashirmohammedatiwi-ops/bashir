import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/admin_repo.dart';
import '../../data/repo.dart';
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

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final r = await ref.read(repoProvider).reviews(approved: _approved);
      if (mounted) setState(() => _items = r.items);
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _set(ReviewItem r, bool approved) async {
    setState(() => r.approved = approved);
    try {
      await ref.read(repoProvider).setReviewApproved(r.id, approved);
      if (!mounted) return;
      toast(context, approved ? 'ظهر التقييم في التطبيق' : 'أُخفي التقييم');
      if (_approved != null) setState(() => _items!.remove(r));
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
      if (mounted) setState(() => _items!.remove(r));
    } catch (e) {
      if (mounted) toastError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('التقييمات'),
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
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
                itemCount: _items!.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
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
                                : () =>
                                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProductScreen(productId: r.productId!))),
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
                            IconButton(
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
    );
  }
}
