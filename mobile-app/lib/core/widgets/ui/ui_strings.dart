import '../../l10n/app_strings.dart';

/// نصوص مكوّنات الواجهة المشتركة (core/widgets) — امتداد على [AppStrings]
/// يبقيها بجانب المكوّنات التي تستخدمها، بلغتي التطبيق.
extension UiStringsX on AppStrings {
  /// عنوان حالة الخطأ حين لم يصل الطلب للخادم أصلاً.
  String get uiNoConnection => isAr ? 'لا يوجد اتصال بالإنترنت' : 'No internet connection';

  String get uiNoConnectionBody => isAr
      ? 'تحققي من اتصالكِ بالإنترنت ثم حاولي مجدداً.'
      : 'Check your internet connection and try again.';
}
