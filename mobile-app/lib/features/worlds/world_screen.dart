import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/locale_provider.dart';
import '../../core/utils/responsive.dart';
import '../../core/utils/friendly_error.dart';
import '../../core/widgets/app_network_image.dart';
import '../../core/widgets/states.dart';
import '../../data/models/category.dart';
import '../../data/models/store_world.dart';
import '../categories/widgets/category_line_art.dart';
import '../search/smart_query.dart';
import 'world_explore.dart';
import 'world_icon.dart';
import 'worlds_provider.dart';
import '../../core/navigation/product_nav.dart';

/// عالم واحد بهويته: الأقسام الفرعية تظهر كالأقسام الرئيسية.
class WorldScreen extends ConsumerStatefulWidget {
  final String slug;
  const WorldScreen({super.key, required this.slug});

  @override
  ConsumerState<WorldScreen> createState() => _WorldScreenState();
}

class _WorldScreenState extends ConsumerState<WorldScreen> {
  String? _selectedId;
  String _query = '';
  int _tab = 0;
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  void _openProducts(Category node, {Category? parent}) {
    HapticFeedback.lightImpact();
    final lang = ref.read(languageCodeProvider);
    final title = node.localizedName(lang);
    final q = StringBuffer('/products?title=${Uri.encodeComponent(title)}');
    if (parent != null) {
      q.write('&subcategoryId=${parent.id}&tertiaryCategoryId=${node.id}');
    } else if (node.listingKind == 'category') {
      q.write('&categoryId=${node.id}');
    } else {
      q.write('&subcategoryId=${node.id}');
    }
    context.push(q.toString());
  }

