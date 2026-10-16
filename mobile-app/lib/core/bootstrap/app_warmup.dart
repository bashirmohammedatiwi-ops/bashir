import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/catalog/catalog_providers.dart';
import '../../features/worlds/worlds_provider.dart';

/// يبدأ تحميل البيانات الأساسية عند فتح التطبيق.
void warmupAppData(WidgetRef ref) {
  // العوالم + العالم المعروض يُجلبان من الرئيسية نفسها؛ لا نجلب الواجهة العامة القديمة.
  ref.read(worldsProvider.future);
  ref.read(offersFeedProvider.future);
  ref.read(categoriesProvider.future);
  ref.read(brandsProvider.future);
}
