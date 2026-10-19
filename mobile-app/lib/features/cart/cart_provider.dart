import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/models/cart_item.dart';
import '../../data/models/product.dart';
import '../../data/services/api_service.dart';
import 'cart_packages_provider.dart';

class CartState {
  final List<CartItem> items;

  /// أسطر لم تعد متاحة حسب آخر تحقق مع السيرفر: المنتج حُذف أو أُوقف، نفد،
  /// أو أُلغي تدرجه. تبقى ظاهرة حتى تقرر الزبونة (لا نحذف من سلتها شيئاً بصمت).
  final Set<String> unavailableKeys;

  /// أسطر بلا تدرج لمنتج صار له أكثر من تدرج معروض: السيرفر يرفض الطلب حتى تختار الزبونة
  /// لوناً. منفصلة عن [unavailableKeys] لأن الحل اختيار اللون لا الحذف.
  final Set<String> needsShadeKeys;

  const CartState(this.items, {this.unavailableKeys = const {}, this.needsShadeKeys = const {}});

  int get count => items.fold(0, (s, e) => s + e.quantity);
  int get subtotal => items.fold(0, (s, e) => s + e.lineTotal);
  bool get isEmpty => items.isEmpty;
  bool get hasUnavailable => unavailableKeys.isNotEmpty;
  bool isUnavailable(String key) => unavailableKeys.contains(key);
  bool needsShade(String key) => needsShadeKeys.contains(key);

  /// سطر يمنع إتمام الطلب: غير متوفر، أو ينتظر اختيار اللون.
  bool isBlocked(String key) => isUnavailable(key) || needsShade(key);
  bool get blocksCheckout => hasUnavailable || needsShadeKeys.isNotEmpty;
}

/// ما وجده التحقق من السلة مع السيرفر. كل تغيير يُبلَّغ مرة واحدة فقط.
class CartRevalidation {
  /// أسطر تغيّر سعرها (السلة تعرض السعر الجديد الآن).
  final Set<String> changedPriceKeys;

  /// كل الأسطر غير المتاحة الآن (مثل [CartState.unavailableKeys]).
  final Set<String> unavailableKeys;

  /// كل الأسطر التي تنتظر اختيار اللون الآن (مثل [CartState.needsShadeKeys]).
  final Set<String> needsShadeKeys;

  /// أسطر خُفّضت كميتها إلى المتوفر.
  final Set<String> clampedKeys;

  /// باقات انتهت أو أُوقفت فأُزيلت من السلة (منتجاتها باقية بسعرها العادي).
  final List<String> droppedPackageNames;

  /// باقات تغيّرت منتجاتها أو كمياتها (التوفير يُحسب الآن بمحتواها الجديد).
  final List<String> changedPackageNames;

  const CartRevalidation({
    this.changedPriceKeys = const {},
    this.unavailableKeys = const {},
    this.needsShadeKeys = const {},
    this.clampedKeys = const {},
    this.droppedPackageNames = const [],
    this.changedPackageNames = const [],
  });

  static const none = CartRevalidation();

  bool get hasChanges =>
      changedPriceKeys.isNotEmpty ||
      unavailableKeys.isNotEmpty ||
      needsShadeKeys.isNotEmpty ||
      clampedKeys.isNotEmpty ||
      droppedPackageNames.isNotEmpty ||
      changedPackageNames.isNotEmpty;
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier(this._ref) : super(const CartState([])) {
    _load();
    _lifecycle = AppLifecycleListener(onResume: _onResume);
  }

  final Ref _ref;
  late final AppLifecycleListener _lifecycle;

  static const _key = 'cart_items_v1';

  /// لا نتحقق أكثر من مرة في الدقيقة (العودة للتطبيق وفتح السلة والدفع متقاربة).
  static const _revalidateEvery = Duration(seconds: 60);

  /// معرّفات في طلب واحد (حد الخادم 50) — سلة أطول تُقسم إلى طلبات متوازية.
  static const _revalidateBatch = 50;

  DateTime? _lastRevalidated;
  Future<void>? _revalidating;

  // ما وجده تحقق لم يُبلَّغ بعد (مثل تحقق العودة للتطبيق) — يصل لأول من يطلب التحقق.
  final _unreportedPrice = <String>{};
  final _unreportedClamped = <String>{};
  final _unreportedPackages = <String>[];
  final _unreportedChangedPackages = <String>[];

  int _maxQty(CartItem item) => item.stock > 0 ? item.stock : 999;