  @override
  Widget build(BuildContext context) {
    final worldAsync = ref.watch(worldDetailProvider(widget.slug));
    final lang = ref.watch(languageCodeProvider);
    return worldAsync.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(
        body: ErrorView(message: friendlyError(e), onRetry: () => ref.invalidate(worldDetailProvider(widget.slug))),
      ),
      data: (world) {
        final parents = _query.trim().isEmpty
            ? world.categories
            : world.categories
                .where((c) => textMatchesQuery(_query, [c.name, c.nameAr, c.nameEn, c.slug]))
                .toList();
        final showSearch = _query.trim().length >= 2 || _tab == 2;
        return Scaffold(
          backgroundColor: world.canvas,
          body: Column(
            children: [
              _WorldHeader(world: world, lang: lang, onBack: () => context.pop()),
              Expanded(
                child: showSearch
                    ? _WorldSearchBody(
                        world: world,
                        lang: lang,
                        controller: _search,
                        query: _query.trim(),
                        sections: parents,
                        onQuery: (v) => setState(() => _query = v),
                        onOpenSection: (cat) => _openProducts(cat),
                      )
                    : _tab == 0
                        ? WorldExplore(
                            world: world,
                            onOpenSections: (id) => setState(() {
                              _tab = 1;
                              if (id != null) _selectedId = id;
                            }),
                          )
                        : parents.isEmpty
                            ? Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(28),
                                  child: Text(
                                    lang == 'en' ? 'This world has no sections yet' : 'هذا العالم بلا أقسام بعد',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(fontWeight: FontWeight.w800, color: world.ink),
                                  ),
                                ),
                              )
                            : _SectionsPane(
                                world: world,
                                parents: parents,
                                selectedId: _selectedId,
                                lang: lang,
                                onSelect: (id) => setState(() => _selectedId = id),
                                onOpen: _openProducts,
                                onOpenChild: (child, parent) => _openProducts(child, parent: parent),
                              ),
              ),
              _WorldBottomBar(
                index: showSearch ? 2 : _tab,
                accent: world.accent,
                ink: world.ink,
                lang: lang,
                onSelect: (i) {
                  HapticFeedback.selectionClick();
                  if (i == 3) {
                    context.pop();
                    return;
                  }
                  setState(() {
                    _tab = i;
                    if (i != 2) {
                      _query = '';
                      _search.clear();
                      FocusManager.instance.primaryFocus?.unfocus();
                    }
                  });
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

class _WorldSearchBody extends ConsumerWidget {
  final StoreWorld world;
  final String lang;
  final TextEditingController controller;
  final String query;
  final List<Category> sections;
  final ValueChanged<String> onQuery;
  final ValueChanged<Category> onOpenSection;

  const _WorldSearchBody({
    required this.world,
    required this.lang,
    required this.controller,
    required this.query,
    required this.sections,
    required this.onQuery,
    required this.onOpenSection,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(worldProductSearchProvider((slug: world.slug, query: query)));
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      children: [
        TextField(
          controller: controller,
          autofocus: true,
          textInputAction: TextInputAction.search,
          onChanged: onQuery,
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: world.ink),
          decoration: InputDecoration(
            isDense: true,
            hintText: lang == 'en' ? 'Search this world' : 'ابحثي داخل هذا العالم',
            hintStyle: TextStyle(fontSize: 13, color: world.ink.withValues(alpha: 0.38), fontWeight: FontWeight.w600),
            filled: true,
            fillColor: Colors.white,
            prefixIcon: Icon(Icons.search_rounded, size: 20, color: world.accent),
            suffixIcon: controller.text.isEmpty
                ? null
                : IconButton(
                    icon: Icon(Icons.close_rounded, size: 18, color: world.ink.withValues(alpha: 0.45)),
                    onPressed: () {
                      controller.clear();
                      onQuery('');
                    },
                  ),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: BorderSide(color: world.accent.withValues(alpha: 0.16))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: BorderSide(color: world.accent.withValues(alpha: 0.16))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: BorderSide(color: world.accent, width: 1.2)),
            contentPadding: const EdgeInsets.symmetric(vertical: 10),
          ),
        ),
        const SizedBox(height: 14),
        if (query.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 28),
            child: Text(
              lang == 'en' ? 'Search sections and products in this world' : 'ابحثي عن قسم أو منتج داخل هذا العالم',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, height: 1.4, fontWeight: FontWeight.w600, color: world.ink.withValues(alpha: 0.45)),
            ),
          ),
        if (query.isNotEmpty && sections.isNotEmpty) ...[
          Text(lang == 'en' ? 'Sections' : 'أقسام', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: world.ink)),
          const SizedBox(height: 8),
          for (final section in sections.take(8))
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                child: InkWell(
                  onTap: () => onOpenSection(section),
                  borderRadius: BorderRadius.circular(16),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: world.surface,
                            border: Border.all(color: world.accent.withValues(alpha: 0.28)),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: CategoryLineArt(category: section, size: 40),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(section.localizedName(lang), style: TextStyle(fontWeight: FontWeight.w800, color: world.ink)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
        if (query.isNotEmpty && query.length < 2)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              lang == 'en' ? 'Type at least two letters' : 'اكتبي حرفين على الأقل للبحث عن المنتجات',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: world.ink.withValues(alpha: 0.45)),
            ),
          )
        else if (query.length >= 2) ...[
        Text(lang == 'en' ? 'Products' : 'منتجات', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: world.ink)),
        const SizedBox(height: 8),
        products.when(
          loading: () => Padding(
            padding: const EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator(color: world.accent)),
          ),
          error: (_, __) => Text(lang == 'en' ? 'Could not search products' : 'تعذّر البحث عن المنتجات'),
          data: (items) {
            if (items.isEmpty) {
              return Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  lang == 'en' ? 'No matching products' : 'لا منتجات مطابقة',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: world.ink.withValues(alpha: 0.55)),
                ),
              );
            }
            return Column(
              children: [
                for (final product in items)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Material(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () => openProduct(context, product),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: SizedBox(
                                  width: 44,
                                  height: 44,
                                  child: AppNetworkImage(
                                    url: product.coverUrl,
                                    fit: BoxFit.contain,
                                    backgroundColor: Colors.white,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(product.localizedName(lang), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w700, color: world.ink)),
                                    Text(product.brandLabel, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: world.ink.withValues(alpha: 0.5))),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
        ],
      ],
    );
  }
}

class _WorldHeader extends StatelessWidget {
  final StoreWorld world;
  final String lang;
  final VoidCallback onBack;

