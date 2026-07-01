import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/catalog/catalog_providers.dart';

/// يبدأ تحميل البيانات الأساسية أثناء شاشة الترحيب.
void warmupAppData(WidgetRef ref) {
  ref.read(homeFeedProvider.future);
  ref.read(categoriesProvider.future);
  ref.read(brandsProvider.future);
}
