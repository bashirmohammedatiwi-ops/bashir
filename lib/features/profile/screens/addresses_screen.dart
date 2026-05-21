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
    final addresses = ref.watch(addressesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(AppStrings.addresses)),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddDialog(context, ref),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: ListView.builder(
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
                    ref.read(addressesProvider.notifier).state =
                        addresses.where((a) => a.id != addr.id).toList();
                  }
                },
              ),
            ),
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
        content: const Text('نموذج إضافة عنوان (واجهة تجريبية)'),
        actions: [
          TextButton(
            onPressed: () {
              ref.read(addressesProvider.notifier).state = [
                ...ref.read(addressesProvider),
                const AddressModel(
                  id: 'new_addr',
                  name: 'عنوان جديد',
                  phone: '+9647701234567',
                  governorate: 'بغداد',
                  area: 'المنصور',
                  street: 'شارع 14',
                  house: '15',
                ),
              ];
              Navigator.pop(context);
            },
            child: const Text('حفظ'),
          ),
        ],
      ),
    );
  }
}
