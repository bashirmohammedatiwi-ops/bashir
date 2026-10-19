import 'package:flutter_riverpod/flutter_riverpod.dart';

/// فهارس تبويبات الشريط السفلي — مصدر واحد لتجنب الأرقام السحرية.
abstract final class NavTabs {
  static const home = 0;
  static const categories = 1;
  static const offers = 2;
  static const cart = 3;
  static const account = 4;

  /// أُضيف لاحقاً — رقمه في الآخر حتى لا تتغيّر فهارس التبويبات القديمة،
  /// ومكانه في الشريط بعد الأقسام.
  static const brands = 5;
}

/// لمسة جديدة على تبويب مفتوح أصلاً: `tab` فهرسه و`tick` يزداد مع كل لمسة
/// (فتتكرّر الإشارة حتى للتبويب نفسه). الـ shell يرفعه، والبراندات والأقسام
/// تستمع إليه لتمسح البحث وتصعد لأعلى القائمة.
final tabReselectProvider = StateProvider<({int tab, int tick})>((_) => (tab: -1, tick: 0));