  const _WorldHeader({
    required this.world,
    required this.lang,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    final backIcon = Icons.arrow_back_rounded;
    final tagline = world.localizedTagline(lang);
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent),
      child: ColoredBox(
        color: world.canvas,
        child: Column(
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(4, top + 2, 12, 0),
              child: Row(
                children: [
                  IconButton(onPressed: onBack, icon: Icon(backIcon, color: world.ink, size: 22)),
                  const Spacer(),
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: world.accent.withValues(alpha: 0.12),
                      border: Border.all(color: world.accent.withValues(alpha: 0.18)),
                    ),
                    child: Center(child: WorldIcon(slug: world.slug, size: 22)),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    lang == 'en' ? 'WORLD' : 'عالم',
                    style: TextStyle(fontSize: 11, letterSpacing: 1.6, fontWeight: FontWeight.w800, color: world.accent),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    world.localizedName(lang),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 26, height: 1.12, letterSpacing: -0.4, fontWeight: FontWeight.w800, color: world.ink),
                  ),
                  if (tagline.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      tagline,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 13, height: 1.3, fontWeight: FontWeight.w600, color: world.ink.withValues(alpha: 0.55)),
                    ),
                  ],
                ],
              ),
            ),
            // خط توقيع متدرّج بدل الشريط الصلب — ألطف على العين.
            Container(
              height: 3,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: AlignmentDirectional.centerStart,
                  end: AlignmentDirectional.centerEnd,
                  colors: [
                    world.accent,
                    Color.lerp(world.accent, world.canvas, 0.55)!,
                    Colors.transparent,
                  ],
                  stops: const [0, 0.62, 1],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionsPane extends StatelessWidget {
  final StoreWorld world;
  final List<Category> parents;
  final String? selectedId;
  final String lang;
  final ValueChanged<String> onSelect;
  final void Function(Category node, {Category? parent}) onOpen;
  final void Function(Category child, Category parent) onOpenChild;

  const _SectionsPane({
    required this.world,
    required this.parents,
    required this.selectedId,
    required this.lang,
    required this.onSelect,
    required this.onOpen,
    required this.onOpenChild,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
      children: [
        Text(
          lang == 'en' ? 'INDEX' : 'فهرس الأقسام',
          style: TextStyle(fontSize: 11, letterSpacing: 1.4, fontWeight: FontWeight.w800, color: world.accent),
        ),
        const SizedBox(height: 6),
        Text(
          lang == 'en' ? 'Choose a section' : 'اختاري قسماً',
          style: TextStyle(fontSize: 22, height: 1.15, fontWeight: FontWeight.w800, color: world.ink),
        ),
        const SizedBox(height: 8),
        for (var i = 0; i < parents.length; i++)
          _IndexEntry(
            world: world,
            category: parents[i],
            index: i + 1,
            lang: lang,
            open: parents[i].id == selectedId,
            onTap: () {
              final cat = parents[i];
              if (cat.children.isEmpty) {
                onOpen(cat);
              } else if (cat.id == selectedId) {
                onSelect('');
              } else {
                onSelect(cat.id);
              }
            },
            onOpen: () => onOpen(parents[i]),
            onOpenChild: (child) => onOpenChild(child, parents[i]),
          ),
      ],
    );
  }
}

class _IndexEntry extends StatelessWidget {
  final StoreWorld world;
  final Category category;
  final int index;
  final String lang;
  final bool open;
  final VoidCallback onTap;
  final VoidCallback onOpen;
  final ValueChanged<Category> onOpenChild;

  const _IndexEntry({
    required this.world,
    required this.category,
    required this.index,
    required this.lang,
    required this.open,
    required this.onTap,
    required this.onOpen,
    required this.onOpenChild,
  });

  @override
  Widget build(BuildContext context) {
    final children = category.children;
    final mark = index.toString().padLeft(2, '0');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        InkWell(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: world.accent.withValues(alpha: open ? 0.45 : 0.16))),
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 34,
                  child: AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 220),
                    style: DefaultTextStyle.of(context).style.copyWith(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.2,
                      color: open ? world.accent : world.accent.withValues(alpha: 0.65),
                    ),
                    child: Text(mark),
                  ),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOutCubic,
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: open ? world.accent.withValues(alpha: 0.55) : world.accent.withValues(alpha: 0.22),
                      width: open ? 1.4 : 1,
                    ),
                    color: open ? Color.alphaBlend(world.accent.withValues(alpha: 0.06), Colors.white) : Colors.white,
                    boxShadow: open
                        ? [BoxShadow(color: world.accent.withValues(alpha: 0.14), blurRadius: 10, offset: const Offset(0, 3))]
                        : null,
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: CategoryLineArt(category: category, size: 44),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        category.localizedName(lang),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 16,
                          letterSpacing: -0.2,
                          fontWeight: open ? FontWeight.w800 : FontWeight.w700,
                          color: world.ink,
                        ),
                      ),
                      if (children.isNotEmpty)
                        Text(
                          lang == 'en' ? '${children.length} inside' : '${children.length} داخل القسم',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: world.ink.withValues(alpha: 0.45)),
                        ),
                    ],
                  ),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOutCubic,
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: open ? world.accent.withValues(alpha: 0.10) : Colors.transparent,
                  ),
                  child: Icon(
                    children.isEmpty
                        ? (Icons.arrow_forward_rounded)
                        : (open ? Icons.remove_rounded : Icons.add_rounded),
                    size: 18,
                    color: world.accent,
                  ),
                ),
              ],
            ),
          ),
        ),
        if (open && children.isNotEmpty)
          ColoredBox(
            color: Color.alphaBlend(world.accent.withValues(alpha: 0.05), Colors.white),
            child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: TextButton(
                    onPressed: onOpen,
                    style: TextButton.styleFrom(
                      foregroundColor: world.accent,
                      padding: EdgeInsets.zero,
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          lang == 'en' ? 'All products' : 'كل المنتجات',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: world.accent),
                        ),
                        const SizedBox(width: 2),
                        Icon(
                          Icons.chevron_right_rounded,
                          size: 17,
                          color: world.accent,
                        ),
                      ],
                    ),
                  ),
                ),
                for (final child in children)
                  InkWell(
                    onTap: () => onOpenChild(child),
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 4),
                      child: Row(
                        children: [
                          Container(
                            width: 30,
                            height: 30,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Color.alphaBlend(world.accent.withValues(alpha: 0.07), Colors.white),
                              border: Border.all(color: world.accent.withValues(alpha: 0.22)),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: CategoryLineArt(category: child, size: 30),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              child.localizedName(lang),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: -0.1, color: world.ink),
                            ),
                          ),
                          Icon(
                            Icons.chevron_right_rounded,
                            size: 16,
                            color: world.accent.withValues(alpha: 0.55),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
            ),
          ),
      ],
    );
  }
}

