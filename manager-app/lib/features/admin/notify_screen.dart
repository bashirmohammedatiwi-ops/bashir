import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/admin_repo.dart';
import '../../data/models.dart';
import '../../data/repo.dart';
import '../../widgets/common.dart';
import '../search/search_screen.dart';

final _sentProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) => ref.watch(repoProvider).sentNotifications());
final _statsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) => ref.watch(repoProvider).notificationStats());

/// إشعار لكل الزبونات (يفتح منتجاً أو العروض) + سجل ما أُرسل.
class NotifyScreen extends ConsumerStatefulWidget {
  const NotifyScreen({super.key});
  @override
  ConsumerState<NotifyScreen> createState() => _NotifyScreenState();
}

class _NotifyScreenState extends ConsumerState<NotifyScreen> {
  final _title = TextEditingController();
  final _body = TextEditingController();
  String _link = 'NONE';
  ProductSummary? _product;
  bool _sending = false;

  Future<void> _pickProduct() async {
    final p = await Navigator.of(context).push<ProductSummary>(MaterialPageRoute(builder: (_) => const _ProductPick()));
    if (p != null) setState(() => (_product = p, _link = 'PRODUCT'));
  }

  Future<void> _send() async {
    if (_title.text.trim().isEmpty || _body.text.trim().isEmpty) return toast(context, 'اكتب العنوان والنص', error: true);
    if (_link == 'PRODUCT' && _product == null) return toast(context, 'اختر المنتج', error: true);
    final stats = ref.read(_statsProvider).valueOrNull;
    if (!await confirm(
      context,
      title: 'إرسال لكل الزبونات؟',
      message: '«${_title.text.trim()}»\n${_body.text.trim()}${stats != null ? '\n\nسيصل إلى ${stats['activeDevices']} جهاز.' : ''}',
      ok: 'إرسال',
    )) {
      return;
    }
    setState(() => _sending = true);
    try {
      await ref.read(repoProvider).sendNotification({
        'title': _title.text.trim(),
        'body': _body.text.trim(),
        'targetType': 'ALL',
        'type': _link == 'PRODUCT' ? 'NEW_ARRIVAL' : 'OFFER',
        'sendPush': true,
        'linkType': _link,
        if (_link == 'PRODUCT') 'linkId': _product!.id,
      });
      if (!mounted) return;
      toast(context, 'أُرسل الإشعار');
      _title.clear();
      _body.clear();
      setState(() => (_product = null, _link = 'NONE'));
      ref.invalidate(_sentProvider);
      ref.invalidate(_statsProvider);
    } catch (e) {
      if (mounted) toastError(context, e);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final stats = ref.watch(_statsProvider).valueOrNull;
    final sent = ref.watch(_sentProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('إشعار للزبونات')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 40),
        children: [
          if (stats != null)
            Panel(
              color: AppColors.infoSoft,
              padding: const EdgeInsets.all(12),
              child: Text(
                stats['fcmEnabled'] == false
                    ? 'الإشعارات الفورية غير مفعلة على السيرفر — يُحفظ الإشعار داخل التطبيق فقط'
                    : 'يصل إلى ${stats['activeDevices']} جهاز · أُرسل حتى الآن ${stats['pushSent']}',
                style: const TextStyle(color: AppColors.info, fontWeight: FontWeight.w700),
              ),
            ),
          const SizedBox(height: 12),
          TextField(
            controller: _title,
            maxLength: 60,
            decoration: const InputDecoration(labelText: 'العنوان', hintText: 'وصل حديثاً ✨'),
          ),
          TextField(
            controller: _body,
            maxLength: 180,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'النص',
              hintText: 'تشكيلة جديدة من أحمر الشفاه بخصم 20%',
              alignLabelWithHint: true,
            ),
          ),
          const Text('عند الضغط على الإشعار يفتح:', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: const Text('التطبيق'),
                selected: _link == 'NONE',
                onSelected: (_) => setState(() => _link = 'NONE'),
                showCheckmark: false,
              ),
              ChoiceChip(
                label: const Text('صفحة العروض'),
                selected: _link == 'OFFERS',
                onSelected: (_) => setState(() => _link = 'OFFERS'),
                showCheckmark: false,
              ),
              ChoiceChip(
                label: Text(_product == null ? 'منتج…' : 'منتج: ${_product!.name}', overflow: TextOverflow.ellipsis),
                selected: _link == 'PRODUCT',
                onSelected: (_) => _pickProduct(),
                showCheckmark: false,
              ),
            ],
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _sending ? null : _send,
            icon: _sending
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                : const Icon(Icons.send_rounded),
            label: const Text('إرسال لكل الزبونات'),
          ),
          const SectionTitle('آخر ما أُرسل'),
          sent.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => ErrorView(e, onRetry: () => ref.invalidate(_sentProvider)),
            data: (list) => list.isEmpty
                ? const Text('لم يُرسل شيء بعد', style: TextStyle(color: AppColors.muted))
                : Column(
                    children: [
                      for (final n in list)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Panel(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text('${n['title']}', style: const TextStyle(fontWeight: FontWeight.w800)),
                                    ),
                                    Text(timeAgo(parseDate(n['createdAt'])), style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                                  ],
                                ),
                                Text('${n['body']}', style: const TextStyle(height: 1.5)),
                                const SizedBox(height: 4),
                                Text(
                                  'وصل ${n['sentCount'] ?? 0} · فشل ${n['failedCount'] ?? 0} · ${n['targetType'] == 'USER' ? 'لزبونة واحدة' : 'للكل'}',
                                  style: const TextStyle(color: AppColors.muted, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _ProductPick extends StatelessWidget {
  const _ProductPick();
  @override
  Widget build(BuildContext context) => SearchScreen(autofocus: true, onPick: (p) => Navigator.pop(context, p));
}
