import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/states.dart';
import '../../data/models/product.dart';
import '../../data/models/review.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../cart/cart_provider.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/recently_viewed_provider.dart';
import '../shell/main_shell.dart';
import '../wishlist/wishlist_provider.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  final String idOrSlug;
  const ProductDetailScreen({super.key, required this.idOrSlug});

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int _imageIndex = 0;
  int _quantity = 1;
  ProductShade? _shade;

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(productDetailProvider(widget.idOrSlug));
    ref.listen(productDetailProvider(widget.idOrSlug), (prev, next) {
      next.whenData((p) => ref.read(recentlyViewedProvider.notifier).add(p));
    });
    return Scaffold(
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Scaffold(
          appBar: AppBar(),
          body: ErrorView(
            message: e.toString(),
            onRetry: () => ref.invalidate(productDetailProvider(widget.idOrSlug)),
          ),
        ),
        data: (product) => _buildContent(product),
      ),
      bottomNavigationBar: async.maybeWhen(
        data: (product) => _BottomBar(
          product: product,
          quantity: _quantity,
          shade: _shade,
          onAdd: () => _addToCart(product),
        ),
        orElse: () => null,
      ),
    );
  }

  void _addToCart(Product product) {
    if (product.shades.isNotEmpty && _shade == null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('يرجى اختيار الدرجة أولاً')));
      return;
    }
    ref.read(cartProvider.notifier).add(product, quantity: _quantity, shade: _shade);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: const Text('أُضيف إلى السلة'),
        action: SnackBarAction(
          label: 'عرض السلة',
          textColor: Colors.white,
          onPressed: () {
            context.go('/');
            ref.read(navIndexProvider.notifier).state = 3;
          },
        ),
      ));
  }

  Widget _buildContent(Product product) {
    final gallery = product.galleryUrls.isNotEmpty ? product.galleryUrls : [''];
    final price = _shade?.price ?? product.price;
    final wished = ref.watch(wishlistProvider).ids.contains(product.id);

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          expandedHeight: 380,
          backgroundColor: AppColors.surface,
          actions: [
            IconButton(
              onPressed: () async {
                if (!ref.read(authProvider).isAuthenticated) {
                  context.push('/login');
                  return;
                }
                await ref.read(wishlistProvider.notifier).toggle(product);
              },
              icon: Icon(wished ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                  color: wished ? AppColors.sale : AppColors.textPrimary),
            ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: Column(
              children: [
                Expanded(
                  child: PageView.builder(
                    itemCount: gallery.length,
                    onPageChanged: (i) => setState(() => _imageIndex = i),
                    itemBuilder: (_, i) => Container(
                      color: Colors.white,
                      child: AppNetworkImage(url: gallery[i], fit: BoxFit.contain),
                    ),
                  ),
                ),
                if (gallery.length > 1)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8, top: 4),
                    child: AnimatedSmoothIndicator(
                      activeIndex: _imageIndex,
                      count: gallery.length,
                      effect: const WormEffect(
                        dotHeight: 7,
                        dotWidth: 7,
                        activeDotColor: AppColors.primary,
                        dotColor: AppColors.border,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (product.brandName.isNotEmpty)
                  Text(product.brandName,
                      style: const TextStyle(
                          color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(height: 4),
                Text(product.name,
                    style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, height: 1.3)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, color: AppColors.star, size: 20),
                    const SizedBox(width: 4),
                    Text(product.rating.toStringAsFixed(1),
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text('  (${product.reviewCount} تقييم)',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    const Spacer(),
                    if (product.soldCount > 0)
                      Text('${formatNumber(product.soldCount)} عملية بيع',
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(formatPrice(price),
                        style: const TextStyle(
                            fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.primary)),
                    const SizedBox(width: 10),
                    if (product.hasDiscount)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 3),
                        child: Text(formatPrice(product.originalPrice),
                            style: const TextStyle(
                                color: AppColors.textMuted,
                                decoration: TextDecoration.lineThrough)),
                      ),
                    const SizedBox(width: 8),
                    if (product.hasDiscount)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                            color: AppColors.sale, borderRadius: BorderRadius.circular(8)),
                        child: Text('وفّر ${product.discountPercent}%',
                            style: const TextStyle(
                                color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                _StockBadge(stock: _shade?.stock ?? product.stock),
                if (product.shades.isNotEmpty) ...[
                  const SizedBox(height: 18),
                  Text('الدرجة${_shade != null ? '：${_shade!.name}' : ''}',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  _ShadeSelector(
                    shades: product.shades,
                    selected: _shade,
                    onSelect: (s) => setState(() => _shade = s),
                  ),
                ],
                const SizedBox(height: 18),
                Row(
                  children: [
                    const Text('الكمية', style: TextStyle(fontWeight: FontWeight.w700)),
                    const Spacer(),
                    _QuantityStepper(
                      quantity: _quantity,
                      onChanged: (v) => setState(() => _quantity = v),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                if (product.pointsEarned > 0)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                        color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
                    child: Row(
                      children: [
                        const Icon(Icons.stars_rounded, color: AppColors.primary),
                        const SizedBox(width: 8),
                        Text('اكسب ${product.pointsEarned} نقطة عند شراء هذا المنتج',
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      ],
                    ),
                  ),
                const SizedBox(height: 8),
                _ProductTabs(product: product),
                const SizedBox(height: 16),
                _ReviewsSection(productId: product.id),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _StockBadge extends StatelessWidget {
  final int stock;
  const _StockBadge({required this.stock});
  @override
  Widget build(BuildContext context) {
    final inStock = stock > 0;
    return Row(
      children: [
        Icon(inStock ? Icons.check_circle_rounded : Icons.cancel_rounded,
            color: inStock ? AppColors.success : AppColors.sale, size: 18),
        const SizedBox(width: 6),
        Text(
          inStock ? (stock <= 5 ? 'متبقٍ $stock قطع فقط' : 'متوفر') : 'غير متوفر حالياً',
          style: TextStyle(
              color: inStock ? AppColors.success : AppColors.sale, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}

class _ShadeSelector extends StatelessWidget {
  final List<ProductShade> shades;
  final ProductShade? selected;
  final ValueChanged<ProductShade> onSelect;
  const _ShadeSelector({required this.shades, required this.selected, required this.onSelect});

  Color _color(String hex) {
    final h = hex.replaceAll('#', '');
    final v = h.length == 6 ? 'FF$h' : h;
    return Color(int.tryParse(v, radix: 16) ?? 0xFFCCCCCC);
  }

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (final s in shades)
          GestureDetector(
            onTap: s.inStock ? () => onSelect(s) : null,
            child: Opacity(
              opacity: s.inStock ? 1 : 0.4,
              child: Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: [
                    _color(s.colorHex),
                    _color(s.colorHexEnd ?? s.colorHex),
                  ]),
                  border: Border.all(
                    color: selected?.id == s.id ? AppColors.primary : AppColors.border,
                    width: selected?.id == s.id ? 3 : 1,
                  ),
                ),
                child: selected?.id == s.id
                    ? const Icon(Icons.check, color: Colors.white, size: 18)
                    : null,
              ),
            ),
          ),
      ],
    );
  }
}

class _QuantityStepper extends StatelessWidget {
  final int quantity;
  final ValueChanged<int> onChanged;
  const _QuantityStepper({required this.quantity, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: quantity > 1 ? () => onChanged(quantity - 1) : null,
            icon: const Icon(Icons.remove, size: 18),
          ),
          Text('$quantity', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          IconButton(
            onPressed: () => onChanged(quantity + 1),
            icon: const Icon(Icons.add, size: 18),
          ),
        ],
      ),
    );
  }
}

class _ProductTabs extends StatelessWidget {
  final Product product;
  const _ProductTabs({required this.product});

  @override
  Widget build(BuildContext context) {
    final tabs = <String, String>{};
    if (product.description.isNotEmpty) tabs['الوصف'] = product.description;
    if (product.howToUse.isNotEmpty) tabs['طريقة الاستخدام'] = product.howToUse;
    if (product.ingredients.isNotEmpty) tabs['المكوّنات'] = product.ingredients;
    if (tabs.isEmpty) return const SizedBox.shrink();

    return DefaultTabController(
      length: tabs.length,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.primary,
            tabs: [for (final t in tabs.keys) Tab(text: t)],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 120,
            child: TabBarView(
              children: [
                for (final v in tabs.values)
                  SingleChildScrollView(
                    child: Text(v,
                        style: const TextStyle(
                            height: 1.6, color: AppColors.textSecondary, fontSize: 13.5)),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewsSection extends ConsumerStatefulWidget {
  final String productId;
  const _ReviewsSection({required this.productId});

  @override
  ConsumerState<_ReviewsSection> createState() => _ReviewsSectionState();
}

class _ReviewsSectionState extends ConsumerState<_ReviewsSection> {
  bool _showForm = false;
  double _rating = 5;
  final _commentCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!ref.read(authProvider).isAuthenticated) {
      context.push('/login');
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref.read(apiServiceProvider).addReview(
            widget.productId,
            _rating,
            _commentCtrl.text.trim(),
          );
      ref.invalidate(productReviewsProvider(widget.productId));
      ref.invalidate(productDetailProvider(widget.productId));
      if (mounted) {
        setState(() {
          _showForm = false;
          _commentCtrl.clear();
          _rating = 5;
        });
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('شكراً على تقييمك!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.sale));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(productReviewsProvider(widget.productId));
    final authed = ref.watch(authProvider).isAuthenticated;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 28),
        Row(
          children: [
            async.maybeWhen(
              data: (reviews) => Text('التقييمات (${reviews.length})',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
              orElse: () => const Text('التقييمات',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            ),
            const Spacer(),
            if (authed)
              TextButton.icon(
                onPressed: () => setState(() => _showForm = !_showForm),
                icon: Icon(_showForm ? Icons.close : Icons.rate_review_outlined, size: 18),
                label: Text(_showForm ? 'إلغاء' : 'أضف تقييماً'),
              ),
          ],
        ),
        if (_showForm) ...[
          const SizedBox(height: 8),
          RatingBar.builder(
            initialRating: _rating,
            minRating: 1,
            direction: Axis.horizontal,
            allowHalfRating: true,
            itemCount: 5,
            itemSize: 28,
            unratedColor: AppColors.border,
            itemBuilder: (_, __) => const Icon(Icons.star_rounded, color: AppColors.star),
            onRatingUpdate: (v) => setState(() => _rating = v),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _commentCtrl,
            maxLines: 3,
            decoration: const InputDecoration(hintText: 'اكتبي تجربتك مع المنتج...'),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('إرسال التقييم'),
            ),
          ),
          const SizedBox(height: 12),
        ],
        async.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)),
          ),
          error: (_, __) => const SizedBox.shrink(),
          data: (reviews) {
            if (reviews.isEmpty && !_showForm) {
              return Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  authed ? 'كن أول من يقيّم هذا المنتج' : 'سجّل الدخول لإضافة تقييم',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
              );
            }
            return Column(
              children: [for (final Review r in reviews.take(5)) _ReviewTile(review: r)],
            );
          },
        ),
      ],
    );
  }
}

class _ReviewTile extends StatelessWidget {
  final Review review;
  const _ReviewTile({required this.review});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.scaffold,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.primaryLight,
                child: Text(
                  review.userName.isNotEmpty ? review.userName[0] : '؟',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(review.userName, style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text(review.dateLabel,
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  ],
                ),
              ),
              Row(
                children: [
                  const Icon(Icons.star_rounded, color: AppColors.star, size: 16),
                  Text(review.rating.toStringAsFixed(1),
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                ],
              ),
            ],
          ),
          if (review.comment.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(review.comment,
                style: const TextStyle(height: 1.5, color: AppColors.textSecondary, fontSize: 13)),
          ],
        ],
      ),
    );
  }
}

class _BottomBar extends StatelessWidget {
  final Product product;
  final int quantity;
  final ProductShade? shade;
  final VoidCallback onAdd;
  const _BottomBar({
    required this.product,
    required this.quantity,
    required this.shade,
    required this.onAdd,
  });

  @override
  Widget build(BuildContext context) {
    final stock = shade?.stock ?? product.stock;
    final enabled = stock > 0;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 14, offset: const Offset(0, -2)),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 52,
          child: ElevatedButton.icon(
            onPressed: enabled ? onAdd : null,
            icon: const Icon(Icons.add_shopping_cart_rounded),
            label: Text(enabled ? 'إضافة إلى السلة' : 'غير متوفر'),
          ),
        ),
      ),
    );
  }
}
