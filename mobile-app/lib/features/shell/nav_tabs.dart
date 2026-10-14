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
