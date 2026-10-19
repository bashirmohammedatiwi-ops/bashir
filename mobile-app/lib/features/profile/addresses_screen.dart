import '../../core/widgets/app_snackbar.dart';
import '../../core/utils/friendly_error.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/widgets/auth_gate.dart';
import '../../core/widgets/states.dart';
import '../../core/widgets/ui/ui.dart';
import '../../data/models/address.dart';
import '../../data/services/api_service.dart';
import 'profile_providers.dart';
import 'widgets/account_theme.dart';
import 'widgets/address_form.dart';
import 'widgets/profile_ui.dart';
import '../../features/worlds/world_theme.dart';

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
    final hasItems = addresses.valueOrNull?.isNotEmpty ?? false;
    return ProfileScaffold(
      title: s.addresses,
      floatingBottom: hasItems
          ? ProfilePrimaryButton(
              label: s.newAddress,
              icon: Icons.add_location_alt_outlined,
              onPressed: () => _add(context, ref),
            )
          : null,
      body: addresses.when(
        loading: () => Center(
          child: CircularProgressIndicator(color: context.worldTheme.accent),
        ),
        error: (e, _) => ErrorView.from(
          e,
          onRetry: () => ref.invalidate(addressesProvider),
          loading: addresses.isLoading,
        ),
        data: (list) {
          if (list.isEmpty) {
            return ProfileEmptyState(
              icon: Icons.location_on_outlined,
              title: s.noAddresses,
              subtitle: s.noAddressesHint,
              action: ProfilePrimaryButton(
                label: s.newAddress,
                icon: Icons.add_location_alt_outlined,
                onPressed: () => _add(context, ref),
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(
              ProfileUi.hPad,
              16,
              ProfileUi.hPad,
              24,
            ),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) => _AddressTile(
              address: list[i],
              s: s,
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
        AppSnackbar.error(context, ref.friendly(e));
      }
    }
  }

  Future<void> _edit(
    BuildContext context,
    WidgetRef ref,
    Address address,
  ) async {
    final result = await showAddressForm(context, initial: address);
    if (result == null) return;
    try {
      // الحقول المُفرغة تُرسل null صراحةً فتُمسح على السيرفر (لا تبقى القيمة القديمة).
      await ref.read(apiServiceProvider).updateAddress(address.id, result, clearMissing: true);
      ref.invalidate(addressesProvider);
    } catch (e) {
      if (context.mounted) {
        AppSnackbar.error(context, ref.friendly(e));
      }
    }
  }

  Future<void> _delete(
    BuildContext context,
    WidgetRef ref,
    Address address,
  ) async {
    final s = ref.s;
    final ok = await showProfileConfirmDialog(
      context,
      title: s.deleteAddress,
      body: s.deleteAddressConfirm,
      confirmLabel: s.delete,
      cancelLabel: s.cancel,
    );
    if (!ok) return;
    try {
      await ref.read(apiServiceProvider).deleteAddress(address.id);
      ref.invalidate(addressesProvider);
    } catch (e) {
      if (context.mounted) {
        AppSnackbar.error(context, ref.friendly(e));
      }
    }
  }
}

class _AddressTile extends StatelessWidget {
  final Address address;
  final AppStrings s;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  const _AddressTile({
    required this.address,
    required this.s,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final isDefault = address.isDefault;
    return Container(
      decoration: AccountTheme.pageCard(context).copyWith(
        border: Border.all(
          color: isDefault
              ? t.accent.withValues(alpha: 0.45)
              : t.hairline.withValues(alpha: 0.7),
          width: isDefault ? 1.4 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AccountTheme.iconTile(
                  context,
                  isDefault ? Icons.home_rounded : Icons.location_on_outlined,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              address.fullName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.title3.copyWith(color: t.ink),
                            ),
                          ),
                          if (isDefault) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: t.accentLight,
                                borderRadius: BorderRadius.circular(
                                  AppCorners.pill,
                                ),
                                border: Border.all(color: t.accentSoft),
                              ),
                              child: Text(
                                s.defaultLabel,
                                style: AppText.micro.copyWith(
                                  color: t.accentDark,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        address.phone,
                        maxLines: 1,
                        textDirection: TextDirection.ltr,
                        style: AppText.caption.copyWith(color: t.inkMuted),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        address.summaryFor(s.isAr),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.bodySmall.copyWith(color: t.inkSoft),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, thickness: 1, color: t.divider),
          Row(
            children: [
              Expanded(
                child: _AddressAction(
                  icon: Icons.edit_outlined,
                  label: s.edit,
                  color: t.accentDark,
                  onTap: onEdit,
                ),
              ),
              Container(width: 1, height: 24, color: t.divider),
              Expanded(
                child: _AddressAction(
                  icon: Icons.delete_outline_rounded,
                  label: s.delete,
                  color: AccountTheme.danger,
                  onTap: onDelete,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AddressAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _AddressAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: SizedBox(
        height: 48,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.label.copyWith(color: color),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
