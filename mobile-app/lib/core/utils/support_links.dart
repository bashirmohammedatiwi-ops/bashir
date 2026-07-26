import 'package:url_launcher/url_launcher.dart';

Future<bool> openWhatsApp(String? phone, {String? message}) async {
  final raw = (phone ?? '').replaceAll(RegExp(r'\D'), '');
  if (raw.isEmpty) return false;
  final text = message != null ? Uri.encodeComponent(message) : '';
  final uri = Uri.parse('https://wa.me/$raw${text.isNotEmpty ? '?text=$text' : ''}');
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}

Future<bool> callPhone(String? phone) async {
  final raw = (phone ?? '').replaceAll(RegExp(r'[^\d+]'), '');
  if (raw.isEmpty) return false;
  return launchUrl(Uri.parse('tel:$raw'));
}

Future<bool> openEmail(String email, {String? subject, String? body}) async {
  final trimmed = email.trim();
  if (trimmed.isEmpty) return false;
  final params = <String, String>{};
  if (subject != null && subject.isNotEmpty) params['subject'] = subject;
  if (body != null && body.isNotEmpty) params['body'] = body;
  final uri = Uri(
    scheme: 'mailto',
    path: trimmed,
    queryParameters: params.isEmpty ? null : params,
  );
  if (!await canLaunchUrl(uri)) return false;
  return launchUrl(uri);
}

Future<bool> openExternalUrl(String url) async {
  final trimmed = url.trim();
  if (trimmed.isEmpty) return false;
  final uri = Uri.tryParse(trimmed);
  if (uri == null) return false;
  final normalized = uri.hasScheme ? uri : Uri.parse('https://$trimmed');
  if (!await canLaunchUrl(normalized)) return false;
  return launchUrl(normalized, mode: LaunchMode.externalApplication);
}
