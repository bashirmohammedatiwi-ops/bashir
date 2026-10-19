import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/l10n/locale_provider.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/utils/support_links.dart';
import '../../data/models/banner.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/models/home_section.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/category_tree.dart';
import '../shell/nav_tabs.dart';

final _uuidRe = RegExp(
  r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
);

bool _isUuid(String value) => _uuidRe.hasMatch(value.trim());

String? _trimField(dynamic value) {
  if (value == null) return null;
  final s = value.toString().trim();
  return s.isEmpty ? null : s;
}

String? _readLinkType(Map<String, dynamic> raw) =>
    _trimField(raw['linkType']) ?? _trimField(raw['targetType']);

String? _readLinkValue(Map<String, dynamic> raw) {
  final direct =
      _trimField(raw['linkValue']) ??
      _trimField(raw['targetId']) ??
      _trimField(raw['productId']) ??
      _trimField(raw['brandId']) ??
      _trimField(raw['categoryId']) ??
      _trimField(raw['subcategoryId']) ??
      _trimField(raw['tertiaryCategoryId']) ??
      _trimField(raw['packageId']) ??
      _trimField(raw['concernSlug']) ??
      _trimField(raw['slug']) ??
      _trimField(raw['value']);

  if (direct != null) return direct;

  final target = raw['target'];
  if (target is Map) {
    final m = Map<String, dynamic>.from(target);
    return _trimField(m['id']) ??
        _trimField(m['slug']) ??
        _trimField(m['value']);
  }
  return null;
}

String? _readLegacyLink(Map<String, dynamic> raw) =>
    _trimField(raw['link']) ??
    _trimField(raw['href']) ??
    _trimField(raw['url']);

// ─── سياق الواجهة ────────────────────────────────────────────────────────────

/// سياق واجهة الرئيسية لما تحتها من أقسام: العالم المعروض (فيبقى «عرض الكل» داخله)
/// وأقسام الواجهة الافتراضية (لمعرفة كتلة الأقسام غير المنتقاة يدوياً).
class HomeFeedScope extends InheritedWidget {
  final String? worldSlug;

  /// أقسام الواجهة الافتراضية (feed.categories) حين يعرض الرأس شريط أقسام —
  /// null إن لم يكن هناك ما يتكرر.
  final Set<String>? heroCategoryIds;

  const HomeFeedScope({
    super.key,
    required this.worldSlug,
    this.heroCategoryIds,
    required super.child,
  });

  static HomeFeedScope? maybeOf(BuildContext context) =>
      context.getInheritedWidgetOfExactType<HomeFeedScope>();

  @override
  bool updateShouldNotify(HomeFeedScope oldWidget) =>
      oldWidget.worldSlug != worldSlug ||
      oldWidget.heroCategoryIds != heroCategoryIds;
}

// ─── وجهة رابط لوحة التحكم ───────────────────────────────────────────────────

/// إلى أين يذهب رابط من لوحة التحكم — محلول مرة واحدة لكل الأقسام.
sealed class CmsTarget {
  const CmsTarget();
}

/// رابط خارجي (موقع، واتساب، إنستغرام، اتصال، بريد).
final class CmsExternal extends CmsTarget {
  final Uri uri;
  const CmsExternal(this.uri);
}

/// تبويب في الشريط السفلي (NavTabs).
final class CmsTab extends CmsTarget {
  final int tab;
  const CmsTab(this.tab);
}

/// مسار داخل التطبيق يبدأ بـ «/».
final class CmsRoute extends CmsTarget {
  final String path;
  const CmsRoute(this.path);
}

/// لا وجهة — اللمسة لا تفعل شيئاً.
final class CmsNone extends CmsTarget {
  const CmsNone();
}

const _externalSchemes = {'http', 'https', 'tel', 'mailto', 'whatsapp'};
final _schemeRe = RegExp(r'^([a-zA-Z][a-zA-Z0-9+.-]*):');

/// نطاق بلا بروتوكول: wa.me/…، instagram.com/…، www.…
final _domainRe = RegExp(r'^(www\.)?[\w-]+(\.[\w-]+)+(/|\?|$)');

/// يصنّف نصاً حراً من لوحة التحكم: رابط خارجي أو مسار داخل التطبيق.
CmsTarget _classifyRaw(String raw) {
  final value = raw.trim();
  if (value.isEmpty) return const CmsNone();
  final scheme = _schemeRe.firstMatch(value)?.group(1)?.toLowerCase();
  if (scheme != null) {
    if (!_externalSchemes.contains(scheme)) return const CmsNone();
    final uri = Uri.tryParse(value);
    return uri == null ? const CmsNone() : CmsExternal(uri);
  }
  if (_domainRe.hasMatch(value)) {
    final uri = Uri.tryParse('https://$value');
    return uri == null ? const CmsNone() : CmsExternal(uri);
  }
  return CmsRoute(value.startsWith('/') ? value : '/$value');
}

