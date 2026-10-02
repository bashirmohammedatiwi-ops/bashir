import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/app_strings.dart';
import '../auth/auth_provider.dart';
import '../home/widgets/home_theme.dart';
import '../../core/widgets/shimmer_box.dart';
import 'assistant_providers.dart';
import 'models/assistant_models.dart';

const _border = AppColors.border;

/// سجل محادثات المساعد — للمستخدمين المسجلين (الزوار تستمر محادثتهم بالجهاز).
class AssistantHistoryScreen extends ConsumerWidget {
  const AssistantHistoryScreen({super.key});

  String _formatDate(DateTime date) {
    if (date.year <= 2000) return '';
    return '${date.year}/${date.month.toString().padLeft(2, '0')}/${date.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final strings = ref.watch(stringsProvider);
    final history = ref.watch(assistantHistoryProvider);
    final isAr = strings.isAr;

    return Scaffold(
      backgroundColor: HomeTheme.canvas,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0.5,
        title: Text(
          isAr ? 'سجل المحادثات' : 'Chat history',
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(
            tooltip: isAr ? 'محادثة جديدة' : 'New chat',
            onPressed: () {
              ref.read(assistantProvider.notifier).clearConversation();
              Navigator.of(context).pop();
            },
            icon: const Icon(Icons.add_comment_outlined),
          ),
        ],
      ),
      body: !auth.isAuthenticated
          ? _GuestNotice(isAr: isAr)
          : history.when(
              loading: () => ListView(
                padding: const EdgeInsets.all(12),
                children: List.generate(6, (_) => const Padding(padding: EdgeInsets.only(bottom: 8), child: ShimmerBox(height: 74, radius: 14))),
              ),
              error: (e, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(isAr ? 'تعذر تحميل السجل' : 'Failed to load history'),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => ref.invalidate(assistantHistoryProvider),
                      child: Text(isAr ? 'إعادة المحاولة' : 'Retry'),
                    ),
                  ],
                ),
              ),
              data: (items) => items.isEmpty
                  ? Center(
                      child: Text(
                        isAr ? 'ما عندك محادثات محفوظة بعد' : 'No saved conversations yet',
                        style: const TextStyle(color: Colors.black45),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () async => ref.refresh(assistantHistoryProvider.future),
                      child: ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (_, i) => _HistoryTile(
                          item: items[i],
                          isAr: isAr,
                          dateLabel: _formatDate(items[i].lastMessageAt),
                        ),
                      ),
                    ),
            ),
    );
  }
}

class _GuestNotice extends ConsumerWidget {
  final bool isAr;
  const _GuestNotice({required this.isAr});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.lock_outline, size: 40, color: Colors.black26),
            const SizedBox(height: 12),
            Text(
              isAr
                  ? 'سجل المحادثات يحتاج تسجيل دخول — محادثتك الحالية محفوظة على جهازك وتستمر تلقائياً.'
                  : 'Chat history needs an account — your current chat stays on this device and resumes automatically.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13.5, height: 1.6, color: Colors.black54),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryTile extends ConsumerWidget {
  final AssistantConversationSummary item;
  final bool isAr;
  final String dateLabel;

  const _HistoryTile({
    required this.item,
    required this.isAr,
    required this.dateLabel,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final title = item.title.isNotEmpty
        ? item.title
        : (isAr ? 'محادثة بدون عنوان' : 'Untitled chat');
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () async {
          try {
            await ref.read(assistantProvider.notifier).loadConversation(item.id);
            if (context.mounted) Navigator.of(context).pop();
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    isAr ? 'تعذر فتح المحادثة' : 'Could not open this chat',
                  ),
                ),
              );
            }
          }
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: _border),
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: const BoxDecoration(
                  color: HomeTheme.accent,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.auto_awesome, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${item.messageCount} ${isAr ? 'رسالة' : 'messages'}'
                      '${dateLabel.isNotEmpty ? ' • $dateLabel' : ''}',
                      style: const TextStyle(fontSize: 11.5, color: Colors.black45),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.black26),
            ],
          ),
        ),
      ),
    );
  }
}
