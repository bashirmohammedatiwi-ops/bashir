import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/utils/friendly_error.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';

class WishlistState {
  final List<Product> products;
  final Set<String> ids;
  final bool loading;

  /// نص الخطأ الجاهز للعرض (قديم — للواجهة الجديدة نسّقي [errorObject] بلغتها).
  final String? error;

  /// الخطأ الأصلي لآخر تحميل فاشل — يُنسَّق في الواجهة بلغتها (`ref.friendly`).
  final Object? errorObject;

  /// وصلت القائمة من الخادم مرة على الأقل في هذه الجلسة — قبلها قد تكون [ids]
  /// ناقصة (فالعدّاد يعتمد على عدد الحساب من /auth/me بدلها).
  final bool loaded;

  const WishlistState({
    this.products = const [],
    this.ids = const {},
    this.loading = false,
    this.error,
    this.errorObject,
    this.loaded = false,
  });

  WishlistState copyWith({
    List<Product>? products,
    Set<String>? ids,
    bool? loading,
    bool? loaded,
    String? error,
    Object? errorObject,
    bool clearError = false,
  }) =>
      WishlistState(
        products: products ?? this.products,
        ids: ids ?? this.ids,
        loading: loading ?? this.loading,
        loaded: loaded ?? this.loaded,
        error: clearError ? null : (error ?? this.error),
        errorObject: clearError ? null : (errorObject ?? this.errorObject),
      );
}

class WishlistNotifier extends StateNotifier<WishlistState> {
  final Ref _ref;
  WishlistNotifier(this._ref) : super(const WishlistState());

  ApiService get _api => _ref.read(apiServiceProvider);

  /// طلبات جارية لكل منتج (المعرّف ← الحالة المطلوبة): نقرة ثانية أثناءها تُهمَل،
  /// وقائمة تصل من الخادم قبل وصول الطلب لا تُرجع القلب لحالته القديمة.
  final Map<String, bool> _pending = {};

  /// يزداد عند الخروج/تبديل الحساب — نتيجة متأخرة لحساب سابق تُهمَل.
  int _epoch = 0;

  /// تحميل واحد في نفس الوقت (المستمع + شاشة المفضلة + السحب للتحديث).
  Future<void>? _loading;

  bool isWishlisted(String productId) => state.ids.contains(productId);

  /// هل يوجد طلب جارٍ لهذا المنتج؟ (لتعطيل القلب مؤقتاً إن لزم)
  bool isPending(String productId) => _pending.containsKey(productId);

  Future<void> load() {
    if (!_ref.read(authProvider).isAuthenticated) {
      state = const WishlistState();
      return Future.value();
    }
    final running = _loading;
    if (running != null) return running;
    late final Future<void> current;
    current = _load().whenComplete(() {
      if (identical(_loading, current)) _loading = null;
    });
    return _loading = current;
  }

  Future<void> _load() async {
    final epoch = _epoch;
    state = state.copyWith(loading: true, clearError: true);
    try {
      final fetched = await _api.getWishlist();
      if (!mounted || epoch != _epoch) return;
      var products = fetched;
      final ids = products.map((e) => e.id).toSet();
      // ما زال في الطريق للخادم: رغبة الزبونة تغلب قائمة طُلبت قبل وصوله.
      for (final MapEntry(key: id, value: wish) in _pending.entries) {
        if (wish) {
          ids.add(id);
        } else {
          ids.remove(id);
          products = products.where((p) => p.id != id).toList();
        }
      }
      state = WishlistState(products: products, ids: ids, loaded: true);
    } catch (e) {
      if (!mounted || epoch != _epoch) return;
      state = state.copyWith(loading: false, error: friendlyError(e), errorObject: e);
    }
  }

  void clear() {
    _epoch++;
    _pending.clear();
    _loading = null;
    state = const WishlistState();
  }

