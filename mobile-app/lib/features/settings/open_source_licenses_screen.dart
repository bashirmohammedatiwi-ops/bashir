import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/l10n/app_strings.dart';
import '../../core/widgets/ui/ui.dart';
import '../profile/widgets/profile_ui.dart';
import '../../features/worlds/world_theme.dart';

class _LicenseItem {
  final String name;
  final String text;

  const _LicenseItem({required this.name, required this.text});
}

class OpenSourceLicensesScreen extends ConsumerStatefulWidget {
  const OpenSourceLicensesScreen({super.key});

  @override
  ConsumerState<OpenSourceLicensesScreen> createState() =>
      _OpenSourceLicensesScreenState();
}

class _OpenSourceLicensesScreenState
    extends ConsumerState<OpenSourceLicensesScreen> {
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

    final items =
        merged.entries
            .map((e) => _LicenseItem(name: e.key, text: e.value.toString()))
            .toList()
          ..sort(
            (a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()),
          );

    return items;
  }

  List<_LicenseItem> _filter(List<_LicenseItem> items) {
    if (_query.isEmpty) return items;
    return items
        .where((item) => item.name.toLowerCase().contains(_query))
        .toList();
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
            padding: const EdgeInsets.fromLTRB(
              ProfileUi.hPad,
              14,
              ProfileUi.hPad,
              12,
            ),
            child: TextField(
              controller: _searchController,
              focusNode: _searchFocus,
              textInputAction: TextInputAction.search,
              decoration: profileFieldDecoration(
                context,
                hint: s.searchPackages,
                prefix: Icon(
                  Icons.search_rounded,
                  size: 22,
                  color: context.worldTheme.inkMuted,
                ),
                suffix: _query.isEmpty
                    ? null
                    : IconButton(
                        tooltip: MaterialLocalizations.of(
                          context,
                        ).deleteButtonTooltip,
                        icon: Icon(
                          Icons.close_rounded,
                          size: 20,
                          color: context.worldTheme.inkMuted,
                        ),
                        onPressed: () {
                          _searchController.clear();
                          _searchFocus.unfocus();
                        },
                      ),
              ),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<_LicenseItem>>(
              future: _licensesFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return Center(
                    child: CircularProgressIndicator(
                      color: context.worldTheme.accent,
                    ),
                  );
                }
                if (snapshot.hasError) {
                  return ProfileEmptyState(
                    icon: Icons.error_outline_rounded,
                    title: s.errorOccurred,
                  );
                }

                final all = snapshot.data ?? const <_LicenseItem>[];
                final filtered = _filter(all);

                if (filtered.isEmpty) {
                  return ProfileEmptyState(
                    icon: Icons.search_off_rounded,
                    title: s.noPackagesFound,
                  );
                }

                final groups = _groupByLetter(filtered);

                return ListView(
                  keyboardDismissBehavior:
                      ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: const EdgeInsets.fromLTRB(
                    ProfileUi.hPad,
                    0,
                    ProfileUi.hPad,
                    32,
                  ),
                  children: [
                    Padding(
                      padding: const EdgeInsetsDirectional.only(
                        start: 4,
                        bottom: 12,
                      ),
                      child: Text(
                        s.packageCount(filtered.length),
                        style: ProfileUi.captionStyle(context),
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
      padding: const EdgeInsetsDirectional.fromSTEB(4, 8, 4, 8),
      child: Text(
        letter,
        style: AppText.label.copyWith(color: context.worldTheme.accentDark),
      ),
    );
  }
}

class _LicenseTile extends StatelessWidget {
  final _LicenseItem item;

  const _LicenseTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: const EdgeInsetsDirectional.fromSTEB(16, 2, 12, 2),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        minTileHeight: ProfileUi.rowMinHeight,
        iconColor: t.accentDark,
        collapsedIconColor: t.inkMuted,
        title: Text(
          item.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: ProfileUi.bodyStyle(context),
        ),
        onExpansionChanged: (_) => HapticFeedback.selectionClick(),
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: t.canvas,
              borderRadius: BorderRadius.circular(AppCorners.sm),
            ),
            child: Directionality(
              textDirection: TextDirection.ltr,
              child: SelectableText(
                item.text,
                style: AppText.caption.copyWith(
                  color: t.inkSoft,
                  height: 1.55,
                  fontFamily: 'monospace',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
