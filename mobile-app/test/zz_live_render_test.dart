// أداة مؤقتة لتصوير واجهة «ديما» — تُحذف بعد المراجعة.
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:alhayaa/core/l10n/app_strings.dart';
import 'package:alhayaa/core/l10n/locale_provider.dart';
import 'package:alhayaa/core/theme/app_theme.dart';
import 'package:alhayaa/core/bootstrap/app_storage.dart';
import 'package:alhayaa/core/network/api_client.dart';
import 'package:alhayaa/features/products/product_detail_screen.dart';
import 'package:alhayaa/features/home/home_screen.dart';
import 'package:alhayaa/features/worlds/worlds_provider.dart';
import 'package:alhayaa/features/categories/categories_screen.dart';
import 'package:alhayaa/features/cart/cart_screen.dart';
import 'package:alhayaa/features/checkout/checkout_screen.dart';
import 'package:alhayaa/features/profile/account_screen.dart';
import 'package:alhayaa/features/orders/orders_screen.dart';
import 'package:alhayaa/features/orders/order_detail_screen.dart';
import 'package:alhayaa/features/search/search_screen.dart';
import 'package:alhayaa/features/wishlist/wishlist_screen.dart';
import 'package:alhayaa/features/brands/brands_screen.dart';
import 'package:alhayaa/features/brands/brand_screen.dart';
import 'package:alhayaa/features/products/product_listing_screen.dart';
import 'package:alhayaa/features/offers/offers_screen.dart';
import 'package:alhayaa/features/products/slug_listing_screen.dart';
import 'package:alhayaa/features/checkout/order_success_screen.dart';
import 'package:alhayaa/features/auth/screens/login_screen.dart';
import 'package:alhayaa/features/auth/screens/register_screen.dart';
import 'package:alhayaa/features/profile/loyalty_screen.dart';
import 'package:alhayaa/features/profile/notifications_screen.dart';
import 'package:alhayaa/features/profile/addresses_screen.dart';
import 'package:alhayaa/features/catalog/catalog_providers.dart';
import 'package:alhayaa/data/models/product.dart';
import 'package:alhayaa/data/models/review.dart';
import 'package:alhayaa/core/utils/json.dart';
// ignore: depend_on_referenced_packages
import 'package:sqflite/sqflite.dart' as sql;
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import 'package:alhayaa/features/update/app_update.dart';
import 'package:alhayaa/features/profile/edit_profile_screen.dart';
import 'package:alhayaa/features/settings/about_app_screen.dart';
import 'package:alhayaa/features/settings/language_picker_screen.dart';
import 'package:alhayaa/features/beauty/skin_guide_screen.dart';
import 'package:alhayaa/features/beauty/skin_quiz_screen.dart';
import 'package:alhayaa/features/packages/packages_screen.dart';
import 'package:alhayaa/features/packages/package_detail_screen.dart';
import 'package:alhayaa/core/cache/api_cache.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';

const sp = '/private/tmp/claude-502/-Users-cloud--cursor-worktrees-full-app-puf/15c4aef5-cecb-413a-9741-7ba08e943d23/scratchpad';
const out = '$sp/renders';
const fontDir = 'assets/fonts';

