/// Central runtime configuration.
///
/// Switch `useRemoteApi` to true (or build with `--dart-define USE_REMOTE_API=true`)
/// to consume the NestJS backend instead of mock data.
class AppConfig {
  static const bool useRemoteApi =
      bool.fromEnvironment('USE_REMOTE_API', defaultValue: false);

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );

  static const String mediaBaseUrl = String.fromEnvironment(
    'MEDIA_BASE_URL',
    defaultValue: 'http://10.0.2.2/media',
  );

  static const Duration networkTimeout = Duration(seconds: 12);
}
