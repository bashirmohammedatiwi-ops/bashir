class AppConfig {
  AppConfig._();

  /// Production host (VPS IP 187.127.88.146 is no longer reachable).
  static const String productionHost = 'deemaalhayat.com';

  static const String _defaultApi = 'https://$productionHost/api/v1';
  static const String _defaultCatalogHub = 'https://$productionHost/catalog-hub';

  static String get apiBaseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    return fromEnv.isNotEmpty ? fromEnv : _defaultApi;
  }

  static String get catalogHubUrl {
    const fromEnv = String.fromEnvironment('CATALOG_HUB_URL');
    return fromEnv.isNotEmpty ? fromEnv.replaceAll(RegExp(r'/$'), '') : _defaultCatalogHub;
  }

  static String get mediaBaseUrl {
    const fromEnv = String.fromEnvironment('MEDIA_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv.replaceAll(RegExp(r'/$'), '');
    return apiBaseUrl.replaceAll(RegExp(r'/api/v1/?$'), '/media');
  }

  static const List<String> catalogStores = [
    'miswag',
    'najdalatheyah',
    'alkhabeer',
    'elryan',
    'faces',
    'miraaya',
    'beautyway',
    'khaton',
    'orisdi',
    'waheteter',
    'niceone',
    'amazon',
  ];

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 90);
  static const Duration catalogTimeout = Duration(seconds: 120);
}
