import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/app_config.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../checkout/providers/checkout_provider.dart';

class AddressesScreen extends ConsumerWidget {
  const AddressesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addressesAsync = ref.watch(addressesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(AppStrings.addresses)),
      floatingActionButton: AppConfig.useRemoteApi
          ? null
          : FloatingActionButton(
              onPressed: () => _showAddDialog(context, ref),
              backgroundColor: AppColors.primary,
              child: const Icon(Icons.add, color: Colors.white),
            ),
      body: addressesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('تعذر تحميل العناوين')),
        data: (addresses) {
          if (addresses.isEmpty) {
            return Center(
              child: Text(
                AppConfig.useRemoteApi
                    ? 'أضيفي عنواناً من لوحة الحساب أو تواصلي مع الدعم'
                    : 'لا توجد عناوين',
                style: AppTextStyles.body(),
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: addresses.length,
            itemBuilder: (context, index) {
              final addr = addresses[index];
              return Card(
                child: ListTile(
                  leading: addr.isDefault
                      ? const Icon(Icons.star, color: AppColors.primary)
                      : const Icon(Icons.location_on_outlined),
                  title: Text(addr.name, style: AppTextStyles.title()),
                  subtitle: Text(addr.fullAddress),
                ),
              );
            },
          );
        },
      ),
    );
  }

  void _showAddDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('إضافة عنوان'),
        content: const Text('نموذج إضافة عنوان (وضع تجريبي بدون API)'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إغلاق'),
          ),
        ],
      ),
    );
  }
}
