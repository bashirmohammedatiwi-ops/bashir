/// Central runtime configuration — production defaults point to VPS.
class AppConfig {
  static const bool useRemoteApi =
      bool.fromEnvironment('USE_REMOTE_API', defaultValue: true);

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://187.127.88.146/api/v1',
  );

  static const String mediaBaseUrl = String.fromEnvironment(
    'MEDIA_BASE_URL',
    defaultValue: 'http://187.127.88.146/media',
  );

  static const Duration networkTimeout = Duration(seconds: 20);
}
