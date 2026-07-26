import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

final packageInfoProvider = FutureProvider<PackageInfo>((ref) {
  return PackageInfo.fromPlatform();
});

final appVersionLabelProvider = Provider<String>((ref) {
  final info = ref.watch(packageInfoProvider);
  return info.when(
    data: (p) => '${p.version} (${p.buildNumber})',
    loading: () => '…',
    error: (_, __) => '1.0.0',
  );
});
