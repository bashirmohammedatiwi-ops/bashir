import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/bootstrap/app_storage.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/motion/app_motion.dart';
import '../../core/widgets/app_snackbar.dart';
import '../../data/models/product.dart';
import '../catalog/recently_viewed_provider.dart';
import 'compare_screen.dart';
import 'compare_strings.dart';

/// مفتاح الحفظ — لقطات خفيفة تكفي للشريط العائم ورأس الجدول، والتفاصيل تُجلب طازجة.
const _key = 'compare_v1';

/// أقصى عدد منتجات في المقارنة — نفس الموقع.
const kCompareMax = 4;

/// أقل عدد تبدأ عنده المقارنة (ويظهر الشريط العائم).
const kCompareMin = 2;

/// قائمة المقارنة: المنتجات بترتيب إضافتها، وهل أخفت الزبونة الشريط العائم.
@immutable
class CompareState {
  final List<Product> items;

  /// أُخفي الشريط بلمسة «×» — يعود حين تتغيّر القائمة (للجلسة فقط، لا يُحفظ).
  final bool trayDismissed;

  const CompareState({this.items = const [], this.trayDismissed = false});

  bool contains(String id) => items.any((p) => p.id == id);
  int get count => items.length;
  bool get isFull => items.length >= kCompareMax;
  bool get canCompare => items.length >= kCompareMin;
  List<String> get ids => [for (final p in items) p.id];

  CompareState copyWith({List<Product>? items, bool? trayDismissed}) => CompareState(
        items: items ?? this.items,
        trayDismissed: trayDismissed ?? this.trayDismissed,
      );
}

/// نتيجة محاولة التبديل من زر «قارني».
enum CompareToggle { added, removed, full }

class CompareNotifier extends StateNotifier<CompareState> {
  CompareNotifier() : super(_restore());

  static CompareState _restore() {
    try {
      final raw = appSharedPreferences.getString(_key);
      if (raw == null || raw.isEmpty) return const CompareState();
      final items = <Product>[];
      for (final e in jsonDecode(raw) as List) {
        if (e is! Map) continue;
        final p = Product.fromJson(Map<String, dynamic>.from(e));
        if (p.id.isEmpty || items.any((x) => x.id == p.id)) continue;
        items.add(p);
        if (items.length >= kCompareMax) break;
      }
      return CompareState(items: items);
    } catch (_) {
      // نسخة تالفة: نبدأ فارغين بدل أن تتعطل الصفحة.
      return const CompareState();
    }
  }

  void _persist() {
    try {
      if (state.items.isEmpty) {
        appSharedPreferences.remove(_key);
      } else {
        appSharedPreferences.setString(_key, jsonEncode([for (final p in state.items) productListSnapshot(p)]));
      }
    } catch (_) {
      // التخزين غير متاح: تبقى القائمة في الذاكرة لهذه الجلسة.
    }
  }

  bool add(Product p) {
    if (state.contains(p.id)) return true;
    if (state.isFull) return false;
    state = CompareState(items: [...state.items, p]);
    _persist();
    return true;
  }

  void remove(String id) {
    if (!state.contains(id)) return;
    state = state.copyWith(items: state.items.where((p) => p.id != id).toList(growable: false));
    _persist();
  }

  CompareToggle toggle(Product p) {
    if (state.contains(p.id)) {
      remove(p.id);
      return CompareToggle.removed;
    }
    return add(p) ? CompareToggle.added : CompareToggle.full;
  }

  void clear() {
    state = const CompareState();
    _persist();
  }

  /// يعيد قائمة سابقة كما كانت («تراجع» بعد مسح الكل).
  void restore(List<Product> items) {
    state = CompareState(items: items.take(kCompareMax).toList(growable: false));
    _persist();
  }

  void dismissTray() {
    if (!state.trayDismissed) state = state.copyWith(trayDismissed: true);
  }

  /// نسخ طازجة من السيرفر لـ [requested]: تحلّ محل اللقطات بنفس الترتيب، وما لم يعد
  /// (حُذف أو أُوقف) يسقط. يعيد عدد ما أُسقط.
  int applyFresh(List<String> requested, List<Product> fresh) {
    final byId = {for (final p in fresh) p.id: p};
    var dropped = 0;
    final next = <Product>[];
    for (final p in state.items) {
      if (!requested.contains(p.id)) {
        next.add(p);
      } else if (byId[p.id] case final f?) {
        next.add(f);
      } else {
        dropped++;
      }
    }
    state = state.copyWith(items: next);
    _persist();
    return dropped;
  }
}

final compareProvider = StateNotifierProvider<CompareNotifier, CompareState>((ref) => CompareNotifier());

/// زر «قارني» في أي مكان: يبدّل المنتج ويخبر الزبونة بما حدث — مع «قارني الآن»
/// متى صار عندها منتجان أو أكثر (الشريط العائم لا يظهر فوق الصفحات المفتوحة).
CompareToggle toggleCompare(BuildContext context, WidgetRef ref, Product product) {
  final s = ref.read(stringsProvider);
  final result = ref.read(compareProvider.notifier).toggle(product);
  final count = ref.read(compareProvider).count;
  // الراوتر لا السياق: قد تُغلق الصفحة قبل لمس «قارني الآن».
  final router = GoRouter.of(context);
  void open() => openCompareWith(router);

  switch (result) {
    case CompareToggle.full:
      AppHaptics.warn();
      AppSnackbar.action(
        context,
        message: s.compareMax(kCompareMax),
        actionLabel: s.compareNow,
        onAction: open,
      );
    case CompareToggle.added:
      AppHaptics.select();
      if (count >= kCompareMin) {
        AppSnackbar.action(
          context,
          message: s.compareAdded,
          actionLabel: s.compareNow,
          onAction: open,
        );
      } else {
        AppSnackbar.show(context, s.compareAddedFirst);
      }
    case CompareToggle.removed:
      AppHaptics.select();
      AppSnackbar.show(context, s.compareRemoved);
  }
  return result;
}