Future<void> loadFonts() async {
  // الخطوط المضمّنة في التطبيق تُحمّل باسم عائلتها.
  final assets = {
    'IBMPlexSansArabic': ['Regular', 'Medium', 'SemiBold', 'Bold'],
  };
  for (final e in assets.entries) {
    final fl = FontLoader(e.key);
    for (final w in e.value) {
      final bytes = File('assets/fonts/${e.key}-$w.ttf').readAsBytesSync();
      fl.addFont(Future.value(ByteData.view(bytes.buffer)));
    }
    await fl.load();
  }
  for (final f in ['ElMessiri-Bold', 'CormorantGaramond-SemiBold', 'CormorantGaramond-Bold', 'Cinzel-Medium']) {
    final file = File('assets/fonts/$f.ttf');
    if (!file.existsSync()) continue;
    await (FontLoader(f.split('-').first)..addFont(Future.value(ByteData.view(file.readAsBytesSync().buffer)))).load();
  }
  final map = {
    'IBMPlexSansArabic_regular': 'IBMPlexSansArabic-Regular.ttf',
    'IBMPlexSansArabic_500': 'IBMPlexSansArabic-Medium.ttf',
    'IBMPlexSansArabic_600': 'IBMPlexSansArabic-SemiBold.ttf',
    'IBMPlexSansArabic_700': 'IBMPlexSansArabic-Bold.ttf',
    'IBMPlexSansArabic_800': 'IBMPlexSansArabic-Bold.ttf',
  };
  for (final e in map.entries) {
    final bytes = File('$fontDir/${e.value}').readAsBytesSync();
    await (FontLoader(e.key)..addFont(Future.value(ByteData.view(bytes.buffer)))).load();
  }
  final icons = File('/Users/cloud/development/flutter/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf').readAsBytesSync();
  await (FontLoader('MaterialIcons')..addFont(Future.value(ByteData.view(icons.buffer)))).load();
  for (final fam in ['Roboto', 'IBM Plex Sans Arabic']) {
    final bytes = File('$fontDir/IBMPlexSansArabic-Regular.ttf').readAsBytesSync();
    await (FontLoader(fam)..addFont(Future.value(ByteData.view(bytes.buffer)))).load();
  }
}


/// ردود حقيقية مسجّلة مسبقاً (curl) تُعاد من الملفات — تعمل داخل الوقت الوهمي للاختبار.
const replayDir = '$sp/replay';
String fnv(String s) {
  var h = 0x811c9dc5;
  for (final c in s.codeUnits) {
    h ^= c;
    h = (h * 0x01000193) & 0xffffffff;
  }
  return h.toRadixString(16);
}

class ReplayAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(RequestOptions o, Stream<List<int>>? body, Future<void>? cancel) async {
    final uri = o.uri.toString();
    File('$replayDir/requests.log').writeAsStringSync('${o.method} $uri\n', mode: FileMode.append);
    final f = File('$replayDir/${o.method}_${fnv(uri)}.json');
    if (!f.existsSync()) {
      File('$replayDir/missing.txt').writeAsStringSync('${o.method} $uri\n', mode: FileMode.append);
      return ResponseBody.fromString('{"message":"missing"}', 404, headers: {Headers.contentTypeHeader: ['application/json']});
    }
    return ResponseBody.fromString(f.readAsStringSync(), 200, headers: {Headers.contentTypeHeader: ['application/json; charset=utf-8']});
  }

  @override
  void close({bool force = false}) {}
}

/// كاش بلا قرص (القرص لا يعمل داخل الوقت الوهمي للاختبار).
class NoDiskCache extends ApiCache {
  NoDiskCache(super.prefs);
  @override
  Future<T> getOrFetch<T>({
    required String key,
    required Duration ttl,
    required Future<T> Function() fetch,
    required T Function(dynamic json) parse,
    required dynamic Function(T value) serialize,
    bool forceRefresh = false,
    int maxStaleFactor = 2,
    bool staleOnError = true,
  }) =>
      fetch();

  @override
  Future<M> getOrFetchJson<M>({
    required String key,
    required Duration ttl,
    required Future<String> Function() fetchRaw,
    required M Function(dynamic data) parse,
    bool unwrapData = false,
    bool forceRefresh = false,
    int maxStaleFactor = 2,
    bool staleOnError = true,
  }) async {
    dynamic d = jsonDecode(await fetchRaw());
    if (unwrapData && d is Map && d.containsKey('data')) d = d['data'];
    return parse(d);
  }
}

Dio replayDio() => Dio(BaseOptions(baseUrl: 'https://deemaalhayat.com/api/v1', headers: {'X-Client': 'deema-app'}))
  ..httpClientAdapter = ReplayAdapter();

Map<String, dynamic> pdpFx() => jsonDecode(File('$sp/pdp_fx/current.json').readAsStringSync()) as Map<String, dynamic>;

