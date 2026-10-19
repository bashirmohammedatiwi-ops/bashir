import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/app_strings.dart';
import '../l10n/locale_provider.dart';
import '../theme/app_shadows.dart';
import '../theme/app_text.dart';
import '../../features/catalog/catalog_providers.dart';
import '../../features/profile/widgets/profile_ui.dart';
import '../../features/worlds/world_theme.dart';
import 'app_snackbar.dart';

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
                onTap: () => _setLocale(ref, context, const Locale('ar')),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _LangChip(
                label: s.english,
                selected: lang == 'en',
                onTap: () => _setLocale(ref, context, const Locale('en')),
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
      color: context.worldTheme.canvas,
      child: content,
    );
  }

  void _setLocale(WidgetRef ref, BuildContext context, Locale locale) {
    if (ref.read(languageCodeProvider) == locale.languageCode) return;
    HapticFeedback.selectionClick();
    ref.read(appLocaleProvider.notifier).chooseLanguage(locale);
    ref.invalidate(homeFeedProvider);
    ref.invalidate(offersFeedProvider);
    // التأكيد باللغة الجديدة — نصوص البناء الحالي ما زالت باللغة السابقة.
    AppSnackbar.show(context, AppStrings(locale.languageCode).languageChanged);
  }
}

class _LangChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _LangChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final radius = BorderRadius.circular(AppCorners.sm);
    return Semantics(
      container: true,
      button: true,
      selected: selected,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: radius,
          child: AnimatedContainer(
            duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 180),
            height: kMinTapTarget,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: selected ? t.signatureGradient : null,
              color: selected ? null : t.surface,
              borderRadius: radius,
              border: Border.all(color: selected ? Colors.transparent : t.hairline),
              boxShadow: selected ? AppShadows.floating(t) : null,
            ),
            child: Text(
              label,
              style: AppText.label.copyWith(
                fontSize: 14,
                color: selected ? Colors.white : t.accentDark,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
