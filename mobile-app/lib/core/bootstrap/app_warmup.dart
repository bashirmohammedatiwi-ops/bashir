import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';
import '../../features/catalog/catalog_providers.dart';

/// يبدأ تحميل البيانات الأساسية عند فتح التطبيق.
void warmupAppData(WidgetRef ref) {
  // إسقاط كاش الأقسام القديم (قبل تقسيمة نايس ون)
  Future(() async {
    final cache = ref.read(apiCacheProvider);
    await cache.remove('categories_all_v1');
  });

  ref.read(homeFeedProvider.future);
  ref.read(categoriesProvider.future);
  ref.read(brandsProvider.future);
}