List<Override> pdpOverrides() {
  final fx = pdpFx();
  return [
    productDetailProvider.overrideWith((ref, slug) async => Product.fromJson(asMap(fx['product']))),
    productReviewsProvider.overrideWith((ref, id) async => asList(fx['reviews']).map(Review.fromJson).toList()),
    boughtTogetherProvider.overrideWith((ref, id) async => (
          items: asList(asMap(fx['bought'])['items']).map((e) => Product.fromJson(asMap(e))).toList(),
          fromOrders: asMap(fx['bought'])['source'] == 'orders',
        )),
    similarProductsProvider.overrideWith((ref, a) async =>
        asList(fx['similar']).map((e) => Product.fromJson(asMap(e))).where((p) => p.id != a.excludeId).take(8).toList()),
  ];
}

Future<void> shootLive(WidgetTester tester, String name, Widget screen,
    {double height = 844, List<double> scrolls = const [], List<Override> extra = const [], List<String> taps = const []}) async {
  final key = GlobalKey();
  tester.view.physicalSize = Size((double.tryParse(Platform.environment['W'] ?? '') ?? 390) * 3, height * 3);
  tester.view.devicePixelRatio = 3;
  await tester.pumpWidget(ProviderScope(
    overrides: [
      stringsProvider.overrideWithValue(AppStrings('ar')),
      languageCodeProvider.overrideWithValue('ar'),
      sharedPreferencesProvider.overrideWithValue(appSharedPreferences),
      dioProvider.overrideWithValue(replayDio()),
      apiCacheProvider.overrideWithValue(NoDiskCache(appSharedPreferences)),
      ...extra,
    ],
    child: MaterialApp.router(
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      builder: (c, w) => RepaintBoundary(
          key: key,
          child: MediaQuery(
            // SCALE=1.3: حجم خط مكبّر كإعداد الهاتف.
            data: MediaQuery.of(c).copyWith(textScaler: TextScaler.linear(double.tryParse(Platform.environment['SCALE'] ?? '') ?? 1)),
            child: Directionality(textDirection: TextDirection.rtl, child: w!),
          )),
      routerConfig: GoRouter(
        initialLocation: Platform.environment['Q'] == null ? '/' : '/?q=${Uri.encodeComponent(Platform.environment['Q']!)}',
        routes: [GoRoute(path: '/', builder: (_, __) => screen)],
      ),
    ),
  ));
  // طلبات الشبكة الحقيقية تحتاج وقتاً فعلياً.
  for (var k = 0; k < (int.tryParse(Platform.environment["WAIT"] ?? "") ?? 6); k++) {
    // تناوب قصير: كل خطوة حقيقية (شبكة/قرص/فك صورة) يليها تفريغ للوقت الوهمي.
    for (var q = 0; q < 6; q++) {
      await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 120)));
      await tester.pump(const Duration(milliseconds: 50));
    }
  }
  Future<void> cap(String n) async {
    await tester.runAsync(() async {
      final boundary = key.currentContext!.findRenderObject()! as RenderRepaintBoundary;
      final img = await boundary.toImage(pixelRatio: 2);
      final bytes = await img.toByteData(format: ui.ImageByteFormat.png);
      File('$out/$n.png').writeAsBytesSync(bytes!.buffer.asUint8List());
      // ignore: avoid_print
      print('saved $n');
    });
  }
  await cap(name);
  // لمسات متتالية (نص الزر) مع لقطة بعد كل واحدة؛ «back» يغلق الورقة.
  var j = 0;
  for (final label in taps) {
    if (label == 'back') {
      final nav = tester.state<NavigatorState>(find.byType(Navigator).last);
      nav.pop();
    } else {
      final f = label.startsWith('icon:')
          ? find.byIcon(label == 'icon:bag' ? Icons.shopping_bag_rounded : Icons.grid_view_rounded)
          : find.textContaining(label);
      if (f.evaluate().isEmpty) {
        // ignore: avoid_print
        print('tap target not found: $label');
        continue;
      }
      await tester.tap(f.last, warnIfMissed: false);
    }
    for (var k = 0; k < 4; k++) {
      await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 300)));
      await tester.pump(const Duration(milliseconds: 250));
    }
    await cap('${name}_t${++j}');
  }
  var i = 0;
  for (final y in scrolls) {
    final sc = find.byType(Scrollable);
    if (sc.evaluate().isEmpty) break;
    final s = tester.state<ScrollableState>(sc.first);
    s.position.jumpTo(y.clamp(0, s.position.maxScrollExtent));
    for (var k = 0; k < 3; k++) {
      await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 500)));
      await tester.pump(const Duration(milliseconds: 300));
    }
    await cap('${name}_${++i}');
  }
}

