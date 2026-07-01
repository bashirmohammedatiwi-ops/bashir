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
