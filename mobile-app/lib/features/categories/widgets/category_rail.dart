import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/locale_provider.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/category.dart';
import '../../worlds/world_theme.dart';
import '../category_browse.dart';
import 'category_line_art.dart';

/// الشريط الجانبي للأقسام — صورة دائرية + اسم، والمختار يبرز ببطاقة ومؤشر لوني.
class CategoryRail extends ConsumerStatefulWidget {
  final List<IndexedCategory> entries;
  final String selectedId;
  final ValueChanged<String> onSelect;

  const CategoryRail({
    super.key,
    required this.entries,
    required this.selectedId,
    required this.onSelect,
  });

  @override
  ConsumerState<CategoryRail> createState() => _CategoryRailState();
}

class _CategoryRailState extends ConsumerState<CategoryRail> {
  final _scroll = ScrollController();
  static const _itemExtent = 96.0;

  @override
  void didUpdateWidget(covariant CategoryRail old) {
    super.didUpdateWidget(old);
    if (old.selectedId != widget.selectedId) _reveal();
  }

  /// يُبقي العنصر المختار ظاهراً عند الاختيار من خارج الشريط.
  void _reveal() {
    final i = widget.entries.indexWhere(
      (e) => e.category.id == widget.selectedId,
    );
    if (i < 0 || !_scroll.hasClients) return;
    final pos = _scroll.position;
    final itemTop = i * _itemExtent;
    final itemBottom = itemTop + _itemExtent;
    double? target;
    if (itemTop < pos.pixels) target = itemTop - 8;
    if (itemBottom > pos.pixels + pos.viewportDimension) {
      target = itemBottom - pos.viewportDimension + 8;
    }
    if (target != null) {
      _scroll.animateTo(
        target.clamp(0, pos.maxScrollExtent),
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
      );
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageCodeProvider);
    return ListView.builder(
      controller: _scroll,
      padding: const EdgeInsets.only(top: 2, bottom: 24),
      itemExtent: _itemExtent,
      itemCount: widget.entries.length,
      itemBuilder: (context, i) {
        final e = widget.entries[i];
        return _RailTile(
          category: e.category,
          name: e.category.localizedName(lang),
          selected: e.category.id == widget.selectedId,
          onTap: () => widget.onSelect(e.category.id),
        );
      },
    );
  }
}

class _RailTile extends StatelessWidget {
  final Category category;
  final String name;
  final bool selected;
  final VoidCallback onTap;

  const _RailTile({
    required this.category,
    required this.name,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Semantics(
      button: true,
      selected: selected,
      label: name,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Stack(
          fit: StackFit.expand,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 240),
              curve: Curves.easeOutCubic,
              margin: const EdgeInsetsDirectional.fromSTEB(8, 4, 6, 4),
              // المختار: بطاقة بتدرّج ناعم من لون العالم إلى الأبيض.
              decoration: BoxDecoration(
                color: selected ? null : Colors.transparent,
                gradient: selected
                    ? LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [t.accentLight, t.surface],
                      )
                    : null,
                border: selected
                    ? Border.all(color: t.accentSoft.withValues(alpha: 0.8))
                    : null,
                borderRadius: BorderRadius.circular(AppCorners.md),
                boxShadow: selected
                    ? [
                        BoxShadow(
                          color: t.accentDark.withValues(alpha: 0.10),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // حلقة متدرّجة حول صورة المختار.
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 240),
                    width: 50,
                    height: 50,
                    padding: EdgeInsets.all(selected ? 2.2 : 1),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: selected ? null : t.hairline,
                      gradient: selected
                          ? LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                Color.lerp(t.accent, Colors.white, 0.25)!,
                                t.accentDark,
                              ],
                            )
                          : null,
                    ),
                    child: ClipOval(
                      child: CategoryThumb(
                        category: category,
                        size: 50,
                        background: t.accentLight,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Flexible(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 200),
                        // دمج مع نمط النص الموروث: يبقى خط التطبيق (لا خط النظام).
                        style: DefaultTextStyle.of(context).style
                            .merge(AppText.micro)
                            .copyWith(
                              fontSize: 11.5,
                              height: 1.25,
                              color: selected ? t.accentDark : t.inkSoft,
                              fontWeight: selected
                                  ? FontWeight.w800
                                  : FontWeight.w600,
                            ),
                        child: Text(
                          name,
                          maxLines: 2,
                          textAlign: TextAlign.center,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            PositionedDirectional(
              start: 0,
              top: 0,
              bottom: 0,
              child: Center(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 260),
                  curve: Curves.easeOutBack,
                  width: 4,
                  height: selected ? 40 : 0,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color.lerp(t.accent, Colors.white, 0.2)!,
                        t.accentDark,
                      ],
                    ),
                    borderRadius: const BorderRadiusDirectional.horizontal(
                      end: Radius.circular(4),
                    ).resolve(Directionality.of(context)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
