import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alhayaa/core/bootstrap/app_storage.dart';
import 'package:alhayaa/core/navigation/deep_link_redirect.dart';
import 'package:alhayaa/core/router/app_router.dart';

/// كل رابط من الموقع (App Links / Universal Links) يصل إلى مسار حقيقي في الموجّه
/// أو إلى تبويب يفتحه الـ redirect — لا «الصفحة غير موجودة».
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});
  test('every deep link target has a route or a tab redirect', () async {
    appSharedPreferences = await SharedPreferences.getInstance();
    final c = ProviderContainer();
    addTearDown(c.dispose);
    final GoRouter r = c.read(routerProvider);
    const tabs = {'/cart', '/offers', '/brands', '/account', '/categories', '/categories-tab'};
    const links = [
      '/product/x', '/product?slug=x', '/package/p', '/category/c', '/brand/b', '/brands?q=ni',
      '/skin-guide', '/skin-guide/acne', '/skin-quiz', '/packages', '/account/orders', '/account/orders/9',
      '/account/points', '/account/addresses', '/account/notifications', '/account/profile',
      '/account/alerts', '/account/beauty', '/signin', '/signup', '/help', '/gifts', '/en/privacy',
      '/en/terms', '/about', '/products?ids=a,b&world=perfume&title=x', '/search?q=a', '/advisor?q=x',
      '/?world=makeup', '/wishlist', '/orders', '/loyalty', '/notifications', '/cart', '/offers', '/compare',
    ];
    for (final l in links) {
      final mapped = resolveDeepLink(Uri.parse('https://deemaalhayat.com$l'));
      expect(mapped, isNotNull, reason: l);
      final u = Uri.parse(mapped!);
      if (tabs.contains(u.path)) continue;
      final m = r.configuration.findMatch(u);
      expect(m.isError, isFalse, reason: '$l -> $mapped');
      expect(m.matches, isNotEmpty, reason: '$l -> $mapped');
    }
    for (final p in ['/alerts', '/help', '/login', '/register', '/licenses', '/language-settings', '/checkout', '/order-success/1', '/edit-profile', '/change-password', '/scan', '/world/x']) {
      expect(r.configuration.findMatch(Uri.parse(p)).matches, isNotEmpty, reason: p);
    }
    expect(r.configuration.findMatch(Uri.parse('/brands')).matches, isEmpty);
  });
}