class _NetOk extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) => _FileHttpClient();
}

/// صور حقيقية محمّلة مسبقاً (curl) تُقدَّم من القرص — بلا شبكة داخل الاختبار.
const imgDir = '$sp/imgcache';

class _FileHttpClient implements HttpClient {
  @override
  bool autoUncompress = true;
  @override
  Duration? connectionTimeout;
  @override
  Duration idleTimeout = const Duration(seconds: 15);
  @override
  int? maxConnectionsPerHost;
  @override
  String? userAgent;
  @override
  Future<HttpClientRequest> openUrl(String method, Uri url) async => _FileRequest(method, url);
  @override
  Future<HttpClientRequest> getUrl(Uri url) => openUrl('GET', url);
  @override
  void close({bool force = false}) {}
  @override
  dynamic noSuchMethod(Invocation i) => null;
}

class _FileRequest implements HttpClientRequest {
  @override
  final String method;
  @override
  final Uri uri;
  _FileRequest(this.method, this.uri);
  final _headers = _Headers();
  @override
  HttpHeaders get headers => _headers;
  @override
  bool followRedirects = true;
  @override
  int maxRedirects = 5;
  @override
  int contentLength = -1;
  @override
  bool persistentConnection = true;
  @override
  bool bufferOutput = true;
  @override
  Encoding encoding = utf8;
  @override
  Future addStream(Stream<List<int>> s) => s.drain();
  @override
  void add(List<int> data) {}
  @override
  Future<HttpClientResponse> close() async {
    final url = uri.toString();
    final f = File('$imgDir/${fnv(url)}');
    if (!f.existsSync()) {
      File('$imgDir/missing.txt').writeAsStringSync('$url\n', mode: FileMode.append);
      return _FileResponse(404, const []);
    }
    return _FileResponse(200, f.readAsBytesSync());
  }
  @override
  Future<HttpClientResponse> get done => close();
  @override
  dynamic noSuchMethod(Invocation i) => null;
}

class _Headers implements HttpHeaders {
  final _m = <String, List<String>>{};
  @override
  void set(String name, Object value, {bool preserveHeaderCase = false}) => _m[name.toLowerCase()] = ['$value'];
  @override
  void add(String name, Object value, {bool preserveHeaderCase = false}) => (_m[name.toLowerCase()] ??= []).add('$value');
  @override
  List<String>? operator [](String name) => _m[name.toLowerCase()];
  @override
  String? value(String name) => _m[name.toLowerCase()]?.first;
  @override
  void forEach(void Function(String name, List<String> values) action) => _m.forEach(action);
  @override
  void removeAll(String name) => _m.remove(name.toLowerCase());
  @override
  ContentType? contentType;
  @override
  int contentLength = -1;
  @override
  bool chunkedTransferEncoding = false;
  @override
  bool persistentConnection = true;
  @override
  dynamic noSuchMethod(Invocation i) => null;
}

