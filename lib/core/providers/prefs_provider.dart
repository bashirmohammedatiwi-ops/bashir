import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../bootstrap/app_bootstrap.dart';
import '../services/prefs_service.dart';

/// Synchronous — initialized in main() via AppBootstrap.init().
final prefsProvider = Provider<PrefsService>((ref) {
  return AppBootstrap.prefs;
});
