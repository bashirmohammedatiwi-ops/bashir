import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';
import '../../features/catalog/catalog_providers.dart';

/// يبدأ تحميل البيانات الأساسية عند فتح التطبيق.
void warmupAppData(WidgetRef ref) {
  ref.read(homeFeedProvider.future);
  ref.read(offersFeedProvider.future);
  ref.read(categoriesProvider.future);
  ref.read(brandsProvider.future);
}