/// مسار داخل التطبيق لنوع رابط وقيمته — نفس منطق الـ API ولوحة التحكم.
String? _routeFor(String type, String value) {
  final v = Uri.encodeComponent(value);
  final has = value.isNotEmpty;
  return switch (type) {
    'product' when has => '/product/$v',
    'category' when has => '/products?categoryId=$v',
    'subcategory' when has => '/products?subcategoryId=$v',
    'tertiary' when has => '/products?tertiaryCategoryId=$v',
    // الخادم يقبل المعرّف أو الـ slug: صفحة البراند في الحالتين.
    'brand' when has => '/brand/$v',
    'package' when has => '/package/$v',
    'skinConcern' when has => '/skin-guide/$v',
    'skinGuide' => '/skin-guide',
    'packages' => '/packages',
    'search' when has => '/search?q=$v',
    'products' when has => value.startsWith('/') ? value : '/products?$value',
    _ => null,
  };
}

/// يحلّ رابط لوحة التحكم: النوع والقيمة أولاً، ثم الرابط القديم احتياطاً.
CmsTarget resolveCmsTarget({
  String? linkType,
  String? linkValue,
  String? legacyLink,
}) {
  final type = (linkType ?? '').trim();
  final value = (linkValue ?? '').trim();

  if (type == 'offers') return const CmsTab(NavTabs.offers);
  if (type == 'categoriesTab') return const CmsTab(NavTabs.categories);
  if (type == 'url' && value.isNotEmpty) return _classifyRaw(value);
  final route = _routeFor(type, value);
  if (route != null) return CmsRoute(route);

  final legacy = (legacyLink ?? '').trim();
  if (legacy.isNotEmpty) return _classifyRaw(legacy);
  if (value.startsWith('/')) return CmsRoute(value);
  return const CmsNone();
}

/// ينفّذ الوجهة: رابط خارجي، تبويب، أو مسار.
void openCmsTarget(BuildContext context, CmsTarget target) {
  switch (target) {
    case CmsExternal(:final uri):
      openExternalUrl(uri.toString());
    case CmsTab(:final tab):
      openMainTab(
        context,
        ProviderScope.containerOf(context, listen: false),
        tab,
      );
    case CmsRoute(:final path):
      _pushAppPath(context, path);
    case CmsNone():
      break;
  }
}

/// مسار نصي للوجهة — لمن يحفظ الوجهة مسبقاً (شريط الصور المتحرك).
String? _targetPath(CmsTarget target) => switch (target) {
  CmsExternal(:final uri) => uri.toString(),
  CmsTab(:final tab) => switch (tab) {
    NavTabs.offers => '/offers',
    NavTabs.categories => '/categories-tab',
    NavTabs.cart => '/cart',
    NavTabs.brands => '/brands',
    NavTabs.account => '/account',
    _ => '/',
  },
  CmsRoute(:final path) => path,
  CmsNone() => null,
};

void navigateSectionPath(BuildContext context, String path) =>
    openCmsTarget(context, resolveCmsTarget(legacyLink: path));

/// يبني مسار التطبيق — نفس منطق الـ API ولوحة التحكم.
String? buildSectionItemPath({
  String? linkType,
  String? linkValue,
  String? legacyLink,
}) => _targetPath(
  resolveCmsTarget(
    linkType: linkType,
    linkValue: linkValue,
    legacyLink: legacyLink,
  ),
);

/// يستخرج أفضل مسار للتنقّل من عنصر القسم.
String? resolveSectionItemPath(Map<String, dynamic> raw) =>
    _targetPath(_itemTarget(raw));

CmsTarget _itemTarget(Map<String, dynamic> raw) => resolveCmsTarget(
  linkType: _readLinkType(raw),
  linkValue: _readLinkValue(raw),
  legacyLink: _readLegacyLink(raw),
);

void openSectionItemLink(BuildContext context, Map<String, dynamic> raw) =>
    openCmsTarget(context, _itemTarget(raw));

void _pushAppPath(BuildContext context, String rawPath) {
  final path = rawPath.trim();
  if (path.isEmpty) return;

  // مسارات التبويبات (/، /cart، /offers، /categories، /brands?q=، /account) تبدّل
  // التبويب بدل دفع نسخة ثانية من الـ shell.
  if (openTabPath(context, path)) return;

  final uri = Uri.tryParse(path);
  if (uri == null) return;
  final container = ProviderScope.containerOf(context, listen: false);
  // «ديما» بالعربية فقط — رابط إليها من لوحة التحكم لا يفعل شيئاً بلغة أخرى.
  if ((uri.path == '/advisor' || uri.path.startsWith('/advisor/')) &&
      container.read(languageCodeProvider) != 'ar') {
    return;
  }
  if (uri.path == '/products') {
    final brandId = uri.queryParameters['brandId'];
    if (brandId != null && brandId.isNotEmpty && !_isUuid(brandId)) {
      context.push('/brand/${Uri.encodeComponent(brandId)}');
      return;
    }
    final categoryId = uri.queryParameters['categoryId'];
    if (categoryId != null && categoryId.isNotEmpty && !_isUuid(categoryId)) {
      context.push('/category/${Uri.encodeComponent(categoryId)}');
      return;
    }
  }

  context.push(path);
}

