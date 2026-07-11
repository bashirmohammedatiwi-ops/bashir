import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/catalog.dart';
import '../repositories/catalog_repository.dart';

final catalogStoresProvider = FutureProvider<List<CatalogStore>>((ref) async {
  final repo = ref.read(catalogRepositoryProvider);
  return repo.fetchCatalogStores();
});