  /// إضافة/إزالة صريحة (لا «قلب» على الخادم): القلب يتغيّر فوراً، ثم الطلب
  /// (POST أو DELETE — تكرارهما آمن). عند الفشل يعود المنتج لحالته ويُعاد رمي الخطأ
  /// ليعرضه المستدعي. يُرجع الحالة بعد العملية.
  Future<bool> setWished(Product product, bool wish) async {
    final id = product.id;
    if (id.isEmpty || !_ref.read(authProvider).isAuthenticated) return isWishlisted(id);
    if (_pending.containsKey(id)) return isWishlisted(id);
    // القائمة محمّلة والحالة هي المطلوبة أصلاً — لا طلب. (قبل التحميل نرسل دائماً: الطلب آمن.)
    if (state.loaded && isWishlisted(id) == wish) return wish;

    final epoch = _epoch;
    final before = state;
    final beforeIndex = before.products.indexWhere((p) => p.id == id);
    _pending[id] = wish;
    state = _applied(state, product, wish);
    try {
      if (wish) {
        final saved = await _api.addToWishlist(id);
        if (!mounted || epoch != _epoch) return wish;
        if (saved != null && saved.images.isNotEmpty) {
          // نسخة الخادم الكاملة (صور، براند، تدرجات) بدل ما مُرِّر — قد يكون منتجاً مختصراً.
          final products = [...state.products];
          final i = products.indexWhere((p) => p.id == id);
          if (i >= 0) {
            products[i] = saved;
          } else {
            products.insert(0, saved);
          }
          state = state.copyWith(products: products, ids: {...state.ids, id});
        } else if (!state.products.any((p) => p.id == id)) {
          unawaited(load());
        }
      } else {
        await _api.removeFromWishlist(id);
        if (!mounted || epoch != _epoch) return wish;
      }
      // قبل أول تحميل ناجح قد تكون القائمة ناقصة: نزامنها الآن.
      if (!state.loaded) unawaited(load());
      return wish;
    } catch (_) {
      if (mounted && epoch == _epoch) state = _restored(state, before, beforeIndex, id);
      rethrow;
    } finally {
      if (epoch == _epoch) _pending.remove(id);
    }
  }

  /// قلب الحالة الحالية — يُرجع true إن أصبح المنتج في المفضلة.
  Future<bool> toggle(Product product) => setWished(product, !isWishlisted(product.id));

  /// الحالة بعد العملية المتفائلة. منتج مختصر بلا صور (من «احفظيه لاحقاً» في السلة)
  /// لا يُعرض في القائمة — ننتظر نسخة الخادم الكاملة.
  static WishlistState _applied(WishlistState s, Product product, bool wish) {
    final ids = {...s.ids};
    final products = [...s.products];
    if (wish) {
      ids.add(product.id);
      if (product.images.isNotEmpty && !products.any((p) => p.id == product.id)) {
        products.insert(0, product);
      }
    } else {
      ids.remove(product.id);
      products.removeWhere((p) => p.id == product.id);
    }
    return s.copyWith(ids: ids, products: products);
  }

  /// يعيد هذا المنتج وحده لحالته قبل العملية الفاشلة (بمكانه في القائمة)،
  /// دون المساس بتغييرات أخرى حدثت أثناء الطلب.
  static WishlistState _restored(WishlistState s, WishlistState before, int beforeIndex, String id) {
    final ids = {...s.ids};
    final products = s.products.where((p) => p.id != id).toList();
    if (before.ids.contains(id)) {
      ids.add(id);
      if (beforeIndex >= 0) {
        products.insert(beforeIndex.clamp(0, products.length), before.products[beforeIndex]);
      }
    } else {
      ids.remove(id);
    }
    return s.copyWith(ids: ids, products: products);
  }
}

final wishlistProvider = StateNotifierProvider<WishlistNotifier, WishlistState>((ref) {
  final notifier = WishlistNotifier(ref);
  // تحميل فقط حين يتغيّر الحساب نفسه — لا مع كل refreshUser() بعد الطلب أو تعديل الملف
  // (قائمة المفضلة ثقيلة: صور وتدرجات لكل منتج).
  ref.listen(authProvider, (prev, next) {
    final prevId = prev != null && prev.isAuthenticated ? prev.user?.id : null;
    final nextId = next.isAuthenticated ? next.user?.id : null;
    if (prevId == nextId) return;
    if (prevId != null) notifier.clear();
    if (nextId != null) notifier.load();
  });
  // مسجّلة الدخول مسبقاً: نحمّل المفضلة فوراً حتى تظهر القلوب صحيحة في كل البطاقات.
  if (ref.read(authProvider).isAuthenticated) {
    Future.microtask(notifier.load);
  }
  return notifier;
});
