import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/text_styles.dart';
import '../../../data/models/address_model.dart';
import '../../checkout/providers/checkout_provider.dart';

class AddressesScreen extends ConsumerWidget {
  const AddressesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addressesAsync = ref.watch(addressesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(AppStrings.addresses)),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddDialog(context, ref),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: addressesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(
          child: TextButton(
            onPressed: () => ref.invalidate(addressesProvider),
            child: const Text('إعادة المحاولة'),
          ),
        ),
        data: (addresses) {
          if (addresses.isEmpty) {
            return const Center(child: Text('لا توجد عناوين محفوظة'));
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
                  trailing: PopupMenuButton(
                    itemBuilder: (_) => [
                      const PopupMenuItem(value: 'edit', child: Text('تعديل')),
                      const PopupMenuItem(value: 'delete', child: Text('حذف')),
                    ],
                    onSelected: (v) {
                      if (v == 'delete') {
                        ref.invalidate(addressesProvider);
                      }
                    },
                  ),
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
        content: const Text('أضيفي العنوان من إعدادات الحساب أو تواصلي مع الدعم.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('حسناً'),
          ),
        ],
      ),
    );
  }
}