class _FileResponse extends Stream<List<int>> implements HttpClientResponse {
  @override
  final int statusCode;
  final List<int> bytes;
  _FileResponse(this.statusCode, this.bytes) {
    _headers.set('content-type', 'image/webp');
    _headers.set('cache-control', 'max-age=3600');
  }
  final _headers = _Headers();
  @override
  HttpHeaders get headers => _headers;
  @override
  int get contentLength => bytes.length;
  @override
  String get reasonPhrase => statusCode == 200 ? 'OK' : 'Not Found';
  @override
  bool get isRedirect => false;
  @override
  List<RedirectInfo> get redirects => const [];
  @override
  bool get persistentConnection => true;
  @override
  HttpClientResponseCompressionState get compressionState => HttpClientResponseCompressionState.notCompressed;
  @override
  StreamSubscription<List<int>> listen(void Function(List<int>)? onData, {Function? onError, void Function()? onDone, bool? cancelOnError}) =>
      Stream<List<int>>.fromIterable(bytes.isEmpty ? const [] : [bytes])
          .listen(onData, onError: onError, onDone: onDone, cancelOnError: cancelOnError);
  @override
  dynamic noSuchMethod(Invocation i) => null;
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    HttpOverrides.global = _NetOk();
    SharedPreferences.setMockInitialValues({
      if (Platform.environment['CART'] == '1') 'cart_items_v1': File('$sp/cart_seed.json').readAsStringSync(),
      if (Platform.environment['PKGCART'] == '1') 'cart_items_v1': File('$sp/cart_pkg_items.json').readAsStringSync(),
      if (Platform.environment['PKGCART'] == '1') 'cart_packages_v1': File('$sp/cart_pkg_packs.json').readAsStringSync(),
      if (Platform.environment['SKIN'] == '1') 'skin_profile_v1': '{"skinType":"oily","concerns":["acne"],"takenAt":"2026-10-17T10:00:00.000"}',
    });
    final m = TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
    // AUTH=1: جلسة وهمية (مستخدمة تجريبية) — بياناتها من ملفات الإعادة لا من حساب حقيقي.
    final fakeAuth = Platform.environment['AUTH'] == '1';
    m.setMockMethodCallHandler(const MethodChannel('plugins.it_nomads.com/flutter_secure_storage'), (c) async {
      if (!fakeAuth) return null;
      if (c.method == 'read') return 'test-token';
      if (c.method == 'containsKey') return true;
      return null;
    });
    m.setMockMethodCallHandler(const MethodChannel('plugins.flutter.io/path_provider'), (c) async => Directory.systemTemp.path);
    sql.databaseFactory = sql.databaseFactorySqflitePlugin;
    m.setMockMethodCallHandler(const MethodChannel('com.tekartik.sqflite'), (c) async {
      switch (c.method) {
        case 'getDatabasesPath':
          return Directory.systemTemp.path;
        case 'openDatabase':
          return 1;
        case 'query':
          return <String, Object?>{'columns': <String>[], 'rows': <List<Object?>>[]};
        case 'insert':
          return 1;
        case 'update':
        case 'delete':
          return 0;
        case 'batch':
          return <Object?>[];
        case 'databaseExists':
          return false;
        default:
          return null;
      }
    });
    await loadFonts();
    await initAppStorage();
  });

  final slug = Platform.environment['SLUG'] ?? 'essence-foundation-stick';
  testWidgets('pdp', (t) async {
    HttpOverrides.global = _NetOk();
    await shootLive(t, 'pdp_${Platform.environment['TAG'] ?? 'x'}', ProductDetailScreen(idOrSlug: slug),
        height: double.tryParse(Platform.environment['H'] ?? '') ?? 2400, extra: pdpOverrides(), taps: (Platform.environment['TAPS'] ?? '').split('|').where((e) => e.isNotEmpty).toList());
  });

  testWidgets('homecare', (t) async {
    await shootLive(t, 'homecare', const HomeScreen(), height: 5600, extra: [selectedWorldSlugProvider.overrideWith((ref) => 'care-rituals')]);
  });
  testWidgets('homebeauty', (t) async {
    await shootLive(t, 'homebeauty', const HomeScreen(), height: 9000, extra: [selectedWorldSlugProvider.overrideWith((ref) => 'beauty-spell')]);
  });
  testWidgets('homescent', (t) async {
    await shootLive(t, 'homescent', const HomeScreen(), height: double.tryParse(Platform.environment['H'] ?? '') ?? 11000, extra: [selectedWorldSlugProvider.overrideWith((ref) => 'scent-story')]);
  });
  testWidgets('home', (t) async {
    await shootLive(t, 'home', const HomeScreen(), height: 3200);
  });
  testWidgets('categories', (t) async {
    await shootLive(t, 'cats', const CategoriesScreen(), height: 1800);
  });

  testWidgets('cart', (t) async {
    await shootLive(t, 'cart', const CartScreen(), height: 2000);
  });
  testWidgets('checkout', (t) async {
    await shootLive(t, 'checkout', const CheckoutScreen(), height: 2400);
  });
  testWidgets('account', (t) async {
    await shootLive(t, 'account', const AccountScreen(), height: 2000);
  });

  testWidgets('orders', (t) async {
    await shootLive(t, 'orders', const OrdersScreen(), height: 2000);
  });

  final h = double.tryParse(Platform.environment['H'] ?? '') ?? 2000;
  testWidgets('search', (t) async => shootLive(t, 'search', const SearchScreen(), height: h));
  testWidgets('wishlist', (t) async => shootLive(t, 'wishlist', const WishlistScreen(), height: h));
  testWidgets('skinguide', (t) async => shootLive(t, 'skinguide', const SkinGuideScreen(), height: h));
  testWidgets('concern', (t) async => shootLive(t, 'concern', SkinConcernScreen(slug: Platform.environment['SLUG'] ?? 'acne'), height: h));
  testWidgets('quiz', (t) async => shootLive(t, 'quiz', const SkinQuizScreen(), height: h));
  testWidgets('quizres', (t) async => shootLive(t, 'quizres', const SkinQuizScreen(showResult: true), height: h));
  testWidgets('packages', (t) async => shootLive(t, 'packages', PackagesScreen(initialTab: Platform.environment['TAB']), height: h));
  testWidgets('pkg', (t) async => shootLive(t, 'pkg', PackageDetailScreen(idOrSlug: Platform.environment['SLUG'] ?? 'morning-glow'), height: h));
  testWidgets('editprofile', (t) async => shootLive(t, 'editprofile', const EditProfileScreen(), height: h));
  testWidgets('about', (t) async => shootLive(t, 'about', const AboutAppScreen(), height: h));
  testWidgets('language', (t) async => shootLive(t, 'language', const LanguagePickerScreen(), height: h));
  testWidgets('brands', (t) async => shootLive(t, 'brands', BrandsScreen(initialQuery: Platform.environment['Q']), height: h));
  testWidgets('brandcat', (t) async => shootLive(t, 'brandcat', BrandScreen(Platform.environment['SLUG'] ?? 'astra', categoryId: Platform.environment['CAT'], subcategoryId: Platform.environment['SUB']), height: h));
  testWidgets('listsub', (t) async => shootLive(t, 'listsub', ProductListingScreen(title: 'x', categoryId: Platform.environment['CAT'], subcategoryId: Platform.environment['SUB'], tertiaryCategoryId: Platform.environment['TER']), height: h));
  testWidgets('offers', (t) async => shootLive(t, 'offers', const OffersScreen(), height: h));
  testWidgets('orderdetail', (t) async => shootLive(t, 'orderdetail', const OrderDetailScreen(orderId: 'o2'), height: h));

  testWidgets('success', (t) async => shootLive(t, 'success', const OrderSuccessScreen(orderId: 'o2'), height: h));
  testWidgets('login', (t) async => shootLive(t, 'login', const LoginScreen(), height: h));
  testWidgets('register', (t) async => shootLive(t, 'register', const RegisterScreen(), height: h));
  testWidgets('loyalty', (t) async => shootLive(t, 'loyalty', const LoyaltyScreen(), height: h));
  testWidgets('notifications', (t) async => shootLive(t, 'notifications', const NotificationsScreen(), height: h));
  testWidgets('addresses', (t) async => shootLive(t, 'addresses', const AddressesScreen(), height: h));
  testWidgets('emptycart', (t) async => shootLive(t, 'emptycart', const CartScreen(), height: h));
}
