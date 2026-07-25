import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/widgets/auth_gate.dart';
import '../../core/widgets/states.dart';
import '../../data/models/address.dart';
import '../../data/services/api_service.dart';
import '../cart/widgets/cart_theme.dart';
import 'profile_providers.dart';
import 'widgets/account_theme.dart';
import 'widgets/address_form.dart';
import 'widgets/profile_ui.dart';

class AddressesScreen extends ConsumerWidget {
  const AddressesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return AuthGate(
      title: s.addresses,
      emptyTitle: s.loginToManageAddresses,
      child: const _AddressesBody(),
    );
  }
}

class _AddressesBody extends ConsumerWidget {
  const _AddressesBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addresses = ref.watch(addressesProvider);
    final s = ref.s;
    return ProfileScaffold(
      title: s.addresses,
      actions: [
        IconButton(
          onPressed: () => _add(context, ref),
          icon: const Icon(Icons.add_rounded, color: CartTheme.brand),
        ),
      ],
      floatingBottom: ProfilePrimaryButton(label: s.newAddress, onPressed: () => _add(context, ref)),
      body: addresses.when(
        loading: () => const Center(child: CircularProgressIndicator(color: CartTheme.brand)),
        error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(addressesProvider)),
        data: (list) {
          if (list.isEmpty) {
            return ProfileEmptyState(
              icon: Icons.location_on_outlined,
              title: s.isAr ? 'لا توجد عناوين' : 'No addresses',
              subtitle: s.isAr ? 'أضيفي عنواناً لتسهيل عملية الشراء' : 'Add an address for faster checkout',
              action: ProfilePrimaryButton(label: s.newAddress, onPressed: () => _add(context, ref)),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(ProfileUi.hPad, 16, ProfileUi.hPad, 80),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
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
    final s = ref.s;
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text(s.deleteAddress),
        content: Text(s.deleteAddressConfirm),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(s.cancel)),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(s.delete, style: const TextStyle(color: AccountTheme.danger)),
          ),
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
      padding: const EdgeInsets.all(16),
      decoration: AccountTheme.pageCard(
        color: address.isDefault ? CartTheme.brandWash : Colors.white,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AccountTheme.addresses.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.location_on_rounded, color: AccountTheme.addresses, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(address.fullName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                    Text(address.phone, style: ProfileUi.captionStyle()),
                  ],
                ),
              ),
              if (address.isDefault)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: CartTheme.brandSoft,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'افتراضي',
                    style: TextStyle(color: CartTheme.brand, fontSize: 11, fontWeight: FontWeight.w700),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(address.summary, style: ProfileUi.captionStyle()),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined, size: 18),
                label: const Text('تعديل'),
                style: TextButton.styleFrom(foregroundColor: CartTheme.brand),
              ),
              TextButton.icon(
                onPressed: onDelete,
                icon: const Icon(Icons.delete_outline, size: 18),
                label: const Text('حذف'),
                style: TextButton.styleFrom(foregroundColor: AccountTheme.danger),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
