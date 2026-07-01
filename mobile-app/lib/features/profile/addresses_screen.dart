import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/states.dart';
import '../../data/models/address.dart';
import '../../data/services/api_service.dart';
import 'profile_providers.dart';
import 'widgets/address_form.dart';

class AddressesScreen extends ConsumerWidget {
  const AddressesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addresses = ref.watch(addressesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('عناويني')),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        onPressed: () => _add(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('عنوان جديد'),
      ),
      body: addresses.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) =>
            ErrorView(message: e.toString(), onRetry: () => ref.invalidate(addressesProvider)),
        data: (list) {
          if (list.isEmpty) {
            return EmptyState(
              icon: Icons.location_on_outlined,
              title: 'لا توجد عناوين',
              subtitle: 'أضف عنواناً لتسهيل عملية الشراء',
              action: ElevatedButton(
                onPressed: () => _add(context, ref),
                child: const Text('إضافة عنوان'),
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _AddressTile(
              address: list[i],
              onEdit: () => _edit(context, ref, list[i]),
              onDelete: () => _delete(context, ref, list[i]),
            ),
          );
        },
      ),
    );
  }

  Future<void> _add(BuildContext context, WidgetRef ref) async {
    final result = await showAddressForm(context);
    if (result == null) return;
    try {
      await ref.read(apiServiceProvider).createAddress(result);
      ref.invalidate(addressesProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _edit(BuildContext context, WidgetRef ref, Address address) async {
    final result = await showAddressForm(context, initial: address);
    if (result == null) return;
    try {
      await ref.read(apiServiceProvider).updateAddress(address.id, result);
      ref.invalidate(addressesProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _delete(BuildContext context, WidgetRef ref, Address address) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('حذف العنوان'),
        content: const Text('هل تريد حذف هذا العنوان؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('حذف', style: TextStyle(color: AppColors.sale))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(apiServiceProvider).deleteAddress(address.id);
      ref.invalidate(addressesProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }
}

class _AddressTile extends StatelessWidget {
  final Address address;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  const _AddressTile({required this.address, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: address.isDefault ? AppColors.primary : AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 20),
              const SizedBox(width: 6),
              Text(address.fullName, style: const TextStyle(fontWeight: FontWeight.w800)),
              if (address.isDefault) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                      color: AppColors.primaryLight, borderRadius: BorderRadius.circular(8)),
                  child: const Text('افتراضي',
                      style: TextStyle(
                          color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w700)),
                ),
              ],
              const Spacer(),
              IconButton(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined, size: 20),
                  visualDensity: VisualDensity.compact),
              IconButton(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.sale),
                  visualDensity: VisualDensity.compact),
            ],
          ),
          const SizedBox(height: 4),
          Text(address.phone, style: const TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 2),
          Text(address.summary, style: const TextStyle(color: AppColors.textSecondary, height: 1.4)),
        ],
      ),
    );
  }
}
