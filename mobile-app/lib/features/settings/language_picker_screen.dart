import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/l10n/app_strings.dart';
import '../../core/l10n/locale_provider.dart';
import '../../core/widgets/ui/ui.dart';
import '../catalog/catalog_providers.dart';
import '../profile/widgets/account_strings.dart';
import '../profile/widgets/profile_ui.dart';
import '../worlds/world_theme.dart';
import '../../core/brand/brand_logo.dart';

/// شاشة اختيار اللغة — بسيطة وأنيقة.
class LanguagePickerScreen extends ConsumerStatefulWidget {
  final bool fromSettings;

  const LanguagePickerScreen({super.key, this.fromSettings = false});

  @override
  ConsumerState<LanguagePickerScreen> createState() =>
      _LanguagePickerScreenState();
}

class _LanguagePickerScreenState extends ConsumerState<LanguagePickerScreen> {
  late String _selected;

  @override
  void initState() {
    super.initState();
    _selected = ref.read(appLocaleProvider).languageCode;
  }

  Future<void> _pick(String code) async {
    if (_selected == code) return;
    HapticFeedback.selectionClick();
    setState(() => _selected = code);

    if (widget.fromSettings) {
      await ref.read(appLocaleProvider.notifier).chooseLanguage(Locale(code));
      ref.invalidate(homeFeedProvider);
      ref.invalidate(offersFeedProvider);
      if (!mounted) return;
      context.pop();
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(AppStrings(code).languageChanged)));
    }
  }

  Future<void> _confirm() async {
    HapticFeedback.lightImpact();
    await ref
        .read(appLocaleProvider.notifier)
        .chooseLanguage(Locale(_selected));
    ref.invalidate(homeFeedProvider);
    ref.invalidate(offersFeedProvider);
    if (!mounted) return;
    if (widget.fromSettings) {
      context.pop();
    } else {
      context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final bottom = MediaQuery.paddingOf(context).bottom;
    final previewLang = widget.fromSettings
        ? ref.watch(languageCodeProvider)
        : _selected;
    final s = AppStrings(previewLang);
    final previewDirection = previewLang == 'ar'
        ? TextDirection.rtl
        : TextDirection.ltr;

    final options = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _LangOption(
          glyph: 'ع',
          title: s.arabic,
          subtitle: 'Arabic',
          selected: _selected == 'ar',
          selectedLabel: s.acctSelected,
          onTap: () => _pick('ar'),
        ),
        const SizedBox(height: 12),
        _LangOption(
          glyph: 'En',
          title: s.english,
          subtitle: 'الإنجليزية',
          selected: _selected == 'en',
          selectedLabel: s.acctSelected,
          onTap: () => _pick('en'),
        ),
      ],
    );

    if (widget.fromSettings) {
      return Directionality(
        textDirection: previewDirection,
        child: ProfileScaffold(
          title: s.language,
          body: ListView(
            padding: const EdgeInsets.fromLTRB(
              ProfileUi.hPad,
              24,
              ProfileUi.hPad,
              32,
            ),
            children: [
              Text(
                s.chooseLanguage,
                style: AppText.title1.copyWith(color: t.ink),
              ),
              const SizedBox(height: 6),
              Text(
                s.chooseLanguageSubtitle,
                style: AppText.body.copyWith(color: t.inkSoft),
              ),
              const SizedBox(height: 24),
              options,
            ],
          ),
        ),
      );
    }

    return Directionality(
      textDirection: previewDirection,
      child: Scaffold(
        backgroundColor: t.canvas,
        body: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [t.canvasWarm, t.canvas],
              stops: const [0, 0.5],
            ),
          ),
          child: Column(
            children: [
              Expanded(
                child: SafeArea(
                  bottom: false,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 480),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const SizedBox(height: 48),
                            Center(child: const BrandWordmark(width: 200)),
                            const SizedBox(height: 20),
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 200),
                              child: Text(
                                AppConfig.displayStoreName(previewLang),
                                key: ValueKey(previewLang),
                                textAlign: TextAlign.center,
                                style: AppText.display.copyWith(color: t.ink),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Center(
                              child: Container(
                                width: 32,
                                height: 3,
                                decoration: BoxDecoration(
                                  gradient: t.signatureGradient,
                                  borderRadius: BorderRadius.circular(
                                    AppCorners.pill,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 36),
                            Text(
                              s.chooseLanguage,
                              textAlign: TextAlign.center,
                              style: AppText.title1.copyWith(color: t.ink),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              s.chooseLanguageSubtitle,
                              textAlign: TextAlign.center,
                              style: AppText.body.copyWith(color: t.inkSoft),
                            ),
                            const SizedBox(height: 28),
                            options,
                            const SizedBox(height: 24),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: EdgeInsets.fromLTRB(24, 12, 24, bottom + 20),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 480),
                  child: ProfilePrimaryButton(
                    label: s.continueBtn,
                    onPressed: _confirm,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LangOption extends StatelessWidget {
  final String glyph;
  final String title;
  final String subtitle;
  final bool selected;
  final String selectedLabel;
  final VoidCallback onTap;

  const _LangOption({
    required this.glyph,
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.selectedLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final radius = BorderRadius.circular(AppCorners.lg);
    return Semantics(
      button: true,
      selected: selected,
      child: Material(
        color: Colors.transparent,
        borderRadius: radius,
        child: InkWell(
          onTap: onTap,
          borderRadius: radius,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOutCubic,
            constraints: const BoxConstraints(minHeight: 72),
            padding: const EdgeInsetsDirectional.fromSTEB(14, 12, 16, 12),
            decoration: BoxDecoration(
              borderRadius: radius,
              color: selected ? t.accentLight : t.surface,
              border: Border.all(
                color: selected ? t.accent : t.hairline,
                width: selected ? 1.6 : 1,
              ),
              boxShadow: selected ? t.cardShadow : null,
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: selected ? t.accent : t.accentLight,
                    borderRadius: BorderRadius.circular(AppCorners.sm),
                  ),
                  child: Text(
                    glyph,
                    style: AppText.title3.copyWith(
                      color: selected ? Colors.white : t.accentDark,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.title3.copyWith(
                          color: selected ? t.accentDark : t.ink,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        selected ? '$subtitle · $selectedLabel' : subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.caption.copyWith(color: t.inkMuted),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: selected ? t.accent : Colors.transparent,
                    border: Border.all(
                      color: selected ? t.accent : t.hairline,
                      width: 2,
                    ),
                  ),
                  child: selected
                      ? const Icon(
                          Icons.check_rounded,
                          size: 15,
                          color: Colors.white,
                        )
                      : null,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