  @override
  void dispose() {
    _lifecycle.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || !mounted) return;
    try {
      final saved = (jsonDecode(raw) as List).map((e) => CartItem.fromJson(Map<String, dynamic>.from(e))).toList();
      // ما أُضيف قبل اكتمال التحميل يبقى مع المحفوظ — لا يستبدل أحدهما الآخر.
      final added = state.items;
      final keys = {for (final e in added) e.key};
      _emit([...saved.where((e) => !keys.contains(e.key)), ...added]);
      if (added.isNotEmpty) _persist();
    } catch (_) {}
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(state.items.map((e) => e.toJson()).toList()));
  }

  /// كل تعديل يمر من هنا: علامتا «غير متوفر» و«اختاري اللون» تبقيان فقط لأسطر ما زالت في السلة.
  void _emit(List<CartItem> items, {Set<String>? unavailable, Set<String>? needsShade}) {
    final keys = {for (final e in items) e.key};
    final flags = (unavailable ?? state.unavailableKeys).where(keys.contains).toSet();
    final shadeFlags = (needsShade ?? state.needsShadeKeys).where(keys.contains).toSet();
    state = CartState(
      items,
      unavailableKeys: Set.unmodifiable(flags),
      needsShadeKeys: Set.unmodifiable(shadeFlags),
    );
  }

  /// يضيف ويعيد عدد القطع المضافة فعلاً (قد يكون أقل من [quantity] عند حد المخزون، و0 إن
  /// لم تُضف أي قطعة). السطر يُبنى من المنتج كما وصل الآن، فيتجدد سعره ومخزونه واسمه وصورته.
  int addCounted(Product product, {int quantity = 1, ProductShade? shade}) {
    if (quantity <= 0) return 0;
    final fresh = CartItem.fromProduct(product, quantity: quantity, shade: shade);
    final items = [...state.items];
    final idx = items.indexWhere((e) => e.key == fresh.key);
    final had = idx >= 0 ? items[idx].quantity : 0;
    final newQty = (had + quantity).clamp(1, _maxQty(fresh));
    final line = fresh.copyWith(quantity: newQty);
    if (idx >= 0) {
      items[idx] = line;
    } else {
      items.add(line);
    }
    final unavailable = {...state.unavailableKeys};
    if (line.stock > 0) unavailable.remove(line.key);
    _emit(items, unavailable: unavailable);
    _persist();
    return (newQty - had).clamp(0, quantity);
  }

  /// يعيد false إذا لم تُضف أي قطعة (الكمية بلغت حد المخزون).
  bool add(Product product, {int quantity = 1, ProductShade? shade}) =>
      addCounted(product, quantity: quantity, shade: shade) > 0;

  void setQuantity(String key, int quantity) {
    if (quantity <= 0) {
      remove(key);
      return;
    }
    // سطر غير متوفر (أو ينتظر لونه) يمكن إنقاصه أو حذفه فقط.
    final blocked = state.isBlocked(key);
    final items = [
      for (final e in state.items)
        if (e.key == key)
          e.copyWith(quantity: quantity.clamp(1, blocked ? e.quantity : _maxQty(e)))
        else
          e,
    ];
    _emit(items);
    _persist();
  }

  /// يعيد false عند الوصول لحد المخزون (أو إن لم يعد السطر متاحاً).
  bool increment(String key) {
    final item = state.items.firstWhere((e) => e.key == key);
    if (state.isBlocked(key) || item.quantity >= _maxQty(item)) return false;
    setQuantity(key, item.quantity + 1);
    return true;
  }

  void decrement(String key) {
    final item = state.items.firstWhere((e) => e.key == key);
    setQuantity(key, item.quantity - 1);
  }

  int quantityForProduct(String productId) =>
      state.items.where((e) => e.productId == productId).fold(0, (s, e) => s + e.quantity);

  CartItem? firstItemForProduct(String productId) {
    for (final item in state.items) {
      if (item.productId == productId) return item;
    }
    return null;
  }

  bool incrementProduct(Product product) {
    if (product.hasMultipleDisplayableShades) return false;
    final sole = product.soleDisplayableShade;
    if (sole != null) {
      for (final item in state.items) {
        if (item.productId == product.id && item.shadeId == sole.id) {
          return increment(item.key);
        }
      }
      return add(product, shade: sole);
    }
    final existing = firstItemForProduct(product.id);
    if (existing != null && existing.shadeId == null) {
      return increment(existing.key);
    }
    return add(product);
  }

  void decrementProduct(String productId) {
    final item = firstItemForProduct(productId);
    if (item != null) decrement(item.key);
  }

  void remove(String key) {
    _emit(state.items.where((e) => e.key != key).toList());
    _persist();
  }

  /// يعيد عنصراً محذوفاً (زر "تراجع") إلى موضعه السابق إن لم يُضف من جديد.
  void restore(CartItem item, {int? index}) {
    if (state.items.any((e) => e.key == item.key)) return;
    final items = [...state.items];
    final at = (index ?? items.length).clamp(0, items.length);
    items.insert(at, item);
    _emit(items);
    _persist();
  }

  void clear() {
    state = const CartState([]);
    _unreportedPrice.clear();
    _unreportedClamped.clear();
    _unreportedPackages.clear();
    _unreportedChangedPackages.clear();
    _persist();
  }

  // ─── التحقق مع السيرفر ────────────────────────────────────────────────────

  bool get isRevalidating => _revalidating != null;

  /// يتحقق من كل منتج في السلة مع السيرفر: السعر والمخزون والاسم والصورة تتجدد،
  /// والكمية لا تتجاوز المتوفر، وما لم يعد متاحاً يُعلَّم في [CartState.unavailableKeys]
  /// (المنتج حُذف أو أُوقف — السيرفر يعيد 404 لغير الفعّال — نفد، أو أُلغي تدرجه أو نفد).
  /// الباقات تُراجع معه (السعر والصلاحية). مرة في الدقيقة على الأكثر إلا مع [force].
  ///
  /// النتيجة تجمع ما وُجد منذ آخر استدعاء — بما فيه تحقق العودة للتطبيق.
  Future<CartRevalidation> revalidate({bool force = false}) async {
    await _check(force: force);
    return _takeReport();
  }

  void _onResume() {
    if (state.items.isNotEmpty) unawaited(_check());
  }

  Future<void> _check({bool force = false}) {
    final running = _revalidating;
    if (running != null) return running;
    if (state.items.isEmpty) return Future.value();
    final last = _lastRevalidated;
    if (!force && last != null && DateTime.now().difference(last) < _revalidateEvery) {
      return Future.value();
    }
    final run = _runCheck().whenComplete(() => _revalidating = null);
    _revalidating = run;
    return run;
  }

  Future<void> _runCheck() async {
    final api = _ref.read(apiServiceProvider);
    final packages = _ref.read(cartPackagesProvider.notifier).revalidate();
    final ids = {for (final e in state.items) e.productId}.toList();
    // null = لم يعد في المتجر (404)؛ غياب المفتاح = تعذّر الوصول فيبقى السطر كما هو.
    final fresh = <String, Product?>{};
    // طلب واحد لكل 50 منتجاً (بطاقات خفيفة فيها السعر والمخزون وكل التدرجات بأسعارها
    // ومخزونها) بدل طلب لكل سطر.
    final missing = <String>[];
    await Future.wait([
      for (var i = 0; i < ids.length; i += _revalidateBatch)
        () async {
          final batch = ids.skip(i).take(_revalidateBatch).toList();
          try {
            // staleOnError: false — بلا اتصال يُرمى الخطأ بدل نسخة قديمة ليست تحققاً.
            final products = await api.getProductsByIds(batch, forceRefresh: true, staleOnError: false);
            for (final p in products) {
              fresh[p.id] = p;
            }
            // الدفعة نجحت: الغائب عنها إما حُذف أو أُوقف، أو أخفته إعدادات القوائم (النافد،
            // بلا صورة) — صفحته وحدها تفصل بينهما.
            missing.addAll(batch.where((id) => !fresh.containsKey(id)));
          } catch (_) {
            // تعذّر الوصول: أسطر هذه الدفعة تبقى كما هي.
          }
        }(),
    ]);
    if (!mounted) return;
    await Future.wait(missing.map((id) async {
      try {
        final product = await api.getProduct(id, forceRefresh: true);
        if (api.isProductFresh(id)) fresh[id] = product;
      } on ApiException catch (e) {
        if (e.status == 404 || e.status == 410) fresh[id] = null;
      } catch (_) {}
    }));
    if (!mounted) return;
    final packs = await packages;
    if (!mounted) return;
    _unreportedPackages.addAll(packs.dropped);
    for (final name in packs.changed) {
      if (!_unreportedChangedPackages.contains(name)) _unreportedChangedPackages.add(name);
    }
    if (fresh.isEmpty) return; // بلا اتصال: نعيد المحاولة في المرة القادمة.
    _lastRevalidated = DateTime.now();
    _apply(fresh);
  }

  /// يطبّق نتيجة التحقق على السلة كما هي الآن (قد تكون تغيّرت أثناء الانتظار).
  void _apply(Map<String, Product?> fresh) {
    final unavailable = {...state.unavailableKeys};
    final needsShade = {...state.needsShadeKeys};
    var changed = false;
    final items = <CartItem>[];
    for (final line in state.items) {
      if (!fresh.containsKey(line.productId)) {
        items.add(line);
        continue;
      }
      final product = fresh[line.productId];
      ProductShade? shade;
      if (line.shadeId != null) {
        shade = product?.shades.where((s) => s.id == line.shadeId).firstOrNull;
      } else if (product != null) {
        // سطر بلا تدرج (إصدار أقدم، أو منتج أضيفت له تدرجات بعد إضافته): السيرفر يأخذ التدرج
        // الوحيد إن وُجد — فنأخذه هنا أيضاً ليطابق السعر والمخزون ما سيُحسب.
        shade = product.soleDisplayableShade;
      }
      // حُذف المنتج أو أُوقف، أو أُلغي تدرجه (الواجهة العامة لا ترسل غير الفعّال).
      if (product == null || (line.shadeId != null && shade == null)) {
        unavailable.add(line.key);
        needsShade.remove(line.key);
        items.add(line);
        continue;
      }
      // صار للمنتج أكثر من لون ولم يُختر واحد: السيرفر يرفض السطر — تختار الزبونة لونها.
      if (line.shadeId == null && product.hasMultipleDisplayableShades) {
        unavailable.remove(line.key);
        needsShade.add(line.key);
        items.add(line);
        continue;
      }
      needsShade.remove(line.key);
      final rebuilt = CartItem.fromProduct(product, quantity: line.quantity, shade: shade);
      // تبنّي التدرج الوحيد يغيّر مفتاح السطر: العلامات القديمة لا تبقى عليه.
      if (rebuilt.key != line.key) unavailable.remove(line.key);
      final CartItem next;
      if (rebuilt.stock <= 0) {
        unavailable.add(rebuilt.key);
        next = rebuilt;
      } else {
        unavailable.remove(rebuilt.key);
        final qty = line.quantity.clamp(1, rebuilt.stock);
        if (qty != line.quantity) _unreportedClamped.add(rebuilt.key);
        if (rebuilt.price != line.price) _unreportedPrice.add(rebuilt.key);
        next = rebuilt.copyWith(quantity: qty);
      }
      if (jsonEncode(next.toJson()) != jsonEncode(line.toJson())) changed = true;
      items.add(next);
    }
    final merged = _mergeSameKey(items);
    if (merged.length != items.length) changed = true;
    if (!changed &&
        setEquals(unavailable, state.unavailableKeys) &&
        setEquals(needsShade, state.needsShadeKeys)) {
      return;
    }
    _emit(merged, unavailable: unavailable, needsShade: needsShade);
    if (changed) _persist();
  }

  /// سطران صارا بالمفتاح نفسه (سطر بلا تدرج أخذ التدرج الوحيد وكان مضافاً به أيضاً) — يُدمجان
  /// في موضع الأول، والكمية لا تتجاوز المتوفر.
  List<CartItem> _mergeSameKey(List<CartItem> items) {
    final byKey = <String, int>{};
    final out = <CartItem>[];
    for (final item in items) {
      final at = byKey[item.key];
      if (at == null) {
        byKey[item.key] = out.length;
        out.add(item);
        continue;
      }
      final first = out[at];
      final qty = (first.quantity + item.quantity).clamp(1, _maxQty(first));
      if (qty < first.quantity + item.quantity) _unreportedClamped.add(first.key);
      out[at] = first.copyWith(quantity: qty);
    }
    return out;
  }

  CartRevalidation _takeReport() {
    final keys = {for (final e in state.items) e.key};
    final report = CartRevalidation(
      changedPriceKeys: _unreportedPrice.where(keys.contains).toSet(),
      unavailableKeys: {...state.unavailableKeys},
      needsShadeKeys: {...state.needsShadeKeys},
      clampedKeys: _unreportedClamped.where(keys.contains).toSet(),
      droppedPackageNames: List.unmodifiable(_unreportedPackages),
      changedPackageNames: List.unmodifiable(_unreportedChangedPackages),
    );
    _unreportedPrice.clear();
    _unreportedClamped.clear();
    _unreportedPackages.clear();
    _unreportedChangedPackages.clear();
    return report;
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) => CartNotifier(ref));
