import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/product_card.dart';
import '../../core/widgets/shimmer_box.dart';
import '../../core/widgets/states.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../catalog/recently_viewed_provider.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  Timer? _debounce;
  List<Product> _results = [];
  bool _loading = false;
  bool _searched = false;
  String? _error;

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    final q = value.trim();
    if (q.isEmpty) {
      setState(() {
        _results = [];
        _searched = false;
      });
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 450), () => _search(q));
  }

  Future<void> _search(String q) async {
    setState(() {
      _loading = true;
      _searched = true;
      _error = null;
    });
    try {
      final result = await ref.read(apiServiceProvider).getProducts(search: q, limit: 30);
      if (!mounted) return;
      setState(() => _results = result.items);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Padding(
          padding: const EdgeInsets.only(left: 12),
          child: TextField(
            controller: _controller,
            autofocus: true,
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'ابحث عن منتج، علامة، تصنيف...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _controller.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () {
                        _controller.clear();
                        _onChanged('');
                      },
                    )
                  : null,
            ),
            onChanged: (v) {
              setState(() {});
              _onChanged(v);
            },
            onSubmitted: (v) => _search(v.trim()),
          ),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) return const ProductGridSkeleton(count: 6);
    if (_error != null) return ErrorView(message: _error!);
    if (!_searched) {
      final recent = ref.watch(recentlyViewedProvider);
      if (recent.isEmpty) {
        return const EmptyState(
            icon: Icons.search_rounded,
            title: 'ابحث في متجر الحياة',
            subtitle: 'اكتب اسم المنتج أو العلامة التجارية');
      }
      return ListView(
        padding: const EdgeInsets.all(12),
        children: [
          Row(
            children: [
              const Expanded(
                child: Text('شاهدت مؤخراً',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
              ),
              TextButton(
                onPressed: () => ref.read(recentlyViewedProvider.notifier).clear(),
                child: const Text('مسح'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.6,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: recent.length,
            itemBuilder: (_, i) => ProductCard(product: recent[i]),
          ),
        ],
      );
    }
    if (_results.isEmpty) {
      return const EmptyState(icon: Icons.search_off_rounded, title: 'لا توجد نتائج');
    }
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.6,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: _results.length,
      itemBuilder: (_, i) => ProductCard(product: _results[i]),
    );
  }
}
