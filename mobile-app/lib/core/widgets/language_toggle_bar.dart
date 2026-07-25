import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/app_strings.dart';
import '../l10n/locale_provider.dart';
import '../../features/cart/widgets/cart_theme.dart';
import '../../features/profile/widgets/profile_ui.dart';

/// تبديل اللغة — مدمج داخل الصفحة (ليس شريطاً ثابتاً).
class LanguageToggleBar extends ConsumerWidget {
  final bool showLabel;
  final bool embedded;

  const LanguageToggleBar({
    super.key,
    this.showLabel = true,
    this.embedded = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final lang = ref.watch(languageCodeProvider);

    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (showLabel) ...[
          ProfileFieldLabel(s.language),
          const SizedBox(height: 4),
        ],
        Row(
          children: [
            Expanded(
              child: _LangChip(
                label: s.arabic,
                selected: lang == 'ar',
                onTap: () => _setLocale(ref, context, s, const Locale('ar')),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _LangChip(
                label: s.english,
                selected: lang == 'en',
                onTap: () => _setLocale(ref, context, s, const Locale('en')),
              ),
            ),
          ],
        ),
      ],
    );

    if (embedded) return content;

    final top = MediaQuery.paddingOf(context).top;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(ProfileUi.hPad, top + 8, ProfileUi.hPad, 10),
      color: ProfileUi.bg,
      child: content,
    );
  }

  void _setLocale(WidgetRef ref, BuildContext context, AppStrings s, Locale locale) {
    if (ref.read(languageCodeProvider) == locale.languageCode) return;
    HapticFeedback.selectionClick();
    ref.read(appLocaleProvider.notifier).chooseLanguage(locale);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(s.languageChanged),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }
}

class _LangChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _LangChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          height: 44,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? CartTheme.brand : ProfileUi.fieldBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: selected ? CartTheme.brand : ProfileUi.fieldBorder),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: selected ? Colors.white : CartTheme.brandDark,
            ),
          ),
        ),
      ),
    );
  }
}
