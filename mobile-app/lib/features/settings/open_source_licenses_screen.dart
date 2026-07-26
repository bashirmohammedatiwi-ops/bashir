import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/app_strings.dart';
import '../cart/widgets/cart_theme.dart';
import '../profile/widgets/profile_ui.dart';

class _LicenseItem {
  final String name;
  final String text;

  const _LicenseItem({required this.name, required this.text});
}

class OpenSourceLicensesScreen extends ConsumerStatefulWidget {
  const OpenSourceLicensesScreen({super.key});

  @override
  ConsumerState<OpenSourceLicensesScreen> createState() => _OpenSourceLicensesScreenState();
}

class _OpenSourceLicensesScreenState extends ConsumerState<OpenSourceLicensesScreen> {
  final _searchController = TextEditingController();
  final _searchFocus = FocusNode();

  late Future<List<_LicenseItem>> _licensesFuture;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _licensesFuture = _loadLicenses();
    _searchController.addListener(() {
      setState(() => _query = _searchController.text.trim().toLowerCase());
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  static Future<List<_LicenseItem>> _loadLicenses() async {
    final merged = <String, StringBuffer>{};

    await for (final entry in LicenseRegistry.licenses) {
      final text = entry.paragraphs.join('\n\n');
      for (final pkg in entry.packages) {
        merged.putIfAbsent(pkg, () => StringBuffer());
        final buffer = merged[pkg]!;
        if (buffer.isNotEmpty) buffer.writeln('\n\n');
        buffer.write(text);
      }
    }

    final items = merged.entries
        .map((e) => _LicenseItem(name: e.key, text: e.value.toString()))
        .toList()
      ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));

    return items;
  }

  List<_LicenseItem> _filter(List<_LicenseItem> items) {
    if (_query.isEmpty) return items;
    return items.where((item) => item.name.toLowerCase().contains(_query)).toList();
  }

  Map<String, List<_LicenseItem>> _groupByLetter(List<_LicenseItem> items) {
    final groups = <String, List<_LicenseItem>>{};
    for (final item in items) {
      final first = item.name.isNotEmpty ? item.name[0].toUpperCase() : '#';
      groups.putIfAbsent(first, () => []).add(item);
    }
    final keys = groups.keys.toList()..sort();
    return {for (final k in keys) k: groups[k]!};
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.s;

    return ProfileScaffold(
      title: s.openSourceLicenses,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(ProfileUi.hPad, 8, ProfileUi.hPad, 12),
            child: TextField(
              controller: _searchController,
              focusNode: _searchFocus,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: s.searchPackages,
                prefixIcon: const Icon(Icons.search_rounded, size: 22),
                suffixIcon: _query.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close_rounded, size: 20),
                        onPressed: () {
                          _searchController.clear();
                          _searchFocus.unfocus();
                        },
                      ),
                filled: true,
                fillColor: ProfileUi.fieldBg,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(ProfileUi.fieldRadius),
                  borderSide: const BorderSide(color: ProfileUi.fieldBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(ProfileUi.fieldRadius),
                  borderSide: const BorderSide(color: ProfileUi.fieldBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(ProfileUi.fieldRadius),
                  borderSide: const BorderSide(color: CartTheme.brand, width: 1.5),
                ),
              ),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<_LicenseItem>>(
              future: _licensesFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator(color: CartTheme.brand));
                }
                if (snapshot.hasError) {
                  return Center(
                    child: Text(
                      s.errorOccurred,
                      style: ProfileUi.captionStyle(),
                    ),
                  );
                }

                final all = snapshot.data ?? const <_LicenseItem>[];
                final filtered = _filter(all);

                if (filtered.isEmpty) {
                  return Center(
                    child: Text(s.noPackagesFound, style: ProfileUi.captionStyle()),
                  );
                }

                final groups = _groupByLetter(filtered);

                return ListView(
                  padding: const EdgeInsets.fromLTRB(ProfileUi.hPad, 0, ProfileUi.hPad, 32),
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        s.packageCount(filtered.length),
                        style: ProfileUi.captionStyle(),
                      ),
                    ),
                    for (final letter in groups.keys) ...[
                      _SectionHeader(letter: letter),
                      ProfileMenuCard(
                        children: [
                          for (final item in groups[letter]!)
                            _LicenseTile(item: item),
                        ],
                      ),
                      const SizedBox(height: 12),
                    ],
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String letter;

  const _SectionHeader({required this.letter});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 4, 8),
      child: Text(
        letter,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w800,
          color: CartTheme.brand,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _LicenseTile extends StatelessWidget {
  final _LicenseItem item;

  const _LicenseTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
        childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
        title: Text(
          item.name,
          style: ProfileUi.bodyStyle().copyWith(fontSize: 14),
        ),
        trailing: Icon(
          Icons.unfold_more_rounded,
          color: CartTheme.charcoal.withValues(alpha: 0.28),
          size: 22,
        ),
        onExpansionChanged: (_) => HapticFeedback.selectionClick(),
        children: [
          SelectableText(
            item.text,
            style: TextStyle(
              fontSize: 12,
              height: 1.55,
              color: CartTheme.charcoal.withValues(alpha: 0.75),
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }
}