void openSectionLink(
  BuildContext context, {
  String? linkType,
  String? linkValue,
  String? legacyLink,
  String? resolvedLink,
}) {
  openCmsTarget(
    context,
    resolveCmsTarget(
      linkType: linkType,
      linkValue: linkValue,
      legacyLink: resolvedLink ?? legacyLink,
    ),
  );
}

void openBannerLink(BuildContext context, AppBanner banner) {
  openSectionLink(
    context,
    linkType: banner.linkType,
    linkValue: banner.linkValue,
    legacyLink: banner.link,
  );
}

/// «عرض الكل» — يدعم query أو مسار كامل (/brands, /categories-tab).
///
/// داخل واجهة عالم تبقى قائمة المنتجات ضمن العالم نفسه (world=…) ما لم يحدّد الرابط
/// عالماً أو منتجات بعينها.
void openViewAllLink(
  BuildContext context, {
  String? query,
  String? fallbackQuery,
}) {
  final raw = (query ?? fallbackQuery ?? '').trim();
  if (raw.isEmpty) return;
  var path = raw.startsWith('/') ? raw : '/products?$raw';
  final world = HomeFeedScope.maybeOf(context)?.worldSlug;
  if (world != null && world.isNotEmpty) path = withWorldScope(path, world);
  _pushAppPath(context, path);
}

/// يضيف world=<slug> إلى رابط قائمة منتجات لا يحدّد عالماً ولا منتجات بعينها.
String withWorldScope(String path, String worldSlug) {
  final uri = Uri.tryParse(path);
  if (uri == null || uri.path != '/products') return path;
  final q = uri.queryParameters;
  if (q.containsKey('world') ||
      q.containsKey('worldSlug') ||
      q.containsKey('ids')) {
    return path;
  }
  return uri.replace(queryParameters: {...q, 'world': worldSlug}).toString();
}

/// مسار قائمة منتجات قسم بحسب مستواه في الشجرة: رئيسي → categoryId، فرعي →
/// subcategoryId، ثانوي → tertiaryCategoryId. (الفرعي بـ categoryId يفتح قائمة فارغة.)
String categoryListingPath(Category c, List<Category>? tree, {String? title}) {
  String key;
  final kind = c.listingKind;
  if (kind == 'tertiary') {
    key = 'tertiaryCategoryId';
  } else if (kind == 'subcategory') {
    key = 'subcategoryId';
  } else {
    final parent = tree == null || tree.isEmpty
        ? null
        : findParentCategory(tree, c.id);
    if (parent != null) {
      key = findParentCategory(tree!, parent.id) != null
          ? 'tertiaryCategoryId'
          : 'subcategoryId';
    } else if (c.parentId != null && c.parentId!.isNotEmpty) {
      key = 'subcategoryId';
    } else {
      key = 'categoryId';
    }
  }
  final t = title?.trim() ?? '';
  return '/products?$key=${Uri.encodeComponent(c.id)}'
      '${t.isEmpty ? '' : '&title=${Uri.encodeComponent(t)}'}';
}

/// يفتح قسماً: رابط مخصّص من لوحة التحكم إن وُجد، وإلا قائمة منتجاته بمستواه الصحيح.
void openCategoryLink(BuildContext context, Category category) {
  final container = ProviderScope.containerOf(context, listen: false);
  final lang = container.read(languageCodeProvider);
  if ((category.linkType ?? '').trim().isNotEmpty) {
    openSectionLink(
      context,
      linkType: category.linkType,
      linkValue: category.linkValue,
      legacyLink: category.link,
    );
    return;
  }
  _pushAppPath(
    context,
    categoryListingPath(
      category,
      container.read(categoriesProvider).valueOrNull,
      title: category.localizedName(lang),
    ),
  );
}

void openBrandLink(BuildContext context, Brand brand) {
  openSectionLink(
    context,
    linkType: 'brand',
    linkValue: brand.id,
    legacyLink: brand.link ?? '/brand/${Uri.encodeComponent(brand.slug.isNotEmpty ? brand.slug : brand.id)}',
  );
}

void openPackageLink(BuildContext context, HomePackage package) {
  openSectionLink(
    context,
    linkType: 'package',
    linkValue: package.slug.isNotEmpty ? package.slug : package.id,
    legacyLink: package.link,
  );
}

Color? parseHexColor(String? hex) {
  if (hex == null || hex.isEmpty) return null;
  final h = hex.replaceFirst('#', '');
  if (h.length == 6) return Color(int.parse('FF$h', radix: 16));
  if (h.length == 8) return Color(int.parse(h, radix: 16));
  return null;
}
