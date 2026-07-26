import '../config/app_config.dart';

/// يحوّل مسار وسائط نسبي إلى رابط كامل صالح للعرض.
String resolveMediaUrl(String? raw) {
  final value = (raw ?? '').trim();
  if (value.isEmpty) return '';

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return AppConfig.normalizeAppUrl(value);
  }

  final base = AppConfig.mediaBaseUrl;
  final origin = AppConfig.webOrigin;

  if (value.startsWith('/media')) return '$origin$value';
  if (value.startsWith('/')) return '$origin$value';
  return '$base/$value';
}