class _WorldBottomBar extends StatelessWidget {
  final int index;
  final Color accent;
  final Color ink;
  final String lang;
  final ValueChanged<int> onSelect;

  const _WorldBottomBar({
    required this.index,
    required this.accent,
    required this.ink,
    required this.lang,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final labels = lang == 'en'
        ? const ['Home', 'Sections', 'Search', 'Store']
        : const ['الرئيسية', 'الأقسام', 'بحث', 'المتجر'];
    const icons = [
      Icons.home_rounded,
      Icons.grid_view_rounded,
      Icons.search_rounded,
      Icons.storefront_rounded,
    ];
    final inset = Responsive.systemBottomInset(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 6, 16, inset > 0 ? inset : 10),
      child: Material(
        color: Colors.white,
        elevation: 8,
        shadowColor: accent.withValues(alpha: 0.28),
        borderRadius: BorderRadius.circular(22),
        clipBehavior: Clip.antiAlias,
        child: SizedBox(
          height: 58,
          child: Row(
            children: [
              for (var i = 0; i < labels.length; i++)
                Expanded(
                  child: InkWell(
                    onTap: () => onSelect(i),
                    borderRadius: BorderRadius.circular(22),
                    child: Center(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 220),
                        curve: Curves.easeOutCubic,
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: index == i ? accent.withValues(alpha: 0.12) : Colors.transparent,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: index == i
                              ? [BoxShadow(color: accent.withValues(alpha: 0.18), blurRadius: 8, offset: const Offset(0, 2))]
                              : null,
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(icons[i], size: 18, color: index == i ? accent : ink.withValues(alpha: 0.45)),
                            const SizedBox(height: 1),
                            Text(
                              labels[i],
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: index == i ? accent : ink.withValues(alpha: 0.45),
                              ),
                            ),
                          ],
                        ),
                      ),
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
